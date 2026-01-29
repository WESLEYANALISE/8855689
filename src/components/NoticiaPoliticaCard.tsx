import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UniversalImage } from '@/components/ui/universal-image';

// Função para limpar caracteres corrompidos de encoding
const cleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/�/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
};

interface NoticiaPoliticaCardProps {
  titulo: string;
  fonte: string;
  imagemUrl: string | null;
  imagemUrlWebp?: string | null;
  dataPublicacao: string | null;
  url: string;
  espectro?: string | null;
  onClick?: () => void;
}

const FONTE_COLORS: Record<string, string> = {
  'G1': 'bg-red-600',
  'Estadão': 'bg-slate-700',
  'CNN Brasil': 'bg-red-700',
  'R7': 'bg-green-600',
  'Poder360': 'bg-blue-600',
  'default': 'bg-amber-600'
};

export const NoticiaPoliticaCard: React.FC<NoticiaPoliticaCardProps> = React.memo(({
  titulo,
  fonte,
  imagemUrl,
  imagemUrlWebp,
  dataPublicacao,
  onClick
}) => {
  const badgeColor = FONTE_COLORS[fonte] || FONTE_COLORS['default'];
  
  // Priorizar imagem WebP otimizada
  const imagemFinal = imagemUrlWebp || imagemUrl;
  
  const formattedDate = dataPublicacao 
    ? format(new Date(dataPublicacao), "dd/MM HH:mm", { locale: ptBR })
    : null;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[240px] cursor-pointer group"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint'
      }}
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
        {/* Imagem no topo - proporção 16:9 para paisagem */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          {imagemFinal ? (
            <UniversalImage
              src={imagemFinal}
              alt={titulo}
              priority
              blurCategory="news"
              containerClassName="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-red-500/20">
              <span className="text-3xl">📰</span>
            </div>
          )}
          
          {/* Badge da fonte sobreposto na imagem */}
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium text-white ${badgeColor} shadow-md z-10`}>
            {fonte.length > 12 ? fonte.slice(0, 12) + '...' : fonte}
          </span>
        </div>

        {/* Conteúdo abaixo */}
        <div className="p-2.5 flex flex-col gap-1.5">
          {/* Título */}
          <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight">
            {cleanText(titulo)}
          </h3>
          
          {/* Data */}
          {formattedDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-2.5 h-2.5" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

NoticiaPoliticaCard.displayName = 'NoticiaPoliticaCard';
