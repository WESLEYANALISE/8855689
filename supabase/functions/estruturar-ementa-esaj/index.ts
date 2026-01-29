const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

interface EstruturaEsaj {
  numeroProcesso: string;
  tipoAcao: string;
  areaDireito: string;
  casoEmExame: string;
  questaoEmDiscussao: string;
  baseLegal: string[];
  fundamentosNormativos: string;
  razoesDeDecidir: string[];
  dispositivo: string;
  teseDejulgamento: string[];
  palavrasChave: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ementa, numeroProcesso, classe, tribunal } = await req.json();

    if (!ementa) {
      return new Response(
        JSON.stringify({ error: 'Ementa é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Estruturando ementa e-SAJ:', numeroProcesso);

const prompt = `Você é um especialista em jurisprudência brasileira. Analise a ementa abaixo e extraia as informações estruturadas com nomenclatura técnica correta.

DADOS DO PROCESSO:
- Número: ${numeroProcesso || 'Não informado'}
- Classe: ${classe || 'Não informado'}
- Tribunal: ${tribunal || 'Não informado'}

EMENTA:
${ementa}

INSTRUÇÕES:
1. Analise cuidadosamente a ementa e extraia as seguintes informações
2. Use APENAS informações presentes no texto - NÃO INVENTE
3. Se uma informação não existir, retorne string vazia ou array vazio
4. Para BASE LEGAL, extraia TODOS os artigos, leis, súmulas, temas e precedentes citados
5. Mantenha a nomenclatura jurídica correta (ex: "art. 85, §§ 2º e 8º, do CPC/2015")

RETORNE UM JSON com esta estrutura exata:
{
  "numeroProcesso": "número do processo formatado",
  "tipoAcao": "ex: Apelação Cível, Reexame Necessário, Recurso Especial, Agravo de Instrumento, Ação Ordinária, etc",
  "areaDireito": "ex: Direito Administrativo, Direito do Consumidor, Direito Civil, Direito Constitucional, Direito Penal, etc",
  "casoEmExame": "resumo detalhado do caso analisado descrevendo os fatos e partes envolvidas (2-4 frases)",
  "questaoEmDiscussao": "qual era a questão jurídica principal discutida de forma clara",
  "baseLegal": [
    "Art. 23, inciso II, da CF/88",
    "Art. 85, §§ 2º e 8º, do CPC/2015",
    "Tema nº 1.002 do STF",
    "Tema nº 1.076 do STJ",
    "Súmula 123 do STJ"
  ],
  "fundamentosNormativos": "Explicação resumida de como a base legal foi aplicada ao caso, conectando os dispositivos legais à decisão",
  "razoesDeDecidir": ["razão/fundamento 1 usado na decisão", "razão/fundamento 2", "razão/fundamento 3"],
  "dispositivo": "resultado claro: PROVIDO, DESPROVIDO, PARCIALMENTE PROVIDO, CONHECIDO E PROVIDO, etc",
  "teseDejulgamento": ["tese 1 fixada pelo tribunal", "tese 2 se houver"],
  "palavrasChave": ["termo1", "termo2", "termo3", "termo4", "termo5"]
}

Retorne APENAS o JSON válido, sem explicações adicionais.`;

    let resultado: EstruturaEsaj | null = null;

    for (const apiKey of API_KEYS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (text) {
            // Limpar e parsear JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                resultado = JSON.parse(jsonMatch[0]);
                break;
              } catch (parseError) {
                console.error('Erro ao parsear JSON:', parseError);
              }
            }
          }
        }
        
        console.log(`API Key tentada, continuando...`);
      } catch (error) {
        console.error('Erro com API Key:', error);
      }
    }

    if (!resultado) {
      // Fallback: estrutura básica sem IA
      resultado = {
        numeroProcesso: numeroProcesso || '',
        tipoAcao: classe || '',
        areaDireito: '',
        casoEmExame: '',
        questaoEmDiscussao: '',
        baseLegal: [],
        fundamentosNormativos: '',
        razoesDeDecidir: [],
        dispositivo: '',
        teseDejulgamento: [],
        palavrasChave: []
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        estrutura: resultado 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao estruturar ementa:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
