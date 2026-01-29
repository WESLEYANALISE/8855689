import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreferenciaNotificacao {
  id: string;
  telefone: string;
  receber_resumo_dia: boolean;
  receber_noticias_concursos: boolean;
  receber_novas_leis: boolean;
  receber_atualizacoes_leis: boolean;
  horario_envio: string;
  ativo: boolean;
}

// Enviar mensagem via Evolution API
async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'evelyn';

  if (!evolutionUrl || !evolutionKey) {
    console.error('[evelyn-notificacoes] Evolution API não configurada');
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
      console.error(`[evelyn-notificacoes] Erro ao enviar para ${telefone}:`, error);
      return false;
    }

    console.log(`[evelyn-notificacoes] ✅ Enviado para ${telefone}`);
    return true;
  } catch (error) {
    console.error(`[evelyn-notificacoes] Erro ao enviar para ${telefone}:`, error);
    return false;
  }
}

// Buscar resumo do dia (notícias jurídicas)
async function buscarResumoDia(supabase: any): Promise<string | null> {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: noticias, error } = await supabase
    .from('noticias_juridicas')
    .select('titulo, descricao, fonte')
    .gte('data_publicacao', hoje)
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (error || !noticias || noticias.length === 0) {
    console.log('[evelyn-notificacoes] Nenhuma notícia encontrada para hoje');
    return null;
  }

  let mensagem = `📰 *Resumo do Dia - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
  mensagem += `Olá! Aqui está seu resumo diário das principais notícias jurídicas:\n\n`;

  noticias.forEach((noticia: any, index: number) => {
    mensagem += `*${index + 1}. ${noticia.titulo}*\n`;
    if (noticia.descricao) {
      const descricao = noticia.descricao.substring(0, 150);
      mensagem += `${descricao}${noticia.descricao.length > 150 ? '...' : ''}\n`;
    }
    if (noticia.fonte) {
      mensagem += `📌 _${noticia.fonte}_\n`;
    }
    mensagem += '\n';
  });

  mensagem += `\n💡 _Para mais detalhes, me pergunte sobre qualquer tema!_\n`;
  mensagem += `\n_Evelyn - Sua assistente jurídica_ 🤖`;

  return mensagem;
}

// Buscar notícias de concursos
async function buscarNoticiasConcursos(supabase: any): Promise<string | null> {
  const hoje = new Date();
  const tresDiasAtras = new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const { data: concursos, error } = await supabase
    .from('concursos')
    .select('titulo, orgao, banca, inscricoes_ate, salario, vagas')
    .eq('status', 'aberto')
    .gte('inscricoes_ate', hoje.toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !concursos || concursos.length === 0) {
    console.log('[evelyn-notificacoes] Nenhum concurso encontrado');
    return null;
  }

  let mensagem = `🎯 *Concursos em Destaque*\n\n`;
  mensagem += `Confira os concursos com inscrições abertas:\n\n`;

  concursos.forEach((concurso: any, index: number) => {
    mensagem += `*${index + 1}. ${concurso.titulo || concurso.orgao}*\n`;
    if (concurso.orgao) mensagem += `🏛️ ${concurso.orgao}\n`;
    if (concurso.banca) mensagem += `📝 Banca: ${concurso.banca}\n`;
    if (concurso.vagas) mensagem += `👥 Vagas: ${concurso.vagas}\n`;
    if (concurso.salario) mensagem += `💰 Salário: ${concurso.salario}\n`;
    if (concurso.inscricoes_ate) {
      const dataFim = new Date(concurso.inscricoes_ate).toLocaleDateString('pt-BR');
      mensagem += `📅 Inscrições até: ${dataFim}\n`;
    }
    mensagem += '\n';
  });

  mensagem += `\n💡 _Digite "concursos" para ver mais opções!_\n`;
  mensagem += `\n_Evelyn - Sua assistente jurídica_ 🤖`;

  return mensagem;
}

// Buscar novas leis publicadas
async function buscarNovasLeis(supabase: any): Promise<string | null> {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  
  const { data: leis, error } = await supabase
    .from('resenha_diaria')
    .select('numero_lei, ementa, explicacao_lei, area')
    .eq('status', 'ativo')
    .gte('data_publicacao', ontem.toISOString().split('T')[0])
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (error || !leis || leis.length === 0) {
    console.log('[evelyn-notificacoes] Nenhuma lei nova encontrada');
    return null;
  }

  let mensagem = `⚖️ *Novas Leis Publicadas*\n\n`;
  mensagem += `Confira as leis publicadas recentemente:\n\n`;

  leis.forEach((lei: any, index: number) => {
    mensagem += `*${index + 1}. ${lei.numero_lei}*\n`;
    if (lei.area) mensagem += `📂 ${lei.area}\n`;
    if (lei.ementa) {
      const ementa = lei.ementa.substring(0, 200);
      mensagem += `${ementa}${lei.ementa.length > 200 ? '...' : ''}\n`;
    }
    if (lei.explicacao_lei) {
      const explicacao = lei.explicacao_lei.substring(0, 150);
      mensagem += `\n💡 _${explicacao}${lei.explicacao_lei.length > 150 ? '...' : ''}_\n`;
    }
    mensagem += '\n';
  });

  mensagem += `\n📚 _Para detalhes, pergunte sobre qualquer lei!_\n`;
  mensagem += `\n_Evelyn - Sua assistente jurídica_ 🤖`;

  return mensagem;
}

// Buscar atualizações de leis existentes
async function buscarAtualizacoesLeis(supabase: any): Promise<string | null> {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  
  const { data: alteracoes, error } = await supabase
    .from('alteracoes_legislativas')
    .select('lei_alterada, lei_alteradora, resumo, tipo_alteracao')
    .gte('created_at', ontem.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !alteracoes || alteracoes.length === 0) {
    console.log('[evelyn-notificacoes] Nenhuma alteração de lei encontrada');
    return null;
  }

  let mensagem = `🔄 *Atualizações em Leis*\n\n`;
  mensagem += `Confira as alterações legislativas recentes:\n\n`;

  alteracoes.forEach((alt: any, index: number) => {
    mensagem += `*${index + 1}. ${alt.lei_alterada}*\n`;
    if (alt.tipo_alteracao) mensagem += `📌 Tipo: ${alt.tipo_alteracao}\n`;
    if (alt.lei_alteradora) mensagem += `📜 Alterada por: ${alt.lei_alteradora}\n`;
    if (alt.resumo) {
      const resumo = alt.resumo.substring(0, 150);
      mensagem += `${resumo}${alt.resumo.length > 150 ? '...' : ''}\n`;
    }
    mensagem += '\n';
  });

  mensagem += `\n💡 _Pergunte sobre qualquer lei para ver o texto atualizado!_\n`;
  mensagem += `\n_Evelyn - Sua assistente jurídica_ 🤖`;

  return mensagem;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parâmetros opcionais
    const body = await req.json().catch(() => ({}));
    const horarioFiltro = body.horario || null; // '18:00' ou '22:00'
    const tipoFiltro = body.tipo || null; // 'resumo_dia', 'concursos', 'novas_leis', 'atualizacoes_leis'
    const telefoneFiltro = body.telefone || null; // Para envio manual/teste

    console.log(`[evelyn-notificacoes] Iniciando envio - horário: ${horarioFiltro}, tipo: ${tipoFiltro}, telefone: ${telefoneFiltro}`);

    // Buscar preferências ativas
    let query = supabase
      .from('evelyn_preferencias_notificacao')
      .select('*')
      .eq('ativo', true);

    if (horarioFiltro) {
      query = query.eq('horario_envio', horarioFiltro);
    }

    if (telefoneFiltro) {
      query = query.eq('telefone', telefoneFiltro);
    }

    const { data: preferencias, error: prefError } = await query;

    if (prefError) {
      throw new Error(`Erro ao buscar preferências: ${prefError.message}`);
    }

    if (!preferencias || preferencias.length === 0) {
      console.log('[evelyn-notificacoes] Nenhuma preferência encontrada');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma preferência encontrada', enviados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[evelyn-notificacoes] Encontradas ${preferencias.length} preferências`);

    // Preparar conteúdos (buscar uma vez só)
    const conteudos: Record<string, string | null> = {
      resumo_dia: null,
      concursos: null,
      novas_leis: null,
      atualizacoes_leis: null,
    };

    // Buscar apenas os tipos necessários
    const tiposNecessarios = new Set<string>();
    preferencias.forEach((pref: PreferenciaNotificacao) => {
      if (pref.receber_resumo_dia) tiposNecessarios.add('resumo_dia');
      if (pref.receber_noticias_concursos) tiposNecessarios.add('concursos');
      if (pref.receber_novas_leis) tiposNecessarios.add('novas_leis');
      if (pref.receber_atualizacoes_leis) tiposNecessarios.add('atualizacoes_leis');
    });

    // Se tipoFiltro está definido, buscar apenas esse tipo
    if (tipoFiltro) {
      tiposNecessarios.clear();
      tiposNecessarios.add(tipoFiltro);
    }

    console.log(`[evelyn-notificacoes] Tipos a buscar: ${Array.from(tiposNecessarios).join(', ')}`);

    // Buscar conteúdos em paralelo
    const promessas: Promise<void>[] = [];

    if (tiposNecessarios.has('resumo_dia')) {
      promessas.push(
        buscarResumoDia(supabase).then(r => { conteudos.resumo_dia = r; })
      );
    }
    if (tiposNecessarios.has('concursos')) {
      promessas.push(
        buscarNoticiasConcursos(supabase).then(r => { conteudos.concursos = r; })
      );
    }
    if (tiposNecessarios.has('novas_leis')) {
      promessas.push(
        buscarNovasLeis(supabase).then(r => { conteudos.novas_leis = r; })
      );
    }
    if (tiposNecessarios.has('atualizacoes_leis')) {
      promessas.push(
        buscarAtualizacoesLeis(supabase).then(r => { conteudos.atualizacoes_leis = r; })
      );
    }

    await Promise.all(promessas);

    console.log('[evelyn-notificacoes] Conteúdos preparados:', {
      resumo_dia: !!conteudos.resumo_dia,
      concursos: !!conteudos.concursos,
      novas_leis: !!conteudos.novas_leis,
      atualizacoes_leis: !!conteudos.atualizacoes_leis,
    });

    // Enviar notificações
    let enviados = 0;
    let erros = 0;
    const resultados: any[] = [];

    for (const pref of preferencias as PreferenciaNotificacao[]) {
      const mensagensEnviadas: string[] = [];

      // Enviar cada tipo de notificação configurado
      if ((pref.receber_resumo_dia || tipoFiltro === 'resumo_dia') && conteudos.resumo_dia) {
        const sucesso = await enviarWhatsApp(pref.telefone, conteudos.resumo_dia);
        if (sucesso) {
          mensagensEnviadas.push('resumo_dia');
          enviados++;
        } else {
          erros++;
        }
        // Delay entre mensagens para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if ((pref.receber_noticias_concursos || tipoFiltro === 'concursos') && conteudos.concursos) {
        const sucesso = await enviarWhatsApp(pref.telefone, conteudos.concursos);
        if (sucesso) {
          mensagensEnviadas.push('concursos');
          enviados++;
        } else {
          erros++;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if ((pref.receber_novas_leis || tipoFiltro === 'novas_leis') && conteudos.novas_leis) {
        const sucesso = await enviarWhatsApp(pref.telefone, conteudos.novas_leis);
        if (sucesso) {
          mensagensEnviadas.push('novas_leis');
          enviados++;
        } else {
          erros++;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if ((pref.receber_atualizacoes_leis || tipoFiltro === 'atualizacoes_leis') && conteudos.atualizacoes_leis) {
        const sucesso = await enviarWhatsApp(pref.telefone, conteudos.atualizacoes_leis);
        if (sucesso) {
          mensagensEnviadas.push('atualizacoes_leis');
          enviados++;
        } else {
          erros++;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (mensagensEnviadas.length > 0) {
        resultados.push({
          telefone: pref.telefone.substring(0, 8) + '****',
          tipos: mensagensEnviadas,
        });

        // Atualizar último envio
        await supabase
          .from('evelyn_preferencias_notificacao')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', pref.id);
      }
    }

    console.log(`[evelyn-notificacoes] Concluído: ${enviados} enviados, ${erros} erros`);

    // Registrar log
    await supabase.from('notificacoes_sistema').insert({
      titulo: 'Evelyn - Notificações Automáticas',
      conteudo: `Enviados: ${enviados}, Erros: ${erros}`,
      tipo: 'evelyn_notificacao',
      dados: {
        horario: horarioFiltro,
        tipo: tipoFiltro,
        resultados,
        conteudos_disponiveis: {
          resumo_dia: !!conteudos.resumo_dia,
          concursos: !!conteudos.concursos,
          novas_leis: !!conteudos.novas_leis,
          atualizacoes_leis: !!conteudos.atualizacoes_leis,
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        enviados,
        erros,
        preferencias_processadas: preferencias.length,
        resultados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-notificacoes] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
