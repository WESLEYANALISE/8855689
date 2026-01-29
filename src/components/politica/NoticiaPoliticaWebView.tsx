import React from 'react';
import { ArrowLeft, Share2, ExternalLink, Clock, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { decodeHtmlEntities } from '@/lib/decodeHtmlEntities';
import { toast } from 'sonner';

interface NoticiaPoliticaData {
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

interface NoticiaPoliticaWebViewProps {
  noticia: NoticiaPoliticaData;
  onClose: () => void;
}

export function NoticiaPoliticaWebView({ noticia, onClose }: NoticiaPoliticaWebViewProps) {
  const getEspectroColor = (espectro: string | null) => {
    switch (espectro) {
      case 'esquerda': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'centro-esquerda': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'centro': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'centro-direita': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'direita': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEspectroLabel = (espectro: string | null) => {
    switch (espectro) {
      case 'esquerda': return 'Esquerda';
      case 'centro-esquerda': return 'Centro-Esquerda';
      case 'centro': return 'Centro';
      case 'centro-direita': return 'Centro-Direita';
      case 'direita': return 'Direita';
      default: return 'Geral';
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

  const handleShare = async () => {
    const shareData = {
      title: decodeHtmlEntities(noticia.titulo),
      text: noticia.descricao || '',
      url: noticia.url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(noticia.url || window.location.href);
        toast.success('Link copiado para a área de transferência');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleOpenExternal = () => {
    if (noticia.url) {
      window.open(noticia.url, '_blank');
    }
  };

  const resumo = noticia.resumo_executivo || noticia.resumo_facil || noticia.descricao;
  const imagemCapa = noticia.imagem_url_webp || noticia.imagem_url;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header fixo */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Newspaper className="w-4 h-4" />
          <span>{noticia.fonte}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleOpenExternal}>
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <ScrollArea className="flex-1">
        <div className="pb-8">
          {/* Imagem de capa */}
          {imagemCapa && (
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src={imagemCapa}
                alt={decodeHtmlEntities(noticia.titulo)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          )}

          <div className="px-4 py-4 space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getEspectroColor(noticia.espectro)}>
                {getEspectroLabel(noticia.espectro)}
              </Badge>
              {noticia.data_publicacao && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(noticia.data_publicacao)}</span>
                </div>
              )}
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold leading-tight">
              {decodeHtmlEntities(noticia.titulo)}
            </h1>

            <Separator />

            {/* Resumo */}
            {resumo && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-primary">Resumo</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {decodeHtmlEntities(resumo)}
                </p>
              </div>
            )}

            {/* Pontos Principais */}
            {noticia.pontos_principais && noticia.pontos_principais.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-primary">Pontos Principais</h2>
                <ul className="space-y-2">
                  {noticia.pontos_principais.map((ponto, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">
                        {decodeHtmlEntities(ponto)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Análise / Conteúdo Formatado */}
            {noticia.conteudo_formatado && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-primary">Análise</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line [&>p]:mb-4">
                  {noticia.conteudo_formatado.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{decodeHtmlEntities(paragraph)}</p>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Botão para ver notícia completa */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOpenExternal}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ler notícia completa no {noticia.fonte}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
