import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar hash de um texto
async function gerarHash(texto: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para normalizar texto para comparação
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Função para comparar artigos do banco com artigos parseados
function compararArtigos(
  artigosBanco: Array<{ numero: string; conteudo: string }>,
  artigosPlanalto: Array<{ numero: string; conteudo: string }>
): { 
  novos: string[]; 
  alterados: string[]; 
  removidos: string[];
  totalBanco: number;
  totalPlanalto: number;
  temDiferencas: boolean;
} {
  const mapaPlanalto = new Map<string, string>();
  const mapaBanco = new Map<string, string>();
  
  // Normalizar números de artigos para comparação
  const normalizarNumero = (num: string): string => {
    return num.replace(/[^\d\w-]/gi, '').toLowerCase();
  };
  
  artigosPlanalto.forEach(a => {
    const numNorm = normalizarNumero(a.numero);
    mapaPlanalto.set(numNorm, normalizarTexto(a.conteudo));
  });
  
  artigosBanco.forEach(a => {
    const numNorm = normalizarNumero(a.numero);
    mapaBanco.set(numNorm, normalizarTexto(a.conteudo));
  });
  
  const novos: string[] = [];
  const alterados: string[] = [];
  const removidos: string[] = [];
  
  // Encontrar novos e alterados
  mapaPlanalto.forEach((conteudo, numero) => {
    if (!mapaBanco.has(numero)) {
      novos.push(numero);
    } else if (mapaBanco.get(numero) !== conteudo) {
      alterados.push(numero);
    }
  });
  
  // Encontrar removidos
  mapaBanco.forEach((_, numero) => {
    if (!mapaPlanalto.has(numero)) {
      removidos.push(numero);
    }
  });
  
  return {
    novos,
    alterados,
    removidos,
    totalBanco: artigosBanco.length,
    totalPlanalto: artigosPlanalto.length,
    temDiferencas: novos.length > 0 || alterados.length > 0 || removidos.length > 0
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { 
      tabelaLei,
      tabelaEspecifica,
      forcarComparacaoCompleta = false,
      modo = 'prioritario'
    } = body;

    // Compatibilidade com parâmetros antigos
    const tabelaAlvo = tabelaLei || tabelaEspecifica;

    console.log(`[MONITOR] Iniciando verificação. Tabela: ${tabelaAlvo || 'todas'}. Forçar: ${forcarComparacaoCompleta}. Modo: ${modo}`);

    // Registrar início da execução
    const { data: execucao } = await supabase
      .from('monitoramento_execucoes')
      .insert({ status: 'executando', detalhes: { modo, forcarComparacaoCompleta } })
      .select()
      .single();

    const execucaoId = execucao?.id;

    // Buscar leis para monitorar
    let query = supabase
      .from('monitoramento_leis')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: true })
      .order('ultima_verificacao', { ascending: true, nullsFirst: true });

    if (tabelaAlvo) {
      query = supabase
        .from('monitoramento_leis')
        .select('*')
        .eq('tabela_lei', tabelaAlvo);
    } else if (modo === 'prioritario') {
      query = query.limit(10);
    }

    const { data: leis, error: leisError } = await query;

    if (leisError) {
      console.error('[MONITOR] Erro ao buscar leis:', leisError);
      throw leisError;
    }

    console.log(`[MONITOR] ${leis?.length || 0} lei(s) para verificar`);

    const resultados: any[] = [];
    let comAlteracoes = 0;
    let erros = 0;

    for (const lei of leis || []) {
      console.log(`\n[MONITOR] ========== Verificando: ${lei.tabela_lei} ==========`);
      console.log(`[MONITOR] URL: ${lei.url_planalto}`);
      
      try {
        // Atualizar status
        await supabase
          .from('monitoramento_leis')
          .update({ status: 'verificando' })
          .eq('id', lei.id);

        // 1. Raspar conteúdo atual do Planalto
        console.log('[MONITOR] Raspando conteúdo do Planalto...');
        const raspResponse = await fetch(`${supabaseUrl}/functions/v1/raspar-planalto-bruto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ 
            urlPlanalto: lei.url_planalto,
            tableName: lei.tabela_lei 
          }),
        });

        if (!raspResponse.ok) {
          const errorText = await raspResponse.text();
          console.error(`[MONITOR] Erro na raspagem: ${errorText}`);
          throw new Error(`Erro na raspagem: ${raspResponse.status}`);
        }

        const raspData = await raspResponse.json();
        
        if (!raspData.success || !raspData.textoBruto) {
          throw new Error(raspData.error || 'Conteúdo vazio retornado da raspagem');
        }

        console.log(`[MONITOR] Raspagem OK. textoBruto: ${raspData.textoBruto?.length || 0} chars`);
        console.log(`[MONITOR] Data de atualização extraída: ${raspData.dataAtualizacao || 'não encontrada'}`);

        // 2. Gerar hash do conteúdo atual
        const hashAtual = await gerarHash(raspData.textoBruto || '');
        console.log(`[MONITOR] Hash atual: ${hashAtual.substring(0, 16)}...`);
        console.log(`[MONITOR] Hash anterior: ${lei.ultimo_hash?.substring(0, 16) || 'nenhum'}...`);

        const hashMudou = lei.ultimo_hash !== hashAtual;
        console.log(`[MONITOR] Hash mudou? ${hashMudou}`);

        // 3. Se forçar comparação OU hash mudou OU não tem hash anterior, fazer comparação completa
        if (forcarComparacaoCompleta || hashMudou || !lei.ultimo_hash) {
          console.log('[MONITOR] Iniciando comparação completa...');
          
          // 3a. Parsear artigos do Planalto
          console.log('[MONITOR] Parseando artigos do Planalto...');
          const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parsear-artigos-lei`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              conteudo: raspData.textoBruto,  // CORRIGIDO: era raspData.content
              tableName: lei.tabela_lei,
              usarGemini: true
            }),
          });

          let artigosPlanalto: Array<{ numero: string; conteudo: string }> = [];
          let metodoExtracao = 'desconhecido';
          
          if (parseResponse.ok) {
            const parseData = await parseResponse.json();
            artigosPlanalto = (parseData.artigos || []).map((a: any) => ({
              numero: a.numero,
              conteudo: a.conteudo
            }));
            metodoExtracao = parseData.metodo || 'regex';
            console.log(`[MONITOR] Artigos parseados do Planalto: ${artigosPlanalto.length}`);
            console.log(`[MONITOR] Método de extração: ${metodoExtracao}`);
          } else {
            const parseError = await parseResponse.text();
            console.error('[MONITOR] Erro ao parsear artigos:', parseError);
          }

          // 3b. Buscar artigos do banco de dados
          console.log('[MONITOR] Buscando artigos do banco...');
          const { data: artigosBancoRaw, error: artigosError } = await supabase
            .from(lei.tabela_lei)
            .select('"Número do Artigo", "Artigo"')
            .not('"Número do Artigo"', 'is', null)
            .limit(3000);

          if (artigosError) {
            console.error('[MONITOR] Erro ao buscar artigos do banco:', artigosError);
          }

          const artigosBanco: Array<{ numero: string; conteudo: string }> = (artigosBancoRaw || []).map((a: any) => ({
            numero: a['Número do Artigo'] || '',
            conteudo: a['Artigo'] || ''
          })).filter((a: any) => a.numero && a.conteudo);

          console.log(`[MONITOR] Artigos no banco: ${artigosBanco.length}`);

          // 3c. Comparar artigos
          const comparacao = compararArtigos(artigosBanco, artigosPlanalto);
          console.log(`[MONITOR] Comparação completa:`);
          console.log(`  - Total banco: ${comparacao.totalBanco}`);
          console.log(`  - Total Planalto: ${comparacao.totalPlanalto}`);
          console.log(`  - Artigos novos: ${comparacao.novos.length}`);
          console.log(`  - Artigos alterados: ${comparacao.alterados.length}`);
          console.log(`  - Artigos removidos: ${comparacao.removidos.length}`);
          console.log(`  - Tem diferenças: ${comparacao.temDiferencas}`);

          if (comparacao.novos.length > 0) {
            console.log(`  - Novos: ${comparacao.novos.slice(0, 5).join(', ')}${comparacao.novos.length > 5 ? '...' : ''}`);
          }
          if (comparacao.alterados.length > 0) {
            console.log(`  - Alterados: ${comparacao.alterados.slice(0, 5).join(', ')}${comparacao.alterados.length > 5 ? '...' : ''}`);
          }

          // 4. Determinar status
          let status = 'atualizado';
          let alteracoesDetectadas: any = null;
          
          if (comparacao.temDiferencas) {
            status = 'com_alteracoes';
            alteracoesDetectadas = {
              novos: comparacao.novos,
              alterados: comparacao.alterados,
              removidos: comparacao.removidos,
              totalBanco: comparacao.totalBanco,
              totalPlanalto: comparacao.totalPlanalto,
              verificadoEm: new Date().toISOString()
            };
            comAlteracoes++;
            console.log(`[MONITOR] ⚠️ DESATUALIZADO! Alterações detectadas.`);
          } else if (artigosPlanalto.length === 0 && artigosBanco.length > 0) {
            // Se não conseguiu parsear artigos do Planalto mas tem no banco, marcar como erro
            status = 'erro';
            erros++;
            console.log(`[MONITOR] ❌ ERRO: Não foi possível parsear artigos do Planalto`);
          } else {
            console.log(`[MONITOR] ✅ ATUALIZADO! Nenhuma diferença encontrada.`);
          }

          // 5. Atualizar registro de monitoramento
          const totalAlteracoes = (comparacao.novos.length + comparacao.alterados.length + comparacao.removidos.length);
          
          const { error: updateError } = await supabase
            .from('monitoramento_leis')
            .update({
              ultimo_hash: hashAtual,
              ultimo_total_artigos: artigosPlanalto.length,
              ultima_verificacao: new Date().toISOString(),
              status,
              alteracoes_detectadas: totalAlteracoes > 0 ? 
                (lei.alteracoes_detectadas || 0) + totalAlteracoes : 
                lei.alteracoes_detectadas,
              ultima_alteracao_detectada: totalAlteracoes > 0 ? 
                new Date().toISOString() : 
                lei.ultima_alteracao_detectada,
              data_modificacao_planalto: raspData.dataAtualizacao || null,
              erro_detalhes: null
            })
            .eq('id', lei.id);

          if (updateError) {
            console.error('[MONITOR] Erro ao atualizar registro:', updateError);
          }

          // 6. Registrar no histórico se houve alterações
          if (totalAlteracoes > 0) {
            await supabase.from('historico_alteracoes').insert({
              tabela_codigo: lei.tabela_lei,
              tipo_alteracao: 'atualizacao_legislativa',
              artigo_afetado: comparacao.alterados?.[0] || comparacao.novos?.[0] || 'múltiplos',
              detalhes: alteracoesDetectadas,
              hash_anterior: lei.ultimo_hash,
              hash_novo: hashAtual
            });
          }

          resultados.push({
            tabela: lei.tabela_lei,
            status,
            hashMudou,
            comparacao: {
              totalBanco: comparacao.totalBanco,
              totalPlanalto: comparacao.totalPlanalto,
              novos: comparacao.novos.length,
              alterados: comparacao.alterados.length,
              removidos: comparacao.removidos.length,
              temDiferencas: comparacao.temDiferencas
            },
            dataModificacaoPlanalto: raspData.dataAtualizacao
          });

        } else {
          // Hash não mudou e não forçou comparação - manter status anterior
          console.log('[MONITOR] Hash não mudou. Mantendo status anterior.');
          
          await supabase
            .from('monitoramento_leis')
            .update({
              status: 'atualizado',
              ultima_verificacao: new Date().toISOString(),
              erro_detalhes: null
            })
            .eq('id', lei.id);

          resultados.push({
            tabela: lei.tabela_lei,
            status: 'atualizado',
            hashMudou: false,
            mensagem: 'Hash não mudou, status mantido'
          });
        }

      } catch (leiError: any) {
        console.error(`[MONITOR] Erro ao processar ${lei.tabela_lei}:`, leiError);
        erros++;
        
        await supabase
          .from('monitoramento_leis')
          .update({
            status: 'erro',
            ultima_verificacao: new Date().toISOString(),
            erro_detalhes: leiError.message || String(leiError)
          })
          .eq('id', lei.id);

        resultados.push({
          tabela: lei.tabela_lei,
          status: 'erro',
          erro: leiError.message
        });
      }
    }

    // Finalizar execução
    if (execucaoId) {
      await supabase
        .from('monitoramento_execucoes')
        .update({
          status: 'concluido',
          fim: new Date().toISOString(),
          leis_verificadas: resultados.length,
          alteracoes_encontradas: comAlteracoes,
          erros,
          detalhes: {
            modo,
            forcarComparacaoCompleta,
            resultados
          }
        })
        .eq('id', execucaoId);
    }

    console.log('\n[MONITOR] ========== RESUMO ==========');
    console.log(`Total verificado: ${resultados.length}`);
    console.log(`Atualizados: ${resultados.filter(r => r.status === 'atualizado').length}`);
    console.log(`Com alterações: ${comAlteracoes}`);
    console.log(`Erros: ${erros}`);

    return new Response(JSON.stringify({
      success: true,
      resultados,
      verificadas: resultados.length,
      comAlteracoes,
      erros,
      execucaoId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[MONITOR] Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
