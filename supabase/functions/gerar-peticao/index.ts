import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool de chaves API com fallback
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  console.log(`[gerar-peticao] Iniciando com ${API_KEYS.length} chaves disponíveis`);
  
  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma chave API configurada');
  }

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`[gerar-peticao] Tentando chave ${i + 1}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            }
          })
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[gerar-peticao] Chave ${i + 1} rate limited (${response.status}), tentando próxima...`);
        continue;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        console.error(`[gerar-peticao] Erro 400 na chave ${i + 1}: ${errorText}`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-peticao] Erro na chave ${i + 1}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[gerar-peticao] Sucesso com chave ${i + 1}`);
        return text;
      } else {
        console.log(`[gerar-peticao] Resposta vazia da chave ${i + 1}`);
        continue;
      }
    } catch (error) {
      console.error(`[gerar-peticao] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves API esgotadas ou com erro');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      descricaoCaso, 
      areaDireito, 
      tipoPeticao, 
      pdfTexto, 
      etapa, 
      contextoAnterior,
      dadosAutor,
      dadosReu,
      jurisprudencias = []
    } = await req.json();

    console.log(`[gerar-peticao] Gerando etapa ${etapa} para ${tipoPeticao} em ${areaDireito}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar artigos relevantes do Vade Mecum
    let artigosRelevantes = '';
    try {
      const tabela = getVadeMecumTable(areaDireito);
      if (tabela) {
        const { data: artigos } = await supabase
          .from(tabela as any)
          .select('*')
          .limit(5);
        
        if (artigos && artigos.length > 0) {
          artigosRelevantes = '\n\nARTIGOS RELEVANTES DA LEGISLAÇÃO:\n';
          artigos.forEach((art: any) => {
            artigosRelevantes += `\n${art["Número do Artigo"] || art.Artigo}: ${art.Narração || art.texto || ''}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
    }

    // Formatar jurisprudências se fornecidas
    let jurisprudenciasTexto = '';
    if (jurisprudencias && jurisprudencias.length > 0) {
      jurisprudenciasTexto = '\n\nJURISPRUDÊNCIAS SELECIONADAS PARA CITAR:\n';
      jurisprudencias.forEach((j: any, i: number) => {
        jurisprudenciasTexto += `\n${i + 1}. ${j.tribunal} - ${j.numeroProcesso || j.numero}`;
        if (j.ementa) jurisprudenciasTexto += `\nEmenta: ${j.ementa.substring(0, 300)}...\n`;
      });
    }

    // Gerar prompt baseado na etapa
    const prompt = gerarPrompt(etapa, {
      descricaoCaso,
      areaDireito,
      tipoPeticao,
      pdfTexto,
      contextoAnterior,
      artigosRelevantes,
      dadosAutor,
      dadosReu,
      jurisprudenciasTexto
    });

    // Chamar Gemini API com fallback
    const conteudo = await chamarGeminiComFallback(prompt);

    console.log(`[gerar-peticao] Etapa ${etapa} gerada com sucesso (${conteudo.length} caracteres)`);

    return new Response(
      JSON.stringify({ conteudo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-peticao] Erro ao gerar petição:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getVadeMecumTable(areaDireito: string): string | null {
  const mapeamento: Record<string, string> = {
    'civil': 'CC - Código Civil',
    'penal': 'CP - Código Penal',
    'trabalhista': 'CLT – Consolidação das Leis do Trabalho',
    'tributario': 'CTN – Código Tributário Nacional',
    'consumidor': 'CDC – Código de Defesa do Consumidor',
    'administrativo': 'CF - Constituição Federal',
    'familia': 'CC - Código Civil',
    'empresarial': 'CCOM – Código Comercial'
  };
  return mapeamento[areaDireito] || 'CF - Constituição Federal';
}

function gerarPrompt(etapa: number, dados: any): string {
  const { 
    descricaoCaso, 
    areaDireito, 
    tipoPeticao, 
    pdfTexto, 
    contextoAnterior, 
    artigosRelevantes,
    dadosAutor,
    dadosReu,
    jurisprudenciasTexto
  } = dados;

  const formatacaoABNT = `
REGRAS DE FORMATAÇÃO (ABNT para Petições):
- Endereçamento: à esquerda, negrito, maiúsculo
- Seções (DOS FATOS, DO DIREITO, DOS PEDIDOS): negrito, maiúsculo, à esquerda
- Parágrafos: texto corrido, sem marcações markdown
- Citações de jurisprudência: formato "(TRIBUNAL - Processo nº X - Rel. Min. Y - Data)"
- Citações de doutrina: formato "(AUTOR, ano, p. X)"
- Artigos de lei: mencionar por extenso (ex: "conforme art. 186 do Código Civil")
- NÃO use asteriscos (**), hashtags (#) ou outros marcadores markdown
- NÃO use listas com bullets, prefira texto corrido
- Numere os pedidos com algarismos romanos ou arábicos
`;

  const basePrompt = `Você é um advogado especialista em ${areaDireito} brasileiro. Sua tarefa é redigir uma ${tipoPeticao} profissional seguindo as normas ABNT.

${formatacaoABNT}`;

  if (etapa === 1) {
    return `${basePrompt}

CASO: ${descricaoCaso}
${pdfTexto ? `\nDOCUMENTOS ANEXOS:\n${pdfTexto}` : ''}
${artigosRelevantes}
${dadosAutor ? `\nQUALIFICAÇÃO DO AUTOR FORNECIDA:\n${dadosAutor}` : ''}
${dadosReu ? `\nQUALIFICAÇÃO DO RÉU FORNECIDA:\n${dadosReu}` : ''}

INSTRUÇÕES PARA ETAPA 1:
Redija a PRIMEIRA PARTE da ${tipoPeticao} contendo:

1. ENDEREÇAMENTO ao juízo competente (EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ VARA...)

2. QUALIFICAÇÃO DAS PARTES:
   ${dadosAutor ? '- Use a qualificação do autor fornecida acima' : '- Crie qualificação genérica para o autor'}
   ${dadosReu ? '- Use a qualificação do réu fornecida acima' : '- Crie qualificação genérica para o réu'}

3. DOS FATOS:
   - Narre os fatos de forma clara e cronológica
   - Use linguagem técnica e formal
   - Fundamente com o caso descrito

4. DO DIREITO (início):
   - Inicie a fundamentação jurídica
   - Cite artigos específicos da legislação

Máximo 2000 palavras. Seja preciso, técnico e formal.`;
  }

  if (etapa === 2) {
    return `${basePrompt}

CONTEXTO ANTERIOR DA PETIÇÃO:
${contextoAnterior}
${artigosRelevantes}
${jurisprudenciasTexto}

INSTRUÇÕES PARA ETAPA 2:
Continue a ${tipoPeticao} desenvolvendo:

1. DO DIREITO (continuação):
   - Aprofunde a fundamentação jurídica
   - Cite doutrina relevante
   - Analise precedentes jurisprudenciais
   ${jurisprudenciasTexto ? '- OBRIGATÓRIO: cite as jurisprudências fornecidas acima' : ''}

2. Argumentação sólida:
   - Desenvolva teses de forma estruturada
   - Antecipe e refute possíveis contrapontos
   - Mantenha coerência com a parte anterior

Máximo 2500 palavras. Mantenha a estrutura formal sem markdown.`;
  }

  // Etapa 3
  return `${basePrompt}

CONTEXTO COMPLETO DA PETIÇÃO:
${contextoAnterior}

INSTRUÇÕES PARA ETAPA 3:
Finalize a ${tipoPeticao} com:

1. DOS PEDIDOS:
   Ante o exposto, requer:
   I - [primeiro pedido]
   II - [segundo pedido]
   III - [demais pedidos específicos ao caso]
   
   Pedidos obrigatórios conforme o tipo:
   - Citação do réu
   - Produção de provas
   - Procedência dos pedidos
   - Condenação em custas e honorários

2. REQUERIMENTOS FINAIS:
   - Justiça gratuita (se aplicável)
   - Audiência de conciliação (se aplicável)
   - Prioridade de tramitação (se aplicável)

3. VALOR DA CAUSA:
   Dá-se à causa o valor de R$ _____ (valor por extenso).

4. ENCERRAMENTO:
   Nestes termos,
   Pede deferimento.
   
   [Cidade], [data atual].
   
   [Espaço para assinatura]
   Advogado
   OAB/XX nº XXXXX

Máximo 1500 palavras. Finalize de forma profissional e completa.`;
}
