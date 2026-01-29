import React, { useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Artigo {
  id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  orientacao: string;
  termo_wikipedia: string | null;
  imagem_capa?: string | null;
}

interface PoliticaArtigoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo: Artigo | null;
}

const getOrientacaoConfig = (orientacao: string) => {
  switch (orientacao) {
    case 'esquerda':
      return { label: 'Esquerda', color: 'from-red-600 to-red-800', badge: 'bg-red-500/20 text-red-300' };
    case 'centro':
      return { label: 'Centro', color: 'from-yellow-600 to-yellow-800', badge: 'bg-yellow-500/20 text-yellow-300' };
    case 'direita':
      return { label: 'Direita', color: 'from-blue-600 to-blue-800', badge: 'bg-blue-500/20 text-blue-300' };
    default:
      return { label: orientacao, color: 'from-neutral-600 to-neutral-800', badge: 'bg-neutral-500/20 text-neutral-300' };
  }
};

export function PoliticaArtigoModal({ open, onOpenChange, artigo }: PoliticaArtigoModalProps) {
  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !artigo) return null;

  const config = getOrientacaoConfig(artigo.orientacao);

  // Formatar conteúdo com quebras de linha duplas
  const conteudoFormatado = artigo.conteudo
    ?.replace(/\n/g, '\n\n')
    .replace(/\n\n\n\n/g, '\n\n')
    || '';

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{artigo.titulo}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
            {config.label}
          </span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        {/* Capa do artigo */}
        <div className={`relative w-full aspect-[21/9] bg-gradient-to-br ${config.color}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white/20" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Conteúdo */}
        <div className="px-4 pb-20 -mt-8 relative">
          {/* Título grande */}
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {artigo.titulo}
          </h1>

          {/* Badge de orientação */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-xs px-3 py-1 rounded-full ${config.badge}`}>
              {config.label}
            </span>
          </div>

          {/* Conteúdo do artigo */}
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:mb-6 prose-li:text-neutral-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {conteudoFormatado}
            </ReactMarkdown>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
