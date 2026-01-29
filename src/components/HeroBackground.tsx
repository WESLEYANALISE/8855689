interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt?: string;
  height?: string;
  gradientOpacity?: {
    top: number;
    middle: number;
    bottom: number;
  };
}

const HeroBackground = ({ 
  imageSrc, 
  imageAlt = '',
  height = '60vh',
  gradientOpacity = { top: 0.15, middle: 0.4, bottom: 1 }
}: HeroBackgroundProps) => {
  return (
    <div 
      className="absolute top-0 left-0 right-0 z-0 pointer-events-none overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Background Image - renders immediately without waiting for onload */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            hsl(var(--background) / ${gradientOpacity.top}) 0%,
            hsl(var(--background) / ${gradientOpacity.middle}) 50%,
            hsl(var(--background)) 100%
          )`
        }}
      />
    </div>
  );
};

export default HeroBackground;
