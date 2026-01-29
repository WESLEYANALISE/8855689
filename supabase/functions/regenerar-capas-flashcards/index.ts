import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar todas as áreas
    const { data: areas, error: areasError } = await supabase
      .from('flashcards_areas')
      .select('area')
      .order('area')

    if (areasError) {
      throw new Error(`Erro ao buscar áreas: ${areasError.message}`)
    }

    console.log(`[regenerar-capas-flashcards] ${areas?.length || 0} áreas encontradas`)

    const resultados: { area: string; status: string; url?: string; error?: string }[] = []

    // Processar cada área com delay para evitar rate limiting
    for (const item of areas || []) {
      console.log(`[regenerar-capas-flashcards] Processando: ${item.area}`)
      
      try {
        // Chamar a função de gerar capa forçando regeneração
        const response = await fetch(`${supabaseUrl}/functions/v1/gerar-capa-flashcard-area`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ area: item.area, forcar_regeneracao: true })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        resultados.push({ area: item.area, status: 'success', url: result.url_capa })
        console.log(`[regenerar-capas-flashcards] ✅ ${item.area} - ${result.url_capa}`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        resultados.push({ area: item.area, status: 'error', error: errorMsg })
        console.error(`[regenerar-capas-flashcards] ❌ ${item.area}: ${errorMsg}`)
      }

      // Delay de 3 segundos entre cada área para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    const sucessos = resultados.filter(r => r.status === 'success').length
    const erros = resultados.filter(r => r.status === 'error').length

    console.log(`[regenerar-capas-flashcards] Finalizado: ${sucessos} sucessos, ${erros} erros`)

    return new Response(
      JSON.stringify({ 
        total: areas?.length || 0,
        sucessos,
        erros,
        resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[regenerar-capas-flashcards] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao regenerar capas', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
