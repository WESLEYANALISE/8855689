import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type OrientacaoPolitica = 'esquerda' | 'centro' | 'direita' | 'todos' | null;

export function usePoliticaPreferencias() {
  const { user } = useAuth();
  const [orientacao, setOrientacao] = useState<OrientacaoPolitica>('todos');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Buscar preferência do usuário ou localStorage
  useEffect(() => {
    const buscarPreferencia = async () => {
      // Primeiro, verificar localStorage
      const localOrientacao = localStorage.getItem('orientacao_politica') as OrientacaoPolitica;
      
      if (user) {
        // Usuário logado - buscar do banco
        const { data, error } = await supabase
          .from('profiles')
          .select('orientacao_politica')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.orientacao_politica) {
          setOrientacao(data.orientacao_politica as OrientacaoPolitica);
          localStorage.setItem('orientacao_politica', data.orientacao_politica);
        } else if (localOrientacao) {
          // Sincronizar localStorage com o banco
          setOrientacao(localOrientacao);
          await supabase
            .from('profiles')
            .update({ orientacao_politica: localOrientacao })
            .eq('id', user.id);
        } else {
          // Sem preferência - usar 'todos' como padrão (sem modal)
          setOrientacao('todos');
        }
      } else if (localOrientacao) {
        setOrientacao(localOrientacao);
      } else {
        // Sem preferência - usar 'todos' como padrão (sem modal)
        setOrientacao('todos');
      }
      
      setLoading(false);
    };

    buscarPreferencia();
  }, [user]);

  // Salvar preferência
  const salvarOrientacao = useCallback(async (novaOrientacao: OrientacaoPolitica) => {
    if (!novaOrientacao) return;
    
    // Salvar no localStorage
    localStorage.setItem('orientacao_politica', novaOrientacao);
    setOrientacao(novaOrientacao);
    setShowModal(false);
    
    // Se usuário logado, salvar no banco
    if (user) {
      await supabase
        .from('profiles')
        .update({ orientacao_politica: novaOrientacao })
        .eq('id', user.id);
    }
  }, [user]);

  // Abrir modal para trocar orientação
  const abrirModalOrientacao = useCallback(() => {
    setShowModal(true);
  }, []);

  const fecharModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return { 
    orientacao, 
    loading, 
    salvarOrientacao, 
    showModal,
    abrirModalOrientacao,
    fecharModal,
    precisaEscolher: false // Nunca mais precisa escolher, padrão é 'todos'
  };
}
