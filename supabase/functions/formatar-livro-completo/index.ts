import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[]

// Interfaces para o novo sistema de repaginação
interface EstruturaElemento {
  tipo: 'parte' | 'livro' | 'capitulo'
  nome: string
  numero?: number
  titulo?: string
  posicao: number // Posição no texto concatenado
}

interface PaginaRepaginada {
  numero: number
  tipo: 'conteudo' | 'transicao_parte' | 'transicao_livro' | 'transicao_capitulo'
  html?: string
  estrutura?: EstruturaElemento
}

interface AnaliseEstrutura {
  estrutura: EstruturaElemento[]
  texto_limpo: string
}

// Limpar HTML do Gemini
function limparHtmlGemini(html: string): string {
  if (!html) return ''
  let limpo = html
  limpo = limpo.replace(/```html/gi, '')
  limpo = limpo.replace(/```/g, '')
  const bodyMatch = limpo.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) limpo = bodyMatch[1]
  limpo = limpo.replace(/<!DOCTYPE[^>]*>/gi, '')
  limpo = limpo.replace(/<\/?html[^>]*>/gi, '')
  limpo = limpo.replace(/<head[\s\S]*?<\/head>/gi, '')
  limpo = limpo.replace(/<\/?head[^>]*>/gi, '')
  limpo = limpo.replace(/<\/?body[^>]*>/gi, '')
  limpo = limpo.replace(/<meta[^>]*\/?>/gi, '')
  limpo = limpo.replace(/<title[\s\S]*?<\/title>/gi, '')
  limpo = limpo.replace(/<style[\s\S]*?<\/style>/gi, '')
  limpo = limpo.replace(/<link[^>]*\/?>/gi, '')
  limpo = limpo.replace(/<script[\s\S]*?<\/script>/gi, '')
  return limpo.trim()
}

// Chamar Gemini com fallback
async function chamarGemini(prompt: string, keyIndex = 0, maxTokens = 8192): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam')
  }

  const apiKey = GEMINI_KEYS[keyIndex]
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      if (error.includes('quota') || error.includes('429') || error.includes('RESOURCE_EXHAUSTED')) {
        console.log(`[repaginar] Quota excedida na key ${keyIndex + 1}, tentando próxima...`)
        return chamarGemini(prompt, keyIndex + 1, maxTokens)
      }
      throw new Error(`Gemini error: ${error}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (error) {
    console.error(`[repaginar] Erro na key ${keyIndex + 1}:`, error)
    return chamarGemini(prompt, keyIndex + 1, maxTokens)
  }
}

// Analisar estrutura do livro com Gemini
async function analisarEstruturaLivro(textoCompleto: string): Promise<EstruturaElemento[]> {
  console.log('[repaginar] Analisando estrutura do livro com Gemini...')
  
  // Pegar apenas os primeiros 50k caracteres para análise de estrutura (economiza tokens)
  const textoParaAnalise = textoCompleto.substring(0, 100000)
  
  const prompt = `Analise este texto de um livro clássico e identifique TODA a estrutura hierárquica.

INSTRUÇÕES:
1. Identifique TODAS as ocorrências de:
   - PARTES: "PRIMEIRA PARTE", "SEGUNDA PARTE", "PARTE I", etc.
   - LIVROS: "LIVRO PRIMEIRO", "LIVRO SEGUNDO", "LIVRO I", etc.
   - CAPÍTULOS: "CAPÍTULO I", "CAPÍTULO 1", "CHAPITRE I" (francês), etc.

2. Para cada elemento encontrado, retorne a posição APROXIMADA no texto (em caracteres desde o início)

3. Retorne APENAS um JSON válido neste formato (sem markdown):
{
  "estrutura": [
    { "tipo": "parte", "nome": "PRIMEIRA PARTE", "posicao": 0 },
    { "tipo": "livro", "nome": "LIVRO PRIMEIRO", "numero": 1, "posicao": 500 },
    { "tipo": "capitulo", "nome": "CAPÍTULO I", "numero": 1, "titulo": "Das leis em geral", "posicao": 1200 }
  ]
}

TEXTO PARA ANÁLISE:
${textoParaAnalise}`

  try {
    const resposta = await chamarGemini(prompt, 0, 4096)
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonMatch) {
      console.error('[repaginar] Resposta Gemini sem JSON válido')
      return detectarEstruturaPorRegex(textoCompleto)
    }
    
    const dados = JSON.parse(jsonMatch)
    console.log(`[repaginar] Estrutura detectada: ${dados.estrutura?.length || 0} elementos`)
    return dados.estrutura || []
  } catch (error) {
    console.error('[repaginar] Erro ao analisar estrutura:', error)
    return detectarEstruturaPorRegex(textoCompleto)
  }
}

// Fallback: Detectar estrutura por regex
function detectarEstruturaPorRegex(texto: string): EstruturaElemento[] {
  console.log('[repaginar] Usando detecção por regex como fallback...')
  const estrutura: EstruturaElemento[] = []
  
  // Regex para partes
  const regexParte = /(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA)\s+PARTE/gi
  let match
  while ((match = regexParte.exec(texto)) !== null) {
    estrutura.push({
      tipo: 'parte',
      nome: match[0],
      posicao: match.index
    })
  }
  
  // Regex para livros
  const regexLivro = /LIVRO\s+(PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO|SEXTO|SÉTIMO|OITAVO|NONO|DÉCIMO|UNDÉCIMO|DUODÉCIMO|DÉCIMO\s*TERCEIRO|DÉCIMO\s*QUARTO|DÉCIMO\s*QUINTO|DÉCIMO\s*SEXTO|DÉCIMO\s*SÉTIMO|DÉCIMO\s*OITAVO|DÉCIMO\s*NONO|VIGÉSIMO|VIGÉSIMO\s*PRIMEIRO|VIGÉSIMO\s*SEGUNDO|VIGÉSIMO\s*TERCEIRO|VIGÉSIMO\s*QUARTO|VIGÉSIMO\s*QUINTO|VIGÉSIMO\s*SEXTO|VIGÉSIMO\s*SÉTIMO|VIGÉSIMO\s*OITAVO|VIGÉSIMO\s*NONO|TRIGÉSIMO|TRIGÉSIMO\s*PRIMEIRO)/gi
  while ((match = regexLivro.exec(texto)) !== null) {
    estrutura.push({
      tipo: 'livro',
      nome: match[0],
      numero: ordinalParaNumero(match[1]),
      posicao: match.index
    })
  }
  
  // Regex para capítulos (português e francês)
  const regexCapitulo = /(?:CAPÍTULO|CHAPITRE)\s+([IVXLCDM]+|\d+)(?:\s*[-–:.]?\s*(.{0,100}))?/gi
  while ((match = regexCapitulo.exec(texto)) !== null) {
    const numeroStr = match[1].toUpperCase()
    const numero = romanoParaNumero(numeroStr) || parseInt(numeroStr, 10)
    estrutura.push({
      tipo: 'capitulo',
      nome: match[0].split(/[-–:.]/)[0].trim(),
      numero: isNaN(numero) ? undefined : numero,
      titulo: match[2]?.trim()?.substring(0, 100),
      posicao: match.index
    })
  }
  
  console.log(`[repaginar] Regex detectou ${estrutura.length} elementos`)
  return estrutura.sort((a, b) => a.posicao - b.posicao)
}

// Converter romano para número
function romanoParaNumero(romano: string): number | null {
  const mapa: Record<string, number> = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
    'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
    'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25,
    'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30, 'XXXI': 31
  }
  return mapa[romano.toUpperCase()] || null
}

// Converter ordinal para número
function ordinalParaNumero(ordinal: string): number {
  const mapa: Record<string, number> = {
    'primeiro': 1, 'segundo': 2, 'terceiro': 3, 'quarto': 4, 'quinto': 5,
    'sexto': 6, 'sétimo': 7, 'oitavo': 8, 'nono': 9, 'décimo': 10,
    'undécimo': 11, 'duodécimo': 12, 'décimo terceiro': 13, 'décimo quarto': 14,
    'décimo quinto': 15, 'décimo sexto': 16, 'décimo sétimo': 17, 'décimo oitavo': 18,
    'décimo nono': 19, 'vigésimo': 20, 'vigésimo primeiro': 21, 'vigésimo segundo': 22,
    'vigésimo terceiro': 23, 'vigésimo quarto': 24, 'vigésimo quinto': 25,
    'vigésimo sexto': 26, 'vigésimo sétimo': 27, 'vigésimo oitavo': 28,
    'vigésimo nono': 29, 'trigésimo': 30, 'trigésimo primeiro': 31
  }
  return mapa[ordinal.toLowerCase().replace(/\s+/g, ' ')] || 0
}

// Encontrar fim de parágrafo completo
function encontrarFimParagrafo(texto: string, posicaoIdeal: number): number {
  // Não ir além do texto
  if (posicaoIdeal >= texto.length) return texto.length
  
  // Procurar próxima pontuação final após posição ideal
  const busca = texto.substring(posicaoIdeal)
  const matchPontuacao = busca.match(/[.!?»"']\s/)
  
  if (matchPontuacao && matchPontuacao.index !== undefined) {
    return posicaoIdeal + matchPontuacao.index + 1
  }
  
  // Se não encontrar, procurar quebra de parágrafo
  const quebraParagrafo = busca.indexOf('\n\n')
  if (quebraParagrafo !== -1 && quebraParagrafo < 300) {
    return posicaoIdeal + quebraParagrafo
  }
  
  // Último recurso: usar posição ideal
  return Math.min(posicaoIdeal + 200, texto.length)
}

// Formatar bloco de texto com Gemini
async function formatarBlocoComGemini(texto: string): Promise<string> {
  if (!texto.trim()) return '<p class="empty-page">Página em branco</p>'
  
  const prompt = `Você é um formatador de texto especializado para leitura mobile.

INSTRUÇÕES CRÍTICAS:
1. Retorne APENAS tags HTML de conteúdo (p, h2, h3, blockquote, etc.)
2. NÃO inclua: DOCTYPE, html, head, body, meta, style, title
3. NÃO envolva em blocos markdown
4. NÃO altere NENHUMA palavra do texto original
5. MANTENHA O TEXTO COMPLETO

TAGS PERMITIDAS:
- <p class="indent"> para parágrafos normais
- <h2 class="chapter-title"> para títulos de LIVRO
- <h3 class="section-title"> para títulos de CAPÍTULO
- <blockquote> para citações
- <p class="footnote"> para notas de rodapé

TEXTO:
${texto}`

  const resultado = await chamarGemini(prompt, 0, 8192)
  return limparHtmlGemini(resultado) || `<p class="indent">${texto}</p>`
}

// ALGORITMO PRINCIPAL DE REPAGINAÇÃO
async function repaginarConteudo(
  textoCompleto: string,
  estrutura: EstruturaElemento[],
  supabase: SupabaseClient,
  livroId: number
): Promise<PaginaRepaginada[]> {
  const paginasNovas: PaginaRepaginada[] = []
  let posicaoAtual = 0
  let numeroPagina = 0
  const TAMANHO_BLOCO = 1500 // ~1500 caracteres por página
  
  console.log(`[repaginar] Iniciando repaginação de ${textoCompleto.length} caracteres`)
  
  // Ordenar estrutura por posição
  const estruturaOrdenada = [...estrutura].sort((a, b) => a.posicao - b.posicao)
  
  while (posicaoAtual < textoCompleto.length) {
    // 1. Verificar se há início de estrutura nesta posição
    const estruturaAqui = estruturaOrdenada.find(
      e => e.posicao >= posicaoAtual && e.posicao < posicaoAtual + 100
    )
    
    if (estruturaAqui && estruturaAqui.posicao <= posicaoAtual + 100) {
      // Se há texto antes da estrutura, finalizar página anterior
      if (estruturaAqui.posicao > posicaoAtual) {
        const textoAntes = textoCompleto.substring(posicaoAtual, estruturaAqui.posicao).trim()
        if (textoAntes.length > 50) {
          numeroPagina++
          const htmlFormatado = await formatarBlocoComGemini(textoAntes)
          paginasNovas.push({
            numero: numeroPagina,
            tipo: 'conteudo',
            html: htmlFormatado
          })
        }
      }
      
      // Criar página de TRANSIÇÃO
      numeroPagina++
      const tipoTransicao = estruturaAqui.tipo === 'parte' 
        ? 'transicao_parte' 
        : estruturaAqui.tipo === 'livro' 
          ? 'transicao_livro' 
          : 'transicao_capitulo'
      
      paginasNovas.push({
        numero: numeroPagina,
        tipo: tipoTransicao,
        estrutura: estruturaAqui
      })
      
      console.log(`[repaginar] Página ${numeroPagina}: ${tipoTransicao} - ${estruturaAqui.nome}`)
      
      // Avançar posição para depois do título da estrutura
      posicaoAtual = estruturaAqui.posicao + estruturaAqui.nome.length + (estruturaAqui.titulo?.length || 0) + 10
      
      // Remover esta estrutura da lista para não detectar de novo
      const idx = estruturaOrdenada.indexOf(estruturaAqui)
      if (idx > -1) estruturaOrdenada.splice(idx, 1)
      
      continue
    }
    
    // 2. Calcular fim do bloco
    let fimBloco = posicaoAtual + TAMANHO_BLOCO
    
    // 3. Verificar se há nova estrutura antes do fim
    const proximaEstrutura = estruturaOrdenada.find(e => e.posicao > posicaoAtual && e.posicao < fimBloco)
    if (proximaEstrutura) {
      // Cortar ANTES da próxima estrutura
      fimBloco = proximaEstrutura.posicao
    }
    
    // 4. Ajustar para terminar em parágrafo completo
    fimBloco = encontrarFimParagrafo(textoCompleto, fimBloco)
    
    // 5. Extrair e formatar conteúdo
    const conteudo = textoCompleto.substring(posicaoAtual, fimBloco).trim()
    
    if (conteudo.length > 50) {
      numeroPagina++
      const htmlFormatado = await formatarBlocoComGemini(conteudo)
      
      paginasNovas.push({
        numero: numeroPagina,
        tipo: 'conteudo',
        html: htmlFormatado
      })
      
      // Atualizar progresso a cada 10 páginas
      if (numeroPagina % 10 === 0) {
        const progresso = Math.min(Math.round((posicaoAtual / textoCompleto.length) * 100), 99)
        console.log(`[repaginar] Progresso: ${progresso}% - Página ${numeroPagina}`)
        
        await supabase
          .from('leitura_interativa')
          .update({
            formatacao_progresso: progresso,
            updated_at: new Date().toISOString()
          })
          .eq('biblioteca_classicos_id', livroId)
      }
    }
    
    posicaoAtual = fimBloco
    
    // Delay para não sobrecarregar API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`[repaginar] ✅ Repaginação concluída: ${numeroPagina} páginas criadas`)
  return paginasNovas
}

// Extrair capítulos da estrutura para navegação
function extrairCapitulosParaNavegacao(paginas: PaginaRepaginada[]): any[] {
  const cores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']
  const icones = ['book', 'scale', 'crown', 'sword', 'scroll', 'feather', 'landmark']
  
  return paginas
    .filter(p => p.tipo === 'transicao_capitulo' && p.estrutura)
    .map((p, idx) => ({
      numero: p.estrutura?.numero || idx + 1,
      titulo: p.estrutura?.titulo || p.estrutura?.nome || `Capítulo ${idx + 1}`,
      pagina_inicio_real: p.numero,
      pagina_inicio_estimada: p.numero,
      tema: p.estrutura?.titulo || 'Clássicos',
      cor_tema: cores[idx % cores.length],
      icone: icones[idx % icones.length]
    }))
}

// Função principal de formatação em background
async function formatarLivroBackground(
  livroId: number,
  forcarReformatar: boolean,
  supabaseUrl: string,
  supabaseKey: string
) {
  console.log(`[repaginar] Iniciando repaginação inteligente do livro ${livroId}`)
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Buscar título do livro
    const { data: livroData } = await supabase
      .from('BIBLIOTECA-CLASSICOS')
      .select('livro')
      .eq('id', livroId)
      .single()
    
    const livroTitulo = livroData?.livro || 'Livro'

    // 2. Buscar todo o conteúdo do livro (ordenado por id)
    const { data: paginasData, error: paginasError } = await supabase
      .from('AULAS INTERATIVAS')
      .select('id, Livro')
      .order('id', { ascending: true })

    if (paginasError) throw new Error(`Erro ao buscar conteúdo: ${paginasError.message}`)

    // Filtrar apenas registros com conteúdo
    const registros = (paginasData || []).filter((p: any) => p.Livro && p.Livro.trim().length > 0)
    console.log(`[repaginar] Encontrados ${registros.length} registros com conteúdo`)

    // 3. Concatenar TODO o texto em uma única string
    const textoCompleto = registros.map((p: any) => p.Livro || '').join('\n\n')
    console.log(`[repaginar] Texto total: ${textoCompleto.length} caracteres`)

    // 4. Criar/atualizar registro
    await supabase
      .from('leitura_interativa')
      .upsert({
        biblioteca_classicos_id: livroId,
        livro_titulo: livroTitulo,
        total_paginas: 0, // Será atualizado depois
        fonte_tabela: 'AULAS INTERATIVAS',
        ativo: true,
        formatacao_status: 'em_progresso',
        formatacao_progresso: 5,
        updated_at: new Date().toISOString()
      }, { onConflict: 'biblioteca_classicos_id' })

    // 5. Analisar estrutura com Gemini
    const estrutura = await analisarEstruturaLivro(textoCompleto)
    console.log(`[repaginar] Estrutura identificada: ${estrutura.length} elementos`)

    await supabase
      .from('leitura_interativa')
      .update({ formatacao_progresso: 10 })
      .eq('biblioteca_classicos_id', livroId)

    // 6. REPAGINAR o conteúdo
    const paginasRepaginadas = await repaginarConteudo(textoCompleto, estrutura, supabase, livroId)
    
    // 7. Converter para formato de armazenamento
    const paginasFormatadas: Record<string, any> = {}
    paginasRepaginadas.forEach(p => {
      paginasFormatadas[String(p.numero)] = {
        tipo: p.tipo,
        html: p.html || '',
        estrutura: p.estrutura || null
      }
    })

    // 8. Extrair capítulos para navegação
    const capitulosNavegacao = extrairCapitulosParaNavegacao(paginasRepaginadas)
    
    // 9. Salvar tudo no banco
    await supabase
      .from('leitura_interativa')
      .update({
        paginas_formatadas: paginasFormatadas,
        total_paginas: paginasRepaginadas.length,
        estrutura_capitulos: { capitulos: capitulosNavegacao },
        formatacao_status: 'concluido',
        formatacao_progresso: 100,
        updated_at: new Date().toISOString()
      })
      .eq('biblioteca_classicos_id', livroId)

    console.log(`[repaginar] ✅ Livro repaginado com sucesso! ${paginasRepaginadas.length} páginas, ${capitulosNavegacao.length} capítulos`)

  } catch (error) {
    console.error('[repaginar] ❌ Erro na repaginação:', error)
    
    await supabase
      .from('leitura_interativa')
      .update({
        formatacao_status: 'erro',
        updated_at: new Date().toISOString()
      })
      .eq('biblioteca_classicos_id', livroId)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { livroId, forcarReformatar = false } = await req.json()
    
    if (!livroId) {
      throw new Error('livroId é obrigatório')
    }

    console.log(`[repaginar] Iniciando para livro ${livroId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar se já está formatado
    const { data: leituraData } = await supabase
      .from('leitura_interativa')
      .select('paginas_formatadas, formatacao_status, formatacao_progresso')
      .eq('biblioteca_classicos_id', livroId)
      .single()

    const paginasExistentes = leituraData?.paginas_formatadas || {}

    // Se já tem páginas e não é forçar, retornar
    if (!forcarReformatar && Object.keys(paginasExistentes).length > 0) {
      console.log(`[repaginar] Livro já formatado com ${Object.keys(paginasExistentes).length} páginas`)
      return new Response(JSON.stringify({
        success: true,
        message: 'Livro já formatado',
        totalPaginas: Object.keys(paginasExistentes).length,
        jaFormatado: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Se já está em progresso
    if (leituraData?.formatacao_status === 'em_progresso' && !forcarReformatar) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Formatação em progresso',
        progresso: leituraData.formatacao_progresso || 0,
        emProgresso: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Iniciar em background
    EdgeRuntime.waitUntil(
      formatarLivroBackground(livroId, forcarReformatar, supabaseUrl, supabaseKey)
    )

    return new Response(JSON.stringify({
      success: true,
      message: 'Repaginação inteligente iniciada',
      emProgresso: true,
      progresso: 0
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[repaginar] Erro:', errorMessage)
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
