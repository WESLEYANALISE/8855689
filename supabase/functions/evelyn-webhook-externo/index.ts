import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de eventos suportados
const EVENTOS_SUPORTADOS = [
  'nova_lei',
  'atualizacao_artigo', 
  'novo_concurso',
  'lembrete_estudo',
  'notificacao_geral',
  'nova_noticia'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const evento = url.searchParams.get('event') || url.searchParams.get('evento');
    
    if (!evento) {
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetro "event" é obrigatório',
          eventos_suportados: EVENTOS_SUPORTADOS 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!EVENTOS_SUPORTADOS.includes(evento)) {
      return new Response(
        JSON.stringify({ 
          error: `Evento "${evento}" não suportado`,
          eventos_suportados: EVENTOS_SUPORTADOS 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = req.method === 'POST' ? await req.json() : {};
    
    console.log(`[evelyn-webhook-externo] Evento recebido: ${evento}`, payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Registrar evento no banco
    const { data: eventoSalvo, error: insertError } = await supabase
      .from('evelyn_eventos_externos')
      .insert({
        tipo_evento: evento,
        payload: payload,
        processado: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('[evelyn-webhook-externo] Erro ao salvar evento:', insertError);
      throw insertError;
    }

    console.log(`[evelyn-webhook-externo] Evento salvo: ${eventoSalvo.id}`);

    // Processar evento imediatamente
    let resultado: any = { processado: false };

    switch (evento) {
      case 'nova_lei':
        resultado = await processarNovaLei(payload, supabase);
        break;
      case 'atualizacao_artigo':
        resultado = await processarAtualizacaoArtigo(payload, supabase);
        break;
      case 'novo_concurso':
        resultado = await processarNovoConcurso(payload, supabase);
        break;
      case 'lembrete_estudo':
        resultado = await processarLembreteEstudo(payload, supabase);
        break;
      case 'notificacao_geral':
        resultado = await processarNotificacaoGeral(payload, supabase);
        break;
      case 'nova_noticia':
        resultado = await processarNovaNoticia(payload, supabase);
        break;
    }

    // Atualizar status do evento
    await supabase
      .from('evelyn_eventos_externos')
      .update({
        processado: true,
        resultado: resultado,
        processado_at: new Date().toISOString()
      })
      .eq('id', eventoSalvo.id);

    return new Response(
      JSON.stringify({
        success: true,
        evento_id: eventoSalvo.id,
        tipo_evento: evento,
        resultado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-webhook-externo] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Processadores de eventos
async function processarNovaLei(payload: any, supabase: any) {
  const { titulo, numero, ementa, link, areas } = payload;
  
  if (!titulo || !numero) {
    return { processado: false, erro: 'Título e número são obrigatórios' };
  }

  // Buscar usuários interessados em atualizações de leis
  const { data: usuarios } = await supabase
    .from('evelyn_usuarios')
    .select('telefone, nome')
    .eq('ativo', true)
    .limit(100);

  const mensagem = `⚖️ *NOVA LEI PUBLICADA*\n\n` +
    `📜 *${titulo}*\n` +
    `Nº ${numero}\n\n` +
    `${ementa ? `📝 ${ementa.substring(0, 200)}...\n\n` : ''}` +
    `${link ? `🔗 Leia na íntegra: ${link}\n\n` : ''}` +
    `_Enviado pela Evelyn - Sua assistente jurídica_ 💜`;

  // Aqui você pode chamar a função de envio em massa
  console.log(`[evelyn-webhook-externo] Nova lei: ${numero} - Notificaria ${usuarios?.length || 0} usuários`);

  return {
    processado: true,
    lei: { titulo, numero },
    usuarios_notificados: usuarios?.length || 0,
    mensagem
  };
}

async function processarAtualizacaoArtigo(payload: any, supabase: any) {
  const { artigo, codigo, alteracao, data } = payload;
  
  if (!artigo || !codigo) {
    return { processado: false, erro: 'Artigo e código são obrigatórios' };
  }

  // Buscar usuários que consultaram esse artigo recentemente
  const { data: memorias } = await supabase
    .from('evelyn_memoria_usuario')
    .select('usuario_id')
    .eq('tipo', 'historico_estudo')
    .ilike('valor', `%${codigo}%`)
    .limit(50);

  const usuariosUnicos = [...new Set(memorias?.map((m: any) => m.usuario_id) || [])];

  console.log(`[evelyn-webhook-externo] Atualização artigo ${artigo} ${codigo} - ${usuariosUnicos.length} usuários interessados`);

  return {
    processado: true,
    artigo,
    codigo,
    usuarios_interessados: usuariosUnicos.length
  };
}

async function processarNovoConcurso(payload: any, supabase: any) {
  const { nome, orgao, vagas, salario, inscricoes_ate } = payload;
  
  console.log(`[evelyn-webhook-externo] Novo concurso: ${nome || orgao}`);

  return {
    processado: true,
    concurso: { nome, orgao, vagas, salario, inscricoes_ate }
  };
}

async function processarLembreteEstudo(payload: any, supabase: any) {
  const { usuario_id, telefone, tema, mensagem } = payload;
  
  console.log(`[evelyn-webhook-externo] Lembrete de estudo para: ${telefone || usuario_id}`);

  return {
    processado: true,
    usuario: telefone || usuario_id,
    tema
  };
}

async function processarNotificacaoGeral(payload: any, supabase: any) {
  const { titulo, mensagem, filtro_usuarios } = payload;
  
  // Buscar todos usuários ativos
  const { data: usuarios } = await supabase
    .from('evelyn_usuarios')
    .select('telefone, nome')
    .eq('ativo', true)
    .limit(500);

  console.log(`[evelyn-webhook-externo] Notificação geral: ${titulo} - ${usuarios?.length || 0} usuários`);

  return {
    processado: true,
    titulo,
    usuarios_alvo: usuarios?.length || 0
  };
}

async function processarNovaNoticia(payload: any, supabase: any) {
  const { titulo, resumo, link, categoria } = payload;
  
  console.log(`[evelyn-webhook-externo] Nova notícia: ${titulo}`);

  return {
    processado: true,
    noticia: { titulo, categoria, link }
  };
}
