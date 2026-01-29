import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any, 
  bytes: Uint8Array, 
  bucket: string, 
  path: string, 
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true })
  
  if (error) {
    console.error('[upload] Erro:', error)
    throw new Error(`Erro no upload: ${error.message}`)
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  console.log(`[upload] URL pública: ${data.publicUrl}`)
  return data.publicUrl
}

// ============================================
// FUNÇÕES DE CONVERSÃO DE NÚMEROS
// ============================================

const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function numeroParaExtenso(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'menos ' + numeroParaExtenso(-n);
  
  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return dezenas[dezena] + (unidade ? ' e ' + unidades[unidade] : '');
  }
  if (n === 100) return 'cem';
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[centena] + (resto ? ' e ' + numeroParaExtenso(resto) : '');
  }
  if (n < 2000) {
    const resto = n % 1000;
    return 'mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  if (n < 1000000) {
    const milhar = Math.floor(n / 1000);
    const resto = n % 1000;
    return numeroParaExtenso(milhar) + ' mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  return n.toString();
}

// ============================================
// FUNÇÕES DE ORDINAIS
// ============================================

const ordinaisUnidades = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
const ordinaisDezenas = ['', 'décimo', 'vigésimo', 'trigésimo', 'quadragésimo', 'quinquagésimo', 'sexagésimo', 'septuagésimo', 'octogésimo', 'nonagésimo'];
const ordinaisCentenas = ['', 'centésimo', 'ducentésimo', 'tricentésimo', 'quadringentésimo', 'quingentésimo', 'sexcentésimo', 'septingentésimo', 'octingentésimo', 'nongentésimo'];

function numeroParaOrdinal(n: number): string {
  if (n <= 0) return numeroParaExtenso(n);
  if (n < 10) return ordinaisUnidades[n];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return ordinaisDezenas[dezena] + (unidade ? ' ' + ordinaisUnidades[unidade] : '');
  }
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return ordinaisCentenas[centena] + (resto ? ' ' + numeroParaOrdinal(resto) : '');
  }
  return numeroParaExtenso(n);
}

// ============================================
// ABREVIAÇÕES GERAIS
// ============================================

const abreviacoes: { [key: string]: string } = {
  'arts.': 'artigos',
  'Arts.': 'Artigos',
  'art.': 'artigo',
  'Art.': 'Artigo',
  'inc.': 'inciso',
  'Inc.': 'Inciso',
  'par.': 'parágrafo',
  'Par.': 'Parágrafo',
  'al.': 'alínea',
  'Dr.': 'Doutor',
  'Dra.': 'Doutora',
  'Sr.': 'Senhor',
  'Sra.': 'Senhora',
  'nº': 'número',
  'Nº': 'Número',
  'n.': 'número',
  'etc.': 'etcétera',
  'ex.': 'exemplo',
  'obs.': 'observação',
};

// ============================================
// SIGLAS JURÍDICAS
// ============================================

const siglasJuridicas: { [key: string]: string } = {
  'CC': 'Código Civil',
  'CPC': 'Código de Processo Civil',
  'CDC': 'Código de Defesa do Consumidor',
  'CF': 'Constituição Federal',
  'CP': 'Código Penal',
  'CPP': 'Código de Processo Penal',
  'CTN': 'Código Tributário Nacional',
  'CLT': 'Consolidação das Leis do Trabalho',
  'ECA': 'Estatuto da Criança e do Adolescente',
  'STF': 'Supremo Tribunal Federal',
  'STJ': 'Superior Tribunal de Justiça',
  'OAB': 'Ordem dos Advogados do Brasil',
  'LINDB': 'Lei de Introdução às Normas do Direito Brasileiro',
  'TJSP': 'Tribunal de Justiça de São Paulo',
};

// ============================================
// FUNÇÃO DE NORMALIZAÇÃO
// ============================================

function valorMonetarioParaExtenso(valorStr: string): string {
  let limpo = valorStr.replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.');
  const valor = parseFloat(limpo);
  
  if (isNaN(valor)) return valorStr;
  
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  let resultado = '';
  
  if (inteiro === 0 && centavos > 0) {
    resultado = numeroParaExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  } else if (inteiro > 0) {
    resultado = numeroParaExtenso(inteiro) + (inteiro === 1 ? ' real' : ' reais');
    if (centavos > 0) {
      resultado += ' e ' + numeroParaExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
    }
  } else {
    resultado = 'zero reais';
  }
  
  return resultado;
}

function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto;
  
  // Remover conteúdo entre parênteses
  resultado = resultado.replace(/\s*\([^)]*\)/g, '');
  
  // VALORES MONETÁRIOS
  resultado = resultado.replace(/R\$\s?[\d.,]+/gi, (match) => {
    return valorMonetarioParaExtenso(match);
  });
  
  resultado = resultado.replace(/(\d[\d.,]*)\s*reais/gi, (match, valor) => {
    const valorCompleto = 'R$ ' + valor;
    return valorMonetarioParaExtenso(valorCompleto);
  });
  
  // ABREVIAÇÕES
  const abreviacoesOrdenadas = Object.entries(abreviacoes).sort((a, b) => b[0].length - a[0].length);
  for (const [abrev, extenso] of abreviacoesOrdenadas) {
    const escapedAbrev = abrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedAbrev}`, 'gi');
    resultado = resultado.replace(regex, extenso);
  }
  
  // PARÁGRAFOS
  resultado = resultado.replace(/§\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'parágrafo ' + numeroParaOrdinal(numero);
  });
  
  // ARTIGOS - Regra: 1-9 = ordinal (primeiro...nono), 10+ = cardinal (dez, onze, vinte...)
  // Inclui "Art." com ponto e "Artigo/Artigos"
  resultado = resultado.replace(/(?:Art\.?|[Aa]rtigos?)\s*(\d+)[º°]?(?:[-–]([A-Za-z]))?/g, (match, num, letra) => {
    const numero = parseInt(num, 10);
    const letraSufixo = letra ? ` ${letra.toLowerCase()}` : '';
    if (numero >= 1 && numero <= 9) {
      return 'artigo ' + ordinaisUnidades[numero] + letraSufixo;
    }
    return 'artigo ' + numeroParaExtenso(numero) + letraSufixo;
  });
  
  // ORDINAIS ISOLADOS
  resultado = resultado.replace(/(\d+)[º°](?!\s?[-–])/g, (match, num) => {
    const numero = parseInt(num, 10);
    return numeroParaOrdinal(numero);
  });
  
  // SIGLAS JURÍDICAS
  for (const [sigla, expandida] of Object.entries(siglasJuridicas)) {
    const regex = new RegExp(`\\b${sigla}\\b(?!\\/)`, 'g');
    resultado = resultado.replace(regex, expandida);
  }
  
  // PORCENTAGENS
  resultado = resultado.replace(/(\d+)%/g, (match, num) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' por cento';
  });
  
  // NÚMEROS COM PONTO DE MILHAR
  resultado = resultado.replace(/\b(\d{1,3})\.(\d{3})(?:\.(\d{3}))?\b/g, (match, p1, p2, p3) => {
    const numStr = p3 ? p1 + p2 + p3 : p1 + p2;
    const num = parseInt(numStr, 10);
    return numeroParaExtenso(num);
  });
  
  // NÚMEROS COM VÍRGULA DECIMAL
  resultado = resultado.replace(/(\d+),(\d+)/g, (match, inteiro, decimal) => {
    const parteInteira = numeroParaExtenso(parseInt(inteiro, 10));
    const parteDecimal = decimal.split('').map((d: string) => {
      const digitos = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      return digitos[parseInt(d, 10)];
    }).join(' ');
    return `${parteInteira} vírgula ${parteDecimal}`;
  });
  
  return resultado;
}

// Formatar alternativas para narração
function formatarAlternativasParaNarracao(
  alternativaA: string,
  alternativaB: string,
  alternativaC: string,
  alternativaD: string,
  alternativaE?: string
): string {
  let texto = `Alternativa A: ${alternativaA}. `;
  texto += `Alternativa B: ${alternativaB}. `;
  texto += `Alternativa C: ${alternativaC}. `;
  texto += `Alternativa D: ${alternativaD}. `;
  if (alternativaE) {
    texto += `Alternativa E: ${alternativaE}.`;
  }
  return texto;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, texto, tipo, tabela, alternativas } = await req.json()

    if (!questaoId || !tipo || !tabela) {
      throw new Error('questaoId, tipo e tabela são obrigatórios')
    }

    console.log(`[gerar-audio-simulado] Tipo: ${tipo}, Tabela: ${tabela}, Questão: ${questaoId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determinar colunas com base na tabela
    const isOAB = tabela === 'SIMULADO-OAB'
    const colunaEnunciado = isOAB ? 'Questao Narrada' : 'questao_narrada'
    const colunaAlternativas = isOAB ? 'Alternativas Narradas' : 'alternativas_narradas'
    const coluna = tipo === 'enunciado' ? colunaEnunciado : colunaAlternativas

    // Verificar se já existe áudio no banco
    const { data: questao, error: fetchError } = await supabase
      .from(tabela)
      .select('*')
      .eq('id', questaoId)
      .single()

    if (fetchError) {
      console.error('[gerar-audio-simulado] Erro ao buscar questão:', fetchError)
      throw new Error(`Questão não encontrada: ${fetchError.message}`)
    }

    const audioExistente = questao ? questao[coluna] : null
    if (audioExistente) {
      console.log(`[gerar-audio-simulado] Áudio já existe para ${tipo}, retornando cache`)
      return new Response(
        JSON.stringify({ url_audio: audioExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar texto para geração
    let textoParaGerar = ''
    
    if (tipo === 'enunciado') {
      textoParaGerar = texto || (isOAB ? questao['Enunciado'] : questao['enunciado']) || ''
    } else if (tipo === 'alternativas') {
      if (alternativas) {
        textoParaGerar = formatarAlternativasParaNarracao(
          alternativas.A,
          alternativas.B,
          alternativas.C,
          alternativas.D,
          alternativas.E
        )
      } else if (isOAB) {
        textoParaGerar = formatarAlternativasParaNarracao(
          questao['Alternativa A'] || '',
          questao['Alternativa B'] || '',
          questao['Alternativa C'] || '',
          questao['Alternativa D'] || '',
          undefined
        )
      } else {
        textoParaGerar = formatarAlternativasParaNarracao(
          questao['alternativa_a'] || '',
          questao['alternativa_b'] || '',
          questao['alternativa_c'] || '',
          questao['alternativa_d'] || '',
          questao['alternativa_e'] || undefined
        )
      }
    }

    if (!textoParaGerar) {
      throw new Error('Texto para geração não encontrado')
    }

    // Chaves de API disponíveis para fallback (3 chaves Gemini)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }

    // Normalizar texto antes de enviar para TTS
    const textoNormalizado = normalizarTextoParaTTS(textoParaGerar)
    const textoLimitado = textoNormalizado.substring(0, 4900)

    console.log(`[gerar-audio-simulado] Gerando áudio para ${tipo} (${chavesDisponiveis.length} chaves GEMINI disponíveis)...`)
    console.log(`[gerar-audio-simulado] Texto: ${textoLimitado.substring(0, 200)}...`)

    const requestBody = {
      input: { text: textoLimitado },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Chirp3-HD-Aoede',  // Voz feminina
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0
      }
    };

    // Tentar com cada chave até uma funcionar
    let ttsData: any = null;

    for (let i = 0; i < chavesDisponiveis.length; i++) {
      try {
        console.log(`[gerar-audio-simulado] Tentando GEMINI_KEY_${i + 1}...`);
        
        const ttsResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${chavesDisponiveis[i]}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`[gerar-audio-simulado] Erro TTS com GEMINI_KEY_${i + 1}: ${ttsResponse.status}`);
          
          // Se for rate limit ou quota, tentar próxima chave
          if ((ttsResponse.status === 429 || errorText.includes('quota')) && i < chavesDisponiveis.length - 1) {
            console.log(`[gerar-audio-simulado] Rate limit na GEMINI_KEY_${i + 1}, tentando próxima...`);
            continue;
          }
          
          if (i === chavesDisponiveis.length - 1) {
            throw new Error(`Todas as ${chavesDisponiveis.length} chaves falharam: ${ttsResponse.status}`);
          }
          continue;
        }

        ttsData = await ttsResponse.json();
        console.log(`[gerar-audio-simulado] ✅ Sucesso com GEMINI_KEY_${i + 1}`);
        break;
      } catch (error: any) {
        if (i === chavesDisponiveis.length - 1) {
          throw error;
        }
      }
    }

    if (!ttsData) {
      throw new Error('Falha em todas as chaves de API TTS');
    }

    const audioContent = ttsData.audioContent

    if (!audioContent) {
      throw new Error('Google TTS não retornou audioContent')
    }

    // Converter base64 para Uint8Array
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-audio-simulado] Áudio gerado, tamanho: ${bytes.length} bytes`)

    // Upload para Supabase Storage
    const timestamp = Date.now()
    const tabelaClean = tabela.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const path = `simulados/${tabelaClean}/${tipo}_${questaoId}_${timestamp}.mp3`
    const audioUrl = await uploadParaSupabase(supabase, bytes, 'audios', path, 'audio/mpeg')

    console.log(`[gerar-audio-simulado] Upload Supabase sucesso: ${audioUrl}`)

    // Salvar URL no banco
    const updateObj: Record<string, string> = {}
    updateObj[coluna] = audioUrl

    const { error: updateError } = await supabase
      .from(tabela)
      .update(updateObj)
      .eq('id', questaoId)

    if (updateError) {
      console.error('[gerar-audio-simulado] Erro ao salvar URL:', updateError)
    } else {
      console.log(`[gerar-audio-simulado] URL salva na coluna ${coluna} para questão ${questaoId}`)
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-simulado] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
