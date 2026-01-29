import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeputadoPopular {
  id: string;
  deputado_id: number;
  nome: string;
  partido: string | null;
  uf: string | null;
  foto_url: string | null;
  visualizacoes: number;
  ordem: number;
}

export const useDeputadosPopulares = () => {
  const [deputados, setDeputados] = useState<DeputadoPopular[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeputados = async () => {
      try {
        const { data, error } = await supabase
          .from('deputados_populares')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        if (error) throw error;
        setDeputados(data || []);
      } catch (err) {
        console.error('Erro ao carregar deputados populares:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeputados();
  }, []);

  return { deputados, isLoading };
};
