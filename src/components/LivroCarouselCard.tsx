import { memo } from "react";
import { Card } from "@/components/ui/card";
import { isImagePreloaded, markImageLoaded } from "@/hooks/useInstantCache";

interface LivroCarouselCardProps {
  titulo: string;
  capaUrl: string | null;
  onClick: () => void;
  numero?: number;
}

export const LivroCarouselCard = memo(({ titulo, capaUrl, onClick, numero }: LivroCarouselCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="relative flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_20%] cursor-pointer overflow-hidden rounded-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 group"
    >
      {/* Aspect ratio container for book cover */}
      <div className="relative aspect-[2/3] w-full">
        {/* Numeração discreta no topo */}
        {numero && (
          <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white/70 text-xs font-condensed font-light">{numero}</span>
          </div>
        )}
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={titulo}
            className="absolute inset-0 w-full h-full object-cover"
            loading={isImagePreloaded(capaUrl) ? "eager" : "lazy"}
            decoding={isImagePreloaded(capaUrl) ? "sync" : "async"}
            onLoad={() => capaUrl && markImageLoaded(capaUrl)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
        )}
        
        {/* Gradient overlay - dark from bottom fading to transparent top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-sm md:text-base font-condensed font-light text-white line-clamp-3 drop-shadow-lg leading-tight tracking-wide">
            {titulo}
          </h4>
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  return (
    prevProps.titulo === nextProps.titulo &&
    prevProps.capaUrl === nextProps.capaUrl &&
    prevProps.numero === nextProps.numero
  );
});
