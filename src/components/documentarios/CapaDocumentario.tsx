import { memo } from 'react';
import { Film } from 'lucide-react';
import { useCapaDocumentario } from '@/hooks/useCapaDocumentario';
import { cn } from '@/lib/utils';
import { UniversalImage } from '@/components/ui/universal-image';

interface CapaDocumentarioProps {
  id: string;
  capaWebp?: string | null;
  thumbnail?: string | null;
  titulo: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'poster';
  priority?: boolean;
}

const aspectClasses = {
  video: 'aspect-video',
  square: 'aspect-square',
  poster: 'aspect-[2/3]'
};

const CapaDocumentario = memo(({
  id,
  capaWebp,
  thumbnail,
  titulo,
  className,
  aspectRatio = 'video',
  priority = false
}: CapaDocumentarioProps) => {
  const directUrl = capaWebp || thumbnail;
  const { capaUrl } = useCapaDocumentario(id, capaWebp, thumbnail);
  
  const finalUrl = capaUrl || directUrl;
  
  // Fallback quando não há imagem
  const fallbackNode = (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Film className="h-8 w-8 text-muted-foreground" />
    </div>
  );

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden",
        aspectClasses[aspectRatio],
        className
      )}
    >
      <UniversalImage
        src={finalUrl}
        alt={titulo}
        priority={priority}
        blurCategory="documentary"
        containerClassName="w-full h-full"
        fallback={fallbackNode}
      />
    </div>
  );
});

CapaDocumentario.displayName = 'CapaDocumentario';

export default CapaDocumentario;
