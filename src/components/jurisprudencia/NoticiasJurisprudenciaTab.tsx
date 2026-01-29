import { useState, useEffect } from 'react';
import { ExternalLink, Newspaper, RefreshCw, Loader2, Scale, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import NoticiaWebView from './NoticiaWebView';

interface NoticiaJurisprudencia {
  id: string;
  titulo: string;
  descricao?: string;
  link: string;
  portal: string;
  dataHora: string;
  categoria?: string;
  imagem?: string;
}

export default function NoticiasJurisprudenciaTab() {
  const [noticias, setNoticias] = useState<NoticiaJurisprudencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaJurisprudencia | null>(null);

  const buscarNoticias = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar notícias de jurisprudência do cache (categoria Direito)
      const { data, error: fetchError } = await supabase
        .from('noticias_juridicas_cache')
        .select('*')
        .eq('categoria', 'Direito')
        .gte('data_publicacao', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('data_publicacao', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // Filtrar apenas notícias relacionadas a jurisprudência/decisões/súmulas
        const palavrasChave = ['stf', 'stj', 'súmula', 'sumula', 'decisão', 'julgamento', 'tribunal', 'ministro', 'recurso', 'acórdão', 'tese', 'precedente', 'repercussão'];
        
        const noticiasFiltradas = data.filter(n => {
          const textoCompleto = `${n.titulo || ''} ${n.descricao || ''}`.toLowerCase();
          return palavrasChave.some(palavra => textoCompleto.includes(palavra));
        });

        const noticiasFormatadas: NoticiaJurisprudencia[] = noticiasFiltradas.map(n => ({
          id: n.id,
          titulo: n.titulo || '',
          descricao: n.descricao || undefined,
          link: n.link || '',
          portal: n.fonte || 'Portal Jurídico',
          dataHora: n.data_publicacao || '',
          categoria: n.categoria || undefined,
          imagem: n.imagem_webp || n.imagem || undefined,
        }));

        setNoticias(noticiasFormatadas);
      } else {
        setNoticias([]);
      }
    } catch (err) {
      console.error('Erro ao buscar notícias de jurisprudência:', err);
      setError('Não foi possível carregar as notícias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarNoticias();
  }, []);

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dataStr;
    }
  };

  const getTribunalBadge = (titulo: string, portal: string) => {
    const textoLower = `${titulo} ${portal}`.toLowerCase();
    if (textoLower.includes('stf') || textoLower.includes('supremo')) {
      return { label: 'STF', className: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    if (textoLower.includes('stj') || textoLower.includes('superior tribunal')) {
      return { label: 'STJ', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
    if (textoLower.includes('tst') || textoLower.includes('trabalho')) {
      return { label: 'TST', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    if (textoLower.includes('tse') || textoLower.includes('eleitoral')) {
      return { label: 'TSE', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
    return { label: 'Direito', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={buscarNoticias} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Scale className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Nenhuma notícia de jurisprudência encontrada</p>
        <p className="text-xs text-muted-foreground mb-4">Volte mais tarde para ver as últimas atualizações</p>
        <Button onClick={buscarNoticias} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>
    );
  }

  // Se houver uma notícia aberta, mostrar webview
  if (noticiaAberta) {
    return (
      <NoticiaWebView 
        noticia={noticiaAberta} 
        onClose={() => setNoticiaAberta(null)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Notícias de Jurisprudência</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={buscarNoticias}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Lista de notícias */}
      <div className="space-y-3">
        {noticias.map((noticia, idx) => {
          const tribunal = getTribunalBadge(noticia.titulo, noticia.portal);
          return (
            <Card 
              key={noticia.id}
              className="bg-card/80 border-border/50 hover:bg-accent/10 transition-all cursor-pointer overflow-hidden"
              onClick={() => setNoticiaAberta(noticia)}
              style={{ 
                animationDelay: `${idx * 50}ms`,
                animation: 'fadeInUp 0.4s ease-out forwards'
              }}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Imagem da notícia */}
                  {noticia.imagem && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img 
                        src={noticia.imagem} 
                        alt={noticia.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Badge do tribunal */}
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 mb-1.5 ${tribunal.className}`}>
                      {tribunal.label}
                    </Badge>
                    
                    {/* Título */}
                    <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                      {noticia.titulo}
                    </h4>
                    
                    {/* Descrição */}
                    {noticia.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {noticia.descricao}
                      </p>
                    )}
                    
                    {/* Rodapé */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium">{noticia.portal}</span>
                      <span>•</span>
                      <span>{formatarData(noticia.dataHora)}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
