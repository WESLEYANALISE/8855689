import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para upload no Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('[upload] Erro:', uploadError)
    throw new Error(`Erro no upload: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  console.log(`[upload] URL pública: ${publicUrl}`)
  return publicUrl
}

// Mapeamento de números romanos para ordinais em português
const romanosParaOrdinais: Record<string, string> = {
  'I': 'primeiro',
  'II': 'segundo',
  'III': 'terceiro',
  'IV': 'quarto',
  'V': 'quinto',
  'VI': 'sexto',
  'VII': 'sétimo',
  'VIII': 'oitavo',
  'IX': 'nono',
  'X': 'décimo',
  'XI': 'décimo primeiro',
  'XII': 'décimo segundo',
  'XIII': 'décimo terceiro',
  'XIV': 'décimo quarto',
  'XV': 'décimo quinto',
  'XVI': 'décimo sexto',
  'XVII': 'décimo sétimo',
  'XVIII': 'décimo oitavo',
  'XIX': 'décimo nono',
  'XX': 'vigésimo',
  'XXI': 'vigésimo primeiro',
  'XXII': 'vigésimo segundo',
  'XXIII': 'vigésimo terceiro',
  'XXIV': 'vigésimo quarto',
  'XXV': 'vigésimo quinto',
  'XXVI': 'vigésimo sexto',
  'XXVII': 'vigésimo sétimo',
  'XXVIII': 'vigésimo oitavo',
  'XXIX': 'vigésimo nono',
  'XXX': 'trigésimo',
};

// Mapeamento de números arábicos para ordinais
const numerosParaOrdinais: Record<string, string> = {
  '1': 'primeiro',
  '2': 'segundo',
  '3': 'terceiro',
  '4': 'quarto',
  '5': 'quinto',
  '6': 'sexto',
  '7': 'sétimo',
  '8': 'oitavo',
  '9': 'nono',
  '10': 'décimo',
  '11': 'décimo primeiro',
  '12': 'décimo segundo',
  '13': 'décimo terceiro',
  '14': 'décimo quarto',
  '15': 'décimo quinto',
};

// Função para converter incisos com números romanos
function converterIncisosRomanos(texto: string): string {
  // Padrão: "I -", "II -", "III -", etc. no início de linha ou após espaço
  // Também captura "I –", "II –" (com traço longo)
  const padraoInciso = /\b(XXX|XXIX|XXVIII|XXVII|XXVI|XXV|XXIV|XXIII|XXII|XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\s*[-–—]\s*/g;
  
  return texto.replace(padraoInciso, (match, romano) => {
    const ordinal = romanosParaOrdinais[romano];
    if (ordinal) {
      return `inciso ${ordinal}: `;
    }
    return match;
  });
}

// Função para converter parágrafos
function converterParagrafos(texto: string): string {
  // § 1º, § 2º, etc.
  let resultado = texto.replace(/§\s*(\d+)[º°]?/g, (match, numero) => {
    const ordinal = numerosParaOrdinais[numero];
    if (ordinal) {
      return `parágrafo ${ordinal}`;
    }
    return `parágrafo ${numero}`;
  });
  
  // §§ para parágrafos
  resultado = resultado.replace(/§§\s*/g, 'parágrafos ');
  
  // § único
  resultado = resultado.replace(/§\s*único/gi, 'parágrafo único');
  
  return resultado;
}

// Função para converter alíneas
function converterAlineas(texto: string): string {
  // Padrão: "a)", "b)", "c)" ou "a -", "b -" para alíneas
  const alineas: Record<string, string> = {
    'a': 'a',
    'b': 'b',
    'c': 'c',
    'd': 'd',
    'e': 'e',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'i': 'i',
    'j': 'j',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'o': 'o',
    'p': 'p',
    'q': 'q',
    'r': 'r',
    's': 's',
    't': 't',
  };
  
  // Padrão: "a)" ou "a -" no contexto de alíneas
  return texto.replace(/\b([a-t])\s*\)\s*/g, (match, letra) => {
    return `alínea ${alineas[letra]}: `;
  });
}

// Função para normalizar texto para TTS - expande abreviações jurídicas
function normalizarTextoParaTTS(texto: string): string {
  let textoNormalizado = texto;
  
  // Remover conteúdo entre parênteses
  textoNormalizado = textoNormalizado.replace(/\s*\([^)]*\)/g, '');
  
  // Primeiro converter estruturas jurídicas específicas
  textoNormalizado = converterIncisosRomanos(textoNormalizado);
  textoNormalizado = converterParagrafos(textoNormalizado);
  textoNormalizado = converterAlineas(textoNormalizado);
  
  // Expandir abreviações jurídicas comuns
  const abreviacoes: [RegExp, string][] = [
    [/\bArt\.\s*/gi, 'Artigo '],
    [/\bart\.\s*/g, 'artigo '],
    [/\barts\.\s*/gi, 'artigos '],
    [/\bInc\.\s*/gi, 'Inciso '],
    [/\binc\.\s*/g, 'inciso '],
    [/\bincs\.\s*/gi, 'incisos '],
    [/\bAl\.\s*/gi, 'Alínea '],
    [/\bal\.\s*/g, 'alínea '],
    [/\bNº\s*/gi, 'número '],
    [/\bn[º°]\s*/gi, 'número '],
    [/\bNr\.\s*/gi, 'número '],
    [/\bCF\/88\b/gi, 'Constituição Federal de 1988'],
    [/\bCF\b/g, 'Constituição Federal'],
    [/\bCC\/2002\b/gi, 'Código Civil de 2002'],
    [/\bCC\b/g, 'Código Civil'],
    [/\bCP\b/g, 'Código Penal'],
    [/\bCPC\b/g, 'Código de Processo Civil'],
    [/\bCPP\b/g, 'Código de Processo Penal'],
    [/\bCLT\b/g, 'Consolidação das Leis do Trabalho'],
    [/\bCTN\b/g, 'Código Tributário Nacional'],
    [/\bCDC\b/g, 'Código de Defesa do Consumidor'],
    [/\bCTB\b/g, 'Código de Trânsito Brasileiro'],
    [/\bECA\b/g, 'Estatuto da Criança e do Adolescente'],
    [/\bSTF\b/g, 'Supremo Tribunal Federal'],
    [/\bSTJ\b/g, 'Superior Tribunal de Justiça'],
    [/\bTST\b/g, 'Tribunal Superior do Trabalho'],
    [/\bTSE\b/g, 'Tribunal Superior Eleitoral'],
    [/\bTJ\b/g, 'Tribunal de Justiça'],
    [/\bTRF\b/g, 'Tribunal Regional Federal'],
    [/\bTRT\b/g, 'Tribunal Regional do Trabalho'],
    [/\bTRE\b/g, 'Tribunal Regional Eleitoral'],
    [/\bMP\b/g, 'Ministério Público'],
    [/\bOAB\b/g, 'Ordem dos Advogados do Brasil'],
    [/\bDOU\b/g, 'Diário Oficial da União'],
    [/\bLC\b/g, 'Lei Complementar'],
    [/\bEC\b/g, 'Emenda Constitucional'],
    [/\bADI\b/g, 'Ação Direta de Inconstitucionalidade'],
    [/\bADC\b/g, 'Ação Declaratória de Constitucionalidade'],
    [/\bADPF\b/g, 'Arguição de Descumprimento de Preceito Fundamental'],
    [/\bRE\b/g, 'Recurso Extraordinário'],
    [/\bREsp\b/gi, 'Recurso Especial'],
    [/\bHC\b/g, 'Habeas Corpus'],
    [/\bMS\b/g, 'Mandado de Segurança'],
    [/\bin fine\b/gi, 'in fine'],
    [/\bcaput\b/gi, 'caput'],
    [/\bDr\.\s*/g, 'Doutor '],
    [/\bDra\.\s*/g, 'Doutora '],
    [/\bProf\.\s*/g, 'Professor '],
    [/\bProfa\.\s*/g, 'Professora '],
    [/\betc\.\s*/g, 'etcétera '],
    [/\bp\.\s*ex\.\s*/gi, 'por exemplo '],
    [/\bi\.e\.\s*/gi, 'isto é '],
  ];
  
  for (const [regex, substituicao] of abreviacoes) {
    textoNormalizado = textoNormalizado.replace(regex, substituicao);
  }
  
  return textoNormalizado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId, texto, tipo, tabela } = await req.json();
    
    if (!resumoId || !texto || !tipo) {
      throw new Error('resumoId, texto e tipo são obrigatórios');
    }

    // Definir tabela destino (padrão: RESUMO para compatibilidade)
    const tabelaDestino = tabela || 'RESUMO';
    console.log(`Tabela destino: ${tabelaDestino}`);

    const tiposValidos = ['resumo', 'exemplos', 'termos'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('tipo deve ser: resumo, exemplos ou termos');
    }

    console.log(`Gerando áudio ${tipo} para resumo ${resumoId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe áudio no cache
    const coluna = `url_audio_${tipo}` as 'url_audio_resumo' | 'url_audio_exemplos' | 'url_audio_termos';
    
    const { data: resumo, error: fetchError } = await supabase
      .from(tabelaDestino)
      .select('url_audio_resumo, url_audio_exemplos, url_audio_termos')
      .eq('id', resumoId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar resumo:', fetchError);
    }

    // Se já tem áudio, retornar do cache
    const existingUrl = resumo?.[coluna];
    if (existingUrl) {
      console.log(`Áudio ${tipo} encontrado no cache`);
      return new Response(
        JSON.stringify({ 
          url_audio: existingUrl, 
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar texto para narração (remover markdown)
    const textoLimpo = texto
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/>\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s/g, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 4000);

    if (!textoLimpo) {
      throw new Error('Texto vazio após limpeza');
    }

    // Normalizar texto para TTS
    const textoNormalizado = normalizarTextoParaTTS(textoLimpo);
    console.log(`Texto normalizado: ${textoNormalizado.length} caracteres`);

    // Chaves de API disponíveis para fallback (3 chaves Gemini)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada');
    }

    console.log(`Gerando áudio com Google Cloud TTS (${chavesDisponiveis.length} chaves GEMINI disponíveis)...`);

    const requestBody = {
      input: { text: textoNormalizado },
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
        console.log(`Tentando GEMINI_KEY_${i + 1}...`);
        
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
          console.error(`Erro TTS com GEMINI_KEY_${i + 1}: ${ttsResponse.status}`);
          
          // Se for rate limit ou quota, tentar próxima chave
          if ((ttsResponse.status === 429 || errorText.includes('quota')) && i < chavesDisponiveis.length - 1) {
            console.log(`Rate limit na GEMINI_KEY_${i + 1}, tentando próxima...`);
            continue;
          }
          
          if (i === chavesDisponiveis.length - 1) {
            throw new Error(`Todas as ${chavesDisponiveis.length} chaves falharam: ${ttsResponse.status}`);
          }
          continue;
        }

        ttsData = await ttsResponse.json();
        console.log(`✅ Sucesso com GEMINI_KEY_${i + 1}`);
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
    const audioContent = ttsData.audioContent;

    if (!audioContent) {
      throw new Error('Google TTS não retornou conteúdo de áudio');
    }

    // Converter base64 para blob
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Áudio gerado, tamanho:', bytes.length);

    // Upload para Supabase Storage
    const filePath = `resumos/${resumoId}_${tipo}_${Date.now()}.mp3`
    const audioUrl = await uploadParaSupabase(supabase, bytes, 'audios', filePath, 'audio/mpeg')

    console.log('Upload concluído:', audioUrl);

    // Salvar URL no banco
    const updateData: Record<string, any> = {};
    updateData[coluna] = audioUrl;

    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update(updateData)
      .eq('id', resumoId);

    if (updateError) {
      console.error('Erro ao salvar no banco:', updateError);
    } else {
      console.log('URL salva no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        url_audio: audioUrl, 
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
