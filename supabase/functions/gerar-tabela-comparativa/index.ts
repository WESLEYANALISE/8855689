import "https://esm.sh/@anthropic-ai/sdk@0.26.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, tipo } = await req.json();

    if (!content || content.length < 100) {
      throw new Error('Conteúdo insuficiente para gerar tabela comparativa');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    console.log('[gerar-tabela-comparativa] Gerando tabela para conteúdo de', content.length, 'caracteres');

    const systemPrompt = `Você é um especialista em criar tabelas comparativas didáticas para estudos jurídicos.
Analise o conteúdo fornecido e crie uma tabela comparativa que organize as informações de forma clara e visual.

REGRAS:
1. Identifique 2-4 elementos que podem ser comparados (conceitos, institutos, prazos, etc.)
2. Crie colunas para cada elemento comparado
3. Crie linhas para cada critério de comparação (definição, requisitos, efeitos, prazos, etc.)
4. Use linguagem clara e concisa
5. Inclua exemplos quando relevante

FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
{
  "titulo": "Título da Tabela",
  "cabecalhos": ["Critério", "Conceito 1", "Conceito 2", "Conceito 3"],
  "linhas": [
    ["Definição", "Definição do conceito 1", "Definição do conceito 2", "Definição do conceito 3"],
    ["Requisitos", "Requisitos do conceito 1", "Requisitos do conceito 2", "Requisitos do conceito 3"],
    ["Efeitos", "Efeitos do conceito 1", "Efeitos do conceito 2", "Efeitos do conceito 3"]
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON, sem markdown ou texto adicional
- Os cabecalhos devem ter a mesma quantidade de elementos que cada linha
- Cada linha deve ter o mesmo número de células
- Mínimo de 3 linhas de comparação
- Máximo de 5 colunas (incluindo a primeira coluna de critérios)`;

    const userPrompt = `Analise o seguinte conteúdo e crie uma tabela comparativa educacional:

${content.substring(0, 8000)}

Retorne APENAS o JSON da tabela, sem texto adicional.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gerar-tabela-comparativa] Erro Gemini:', errorText);
      throw new Error(`Erro ao chamar Gemini: ${response.status}`);
    }

    const geminiData = await response.json();
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Resposta vazia do Gemini');
    }

    console.log('[gerar-tabela-comparativa] Resposta recebida:', generatedText.substring(0, 200));

    // Tentar parsear o JSON
    let tabela;
    try {
      // Limpar possíveis caracteres extras
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      tabela = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[gerar-tabela-comparativa] Erro ao parsear JSON:', parseError);
      console.log('[gerar-tabela-comparativa] Texto recebido:', generatedText);
      throw new Error('Formato de resposta inválido');
    }

    // Validar estrutura da tabela
    if (!tabela.cabecalhos || !Array.isArray(tabela.cabecalhos) || tabela.cabecalhos.length < 2) {
      throw new Error('Tabela inválida: cabecalhos ausentes ou insuficientes');
    }

    if (!tabela.linhas || !Array.isArray(tabela.linhas) || tabela.linhas.length < 2) {
      throw new Error('Tabela inválida: linhas ausentes ou insuficientes');
    }

    console.log('[gerar-tabela-comparativa] Tabela gerada com sucesso:', {
      titulo: tabela.titulo,
      colunas: tabela.cabecalhos.length,
      linhas: tabela.linhas.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        tabela: {
          titulo: tabela.titulo || 'Tabela Comparativa',
          cabecalhos: tabela.cabecalhos,
          linhas: tabela.linhas
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[gerar-tabela-comparativa] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
