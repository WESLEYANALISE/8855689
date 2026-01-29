import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Book, Search, Lock, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstantCache } from '@/hooks/useInstantCache';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface PoliticaLivrosProps {
  orientacao: 'esquerda' | 'centro' | 'direita' | 'todos';
}

interface Livro {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  link: string | null;
  imagem: string | null;
  sobre: string | null;
  beneficios: string | null;
}

export function PoliticaLivros({ orientacao }: PoliticaLivrosProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { isPremium } = useSubscription();

  // Livros gratuitos: apenas o primeiro de cada orientação
  const LIVROS_GRATIS = 1;

  // Usar useInstantCache para carregamento instantâneo (mesmo cacheKey do preloader)
  const { data: livros, isLoading } = useInstantCache<Livro[]>({
    cacheKey: 'biblioteca-politica-all',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-POLITICA')
        .select('id, area, livro, autor, link, imagem, sobre, beneficios')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data as Livro[];
    },
    cacheDuration: 1000 * 60 * 60 * 24, // 24 horas
    preloadImages: true,
    imageExtractor: (data) => data.map(l => l.imagem).filter(Boolean) as string[],
  });

  // Filtrar livros por orientação e busca
  const livrosFiltrados = useMemo(() => {
    if (!livros) return [];
    
    let result = livros;
    
    // Filtrar por orientação
    if (orientacao && orientacao !== 'todos') {
      result = result.filter(l => l.area === orientacao);
    }
    
    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.livro?.toLowerCase().includes(termo) ||
        l.autor?.toLowerCase().includes(termo)
      );
    }
    
    return result;
  }, [livros, orientacao, searchTerm]);

  const abrirLivro = (livro: Livro, index: number) => {
    // Verificar se é Premium ou se está dentro do limite gratuito
    if (!isPremium && index >= LIVROS_GRATIS) {
      toast.error('Livro exclusivo para assinantes Premium', {
        description: 'Assine agora e tenha acesso a todos os livros!',
        action: {
          label: 'Ver planos',
          onClick: () => navigate('/assinatura'),
        },
      });
      return;
    }
    // Navegar para detalhes do livro (com flag de gratuito para bloquear download)
    navigate(`/politica/livro/${livro.id}`, { state: { isFreeAccess: !isPremium && index < LIVROS_GRATIS } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const getOrientacaoLabel = (o: string | null) => {
    switch (o) {
      case 'esquerda': return 'Esquerda';
      case 'centro': return 'Centro';
      case 'direita': return 'Direita';
      default: return o || '';
    }
  };

  const getOrientacaoColor = (o: string | null) => {
    switch (o) {
      case 'esquerda': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'centro': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'direita': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou autor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-card/50 border-white/10"
        />
      </div>

      {/* Lista de livros */}
      <div className="space-y-3">
        {livrosFiltrados.map((livro, index) => {
          const isLocked = !isPremium && index >= LIVROS_GRATIS;
          
          return (
            <Card
              key={livro.id}
              className={`overflow-hidden cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all group bg-card/50 border-white/10 ${isLocked ? 'opacity-75' : ''}`}
              onClick={() => abrirLivro(livro, index)}
            >
              <div className="flex gap-4 p-4">
                {/* Capa do livro - à esquerda */}
                <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  {livro.imagem ? (
                    <img
                      src={livro.imagem}
                      alt={livro.livro || ''}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Book className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Informações do livro - à direita */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {livro.livro}
                    </h3>
                    
                    {livro.autor && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {livro.autor}
                      </p>
                    )}

                    {livro.sobre && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {livro.sobre}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Badge de orientação (sempre visível para contexto) */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getOrientacaoColor(livro.area)}`}>
                      {getOrientacaoLabel(livro.area)}
                    </span>

                    {/* Botão ver detalhes ou Premium */}
                    <span className={`text-xs flex items-center gap-1 ml-auto ${isLocked ? 'text-amber-500 opacity-100' : 'text-primary opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {isLocked ? (
                        <>
                          <Crown className="w-3 h-3" />
                          Premium
                        </>
                      ) : (
                        <>
                          Ver detalhes
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mensagem quando não encontra livros */}
      {livrosFiltrados.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Book className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>
            {searchTerm.trim() 
              ? 'Nenhum livro encontrado para esta busca' 
              : 'Nenhum livro encontrado'}
          </p>
        </div>
      )}
    </div>
  );
}
