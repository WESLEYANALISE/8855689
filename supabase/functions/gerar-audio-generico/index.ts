import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de tipo para coluna no banco
const TIPO_TO_COLUNA: Record<string, string> = {
  'enunciado': 'url_audio_enunciado',
  'comentario': 'url_audio_comentario',
  'exemplo': 'url_audio_exemplo',
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
};

// ============================================
// FUNÇÃO DE NORMALIZAÇÃO
// ============================================

// Converter valor monetário brasileiro para extenso
function valorMonetarioParaExtenso(valorStr: string): string {
  // Remove R$, espaços e pontos de milhar
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
  
  // 0.0 QUEBRAR CITAÇÕES LONGAS ENTRE ASPAS
  // Citações com aspas simples longas (>100 chars) - adicionar ponto ao final
  resultado = resultado.replace(/'([^']{100,})'/g, (_match, conteudo) => {
    return conteudo.trim() + '. ';
  });
  // Citações com aspas duplas longas (>100 chars) - adicionar ponto ao final
  resultado = resultado.replace(/"([^"]{100,})"/g, (_match, conteudo) => {
    return conteudo.trim() + '. ';
  });
  
  // 0.1 REMOVER SEPARADORES "---" e substituir por pausa natural
  resultado = resultado.replace(/---+/g, '. ');
  
  // 0.2 CONVERTER QUEBRAS DE LINHA em pausas naturais
  resultado = resultado.replace(/\\n\\n+/g, '. ');  // Escaped double newlines → ponto
  resultado = resultado.replace(/\n\n+/g, '. ');    // Real double newlines → ponto
  resultado = resultado.replace(/\\n/g, '. ');      // Escaped single newline → ponto
  resultado = resultado.replace(/\n/g, '. ');       // Real single newline → ponto
  
  // 0.3 LIMPAR espaços extras
  resultado = resultado.replace(/\s+/g, ' ').trim();
  
  // 0.4 QUEBRAR FRASES MUITO LONGAS (>200 chars sem pontuação final)
  // Inserir ponto após a primeira vírgula/ponto-e-vírgula em frases longas
  const frases = resultado.split(/(?<=[.!?])\s+/);
  resultado = frases.map(frase => {
    // Se a frase tem mais de 200 chars e não tem pontuação interna
    if (frase.length > 200) {
      let fraseModificada = frase;
      
      // Primeiro, tentar quebrar em ponto-e-vírgula
      if (fraseModificada.includes(';')) {
        fraseModificada = fraseModificada.replace(/;\s*/g, '. ');
      }
      
      // Se ainda for muito longa, quebrar em vírgulas (apenas se segmento > 150 chars)
      if (fraseModificada.length > 200) {
        const partes = fraseModificada.split(',');
        let novaFrase = '';
        let segmentoAtual = '';
        
        for (let i = 0; i < partes.length; i++) {
          const parte = partes[i].trim();
          if (segmentoAtual.length + parte.length > 150 && segmentoAtual.length > 30) {
            novaFrase += segmentoAtual.trim() + '. ';
            segmentoAtual = parte;
          } else {
            segmentoAtual += (segmentoAtual ? ', ' : '') + parte;
          }
        }
        if (segmentoAtual) {
          novaFrase += segmentoAtual;
        }
        fraseModificada = novaFrase;
      }
      
      return fraseModificada;
    }
    return frase;
  }).join(' ');
  
  // 0.5 QUEBRAR EM DOIS PONTOS (geralmente introduz lista ou explicação longa)
  resultado = resultado.replace(/:\s+/g, '. ');
  
  // 0.6 CONVERTER "O Art." para "O artigo" (apenas com ponto, para não duplicar)
  resultado = resultado.replace(/O\s+[Aa]rt\.\s*/g, 'O artigo ');
  
  // Remover conteúdo entre parênteses (ex: "Polícia Federal (PF)" → "Polícia Federal")
  resultado = resultado.replace(/\s*\([^)]*\)/g, '');
  
  // 0. VALORES MONETÁRIOS - "R$ 1.000,00" → "mil reais"
  // Formatos: R$ 1.000,00 | R$1000 | R$ 50 | 1.000,00 reais
  resultado = resultado.replace(/R\$\s?[\d.,]+/gi, (match) => {
    return valorMonetarioParaExtenso(match);
  });
  
  // Valores com "reais" no final mas sem R$
  resultado = resultado.replace(/(\d[\d.,]*)\s*reais/gi, (match, valor) => {
    const valorCompleto = 'R$ ' + valor;
    return valorMonetarioParaExtenso(valorCompleto);
  });
  
  // 1. ABREVIAÇÕES - substituir por extenso
  const abreviacoesOrdenadas = Object.entries(abreviacoes).sort((a, b) => b[0].length - a[0].length);
  for (const [abrev, extenso] of abreviacoesOrdenadas) {
    const escapedAbrev = abrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedAbrev}`, 'gi');
    resultado = resultado.replace(regex, extenso);
  }
  
  // 2. PARÁGRAFOS COM NÚMERO - "§1º", "§ 1º"
  resultado = resultado.replace(/§\s?(\d+)[º°]/g, (match, num) => {
    const numero = parseInt(num, 10);
    return 'parágrafo ' + numeroParaOrdinal(numero);
  });
  
  // 3. ARTIGOS COM ORDINAL - "Art. 5º", "Art 5", "Arts. 1 e 2"
  // Regra: 1-9 = ordinal (primeiro...nono), 10+ = cardinal (dez, onze, vinte...)
  // IMPORTANTE: Só casa "Art." ou "Art" (sem ponto) - NÃO "artigo" (já convertido)
  resultado = resultado.replace(/(?:Arts?\.?)\s*(\d+)[º°]?(?:[-–]([A-Za-z]))?/gi, (match, num, letra) => {
    const numero = parseInt(num, 10);
    const letraSufixo = letra ? ` ${letra.toLowerCase()}` : '';
    if (numero >= 1 && numero <= 9) {
      return 'artigo ' + ordinaisUnidades[numero] + letraSufixo;
    }
    return 'artigo ' + numeroParaExtenso(numero) + letraSufixo;
  });
  
  // 5. ORDINAIS ISOLADOS - "1º", "2°"
  resultado = resultado.replace(/(\d+)[º°](?!\s?[-–])/g, (match, num) => {
    const numero = parseInt(num, 10);
    return numeroParaOrdinal(numero);
  });
  
  // 6. SIGLAS JURÍDICAS
  for (const [sigla, expandida] of Object.entries(siglasJuridicas)) {
    const regex = new RegExp(`\\b${sigla}\\b(?!\\/)`, 'g');
    resultado = resultado.replace(regex, expandida);
  }
  
  // 7. PORCENTAGENS - "50%"
  resultado = resultado.replace(/(\d+)%/g, (match, num) => {
    return numeroParaExtenso(parseInt(num, 10)) + ' por cento';
  });
  
  // 8. NÚMEROS COM PONTO DE MILHAR restantes (ex: "1.000" → "mil")
  resultado = resultado.replace(/\b(\d{1,3})\.(\d{3})(?:\.(\d{3}))?\b/g, (match, p1, p2, p3) => {
    const numStr = p3 ? p1 + p2 + p3 : p1 + p2;
    const num = parseInt(numStr, 10);
    return numeroParaExtenso(num);
  });
  
  // 9. NÚMEROS COM VÍRGULA DECIMAL restantes (ex: "0,5" → "zero vírgula cinco")
  resultado = resultado.replace(/(\d+),(\d+)/g, (match, inteiro, decimal) => {
    const parteInteira = numeroParaExtenso(parseInt(inteiro, 10));
    const parteDecimal = decimal.split('').map((d: string) => {
      const digitos = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      return digitos[parseInt(d, 10)];
    }).join(' ');
    return `${parteInteira} vírgula ${parteDecimal}`;
  });
  
  // 10. LIMPAR pontuação duplicada
  resultado = resultado.replace(/\.\s*\./g, '.');
  resultado = resultado.replace(/,\s*\./g, '.');
  resultado = resultado.replace(/\s+/g, ' ').trim();
  
  return resultado;
}

// Tabelas válidas para questões
const TABELAS_VALIDAS = ['QUESTOES_GERADAS', 'QUESTOES_ARTIGOS_LEI'];

// ============================================
// GEMINI TTS (gemini-2.5-flash-preview-tts)
// ============================================

async function gerarAudioGeminiTTS(
  texto: string, 
  apiKey: string, 
  voiceName: string = 'Aoede'
): Promise<Uint8Array | null> {
  console.log(`[gemini-tts] Gerando áudio com gemini-2.5-flash-preview-tts, voz: ${voiceName}...`);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[gemini-tts] Erro: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioBase64) {
      console.error('[gemini-tts] Resposta não contém áudio');
      return null;
    }
    
    // Converter base64 para bytes
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log(`[gemini-tts] Áudio gerado com sucesso: ${bytes.length} bytes`);
    return bytes;
  } catch (error) {
    console.error('[gemini-tts] Exceção:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, texto, tipo, tabela = 'QUESTOES_GERADAS' } = await req.json()

    if (!questaoId || !texto || !tipo) {
      throw new Error('questaoId, texto e tipo são obrigatórios')
    }

    // Validar tabela
    if (!TABELAS_VALIDAS.includes(tabela)) {
      throw new Error(`Tabela inválida: ${tabela}. Use: ${TABELAS_VALIDAS.join(', ')}`)
    }

    const coluna = TIPO_TO_COLUNA[tipo]
    if (!coluna) {
      throw new Error(`Tipo inválido: ${tipo}. Use: enunciado, comentario, exemplo`)
    }

    console.log(`[gerar-audio-generico] Tipo: ${tipo}, Questão: ${questaoId}, Tabela: ${tabela}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se já existe áudio no banco (tabela dinâmica)
    // TAMBÉM buscar área para decidir qual TTS usar
    let selectColumns = coluna;
    if (tabela === 'QUESTOES_ARTIGOS_LEI') {
      selectColumns = `${coluna}, area`;
    }
    
    const { data: questao, error: fetchError } = await supabase
      .from(tabela)
      .select(selectColumns)
      .eq('id', questaoId)
      .single()

    if (fetchError) {
      console.error(`[gerar-audio-generico] Erro ao buscar questão em ${tabela}:`, fetchError)
    }

    // deno-lint-ignore no-explicit-any
    const audioExistente = questao ? (questao as any)[coluna] : null
    // deno-lint-ignore no-explicit-any
    const areaQuestao = questao ? (questao as any).area : null
    
    if (audioExistente) {
      console.log(`[gerar-audio-generico] Áudio já existe para ${tipo}, retornando cache`)
      return new Response(
        JSON.stringify({ url_audio: audioExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Detectar se deve usar Gemini TTS (apenas para ESTATUTO - OAB)
    const usarGeminiTTS = tabela === 'QUESTOES_ARTIGOS_LEI' && areaQuestao === 'ESTATUTO - OAB';

    // Chaves de API disponíveis para fallback (apenas GEMINI_KEY_1, 2, 3)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }
    
    // ============================================
    // FLUXO GEMINI TTS (para ESTATUTO - OAB)
    // ============================================
    if (usarGeminiTTS) {
      console.log(`[gerar-audio-generico] Usando Gemini TTS para ESTATUTO - OAB`);
      
      for (let i = 0; i < chavesDisponiveis.length; i++) {
        console.log(`[gemini-tts] Tentando chave ${i + 1}/${chavesDisponiveis.length}...`);
        
        const audioBytes = await gerarAudioGeminiTTS(texto, chavesDisponiveis[i], 'Aoede');
        
        if (audioBytes) {
          // Upload como WAV
          const timestamp = Date.now();
          const path = `questoes/${tipo}_${questaoId}_${timestamp}.wav`;
          const audioUrl = await uploadParaSupabase(supabase, audioBytes, 'audios', path, 'audio/wav');
          
          console.log(`[gemini-tts] Upload sucesso: ${audioUrl}`);
          
          // Salvar URL no banco
          const updateObj: Record<string, string> = {};
          updateObj[coluna] = audioUrl;
          
          const { error: updateError } = await supabase
            .from(tabela)
            .update(updateObj)
            .eq('id', questaoId);
          
          if (updateError) {
            console.error(`[gemini-tts] Erro ao salvar URL:`, updateError);
          } else {
            console.log(`[gemini-tts] URL salva na coluna ${coluna}`);
          }
          
          return new Response(
            JSON.stringify({ url_audio: audioUrl, cached: false, method: 'gemini-tts' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`[gemini-tts] Falha com chave ${i + 1}, tentando próxima...`);
      }
      
      // Se todas as chaves falharem no Gemini TTS, continuar com o método tradicional
      console.log(`[gerar-audio-generico] Gemini TTS falhou, usando fallback Google Cloud TTS...`);
    }
    
    // ============================================
    // FLUXO TRADICIONAL (Google Cloud TTS)
    // ============================================

    // PRIMEIRO: Usar IA para converter texto para formato por extenso (incisos, alíneas, parágrafos, etc.)
    let textoConvertido = texto;
    
    // Tipos que precisam de conversão IA (comentário e exemplo são mais técnicos com incisos/alíneas)
    const tiposPrecisamIA = ['comentario', 'exemplo', 'enunciado'];
    
    if (tiposPrecisamIA.includes(tipo)) {
      console.log(`[gerar-audio-generico] Convertendo texto para extenso via IA...`);
      
      for (let i = 0; i < chavesDisponiveis.length; i++) {
        try {
          const promptConversao = `Você é um conversor de texto jurídico para narração em áudio. Sua ÚNICA tarefa é converter o texto abaixo para um formato que possa ser lido em voz alta corretamente.

REGRAS DE CONVERSÃO OBRIGATÓRIAS:
1. ALGARISMOS ROMANOS como incisos:
   - "I -" ou "I–" → "inciso primeiro"
   - "II -" → "inciso segundo"
   - "III -" → "inciso terceiro"
   - "IV -" → "inciso quarto"
   - "V -" → "inciso quinto"
   - "VI -" → "inciso sexto"
   - E assim por diante...

2. ALÍNEAS:
   - "a)" → "alínea a"
   - "b)" → "alínea b"
   - E assim por diante...

3. PARÁGRAFOS:
   - "§ 1º" ou "§1º" → "parágrafo primeiro"
   - "§ 2º" → "parágrafo segundo"
   - "§ único" → "parágrafo único"

4. ARTIGOS:
   - "Art. 5º" → "artigo quinto"
   - "art. 121" → "artigo cento e vinte e um"
   - "Arts. 1º a 5º" → "artigos primeiro a quinto"

5. NÚMEROS ORDINAIS:
   - "1º" → "primeiro"
   - "2º" → "segundo"
   - "3ª" → "terceira"

6. ABREVIAÇÕES JURÍDICAS:
   - "CF" → "Constituição Federal"
   - "CP" → "Código Penal"
   - "CPC" → "Código de Processo Civil"
   - "CC" → "Código Civil"
   - "CLT" → "Consolidação das Leis do Trabalho"

7. MANTER o conteúdo INTACTO - apenas converter para formato legível

TEXTO PARA CONVERTER:
${texto}

RESPONDA APENAS COM O TEXTO CONVERTIDO, sem explicações ou comentários adicionais.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chavesDisponiveis[i]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptConversao }] }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 4096,
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const textoGerado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textoGerado && textoGerado.trim().length > 0) {
              textoConvertido = textoGerado.trim();
              console.log(`[gerar-audio-generico] Texto convertido via IA com chave ${i + 1}`);
              break;
            }
          } else if (response.status === 429) {
            console.log(`[gerar-audio-generico] Rate limit na conversão IA, tentando próxima chave...`);
            continue;
          }
        } catch (err) {
          console.error(`[gerar-audio-generico] Erro na conversão IA com chave ${i + 1}:`, err);
          if (i === chavesDisponiveis.length - 1) {
            console.log(`[gerar-audio-generico] Fallback: usando normalização local`);
          }
        }
      }
    }

    // DEPOIS: Aplicar normalização local adicional (valores monetários, siglas restantes, etc.)
    const textoNormalizado = normalizarTextoParaTTS(textoConvertido)
    // Google Cloud TTS suporta até ~5000 bytes. O texto em português pode ter caracteres de 2-3 bytes,
    // então limitamos a 4500 caracteres para garantir segurança
    const textoLimitado = textoNormalizado.substring(0, 4500)

    console.log(`[gerar-audio-generico] Gerando áudio para ${tipo} (${chavesDisponiveis.length} chaves disponíveis)...`)
    console.log(`[gerar-audio-generico] Texto original: ${texto.length} chars, normalizado: ${textoNormalizado.length} chars, limitado: ${textoLimitado.length} chars`)
    console.log(`[gerar-audio-generico] Texto normalizado: ${textoLimitado.substring(0, 300)}...`)

    const requestBody = {
      input: { text: textoLimitado },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Chirp3-HD-Aoede',
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
        console.log(`[gerar-audio-generico] Tentando chave ${i + 1}/${chavesDisponiveis.length}...`);
        
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
          console.error(`[gerar-audio-generico] Erro TTS com chave ${i + 1}: ${ttsResponse.status}`);
          
          if (ttsResponse.status === 429 && i < chavesDisponiveis.length - 1) {
            console.log(`[gerar-audio-generico] Rate limit na chave ${i + 1}, tentando próxima...`);
            continue;
          }
          
          if (i === chavesDisponiveis.length - 1) {
            throw new Error(`Google TTS falhou: ${ttsResponse.status} - ${errorText}`);
          }
          continue;
        }

        ttsData = await ttsResponse.json();
        console.log(`[gerar-audio-generico] Sucesso com chave ${i + 1}`);
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

    // 3. Converter base64 para Uint8Array
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-audio-generico] Áudio gerado, tamanho: ${bytes.length} bytes`)

    // 4. Upload para Supabase Storage
    const timestamp = Date.now()
    const path = `questoes/${tipo}_${questaoId}_${timestamp}.mp3`
    const audioUrl = await uploadParaSupabase(supabase, bytes, 'audios', path, 'audio/mpeg')

    console.log(`[gerar-audio-generico] Upload Supabase sucesso: ${audioUrl}`)

    // 5. Salvar URL no banco
    const updateObj: Record<string, string> = {}
    updateObj[coluna] = audioUrl

    const { error: updateError } = await supabase
      .from(tabela)
      .update(updateObj)
      .eq('id', questaoId)

    if (updateError) {
      console.error(`[gerar-audio-generico] Erro ao salvar URL em ${tabela}:`, updateError)
    } else {
      console.log(`[gerar-audio-generico] URL salva na coluna ${coluna} para questão ${questaoId} em ${tabela}`)
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-generico] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
