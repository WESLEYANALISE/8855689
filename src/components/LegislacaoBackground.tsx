import { ReactNode, useState, useEffect, useRef } from 'react';

interface LegislacaoBackgroundProps {
  children: ReactNode;
  imageUrl: string | null;
  opacity: number;
  className?: string;
}

export function LegislacaoBackground({ 
  children, 
  imageUrl, 
  opacity,
  className = ""
}: LegislacaoBackgroundProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Preload image for instant display
  useEffect(() => {
    // Reset state when URL changes
    if (imageUrl !== prevUrlRef.current) {
      setIsImageLoaded(false);
      prevUrlRef.current = imageUrl;
    }

    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setLoadedUrl(imageUrl);
        setIsImageLoaded(true);
        console.log('[LegislacaoBackground] Image loaded:', imageUrl.substring(0, 80));
      };
      img.onerror = () => {
        console.error('[LegislacaoBackground] Failed to load image:', imageUrl.substring(0, 80));
        setIsImageLoaded(false);
        setLoadedUrl(null);
      };
      img.src = imageUrl;
    } else {
      setIsImageLoaded(false);
      setLoadedUrl(null);
    }
  }, [imageUrl]);

  console.log('[LegislacaoBackground] Rendering - imageUrl:', imageUrl?.substring(0, 50), 'loaded:', isImageLoaded);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image with gradient overlay */}
      {loadedUrl && isImageLoaded && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{ 
              backgroundImage: `url(${loadedUrl})`,
              opacity: opacity
            }}
          />
          {/* Gradient overlay: transparent on top, fades to background at bottom */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background"
          />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
