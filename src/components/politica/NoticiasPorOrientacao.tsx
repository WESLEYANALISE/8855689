import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Newspaper, Clock, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { NoticiaPoliticaWebView } from './NoticiaPoliticaWebView';
import { decodeHtmlEntities } from '@/lib/decodeHtmlEntities';

interface NoticiasPorOrientacaoProps {
  orientacao: OrientacaoPolitica;
}

interface NoticiaData {
  id: number;
  titulo: string;
  descricao: string | null;
  url: string | null;
  fonte: string;
  espectro: string | null;
  imagem_url: string | null;
  imagem_url_webp: string | null;
  data_publicacao: string | null;
  resumo_executivo: string | null;
  resumo_facil: string | null;
  pontos_principais: string[] | null;
  conteudo_formatado: string | null;
}

const ESPECTROS_POR_ORIENTACAO: Record<string, string[]> = {
  esquerda: ['esquerda', 'centro-esquerda'],
  centro: ['centro', 'centro-esquerda', 'centro-direita'],
  direita: ['direita', 'centro-direita'],
  todos: ['esquerda', 'centro-esquerda', 'centro', 'centro-direita', 'direita'],
};

export function NoticiasPorOrientacao({ orientacao }: NoticiasPorOrientacaoProps) {
  const navigate = useNavigate();
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaData | null>(null);

  const { data: noticias, isLoading } = useQuery({
    queryKey: ['noticias-orientacao', orientacao],
    queryFn: async () => {
      const espectros = ESPECTROS_POR_ORIENTACAO[orientacao || 'todos'];
      
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('*')
        .eq('processado', true)
        .not('imagem_url_webp', 'is', null)
        .neq('fonte', 'Jovem Pan')
        .in('espectro', espectros)
        .order('data_publicacao', { ascending: false })
        .limit(7);

      if (error) throw error;
      return data as NoticiaData[];
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-[280px] h-[200px] flex-shrink-0" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  }

  const getEspectroColor = (espectro: string | null) => {
    switch (espectro) {
      case 'esquerda': return 'bg-red-500/20 text-red-400';
      case 'centro-esquerda': return 'bg-orange-500/20 text-orange-400';
      case 'centro': return 'bg-yellow-500/20 text-yellow-400';
      case 'centro-direita': return 'bg-sky-500/20 text-sky-400';
      case 'direita': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return '';
    }
  };

  const getOrientacaoLabel = () => {
    switch (orientacao) {
      case 'esquerda': return 'da Esquerda';
      case 'centro': return 'do Centro';
      case 'direita': return 'da Direita';
      default: return '';
    }
  };

  // Se tem notícia aberta, mostrar o WebView
  if (noticiaAberta) {
    return (
      <NoticiaPoliticaWebView
        noticia={noticiaAberta}
        onClose={() => setNoticiaAberta(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold">
            Notícias Políticas {orientacao !== 'todos' ? getOrientacaoLabel() : ''}
          </h2>
        </div>
        
        <button
          onClick={() => navigate('/politica/noticias')}
          className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
        >
          Ver mais
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {noticias && noticias.length > 0 ? (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-4">
            {noticias.map((noticia) => (
              <Card
                key={noticia.id}
                className="w-[280px] flex-shrink-0 overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setNoticiaAberta(noticia)}
              >
                {noticia.imagem_url_webp && (
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={noticia.imagem_url_webp}
                      alt={decodeHtmlEntities(noticia.titulo)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getEspectroColor(noticia.espectro)}`}>
                        {noticia.fonte}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 whitespace-normal">
                    {decodeHtmlEntities(noticia.titulo)}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(noticia.data_publicacao)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma notícia encontrada para esta orientação</p>
        </div>
      )}
    </div>
  );
}
