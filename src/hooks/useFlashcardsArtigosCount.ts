import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FlashcardAreaCount {
  area: string;
  total: number;
}

interface CategorizedCounts {
  constituicao: number;
  codigos: number;
  estatutos: number;
  legislacaoPenal: number;
  previdenciario: number;
  sumulas: number;
}

// Cache em localStorage para persistir entre sessões
const CACHE_KEY_FLASHCARDS = "flashcards-artigos-count-cache";
const CACHE_KEY_VADEMECUM = "vademecum-counts-cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 horas

const getFromLocalStorage = <T>(key: string): { data: T; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Erro ao ler cache:", e);
  }
  return null;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Erro ao salvar cache:", e);
  }
};

export const useFlashcardsArtigosCount = () => {
  return useQuery({
    queryKey: ["flashcards-artigos-count"],
    queryFn: async (): Promise<FlashcardAreaCount[]> => {
      // Tentar usar cache local primeiro
      const cached = getFromLocalStorage<FlashcardAreaCount[]>(CACHE_KEY_FLASHCARDS);
      if (cached) {
        console.log("📦 Usando cache local de flashcards");
        return cached.data;
      }

      // Usar RPC para buscar contagem agrupada diretamente do banco
      const { data, error } = await supabase.rpc("get_flashcard_artigos_count" as never);

      if (error) {
        console.error("Erro ao buscar contagem de flashcards:", error);
        throw error;
      }

      const result = ((data as { area: string; total: number }[]) || []).map((item) => ({
        area: item.area,
        total: Number(item.total),
      }));

      // Salvar no cache local
      saveToLocalStorage(CACHE_KEY_FLASHCARDS, result);
      console.log("💾 Cache de flashcards atualizado");

      return result;
    },
    staleTime: CACHE_DURATION, // 24 horas
    gcTime: CACHE_DURATION * 2, // Manter no cache por 48 horas
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Hook para buscar contagem total das categorias do Vade Mecum
export const useVadeMecumCounts = () => {
  return useQuery({
    queryKey: ["vademecum-counts"],
    queryFn: async (): Promise<{ legislacaoPenal: number; previdenciario: number; sumulas: number }> => {
      // Tentar usar cache local primeiro
      const cached = getFromLocalStorage<{ legislacaoPenal: number; previdenciario: number; sumulas: number }>(CACHE_KEY_VADEMECUM);
      if (cached) {
        console.log("📦 Usando cache local do Vade Mecum");
        return cached.data;
      }

      // Buscar contagens em paralelo
      const [
        mariaPenha, drogas, orgCriminosas, abusoAutoridade, execPenal, 
        hediondos, interceptacao, tortura, lavagem,
        custeio, beneficios,
        stf, stj, vinculantes, tst, tse, tcu, stm
      ] = await Promise.all([
        supabase.from("Lei 11.340 de 2006 - Maria da Penha").select("*", { count: "exact", head: true }),
        supabase.from("Lei 11.343 de 2006 - Lei de Drogas").select("*", { count: "exact", head: true }),
        supabase.from("Lei 12.850 de 2013 - Organizações Criminosas").select("*", { count: "exact", head: true }),
        supabase.from("Lei 13.869 de 2019 - Abuso de Autoridade").select("*", { count: "exact", head: true }),
        supabase.from("Lei 7.210 de 1984 - Lei de Execução Penal").select("*", { count: "exact", head: true }),
        supabase.from("Lei 8.072 de 1990 - Crimes Hediondos").select("*", { count: "exact", head: true }),
        supabase.from("Lei 9.296 de 1996 - Interceptação Telefônica").select("*", { count: "exact", head: true }),
        supabase.from("Lei 9.455 de 1997 - Tortura").select("*", { count: "exact", head: true }),
        supabase.from("LLD - Lei de Lavagem de Dinheiro").select("*", { count: "exact", head: true }),
        supabase.from("LEI 8212 - Custeio").select("*", { count: "exact", head: true }),
        supabase.from("LEI 8213 - Benefícios").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS STF").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS STJ").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS VINCULANTES").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS TST").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS TSE").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS TCU").select("*", { count: "exact", head: true }),
        supabase.from("SUMULAS STM").select("*", { count: "exact", head: true }),
      ]);

      const legislacaoPenal = (mariaPenha.count || 0) + (drogas.count || 0) + (orgCriminosas.count || 0) + 
        (abusoAutoridade.count || 0) + (execPenal.count || 0) + (hediondos.count || 0) + 
        (interceptacao.count || 0) + (tortura.count || 0) + (lavagem.count || 0);
      
      const previdenciario = (custeio.count || 0) + (beneficios.count || 0);
      
      const sumulas = (stf.count || 0) + (stj.count || 0) + (vinculantes.count || 0) + 
        (tst.count || 0) + (tse.count || 0) + (tcu.count || 0) + (stm.count || 0);

      const result = { legislacaoPenal, previdenciario, sumulas };

      // Salvar no cache local
      saveToLocalStorage(CACHE_KEY_VADEMECUM, result);
      console.log("💾 Cache do Vade Mecum atualizado");

      return result;
    },
    staleTime: CACHE_DURATION, // 24 horas
    gcTime: CACHE_DURATION * 2, // Manter no cache por 48 horas
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Função para invalidar cache quando novos flashcards são gerados
export const invalidateFlashcardsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY_FLASHCARDS);
    localStorage.removeItem(CACHE_KEY_VADEMECUM);
    console.log("🗑️ Cache de flashcards invalidado");
  } catch (e) {
    console.warn("Erro ao invalidar cache:", e);
  }
};

export const getTotalFlashcards = (counts: FlashcardAreaCount[]): number => {
  return counts.reduce((sum, item) => sum + item.total, 0);
};

export const getCountByArea = (
  counts: FlashcardAreaCount[],
  area: string
): number => {
  return counts.find((item) => item.area === area)?.total || 0;
};

// Categorização de áreas por tipo
export const categorizeAreas = (
  counts: FlashcardAreaCount[], 
  vadeMecumCounts?: { legislacaoPenal: number; previdenciario: number; sumulas: number }
): CategorizedCounts => {
  const constituicao = ["Constituição Federal"];
  const codigos = [
    "Código Civil", "Código Penal", "Código de Processo Civil", 
    "Código de Processo Penal", "CLT", "Código de Defesa do Consumidor",
    "Código Tributário Nacional", "Código de Trânsito Brasileiro",
    "Código Eleitoral", "Código de Águas", "Código Brasileiro de Aeronáutica",
    "Código Brasileiro de Telecomunicações", "Código Comercial", 
    "Código de Minas", "Código Penal Militar", "Código de Processo Penal Militar"
  ];
  const estatutos = [
    "ECA", "Estatuto do Idoso", "Estatuto da OAB", 
    "Estatuto da Pessoa com Deficiência", "Estatuto da Igualdade Racial",
    "Estatuto da Cidade", "Estatuto do Torcedor"
  ];
  // Legislação Penal Especial - nomes completos como salvos na tabela
  const legislacaoPenalAreas = [
    "Lei 7.210 de 1984 - Lei de Execução Penal",
    "LCP - Lei das Contravenções Penais",
    "Lei 11.343 de 2006 - Lei de Drogas",
    "Lei 11.340 de 2006 - Maria da Penha",
    "Lei 8.072 de 1990 - Crimes Hediondos",
    "Lei 9.455 de 1997 - Tortura",
    "Lei 12.850 de 2013 - Organizações Criminosas",
    "LLD - Lei de Lavagem de Dinheiro",
    "Lei 9.296 de 1996 - Interceptação Telefônica",
    "Lei 13.869 de 2019 - Abuso de Autoridade",
    "Lei 9.099 de 1995 - Juizados Especiais",
    "ESTATUTO - DESARMAMENTO"
  ];

  const getTotal = (areaList: string[]) => {
    return counts
      .filter((c) => areaList.includes(c.area))
      .reduce((sum, c) => sum + c.total, 0);
  };

  // Calcular total de legislação penal a partir dos flashcards existentes
  const legislacaoPenalFromFlashcards = getTotal(legislacaoPenalAreas);

  return {
    constituicao: getTotal(constituicao),
    codigos: getTotal(codigos),
    estatutos: getTotal(estatutos),
    legislacaoPenal: legislacaoPenalFromFlashcards || vadeMecumCounts?.legislacaoPenal || 0,
    previdenciario: vadeMecumCounts?.previdenciario || 0,
    sumulas: vadeMecumCounts?.sumulas || 0,
  };
};
