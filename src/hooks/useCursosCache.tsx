import { useCacheFirstArticles } from "./useCacheFirstArticles";

interface CursoData {
  area: string;
  tema: string;
  ordem: number;
  'capa-aula': string;
  'aula-link': string;
  conteudo: string;
  'conteudo-final': string | null;
  'descricao-aula': string | null;
  'descricao_gerada_em': string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
}

export const useCursosCache = () => {
  const { 
    articles: cursos, 
    isLoading: loading, 
    refresh,
    isFetchingFresh
  } = useCacheFirstArticles<CursoData>({
    tableName: 'CURSOS-APP',
    orderBy: 'ordem'
  });

  // REMOVIDO: Realtime listener - cursos não mudam frequentemente
  // Isso eliminava conexão WebSocket desnecessária e re-renders

  return { 
    cursos, 
    loading, 
    invalidateCache: refresh, 
    lastUpdate: null 
  };
};