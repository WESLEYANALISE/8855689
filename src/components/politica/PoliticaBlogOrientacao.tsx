import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { FileText, ChevronRight, Sparkles, Clock, Lock, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';
import { motion } from 'framer-motion';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
interface PoliticaBlogOrientacaoProps {
  orientacao: OrientacaoPolitica;
}

interface Artigo {
  id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  orientacao: string;
  termo_wikipedia: string | null;
  ordem: number;
  imagem_url: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// Calcular tempo de leitura estimado
const calcularTempoLeitura = (conteudo: string | null): number => {
  if (!conteudo) return 5; // Default para artigos não gerados
  const palavras = conteudo.split(/\s+/).length;
  return Math.max(3, Math.ceil(palavras / 200)); // 200 palavras por minuto
};

export function PoliticaBlogOrientacao({ orientacao }: PoliticaBlogOrientacaoProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();

  // Artigos gratuitos: primeiros 2 de cada orientação
  const ARTIGOS_GRATIS = 2;

  const { data: artigos, isLoading } = useQuery({
    queryKey: ['politica-blog-orientacao', orientacao],
    queryFn: async () => {
      let query = supabase
        .from('politica_blog_orientacao')
        .select('*')
        .order('ordem', { ascending: true });

      if (orientacao && orientacao !== 'todos') {
        query = query.eq('orientacao', orientacao);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Artigo[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const abrirArtigo = (artigo: Artigo, index: number) => {
    // Verificar se é Premium ou se está dentro do limite gratuito
    if (!isPremium && index >= ARTIGOS_GRATIS) {
      toast.error('Conteúdo exclusivo para assinantes Premium', {
        description: 'Assine agora e tenha acesso a todos os artigos!',
        action: {
          label: 'Ver planos',
          onClick: () => navigate('/assinatura'),
        },
      });
      return;
    }
    navigate(`/politica/artigo/${artigo.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const getOrientacaoLabel = (o: string) => {
    switch (o) {
      case 'esquerda': return 'Esquerda';
      case 'centro': return 'Centro';
      case 'direita': return 'Direita';
      default: return o;
    }
  };

  const getOrientacaoColors = (o: string) => {
    switch (o) {
      case 'esquerda':
        return {
          gradient: 'from-red-500/30 to-red-900/50',
          border: 'border-red-500/30',
          bg: 'bg-red-950/50',
          hoverBg: 'hover:bg-red-950/70',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
          glow: 'hover:shadow-red-500/20',
          accent: 'text-red-400',
        };
      case 'centro':
        return {
          gradient: 'from-yellow-500/30 to-yellow-900/50',
          border: 'border-yellow-500/30',
          bg: 'bg-yellow-950/50',
          hoverBg: 'hover:bg-yellow-950/70',
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          glow: 'hover:shadow-yellow-500/20',
          accent: 'text-yellow-400',
        };
      case 'direita':
        return {
          gradient: 'from-blue-500/30 to-blue-900/50',
          border: 'border-blue-500/30',
          bg: 'bg-blue-950/50',
          hoverBg: 'hover:bg-blue-950/70',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          glow: 'hover:shadow-blue-500/20',
          accent: 'text-blue-400',
        };
      default:
        return {
          gradient: 'from-neutral-600/30 to-neutral-900/30',
          border: 'border-border',
          bg: 'bg-card/95',
          hoverBg: 'hover:bg-card',
          badge: 'bg-muted text-muted-foreground',
          glow: 'hover:shadow-primary/10',
          accent: 'text-primary',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {orientacao === 'todos' ? 'Entenda as Orientações' : `Entenda a ${getOrientacaoLabel(orientacao || '')}`}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {artigos?.length || 0} artigos
        </span>
      </div>

      <motion.div 
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {artigos?.map((artigo, index) => {
          const colors = getOrientacaoColors(artigo.orientacao);
          const tempoLeitura = calcularTempoLeitura(artigo.conteudo);
          const isLocked = !isPremium && index >= ARTIGOS_GRATIS;
          
          return (
            <motion.div key={artigo.id} variants={cardVariants}>
              <Card
                className={`overflow-hidden transition-all cursor-pointer group border ${colors.border} ${colors.bg} ${colors.hoverBg} hover:shadow-xl ${colors.glow} hover:scale-[1.01] ${isLocked ? 'opacity-75' : ''}`}
                onClick={() => abrirArtigo(artigo, index)}
              >
                <div className="flex gap-4 p-4">
                  {/* Imagem maior */}
                  <div className="relative flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-secondary">
                    {artigo.imagem_url ? (
                      <img 
                        src={artigo.imagem_url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        <Sparkles className={`w-8 h-8 ${colors.accent} opacity-60`} />
                      </div>
                    )}
                    {/* Overlay de hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      {/* Badge de orientação (apenas quando mostrando todos) */}
                      {orientacao === 'todos' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border mb-2 inline-block ${colors.badge}`}>
                          {getOrientacaoLabel(artigo.orientacao)}
                        </span>
                      )}
                      
                      {/* Título */}
                      <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-foreground group-hover:text-white transition-colors">
                        {artigo.titulo}
                      </h3>
                      
                      {/* Resumo */}
                      {artigo.resumo && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 hidden sm:block">
                          {artigo.resumo}
                        </p>
                      )}
                    </div>
                    
                    {/* Footer do card */}
                    <div className="flex items-center justify-between mt-3">
                      {/* Tempo de leitura */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{tempoLeitura} min de leitura</span>
                      </div>
                      
                      {/* CTA */}
                      <div className={`flex items-center gap-1 text-xs ${isLocked ? 'text-amber-500' : colors.accent} font-medium`}>
                        {isLocked ? (
                          <>
                            <Crown className="w-3 h-3" />
                            Premium
                          </>
                        ) : artigo.conteudo ? (
                          'Ler artigo'
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Gerar com IA
                          </>
                        )}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {artigos?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum artigo disponível</p>
        </div>
      )}
    </div>
  );
}
