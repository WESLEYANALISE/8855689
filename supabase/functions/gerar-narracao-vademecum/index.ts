import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chaves Gemini para fallback (incluindo DIREITO_PREMIUM_API_KEY como backup extra)
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
  Deno.env.get("DIREITO_PREMIUM_API_KEY"),
].filter(Boolean) as string[];

// Voz padrão: Kore (feminina) - mesma da Lei Seca
const VOICE_NAME = "Kore";

// Mapeamento de nomes de tabelas para nomes legíveis
const tableToReadableName: { [key: string]: string } = {
  // Códigos
  "CC - Código Civil": "Código Civil",
  "CP - Código Penal": "Código Penal",
  "CPC – Código de Processo Civil": "Código de Processo Civil",
  "CPP – Código de Processo Penal": "Código de Processo Penal",
  "CF - Constituição Federal": "Constituição Federal",
  "CLT - Consolidação das Leis do Trabalho": "Consolidação das Leis do Trabalho",
  "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CTN – Código Tributário Nacional": "Código Tributário Nacional",
  "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CE – Código Eleitoral": "Código Eleitoral",
  "CA - Código de Águas": "Código de Águas",
  "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
  "CBT Código Brasileiro de Telecomunicações": "Código Brasileiro de Telecomunicações",
  "CCOM – Código Comercial": "Código Comercial",
  "CDM – Código de Minas": "Código de Minas",
  "CP - Código de Pesca": "Código de Pesca",
  "CC - Código de Caça": "Código de Caça",
  "CF - Código Florestal": "Código Florestal",
  "CDUS - Código de Defesa do Usuário": "Código de Defesa do Usuário",
  "CPI - Código de Propriedade Industrial": "Código de Propriedade Industrial",
  "CPM – Código Penal Militar": "Código Penal Militar",
  "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
  
  // Leis específicas
  "LEI 8213 - Benefícios": "Lei de Benefícios da Previdência Social",
  "LEI 8212 - Custeio": "Lei de Custeio da Previdência Social",
  "LEI 8429 - IMPROBIDADE": "Lei de Improbidade Administrativa",
  "LEI 12527 - ACESSO INFORMACAO": "Lei de Acesso à Informação",
  "LEI 12846 - ANTICORRUPCAO": "Lei Anticorrupção",
  "LEI 13140 - MEDIACAO": "Lei de Mediação",
  "LEI 13709 - LGPD": "Lei Geral de Proteção de Dados",
  "LC 101 - LRF": "Lei de Responsabilidade Fiscal",
  "LEI 14133 - LICITACOES": "Lei de Licitações e Contratos",
  "LEI 4717 - ACAO POPULAR": "Lei da Ação Popular",
  "LEI 6015 - REGISTROS PUBLICOS": "Lei de Registros Públicos",
  "LEI 7347 - ACAO CIVIL PUBLICA": "Lei da Ação Civil Pública",
  "LEI 9099 - JUIZADOS CIVEIS": "Lei dos Juizados Especiais",
  "LEI 9430 - LEGISLACAO TRIBUTARIA": "Lei da Legislação Tributária",
  "LEI 9784 - PROCESSO ADMINISTRATIVO": "Lei do Processo Administrativo",
  "LEI 9868 - ADI E ADC": "Lei da ADI e ADC",
  "LEI 9455 - TORTURA": "Lei de Tortura",
  "LEI 12850 - ORGANIZACOES CRIMINOSAS": "Lei das Organizações Criminosas",
  "LEI 13964 - PACOTE ANTICRIME": "Pacote Anticrime",
  "LEI 7170 - SEGURANCA NACIONAL": "Lei de Segurança Nacional",
  "LEI 13869 - ABUSO AUTORIDADE": "Lei de Abuso de Autoridade",
  
  // Estatutos
  "ESTATUTO - OAB": "Estatuto da Ordem dos Advogados do Brasil",
  "ESTATUTO - CIDADE": "Estatuto da Cidade",
  "ESTATUTO - DESARMAMENTO": "Estatuto do Desarmamento",
  "ESTATUTO - ECA": "Estatuto da Criança e do Adolescente",
  "ESTATUTO - IDOSO": "Estatuto do Idoso",
  "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
  "ESTATUTO - ESTRANGEIRO": "Estatuto do Estrangeiro",
  "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
  "ESTATUTO - PESSOA DEFICIENCIA": "Estatuto da Pessoa com Deficiência",
  "ESTATUTO - MILITARES": "Estatuto dos Militares",
  "ESTATUTO - REFUGIADOS": "Estatuto dos Refugiados",
  "ESTATUTO - TERRA": "Estatuto da Terra",
  "ESTATUTO - INDIO": "Estatuto do Índio",
  "ESTATUTO - JUVENTUDE": "Estatuto da Juventude",
  "ESTATUTO - PRIMEIRA INFANCIA": "Estatuto da Primeira Infância",
}

// ============================================
// NORMALIZAÇÃO DE TEXTO PARA TTS
// ============================================

// Mapeamento global de letras para extenso
const letrasParaExtenso: { [key: string]: string } = {
  'a': 'á', 'b': 'bê', 'c': 'cê', 'd': 'dê', 'e': 'é',
  'f': 'éfe', 'g': 'gê', 'h': 'agá', 'i': 'í', 'j': 'jota',
  'k': 'cá', 'l': 'éle', 'm': 'ême', 'n': 'êne', 'o': 'ó',
  'p': 'pê', 'q': 'quê', 'r': 'érre', 's': 'ésse', 't': 'tê',
  'u': 'ú', 'v': 'vê', 'w': 'dáblio', 'x': 'xis', 'y': 'ípsilon', 'z': 'zê'
};

const romanosParaOrdinais: { [key: string]: string } = {
  'I': 'primeiro', 'II': 'segundo', 'III': 'terceiro', 'IV': 'quarto', 'V': 'quinto',
  'VI': 'sexto', 'VII': 'sétimo', 'VIII': 'oitavo', 'IX': 'nono', 'X': 'décimo',
  'XI': 'décimo primeiro', 'XII': 'décimo segundo', 'XIII': 'décimo terceiro',
  'XIV': 'décimo quarto', 'XV': 'décimo quinto', 'XVI': 'décimo sexto',
  'XVII': 'décimo sétimo', 'XVIII': 'décimo oitavo', 'XIX': 'décimo nono',
  'XX': 'vigésimo', 'XXI': 'vigésimo primeiro', 'XXII': 'vigésimo segundo',
  'XXIII': 'vigésimo terceiro', 'XXIV': 'vigésimo quarto', 'XXV': 'vigésimo quinto',
  'XXVI': 'vigésimo sexto', 'XXVII': 'vigésimo sétimo', 'XXVIII': 'vigésimo oitavo',
  'XXIX': 'vigésimo nono', 'XXX': 'trigésimo', 'XXXI': 'trigésimo primeiro',
  'XXXII': 'trigésimo segundo', 'XXXIII': 'trigésimo terceiro', 'XXXIV': 'trigésimo quarto',
  'XXXV': 'trigésimo quinto', 'XXXVI': 'trigésimo sexto', 'XXXVII': 'trigésimo sétimo',
  'XXXVIII': 'trigésimo oitavo', 'XXXIX': 'trigésimo nono', 'XL': 'quadragésimo',
  'XLI': 'quadragésimo primeiro', 'XLII': 'quadragésimo segundo', 'XLIII': 'quadragésimo terceiro',
  'XLIV': 'quadragésimo quarto', 'XLV': 'quadragésimo quinto', 'XLVI': 'quadragésimo sexto',
  'XLVII': 'quadragésimo sétimo', 'XLVIII': 'quadragésimo oitavo', 'XLIX': 'quadragésimo nono',
  'L': 'quinquagésimo',
};

// Números por extenso
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

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto
    // Remove markdown
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*+]\s/g, "")
    .replace(/\d+\.\s/g, "")
    // Remover símbolos problemáticos
    .replace(/[º°]/g, '')
    .replace(/[""'']/g, '')
    // Expande abreviações jurídicas
    .replace(/\bart\.\s?(\d+)/gi, "artigo $1")
    .replace(/\barts\.\s?/gi, "artigos ")
    .replace(/\binc\.\s?/gi, "inciso ")
    .replace(/\bal\.\s?/gi, "alínea ")
    .replace(/\bCF\b/g, "Constituição Federal")
    .replace(/\bCC\b/g, "Código Civil")
    .replace(/\bCP\b/g, "Código Penal")
    .replace(/\bCPC\b/g, "Código de Processo Civil")
    .replace(/\bCPP\b/g, "Código de Processo Penal")
    .replace(/\bCLT\b/g, "Consolidação das Leis do Trabalho")
    .replace(/\bCTN\b/g, "Código Tributário Nacional")
    .replace(/\bCDC\b/g, "Código de Defesa do Consumidor")
    .replace(/\bLINDB\b/g, "Lei de Introdução às Normas do Direito Brasileiro")
    .replace(/\bSTF\b/g, "Supremo Tribunal Federal")
    .replace(/\bSTJ\b/g, "Superior Tribunal de Justiça")
    .replace(/\bTST\b/g, "Tribunal Superior do Trabalho")
    .replace(/\bOAB\b/g, "Ordem dos Advogados do Brasil")
    .replace(/\bPEC\b/g, "Proposta de Emenda Constitucional")
    .replace(/\bDOU\b/g, "Diário Oficial da União")
    // Remove caracteres especiais
    .replace(/[<>{}|\\^~[\]]/g, "")
    .trim();

  // Substituir parágrafos
  resultado = resultado.replace(/§\s*único/gi, 'parágrafo único');
  resultado = resultado.replace(/§§/g, 'parágrafos');
  resultado = resultado.replace(/§\s*(\d+)/g, (_, num) => {
    const n = parseInt(num);
    if (n <= 10) {
      const ords = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono', 'décimo'];
      return `parágrafo ${ords[n]}`;
    }
    return `parágrafo ${num}`;
  });

  // Substituir incisos (números romanos)
  const romanosPorTamanho = Object.keys(romanosParaOrdinais).sort((a, b) => b.length - a.length);
  for (const romano of romanosPorTamanho) {
    const ordinal = romanosParaOrdinais[romano];
    const regex = new RegExp(`(^|\\n|\\s)(${romano})\\s*[-–—]\\s*`, 'g');
    resultado = resultado.replace(regex, `$1inciso ${ordinal}, `);
  }

  // Substituir alíneas
  resultado = resultado.replace(/([a-z])\)/g, (_, letra) => {
    return `alínea ${letrasParaExtenso[letra.toLowerCase()] || letra},`;
  });

  // Limpar hífens e pontuação extra
  resultado = resultado.replace(/\s*[-–—]\s*/g, ', ');
  resultado = resultado.replace(/\s+/g, ' ');
  resultado = resultado.replace(/,\s*,/g, ',');

  return resultado.trim();
}

// ============================================
// GEMINI TTS - GERAÇÃO DE ÁUDIO
// ============================================

// Limite de caracteres para gerar em uma única chamada
const LIMITE_CHARS_POR_CHAMADA = 3500;

// Dividir texto em 2 partes se for muito grande
function dividirTextoEmDuasPartes(texto: string): string[] {
  if (texto.length <= LIMITE_CHARS_POR_CHAMADA) {
    return [texto];
  }

  // Encontrar ponto de divisão próximo do meio
  const meio = Math.floor(texto.length / 2);
  let pontoCorte = meio;

  // Procurar final de frase mais próximo do meio
  const textoAteMetade = texto.substring(0, meio + 500);
  const ultimoPonto = Math.max(
    textoAteMetade.lastIndexOf(". "),
    textoAteMetade.lastIndexOf("! "),
    textoAteMetade.lastIndexOf("? ")
  );

  if (ultimoPonto > meio - 500 && ultimoPonto < meio + 500) {
    pontoCorte = ultimoPonto + 2;
  }

  const parte1 = texto.substring(0, pontoCorte).trim();
  const parte2 = texto.substring(pontoCorte).trim();

  console.log(`[dividirTexto] Texto dividido: Parte 1 (${parte1.length} chars), Parte 2 (${parte2.length} chars)`);

  return [parte1, parte2];
}

// Gerar áudio para um segmento com Gemini TTS (timeout de 3 minutos)
async function gerarAudioSegmento(texto: string, chavesDisponiveis: string[], segmentoIdx: number, totalSegmentos: number): Promise<string> {
  for (let keyIdx = 0; keyIdx < chavesDisponiveis.length; keyIdx++) {
    const apiKey = chavesDisponiveis[keyIdx];
    try {
      console.log(`Segmento ${segmentoIdx}/${totalSegmentos}: Tentando chave ${keyIdx + 1}/${chavesDisponiveis.length} (${texto.length} chars)`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutos timeout
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: texto }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: VOICE_NAME },
                },
              },
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Segmento ${segmentoIdx}: Gemini TTS erro ${response.status}: ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioData) {
        console.log(`Segmento ${segmentoIdx}: ✅ Áudio gerado com sucesso (${audioData.length} chars base64)`);
        return audioData;
      } else {
        console.error(`Segmento ${segmentoIdx}: Resposta sem dados de áudio`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Segmento ${segmentoIdx}: Erro com chave ${keyIdx + 1}: ${errorMsg}`);
      
      if (errorMsg.includes('abort')) {
        console.log(`Segmento ${segmentoIdx}: Timeout, tentando próxima chave...`);
        continue;
      }
    }
  }
  throw new Error(`Todas as ${chavesDisponiveis.length} chaves Gemini TTS falharam para segmento ${segmentoIdx}`);
}

// Gerar áudio completo com Gemini TTS (texto inteiro ou dividido em 2 partes)
async function gerarAudioGeminiTTS(texto: string, chavesDisponiveis: string[]): Promise<Uint8Array[]> {
  const partes = dividirTextoEmDuasPartes(texto);
  console.log(`Texto será processado em ${partes.length} parte(s)`);
  console.log(`Usando ${chavesDisponiveis.length} chaves API disponíveis`);
  
  const audiosBytes: Uint8Array[] = [];
  
  for (let i = 0; i < partes.length; i++) {
    const parteNum = i + 1;
    console.log(`\n🎙️ Processando parte ${parteNum}/${partes.length} (${partes[i].length} chars)`);
    
    try {
      const audioBase64 = await gerarAudioSegmento(partes[i], chavesDisponiveis, parteNum, partes.length);
      
      // Converter base64 para bytes
      const binaryString = atob(audioBase64);
      const pcmBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        pcmBytes[j] = binaryString.charCodeAt(j);
      }
      
      console.log(`Parte ${parteNum}: Convertido para ${pcmBytes.length} bytes PCM`);
      audiosBytes.push(pcmBytes);
      
      // Pausa entre partes
      if (i < partes.length - 1) {
        console.log(`Aguardando 2s antes da próxima parte...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ FALHA CRÍTICA na parte ${parteNum}:`, error);
      throw error;
    }
  }
  
  console.log(`\n✅ Todas as ${partes.length} partes geradas com sucesso!`);
  return audiosBytes;
}

// Concatenar múltiplos áudios PCM
function concatenarPCM(audios: Uint8Array[]): Uint8Array {
  const totalLength = audios.reduce((acc, audio) => acc + audio.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const audio of audios) {
    result.set(audio, offset);
    offset += audio.length;
  }
  
  return result;
}

// Converter PCM L16 24kHz mono para WAV
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const wavSize = 44 + dataSize;

  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);

  return wavBytes;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ============================================
// DIVISÃO DE ARTIGOS GRANDES EM PARTES
// ============================================

interface ParteArtigo {
  texto: string;
  parteAtual: number;
  totalPartes: number;
  prefixo: string;
}

const numerosParaExtensoPartes: { [key: number]: string } = {
  1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
  6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
  11: 'onze', 12: 'doze'
};

function dividirArtigoEmPartes(
  textoCompleto: string, 
  nomeCodigoLegivel: string, 
  numeroExtenso: string,
  titulo: string | null,
  maxChars: number = 4000
): ParteArtigo[] {
  // Se o texto é pequeno, não dividir
  if (textoCompleto.length <= maxChars) {
    return [{
      texto: textoCompleto,
      parteAtual: 1,
      totalPartes: 1,
      prefixo: ''
    }];
  }

  console.log(`[dividirArtigoEmPartes] Artigo grande detectado: ${textoCompleto.length} chars`);

  // Calcular número de partes necessárias
  let numPartesAlvo: number;
  if (textoCompleto.length <= 8000) {
    numPartesAlvo = 2;
  } else if (textoCompleto.length <= 12000) {
    numPartesAlvo = 3;
  } else if (textoCompleto.length <= 18000) {
    numPartesAlvo = 5;
  } else {
    numPartesAlvo = Math.min(12, Math.ceil(textoCompleto.length / 3000));
  }

  // Remover prefixo do artigo para dividir apenas o conteúdo
  const prefixoArtigo = titulo 
    ? `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. `
    : `${nomeCodigoLegivel}, artigo ${numeroExtenso}. `;
  
  const textoSemPrefixo = textoCompleto.startsWith(prefixoArtigo) 
    ? textoCompleto.slice(prefixoArtigo.length) 
    : textoCompleto;

  // Dividir por blocos lógicos
  const blocosLogicos = textoSemPrefixo.split(/(?=(?:^|\n)\s*(?:inciso\s+\w+|parágrafo\s+\w+|alínea\s+\w+))/gi);
  const blocos = blocosLogicos.length > 1 ? blocosLogicos : textoSemPrefixo.split(/(?<=[.;])\s+/);

  console.log(`[dividirArtigoEmPartes] ${blocos.length} blocos encontrados, alvo: ${numPartesAlvo} partes`);

  // Agrupar blocos em partes de tamanho similar
  const tamanhoPorParte = Math.ceil(textoSemPrefixo.length / numPartesAlvo);
  const partes: string[] = [];
  let parteAtual = '';

  for (const bloco of blocos) {
    if (parteAtual.length + bloco.length > tamanhoPorParte && parteAtual.trim()) {
      partes.push(parteAtual.trim());
      parteAtual = bloco;
    } else {
      parteAtual = parteAtual ? parteAtual + ' ' + bloco : bloco;
    }
  }

  if (parteAtual.trim()) {
    partes.push(parteAtual.trim());
  }

  const totalPartes = partes.length;
  console.log(`[dividirArtigoEmPartes] Dividido em ${totalPartes} partes`);

  // Construir resultado com prefixos de identificação
  return partes.map((textoPartePura, index) => {
    const parteNum = index + 1;
    const numExtenso = numerosParaExtensoPartes[parteNum] || parteNum.toString();
    const totalExtenso = numerosParaExtensoPartes[totalPartes] || totalPartes.toString();
    
    let prefixoNarracao: string;
    if (parteNum === 1) {
      if (titulo) {
        prefixoNarracao = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}, parte ${numExtenso} de ${totalExtenso}. `;
      } else {
        prefixoNarracao = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, parte ${numExtenso} de ${totalExtenso}. `;
      }
    } else if (parteNum === totalPartes) {
      prefixoNarracao = `Parte ${numExtenso} de ${totalExtenso}, final. `;
    } else {
      prefixoNarracao = `Parte ${numExtenso} de ${totalExtenso}, continuação. `;
    }

    return {
      texto: prefixoNarracao + textoPartePura,
      parteAtual: parteNum,
      totalPartes,
      prefixo: prefixoNarracao
    };
  });
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
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tableName, numeroArtigo, textoArtigo, articleId } = await req.json()

    if (!tableName || !numeroArtigo || !textoArtigo || !articleId) {
      throw new Error('tableName, numeroArtigo, textoArtigo e articleId são obrigatórios')
    }

    console.log(`[gerar-narracao-vademecum] Gerando para ${tableName} - Art. ${numeroArtigo} com Gemini TTS`)

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }
    
    console.log(`[gerar-narracao-vademecum] ${API_KEYS.length} chaves disponíveis`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obter nome legível do código
    const nomeCodigoLegivel = tableToReadableName[tableName] || tableName
    
    // Converter número do artigo para extenso
    const matchArtigo = numeroArtigo.match(/(\d+)[º°]?[-–]?([A-Za-z])?/);
    const numInt = matchArtigo ? parseInt(matchArtigo[1]) || 0 : 0;
    const letraSufixo = matchArtigo?.[2] 
      ? ` ${letrasParaExtenso[matchArtigo[2].toLowerCase()] || matchArtigo[2].toLowerCase()}` 
      : '';
    const ordinaisUnidadesLocal = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
    const numeroExtenso = (numInt >= 1 && numInt <= 9 ? ordinaisUnidadesLocal[numInt] : numeroParaExtenso(numInt)) + letraSufixo;
    
    // Extrair título do artigo
    let titulo: string | null = null
    const linhas = textoArtigo.split(/\n+/)
    if (linhas.length > 1) {
      const primeiraLinha = linhas[0].trim()
      if (!primeiraLinha.match(/^Art\.?\s*\d+/i) && primeiraLinha.length > 0 && primeiraLinha.length < 100) {
        titulo = primeiraLinha
        console.log(`[gerar-narracao-vademecum] Título encontrado: "${titulo}"`)
      }
    }
    
    // Remover o título e o prefixo "Art. Xº -" do texto
    let textoArtigoLimpo = textoArtigo
    if (titulo) {
      textoArtigoLimpo = linhas.slice(1).join('\n').trim()
    }
    textoArtigoLimpo = textoArtigoLimpo
      .replace(/^Art\.?\s*\d+[º°]?[\-]?[A-Za-z]?\s*[-–.]?\s*/i, '')
      .trim()
    
    // Montar texto com prefixo
    let textoCompleto: string
    if (titulo) {
      textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. ${textoArtigoLimpo}`
    } else {
      textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}. ${textoArtigoLimpo}`
    }
    
    console.log(`[gerar-narracao-vademecum] Texto original: ${textoCompleto.length} chars`)

    // Dividir artigos grandes em partes
    const partesArtigo = dividirArtigoEmPartes(
      textoCompleto, 
      nomeCodigoLegivel, 
      numeroExtenso, 
      titulo,
      4000
    );
    
    console.log(`[gerar-narracao-vademecum] Artigo dividido em ${partesArtigo.length} parte(s)`);

    const audioUrls: string[] = []

    // Processar cada parte do artigo
    for (let parteIdx = 0; parteIdx < partesArtigo.length; parteIdx++) {
      const parteInfo = partesArtigo[parteIdx];
      console.log(`[gerar-narracao-vademecum] Processando parte ${parteInfo.parteAtual}/${parteInfo.totalPartes} (${parteInfo.texto.length} chars)...`);

      // Normalizar texto para TTS
      const textoNormalizado = normalizarTextoParaTTS(parteInfo.texto);
      console.log(`[gerar-narracao-vademecum] Texto normalizado: ${textoNormalizado.length} chars`);

      // Gerar áudio com Gemini TTS (dividido em segmentos de ~1 min)
      console.log(`[gerar-narracao-vademecum] Iniciando geração TTS com Gemini...`);
      const audioSegmentos = await gerarAudioGeminiTTS(textoNormalizado, API_KEYS);
      console.log(`[gerar-narracao-vademecum] TTS gerado com sucesso: ${audioSegmentos.length} segmentos`);

      // Concatenar todos os segmentos PCM
      const pcmBytes = concatenarPCM(audioSegmentos);
      console.log(`[gerar-narracao-vademecum] Total PCM concatenado: ${pcmBytes.length} bytes`);

      // Converter PCM para WAV
      const wavBytes = pcmToWav(pcmBytes);
      console.log(`[gerar-narracao-vademecum] Áudio convertido: ${pcmBytes.length} bytes PCM -> ${wavBytes.length} bytes WAV`);

      // Upload para Supabase Storage com extensão .wav
      const timestamp = Date.now()
      const tableSlug = tableName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)
      const parteLabel = parteInfo.totalPartes > 1 ? `_parte${parteInfo.parteAtual}` : '';
      const path = `vademecum/${tableSlug}/art_${numeroArtigo.replace(/[^a-z0-9]/gi, '_')}${parteLabel}_${timestamp}.wav`
      const url = await uploadParaSupabase(supabase, wavBytes, 'audios', path, 'audio/wav')
      audioUrls.push(url)

      console.log(`[gerar-narracao-vademecum] Parte ${parteInfo.parteAtual}/${parteInfo.totalPartes} OK: ${url}`)
    }

    // Salvar no banco - atualizar a coluna Narração
    if (audioUrls.length > 0) {
      const urlParaSalvar = audioUrls.length > 1 ? JSON.stringify(audioUrls) : audioUrls[0]

      const { error } = await supabase
        .from(tableName)
        .update({ 'Narração': urlParaSalvar })
        .eq('id', articleId)

      if (error) {
        console.error(`[gerar-narracao-vademecum] Erro DB:`, error.message)
        throw new Error(`Erro ao salvar no banco: ${error.message}`)
      } else {
        console.log(`[gerar-narracao-vademecum] ✅ Salvo no banco: ${tableName} id=${articleId}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        audioUrl: audioUrls[0], 
        audioUrls, 
        totalPartes: audioUrls.length,
        numeroArtigo,
        engine: "gemini-2.5-flash-preview-tts",
        voiceName: VOICE_NAME
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-narracao-vademecum] ERRO:', error?.message)
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
