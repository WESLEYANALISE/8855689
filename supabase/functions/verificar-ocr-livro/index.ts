import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Extrair ID do arquivo do Google Drive
function extractDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Chamar Gemini Vision API para extrair texto de imagem/PDF
async function callGeminiVision(base64Data: string, mimeType: string, pageNum: number, keyIndex = 0): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam');
  }

  const apiKey = GEMINI_KEYS[keyIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Você é um especialista em OCR. Extraia TODO o texto deste documento PDF.
  
REGRAS IMPORTANTES:
1. Extraia o texto EXATAMENTE como aparece, preservando parágrafos
2. NÃO adicione formatação extra ou comentários
3. Se houver números de página, cabeçalhos ou rodapés repetitivos, IGNORE-OS
4. Preserve quebras de parágrafo naturais
5. Se a página estiver em branco ou ilegível, retorne "[PAGINA_VAZIA]"
6. Retorne APENAS o texto extraído, sem explicações

Texto extraído:`;

  try {
    console.log(`[Gemini] Tentando key ${keyIndex}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      })
    });

    if (response.status === 429 || response.status === 503) {
      console.log(`[Gemini] Key ${keyIndex} rate limited, trying next...`);
      await new Promise(r => setTimeout(r, 1000));
      return callGeminiVision(base64Data, mimeType, pageNum, keyIndex + 1);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`[Gemini] Error:`, data.error);
      if (keyIndex < GEMINI_KEYS.length - 1) {
        return callGeminiVision(base64Data, mimeType, pageNum, keyIndex + 1);
      }
      throw new Error(data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[ERRO_EXTRACAO]';
    console.log(`[Gemini] Sucesso! Extraiu ${text.length} caracteres`);
    return text;
  } catch (error) {
    console.error(`[Gemini] Error calling:`, error);
    if (keyIndex < GEMINI_KEYS.length - 1) {
      return callGeminiVision(base64Data, mimeType, pageNum, keyIndex + 1);
    }
    throw error;
  }
}

// Baixar PDF do Google Drive
async function downloadPdfFromDrive(fileId: string): Promise<ArrayBuffer | null> {
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    console.log(`[Download] Tentando: ${directUrl}`);
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`[Download] Content-Type: ${contentType}`);
      
      if (contentType?.includes('text/html')) {
        const html = await response.text();
        const confirmMatch = html.match(/confirm=([^&"]+)/);
        if (confirmMatch) {
          const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`;
          console.log(`[Download] Tentando URL com confirmação...`);
          
          const confirmResponse = await fetch(confirmUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (confirmResponse.ok) {
            return await confirmResponse.arrayBuffer();
          }
        }
        
        console.log('[Download] Resposta HTML sem link de confirmação');
        return null;
      }
      
      return await response.arrayBuffer();
    }
    
    console.log(`[Download] Falhou com status: ${response.status}`);
    return null;
  } catch (error) {
    console.error('[Download] Erro:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('[OCR] Requisição recebida');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroId } = await req.json();
    console.log(`[OCR] Livro ID: ${livroId}`);
    
    if (!livroId) {
      return new Response(
        JSON.stringify({ error: 'livroId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: livro, error: livroError } = await supabase
      .from('BIBLIOTECA-CLASSICOS')
      .select('id, livro, download')
      .eq('id', livroId)
      .single();

    if (livroError || !livro) {
      console.error('[OCR] Livro não encontrado:', livroError);
      return new Response(
        JSON.stringify({ error: 'Livro não encontrado', details: livroError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!livro.download) {
      return new Response(
        JSON.stringify({ error: 'Livro não possui link de download' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[OCR] Processando: ${livro.livro}`);
    console.log(`[OCR] Link: ${livro.download}`);

    const fileId = extractDriveFileId(livro.download);
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair ID do Google Drive', url: livro.download }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[OCR] File ID: ${fileId}`);

    const pdfBuffer = await downloadPdfFromDrive(fileId);
    if (!pdfBuffer) {
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível baixar o PDF. O arquivo pode ser muito grande ou requerer autenticação.',
          fileId,
          suggestion: 'Verifique se o arquivo está compartilhado publicamente no Google Drive'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[OCR] PDF baixado: ${pdfBuffer.byteLength} bytes`);

    // Converter ArrayBuffer para base64
    const base64Pdf = encode(pdfBuffer);
    console.log(`[OCR] PDF convertido para base64: ${base64Pdf.length} chars`);
    
    const resultados: Array<{pagina: number, texto: string, status: string}> = [];
    
    try {
      console.log(`[OCR] Enviando para Gemini Vision...`);
      const textoExtraido = await callGeminiVision(base64Pdf, 'application/pdf', 1);
      
      // Salvar resultado
      const { error: insertError } = await supabase
        .from('ocr_verificacao')
        .upsert({
          livro_id: livroId,
          livro_titulo: livro.livro,
          pagina: 1,
          texto_novo_ocr: textoExtraido,
          status: 'verificado'
        }, {
          onConflict: 'livro_id,pagina'
        });

      if (insertError) {
        console.error('[OCR] Erro ao salvar:', insertError);
      }

      resultados.push({
        pagina: 1,
        texto: textoExtraido.substring(0, 500) + '...',
        status: 'sucesso'
      });
      
      console.log('[OCR] Processamento concluído com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[OCR] Erro ao processar:`, err);
      resultados.push({
        pagina: 1,
        texto: '',
        status: `erro: ${errorMessage}`
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        livro: livro.livro,
        fileId,
        tamanhoBytes: pdfBuffer.byteLength,
        paginasProcessadas: resultados.length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[OCR] Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
