import { Lock, Crown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { UniversalImage } from '@/components/ui/universal-image';
import { getOptimizedImageUrl } from '@/lib/imageOptimizer';

interface LockedContentCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onClick: () => void;
  className?: string;
  showBadge?: boolean;
}

export const LockedContentCard = ({
  title,
  subtitle,
  imageUrl,
  onClick,
  className,
  showBadge = true
}: LockedContentCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full group overflow-hidden rounded-xl border border-border/30 bg-card/50",
        "transition-all duration-200 hover:border-amber-500/40",
        className
      )}
    >
      {/* Imagem com overlay escuro */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover opacity-40 blur-[1px]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
        )}
        
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        
        {/* Ícone de cadeado centralizado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center backdrop-blur-sm">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        
        {/* Badge Premium */}
        {showBadge && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold shadow-lg">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}
      </div>
      
      {/* Informações */}
      <div className="p-3 text-left">
        <h4 className="font-medium text-sm text-muted-foreground line-clamp-2">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
};

// Versão em lista horizontal (para bibliotecas) - MESMO layout do LivroCard
interface LockedContentListItemProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  sobre?: string;
  onClick: () => void;
  className?: string;
  numero?: number;
  ano?: number;
}

export const LockedContentListItem = ({
  title,
  subtitle,
  imageUrl,
  sobre,
  onClick,
  className,
  numero,
  ano = 2026
}: LockedContentListItemProps) => {
  // Otimiza URL da capa para tamanho de exibição (96x128)
  const optimizedCapaUrl = imageUrl ? getOptimizedImageUrl(imageUrl, 'livro-card') : null;
  
  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border border-accent/20 hover:border-accent/40 hover:scale-[1.02] group animate-fade-in",
        className
      )}
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        {/* Capa - mesmo tamanho do LivroCard */}
        <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg group-hover:shadow-accent/50 transition-shadow">
          {optimizedCapaUrl ? (
            <UniversalImage
              src={optimizedCapaUrl}
              alt={title}
              blurCategory="library"
              showSkeleton={true}
              skeletonVariant="shimmer"
              className="group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-accent/50" />
            </div>
          )}
          
          {/* Overlay escuro para o cadeado */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Cadeado grande e centralizado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {/* Badge de numeração - estilo resumos (canto inferior esquerdo) */}
          {numero !== undefined && (
            <div className="absolute bottom-0 left-0 bg-primary/90 text-white text-xs font-bold px-1.5 py-0.5 rounded-tr-md">
              {String(numero).padStart(2, '0')}
            </div>
          )}
          {/* Badge de ano - canto inferior direito com fundo preto */}
          {ano && (
            <div className="absolute bottom-0 right-0 bg-black/80 text-white/90 text-[10px] font-medium px-1.5 py-0.5 rounded-tl-md">
              {ano}
            </div>
          )}
        </div>
        
        {/* Informações - mesmo layout do LivroCard */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
            )}
            {sobre && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sobre}
              </p>
            )}
          </div>
          {/* Premium no lugar de "Ver detalhes" */}
          <span className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-2">
            <Crown className="w-3 h-3" />
            Premium
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LockedContentCard;
