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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { limite = 10, tipo = 'todas' } = await req.json().catch(() => ({}))
    
    console.log(`[converter-capas-noticias] Iniciando conversão. Limite: ${limite}, Tipo: ${tipo}`)

    let resultados = {
      juridicas: { total: 0, sucesso: 0, erro: 0, detalhes: [] as any[] },
      politicas: { total: 0, sucesso: 0, erro: 0, detalhes: [] as any[] }
    }

    // 1. Buscar notícias JURÍDICAS sem imagem WebP
    if (tipo === 'todas' || tipo === 'juridicas') {
      const { data: noticiasJuridicas, error: errorJuridicas } = await supabase
        .from('noticias_juridicas_cache')
        .select('id, imagem')
        .not('imagem', 'is', null)
        .is('imagem_webp', null)
        .limit(limite)

      if (errorJuridicas) {
        console.error('[converter-capas-noticias] Erro ao buscar jurídicas:', errorJuridicas)
      } else if (noticiasJuridicas && noticiasJuridicas.length > 0) {
        console.log(`[converter-capas-noticias] ${noticiasJuridicas.length} notícias jurídicas para converter`)
        resultados.juridicas.total = noticiasJuridicas.length

        for (const noticia of noticiasJuridicas) {
          try {
            console.log(`[converter-capas-noticias] Convertendo jurídica ${noticia.id}: ${noticia.imagem?.substring(0, 50)}...`)
            
            // Chamar edge function de conversão
            const { data: conversionResult, error: conversionError } = await supabase.functions.invoke(
              'converter-imagem-webp',
              { body: { imageUrl: noticia.imagem } }
            )

            if (conversionError) {
              throw new Error(conversionError.message)
            }

            if (conversionResult?.success && conversionResult?.url) {
              // Atualizar tabela com URL WebP
              const { error: updateError } = await supabase
                .from('noticias_juridicas_cache')
                .update({ imagem_webp: conversionResult.url })
                .eq('id', noticia.id)

              if (updateError) {
                throw new Error(`Erro ao atualizar: ${updateError.message}`)
              }

              resultados.juridicas.sucesso++
              resultados.juridicas.detalhes.push({
                id: noticia.id,
                status: 'sucesso',
                urlWebp: conversionResult.url,
                reducao: conversionResult.reducao || 0
              })
              console.log(`[converter-capas-noticias] ✅ Jurídica ${noticia.id} convertida`)
            } else {
              throw new Error(conversionResult?.error || 'Resultado inválido')
            }
          } catch (e: any) {
            resultados.juridicas.erro++
            resultados.juridicas.detalhes.push({
              id: noticia.id,
              status: 'erro',
              erro: e.message
            })
            console.error(`[converter-capas-noticias] ❌ Erro jurídica ${noticia.id}:`, e.message)
          }
        }
      } else {
        console.log('[converter-capas-noticias] Nenhuma notícia jurídica pendente')
      }
    }

    // 2. Buscar notícias POLÍTICAS sem imagem WebP
    if (tipo === 'todas' || tipo === 'politicas') {
      const { data: noticiasPoliticas, error: errorPoliticas } = await supabase
        .from('noticias_politicas_cache')
        .select('id, imagem_url')
        .not('imagem_url', 'is', null)
        .is('imagem_url_webp', null)
        .limit(limite)

      if (errorPoliticas) {
        console.error('[converter-capas-noticias] Erro ao buscar políticas:', errorPoliticas)
      } else if (noticiasPoliticas && noticiasPoliticas.length > 0) {
        console.log(`[converter-capas-noticias] ${noticiasPoliticas.length} notícias políticas para converter`)
        resultados.politicas.total = noticiasPoliticas.length

        for (const noticia of noticiasPoliticas) {
          try {
            console.log(`[converter-capas-noticias] Convertendo política ${noticia.id}: ${noticia.imagem_url?.substring(0, 50)}...`)
            
            const { data: conversionResult, error: conversionError } = await supabase.functions.invoke(
              'converter-imagem-webp',
              { body: { imageUrl: noticia.imagem_url } }
            )

            if (conversionError) {
              throw new Error(conversionError.message)
            }

            if (conversionResult?.success && conversionResult?.url) {
              const { error: updateError } = await supabase
                .from('noticias_politicas_cache')
                .update({ imagem_url_webp: conversionResult.url })
                .eq('id', noticia.id)

              if (updateError) {
                throw new Error(`Erro ao atualizar: ${updateError.message}`)
              }

              resultados.politicas.sucesso++
              resultados.politicas.detalhes.push({
                id: noticia.id,
                status: 'sucesso',
                urlWebp: conversionResult.url,
                reducao: conversionResult.reducao || 0
              })
              console.log(`[converter-capas-noticias] ✅ Política ${noticia.id} convertida`)
            } else {
              throw new Error(conversionResult?.error || 'Resultado inválido')
            }
          } catch (e: any) {
            resultados.politicas.erro++
            resultados.politicas.detalhes.push({
              id: noticia.id,
              status: 'erro',
              erro: e.message
            })
            console.error(`[converter-capas-noticias] ❌ Erro política ${noticia.id}:`, e.message)
          }
        }
      } else {
        console.log('[converter-capas-noticias] Nenhuma notícia política pendente')
      }
    }

    const totalProcessado = resultados.juridicas.sucesso + resultados.politicas.sucesso
    const totalErros = resultados.juridicas.erro + resultados.politicas.erro

    console.log(`[converter-capas-noticias] Finalizado. Sucesso: ${totalProcessado}, Erros: ${totalErros}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        resumo: {
          totalProcessado,
          totalErros,
          juridicas: {
            total: resultados.juridicas.total,
            sucesso: resultados.juridicas.sucesso,
            erro: resultados.juridicas.erro
          },
          politicas: {
            total: resultados.politicas.total,
            sucesso: resultados.politicas.sucesso,
            erro: resultados.politicas.erro
          }
        },
        detalhes: resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[converter-capas-noticias] Erro:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})