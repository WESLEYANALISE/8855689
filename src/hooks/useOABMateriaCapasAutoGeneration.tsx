import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MateriaParaCapa {
  id: number;
  titulo: string;
  capa_url: string | null;
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
      console.log(`[CapaMateria] Gerando capa para: ${materia.titulo}`);
      
      const { data, error } = await supabase.functions.invoke("gerar-capa-materia-oab", {
        body: { 
          topico_id: materia.id,
          titulo: materia.titulo,
          area_nome: areaNome
        },
      });

      if (error) {
        console.error(`[CapaMateria] Erro:`, error);
        return false;
      }

      console.log(`[CapaMateria] ✅ Capa gerada:`, data?.url || data?.cached);
      return true;
    } catch (err) {
      console.error(`[CapaMateria] Erro:`, err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!materias || materias.length === 0 || !areaNome) return;

    const materiasSemCapa = materias.filter((m) => !m.capa_url);
    
    if (materiasSemCapa.length === 0) {
      setIsGenerating(false);
      return;
    }

    setTotalSemCapa(materiasSemCapa.length);
    
    // Evita múltiplas execuções simultâneas
    if (isGenerating) return;

    const gerarCapasSequencialmente = async () => {
      setIsGenerating(true);
      setProcessados(0);

      for (let i = 0; i < materiasSemCapa.length; i++) {
        const materia = materiasSemCapa[i];
        
        await gerarCapaParaMateria(materia, areaNome);
        setProcessados(i + 1);
        
        // Delay entre gerações para evitar rate limiting
        if (i < materiasSemCapa.length - 1) {
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
