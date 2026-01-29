import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chamar Gemini API com fallback para múltiplas chaves
async function chamarGemini(prompt: string, chavesDisponiveis: string[]): Promise<any> {
  for (let i = 0; i < chavesDisponiveis.length; i++) {
    try {
      console.log(`[chamarGemini] Tentando GEMINI_KEY_${i + 1}...`)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chavesDisponiveis[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[chamarGemini] Erro com GEMINI_KEY_${i + 1}: ${response.status} - ${errorText.substring(0, 200)}`)
        continue
      }

      const data = await response.json()
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!texto) {
        console.error(`[chamarGemini] Resposta vazia com GEMINI_KEY_${i + 1}`)
        continue
      }

      console.log(`[chamarGemini] ✅ Sucesso com GEMINI_KEY_${i + 1}`)
      return JSON.parse(texto)
    } catch (error: any) {
      console.error(`[chamarGemini] Exceção com GEMINI_KEY_${i + 1}: ${error.message}`)
      continue
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nomeLei, artigos } = await req.json()

    if (!nomeLei || !artigos || !Array.isArray(artigos)) {
      throw new Error('nomeLei e artigos são obrigatórios')
    }

    console.log(`[sugerir-artigos-narracao] Analisando ${artigos.length} artigos de ${nomeLei}`)

    // Coletar chaves Gemini do Supabase
    const chavesDisponiveis: string[] = []
    for (let i = 1; i <= 3; i++) {
      const key = Deno.env.get(`GEMINI_KEY_${i}`)
      if (key) chavesDisponiveis.push(key)
    }

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY configurada')
    }

    console.log(`[sugerir-artigos-narracao] ${chavesDisponiveis.length} chaves disponíveis`)

    // Preparar lista de artigos para análise
    const listaArtigos = artigos.map((a: { numero: string; resumo: string }) => 
      `- ${a.numero}: ${a.resumo.substring(0, 150)}...`
    ).join('\n')

    const prompt = `Você é um especialista em concursos públicos e provas da OAB do Brasil.

Analise os seguintes artigos do "${nomeLei}" e classifique cada um por prioridade de estudo baseado em:
1. Frequência em provas de concursos e OAB
2. Relevância prática na advocacia
3. Fundamentalidade do conceito jurídico
4. Popularidade de pesquisa por estudantes

ARTIGOS PARA ANALISAR:
${listaArtigos}

Retorne APENAS um JSON válido no formato:
{
  "sugestoes": [
    { "numero": "1º", "prioridade": "alta", "motivo": "Artigo fundamental..." },
    { "numero": "2º", "prioridade": "media", "motivo": "..." }
  ]
}

Prioridades:
- "alta": Artigos essenciais, muito cobrados em provas, fundamentos básicos
- "media": Artigos importantes, cobrados com frequência moderada  
- "baixa": Artigos menos cobrados, complementares ou muito específicos

Priorize artigos que tratam de: definições fundamentais, princípios basilares, direitos e garantias mais cobrados, procedimentos mais comuns.`

    const resultado = await chamarGemini(prompt, chavesDisponiveis)
    
    console.log(`[sugerir-artigos-narracao] ✅ ${resultado.sugestoes?.length || 0} artigos classificados`)

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[sugerir-artigos-narracao] Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
