import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { isImagePreloaded, markImageLoaded } from "@/hooks/useInstantCache";

interface LivroCardProps {
  titulo: string;
  autor?: string;
  subtitulo?: string;
  capaUrl?: string | null;
  sobre?: string | null;
  onClick: () => void;
  numero?: number; // Número de sequência do livro
  ano?: number; // Ano de atualização
}

export const LivroCard = ({ titulo, autor, subtitulo, capaUrl, sobre, onClick, numero, ano = 2026 }: LivroCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border border-accent/20 hover:border-accent/40 hover:scale-[1.02] group animate-fade-in"
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg group-hover:shadow-accent/50 transition-shadow">
          {capaUrl ? (
            <img
              src={capaUrl}
              alt={titulo}
              loading={isImagePreloaded(capaUrl) ? "eager" : "lazy"}
              decoding={isImagePreloaded(capaUrl) ? "sync" : "async"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onLoad={() => capaUrl && markImageLoaded(capaUrl)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-accent/50" />
            </div>
          )}
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
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {titulo}
            </h3>
            {autor && (
              <p className="text-xs text-muted-foreground mb-2">{autor}</p>
            )}
            {subtitulo && (
              <p className="text-xs text-muted-foreground mb-2">{subtitulo}</p>
            )}
            {sobre && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sobre}
              </p>
            )}
          </div>
          <button
            className="text-xs text-accent font-medium hover:underline text-left mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Ver detalhes →
          </button>
        </div>
      </div>
    </Card>
  );
};
