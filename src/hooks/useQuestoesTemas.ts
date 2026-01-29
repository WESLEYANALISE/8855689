import { useInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface TemaData {
  tema: string;
  temQuestoes: boolean;
  parcial: boolean;
  subtemasGerados: number;
  totalSubtemas: number;
  totalQuestoes: number;
  progressoPercent: number;
  ordem: number;
}

// Função para normalizar strings (remove acentos)
const normalizar = (str: string) => 
  str.trim()
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/\s+/g, ' ');

async function fetchTemasData(area: string): Promise<TemaData[]> {
  // Busca temas e subtemas únicos da área
  const { data: resumoData, error } = await supabase
    .from("RESUMO")
    .select("id, tema, subtema")
    .eq("area", area)
    .not("tema", "is", null)
    .order("id", { ascending: true });

  if (error) throw error;

  // Agrupa subtemas por tema e preserva a ordem
  const subtemasPortema: Record<string, { nomeOriginal: string; subtemas: Set<string>; ordem: number }> = {};
  let ordemCounter = 0;
  resumoData?.forEach(r => {
    if (r.tema) {
      const temaNorm = normalizar(r.tema);
      if (!subtemasPortema[temaNorm]) {
        subtemasPortema[temaNorm] = { nomeOriginal: r.tema.trim(), subtemas: new Set(), ordem: ordemCounter++ };
      }
      if (r.subtema) {
        subtemasPortema[temaNorm].subtemas.add(normalizar(r.subtema));
      }
    }
  });

  // Busca todas as questões geradas com paginação completa
  let allQuestoesData: { tema: string | null; subtema: string | null }[] = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: pageData } = await supabase
      .from("QUESTOES_GERADAS")
      .select("tema, subtema")
      .eq("area", area)
      .range(offset, offset + pageSize - 1);
    
    if (pageData && pageData.length > 0) {
      allQuestoesData = [...allQuestoesData, ...pageData];
      offset += pageSize;
      hasMore = pageData.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  // Agrupa subtemas com questões por tema e conta total
  const subtemasComQuestoes: Record<string, Set<string>> = {};
  const totalQuestoesPortema: Record<string, number> = {};
  allQuestoesData?.forEach(q => {
    if (q.tema) {
      const temaNorm = normalizar(q.tema);
      if (!subtemasComQuestoes[temaNorm]) {
        subtemasComQuestoes[temaNorm] = new Set();
      }
      if (!totalQuestoesPortema[temaNorm]) {
        totalQuestoesPortema[temaNorm] = 0;
      }
      totalQuestoesPortema[temaNorm]++;
      if (q.subtema) {
        subtemasComQuestoes[temaNorm].add(normalizar(q.subtema));
      }
    }
  });

  return Object.entries(subtemasPortema).map(([temaNorm, { nomeOriginal, subtemas, ordem }]) => {
    const totalSubtemas = subtemas.size;
    const questoesDoTema = subtemasComQuestoes[temaNorm] || new Set();
    const subtemasGerados = questoesDoTema.size;
    const totalQuestoes = totalQuestoesPortema[temaNorm] || 0;
    
    const temTodosSubtemas = totalSubtemas > 0 && subtemasGerados >= totalSubtemas;
    const temAlgunsSubtemas = subtemasGerados > 0 && subtemasGerados < totalSubtemas;
    const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;
    
    return {
      tema: nomeOriginal,
      temQuestoes: temTodosSubtemas,
      parcial: temAlgunsSubtemas,
      subtemasGerados,
      totalSubtemas,
      totalQuestoes,
      progressoPercent,
      ordem
    };
  }).sort((a, b) => a.ordem - b.ordem);
}

export function useQuestoesTemas(area: string) {
  const cacheKey = `questoes-temas-${normalizar(area)}`;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refresh
  } = useInstantCache<TemaData[]>({
    cacheKey,
    queryFn: () => fetchTemasData(area),
    enabled: !!area,
    cacheDuration: 1000 * 60 * 60 * 24 // 24 horas
  });

  return {
    temas: data || [],
    isLoading,
    isFetching,
    error,
    refresh
  };
}
