import { Play, MessageSquare } from 'lucide-react';

interface DocumentarioThumbnailProps {
  thumbnail: string;
  videoId: string;
  titulo: string;
  duracao?: string;
  totalComentarios?: number;
}

export function DocumentarioThumbnail({
  thumbnail,
  videoId,
  titulo,
  duracao,
  totalComentarios = 0,
}: DocumentarioThumbnailProps) {
  return (
    <div className="relative flex-shrink-0 w-32 h-20 md:w-40 md:h-24 rounded-lg overflow-hidden bg-secondary group">
      {/* Thumbnail */}
      <img 
        src={thumbnail} 
        alt={titulo}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }}
      />
      
      {/* Play overlay - sempre visível com opacidade menor, aumenta no hover */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center transition-all">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      
      {/* Duration badge */}
      {duracao && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {duracao}
        </div>
      )}
      
      {/* Comments counter badge */}
      {totalComentarios > 0 && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-primary/90 text-white text-xs font-medium flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {totalComentarios}
        </div>
      )}
    </div>
  );
}
