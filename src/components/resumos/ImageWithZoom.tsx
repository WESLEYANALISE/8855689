import { useState, useEffect } from "react";
import { ImageIcon, Loader2, ZoomIn, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageWithZoomProps {
  imageUrl?: string;
  alt: string;
  onGenerate: () => void;
  isLoading?: boolean;
  placeholderText?: string;
  gradientFrom?: string;
  gradientTo?: string;
  priority?: boolean;
}

export const ImageWithZoom = ({
  imageUrl,
  alt,
  onGenerate,
  isLoading,
  placeholderText = "Gerar ilustração",
  gradientFrom = "from-primary/10",
  gradientTo = "to-primary/5",
  priority = false
}: ImageWithZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden aspect-video bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => !isLoading && onGenerate()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Gerando ilustração...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-primary/60" />
            <span className="text-sm text-muted-foreground">{placeholderText}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative rounded-lg overflow-hidden aspect-video bg-muted group cursor-pointer" 
        onClick={() => imageLoaded && setIsZoomed(true)}
      >
        {/* Skeleton shimmer while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        )}
        
        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm">Erro ao carregar</span>
            </div>
          </div>
        )}
        
        <img 
          src={imageUrl} 
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
          )}
        />
        
        {/* Zoom overlay - only show when loaded */}
        {imageLoaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2 transition-colors">
            <X className="h-6 w-6 text-white" />
          </DialogClose>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={imageUrl} 
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
