import { supabase } from "@/integrations/supabase/client";

interface ImagemParaUpload {
  arquivo: File | Blob;
  nomeArquivo: string;
  livroTitulo: string;
}

export async function uploadImagensParaStorage(imagens: ImagemParaUpload[]): Promise<string[]> {
  const urls: string[] = [];
  
  for (const img of imagens) {
    const livroSlug = img.livroTitulo.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `livros/${livroSlug}/${img.nomeArquivo}`;
    
    const { error } = await supabase.storage
      .from('leitura-imagens')
      .upload(filePath, img.arquivo, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) {
      console.error('Erro no upload:', error);
      continue;
    }
    
    const { data } = supabase.storage
      .from('leitura-imagens')
      .getPublicUrl(filePath);
      
    urls.push(data.publicUrl);
    console.log(`Upload concluído: ${data.publicUrl}`);
  }
  
  return urls;
}

// Função para converter URL de imagem em Blob
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}
