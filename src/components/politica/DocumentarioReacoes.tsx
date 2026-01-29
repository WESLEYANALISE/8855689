import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentarioReacoesProps {
  documentarioId: string;
}

const REACOES = [
  { tipo: 'like', emoji: '❤️', label: 'Curtir' },
  { tipo: 'fogo', emoji: '🔥', label: 'Fogo' },
  { tipo: 'surpreso', emoji: '😮', label: 'Surpreso' },
  { tipo: 'pensativo', emoji: '🤔', label: 'Pensativo' },
];

export function DocumentarioReacoes({ documentarioId }: DocumentarioReacoesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [animating, setAnimating] = useState<string | null>(null);

  // Buscar contagem de reações
  const { data: contagemReacoes } = useQuery({
    queryKey: ['documentario-reacoes-contagem', documentarioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politica_documentarios_reacoes')
        .select('tipo')
        .eq('documentario_id', documentarioId);
      
      if (error) throw error;
      
      const contagem: Record<string, number> = {};
      REACOES.forEach(r => contagem[r.tipo] = 0);
      data?.forEach(r => {
        contagem[r.tipo] = (contagem[r.tipo] || 0) + 1;
      });
      
      return contagem;
    },
  });

  // Buscar reações do usuário
  const { data: minhasReacoes } = useQuery({
    queryKey: ['documentario-minhas-reacoes', documentarioId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('politica_documentarios_reacoes')
        .select('tipo')
        .eq('documentario_id', documentarioId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(r => r.tipo) || [];
    },
    enabled: !!user?.id,
  });

  // Mutation para reagir/remover reação
  const toggleReacao = useMutation({
    mutationFn: async (tipo: string) => {
      if (!user?.id) throw new Error('Não autenticado');
      
      const jaReagiu = minhasReacoes?.includes(tipo);
      
      if (jaReagiu) {
        await supabase
          .from('politica_documentarios_reacoes')
          .delete()
          .eq('documentario_id', documentarioId)
          .eq('user_id', user.id)
          .eq('tipo', tipo);
      } else {
        await supabase
          .from('politica_documentarios_reacoes')
          .insert({
            documentario_id: documentarioId,
            user_id: user.id,
            tipo,
          });
      }
      
      return { tipo, added: !jaReagiu };
    },
    onMutate: (tipo) => {
      setAnimating(tipo);
      setTimeout(() => setAnimating(null), 300);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentario-reacoes-contagem', documentarioId] });
      queryClient.invalidateQueries({ queryKey: ['documentario-minhas-reacoes', documentarioId] });
    },
    onError: () => {
      toast.error('Erro ao reagir');
    },
  });

  const handleReagir = (tipo: string) => {
    if (!user) {
      toast.error('Faça login para reagir');
      return;
    }
    toggleReacao.mutate(tipo);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 border-b border-white/5">
      {REACOES.map((reacao) => {
        const count = contagemReacoes?.[reacao.tipo] || 0;
        const isActive = minhasReacoes?.includes(reacao.tipo);
        const isAnimating = animating === reacao.tipo;
        
        return (
          <motion.button
            key={reacao.tipo}
            onClick={() => handleReagir(reacao.tipo)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              isActive 
                ? 'bg-primary/20 ring-1 ring-primary/50' 
                : 'bg-white/5 hover:bg-white/10'
            }`}
            whileTap={{ scale: 0.95 }}
            disabled={toggleReacao.isPending}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isAnimating ? 'animating' : 'static'}
                initial={isAnimating ? { scale: 1.5, rotate: -10 } : false}
                animate={{ scale: 1, rotate: 0 }}
                className="text-lg"
              >
                {reacao.emoji}
              </motion.span>
            </AnimatePresence>
            <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {count > 0 ? count : ''}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
