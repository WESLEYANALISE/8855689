import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      throw new Error('prompt é obrigatório')
    }

    console.log(`[gerar-imagem-hf] Gerando imagem para prompt: ${prompt.substring(0, 100)}...`)

    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!HF_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN não configurado')
    }

    // Usar a nova URL do router HuggingFace
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[gerar-imagem-hf] Erro HuggingFace:', response.status, errorText)
      throw new Error(`HuggingFace API falhou: ${response.status}`)
    }

    // A resposta é a imagem em binário
    const imageBuffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
    const imageUrl = `data:image/png;base64,${base64}`

    console.log(`[gerar-imagem-hf] Imagem gerada com sucesso, tamanho: ${imageBuffer.byteLength} bytes`)

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-hf] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
