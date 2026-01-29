import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com fallback
const GEMINI_KEYS = ['GEMINI_KEY_1', 'GEMINI_KEY_2', 'GEMINI_KEY_3'];

interface Artigo {
  "Número do Artigo": string | null;
  Artigo: string;
  ordem_artigo: number;
  tipo?: string;
}

interface ValidacaoLinha {
  indice: number;
  numero: string | null;
  status: 'ok' | 'alerta' | 'erro';
  problema?: string;
  sugestao?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { artigos } = await req.json();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 VALIDAÇÃO LINHA POR LINHA (STREAMING)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Total de artigos: ${artigos?.length || 0}`);

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!artigos || artigos.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Nenhum artigo para validar'
          })}\n\n`));
          controller.close();
          return;
        }

        // Enviar início
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          total: artigos.length,
          message: `Iniciando validação de ${artigos.length} linhas...`
        })}\n\n`));

        // Validar artigo por artigo
        let anteriores: string[] = [];
        const resultados: ValidacaoLinha[] = [];

        for (let i = 0; i < artigos.length; i++) {
          const artigo = artigos[i] as Artigo;
          
          // Enviar progresso
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            indice: i,
            total: artigos.length,
            numero: artigo["Número do Artigo"] || artigo.tipo || `Linha ${i + 1}`
          })}\n\n`));

          // Validar esta linha
          const validacao = validarLinha(artigo, i, anteriores, artigos);
          resultados.push(validacao);

          // Enviar resultado
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'validacao',
            ...validacao
          })}\n\n`));

          // Guardar para comparação
          anteriores.push(artigo["Número do Artigo"] || '');
          
          // Pequena pausa para não sobrecarregar
          await new Promise(r => setTimeout(r, 10));
        }

        // Calcular resumo
        const okCount = resultados.filter(r => r.status === 'ok').length;
        const alertaCount = resultados.filter(r => r.status === 'alerta').length;
        const erroCount = resultados.filter(r => r.status === 'erro').length;
        const percentualOk = Math.round((okCount / artigos.length) * 100);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          resumo: {
            total: artigos.length,
            ok: okCount,
            alertas: alertaCount,
            erros: erroCount,
            percentualOk,
            aprovado: percentualOk >= 90
          }
        })}\n\n`));

        controller.close();
      } catch (error) {
        console.error('❌ Erro na validação:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
});

// Função para extrair número do artigo corretamente (incluindo sufixos como -A, -B)
// REGRA: Artigos 1-9 usam símbolo ordinal (1º, 2º...), artigos 10+ NÃO usam (10, 11, 12...)
// IMPORTANTE: Só extrai artigo que INICIA o texto, não artigos citados entre aspas
function extrairNumeroArtigo(texto: string): string | null {
  if (!texto) return null;
  
  // Função auxiliar para formatar número do artigo
  const formatarNumeroArtigo = (num: string, sufixo?: string): string => {
    const numero = parseInt(num, 10);
    // Artigos 1-9 usam º, artigos 10+ não usam
    const formatado = numero < 10 ? `${num}º` : num;
    return sufixo ? `${formatado}-${sufixo}` : formatado;
  };
  
  // IMPORTANTE: Só procurar no INÍCIO do texto (após espaços em branco)
  // Ignorar artigos que estão entre aspas ou que são citações
  const textoLimpo = texto.trim();
  
  // Regex que captura APENAS artigo no início do texto
  // Com sufixo: Art. 7º-A, Art. 7-A (com hífen obrigatório para o sufixo)
  const matchComSufixo = textoLimpo.match(/^Art\.?\s*(\d+)[ºª°]?\s*[-–]\s*([A-Z])\b/i);
  if (matchComSufixo) {
    const num = matchComSufixo[1];
    const sufixo = matchComSufixo[2].toUpperCase();
    return formatarNumeroArtigo(num, sufixo);
  }
  
  // Artigo normal sem sufixo no INÍCIO: Art. 1º, Art. 2, etc.
  const matchNormal = textoLimpo.match(/^Art\.?\s*(\d+)[ºª°]?/i);
  if (matchNormal) {
    return formatarNumeroArtigo(matchNormal[1]);
  }
  
  return null;
}

// Função para detectar parágrafos/incisos/alíneas duplicados dentro do texto
function detectarDuplicatasInternas(texto: string): { tipo: string; duplicata: string } | null {
  const linhas = texto.split('\n');
  
  // Rastrear ocorrências
  const paragrafos: Map<string, number> = new Map();
  const incisos: Map<string, number> = new Map();
  const alineas: Map<string, number> = new Map();
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) continue;
    
    // Verificar parágrafo: § 1º, § 2º, Parágrafo único
    const matchParagrafo = linhaLimpa.match(/^(§\s*\d+[ºª°]?|Parágrafo\s+único)/i);
    if (matchParagrafo) {
      const id = matchParagrafo[1].replace(/\s+/g, ' ').trim();
      const normalizado = id.replace(/[ºª°]/g, 'º');
      paragrafos.set(normalizado, (paragrafos.get(normalizado) || 0) + 1);
    }
    
    // Verificar inciso: I –, II –, III –
    const matchInciso = linhaLimpa.match(/^([IVXLCDM]+)\s*[–-]/);
    if (matchInciso) {
      const id = matchInciso[1];
      incisos.set(id, (incisos.get(id) || 0) + 1);
    }
    
    // Verificar alínea: a), b), c)
    const matchAlinea = linhaLimpa.match(/^([a-z])\)/i);
    if (matchAlinea) {
      const id = matchAlinea[1].toLowerCase();
      alineas.set(id, (alineas.get(id) || 0) + 1);
    }
  }
  
  // Verificar duplicatas
  for (const [id, count] of paragrafos) {
    if (count > 1) {
      return { tipo: 'parágrafo', duplicata: id };
    }
  }
  
  for (const [id, count] of incisos) {
    if (count > 1) {
      return { tipo: 'inciso', duplicata: id };
    }
  }
  
  for (const [id, count] of alineas) {
    if (count > 1) {
      return { tipo: 'alínea', duplicata: `${id})` };
    }
  }
  
  return null;
}

function validarLinha(
  artigo: Artigo, 
  indice: number, 
  anteriores: string[],
  todosArtigos: Artigo[]
): ValidacaoLinha {
  const numero = artigo["Número do Artigo"];
  const texto = artigo.Artigo || '';
  const tipo = artigo.tipo;
  
  // 1. Cabeçalhos (TÍTULO, CAPÍTULO, etc.) - sempre OK se formatados corretamente
  if (tipo === 'cabeçalho' || tipo === 'preambulo' || tipo === 'ementa') {
    if (texto.length < 3) {
      return {
        indice,
        numero,
        status: 'alerta',
        problema: 'Cabeçalho muito curto',
        sugestao: 'Verificar se o texto está completo'
      };
    }
    return { indice, numero, status: 'ok' };
  }

  // 2. Verificar se tem número de artigo
  if (!numero) {
    return {
      indice,
      numero,
      status: 'alerta',
      problema: 'Linha sem número de artigo',
      sugestao: 'Pode ser continuação do artigo anterior ou cabeçalho não detectado'
    };
  }

  // 3. Normalizar número do artigo (incluindo sufixos -A, -B, etc.)
  // Extrair o número correto do texto do artigo
  const numeroExtraido = extrairNumeroArtigo(texto) || numero;
  
  // Normalizar número para comparação
  const normalizado = numero?.replace(/[ºª°]/g, 'º').replace(/\s+/g, '').trim() || '';
  
  // 4. Verificar duplicata de artigo (considerando sufixos)
  const anterioresNormalizados = anteriores.map(a => a?.replace(/[ºª°]/g, 'º').replace(/\s+/g, '').trim() || '');
  
  if (anterioresNormalizados.includes(normalizado)) {
    // Verificar se é um artigo com sufixo diferente (7º vs 7º-A)
    // Se o texto começa com Art. X-A e o número é só X, é um erro de extração
    if (numeroExtraido !== numero) {
      return {
        indice,
        numero: numeroExtraido,
        status: 'alerta',
        problema: `Número do artigo deveria ser ${numeroExtraido}`,
        sugestao: `Corrigir número de "${numero}" para "${numeroExtraido}"`
      };
    }
    
    return {
      indice,
      numero,
      status: 'erro',
      problema: `Artigo ${numero} duplicado`,
      sugestao: 'Remover uma das ocorrências'
    };
  }

  // 5. Verificar parágrafos/incisos/alíneas duplicados DENTRO do artigo
  const duplicataInterna = detectarDuplicatasInternas(texto);
  if (duplicataInterna) {
    return {
      indice,
      numero: numeroExtraido,
      status: 'alerta',
      problema: `${duplicataInterna.tipo} duplicado: ${duplicataInterna.duplicata}`,
      sugestao: `Manter apenas a última ocorrência do ${duplicataInterna.tipo} ${duplicataInterna.duplicata}`
    };
  }

  // 6. Verificar sequência numérica
  const matchNum = numero.match(/^(\d+)/);
  if (matchNum) {
    const numAtual = parseInt(matchNum[1]);
    
    // Pegar último número válido
    for (let i = anteriores.length - 1; i >= 0; i--) {
      const matchAnt = anteriores[i]?.match(/^(\d+)/);
      if (matchAnt) {
        const numAnterior = parseInt(matchAnt[1]);
        
        // Verificar se pulou muitos artigos (mais de 5)
        if (numAtual > numAnterior + 5) {
          return {
            indice,
            numero: numeroExtraido,
            status: 'alerta',
            problema: `Possível lacuna: pulou de ${numAnterior} para ${numAtual}`,
            sugestao: 'Verificar se há artigos faltando ou se são revogados'
          };
        }
        
        // Verificar se está fora de ordem (exceto sufixos como -A, -B)
        // Art. 7-A pode vir depois do Art. 7
        const temSufixoAtual = numero.match(/[A-Z]$/i);
        if (numAtual < numAnterior && !temSufixoAtual) {
          return {
            indice,
            numero: numeroExtraido,
            status: 'alerta',
            problema: `Artigo fora de ordem: ${numAtual} depois de ${numAnterior}`,
            sugestao: 'Verificar ordenação dos artigos'
          };
        }
        break;
      }
    }
  }

  // 7. Verificar conteúdo vazio ou muito curto
  if (texto.length < 10) {
    // Exceção para VETADO e Revogado
    if (texto.includes('VETADO') || texto.includes('Revogado') || texto.includes('revogado')) {
      return { indice, numero: numeroExtraido, status: 'ok' };
    }
    return {
      indice,
      numero: numeroExtraido,
      status: 'alerta',
      problema: 'Conteúdo muito curto',
      sugestao: 'Verificar se o artigo está completo'
    };
  }

  // 8. Verificar se tem HTML/Markdown residual
  if (texto.includes('<') && texto.includes('>')) {
    return {
      indice,
      numero: numeroExtraido,
      status: 'alerta',
      problema: 'Possível HTML residual detectado',
      sugestao: 'Reformatar para remover tags HTML'
    };
  }

  if (texto.includes('**') || texto.includes('##') || texto.includes('__')) {
    return {
      indice,
      numero: numeroExtraido,
      status: 'alerta',
      problema: 'Possível Markdown residual',
      sugestao: 'Reformatar para remover markdown'
    };
  }

  // 9. Verificar texto entre parênteses suspeito (referências legislativas não removidas)
  const matchRef = texto.match(/\([^)]*(?:Lei|Medida|Decreto|Emenda|Incluíd|Redação|Vide)[^)]*\)/gi);
  if (matchRef && matchRef.length > 0) {
    // Ignorar VETADO e Revogado
    const refsProblematicas = matchRef.filter(m => 
      !m.includes('VETADO') && !m.includes('Revogado') && !m.includes('revogado')
    );
    if (refsProblematicas.length > 0) {
      return {
        indice,
        numero: numeroExtraido,
        status: 'alerta',
        problema: 'Referência legislativa não removida',
        sugestao: `Remover: ${refsProblematicas[0].substring(0, 50)}...`
      };
    }
  }

  // 10. Tudo OK!
  return { indice, numero: numeroExtraido, status: 'ok' };
}
