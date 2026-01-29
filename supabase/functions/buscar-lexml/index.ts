import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtigoLexML {
  numero: string;
  texto: string;
  fonte: 'lexml' | 'planalto';
}

interface LexMLResponse {
  success: boolean;
  urn?: string;
  titulo?: string;
  artigos?: ArtigoLexML[];
  totalArtigos?: number;
  xmlOriginal?: string;
  urlFonte?: string;
  metodo?: string;
  error?: string;
}

// Mapeamento: Nome da tabela => URL direta do Planalto (fallback)
const URLS_PLANALTO: Record<string, string> = {
  'CF - Constituição Federal': 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm',
  'CC - Código Civil': 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
  'CP - Código Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
  'CPC – Código de Processo Civil': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  'CPP – Código de Processo Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
  'CLT - Consolidação das Leis do Trabalho': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm',
  'CTN – Código Tributário Nacional': 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm',
  'CDC – Código de Defesa do Consumidor': 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  'CE – Código Eleitoral': 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm',
  'CF - Código Florestal': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/L12651compilado.htm',
  'CP - Código de Pesca': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11959.htm',
  'CA - Código de Águas': 'https://www.planalto.gov.br/ccivil_03/decreto/d24643compilado.htm',
  'CBA Código Brasileiro de Aeronáutica': 'https://www.planalto.gov.br/ccivil_03/leis/l7565compilado.htm',
  'CBT Código Brasileiro de Telecomunicações': 'https://www.planalto.gov.br/ccivil_03/leis/l4117compilado.htm',
  'CCOM – Código Comercial': 'https://www.planalto.gov.br/ccivil_03/leis/lim/lim556compilado.htm',
  'CDM – Código de Minas': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del227compilado.htm',
  'CPI - Código de Propriedade Industrial': 'https://www.planalto.gov.br/ccivil_03/leis/l9279.htm',
  'CC - Código de Caça': 'https://www.planalto.gov.br/ccivil_03/leis/L5197compilado.htm',
  'CDUS - Código de Defesa do Usuário': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm',
  'LEI – Lei de Execuções Penais': 'https://www.planalto.gov.br/ccivil_03/leis/l7210.htm',
  'LEF - Lei de Execução Fiscal': 'https://www.planalto.gov.br/ccivil_03/leis/l6830.htm',
  'LF – Lei de Falências': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm',
  'LINDB – Lei de Introdução às Normas do Direito Brasileiro': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del4657compilado.htm',
  'LIA – Lei de Improbidade Administrativa': 'https://www.planalto.gov.br/ccivil_03/leis/l8429.htm',
  'LRF – Lei de Responsabilidade Fiscal': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm',
  'LGPD – Lei Geral de Proteção de Dados': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
  'LAI – Lei de Acesso à Informação': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
  'EI – Estatuto do Idoso': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm',
  'EPD – Estatuto da Pessoa com Deficiência': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
  'EIG – Estatuto da Igualdade Racial': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12288.htm',
  'ET – Estatuto da Terra': 'https://www.planalto.gov.br/ccivil_03/leis/l4504.htm',
  'EC – Estatuto da Cidade': 'https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm',
  'EOAB – Estatuto da OAB': 'https://www.planalto.gov.br/ccivil_03/leis/l8906.htm',
  'ECA – Estatuto da Criança e do Adolescente': 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm',
  // Estatutos adicionais
  'EST - Estatuto da Juventude': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm',
  'ED – Estatuto do Desarmamento': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm',
  'EE – Estatuto do Estrangeiro': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13445.htm',
  'EM – Estatuto dos Militares': 'https://www.planalto.gov.br/ccivil_03/leis/l6880compilada.htm',
  'ET – Estatuto do Torcedor': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.671.htm',
  'ERA – Estatuto do Refugiado': 'https://www.planalto.gov.br/ccivil_03/leis/l9474.htm',
  // Códigos adicionais
  'CPM – Código Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001.htm',
  'CPPM - Código de Processo Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002.htm',
  'CTB – Código de Trânsito Brasileiro': 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  // Leis especiais
  'LDA – Lei de Direitos Autorais': 'https://www.planalto.gov.br/ccivil_03/leis/l9610.htm',
  'LAM – Lei de Abuso de Autoridade': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13869.htm',
  'LD – Lei de Drogas': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm',
  'LCA – Lei de Crimes Ambientais': 'https://www.planalto.gov.br/ccivil_03/leis/l9605.htm',
  'LCH – Lei de Crimes Hediondos': 'https://www.planalto.gov.br/ccivil_03/leis/l8072.htm',
  'LAP – Lei de Ação Popular': 'https://www.planalto.gov.br/ccivil_03/leis/l4717.htm',
  'LACP – Lei de Ação Civil Pública': 'https://www.planalto.gov.br/ccivil_03/leis/l7347compilada.htm',
  'LArb – Lei de Arbitragem': 'https://www.planalto.gov.br/ccivil_03/leis/l9307.htm',
  'LL – Lei do Inquilinato': 'https://www.planalto.gov.br/ccivil_03/leis/l8245.htm',
  'LMS – Lei do Mandado de Segurança': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm',
  'LRE – Lei de Recuperação de Empresas': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm',
  'LSA – Lei das Sociedades Anônimas': 'https://www.planalto.gov.br/ccivil_03/leis/l6404compilada.htm',
  'LPE - Lei do Processo Eletrônico': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11419.htm',
  'LMV – Lei Maria da Penha': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm',
  'LJE – Lei dos Juizados Especiais': 'https://www.planalto.gov.br/ccivil_03/leis/l9099.htm',
  'LJEF – Lei dos Juizados Especiais Federais': 'https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10259.htm',
  'LJEFP – Lei dos Juizados Especiais da Fazenda Pública': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12153.htm',
};

// Mapeia nome da lei para URN LexML
function construirURN(nomeLei: string): string | null {
  const mapeamentoLeis: Record<string, string> = {
    'CF - Constituição Federal': 'urn:lex:br:federal:constituicao:1988-10-05;1988',
    'CC - Código Civil': 'urn:lex:br:federal:lei:2002-01-10;10406',
    'CP - Código Penal': 'urn:lex:br:federal:decreto.lei:1940-12-07;2848',
    'CPC – Código de Processo Civil': 'urn:lex:br:federal:lei:2015-03-16;13105',
    'CPP – Código de Processo Penal': 'urn:lex:br:federal:decreto.lei:1941-10-03;3689',
    'CLT - Consolidação das Leis do Trabalho': 'urn:lex:br:federal:decreto.lei:1943-05-01;5452',
    'CTN – Código Tributário Nacional': 'urn:lex:br:federal:lei:1966-10-25;5172',
    'CDC – Código de Defesa do Consumidor': 'urn:lex:br:federal:lei:1990-09-11;8078',
    'ECA – Estatuto da Criança e do Adolescente': 'urn:lex:br:federal:lei:1990-07-13;8069',
    'CE – Código Eleitoral': 'urn:lex:br:federal:lei:1965-07-15;4737',
    'CF - Código Florestal': 'urn:lex:br:federal:lei:2012-05-25;12651',
    'CP - Código de Pesca': 'urn:lex:br:federal:lei:2009-06-29;11959',
    'CA - Código de Águas': 'urn:lex:br:federal:decreto:1934-07-10;24643',
    'CBA Código Brasileiro de Aeronáutica': 'urn:lex:br:federal:lei:1986-12-19;7565',
    'CBT Código Brasileiro de Telecomunicações': 'urn:lex:br:federal:lei:1962-08-27;4117',
    'CCOM – Código Comercial': 'urn:lex:br:federal:lei:1850-06-25;556',
    'CDM – Código de Minas': 'urn:lex:br:federal:decreto.lei:1967-02-28;227',
    'CPI - Código de Propriedade Industrial': 'urn:lex:br:federal:lei:1996-05-14;9279',
    'CC - Código de Caça': 'urn:lex:br:federal:lei:1967-01-03;5197',
    'LEI – Lei de Execuções Penais': 'urn:lex:br:federal:lei:1984-07-11;7210',
    'LEF - Lei de Execução Fiscal': 'urn:lex:br:federal:lei:1980-09-22;6830',
    'LF – Lei de Falências': 'urn:lex:br:federal:lei:2005-02-09;11101',
    'LINDB – Lei de Introdução às Normas do Direito Brasileiro': 'urn:lex:br:federal:decreto.lei:1942-09-04;4657',
    'LIA – Lei de Improbidade Administrativa': 'urn:lex:br:federal:lei:1992-06-02;8429',
    'LRF – Lei de Responsabilidade Fiscal': 'urn:lex:br:federal:lei.complementar:2000-05-04;101',
    'LGPD – Lei Geral de Proteção de Dados': 'urn:lex:br:federal:lei:2018-08-14;13709',
    'LAI – Lei de Acesso à Informação': 'urn:lex:br:federal:lei:2011-11-18;12527',
    'EI – Estatuto do Idoso': 'urn:lex:br:federal:lei:2003-10-01;10741',
    'EPD – Estatuto da Pessoa com Deficiência': 'urn:lex:br:federal:lei:2015-07-06;13146',
    'EIG – Estatuto da Igualdade Racial': 'urn:lex:br:federal:lei:2010-07-20;12288',
    'ET – Estatuto da Terra': 'urn:lex:br:federal:lei:1964-11-30;4504',
    'EC – Estatuto da Cidade': 'urn:lex:br:federal:lei:2001-07-10;10257',
    'EOAB – Estatuto da OAB': 'urn:lex:br:federal:lei:1994-07-04;8906',
    // Estatutos adicionais
    'EST - Estatuto da Juventude': 'urn:lex:br:federal:lei:2013-08-05;12852',
    'ED – Estatuto do Desarmamento': 'urn:lex:br:federal:lei:2003-12-22;10826',
    'EE – Estatuto do Estrangeiro': 'urn:lex:br:federal:lei:2017-05-24;13445',
    'EM – Estatuto dos Militares': 'urn:lex:br:federal:lei:1980-12-09;6880',
    'ET – Estatuto do Torcedor': 'urn:lex:br:federal:lei:2003-05-15;10671',
    'ERA – Estatuto do Refugiado': 'urn:lex:br:federal:lei:1997-07-22;9474',
    // Códigos adicionais
    'CPM – Código Penal Militar': 'urn:lex:br:federal:decreto.lei:1969-10-21;1001',
    'CPPM - Código de Processo Penal Militar': 'urn:lex:br:federal:decreto.lei:1969-10-21;1002',
    'CTB – Código de Trânsito Brasileiro': 'urn:lex:br:federal:lei:1997-09-23;9503',
    // Leis especiais
    'LDA – Lei de Direitos Autorais': 'urn:lex:br:federal:lei:1998-02-19;9610',
    'LAM – Lei de Abuso de Autoridade': 'urn:lex:br:federal:lei:2019-09-05;13869',
    'LD – Lei de Drogas': 'urn:lex:br:federal:lei:2006-08-23;11343',
    'LCA – Lei de Crimes Ambientais': 'urn:lex:br:federal:lei:1998-02-12;9605',
    'LCH – Lei de Crimes Hediondos': 'urn:lex:br:federal:lei:1990-07-25;8072',
    'LAP – Lei de Ação Popular': 'urn:lex:br:federal:lei:1965-06-29;4717',
    'LACP – Lei de Ação Civil Pública': 'urn:lex:br:federal:lei:1985-07-24;7347',
    'LArb – Lei de Arbitragem': 'urn:lex:br:federal:lei:1996-09-23;9307',
    'LL – Lei do Inquilinato': 'urn:lex:br:federal:lei:1991-10-18;8245',
    'LMS – Lei do Mandado de Segurança': 'urn:lex:br:federal:lei:2009-08-07;12016',
    'LSA – Lei das Sociedades Anônimas': 'urn:lex:br:federal:lei:1976-12-15;6404',
    'LPE - Lei do Processo Eletrônico': 'urn:lex:br:federal:lei:2006-12-19;11419',
    'LMV – Lei Maria da Penha': 'urn:lex:br:federal:lei:2006-08-07;11340',
    'LJE – Lei dos Juizados Especiais': 'urn:lex:br:federal:lei:1995-09-26;9099',
    'LJEF – Lei dos Juizados Especiais Federais': 'urn:lex:br:federal:lei:2001-07-12;10259',
    'LJEFP – Lei dos Juizados Especiais da Fazenda Pública': 'urn:lex:br:federal:lei:2009-12-22;12153',
  };

  if (mapeamentoLeis[nomeLei]) {
    return mapeamentoLeis[nomeLei];
  }

  for (const [key, urn] of Object.entries(mapeamentoLeis)) {
    if (nomeLei.includes(key) || key.includes(nomeLei)) {
      return urn;
    }
  }

  return null;
}

// Formata o texto do artigo preservando estrutura e corrigindo erros comuns
function formatarTextoArtigo(textoRaw: string): string {
  let texto = textoRaw;
  
  // Decodifica entidades HTML
  texto = texto
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  
  // ==========================================
  // CORREÇÕES DE FORMATAÇÃO JURÍDICA
  // ==========================================
  
  // 1. CORRIGIR "§ 1 o", "§ 2 o" etc -> "§ 1°", "§ 2°" (letra 'o' como ordinal)
  texto = texto.replace(/§\s*(\d+)\s+o\s+/gi, '§ $1° ');
  texto = texto.replace(/§\s*(\d+)\s+o$/gim, '§ $1°');
  
  // 2. CORRIGIR "Art. 1 o", "Art. 2 o" etc -> "Art. 1°", "Art. 2°"
  texto = texto.replace(/Art\.?\s*(\d+)\s+o\s+/gi, 'Art. $1° ');
  
  // 3. Padronizar ordinais: ª e º para ° (grau) em artigos e parágrafos
  texto = texto.replace(/(Art\.?\s*\d+)[ºª]/gi, '$1°');
  texto = texto.replace(/(§\s*\d+)[ºª]/gi, '$1°');
  
  // 4. REMOVER espaço antes de pontuação
  texto = texto.replace(/\s+([;:,.])/g, '$1');
  texto = texto.replace(/\)\s+;/g, ');');
  
  // ==========================================
  // REMOVER REFERÊNCIAS DE ALTERAÇÃO (MANTER VETADO/REVOGADO)
  // ==========================================
  texto = texto.replace(/\s*\((?:Incluído|Incluída|Inclu[ií]do|Alterado|Redação\s+dada|Acrescentado|Acrescido|Inserido|Renumerado|Nova\s+redação|Regulamento|Vigência|Produção\s+de\s+efeito|Vide\s+ADI|Vide\s+Decreto|Vide\s+Lei|Vide\s+Medida)[^)]*\)/gi, '');
  
  // ==========================================
  // FORMATAÇÃO DE ESTRUTURA
  // ==========================================
  
  // Quebra de linha dupla antes de TÍTULO, CAPÍTULO, LIVRO, SEÇÃO
  texto = texto.replace(/([.!?\w])\s*((?:TÍTULO|CAPÍTULO|LIVRO|SEÇÃO|SUBSEÇÃO|PARTE)\s+[IVXLCDM\d]+)/gi, '$1\n\n$2');
  
  // Quebra de linha simples antes de parágrafos (§)
  texto = texto.replace(/([.!?])\s*(§\s*\d+°?)/g, '$1\n$2');
  texto = texto.replace(/([.!?])\s*(Parágrafo único)/gi, '$1\n$2');
  
  // Quebra de linha simples antes de incisos (I -, II -, etc.)
  texto = texto.replace(/([.;:])\s+((?:X{0,3}(?:IX|IV|V?I{0,3}))\s*[-–])/g, '$1\n$2');
  
  // Quebra de linha simples antes de alíneas (a), b), etc.)
  texto = texto.replace(/([.;:])\s+([a-z]\))/g, '$1\n$2');
  
  // ==========================================
  // LIMPEZA FINAL
  // ==========================================
  
  // Remove espaços múltiplos (mas mantém um espaço)
  texto = texto.replace(/[ \t]+/g, ' ');
  
  // Remove espaços no início das linhas
  texto = texto.replace(/\n[ \t]+/g, '\n');
  
  // Normaliza quebras de linha (máximo 2 consecutivas)
  texto = texto.replace(/\n{3,}/g, '\n\n');
  
  // Remove quebras de linha no início e fim
  texto = texto.replace(/^\n+/, '').replace(/\n+$/, '');
  
  return texto.trim();
}

// Extrai artigos do HTML do Planalto
function extrairArtigosDoPlanalto(html: string): ArtigoLexML[] {
  const artigos: ArtigoLexML[] = [];
  
  // Remove scripts e styles
  let textoHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // MÉTODO 1: Usar âncoras do Planalto (mais confiável)
  // Inclui artigos com letra: art1, art1a, art2, art2b, etc.
  const regexAncora = /<a[^>]*name="art(\d+)([a-z]?)"[^>]*><\/a>/gi;
  const ancoras: { numero: string; posicao: number; ordem: number }[] = [];
  let matchAncora;
  
  while ((matchAncora = regexAncora.exec(textoHtml)) !== null) {
    const numBase = matchAncora[1];
    const letra = matchAncora[2] || '';
    // Criar identificador único: "1", "1-A", "2", "2-B"
    const numero = letra ? `${numBase}-${letra.toUpperCase()}` : numBase;
    // Ordem numérica para comparação: 1.0, 1.1 (A), 1.2 (B), 2.0, etc.
    const ordem = parseInt(numBase) + (letra ? (letra.charCodeAt(0) - 96) * 0.01 : 0);
    
    ancoras.push({ 
      numero,
      posicao: matchAncora.index,
      ordem
    });
  }
  
  console.log(`📌 Encontradas ${ancoras.length} âncoras de artigos`);

  if (ancoras.length > 0) {
    // Ordenar por posição
    ancoras.sort((a, b) => a.posicao - b.posicao);
    
    for (let i = 0; i < ancoras.length; i++) {
      const inicio = ancoras[i].posicao;
      const fim = i < ancoras.length - 1 ? ancoras[i + 1].posicao : textoHtml.length;
      const numero = ancoras[i].numero;
      const ordem = ancoras[i].ordem;
      
      // Verificar se é sequencial (para evitar pular artigos referenciados no meio)
      // Usa ordem numérica para comparação
      if (i > 0) {
        const ordemAnterior = ancoras[i - 1].ordem;
        // Se a diferença for maior que 10, provavelmente é referência
        if (ordem - ordemAnterior > 10) {
          console.log(`⚠️ Pulando art ${numero} (não sequencial após ${ancoras[i - 1].numero})`);
          continue;
        }
      }
      
      let conteudoHtml = textoHtml.substring(inicio, fim);
      
      // Converter HTML para texto preservando estrutura
      let conteudo = conteudoHtml
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      
      conteudo = formatarTextoArtigo(conteudo);
      
      if (conteudo.length > 10) {
        // Formatar número: "1" -> "1º", "1-A" -> "1º-A", "10" -> "10", "10-B" -> "10-B"
        let numeroNorm: string;
        if (numero.includes('-')) {
          const [base, letra] = numero.split('-');
          const baseNum = parseInt(base);
          numeroNorm = baseNum <= 9 ? `${base}º-${letra}` : `${base}-${letra}`;
        } else {
          const baseNum = parseInt(numero);
          numeroNorm = baseNum <= 9 ? `${numero}º` : numero;
        }
        
        artigos.push({
          numero: numeroNorm,
          texto: conteudo,
          fonte: 'planalto'
        });
      }
    }
  }

  // MÉTODO 2: Fallback com regex (se âncoras não funcionaram)
  if (artigos.length === 0) {
    console.log('📝 Usando fallback com regex...');
    
    // Limpar HTML para texto
    let textoLimpo = textoHtml
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
    
    // Regex que captura artigos reais (início de linha ou após quebra dupla)
    // Evita capturar referências como "Art. 20 desta Lei"
    const regexArtigo = /(?:^|\n\n)\s*(Art\.?\s*(\d+)[ºª°]?\.?\s*)([\s\S]*?)(?=\n\n\s*Art\.?\s*\d+[ºª°]?\.?\s+[A-Z]|$)/gi;
    
    let match;
    let ultimoNumero = 0;
    
    while ((match = regexArtigo.exec(textoLimpo)) !== null) {
      const numero = parseInt(match[2]);
      let conteudo = match[1] + match[3];
      
      // Só aceitar se for sequencial ou próximo (evita referências soltas)
      // Permite saltos pequenos (artigos revogados)
      if (ultimoNumero > 0 && numero !== ultimoNumero + 1 && Math.abs(numero - ultimoNumero) > 5) {
        // Verificar se parece referência (texto curto ou "desta Lei")
        if (conteudo.length < 100 || /desta\s+Lei/i.test(conteudo.substring(0, 50))) {
          continue;
        }
      }
      
      conteudo = formatarTextoArtigo(conteudo.trim());
      
      if (conteudo.length > 10) {
        const numeroNorm = numero <= 9 ? `${numero}º` : String(numero);
        artigos.push({
          numero: numeroNorm,
          texto: conteudo,
          fonte: 'planalto'
        });
        ultimoNumero = numero;
      }
    }
  }

  console.log(`📊 Artigos extraídos: ${artigos.length}`);
  return artigos;
}

// Busca diretamente no Planalto (fallback principal)
async function buscarNoPlanalto(nomeLei: string): Promise<LexMLResponse> {
  const url = URLS_PLANALTO[nomeLei];
  
  if (!url) {
    console.log(`❌ Nenhuma URL do Planalto mapeada para: ${nomeLei}`);
    return { success: false, error: `Lei "${nomeLei}" não possui URL do Planalto mapeada` };
  }

  console.log(`📡 Buscando direto no Planalto: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP Planalto: ${response.status}`);
      return { success: false, error: `Erro HTTP Planalto: ${response.status}` };
    }

    // Planalto usa ISO-8859-1, precisamos decodificar corretamente
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-1');
    const html = decoder.decode(arrayBuffer);
    console.log(`📥 HTML Planalto: ${html.length} caracteres`);

    const artigos = extrairArtigosDoPlanalto(html);

    return {
      success: true,
      titulo: nomeLei,
      artigos,
      totalArtigos: artigos.length,
      urlFonte: url,
      metodo: 'planalto_direto'
    };

  } catch (error) {
    console.error(`❌ Erro ao buscar Planalto:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Busca via resolver URN do LexML (redireciona para Planalto)
async function buscarViaResolverLexML(urn: string, nomeLei: string): Promise<LexMLResponse> {
  console.log(`🔗 Tentando resolver URN: ${urn}`);
  
  try {
    const resolverUrl = `https://www.lexml.gov.br/urn/${urn}`;
    
    const response = await fetch(resolverUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });

    const finalUrl = response.url;
    console.log(`🔗 URL final: ${finalUrl}`);

    // Se redirecionou para o Planalto, extrair artigos
    if (finalUrl.includes('planalto.gov.br') && response.ok) {
      // Planalto usa ISO-8859-1
      const arrayBuffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const html = decoder.decode(arrayBuffer);
      const artigos = extrairArtigosDoPlanalto(html);
      
      if (artigos.length > 0) {
        return {
          success: true,
          urn,
          titulo: nomeLei,
          artigos,
          totalArtigos: artigos.length,
          urlFonte: finalUrl,
          metodo: 'lexml_resolver'
        };
      }
    }

    // Se ainda está no LexML, tentar extrair link do Planalto da página
    if (finalUrl.includes('lexml.gov.br') && response.ok) {
      const html = await response.text();
      
      // Buscar link para Planalto na página do LexML
      const planaltoMatch = html.match(/href="(https?:\/\/www\.planalto\.gov\.br[^"]+)"/i);
      
      if (planaltoMatch) {
        console.log(`🔗 Link Planalto encontrado na página LexML: ${planaltoMatch[1]}`);
        
        const planaltoResponse = await fetch(planaltoMatch[1], {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (planaltoResponse.ok) {
          // Planalto usa ISO-8859-1
          const planaltoBuffer = await planaltoResponse.arrayBuffer();
          const planaltoDecoder = new TextDecoder('iso-8859-1');
          const planaltoHtml = planaltoDecoder.decode(planaltoBuffer);
          const artigos = extrairArtigosDoPlanalto(planaltoHtml);
          
          if (artigos.length > 0) {
            return {
              success: true,
              urn,
              titulo: nomeLei,
              artigos,
              totalArtigos: artigos.length,
              urlFonte: planaltoMatch[1],
              metodo: 'lexml_redirect_planalto'
            };
          }
        }
      }
    }

    console.log('⚠️ Resolver não obteve artigos, tentando fallback');
    return { success: false, error: 'Resolver não retornou artigos' };

  } catch (error) {
    console.error(`❌ Erro no resolver:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro resolver' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nomeLei, urn: urnDireta, buscarTexto } = await req.json();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 BUSCA LEXML INICIADA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Nome da lei: ${nomeLei || 'N/A'}`);
    console.log(`📋 URN direta: ${urnDireta || 'N/A'}`);
    console.log(`📋 Buscar texto: ${buscarTexto ? 'Sim' : 'Não'}`);

    if (!nomeLei && !urnDireta) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome da lei ou URN é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fluxo de busca com fallbacks:
    // 1. Tentar resolver URN do LexML (redireciona para Planalto)
    // 2. Se falhar, tentar buscar direto no Planalto

    let resultado: LexMLResponse = { success: false };
    const urn = urnDireta || construirURN(nomeLei);

    // Método 1: Tentar via resolver LexML
    if (urn) {
      console.log('📡 Método 1: Tentando resolver LexML...');
      resultado = await buscarViaResolverLexML(urn, nomeLei);
    }

    // Método 2: Fallback para Planalto direto
    if (!resultado.success || (resultado.artigos?.length || 0) === 0) {
      console.log('📡 Método 2: Fallback para Planalto direto...');
      resultado = await buscarNoPlanalto(nomeLei);
    }

    // Retornar resultado
    if (!resultado.success) {
      return new Response(
        JSON.stringify(resultado),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Sucesso! ${resultado.totalArtigos} artigos via ${resultado.metodo}`);

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ERRO:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
