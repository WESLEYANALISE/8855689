import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regras de formatação padrão
const REGRAS_PADRAO = {
  quebraDuplaAntes: ['TÍTULO', 'CAPÍTULO', 'LIVRO', 'SEÇÃO', 'SUBSEÇÃO', 'PARTE'],
  quebraSimpleAntes: ['§', 'Parágrafo único'],
  artigosComSufixo: true, // Art. 1-A, 1-B são artigos separados
  manterTextos: ['(VETADO)', '(Revogado)', '(revogado)', 'Vetado', 'Revogado'],
  removerTextos: [
    /\(Inclu[íi]d[oa]\s+pel[aoe]\s+[^)]+\)/gi,
    /\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+[^)]+\)/gi,
    /\(Vide\s+[^)]+\)/gi,
    /\(Regulamento\)/gi,
    /\(Vig[êe]ncia\)/gi,
  ],
  corrigirEspacos: true,
  corrigirPontuacao: true,
  normalizarArtigos: true, // Art. 1 o → Art. 1º
};

interface RegraFormatacao {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  tipo: 'quebra' | 'remover' | 'manter' | 'corrigir' | 'normalizar';
  valor?: string | RegExp;
}

interface ArtigoFormatado {
  numero: string | null;
  texto: string;
  ordem: number;
  tipo: 'artigo' | 'titulo' | 'capitulo' | 'secao' | 'ementa' | 'preambulo' | 'cabeçalho';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json();
  const { textoBruto, tableName } = body;
  
  // Mesclar regras do frontend com padrões, tratando formato diferente
  const regrasRecebidas = body.regras || {};
  const regras = {
    quebraDuplaAntes: regrasRecebidas.quebraDuplaAntes ?? REGRAS_PADRAO.quebraDuplaAntes,
    quebraSimpleAntes: regrasRecebidas.quebraSimpleAntes ?? REGRAS_PADRAO.quebraSimpleAntes,
    artigosComSufixo: regrasRecebidas.artigosComSufixo ?? REGRAS_PADRAO.artigosComSufixo,
    manterTextos: regrasRecebidas.manterTextos ?? REGRAS_PADRAO.manterTextos,
    removerTextos: REGRAS_PADRAO.removerTextos, // Sempre usar padrão (regex não serializa)
    corrigirEspacos: regrasRecebidas.corrigirEspacos ?? REGRAS_PADRAO.corrigirEspacos,
    corrigirPontuacao: regrasRecebidas.corrigirPontuacao ?? REGRAS_PADRAO.corrigirPontuacao,
    normalizarArtigos: regrasRecebidas.normalizarArtigos ?? REGRAS_PADRAO.normalizarArtigos,
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 ETAPA 2: FORMATAÇÃO E TRIAGEM');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📋 Tabela: ${tableName}`);
  console.log(`📊 Texto bruto: ${textoBruto?.length || 0} caracteres`);
  console.log('📋 Regras aplicadas:', JSON.stringify(regras, null, 2));

  try {
    if (!textoBruto || textoBruto.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto bruto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 2.1: Limpar e normalizar texto
    console.log('🧹 2.1 - Limpando texto...');
    let textoLimpo = limparTexto(textoBruto, regras);

    // ETAPA 2.2: Extrair artigos e estrutura
    console.log('📚 2.2 - Extraindo artigos...');
    const artigos = extrairArtigos(textoLimpo, regras);

    // ETAPA 2.3: Aplicar formatação final
    console.log('✨ 2.3 - Aplicando formatação final...');
    const artigosFormatados = formatarArtigos(artigos, regras);

    // Estatísticas
    const artigosNumerados = artigosFormatados.filter(a => a.numero !== null);
    const cabeçalhos = artigosFormatados.filter(a => a.tipo !== 'artigo');

    console.log(`✅ Formatação concluída:`);
    console.log(`   📊 Total de registros: ${artigosFormatados.length}`);
    console.log(`   📊 Artigos numerados: ${artigosNumerados.length}`);
    console.log(`   📊 Cabeçalhos/Títulos: ${cabeçalhos.length}`);

    // Analisar sequência de artigos
    const analise = analisarSequencia(artigosNumerados);

    return new Response(
      JSON.stringify({
        success: true,
        artigos: artigosFormatados.map(a => ({
          "Número do Artigo": a.numero,
          Artigo: a.texto,
          ordem_artigo: a.ordem,
          tipo: a.tipo,
        })),
        totalArtigos: artigosFormatados.length,
        artigosNumerados: artigosNumerados.length,
        cabecalhos: cabeçalhos.length,
        analise,
        regrasAplicadas: Object.keys(regras),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na formatação:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function limparTexto(texto: string, regras: typeof REGRAS_PADRAO): string {
  let resultado = texto;

  // IMPORTANTE: Remover links markdown [texto](url) - manter apenas o texto
  resultado = resultado.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remover URLs soltas (http, https, www)
  resultado = resultado.replace(/https?:\/\/[^\s)\]]+/gi, '');
  resultado = resultado.replace(/www\.[^\s)\]]+/gi, '');
  
  // Remover parênteses vazios ou com apenas espaços após remover URLs
  resultado = resultado.replace(/\(\s*\)/g, '');
  
  // Remover colchetes vazios
  resultado = resultado.replace(/\[\s*\]/g, '');

  // Remover formatação Markdown
  // Remover negrito/itálico (**texto**, *texto*, __texto__, _texto_)
  resultado = resultado.replace(/\*\*([^*]+)\*\*/g, '$1');
  resultado = resultado.replace(/\*([^*]+)\*/g, '$1');
  resultado = resultado.replace(/__([^_]+)__/g, '$1');
  resultado = resultado.replace(/_([^_]+)_/g, '$1');
  
  // Remover asteriscos e underlines soltos
  resultado = resultado.replace(/\*+/g, '');
  resultado = resultado.replace(/\\+\*/g, '');
  resultado = resultado.replace(/\\_/g, '');
  
  // Remover tags HTML (<br>, <br/>, etc)
  resultado = resultado.replace(/<[^>]+>/gi, ' ');
  
  // Remover pipes (|) usados em tabelas markdown
  resultado = resultado.replace(/\|+/g, ' ');
  
  // Remover hífens repetidos usados em tabelas markdown
  resultado = resultado.replace(/---+/g, ' ');
  
  // Remover backslashes escapados
  resultado = resultado.replace(/\\\\/g, ' ');
  resultado = resultado.replace(/\\/g, '');
  
  // Remover caracteres especiais não aceitos em textos legais
  // Mantém apenas: letras, números, pontuação básica (.,;:), parênteses, hífen, travessão, aspas, grau, ordinal, espaços, quebras de linha
  resultado = resultado.replace(/[!?#@$%&*+=\[\]{}<>|\\~^`]/g, '');
  
  // Remover underscores soltos
  resultado = resultado.replace(/_/g, '');

  // Remover textos indesejados (referências a outras leis)
  for (const padrao of regras.removerTextos) {
    resultado = resultado.replace(padrao, '');
  }

  // Corrigir espaços (IMPORTANTE: usar [^\S\n]+ para NÃO remover quebras de linha)
  if (regras.corrigirEspacos) {
    resultado = resultado
      .replace(/[^\S\n]+/g, ' ')  // Múltiplos espaços (exceto \n) → um espaço
      .replace(/ +\n/g, '\n')     // Espaços antes de \n
      .replace(/\n +/g, '\n')     // Espaços depois de \n
      .replace(/\n{3,}/g, '\n\n'); // Máximo 2 quebras seguidas
  }

  // Corrigir pontuação
  if (regras.corrigirPontuacao) {
    resultado = resultado
      .replace(/ +([.,;:!?])/g, '$1')
      .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2');
  }

  // Normalizar artigos (Art. 1 o → Art. 1º)
  if (regras.normalizarArtigos) {
    resultado = resultado
      .replace(/Art\s*\.\s*(\d+)\s*[oº°ª]\s*/gi, 'Art. $1º ')
      .replace(/Art\s*\.\s*(\d+)\s*[-–]\s*([A-Z])\s*/gi, 'Art. $1-$2 ')
      .replace(/§\s*(\d+)\s*[oº°ª]\s*/gi, '§ $1º ')
      .replace(/Parágrafo\s+único\s*[.:\-–]/gi, 'Parágrafo único.');
  }

  // Garantir quebras antes de elementos estruturais
  for (const elemento of regras.quebraDuplaAntes) {
    const regex = new RegExp(`([^\n])\\s*(${elemento})`, 'gi');
    resultado = resultado.replace(regex, '$1\n\n$2');
  }

  // Garantir quebras antes de parágrafos
  for (const elemento of regras.quebraSimpleAntes) {
    const regex = new RegExp(`([^\n])\\s*(${elemento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    resultado = resultado.replace(regex, '$1\n\n$2');
  }

  return resultado.trim();
}

function extrairArtigos(texto: string, regras: typeof REGRAS_PADRAO): ArtigoFormatado[] {
  const resultado: ArtigoFormatado[] = [];
  let ordem = 1;

  console.log('📊 Iniciando extração de artigos...');
  console.log(`📊 Texto tem ${texto.length} caracteres`);

  // Primeiro, vamos detectar padrões de artigos no texto
  const artigosEncontrados = texto.match(/Art\.?\s*\d+[ºª°]?[-–]?[A-Z]?\s*[-–.]?\s*/gi);
  console.log(`📊 Padrões de artigo encontrados: ${artigosEncontrados?.length || 0}`);

  // Dividir texto por artigos usando split
  // Regex que captura "Art. Xº" ou "Art. X" no início de linha ou após quebra
  const regexSplit = /(?=Art\.?\s*\d+[ºª°]?(?:-[A-Z])?\s*[-–.]?\s)/gi;
  const partes = texto.split(regexSplit).filter(p => p.trim().length > 0);
  
  console.log(`📊 Partes após split: ${partes.length}`);

  for (const parte of partes) {
    const parteLimpa = parte.trim();
    if (!parteLimpa) continue;

    // Verificar se começa com Art.
    const matchArtigo = parteLimpa.match(/^Art\.?\s*(\d+(?:-[A-Z])?)[ºª°]?\s*[-–.]?\s*/i);
    
    if (matchArtigo) {
      // É um artigo
      let numeroArtigo = matchArtigo[1];
      // Normalizar o número
      if (!numeroArtigo.includes('-')) {
        numeroArtigo = numeroArtigo + 'º';
      }
      
      const textoArtigo = parteLimpa.substring(matchArtigo[0].length).trim();
      const textoCompleto = `Art. ${numeroArtigo} ${textoArtigo}`;
      
      resultado.push({
        numero: numeroArtigo,
        texto: textoCompleto,
        ordem: ordem++,
        tipo: 'artigo',
      });
    } else {
      // Verificar se é cabeçalho (TÍTULO, CAPÍTULO, etc)
      const ehCabecalho = /^(TÍTULO|CAPÍTULO|LIVRO|SEÇÃO|SUBSEÇÃO|PARTE)\s+[IVXLCDM]+/i.test(parteLimpa) ||
                         (parteLimpa === parteLimpa.toUpperCase() && parteLimpa.length < 100 && /^(D[OA]S?\s|DAS?\s)/.test(parteLimpa));
      
      if (ehCabecalho) {
        resultado.push({
          numero: null,
          texto: parteLimpa,
          ordem: ordem++,
          tipo: 'cabeçalho',
        });
      } else if (parteLimpa.length > 50 && resultado.length === 0) {
        // Provavelmente preâmbulo ou ementa (antes do primeiro artigo)
        resultado.push({
          numero: null,
          texto: parteLimpa,
          ordem: ordem++,
          tipo: 'preambulo',
        });
      }
      // Ignorar fragmentos pequenos que não são artigos
    }
  }

  console.log(`📊 Resultado: ${resultado.length} registros extraídos`);
  console.log(`📊 Artigos: ${resultado.filter(r => r.tipo === 'artigo').length}`);
  console.log(`📊 Cabeçalhos: ${resultado.filter(r => r.tipo === 'cabeçalho').length}`);
  
  return resultado;
}

function formatarArtigos(artigos: ArtigoFormatado[], regras: typeof REGRAS_PADRAO): ArtigoFormatado[] {
  return artigos.map(artigo => {
    let texto = artigo.texto;

    // ═══════════════════════════════════════════════════════════════════
    // QUEBRAS DE LINHA PARA ESTRUTURA LEGAL
    // ═══════════════════════════════════════════════════════════════════
    
    // 1. TÍTULOS em linhas separadas (TÍTULO I, TÍTULO II, etc. e seu nome)
    // Exemplo: "TÍTULO I DOS DIREITOS" → "TÍTULO I\n\nDOS DIREITOS"
    texto = texto.replace(/(TÍTULO\s+[IVXLCDM]+)\s+/gi, '\n\n$1\n\n');
    
    // 2. CAPÍTULOS em linhas separadas
    texto = texto.replace(/(CAPÍTULO\s+[IVXLCDM]+)\s+/gi, '\n\n$1\n\n');
    
    // 3. SEÇÕES em linhas separadas
    texto = texto.replace(/(SEÇÃO\s+[IVXLCDM]+)\s+/gi, '\n\n$1\n\n');
    
    // 4. SUBSEÇÕES em linhas separadas
    texto = texto.replace(/(SUBSEÇÃO\s+[IVXLCDM]+)\s+/gi, '\n\n$1\n\n');
    
    // 5. LIVROS em linhas separadas
    texto = texto.replace(/(LIVRO\s+[IVXLCDM]+)\s+/gi, '\n\n$1\n\n');
    
    // 6. PARTE em linhas separadas
    texto = texto.replace(/(PARTE\s+(?:GERAL|ESPECIAL|PRIMEIRA|SEGUNDA|[IVXLCDM]+))\s+/gi, '\n\n$1\n\n');
    
    // 7. Nomes de títulos/capítulos (DAS, DOS, DA, DO seguido de texto em maiúsculas)
    texto = texto.replace(/\s+(D[OA]S?\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+?)(?=\s+Art\.|$|\n)/gi, '\n\n$1\n\n');
    
    // ═══════════════════════════════════════════════════════════════════
    // QUEBRAS DE LINHA DUPLA ENTRE ELEMENTOS SEQUENCIAIS
    // ═══════════════════════════════════════════════════════════════════
    
    // 8. INCISOS ROMANOS sequenciais (I –, II –, III –, IV –, V –, etc.)
    // Quebra dupla ANTES de cada inciso romano
    texto = texto.replace(/([;:.])\s*(I\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(II\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(III\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(IV\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(V\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(VI\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(VII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(VIII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(IX\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(X\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XI\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XIII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XIV\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XV\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XVI\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XVII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XVIII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XIX\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XX\s*[-–—])/g, '$1\n\n$2');
    // Continuar para números maiores (XXI a XL)
    texto = texto.replace(/([;:.])\s*(XXI\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XXII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XXIII\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XXIV\s*[-–—])/g, '$1\n\n$2');
    texto = texto.replace(/([;:.])\s*(XXV\s*[-–—])/g, '$1\n\n$2');
    
    // 9. PARÁGRAFOS sequenciais (§ 1º, § 2º, etc.)
    texto = texto.replace(/([.;])\s*(§\s*\d+[ºª°]?)/g, '$1\n\n$2');
    
    // 10. PARÁGRAFO ÚNICO
    texto = texto.replace(/([.;])\s*(Parágrafo\s+único)/gi, '$1\n\n$2');
    
    // 11. ALÍNEAS sequenciais (a), b), c), etc. ou a –, b –, c –)
    texto = texto.replace(/([;:])\s*([a-z]\s*[)–—-])/g, '$1\n\n$2');
    
    // ═══════════════════════════════════════════════════════════════════
    // LIMPEZA FINAL
    // ═══════════════════════════════════════════════════════════════════
    
    // Limpar quebras excessivas (mais de 2 quebras seguidas)
    texto = texto.replace(/\n{3,}/g, '\n\n');
    
    // Remover quebras no início
    texto = texto.replace(/^\n+/, '');
    
    // Trim final
    texto = texto.trim();

    return {
      ...artigo,
      texto,
    };
  });
}

function analisarSequencia(artigos: ArtigoFormatado[]): {
  primeiroArtigo: string | null;
  ultimoArtigo: string | null;
  totalArtigos: number;
  artigosEsperados: number;
  lacunas: Array<{ de: number; ate: number; quantidade: number }>;
  percentualExtracao: number;
} {
  if (artigos.length === 0) {
    return {
      primeiroArtigo: null,
      ultimoArtigo: null,
      totalArtigos: 0,
      artigosEsperados: 0,
      lacunas: [],
      percentualExtracao: 0,
    };
  }

  // Extrair números dos artigos
  const numeros: number[] = [];
  for (const artigo of artigos) {
    if (!artigo.numero) continue;
    const match = artigo.numero.match(/^(\d+)/);
    if (match) {
      numeros.push(parseInt(match[1]));
    }
  }

  if (numeros.length === 0) {
    return {
      primeiroArtigo: null,
      ultimoArtigo: null,
      totalArtigos: 0,
      artigosEsperados: 0,
      lacunas: [],
      percentualExtracao: 0,
    };
  }

  numeros.sort((a, b) => a - b);
  const primeiro = numeros[0];
  const ultimo = numeros[numeros.length - 1];
  const artigosEsperados = ultimo - primeiro + 1;

  // Detectar lacunas
  const lacunas: Array<{ de: number; ate: number; quantidade: number }> = [];
  const numerosSet = new Set(numeros);

  let inicioLacuna: number | null = null;
  for (let i = primeiro; i <= ultimo; i++) {
    if (!numerosSet.has(i)) {
      if (inicioLacuna === null) {
        inicioLacuna = i;
      }
    } else if (inicioLacuna !== null) {
      lacunas.push({
        de: inicioLacuna,
        ate: i - 1,
        quantidade: i - inicioLacuna,
      });
      inicioLacuna = null;
    }
  }

  // Fechar lacuna final se houver
  if (inicioLacuna !== null) {
    lacunas.push({
      de: inicioLacuna,
      ate: ultimo,
      quantidade: ultimo - inicioLacuna + 1,
    });
  }

  const percentualExtracao = Math.round((numeros.length / artigosEsperados) * 100);

  return {
    primeiroArtigo: primeiro + 'º',
    ultimoArtigo: ultimo + 'º',
    totalArtigos: numeros.length,
    artigosEsperados,
    lacunas,
    percentualExtracao,
  };
}
