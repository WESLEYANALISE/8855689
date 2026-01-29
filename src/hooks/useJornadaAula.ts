import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AulaEstruturaV2 } from "@/components/aula-v2/types";

interface ResumoData {
  id: number;
  area: string;
  tema: string;
  resumo_markdown: string;
  exemplos: string;
  termos: { termo: string; definicao: string }[] | string;
}

export const useJornadaAula = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);

  const buscarOuGerarAula = useCallback(async (resumo: ResumoData): Promise<AulaEstruturaV2 | null> => {
    setLoading(true);
    setError(null);

    try {
      // First check if aula exists in cache
      const { data: cached } = await supabase
        .from('jornada_aulas_cache')
        .select('estrutura_completa, id')
        .eq('area', resumo.area)
        .eq('resumo_id', resumo.id)
        .single();

      if (cached) {
        const estrutura = {
          ...(cached.estrutura_completa as unknown as AulaEstruturaV2),
          cached: true,
          aulaId: cached.id
        };
        setAulaEstrutura(estrutura);
        return estrutura;
      }

      // Generate new aula
      const response = await supabase.functions.invoke('gerar-aula-jornada', {
        body: {
          area: resumo.area,
          resumoId: resumo.id,
          tema: resumo.tema,
          conteudoOriginal: resumo.resumo_markdown,
          resumoMarkdown: resumo.resumo_markdown,
          exemplos: resumo.exemplos,
          termos: resumo.termos
        }
      });

      if (response.error) throw response.error;

      const estrutura = response.data as AulaEstruturaV2;
      setAulaEstrutura(estrutura);
      return estrutura;

    } catch (err: any) {
      console.error('Erro ao buscar/gerar aula:', err);
      setError(err.message || 'Erro ao carregar aula');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const limparAula = useCallback(() => {
    setAulaEstrutura(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    aulaEstrutura,
    buscarOuGerarAula,
    limparAula,
    setAulaEstrutura
  };
};
