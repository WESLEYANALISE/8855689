import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pool de chaves Gemini com fallback
function getGeminiKeys(): string[] {
  const keys: string[] = []
  const key1 = Deno.env.get('GEMINI_KEY_1')
  const key2 = Deno.env.get('GEMINI_KEY_2')
  const key3 = Deno.env.get('GEMINI_KEY_3')
  const keyPremium = Deno.env.get('DIREITO_PREMIUM_API_KEY')
  
  if (key1) keys.push(key1)
  if (key2) keys.push(key2)
  if (key3) keys.push(key3)
  if (keyPremium) keys.push(keyPremium)
  
  return keys
}

async function generateImageWithFallback(prompt: string): Promise<string> {
  const keys = getGeminiKeys()
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada')
  }

  let lastError: Error | null = null

  for (const apiKey of keys) {
    try {
      console.log('[gerar-capa-disciplina] Tentando gerar imagem com chave...')
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[gerar-capa-disciplina] Erro com chave:', response.status, errorText)
        
        if (response.status === 429 || response.status === 503) {
          // Rate limit ou serviço indisponível - tentar próxima chave
          lastError = new Error(`Chave com rate limit: ${response.status}`)
          continue
        }
        
        throw new Error(`API Gemini falhou: ${response.status}`)
      }

      const data = await response.json()
      
      // Extrair imagem da resposta
      const parts = data.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log('[gerar-capa-disciplina] Imagem gerada com sucesso!')
          return part.inlineData.data // Base64 puro
        }
      }
      
      throw new Error('Nenhuma imagem na resposta')
      
    } catch (error) {
      console.error('[gerar-capa-disciplina] Erro com chave:', error)
      lastError = error as Error
      continue
    }
  }

  throw lastError || new Error('Todas as chaves falharam')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { disciplinaId, nome } = await req.json()

    if (!disciplinaId || !nome) {
      throw new Error('disciplinaId e nome são obrigatórios')
    }

    console.log(`[gerar-capa-disciplina] Gerando capa para: ${nome}`)

    // Prompt ultra-específico para cada disciplina
    const prompt = `Create a UNIQUE cover image specifically representing the law subject "${nome}".

CRITICAL: The image MUST visually represent the SPECIFIC TOPIC, not generic legal symbols.

Examples of what each subject should show:
- "Direito Romano" → Ancient Roman architecture, Roman columns, Roman senators, Colosseum, Latin scrolls
- "Direito Constitucional" → Brazilian Constitution book, national symbols, Congress building
- "Direito Penal" → Criminal justice imagery, prison bars, handcuffs, crime scene
- "Direito Civil" → Contracts, family, property, everyday civil matters
- "Direito Trabalhista" → Workers, factories, labor unions, workplace
- "Direito Empresarial" → Business buildings, corporate offices, commerce
- "Teoria Geral" → Abstract legal concepts, philosophy, foundational imagery
- "Direito Privado" → Private contracts, personal relationships, individual rights
- "Economia" → Money, markets, graphs, financial symbols
- "Sociologia" → Society, people, social structures
- "Filosofia" → Greek philosophers, Themis, abstract thought

Style: Cinematic, dramatic lighting, professional photography, dark moody atmosphere.
Color palette: Rich burgundy, deep navy, gold accents on dark background.
Aspect ratio: 16:9 horizontal banner.
Ultra high resolution.
ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS - pure visual storytelling.`

    // Gerar imagem com fallback de chaves
    const base64Data = await generateImageWithFallback(prompt)

    console.log('[gerar-capa-disciplina] Imagem gerada, salvando no storage...')

    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Salvar no storage
    const fileName = `disciplina-${disciplinaId}-${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('CAPAS')
      .upload(`faculdade/${fileName}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('[gerar-capa-disciplina] Erro upload:', uploadError)
      throw new Error(`Erro ao salvar imagem: ${uploadError.message}`)
    }

    // Obter URL pública
    const { data: publicUrl } = supabase.storage
      .from('CAPAS')
      .getPublicUrl(`faculdade/${fileName}`)

    const imageUrl = publicUrl.publicUrl

    // Atualizar disciplina com a URL da capa
    const { error: updateError } = await supabase
      .from('faculdade_disciplinas')
      .update({ url_capa: imageUrl })
      .eq('id', disciplinaId)

    if (updateError) {
      console.error('[gerar-capa-disciplina] Erro update:', updateError)
      throw new Error(`Erro ao atualizar disciplina: ${updateError.message}`)
    }

    console.log(`[gerar-capa-disciplina] Capa salva com sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ success: true, url_capa: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-capa-disciplina] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar capa', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
