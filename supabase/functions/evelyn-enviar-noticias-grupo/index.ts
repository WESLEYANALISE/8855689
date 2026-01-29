import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoticiaJuridica {
  id: string;
  titulo: string;
  resumo?: string;
  fonte?: string;
  link?: string;
  data_publicacao?: string;
}

interface NoticiaConcurso {
  id: string;
  titulo: string;
  resumo?: string;
  fonte?: string;
  link?: string;
  data_publicacao?: string;
}

interface GrupoConfig {
  id: string;
  grupo_id: string;
  nome_grupo: string;
  tipos_noticias: string[];
  quantidade_noticias: number;
  instance_name: string;
}

function formatarMensagemNoticias(noticias: (NoticiaJuridica | NoticiaConcurso)[], tipo: string): string {
  const emoji = tipo === 'juridicas' ? '⚖️' : '📋';
  const titulo = tipo === 'juridicas' ? 'NOTÍCIAS JURÍDICAS' : 'NOTÍCIAS DE CONCURSOS';
  
  let mensagem = `${emoji} *${titulo}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  
  noticias.forEach((noticia, index) => {
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || `${index + 1}.`;
    mensagem += `${numEmoji} *${noticia.titulo}*\n`;
    
    if (noticia.resumo) {
      // Limitar resumo a 150 caracteres
      const resumoCurto = noticia.resumo.length > 150 
        ? noticia.resumo.substring(0, 147) + '...' 
        : noticia.resumo;
      mensagem += `📝 ${resumoCurto}\n`;
    }
    
    if (noticia.fonte) {
      mensagem += `📌 Fonte: ${noticia.fonte}\n`;
    }
    
    if (noticia.link) {
      mensagem += `🔗 ${noticia.link}\n`;
    }
    
    mensagem += '\n';
  });
  
  mensagem += `━━━━━━━━━━━━━━━━━━━\n🤖 _Enviado por Evelyn às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}_`;
  
  return mensagem;
}

async function enviarMensagemWhatsApp(
  evolutionUrl: string, 
  evolutionKey: string, 
  instanceName: string, 
  grupoId: string, 
  mensagem: string
): Promise<boolean> {
  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: grupoId,
        text: mensagem,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Erro ao enviar mensagem:', result);
      return false;
    }
    
    console.log('Mensagem enviada com sucesso:', result.key?.id);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar grupos ativos
    const { data: grupos, error: gruposError } = await supabase
      .from('evelyn_grupos_noticias')
      .select('*')
      .eq('ativo', true);
    
    if (gruposError) {
      throw new Error(`Erro ao buscar grupos: ${gruposError.message}`);
    }
    
    if (!grupos || grupos.length === 0) {
      console.log('Nenhum grupo ativo encontrado');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum grupo ativo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processando ${grupos.length} grupo(s)`);
    
    const resultados: { grupo: string; enviadas: number; erros: number }[] = [];
    
    for (const grupo of grupos as GrupoConfig[]) {
      let enviadas = 0;
      let erros = 0;
      
      // Processar notícias jurídicas
      if (grupo.tipos_noticias.includes('juridicas')) {
        // Buscar IDs de notícias já enviadas para este grupo
        const { data: jaEnviadas } = await supabase
          .from('evelyn_noticias_enviadas')
          .select('noticia_id')
          .eq('grupo_id', grupo.grupo_id)
          .eq('tipo', 'juridica');
        
        const idsEnviados = jaEnviadas?.map(n => n.noticia_id) || [];
        
        // Buscar notícias jurídicas não enviadas
        let query = supabase
          .from('noticias_juridicas_cache')
          .select('id, titulo, resumo, fonte, link, data_publicacao')
          .order('data_publicacao', { ascending: false })
          .limit(grupo.quantidade_noticias);
        
        if (idsEnviados.length > 0) {
          query = query.not('id', 'in', `(${idsEnviados.join(',')})`);
        }
        
        const { data: noticiasJuridicas, error: noticiasError } = await query;
        
        if (noticiasError) {
          console.error('Erro ao buscar notícias jurídicas:', noticiasError);
        } else if (noticiasJuridicas && noticiasJuridicas.length > 0) {
          const mensagem = formatarMensagemNoticias(noticiasJuridicas, 'juridicas');
          const sucesso = await enviarMensagemWhatsApp(
            evolutionUrl, 
            evolutionKey, 
            grupo.instance_name, 
            grupo.grupo_id, 
            mensagem
          );
          
          if (sucesso) {
            // Registrar notícias enviadas
            const registros = noticiasJuridicas.map(n => ({
              noticia_id: n.id,
              grupo_id: grupo.grupo_id,
              tipo: 'juridica',
              titulo: n.titulo
            }));
            
            await supabase.from('evelyn_noticias_enviadas').insert(registros);
            enviadas += noticiasJuridicas.length;
            console.log(`Enviadas ${noticiasJuridicas.length} notícias jurídicas para ${grupo.nome_grupo}`);
          } else {
            erros++;
          }
        }
      }
      
      // Aguardar um pouco entre mensagens para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Processar notícias de concursos
      if (grupo.tipos_noticias.includes('concursos')) {
        // Buscar IDs de notícias já enviadas para este grupo
        const { data: jaEnviadas } = await supabase
          .from('evelyn_noticias_enviadas')
          .select('noticia_id')
          .eq('grupo_id', grupo.grupo_id)
          .eq('tipo', 'concurso');
        
        const idsEnviados = jaEnviadas?.map(n => n.noticia_id) || [];
        
        // Buscar notícias de concursos não enviadas
        let query = supabase
          .from('noticias_concursos_cache')
          .select('id, titulo, resumo, fonte, link, data_publicacao')
          .order('data_publicacao', { ascending: false })
          .limit(grupo.quantidade_noticias);
        
        if (idsEnviados.length > 0) {
          query = query.not('id', 'in', `(${idsEnviados.join(',')})`);
        }
        
        const { data: noticiasConcursos, error: concursosError } = await query;
        
        if (concursosError) {
          console.error('Erro ao buscar notícias de concursos:', concursosError);
        } else if (noticiasConcursos && noticiasConcursos.length > 0) {
          const mensagem = formatarMensagemNoticias(noticiasConcursos, 'concursos');
          const sucesso = await enviarMensagemWhatsApp(
            evolutionUrl, 
            evolutionKey, 
            grupo.instance_name, 
            grupo.grupo_id, 
            mensagem
          );
          
          if (sucesso) {
            // Registrar notícias enviadas
            const registros = noticiasConcursos.map(n => ({
              noticia_id: n.id,
              grupo_id: grupo.grupo_id,
              tipo: 'concurso',
              titulo: n.titulo
            }));
            
            await supabase.from('evelyn_noticias_enviadas').insert(registros);
            enviadas += noticiasConcursos.length;
            console.log(`Enviadas ${noticiasConcursos.length} notícias de concursos para ${grupo.nome_grupo}`);
          } else {
            erros++;
          }
        }
      }
      
      resultados.push({ grupo: grupo.nome_grupo, enviadas, erros });
    }
    
    console.log('Processamento concluído:', resultados);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        resultados,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
