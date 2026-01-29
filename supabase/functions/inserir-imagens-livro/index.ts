import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImagemInserir {
  imagemBase64: string;
  nomeArquivo: string;
  livroTitulo: string;
  paginaOCR: number;
  posicao: 'substituir' | 'apos';
  textoReferencia: string;
  descricaoImagem?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imagens } = await req.json() as { imagens: ImagemInserir[] };
    
    if (!imagens || imagens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma imagem fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const resultados: Array<{ arquivo: string; url: string; sucesso: boolean }> = [];

    for (const img of imagens) {
      console.log(`[UPLOAD] Processando: ${img.nomeArquivo}`);
      
      try {
        // Converter base64 para Uint8Array
        const base64Data = img.imagemBase64.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Determinar content type
        const extension = img.nomeArquivo.split('.').pop()?.toLowerCase() || 'jpg';
        const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
        
        // Upload para o bucket leitura-imagens
        const filePath = `livros/${img.livroTitulo.replace(/[^a-zA-Z0-9]/g, '_')}/${img.nomeArquivo}`;
        
        const { error: uploadError } = await supabase.storage
          .from('leitura-imagens')
          .upload(filePath, binaryData, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error(`[ERRO] Upload falhou: ${uploadError.message}`);
          resultados.push({ arquivo: img.nomeArquivo, url: '', sucesso: false });
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('leitura-imagens')
          .getPublicUrl(filePath);

        const urlPublica = urlData.publicUrl;
        console.log(`[UPLOAD] Sucesso: ${urlPublica}`);

        // Atualizar conteúdo OCR para incluir a imagem
        const { data: paginaOCR, error: errorBusca } = await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .select('id, "Conteúdo"')
          .ilike('Titulo da Obra', `%${img.livroTitulo}%`)
          .eq('Pagina', img.paginaOCR)
          .single();

        if (paginaOCR) {
          const conteudoOriginal = (paginaOCR as Record<string, unknown>)['Conteúdo'] as string || '';
          const paginaId = (paginaOCR as Record<string, unknown>)['id'] as number;
          
          if (conteudoOriginal) {
            let conteudoAtualizado = conteudoOriginal;
            const marcadorImagem = `\n\n![${img.descricaoImagem || img.nomeArquivo}](${urlPublica})\n\n`;
            
            if (img.posicao === 'substituir') {
              // Substituir o texto de referência pela imagem
              conteudoAtualizado = conteudoAtualizado.replace(img.textoReferencia, marcadorImagem);
            } else {
              // Inserir após o texto de referência
              const indice = conteudoAtualizado.indexOf(img.textoReferencia);
              if (indice !== -1) {
                const fim = indice + img.textoReferencia.length;
                conteudoAtualizado = 
                  conteudoAtualizado.substring(0, fim) + 
                  marcadorImagem + 
                  conteudoAtualizado.substring(fim);
              }
            }

            // Salvar conteúdo atualizado
            const { error: errorUpdate } = await supabase
              .from('BIBLIOTECA-LEITURA-DINAMICA')
              .update({ 'Conteúdo': conteudoAtualizado })
              .eq('id', paginaId);

            if (errorUpdate) {
              console.error(`[ERRO] Atualização falhou: ${errorUpdate.message}`);
            } else {
              console.log(`[OK] Conteúdo atualizado na página ${img.paginaOCR}`);
            }
          }
        }

        resultados.push({ arquivo: img.nomeArquivo, url: urlPublica, sucesso: true });
      } catch (e) {
        console.error(`[ERRO] ${img.nomeArquivo}:`, e);
        resultados.push({ arquivo: img.nomeArquivo, url: '', sucesso: false });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        resultados,
        totalProcessadas: resultados.length,
        totalSucesso: resultados.filter(r => r.sucesso).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ERRO GERAL]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
