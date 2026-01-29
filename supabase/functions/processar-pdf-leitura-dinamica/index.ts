import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converter URL do Google Drive para download direto
function converterUrlDrive(url: string): string {
  if (url.includes('/folders/')) {
    throw new Error('URL de pasta não suportada. Use URL direta do arquivo.');
  }
  
  let fileId: string | null = null;
  
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) {
    fileId = matchD[1];
  }
  
  if (!fileId) {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) {
      fileId = matchId[1];
    }
  }
  
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  
  return url;
}

// Baixar PDF com retry e seguir redirects
async function baixarPdfDrive(url: string): Promise<ArrayBuffer> {
  const downloadUrl = converterUrlDrive(url);
  console.log(`Tentando baixar de: ${downloadUrl}`);
  
  let response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/pdf,*/*',
    },
    redirect: 'follow',
  });

  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    const html = await response.text();
    console.log('Recebeu HTML, tentando extrair link de confirmação...');
    
    const confirmMatch = html.match(/href="([^"]*confirm=t[^"]*)"/);
    if (confirmMatch) {
      let confirmUrl = confirmMatch[1].replace(/&amp;/g, '&');
      if (!confirmUrl.startsWith('http')) {
        confirmUrl = 'https://drive.google.com' + confirmUrl;
      }
      
      response = await fetch(confirmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });
    } else {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
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
  
  const firstBytes = new Uint8Array(buffer.slice(0, 5));
  const header = new TextDecoder().decode(firstBytes);
  
  if (!header.startsWith('%PDF')) {
    console.error('Arquivo baixado não é um PDF válido. Primeiros bytes:', header);
    throw new Error('O arquivo baixado não é um PDF válido. Verifique se o link está público.');
  }
  
  return buffer;
}

// Converter ArrayBuffer para Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Interface para imagem extraída pelo Mistral
interface ImagemExtraida {
  id: string;
  image_base64?: string;
}

// Interface para página do Mistral
interface PaginaMistral {
  index: number;
  markdown: string;
  images?: ImagemExtraida[];
}

// Upload de imagem para Supabase Storage
async function uploadImagemParaStorage(
  supabase: any,
  imageBase64: string,
  imageId: string,
  tituloLivro: string,
  paginaIndex: number
): Promise<string | null> {
  try {
    // Determinar tipo MIME
    const mimeType = imageId.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    // Converter Base64 para Uint8Array
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Gerar nome único
    const slugLivro = tituloLivro.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const fileName = `${slugLivro}/pagina-${paginaIndex}/${imageId}`;
    
    console.log(`[Upload] Enviando imagem: ${fileName} (${Math.round(bytes.length / 1024)}KB)`);
    
    // Upload para bucket leitura-imagens
    const { data, error } = await supabase.storage
      .from('leitura-imagens')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true
      });
    
    if (error) {
      console.error(`[Upload] Erro ao fazer upload: ${error.message}`);
      return null;
    }
    
    // Retornar URL pública
    const { data: urlData } = supabase.storage
      .from('leitura-imagens')
      .getPublicUrl(fileName);
    
    console.log(`[Upload] Sucesso: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`[Upload] Erro ao fazer upload da imagem ${imageId}:`, error);
    return null;
  }
}

// Extrair texto usando Mistral OCR COM IMAGENS
async function extrairTextoComMistral(
  pdfBase64: string, 
  supabase: any, 
  tituloLivro: string
): Promise<Array<{ index: number; markdown: string }>> {
  const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
  
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY não configurada');
  }

  console.log('[Mistral OCR] Iniciando extração do PDF COM IMAGENS...');
  
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${pdfBase64}`
      },
      include_image_base64: true  // NOVO: Solicitar imagens em Base64
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Mistral OCR] Erro:', response.status, errorText);
    throw new Error(`Mistral OCR falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[Mistral OCR] Resposta recebida:', JSON.stringify(data).substring(0, 500));
  
  // Mistral retorna { pages: [{ index, markdown, images: [{id, image_base64}] }, ...] }
  if (data.pages && Array.isArray(data.pages)) {
    console.log(`[Mistral OCR] ${data.pages.length} páginas extraídas com sucesso`);
    
    // Processar cada página e fazer upload das imagens
    const paginasProcessadas: Array<{ index: number; markdown: string }> = [];
    
    for (const pagina of data.pages as PaginaMistral[]) {
      let textoMarkdown = pagina.markdown || '';
      
      // Processar imagens desta página
      if (pagina.images && pagina.images.length > 0) {
        console.log(`[Mistral OCR] Página ${pagina.index}: ${pagina.images.length} imagens encontradas`);
        
        for (const img of pagina.images) {
          if (img.image_base64 && img.id) {
            // Upload para Storage
            const urlPublica = await uploadImagemParaStorage(
              supabase,
              img.image_base64,
              img.id,
              tituloLivro,
              pagina.index
            );
            
            if (urlPublica) {
              // Substituir placeholder por URL real
              // Mistral usa formato: ![img-0.jpeg](img-0.jpeg)
              textoMarkdown = textoMarkdown.replace(
                new RegExp(`!\\[${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
                `![${img.id}](${urlPublica})`
              );
              // Também tentar formato alternativo
              textoMarkdown = textoMarkdown.replace(
                new RegExp(`!\\[[^\\]]*\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
                `![${img.id}](${urlPublica})`
              );
            }
          }
        }
      }
      
      paginasProcessadas.push({
        index: pagina.index,
        markdown: textoMarkdown
      });
    }
    
    return paginasProcessadas;
  }
  
  // Fallback se a estrutura for diferente
  if (data.text) {
    return [{ index: 0, markdown: data.text }];
  }
  
  throw new Error('Formato de resposta do Mistral OCR não reconhecido');
}

// Limpar texto de lixo editorial AGRESSIVAMENTE
function limparTextoLixo(texto: string): string {
  let limpo = texto
    // === REMOÇÃO DE METADADOS EDITORIAIS ===
    // ISBN
    .replace(/ISBN[:\s]*[\d\-X]+/gi, '')
    // Copyright e direitos
    .replace(/©.*?(?:\n|$)/gi, '')
    .replace(/Copyright.*?(?:\n|$)/gi, '')
    .replace(/Todos os direitos reservados.*?(?:\n|$)/gi, '')
    .replace(/All rights reserved.*?(?:\n|$)/gi, '')
    // Ficha catalográfica
    .replace(/CIP-Brasil.*?(?:\n|$)/gi, '')
    .replace(/Dados Internacionais de Catalogação.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/Ficha catalográfica.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/Catalogação na Publicação.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/CDU[\s:]*[\d\.]+/gi, '')
    .replace(/CDD[\s:]*[\d\.]+/gi, '')
    // Impressão e editora
    .replace(/Impresso no Brasil.*?(?:\n|$)/gi, '')
    .replace(/Printed in Brazil.*?(?:\n|$)/gi, '')
    .replace(/Impresso em.*?(?:\n|$)/gi, '')
    .replace(/Gráfica.*?(?:\n|$)/gi, '')
    // URLs e contatos
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '')
    
    // === REMOÇÃO DE CRÉDITOS EDITORIAIS ===
    // Tradução, revisão, capa, projeto gráfico
    .replace(/Tradução[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Traduzido por[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Revisão[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Preparação[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Capa[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Projeto gráfico[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Diagramação[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Editoração[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Produção editorial[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Produção digital[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Coordenação editorial[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Editora[:\s]*[^\n]{0,50}(?:\n|$)/gi, '')
    .replace(/Editor[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Edição[:\s]*\d+.*?(?:\n|$)/gi, '')
    .replace(/\d+[ªº]?\s*edição.*?(?:\n|$)/gi, '')
    .replace(/Ilustrações?[:\s]*[^\n]+(?:\n|$)/gi, '')
    .replace(/Foto(?:grafia)?s?[:\s]*[^\n]+(?:\n|$)/gi, '')
    
    // === REMOÇÃO DE PADRÕES ESPECÍFICOS DO LIVRO "EXPLORADORES DE CAVERNAS" ===
    .replace(/Republished with permission.*?(?:\n|$)/gi, '')
    .replace(/permission conveyed.*?(?:\n|$)/gi, '')
    .replace(/Grafia atualizada.*?(?:\n|$)/gi, '')
    .replace(/Acordo Ortográfico.*?(?:\n|$)/gi, '')
    .replace(/Title original:.*?(?:\n|$)/gi, '')
    .replace(/Título original:.*?(?:\n|$)/gi, '')
    .replace(/Original Title:.*?(?:\n|$)/gi, '')
    .replace(/Originally published.*?(?:\n|$)/gi, '')
    .replace(/^Loope.*?(?:\n|$)/gim, '')
    .replace(/^Geração Editorial.*?(?:\n|$)/gim, '')
    .replace(/^Editora Geração.*?(?:\n|$)/gim, '')
    // Nomes de equipe editorial isolados em linhas (padrão: Nome Sobrenome ou Nome Inicial. Sobrenome)
    .replace(/^(?:Luiz Fernando|Fernanda|Maria (?:[A-Z]\.?\s*)?|José (?:[A-Z]\.?\s*)?|Ana (?:[A-Z]\.?\s*)?)\s+[A-Z][a-záéíóú]+\s*$/gim, '')
    .replace(/^(?:Diretora?|Assistente|Gerente|Coordenad[oa])\s+\w+.*?(?:\n|$)/gim, '')
    // Fuller, Lon L. (referência de ficha catalográfica)
    .replace(/Fuller,\s*Lon\s*L\..*?(?:\n|$)/gi, '')
    .replace(/^\d{4}-\d{4}\s*$/gm, '') // Anos de edição
    
    // === MANTER IMAGENS COM URL COMPLETA, REMOVER REFERÊNCIAS LOCAIS ===
    // Manter imagens com URLs completas (http/https)
    // Remover apenas referências locais órfãs (sem URL)
    .replace(/!\[[^\]]*\]\((?!https?:\/\/)[^)]+\)/g, '') // Remove imagens sem URL completa
    .replace(/\[IMAGEM[^\]]*\]/gi, '')
    .replace(/\[IMG[^\]]*\]/gi, '')
    .replace(/\[FIGURA[^\]]*\]/gi, '')
    .replace(/\[IMAGE[^\]]*\]/gi, '')
    
    // === REMOÇÃO DE SUMÁRIO/ÍNDICE (será exibido no menu de rodapé) ===
    // Remover bloco de sumário inteiro
    .replace(/(?:^|\n)SUMÁRIO\s*\n[\s\S]*?(?=\n[A-ZÁÉÍÓÚÀÂÃÊÎÔÕÇ][a-záéíóúàâãêîôõç]|\n\n[A-Z])/gi, '\n')
    .replace(/(?:^|\n)ÍNDICE\s*\n[\s\S]*?(?=\n[A-ZÁÉÍÓÚÀÂÃÊÎÔÕÇ][a-záéíóúàâãêîôõç]|\n\n[A-Z])/gi, '\n')
    .replace(/(?:^|\n)CONTENTS\s*\n[\s\S]*?(?=\n[A-ZÁÉÍÓÚÀÂÃÊÎÔÕÇ][a-záéíóúàâãêîôõç]|\n\n[A-Z])/gi, '\n')
    
    // === LIMPEZA DE FORMATAÇÃO ===
    // Números de página isolados
    .replace(/^\s*\d+\s*$/gm, '')
    // Múltiplas linhas vazias
    .replace(/\n{4,}/g, '\n\n\n')
    // Linhas com apenas pontuação ou símbolos
    .replace(/^[\s\-_=\.•\*]+$/gm, '')
    .trim();
  
  return limpo;
}

// Verificar se página é apenas lixo editorial (sem conteúdo narrativo)
function isPaginaLixo(texto: string): boolean {
  const textoLimpo = texto.trim();
  
  // Página muito curta
  if (textoLimpo.length < 100) return true;
  
  // Padrões que indicam página editorial/pré-textual
  const padroesLixo = [
    /^[A-Z\s]+$/m, // Apenas maiúsculas (título de capa)
    /ISBN/i,
    /Copyright/i,
    /Todos os direitos/i,
    /All rights reserved/i,
    /Ficha catalográfica/i,
    /Dados Internacionais/i,
    /CIP-Brasil/i,
    /Impresso no Brasil/i,
    /Printed in Brazil/i,
    /^\s*Tradução:/im,
    /^\s*Revisão:/im,
    /^\s*Capa:/im,
    /^\s*Projeto gráfico/im,
    /^\s*Sumário\s*$/im,
    /^\s*Índice\s*$/im,
    // Padrões específicos do livro Exploradores de Cavernas
    /Republished with permission/i,
    /Grafia atualizada/i,
    /Acordo Ortográfico/i,
    /Produção digital/i,
    /Fuller,?\s*Lon\s*L\./i,
    /Geração Editorial/i,
    /^\s*Diretora?\s+\w+/im,
    /^\s*Assistente\s+\w+/im,
    /^\s*Gerente\s+\w+/im,
  ];
  
  // Contar quantos padrões de lixo aparecem
  const matchesLixo = padroesLixo.filter(p => p.test(textoLimpo)).length;
  
  // Se mais de 2 padrões de lixo, é página editorial
  if (matchesLixo >= 2) return true;
  
  // Se não tem parágrafos longos (texto narrativo), provavelmente é lixo
  const paragrafos = textoLimpo.split(/\n\n+/);
  const paragrafosLongos = paragrafos.filter(p => p.trim().length > 150);
  if (paragrafosLongos.length === 0) return true;
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tituloLivro, pdfUrl } = await req.json();

    if (!tituloLivro || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'tituloLivro e pdfUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[OCR] Processando PDF: ${tituloLivro}`);
    console.log(`[OCR] URL: ${pdfUrl}`);

    // 1. Baixar PDF do Google Drive
    const pdfBuffer = await baixarPdfDrive(pdfUrl);
    console.log(`[OCR] PDF baixado: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);

    // 2. Converter para Base64
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);
    console.log(`[OCR] PDF convertido para Base64`);

    // 3. Extrair texto com Mistral OCR (uma chamada para todo o PDF) COM IMAGENS
    const paginas = await extrairTextoComMistral(pdfBase64, supabase, tituloLivro);
    console.log(`[OCR] ${paginas.length} páginas extraídas pelo Mistral (com imagens)`);

    // 4. Limpar páginas antigas do livro
    const { error: deleteError } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .delete()
      .eq('Titulo da Obra', tituloLivro);
    
    if (deleteError) {
      console.log('[OCR] Aviso ao limpar páginas antigas:', deleteError.message);
    }

    // 5. Salvar cada página no banco - FILTRAR PÁGINAS DE LIXO
    let paginasSalvas = 0;
    let paginasIgnoradas = 0;
    
    for (const pagina of paginas) {
      const numeroPagina = (pagina.index || 0) + 1; // Mistral usa índice 0-based
      const textoOriginal = pagina.markdown || '';
      
      // Limpar texto de lixo editorial
      const textoLimpo = limparTextoLixo(textoOriginal);
      
      // Verificar se é página de lixo editorial
      if (isPaginaLixo(textoLimpo)) {
        console.log(`[OCR] Página ${numeroPagina} ignorada (lixo editorial)`);
        paginasIgnoradas++;
        continue;
      }
      
      // Só salvar se tiver conteúdo significativo
      if (textoLimpo.length > 100) {
        const { error } = await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .upsert({
            'Titulo da Obra': tituloLivro,
            'Pagina': numeroPagina,
            'Conteúdo': textoLimpo,
            'Titulo do Capitulo': null
          }, { 
            onConflict: 'Titulo da Obra,Pagina',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`[OCR] Erro ao salvar página ${numeroPagina}:`, error);
        } else {
          paginasSalvas++;
        }
      } else {
        console.log(`[OCR] Página ${numeroPagina} ignorada (conteúdo insuficiente: ${textoLimpo.length} chars)`);
        paginasIgnoradas++;
      }
    }

    console.log(`[OCR] ${paginasSalvas} páginas salvas de ${paginas.length} extraídas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        paginasProcessadas: paginasSalvas,
        totalPaginas: paginas.length,
        paginaAtual: paginas.length,
        temMais: false,
        proximaPagina: null,
        metodo: 'mistral-ocr'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[OCR] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
