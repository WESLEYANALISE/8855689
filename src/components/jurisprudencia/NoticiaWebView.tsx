import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Share2, Loader2, Scale, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NoticiaData {
  id: string;
  titulo: string;
  descricao?: string;
  link: string;
  portal: string;
  dataHora: string;
  categoria?: string;
  imagem?: string;
}

interface NoticiaWebViewProps {
  noticia: NoticiaData;
  onClose: () => void;
}

export default function NoticiaWebView({ noticia, onClose }: NoticiaWebViewProps) {
  const [resumo, setResumo] = useState<string | null>(null);
  const [analise, setAnalise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gerarResumoEAnalise();
  }, [noticia]);

  const gerarResumoEAnalise = async () => {
    setLoading(true);
    try {
      // Por enquanto vamos usar a descrição como resumo
      // Futuramente pode-se implementar geração com IA
      setResumo(noticia.descricao || 'Resumo não disponível para esta notícia.');
      setAnalise('A análise jurídica desta notícia será gerada automaticamente em breve. A notícia aborda temas relevantes da jurisprudência brasileira e pode ter impacto significativo na interpretação do direito.');
      
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      setResumo(noticia.descricao || 'Não foi possível carregar o resumo.');
      setAnalise('Não foi possível gerar a análise.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dataStr;
    }
  };

  const compartilhar = async () => {
    try {
      await navigator.share({
        title: noticia.titulo,
        text: noticia.descricao,
        url: noticia.link
      });
    } catch {
      await navigator.clipboard.writeText(noticia.link);
      toast.success('Link copiado!');
    }
  };

  const abrirNoNavegador = () => {
    window.open(noticia.link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{noticia.portal}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={compartilhar}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={abrirNoNavegador}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <ScrollArea className="flex-1">
        <div className="p-4 pb-20">
          {/* Imagem de capa */}
          {noticia.imagem && (
            <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-muted">
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

          {/* Título */}
          <h1 className="text-xl font-bold text-foreground leading-tight mb-3">
            {noticia.titulo}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {noticia.categoria || 'Jurisprudência'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatarData(noticia.dataHora)}
            </span>
          </div>

          <Separator className="my-4" />

          {/* Resumo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando resumo...</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resumo}
              </p>
            )}
          </div>

          {/* Análise */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-foreground">Análise Jurídica</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando análise...</span>
              </div>
            ) : (
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analise}
                </p>
              </div>
            )}
          </div>

          {/* Fonte */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Fonte original:</p>
            <p className="text-sm font-medium text-foreground">{noticia.portal}</p>
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-primary"
              onClick={abrirNoNavegador}
            >
              Ler notícia completa
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
