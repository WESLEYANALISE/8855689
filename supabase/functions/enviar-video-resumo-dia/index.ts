import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area: areaParam, data: dataParam } = await req.json().catch(() => ({}));
    
    const dataHoje = dataParam || new Date().toISOString().split('T')[0];
    const areas = areaParam ? [areaParam] : ['direito', 'politica', 'concurso'];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    
    if (!evolutionUrl || !evolutionKey || !instanceName) {
      throw new Error('Evolution API não configurada');
    }
    
    // Buscar vídeos do dia
    const { data: videos, error: videosError } = await supabase
      .from('videos_resumo_dia')
      .select('*')
      .eq('data', dataHoje)
      .eq('status', 'gerado')
      .in('area', areas);
    
    if (videosError || !videos || videos.length === 0) {
      console.log('Nenhum vídeo encontrado para enviar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum vídeo para enviar',
          enviados: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar usuários que querem receber vídeo
    const { data: usuarios, error: usuariosError } = await supabase
      .from('evelyn_preferencias_notificacao')
      .select('telefone, areas_video')
      .eq('receber_video_resumo', true)
      .eq('ativo', true);
    
    if (usuariosError || !usuarios || usuarios.length === 0) {
      console.log('Nenhum usuário configurado para receber vídeos');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum usuário para enviar',
          enviados: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let enviados = 0;
    let erros = 0;
    
    // Para cada usuário, enviar vídeos das áreas que ele selecionou
    for (const usuario of usuarios) {
      const areasUsuario = usuario.areas_video || ['direito'];
      
      for (const video of videos) {
        // Verificar se usuário quer esta área
        if (!areasUsuario.includes(video.area)) {
          continue;
        }
        
        try {
          // Formatar número para WhatsApp
          let numero = usuario.telefone.replace(/\D/g, '');
          if (!numero.endsWith('@s.whatsapp.net')) {
            numero = `${numero}@s.whatsapp.net`;
          }
          
          // Formatar nome da área
          const areaMap: Record<string, string> = {
            'direito': 'Direito',
            'politica': 'Política',
            'concurso': 'Concursos'
          };
          const nomeArea = areaMap[video.area as string] || video.area;
          
          // Formatar data
          const dataFormatada = new Date(video.data + 'T12:00:00').toLocaleDateString('pt-BR');
          
          // Enviar via Evolution API
          const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              number: numero,
              mediatype: 'image', // Por enquanto enviamos imagem, depois será vídeo
              media: video.url_video,
              caption: `📰 *Resumo do Dia - ${nomeArea}*\n📅 ${dataFormatada}\n\n✅ Principais notícias resumidas para você!`,
            }),
          });
          
          if (response.ok) {
            enviados++;
            console.log(`Vídeo ${video.area} enviado para ${usuario.telefone}`);
          } else {
            const errorText = await response.text();
            console.error(`Erro ao enviar para ${usuario.telefone}:`, errorText);
            erros++;
          }
          
          // Delay entre envios para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Erro ao enviar vídeo para ${usuario.telefone}:`, error);
          erros++;
        }
      }
    }
    
    console.log(`Envio concluído: ${enviados} enviados, ${erros} erros`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Envio concluído`,
        enviados,
        erros,
        total_usuarios: usuarios.length,
        total_videos: videos.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao enviar vídeos:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
