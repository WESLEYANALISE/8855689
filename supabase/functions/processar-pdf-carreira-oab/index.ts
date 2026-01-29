import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Converter URL do Google Drive para download direto
function converterUrlDrive(url: string): string {
  // Se for URL de pasta, não funciona
  if (url.includes('/folders/')) {
    throw new Error('URL de pasta não suportada. Use URL direta do arquivo.');
  }
  
  // Extrair ID do arquivo de vários formatos de URL
  let fileId: string | null = null;
  
  // Formato: /d/FILE_ID/
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) {
    fileId = matchD[1];
  }
  
  // Formato: id=FILE_ID
  if (!fileId) {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) {
      fileId = matchId[1];
    }
  }
  
  if (fileId) {
    // Usar formato que bypassa confirmação de download
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  
  return url;
}

// Baixar PDF com retry e seguir redirects
async function baixarPdfDrive(url: string): Promise<ArrayBuffer> {
  const downloadUrl = converterUrlDrive(url);
  console.log(`Tentando baixar de: ${downloadUrl}`);
  
  // Primeira tentativa
  let response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/pdf,*/*',
    },
    redirect: 'follow',
  });

  // Verificar se é HTML (página de confirmação do Drive)
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    // Tentar extrair link de confirmação da página HTML
    const html = await response.text();
    console.log('Recebeu HTML, tentando extrair link de confirmação...');
    
    // Procurar por link de download com confirmação
    const confirmMatch = html.match(/href="([^"]*confirm=t[^"]*)"/);
    if (confirmMatch) {
      let confirmUrl = confirmMatch[1].replace(/&amp;/g, '&');
      if (!confirmUrl.startsWith('http')) {
        confirmUrl = 'https://drive.google.com' + confirmUrl;
      }
      console.log(`Seguindo link de confirmação: ${confirmUrl}`);
      
      response = await fetch(confirmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });
    } else {
      // Tentar método alternativo com export=download
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
        const altUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GEMINI_KEYS[0]?.split(':')[0] || ''}`;
        console.log('Tentando método alternativo de download...');
        
        // Tentar com URL sem autenticação
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=yes`;
        response = await fetch(directUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': 'download_warning_token=true',
          },
          redirect: 'follow',
        });
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Erro ao baixar PDF: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  
  // Verificar se realmente é um PDF (começa com %PDF)
  const firstBytes = new Uint8Array(buffer.slice(0, 5));
  const header = new TextDecoder().decode(firstBytes);
  
  if (!header.startsWith('%PDF')) {
    console.error('Arquivo baixado não é um PDF válido. Primeiros bytes:', header);
    throw new Error('O arquivo baixado não é um PDF válido. Verifique se o link está público.');
  }
  
  return buffer;
}

// OCR com Gemini Vision - extrai texto de PDF inteiro
async function extrairTextoOCR(base64Pdf: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada (GEMINI_KEY_1, 2, 3)');
  }

  const prompt = `Você é um sistema de OCR preciso. Extraia TODO o texto deste PDF educacional.

INSTRUÇÕES:
1. Extraia o texto de TODAS as páginas
2. Mantenha a estrutura original (títulos, parágrafos, listas)
3. Preserve formatação como negrito e itálico quando identificável
4. Se houver tabelas, formate como texto organizado
5. Ignore cabeçalhos/rodapés repetitivos
6. NÃO resuma ou interprete - apenas transcreva fielmente

Inicie a transcrição:`;

  const errors: string[] = [];

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      console.log(`Tentando OCR com GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'application/pdf', data: base64Pdf } }
              ] 
            }],
            generationConfig: { 
              temperature: 0.1, 
              maxOutputTokens: 65000 
            }
          })
        }
      );

      if (response.status === 429) {
        console.log(`Key ${i + 1} rate limited, tentando próxima...`);
        errors.push(`Key ${i + 1}: rate limited`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro Gemini key ${i + 1}:`, response.status, errorText);
        errors.push(`Key ${i + 1}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      if (texto.length > 100) {
        console.log(`OCR extraiu ${texto.length} caracteres com key ${i + 1}`);
        return texto;
      }
      
      console.log(`Key ${i + 1} retornou texto muito curto (${texto.length} chars)`);
      errors.push(`Key ${i + 1}: texto curto (${texto.length} chars)`);
    } catch (error) {
      console.error(`Erro na key ${i + 1}:`, error);
      errors.push(`Key ${i + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }

  throw new Error(`Falha ao extrair texto do PDF. Erros: ${errors.join('; ')}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem, pdfUrl } = await req.json();

    if (!ordem) {
      return new Response(
        JSON.stringify({ error: 'Ordem do artigo é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar artigo
    const { data: artigo, error: fetchError } = await supabase
      .from('oab_carreira_blog')
      .select('*')
      .eq('ordem', ordem)
      .single();

    if (fetchError || !artigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar URL do parâmetro ou do banco
    const urlPdf = pdfUrl || artigo.pdf_url;
    
    if (!urlPdf) {
      return new Response(
        JSON.stringify({ error: 'URL do PDF não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando PDF: ${artigo.titulo}`);
    console.log(`URL original: ${urlPdf}`);

    // Baixar PDF com tratamento robusto
    const pdfBuffer = await baixarPdfDrive(urlPdf);
    const base64Pdf = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log(`PDF baixado: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);

    // Extrair texto via OCR
    const textoOcr = await extrairTextoOCR(base64Pdf);

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('oab_carreira_blog')
      .update({
        texto_ocr: textoOcr,
        updated_at: new Date().toISOString(),
      })
      .eq('ordem', ordem);

    if (updateError) {
      console.error('Erro ao salvar OCR:', updateError);
      throw updateError;
    }

    console.log(`OCR salvo com sucesso: ${textoOcr.length} caracteres`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        caracteres: textoOcr.length,
        preview: textoOcr.substring(0, 500) + '...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro processar-pdf-carreira-oab:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
