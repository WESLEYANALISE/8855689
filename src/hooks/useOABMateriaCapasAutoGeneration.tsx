import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MateriaParaCapa {
  id: number;
  titulo: string;
  capa_url: string | null;
  capa_versao?: number | null;
}

export function useOABMateriaCapasAutoGeneration(
  materias: MateriaParaCapa[] | undefined,
  areaNome: string | undefined
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [processados, setProcessados] = useState(0);
  const [totalSemCapa, setTotalSemCapa] = useState(0);

  const gerarCapaParaMateria = useCallback(async (materia: MateriaParaCapa, areaNome: string) => {
    try {
      console.log(`[CapaMateria v2] Gerando capa temática para: ${materia.titulo}`);
      
      // Usar nova função com mapeamento detalhado por tema
      const { data, error } = await supabase.functions.invoke("gerar-capa-oab-tema", {
        body: { 
          materia_id: materia.id,
          materia_titulo: materia.titulo,
          area_nome: areaNome
        },
      });

      if (error) {
        console.error(`[CapaMateria v2] Erro:`, error);
        return false;
      }

      console.log(`[CapaMateria v2] ✅ Capa gerada:`, data?.capa_url || data?.cached);
      return true;
    } catch (err) {
      console.error(`[CapaMateria v2] Erro:`, err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!materias || materias.length === 0 || !areaNome) return;

    // Filtrar matérias que precisam de nova capa (sem capa ou versão antiga)
    const materiasSemCapaV2 = materias.filter((m) => !m.capa_url || m.capa_versao !== 2);
    
    if (materiasSemCapaV2.length === 0) {
      setIsGenerating(false);
      return;
    }

    setTotalSemCapa(materiasSemCapaV2.length);
    
    // Evita múltiplas execuções simultâneas
    if (isGenerating) return;

    const gerarCapasSequencialmente = async () => {
      setIsGenerating(true);
      setProcessados(0);

      for (let i = 0; i < materiasSemCapaV2.length; i++) {
        const materia = materiasSemCapaV2[i];
        
        await gerarCapaParaMateria(materia, areaNome);
        setProcessados(i + 1);
        
        // Delay entre gerações para evitar rate limiting
        if (i < materiasSemCapaV2.length - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      setIsGenerating(false);
    };

    gerarCapasSequencialmente();
  }, [materias?.length, areaNome]); // Só inicia quando materias carrega

  return {
    isGenerating,
    processados,
    totalSemCapa,
  };
}
