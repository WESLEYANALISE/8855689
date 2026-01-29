import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Slide {
  titulo?: string;
  subtitulo?: string;
  resumo_curto?: string;
  imagem_url?: string;
  url_audio?: string;
  texto_narrado?: string;
}

// Enviar mensagem de texto via Evolution API
async function enviarTexto(telefone: string, mensagem: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    console.error('[enviar-boletim] Evolution API não configurada');
    return false;
  }

  let numero = telefone.replace(/\D/g, '');
  if (!numero.endsWith('@s.whatsapp.net')) {
    numero = `${numero}@s.whatsapp.net`;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        text: mensagem,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[enviar-boletim] Erro texto para ${telefone}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[enviar-boletim] Erro texto para ${telefone}:`, error);
    return false;
  }
}

// Enviar imagem via Evolution API
async function enviarImagem(telefone: string, imageUrl: string, caption: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) return false;

  let numero = telefone.replace(/\D/g, '');
  if (!numero.endsWith('@s.whatsapp.net')) {
    numero = `${numero}@s.whatsapp.net`;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        mediatype: 'image',
        media: imageUrl,
        caption: caption,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[enviar-boletim] Erro imagem para ${telefone}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[enviar-boletim] Erro imagem para ${telefone}:`, error);
    return false;
  }
}

// Enviar áudio via Evolution API
async function enviarAudio(telefone: string, audioUrl: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) return false;

  let numero = telefone.replace(/\D/g, '');
  if (!numero.endsWith('@s.whatsapp.net')) {
    numero = `${numero}@s.whatsapp.net`;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        audio: audioUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[enviar-boletim] Erro áudio para ${telefone}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[enviar-boletim] Erro áudio para ${telefone}:`, error);
    return false;
  }
}

// Enviar vídeo via Evolution API
async function enviarVideo(telefone: string, videoUrl: string, caption: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) return false;

  let numero = telefone.replace(/\D/g, '');
  if (!numero.endsWith('@s.whatsapp.net')) {
    numero = `${numero}@s.whatsapp.net`;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        mediatype: 'video',
        media: videoUrl,
        caption: caption,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[enviar-boletim] Erro vídeo para ${telefone}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[enviar-boletim] Erro vídeo para ${telefone}:`, error);
    return false;
  }
}

// Formatar data em português
function formatarData(dataStr: string): string {
  const data = new Date(dataStr);
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

// Formatar tipo para exibição
function formatarTipo(tipo: string): string {
  const tipos: Record<string, string> = {
    juridica: 'Jurídico',
    politica: 'Política',
    concurso: 'Concursos',
    direito: 'Jurídico',
  };
  return tipos[tipo] || tipo;
}

// Mapear tipo do boletim para area do vídeo
function tipoParaArea(tipo: string): string {
  const mapa: Record<string, string> = {
    juridica: 'direito',
    politica: 'politica',
    concurso: 'concurso',
  };
  return mapa[tipo] || tipo;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { boletim_id, tipo_envio, telefones } = await req.json();

    if (!boletim_id) {
      return new Response(
        JSON.stringify({ error: 'boletim_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'evelyn';

    console.log(`[enviar-boletim] Buscando boletim ${boletim_id}`);

    // Buscar boletim
    const { data: boletim, error: boletimError } = await supabase
      .from('resumos_diarios')
      .select('*')
      .eq('id', boletim_id)
      .single();

    if (boletimError || !boletim) {
      throw new Error(`Boletim não encontrado: ${boletimError?.message}`);
    }

    console.log(`[enviar-boletim] Boletim encontrado: ${boletim.tipo} - ${boletim.data}`);

    // Buscar vídeo correspondente se tipo_envio for 'video'
    let videoUrl: string | null = null;
    if (tipo_envio === 'video') {
      const areaVideo = tipoParaArea(boletim.tipo);
      const { data: video, error: videoError } = await supabase
        .from('videos_resumo_dia')
        .select('url_video')
        .eq('area', areaVideo)
        .eq('data', boletim.data)
        .eq('status', 'gerado')
        .single();
      
      if (videoError || !video?.url_video) {
        console.log(`[enviar-boletim] Vídeo não encontrado para ${areaVideo} - ${boletim.data}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Vídeo não encontrado para este boletim' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      videoUrl = video.url_video;
      console.log(`[enviar-boletim] Vídeo encontrado: ${videoUrl}`);
    }

    // Buscar usuários autorizados
    let query = supabase
      .from('evelyn_usuarios')
      .select('telefone, nome')
      .eq('autorizado', true);

    if (telefones && Array.isArray(telefones) && telefones.length > 0) {
      query = query.in('telefone', telefones);
    }

    const { data: usuarios, error: usuariosError } = await query;

    if (usuariosError) {
      throw new Error(`Erro ao buscar usuários: ${usuariosError.message}`);
    }

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ success: true, enviados: 0, message: 'Nenhum usuário encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[enviar-boletim] Enviando para ${usuarios.length} usuários - tipo: ${tipo_envio}`);

    const slides: Slide[] = Array.isArray(boletim.slides) ? boletim.slides : [];
    let enviados = 0;
    let erros = 0;

    for (const usuario of usuarios) {
      try {
        let sucesso = false;

        if (tipo_envio === 'texto') {
          // Montar mensagem de texto
          let mensagem = `📰 *Boletim ${formatarTipo(boletim.tipo)} - ${formatarData(boletim.data)}*\n\n`;
          mensagem += `Olá${usuario.nome ? `, ${usuario.nome.split(' ')[0]}` : ''}! Confira as principais notícias:\n\n`;

          slides.slice(0, 5).forEach((slide, index) => {
            mensagem += `*${index + 1}. ${slide.titulo || 'Notícia'}*\n`;
            if (slide.resumo_curto) {
              mensagem += `${slide.resumo_curto.substring(0, 200)}${slide.resumo_curto.length > 200 ? '...' : ''}\n`;
            }
            mensagem += '\n';
          });

          mensagem += `💡 _Responda com o número para mais detalhes!_\n`;
          mensagem += `\n_Evelyn - Sua assistente jurídica_ 🤖`;

          sucesso = await enviarTexto(usuario.telefone, mensagem, instanceName);

        } else if (tipo_envio === 'imagens') {
          // Enviar introdução
          const intro = `📰 *Boletim ${formatarTipo(boletim.tipo)}*\n${formatarData(boletim.data)}\n\n_Confira os ${slides.length} slides a seguir:_`;
          await enviarTexto(usuario.telefone, intro, instanceName);
          await new Promise(r => setTimeout(r, 1500));

          // Enviar cada slide com imagem
          for (let i = 0; i < Math.min(slides.length, 5); i++) {
            const slide = slides[i];
            if (slide.imagem_url) {
              const caption = `*${i + 1}/${slides.length} - ${slide.titulo || ''}*\n${slide.resumo_curto || ''}`;
              await enviarImagem(usuario.telefone, slide.imagem_url, caption, instanceName);
              await new Promise(r => setTimeout(r, 2000));
            }
          }
          sucesso = true;

        } else if (tipo_envio === 'audio') {
          // Enviar áudio de abertura
          if (boletim.url_audio_abertura) {
            const intro = `🎙️ *Boletim ${formatarTipo(boletim.tipo)}*\n${formatarData(boletim.data)}\n\n_Ouça o resumo narrado:_`;
            await enviarTexto(usuario.telefone, intro, instanceName);
            await new Promise(r => setTimeout(r, 1000));
            sucesso = await enviarAudio(usuario.telefone, boletim.url_audio_abertura, instanceName);
          } else {
            console.log(`[enviar-boletim] Boletim sem áudio de abertura`);
          }
        } else if (tipo_envio === 'video') {
          // Enviar vídeo do resumo
          if (videoUrl) {
            const caption = `📹 *Resumo do Dia - ${formatarTipo(boletim.tipo)}*\n${formatarData(boletim.data)}\n\n_Confira o resumo em vídeo!_\n\n_Evelyn - Sua assistente jurídica_ 🤖`;
            sucesso = await enviarVideo(usuario.telefone, videoUrl, caption, instanceName);
          }
        }

        if (sucesso) {
          enviados++;
          console.log(`[enviar-boletim] ✅ Enviado para ${usuario.telefone}`);
        } else {
          erros++;
        }

        // Delay entre usuários para não sobrecarregar
        await new Promise(r => setTimeout(r, 1000));

      } catch (error) {
        console.error(`[enviar-boletim] Erro para ${usuario.telefone}:`, error);
        erros++;
      }
    }

    console.log(`[enviar-boletim] Concluído: ${enviados} enviados, ${erros} erros`);

    // Registrar log
    await supabase.from('notificacoes_sistema').insert({
      titulo: `Boletim ${formatarTipo(boletim.tipo)} Disparado`,
      conteudo: `Enviados: ${enviados}, Erros: ${erros}`,
      tipo: 'boletim_whatsapp',
      dados: {
        boletim_id,
        tipo_envio,
        data_resumo: boletim.data,
        enviados,
        erros,
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        enviados,
        erros,
        total_usuarios: usuarios.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[enviar-boletim] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
