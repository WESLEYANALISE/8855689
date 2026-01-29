import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lista completa de todas as tabelas de leis
const TABELAS_LEIS = [
  "CF - Constituição Federal",
  "CC - Código Civil",
  "CP - Código Penal",
  "CPC – Código de Processo Civil",
  "CPP – Código de Processo Penal",
  "CLT - Consolidação das Leis do Trabalho",
  "CDC – Código de Defesa do Consumidor",
  "CTN – Código Tributário Nacional",
  "CTB Código de Trânsito Brasileiro",
  "CE – Código Eleitoral",
  "CPM – Código Penal Militar",
  "CPPM – Código de Processo Penal Militar",
  "CDM – Código de Minas",
  "CCOM – Código Comercial",
  "CA - Código de Águas",
  "CBA Código Brasileiro de Aeronáutica",
  "CBT Código Brasileiro de Telecomunicações",
  "ECA - Estatuto da Criança e do Adolescente",
  "EI - Estatuto do Idoso",
  "EPD - Estatuto da Pessoa com Deficiência",
  "EOAB - Estatuto da Ordem dos Advogados do Brasil",
  "ETJ - Estatuto do Torcedor",
  "EIR - Estatuto do Índio",
  "EC - Estatuto da Cidade",
  "ET - Estatuto da Terra",
  "EM - Estatuto dos Militares",
  "ED - Estatuto do Desarmamento",
  "EE - Estatuto do Estrangeiro",
  "ERF - Estatuto dos Refugiados",
  "EIG - Estatuto da Igualdade Racial",
  "EJ - Estatuto da Juventude",
  "EMP - Estatuto da Microempresa",
  "EPA - Estatuto da Primeira Infância",
  "LEP - Lei de Execução Penal",
  "LIA - Lei de Improbidade Administrativa",
  "LACP - Lei da Ação Civil Pública",
  "LAP - Lei da Ação Popular",
  "LMS - Lei do Mandado de Segurança",
  "LJEF - Lei dos Juizados Especiais Federais",
  "LJE - Lei dos Juizados Especiais",
  "LRJC - Lei dos Recursos nos Juizados Especiais Cíveis",
  "LINDB - Lei de Introdução às Normas do Direito Brasileiro",
  "LRF - Lei de Responsabilidade Fiscal",
  "LLICIT - Lei de Licitações",
  "LF - Lei de Falências",
  "LAR - Lei de Arbitragem",
  "LP - Lei de Drogas",
  "LMV - Lei Maria da Penha",
  "LCH - Lei de Crimes Hediondos",
  "LCA - Lei de Crimes Ambientais",
  "ENUNCIADOS CNJ",
  "SUMULAS STF",
  "SUMULAS STJ"
]

// Lista de números romanos de I a C (100) - ordenados do maior para o menor
const NUMEROS_ROMANOS = [
  'C', 'XCIX', 'XCVIII', 'XCVII', 'XCVI', 'XCV', 'XCIV', 'XCIII', 'XCII', 'XCI', 'XC',
  'LXXXIX', 'LXXXVIII', 'LXXXVII', 'LXXXVI', 'LXXXV', 'LXXXIV', 'LXXXIII', 'LXXXII', 'LXXXI', 'LXXX',
  'LXXIX', 'LXXVIII', 'LXXVII', 'LXXVI', 'LXXV', 'LXXIV', 'LXXIII', 'LXXII', 'LXXI', 'LXX',
  'LXIX', 'LXVIII', 'LXVII', 'LXVI', 'LXV', 'LXIV', 'LXIII', 'LXII', 'LXI', 'LX',
  'LIX', 'LVIII', 'LVII', 'LVI', 'LV', 'LIV', 'LIII', 'LII', 'LI', 'L',
  'XLIX', 'XLVIII', 'XLVII', 'XLVI', 'XLV', 'XLIV', 'XLIII', 'XLII', 'XLI', 'XL',
  'XXXIX', 'XXXVIII', 'XXXVII', 'XXXVI', 'XXXV', 'XXXIV', 'XXXIII', 'XXXII', 'XXXI', 'XXX',
  'XXIX', 'XXVIII', 'XXVII', 'XXVI', 'XXV', 'XXIV', 'XXIII', 'XXII', 'XXI', 'XX',
  'XIX', 'XVIII', 'XVII', 'XVI', 'XV', 'XIV', 'XIII', 'XII', 'XI', 'X',
  'IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'
]

// Função para formatar texto de artigo com quebras de linha corretas
// IMPORTANTE: Usar apenas \n (uma quebra), pois o CSS whitespace-pre-line já renderiza corretamente
function formatarArtigo(texto: string): string {
  if (!texto) return texto
  
  let formatado = texto
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMEIRO: REMOVER QUEBRAS DE LINHA DESNECESSÁRIAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Juntar linhas onde texto termina com letra minúscula e próxima começa com minúscula
  formatado = formatado.replace(/([a-záéíóúàâêôãõç])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
  
  // Juntar preposições/artigos com palavra seguinte
  formatado = formatado.replace(/\b(de|da|do|das|dos|em|na|no|nas|nos|a|o|as|os|e|ou|que|se|para|por|com|sem)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
  
  // Juntar verbos com complementos
  formatado = formatado.replace(/\b(poderá|deverá|será|serão|podem|devem|ficam|são|é|bem|assim|como)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
  
  // Juntar inciso romano com texto que ficou na linha seguinte
  formatado = formatado.replace(/([IVXLCDM]+\s*[-–])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
  
  // Juntar alíneas com texto
  formatado = formatado.replace(/([a-z]\))\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
  
  // Juntar parágrafo com texto
  formatado = formatado.replace(/(§\s*\d+[ºª°]?)\s*\n\s*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ])/g, '$1 $2')
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEPOIS: ADICIONAR QUEBRAS DE LINHA ONDE NECESSÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Adicionar quebra antes de parágrafos (§ 1º, § 2º, etc.) - apenas após pontuação
  formatado = formatado.replace(/([.;:!?])\s+(§\s*\d+[ºª°]?)/g, '$1\n$2')
  
  // Adicionar quebra antes de "Parágrafo único"
  formatado = formatado.replace(/([.;:!?])\s+(Parágrafo único)/gi, '$1\n$2')
  
  // Adicionar quebra antes de incisos romanos (I -, II -, etc.) - apenas após pontuação
  for (const r of NUMEROS_ROMANOS) {
    const regex = new RegExp(`([.;:!?])\\s+(${r}\\s*[-–—])`, 'g')
    formatado = formatado.replace(regex, '$1\n$2')
  }
  
  // Adicionar quebra antes de alíneas (a), b), c), etc.) - apenas após pontuação
  formatado = formatado.replace(/([.;])\s+([a-z]\))/g, '$1\n$2')
  
  // Remover quebras de linha duplicadas (normalizar para uma só)
  formatado = formatado.replace(/\n{2,}/g, '\n')
  
  // Remover quebras no início do texto
  formatado = formatado.replace(/^\n+/, '')
  
  return formatado.trim()
}

// Verifica se o artigo precisa de formatação
function precisaFormatacao(texto: string): boolean {
  if (!texto) return false
  
  // Verifica se tem quebras de linha desnecessárias no meio de frases
  const temQuebraNoMeioFrase = /[a-záéíóúàâêôãõç]\s*\n\s*[a-záéíóúàâêôãõç]/i.test(texto)
  
  // Verifica se tem incisos, parágrafos ou alíneas sem quebra de linha antes
  const temIncisoSemQuebra = /[^.\n;:!?]([IVXLC]+\s*[-–—])/.test(texto)
  const temParagrafoSemQuebra = /[^.\n;:!?](§\s*\d+[º°]?)/.test(texto)
  const temAlineaSemQuebra = /[^.\n;](([a-z]\)))/.test(texto)
  const temParagrafoUnicoSemQuebra = /[^.\n;:!?](Parágrafo único)/i.test(texto)
  
  return temQuebraNoMeioFrase || temIncisoSemQuebra || temParagrafoSemQuebra || temAlineaSemQuebra || temParagrafoUnicoSemQuebra
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { modo = 'verificar', tabela } = await req.json()

    console.log(`[corrigir-formatacao] Modo: ${modo}, Tabela: ${tabela || 'todas'}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const resultados: Array<{
      tabela: string
      total_artigos: number
      artigos_com_problema: number
      artigos_corrigidos: number
      status: string
    }> = []

    const tabelasParaProcessar = tabela ? [tabela] : TABELAS_LEIS

    for (const nomeTabela of tabelasParaProcessar) {
      console.log(`[corrigir-formatacao] Processando tabela: ${nomeTabela}`)
      
      try {
        // Buscar todos os artigos da tabela
        const { data: artigos, error } = await supabase
          .from(nomeTabela)
          .select('id, Artigo, "Número do Artigo"')
        
        if (error) {
          console.log(`[corrigir-formatacao] Erro ao buscar ${nomeTabela}: ${error.message}`)
          resultados.push({
            tabela: nomeTabela,
            total_artigos: 0,
            artigos_com_problema: 0,
            artigos_corrigidos: 0,
            status: `Erro: ${error.message}`
          })
          continue
        }

        if (!artigos || artigos.length === 0) {
          resultados.push({
            tabela: nomeTabela,
            total_artigos: 0,
            artigos_com_problema: 0,
            artigos_corrigidos: 0,
            status: 'Tabela vazia ou não encontrada'
          })
          continue
        }

        let artigosComProblema = 0
        let artigosCorrigidos = 0

        for (const artigo of artigos) {
          const textoOriginal = artigo.Artigo
          
          if (precisaFormatacao(textoOriginal)) {
            artigosComProblema++
            
            if (modo === 'corrigir' || modo === 'corrigir-tabela') {
              const textoFormatado = formatarArtigo(textoOriginal)
              
              // Atualizar no banco
              const { error: updateError } = await supabase
                .from(nomeTabela)
                .update({ Artigo: textoFormatado })
                .eq('id', artigo.id)
              
              if (updateError) {
                console.log(`[corrigir-formatacao] Erro ao atualizar artigo ${artigo.id} em ${nomeTabela}: ${updateError.message}`)
              } else {
                artigosCorrigidos++
                console.log(`[corrigir-formatacao] Corrigido: ${nomeTabela} - Art. ${artigo['Número do Artigo'] || artigo.id}`)
              }
            }
          }
        }

        resultados.push({
          tabela: nomeTabela,
          total_artigos: artigos.length,
          artigos_com_problema: artigosComProblema,
          artigos_corrigidos: artigosCorrigidos,
          status: artigosComProblema === 0 ? 'OK - Formatação correta' : 
                  (modo === 'verificar' ? 'Precisa correção' : 'Corrigido')
        })

      } catch (err) {
        console.log(`[corrigir-formatacao] Exceção em ${nomeTabela}: ${err}`)
        resultados.push({
          tabela: nomeTabela,
          total_artigos: 0,
          artigos_com_problema: 0,
          artigos_corrigidos: 0,
          status: `Exceção: ${err}`
        })
      }
    }

    // Resumo
    const tabelasAnalisadas = resultados.length
    const tabelasComProblema = resultados.filter(r => r.artigos_com_problema > 0).length
    const totalArtigosCorrigidos = resultados.reduce((acc, r) => acc + r.artigos_corrigidos, 0)
    const totalArtigosComProblema = resultados.reduce((acc, r) => acc + r.artigos_com_problema, 0)

    console.log(`[corrigir-formatacao] Concluído. Tabelas: ${tabelasAnalisadas}, Com problemas: ${tabelasComProblema}, Artigos corrigidos: ${totalArtigosCorrigidos}`)

    return new Response(
      JSON.stringify({
        success: true,
        modo,
        resumo: {
          tabelas_analisadas: tabelasAnalisadas,
          tabelas_com_problemas: tabelasComProblema,
          total_artigos_com_problema: totalArtigosComProblema,
          total_artigos_corrigidos: totalArtigosCorrigidos
        },
        detalhes: resultados.filter(r => r.artigos_com_problema > 0 || r.status.includes('Erro'))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[corrigir-formatacao] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
