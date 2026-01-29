import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sincroniza uma lei do Planalto com a tabela do banco de dados
 * 1. Raspa o conteúdo atualizado do Planalto
 * 2. Parseia os artigos
 * 3. Compara com os artigos existentes
 * 4. Atualiza apenas o que mudou (preservando áudios quando possível)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, urlPlanalto } = await req.json();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 SINCRONIZAR LEI DO PLANALTO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Tabela: ${tableName}`);
    console.log(`🔗 URL: ${urlPlanalto}`);

    if (!tableName || !urlPlanalto) {
      return new Response(
        JSON.stringify({ success: false, error: 'tableName e urlPlanalto são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ETAPA 1: Raspar conteúdo do Planalto
    console.log('\n📡 ETAPA 1: Raspando Planalto...');
    const { data: raspData, error: raspError } = await supabase.functions.invoke('raspar-planalto-bruto', {
      body: { urlPlanalto, tableName }
    });

    if (raspError || !raspData?.success) {
      throw new Error(`Erro ao raspar: ${raspError?.message || raspData?.error}`);
    }

    console.log(`✅ Raspado: ${raspData.caracteres} caracteres`);

    // ETAPA 2: Parsear artigos
    // Preferir markdown para códigos/leis (melhor para parsing de artigos)
    // HTML só é útil para leis com tabelas importantes
    const conteudoParaParsear = raspData.markdownBruto && raspData.markdownBruto.length > 10000 
      ? raspData.markdownBruto 
      : raspData.textoBruto;
    
    console.log('\n📝 ETAPA 2: Parseando artigos...');
    console.log(`   Usando: ${raspData.markdownBruto && raspData.markdownBruto.length > 10000 ? 'markdown' : 'textoBruto'} (${conteudoParaParsear.length} chars)`);
    
    const { data: parseData, error: parseError } = await supabase.functions.invoke('parsear-artigos-lei', {
      body: { 
        conteudo: conteudoParaParsear, 
        tableName,
        usarGemini: true 
      }
    });

    if (parseError || !parseData?.success) {
      throw new Error(`Erro ao parsear: ${parseError?.message || parseData?.error}`);
    }

    const artigosNovos = parseData.artigos || [];
    console.log(`✅ Parseados: ${artigosNovos.length} artigos`);

    if (artigosNovos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhum artigo foi extraído da lei' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 3: Buscar artigos atuais do banco
    console.log('\n📊 ETAPA 3: Buscando artigos atuais...');
    const { data: artigosAtuais, error: fetchError } = await supabase
      .from(tableName)
      .select('id, "Número do Artigo", "Artigo", "Narração"')
      .order('id');

    if (fetchError) {
      throw new Error(`Erro ao buscar artigos: ${fetchError.message}`);
    }

    console.log(`📋 Artigos no banco: ${artigosAtuais?.length || 0}`);

    // ETAPA 4: Comparar e preparar mapeamento de áudios
    console.log('\n🔍 ETAPA 4: Comparando artigos...');
    
    // Criar mapa dos artigos atuais
    const mapaAtual = new Map<string, { id: number; conteudo: string; narracao?: string }>();
    for (const art of artigosAtuais || []) {
      const numero = normalizarNumero(art['Número do Artigo'] || '');
      mapaAtual.set(numero, {
        id: art.id,
        conteudo: art['Artigo'] || '',
        narracao: art['Narração'] || undefined
      });
    }

    const mapeamentoAudios: Array<{
      numeroArtigo: string;
      acao: 'manter' | 'remover' | 'ignorar';
      urlAudio?: string;
    }> = [];

    let artigosNovosCount = 0;
    let artigosAlteradosCount = 0;
    let artigosIguaisCount = 0;

    for (const artigoNovo of artigosNovos) {
      const numeroNormalizado = normalizarNumero(artigoNovo.numero);
      const atual = mapaAtual.get(numeroNormalizado);

      if (!atual) {
        // Artigo novo
        artigosNovosCount++;
        mapeamentoAudios.push({
          numeroArtigo: artigoNovo.numero,
          acao: 'ignorar'
        });
      } else {
        // Comparar conteúdo
        const conteudoAtualNorm = normalizarTexto(atual.conteudo);
        const conteudoNovoNorm = normalizarTexto(artigoNovo.conteudo);

        if (conteudoAtualNorm === conteudoNovoNorm) {
          // Igual - manter áudio
          artigosIguaisCount++;
          mapeamentoAudios.push({
            numeroArtigo: artigoNovo.numero,
            acao: atual.narracao ? 'manter' : 'ignorar',
            urlAudio: atual.narracao
          });
        } else {
          // Alterado - remover áudio
          artigosAlteradosCount++;
          mapeamentoAudios.push({
            numeroArtigo: artigoNovo.numero,
            acao: atual.narracao ? 'remover' : 'ignorar',
            urlAudio: atual.narracao
          });
        }
        
        mapaAtual.delete(numeroNormalizado);
      }
    }

    // Artigos que foram removidos (estavam no banco mas não estão mais na lei)
    const artigosRemovidosCount = mapaAtual.size;
    for (const [numero, dados] of mapaAtual.entries()) {
      if (dados.narracao) {
        mapeamentoAudios.push({
          numeroArtigo: numero,
          acao: 'remover',
          urlAudio: dados.narracao
        });
      }
    }

    console.log(`📊 Comparação:`);
    console.log(`   - Novos: ${artigosNovosCount}`);
    console.log(`   - Alterados: ${artigosAlteradosCount}`);
    console.log(`   - Iguais: ${artigosIguaisCount}`);
    console.log(`   - Removidos: ${artigosRemovidosCount}`);

    // ETAPA 5: Atualizar tabela
    console.log('\n💾 ETAPA 5: Atualizando tabela...');
    
    const artigosParaInserir = artigosNovos.map((art: any, index: number) => ({
      numero: art.numero,
      conteudo: art.conteudo,
      ordem: art.ordem || index + 1
    }));

    const { data: updateData, error: updateError } = await supabase.functions.invoke('atualizar-lei-inteligente', {
      body: {
        tableName,
        artigosNovos: artigosParaInserir,
        mapeamentoAudios,
        deletarAudiosRemovidos: true
      }
    });

    if (updateError || !updateData?.success) {
      throw new Error(`Erro ao atualizar: ${updateError?.message || updateData?.error}`);
    }

    // ETAPA 6: Atualizar monitoramento
    console.log('\n📈 ETAPA 6: Atualizando registro de monitoramento...');
    await supabase
      .from('monitoramento_leis')
      .update({
        ultimo_total_artigos: artigosNovos.length,
        ultima_verificacao: new Date().toISOString(),
        status: 'atualizado',
        data_modificacao_planalto: raspData.dataAtualizacao || null
      })
      .eq('tabela', tableName);

    const resultado = {
      success: true,
      tableName,
      totalArtigosNovos: artigosNovos.length,
      totalArtigosAnteriores: artigosAtuais?.length || 0,
      artigosNovos: artigosNovosCount,
      artigosAlterados: artigosAlteradosCount,
      artigosIguais: artigosIguaisCount,
      artigosRemovidos: artigosRemovidosCount,
      audiosMantidos: updateData.audiosMantidos,
      audiosRemovidos: updateData.audiosRemovidos,
      dataAtualizacaoPlanalto: raspData.dataAtualizacao
    };

    console.log('\n✅ SINCRONIZAÇÃO CONCLUÍDA!');
    console.log(JSON.stringify(resultado, null, 2));

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function normalizarNumero(num: string): string {
  return num
    .replace(/^Art\.?\s*/i, '')
    .replace(/[ºª°]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .trim();
}

function normalizarTexto(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/\u00A0/g, ' ')
    .trim()
    .toLowerCase();
}
