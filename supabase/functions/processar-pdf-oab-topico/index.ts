import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicoId, pdfUrl } = await req.json();

    if (!topicoId || !pdfUrl) {
      throw new Error("topicoId e pdfUrl são obrigatórios");
    }

    console.log(`[OAB Tópico] Processando PDF para tópico ${topicoId}: ${pdfUrl}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para 'extraindo'
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'extraindo',
        pdf_url: pdfUrl 
      })
      .eq('id', topicoId);

    // Validar que é uma URL de arquivo, não de pasta
    if (pdfUrl.includes('/folders/') || pdfUrl.includes('/drive/folders')) {
      throw new Error("A URL fornecida é de uma pasta do Google Drive. Por favor, forneça a URL direta do arquivo PDF.");
    }

    // Extrair ID do arquivo do Google Drive
    let fileId: string | null = null;
    let downloadUrl = pdfUrl;
    
    if (pdfUrl.includes('drive.google.com')) {
      const filePattern = pdfUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (filePattern) {
        fileId = filePattern[1];
      }
      
      if (!fileId) {
        const dPattern = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (dPattern) {
          fileId = dPattern[1];
        }
      }
      
      if (!fileId) {
        const queryPattern = pdfUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (queryPattern) {
          fileId = queryPattern[1];
        }
      }
      
      if (!fileId) {
        throw new Error("Não foi possível extrair o ID do arquivo da URL do Google Drive.");
      }
      console.log(`ID do arquivo extraído: ${fileId}`);
    }

    // Tentar múltiplas estratégias de download do Google Drive
    const downloadStrategies = fileId ? [
      `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
      `https://drive.google.com/uc?export=download&id=${fileId}&confirm=1`,
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    ] : [downloadUrl];

    let pdfBuffer: ArrayBuffer | null = null;
    let lastError = '';

    for (const url of downloadStrategies) {
      console.log("Tentando URL:", url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/pdf,*/*'
          },
          redirect: 'follow'
        });
        
        if (!response.ok) {
          lastError = `Status ${response.status}`;
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        console.log("Content-Type recebido:", contentType);
        
        // Se for HTML, pode ser página de confirmação - tentar extrair link de confirmação
        if (contentType.includes('text/html')) {
          const html = await response.text();
          
          // Procurar link de confirmação na página HTML
          const confirmMatch = html.match(/href="([^"]*confirm=t[^"]*)"/);
          if (confirmMatch && fileId) {
            let confirmUrl = confirmMatch[1].replace(/&amp;/g, '&');
            if (!confirmUrl.startsWith('http')) {
              confirmUrl = `https://drive.google.com${confirmUrl}`;
            }
            console.log("Encontrado link de confirmação, tentando...");
            
            const confirmResponse = await fetch(confirmUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (confirmResponse.ok) {
              const confirmContentType = confirmResponse.headers.get('content-type') || '';
              if (!confirmContentType.includes('text/html')) {
                pdfBuffer = await confirmResponse.arrayBuffer();
                console.log("PDF baixado via link de confirmação");
                break;
              }
            }
          }
          
          // Tentar encontrar UUID token para arquivos grandes
          const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);
          if (uuidMatch && fileId) {
            const uuid = uuidMatch[1];
            const largeFileUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuid}`;
            console.log("Tentando download de arquivo grande com UUID...");
            
            const largeResponse = await fetch(largeFileUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (largeResponse.ok) {
              const largeContentType = largeResponse.headers.get('content-type') || '';
              if (!largeContentType.includes('text/html')) {
                pdfBuffer = await largeResponse.arrayBuffer();
                console.log("PDF baixado via UUID de arquivo grande");
                break;
              }
            }
          }
          
          lastError = 'Retornou HTML';
          continue;
        }

        // PDF encontrado!
        pdfBuffer = await response.arrayBuffer();
        console.log("PDF baixado com sucesso");
        break;
        
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Erro desconhecido';
        console.log("Falha nesta estratégia:", lastError);
      }
    }

    if (!pdfBuffer) {
      throw new Error(`Não foi possível baixar o PDF do Google Drive. Verifique se o arquivo está compartilhado como "Qualquer pessoa com o link". Último erro: ${lastError}`);
    }
    
    // Convert to base64 in chunks
    const uint8Array = new Uint8Array(pdfBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Pdf = btoa(binary);

    console.log(`PDF baixado: ${Math.round(pdfBuffer.byteLength / 1024)} KB`);

    // Obter chave Mistral
    const mistralKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralKey) {
      throw new Error("MISTRAL_API_KEY não configurada");
    }

    // Usar Mistral OCR para extrair texto
    console.log("Iniciando extração com Mistral OCR...");

    const mistralResponse = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: `data:application/pdf;base64,${base64Pdf}`
        }
      })
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Erro Mistral:", errorText);
      throw new Error(`Erro no Mistral OCR: ${mistralResponse.status}`);
    }

    const mistralData = await mistralResponse.json();
    console.log("Resposta Mistral recebida");

    const pages = mistralData.pages || [];
    console.log(`Total de páginas extraídas: ${pages.length}`);

    if (pages.length === 0) {
      throw new Error("Nenhuma página foi extraída do PDF");
    }

    // Deletar páginas antigas (se existir tabela)
    await supabase
      .from('oab_trilhas_topico_paginas')
      .delete()
      .eq('topico_id', topicoId);

    // Inserir novas páginas em lotes
    const batchSize = 50;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize).map((page: any, idx: number) => ({
        topico_id: topicoId,
        pagina: i + idx + 1,
        conteudo: page.markdown || page.text || ''
      }));

      const { error: insertError } = await supabase
        .from('oab_trilhas_topico_paginas')
        .upsert(batch, { onConflict: 'topico_id,pagina' });

      if (insertError) {
        console.error("Erro ao inserir páginas:", insertError);
        throw insertError;
      }

      console.log(`Inseridas páginas ${i + 1} a ${Math.min(i + batchSize, pages.length)}`);
    }

    // Atualizar tópico com total de páginas e status
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'identificando',
        total_paginas: pages.length
      })
      .eq('id', topicoId);

    console.log(`✅ Extração concluída: ${pages.length} páginas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPaginas: pages.length,
        message: `${pages.length} páginas extraídas com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro no processamento:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
