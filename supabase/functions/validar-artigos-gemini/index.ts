import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ETAPA 4: Validação e Correção
 * 
 * Responsabilidade ÚNICA: Validar o texto formatado comparando com o bruto.
 * 
 * FAZ:
 * - Verificar sequência de artigos (1, 2, 3...)
 * - Detectar lacunas (artigos faltando)
 * - Comparar texto formatado com texto bruto
 * - Se detectar problemas, CORRIGIR baseado no texto bruto
 * 
 * RETORNA: Validação + correções (se houver)
 */

const REVISION = '2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = ['GEMINI_KEY_1', 'GEMINI_KEY_2', 'GEMINI_KEY_3'];

interface Artigo {
  numero: string | null;
  texto: string;
  ordem: number;
  tipo?: string;
}

interface ProblemaDetectado {
  tipo: 'artigo_faltante' | 'titulo_incorreto' | 'formatacao' | 'duplicado' | 'estrutura' | 'conteudo_faltante';
  descricao: string;
  artigos?: string[];
  sugestao?: string;
  correcao?: string; // Texto corrigido, se aplicável
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ ETAPA 4: VALIDAÇÃO E CORREÇÃO (v${REVISION})`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const { artigos, textoFormatado, textoBruto, tableName } = await req.json();

    if (!artigos || artigos.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Artigos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Tabela: ${tableName || 'não informada'}`);
    console.log(`📊 Artigos a validar: ${artigos.length}`);
    console.log(`📊 Texto formatado: ${textoFormatado?.length || 0} chars`);
    console.log(`📊 Texto bruto: ${textoBruto?.length || 0} chars`);

    // Preparar estatísticas
    const artigosNumerados = artigos.filter((a: Artigo) => a.numero);
    
    // Extrair números
    const numeros: number[] = [];
    for (const artigo of artigosNumerados) {
      const match = artigo.numero?.match(/^(\d+)/);
      if (match) {
        numeros.push(parseInt(match[1]));
      }
    }
    numeros.sort((a, b) => a - b);

    const primeiro = numeros[0] || 1;
    const ultimo = numeros[numeros.length - 1] || 0;
    const artigosEsperados = ultimo - primeiro + 1;
    const artigosEncontrados = numeros.length;

    // Detectar lacunas
    const lacunas: number[] = [];
    const numerosSet = new Set(numeros);
    for (let i = primeiro; i <= ultimo; i++) {
      if (!numerosSet.has(i)) {
        lacunas.push(i);
      }
    }

    // Contar artigos no texto bruto
    const artigosNoBruto = (textoBruto?.match(/\bArt\.?\s*\d+/gi) || []).length;

    console.log('📊 Estatísticas:');
    console.log(`   Primeiro: ${primeiro}° | Último: ${ultimo}°`);
    console.log(`   Esperados: ${artigosEsperados} | Encontrados: ${artigosEncontrados}`);
    console.log(`   No bruto: ${artigosNoBruto} | Lacunas: ${lacunas.length}`);

    const percentualExtracao = artigosEsperados > 0 
      ? Math.round((artigosEncontrados / artigosEsperados) * 100) 
      : 100;

    // Chamar Gemini para validação detalhada
    console.log('🤖 Validando com Gemini...');
    const validacao = await validarComGemini(
      artigosNumerados.slice(0, 20), // Primeiros 20
      artigosNumerados.slice(-10),   // Últimos 10
      textoFormatado?.substring(0, 20000) || '',
      textoBruto?.substring(0, 30000) || '',
      {
        primeiro,
        ultimo,
        artigosEsperados,
        artigosEncontrados,
        artigosNoBruto,
        lacunas: lacunas.slice(0, 30),
        percentualExtracao,
      }
    );

    console.log('✅ Validação concluída');
    console.log(`   Aprovado: ${validacao.aprovado ? 'SIM' : 'NÃO'}`);
    console.log(`   Nota: ${validacao.nota}/100`);
    console.log(`   Problemas: ${validacao.problemas.length}`);
    console.log(`   Correções: ${validacao.correcoes.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        validacao: {
          aprovado: validacao.aprovado,
          nota: validacao.nota,
          problemas: validacao.problemas,
          correcoes: validacao.correcoes,
          resumo: validacao.resumo,
        },
        estatisticas: {
          primeiroArtigo: primeiro + '°',
          ultimoArtigo: ultimo + '°',
          artigosEsperados,
          artigosEncontrados,
          artigosNoBruto,
          divergencia: artigosNoBruto - artigosEncontrados,
          lacunas: lacunas.slice(0, 50),
          totalLacunas: lacunas.length,
          percentualExtracao,
        },
        artigosCorrigidos: validacao.artigosCorrigidos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function validarComGemini(
  amostraInicial: Artigo[],
  amostraFinal: Artigo[],
  textoFormatado: string,
  textoBruto: string,
  estatisticas: {
    primeiro: number;
    ultimo: number;
    artigosEsperados: number;
    artigosEncontrados: number;
    artigosNoBruto: number;
    lacunas: number[];
    percentualExtracao: number;
  }
): Promise<{
  aprovado: boolean;
  nota: number;
  problemas: ProblemaDetectado[];
  correcoes: Array<{ artigo: string; antes: string; depois: string }>;
  resumo: string;
  artigosCorrigidos?: Artigo[];
}> {

  const prompt = `Você é um especialista em validação de textos legais brasileiros.

## TAREFA: Validar a extração e formatação de uma lei.

## DADOS DA EXTRAÇÃO:

### ESTATÍSTICAS:
- Primeiro artigo: ${estatisticas.primeiro}°
- Último artigo: ${estatisticas.ultimo}°
- Artigos esperados (pela sequência): ${estatisticas.artigosEsperados}
- Artigos encontrados: ${estatisticas.artigosEncontrados}
- Artigos detectados no bruto: ${estatisticas.artigosNoBruto}
- Lacunas na sequência: ${estatisticas.lacunas.length > 0 ? estatisticas.lacunas.slice(0, 20).join(', ') : 'Nenhuma'}
- Percentual de extração: ${estatisticas.percentualExtracao}%

### AMOSTRA DOS PRIMEIROS ARTIGOS FORMATADOS:
${JSON.stringify(amostraInicial.slice(0, 8).map(a => ({
  num: a.numero,
  texto: a.texto.substring(0, 300)
})), null, 2)}

### AMOSTRA DOS ÚLTIMOS ARTIGOS FORMATADOS:
${JSON.stringify(amostraFinal.slice(0, 5).map(a => ({
  num: a.numero,
  texto: a.texto.substring(0, 300)
})), null, 2)}

### TRECHO DO TEXTO BRUTO (para comparação):
${textoBruto.substring(0, 8000)}

### TRECHO DO TEXTO FORMATADO:
${textoFormatado.substring(0, 8000)}

## CRITÉRIOS DE VALIDAÇÃO:

1. **COMPLETUDE**: Os artigos do texto formatado correspondem ao bruto?
2. **SEQUÊNCIA**: A numeração está correta? Lacunas são justificadas (revogados/vetados)?
3. **FORMATAÇÃO**: Títulos, capítulos, seções estão corretos?
4. **ESTRUTURA**: Cada artigo está completo? Parágrafos e incisos incluídos?
5. **CONTEÚDO**: O texto formatado perdeu conteúdo importante do bruto?

## SE ENCONTRAR PROBLEMAS:

Para cada problema encontrado, indique:
- Tipo do problema
- Descrição clara
- Se possível, como corrigir

## RESPONDA EM JSON:

{
  "aprovado": true/false,
  "nota": 0-100,
  "problemas": [
    {
      "tipo": "artigo_faltante|conteudo_faltante|formatacao|duplicado|estrutura",
      "descricao": "Descrição do problema",
      "artigos": ["1°", "2°"],
      "sugestao": "Como corrigir"
    }
  ],
  "correcoes": [
    {
      "artigo": "5°",
      "antes": "Texto incorreto",
      "depois": "Texto corrigido baseado no bruto"
    }
  ],
  "resumo": "Resumo da validação em 2-3 frases"
}

IMPORTANTE:
- Lacunas podem ser justificadas por artigos revogados/vetados
- Se a extração está com 90%+ de cobertura E sem problemas graves, aprove
- Se encontrar artigos no bruto que não estão no formatado, liste em "problemas"
- Em "correcoes", inclua o texto correto APENAS se conseguir extrair do bruto`;

  try {
    const resposta = await chamarGemini(prompt);
    
    // Parsear JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Resposta não é JSON válido, usando fallback');
      return gerarValidacaoFallback(estatisticas);
    }

    const resultado = JSON.parse(jsonMatch[0]);
    
    return {
      aprovado: resultado.aprovado ?? (estatisticas.percentualExtracao >= 90),
      nota: resultado.nota ?? estatisticas.percentualExtracao,
      problemas: resultado.problemas ?? [],
      correcoes: resultado.correcoes ?? [],
      resumo: resultado.resumo ?? `Extração com ${estatisticas.percentualExtracao}% de cobertura.`,
    };

  } catch (error) {
    console.error('❌ Erro ao parsear resposta:', error);
    return gerarValidacaoFallback(estatisticas);
  }
}

async function chamarGemini(prompt: string): Promise<string> {
  for (const keyName of GEMINI_KEYS) {
    const apiKey = Deno.env.get(keyName);
    if (!apiKey) continue;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16000,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 403) {
          console.warn(`⚠️ ${keyName} rate limited`);
          continue;
        }
        throw new Error(`API Gemini retornou ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error) {
      console.error(`❌ Erro com ${keyName}:`, error);
      continue;
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

function gerarValidacaoFallback(estatisticas: {
  artigosEsperados: number;
  artigosEncontrados: number;
  artigosNoBruto: number;
  lacunas: number[];
  percentualExtracao: number;
}): {
  aprovado: boolean;
  nota: number;
  problemas: ProblemaDetectado[];
  correcoes: Array<{ artigo: string; antes: string; depois: string }>;
  resumo: string;
} {
  const aprovado = estatisticas.percentualExtracao >= 90;
  const nota = estatisticas.percentualExtracao;

  const problemas: ProblemaDetectado[] = [];

  if (estatisticas.lacunas.length > 0) {
    problemas.push({
      tipo: 'artigo_faltante',
      descricao: `${estatisticas.lacunas.length} artigos faltantes na sequência`,
      artigos: estatisticas.lacunas.slice(0, 10).map(n => n + '°'),
      sugestao: 'Verificar se são artigos revogados/vetados ou falha na extração',
    });
  }

  if (estatisticas.artigosNoBruto > estatisticas.artigosEncontrados) {
    const diferenca = estatisticas.artigosNoBruto - estatisticas.artigosEncontrados;
    problemas.push({
      tipo: 'conteudo_faltante',
      descricao: `${diferenca} artigos detectados no bruto não foram extraídos`,
      sugestao: 'Revisar texto bruto para identificar artigos não extraídos',
    });
  }

  return {
    aprovado,
    nota,
    problemas,
    correcoes: [],
    resumo: `Extração com ${nota}% de cobertura. ${aprovado ? 'Aprovado para inserção.' : 'Requer revisão manual.'}`,
  };
}
