import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Instagram, Youtube, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';

interface PoliticaSeguirProps {
  orientacao: OrientacaoPolitica;
}

const tipoConfig = {
  perfil_instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  canal_youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-500' },
  portal: { icon: Globe, label: 'Portais', color: 'text-blue-500' },
};

export function PoliticaSeguir({ orientacao }: PoliticaSeguirProps) {
  const { data: conteudo, isLoading } = useQuery({
    queryKey: ['politica-seguir', orientacao],
    queryFn: async () => {
      let query = supabase
        .from('politica_conteudo_orientacao')
        .select('*')
        .in('tipo', ['perfil_instagram', 'canal_youtube', 'portal'])
        .order('ordem', { ascending: true });

      if (orientacao && orientacao !== 'todos') {
        query = query.eq('orientacao', orientacao);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const instagram = conteudo?.filter(c => c.tipo === 'perfil_instagram') || [];
  const youtube = conteudo?.filter(c => c.tipo === 'canal_youtube') || [];
  const portais = conteudo?.filter(c => c.tipo === 'portal') || [];

  const getOrientacaoColor = (o: string) => {
    switch (o) {
      case 'esquerda': return 'bg-red-500/20 text-red-400';
      case 'centro': return 'bg-yellow-500/20 text-yellow-400';
      case 'direita': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderCards = (items: typeof conteudo, tipo: keyof typeof tipoConfig) => {
    const config = tipoConfig[tipo];
    const Icon = config.icon;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.map((item) => (
          <Card 
            key={item.id} 
            className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={() => item.url && window.open(item.url, '_blank')}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full bg-background ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{item.titulo}</h3>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {item.descricao && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.descricao}</p>
                )}
                {orientacao === 'todos' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${getOrientacaoColor(item.orientacao)}`}>
                    {item.orientacao === 'esquerda' ? 'Esquerda' : item.orientacao === 'direita' ? 'Direita' : 'Centro'}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="instagram" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="instagram" className="flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          <span className="hidden sm:inline">Instagram</span>
        </TabsTrigger>
        <TabsTrigger value="youtube" className="flex items-center gap-2">
          <Youtube className="w-4 h-4" />
          <span className="hidden sm:inline">YouTube</span>
        </TabsTrigger>
        <TabsTrigger value="portais" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">Portais</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="instagram">
        {instagram.length > 0 ? (
          renderCards(instagram, 'perfil_instagram')
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Instagram className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum perfil encontrado</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="youtube">
        {youtube.length > 0 ? (
          renderCards(youtube, 'canal_youtube')
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Youtube className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum canal encontrado</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="portais">
        {portais.length > 0 ? (
          renderCards(portais, 'portal')
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum portal encontrado</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
