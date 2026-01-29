import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { livroId, livroTitulo, limparOCR } = await req.json()

    if (!livroId && !livroTitulo) {
      return new Response(
        JSON.stringify({ error: 'livroId ou livroTitulo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[limpar-formatacao] Limpando formatação: livroId=${livroId}, titulo=${livroTitulo}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let paginasRemovidas = 0
    let indiceRemovido = false

    // Se temos o título do livro, limpar a nova tabela leitura_paginas_formatadas
    if (livroTitulo) {
      // Limpar páginas formatadas
      const { data: deletedPages, error: pagesError } = await supabase
        .from('leitura_paginas_formatadas')
        .delete()
        .ilike('livro_titulo', `%${livroTitulo}%`)
        .select('id')

      if (pagesError) {
        console.error('[limpar-formatacao] Erro ao limpar páginas:', pagesError)
      } else {
        paginasRemovidas = deletedPages?.length || 0
        console.log(`[limpar-formatacao] ${paginasRemovidas} páginas formatadas removidas`)
      }

      // Limpar índice de capítulos
      const { error: indiceError } = await supabase
        .from('leitura_livros_indice')
        .delete()
        .ilike('livro_titulo', `%${livroTitulo}%`)

      if (indiceError) {
        console.error('[limpar-formatacao] Erro ao limpar índice:', indiceError)
      } else {
        indiceRemovido = true
        console.log(`[limpar-formatacao] Índice de capítulos removido`)
      }

      // Se limparOCR = true, limpar também o texto bruto extraído
      if (limparOCR) {
        const { error: ocrError } = await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .delete()
          .eq('Titulo da Obra', livroTitulo)

        if (ocrError) {
          console.error('[limpar-formatacao] Erro ao limpar OCR:', ocrError)
        } else {
          console.log(`[limpar-formatacao] Texto OCR bruto removido`)
        }
      }
    }

    // Limpar formatação antiga (tabela leitura_interativa) se livroId fornecido
    if (livroId) {
      const { data, error } = await supabase
        .from('leitura_interativa')
        .update({
          paginas_formatadas: {},
          formatacao_status: 'pendente',
          formatacao_progresso: 0
        })
        .eq('biblioteca_classicos_id', livroId)
        .select('id, biblioteca_classicos_id, formatacao_status')

      if (error) {
        console.error('[limpar-formatacao] Erro na tabela antiga:', error)
      } else {
        console.log(`[limpar-formatacao] Tabela antiga limpa:`, data)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Formatação limpa com sucesso',
        paginasRemovidas,
        indiceRemovido
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[limpar-formatacao] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
