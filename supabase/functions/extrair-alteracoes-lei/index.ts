import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Padrões para identificar elementos estruturais
const PADROES_ELEMENTOS = {
  inciso: /^(X{0,3}(?:IX|IV|V?I{0,3})|[IVXLCDM]+)\s*[-–—\.]\s*/i,
  alinea: /^([a-z])\)\s*/i,
  paragrafo: /^§\s*(\d+)[ºo°]?\s*/i,
  paragrafoUnico: /^Parágrafo\s+único\.?\s*/i,
  caput: /^Art\.\s*\d+/i
};

// Regex para encontrar anotações de alteração dentro do texto
// NOTA: [^)]* permite que a palavra-chave esteja no início (como "Revogado pela Lei...")
const REGEX_ANOTACAO = /\(([^)]*(?:Incluíd|Incluido|Revogad|Vetad|Redação|Acrescid|Acrescentad|Alterad|Suprimid)[^)]*)\)/gi;

// Extrai tipo de alteração do texto
function extrairTipoAlteracao(texto: string): string {
  const textoLower = texto.toLowerCase();
  if (textoLower.includes('redação') || textoLower.includes('redacao')) return 'Redação';
  if (textoLower.includes('incluíd') || textoLower.includes('incluid') || textoLower.includes('incluido') || textoLower.includes('incluída')) return 'Inclusão';
  if (textoLower.includes('revogad')) return 'Revogação';
  if (textoLower.includes('vetad')) return 'Vetado';
  if (textoLower.includes('acrescid') || textoLower.includes('acrescentad')) return 'Acréscimo';
  if (textoLower.includes('renumerad')) return 'Renumeração';
  if (textoLower.includes('alterad')) return 'Alteração';
  if (textoLower.includes('suprimid')) return 'Supressão';
  return 'Outro';
}

// Extrai lei alteradora do texto (nome completo da lei)
function extrairLeiAlteradora(texto: string): string | null {
  // Buscar padrão de lei com número
  const patterns = [
    // Lei nº 14.382, de 2022 ou Lei nº 14.382/2022
    /(Lei\s+(?:Complementar\s+)?n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
    // Decreto nº 1234 ou Decreto-Lei nº 1234
    /(Decreto(?:-Lei)?\s+n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
    // Emenda Constitucional nº 45
    /(Emenda\s+Constitucional\s+n[ºo°]?\s*\d+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
    // Medida Provisória nº 123
    /(Medida\s+Provisória\s+n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
    // LC nº 123 (Lei Complementar abreviada)
    /(LC\s+n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
    // MP nº 123 (Medida Provisória abreviada)
    /(MP\s+n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?(?:,?\s*de\s*\d{4})?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Extrai data/ano do texto
function extrairData(texto: string): { data: string | null; ano: number | null } {
  // Tentar formato DD.MM.YYYY ou DD/MM/YYYY
  const dataMatch = texto.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (dataMatch) {
    const dia = parseInt(dataMatch[1]);
    const mes = parseInt(dataMatch[2]);
    let ano = parseInt(dataMatch[3]);
    if (ano < 100) ano += 2000;
    return { data: `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`, ano };
  }
  
  // Tentar "de 2022" ou ", de 2022" ou "/2022"
  const anoMatch = texto.match(/(?:de\s+|\/|,\s*)(\d{4})/);
  if (anoMatch) {
    const ano = parseInt(anoMatch[1]);
    if (ano >= 1900 && ano <= 2100) {
      return { data: null, ano };
    }
  }
  
  // Último recurso: qualquer ano no texto
  const anoSimples = texto.match(/(\d{4})/);
  if (anoSimples) {
    const ano = parseInt(anoSimples[1]);
    if (ano >= 1900 && ano <= 2100) {
      return { data: null, ano };
    }
  }
  
  return { data: null, ano: null };
}

// Gera URL da lei no Planalto (tentativa)
function gerarUrlPlanalto(leiAlteradora: string | null): string | null {
  if (!leiAlteradora) return null;
  
  // Tentar extrair número da lei
  const numMatch = leiAlteradora.match(/n[ºo°]?\s*([\d.]+)/i);
  if (!numMatch) return null;
  
  const numero = numMatch[1].replace(/\./g, '');
  const leiLower = leiAlteradora.toLowerCase();
  
  if (leiLower.includes('emenda constitucional')) {
    return `https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc${numero}.htm`;
  }
  if (leiLower.includes('lei complementar') || leiLower.startsWith('lc')) {
    return `https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp${numero}.htm`;
  }
  if (leiLower.includes('medida provisória') || leiLower.startsWith('mp')) {
    return `https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/mpv/mpv${numero}.htm`;
  }
  if (leiLower.includes('decreto-lei')) {
    return `https://www.planalto.gov.br/ccivil_03/decreto-lei/del${numero}.htm`;
  }
  if (leiLower.includes('decreto')) {
    return `https://www.planalto.gov.br/ccivil_03/decreto/d${numero}.htm`;
  }
  if (leiLower.includes('lei')) {
    // Lei ordinária - número determina URL
    const numInt = parseInt(numero);
    if (numInt >= 10000) {
      // Leis mais recentes
      return `https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l${numero}.htm`;
    } else {
      return `https://www.planalto.gov.br/ccivil_03/leis/l${numero}.htm`;
    }
  }
  
  return null;
}

// Identifica o tipo e número do elemento estrutural
function identificarElemento(linha: string): { tipo: string; numero: string } | null {
  // Verificar parágrafo único primeiro
  if (PADROES_ELEMENTOS.paragrafoUnico.test(linha)) {
    return { tipo: 'parágrafo', numero: 'único' };
  }
  
  // Verificar parágrafo numerado
  const paragrafoMatch = linha.match(PADROES_ELEMENTOS.paragrafo);
  if (paragrafoMatch) {
    return { tipo: 'parágrafo', numero: `§ ${paragrafoMatch[1]}º` };
  }
  
  // Verificar inciso (números romanos)
  const incisoMatch = linha.match(PADROES_ELEMENTOS.inciso);
  if (incisoMatch) {
    return { tipo: 'inciso', numero: incisoMatch[1].toUpperCase() };
  }
  
  // Verificar alínea
  const alineaMatch = linha.match(PADROES_ELEMENTOS.alinea);
  if (alineaMatch) {
    return { tipo: 'alínea', numero: alineaMatch[1].toLowerCase() };
  }
  
  // Verificar caput
  if (PADROES_ELEMENTOS.caput.test(linha)) {
    return { tipo: 'caput', numero: '' };
  }
  
  return null;
}

// Limpa o texto do elemento (remove anotações)
function limparTextoElemento(texto: string): string {
  // Remove anotações entre parênteses relacionadas a alterações
  let limpo = texto.replace(/\([^)]*(?:Incluíd|Incluido|Revogad|Vetad|Redação|Acrescid|Acrescentad|Alterad|Suprimid|Vide|Vigência|Regulamento)[^)]*\)/gi, '');
  // Remove espaços múltiplos
  limpo = limpo.replace(/\s+/g, ' ').trim();
  // Limita tamanho
  if (limpo.length > 200) {
    limpo = limpo.substring(0, 200) + '...';
  }
  return limpo;
}

interface AlteracaoGranular {
  tabela_lei: string;
  numero_artigo: string;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  data_alteracao: string | null;
  ano_alteracao: number | null;
  texto_completo: string;
  elemento_tipo: string;
  elemento_numero: string;
  elemento_texto: string;
  url_lei_alteradora: string | null;
}

// Processa um artigo e extrai alterações granulares
function processarArtigoGranular(textoArtigo: string, numeroArtigo: string, tabelaLei: string): AlteracaoGranular[] {
  const alteracoes: AlteracaoGranular[] = [];
  const jaProcessados = new Set<string>();
  
  // Dividir em linhas/elementos
  // Quebrar por: quebras de linha, ponto-e-vírgula seguido de espaço e maiúscula, ou início de inciso/parágrafo
  const linhas = textoArtigo
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  
  // Se não houver quebras de linha, tentar dividir por elementos estruturais
  let elementos: string[] = [];
  if (linhas.length <= 1) {
    // Dividir mantendo delimitadores
    const regex = /(§\s*\d+[ºo°]?\s*|Parágrafo\s+único\.?\s*|^[IVXLCDM]+\s*[-–—\.]\s*|^[a-z]\)\s*)/gmi;
    const partes = textoArtigo.split(regex);
    let atual = '';
    for (const parte of partes) {
      if (regex.test(parte)) {
        if (atual.trim()) elementos.push(atual.trim());
        atual = parte;
      } else {
        atual += parte;
      }
    }
    if (atual.trim()) elementos.push(atual.trim());
  } else {
    elementos = linhas;
  }
  
  // Processar cada elemento
  for (const elemento of elementos) {
    // Buscar anotações de alteração no elemento
    const anotacoes = [...elemento.matchAll(REGEX_ANOTACAO)];
    
    for (const match of anotacoes) {
      const textoAnotacao = `(${match[1]})`;
      const chaveUnica = `${numeroArtigo}-${textoAnotacao}`;
      
      if (jaProcessados.has(chaveUnica)) continue;
      jaProcessados.add(chaveUnica);
      
      const tipo = extrairTipoAlteracao(textoAnotacao);
      
      // Ignorar tipos não relevantes
      if (tipo === 'Outro') continue;
      
      const lei = extrairLeiAlteradora(textoAnotacao);
      const { data, ano } = extrairData(textoAnotacao);
      const url = gerarUrlPlanalto(lei);
      
      // Identificar elemento estrutural
      const elementoInfo = identificarElemento(elemento);
      const elementoTipo = elementoInfo?.tipo || 'artigo';
      const elementoNumero = elementoInfo?.numero || '';
      const elementoTexto = limparTextoElemento(elemento);
      
      alteracoes.push({
        tabela_lei: tabelaLei,
        numero_artigo: numeroArtigo,
        tipo_alteracao: tipo,
        lei_alteradora: lei,
        data_alteracao: data,
        ano_alteracao: ano,
        texto_completo: textoAnotacao,
        elemento_tipo: elementoTipo,
        elemento_numero: elementoNumero,
        elemento_texto: elementoTexto,
        url_lei_alteradora: url
      });
    }
  }
  
  // Se não encontrou alterações nos elementos, verificar o artigo todo
  if (alteracoes.length === 0) {
    const anotacoesTodo = [...textoArtigo.matchAll(REGEX_ANOTACAO)];
    
    for (const match of anotacoesTodo) {
      const textoAnotacao = `(${match[1]})`;
      const chaveUnica = `${numeroArtigo}-${textoAnotacao}`;
      
      if (jaProcessados.has(chaveUnica)) continue;
      jaProcessados.add(chaveUnica);
      
      const tipo = extrairTipoAlteracao(textoAnotacao);
      if (tipo === 'Outro') continue;
      
      const lei = extrairLeiAlteradora(textoAnotacao);
      const { data, ano } = extrairData(textoAnotacao);
      const url = gerarUrlPlanalto(lei);
      
      // Tentar identificar o contexto
      const posicao = textoArtigo.indexOf(match[0]);
      const contexto = textoArtigo.substring(Math.max(0, posicao - 100), posicao).trim();
      const elementoInfo = identificarElemento(contexto);
      
      alteracoes.push({
        tabela_lei: tabelaLei,
        numero_artigo: numeroArtigo,
        tipo_alteracao: tipo,
        lei_alteradora: lei,
        data_alteracao: data,
        ano_alteracao: ano,
        texto_completo: textoAnotacao,
        elemento_tipo: elementoInfo?.tipo || 'artigo',
        elemento_numero: elementoInfo?.numero || '',
        elemento_texto: limparTextoElemento(contexto || textoArtigo.substring(0, 200)),
        url_lei_alteradora: url
      });
    }
  }
  
  return alteracoes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, action } = await req.json();
    
    if (!tableName) {
      return new Response(
        JSON.stringify({ error: 'tableName é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ação de deletar
    if (action === 'delete') {
      console.log(`[extrair-alteracoes-lei] Deletando histórico de: ${tableName}`);
      
      const { error: deleteError } = await supabase
        .from('historico_alteracoes')
        .delete()
        .eq('tabela_lei', tableName);
      
      if (deleteError) {
        console.error(`[extrair-alteracoes-lei] Erro ao deletar:`, deleteError);
        return new Response(
          JSON.stringify({ error: `Erro ao deletar: ${deleteError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: `Histórico de ${tableName} deletado` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[extrair-alteracoes-lei] Processando tabela: ${tableName}`);

    // Buscar todos os artigos da tabela
    const { data: artigos, error: fetchError } = await supabase
      .from(tableName)
      .select('id, "Número do Artigo", "Artigo"')
      .not('Artigo', 'is', null);

    if (fetchError) {
      console.error(`[extrair-alteracoes-lei] Erro ao buscar artigos:`, fetchError);
      return new Response(
        JSON.stringify({ error: `Erro ao buscar artigos: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[extrair-alteracoes-lei] Encontrados ${artigos?.length || 0} artigos`);

    const alteracoesParaInserir: AlteracaoGranular[] = [];
    let artigosComAlteracao = 0;

    // Processar cada artigo
    for (const artigo of (artigos || [])) {
      const textoArtigo = artigo['Artigo'];
      const numeroArtigo = artigo['Número do Artigo'];
      
      if (!textoArtigo || !numeroArtigo) continue;
      
      const alteracoes = processarArtigoGranular(textoArtigo, numeroArtigo, tableName);
      
      if (alteracoes.length > 0) {
        artigosComAlteracao++;
        alteracoesParaInserir.push(...alteracoes);
      }
    }

    console.log(`[extrair-alteracoes-lei] Total de alterações encontradas: ${alteracoesParaInserir.length}`);
    
    // Log de exemplos para debug
    if (alteracoesParaInserir.length > 0) {
      console.log(`[extrair-alteracoes-lei] Exemplo de alteração:`, JSON.stringify(alteracoesParaInserir[0], null, 2));
    }

    // Inserir alterações
    if (alteracoesParaInserir.length > 0) {
      // Deletar alterações antigas desta tabela
      await supabase
        .from('historico_alteracoes')
        .delete()
        .eq('tabela_lei', tableName);
      
      // Inserir em lotes de 100 para evitar timeout
      const batchSize = 100;
      for (let i = 0; i < alteracoesParaInserir.length; i += batchSize) {
        const batch = alteracoesParaInserir.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('historico_alteracoes')
          .insert(batch);

        if (insertError) {
          console.error(`[extrair-alteracoes-lei] Erro ao inserir batch ${i}:`, insertError);
          return new Response(
            JSON.stringify({ error: `Erro ao inserir alterações: ${insertError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const tiposEncontrados = [...new Set(alteracoesParaInserir.map(a => a.tipo_alteracao))];
    const elementosEncontrados = [...new Set(alteracoesParaInserir.map(a => a.elemento_tipo))];

    const resultado = {
      success: true,
      tabela: tableName,
      totalArtigos: artigos?.length || 0,
      artigosComAlteracao,
      totalAlteracoes: alteracoesParaInserir.length,
      tiposEncontrados,
      elementosEncontrados
    };

    console.log(`[extrair-alteracoes-lei] Resultado:`, resultado);

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[extrair-alteracoes-lei] Erro geral:`, error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
