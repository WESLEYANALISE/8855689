import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrientacaoPolitica } from './usePoliticaPreferencias';

export interface DocumentarioPolitico {
  id?: string;
  videoId: string;
  titulo: string;
  descricao: string;
  thumbnail: string;
  canal: string;
  duracao?: string;
  publicadoEm: string;
  visualizacoes?: string;
}

interface FetchDocumentariosResponse {
  videos: DocumentarioPolitico[];
  orientacao: string;
}

const fetchDocumentariosPoliticos = async (orientacao: OrientacaoPolitica): Promise<DocumentarioPolitico[]> => {
  console.log(`[usePoliticaDocumentarios] Buscando documentários para: ${orientacao}`);
  
  // Primeiro, tentar buscar do cache local (Supabase)
  const { data: cachedDocs, error: cacheError } = await supabase
    .from('politica_documentarios')
    .select('*')
    .eq('orientacao', orientacao)
    .order('created_at', { ascending: false })
    .limit(12);

  if (!cacheError && cachedDocs && cachedDocs.length > 0) {
    console.log(`[usePoliticaDocumentarios] Retornando ${cachedDocs.length} do cache local`);
    return cachedDocs.map(doc => ({
      id: doc.id,
      videoId: doc.video_id,
      titulo: doc.titulo,
      descricao: doc.descricao || '',
      thumbnail: doc.thumbnail || '',
      canal: doc.canal || '',
      duracao: doc.duracao || undefined,
      publicadoEm: doc.publicado_em || '',
      visualizacoes: doc.visualizacoes || undefined,
    }));
  }

  // Se não tem cache, buscar da edge function (que vai buscar do YouTube e cachear)
  const { data, error } = await supabase.functions.invoke('buscar-documentarios-politicos', {
    body: { orientacao, maxResults: 12 }
  });

  if (error) {
    console.error('[usePoliticaDocumentarios] Erro:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  console.log(`[usePoliticaDocumentarios] ${data?.videos?.length || 0} vídeos encontrados`);
  return data?.videos || [];
};

export function usePoliticaDocumentarios(orientacao: OrientacaoPolitica) {
  return useQuery({
    queryKey: ['politica-documentarios', orientacao],
    queryFn: () => fetchDocumentariosPoliticos(orientacao),
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
    enabled: !!orientacao,
    retry: 2,
  });
}
