import { UniversalImage } from '@/components/ui/universal-image';
import type { BlurCategory } from '@/lib/blurPlaceholders';

interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt?: string;
  height?: string;
  blurCategory?: BlurCategory;
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
  blurCategory = 'hero',
  gradientOpacity = { top: 0.15, middle: 0.4, bottom: 1 }
}: HeroBackgroundProps) => {
  return (
    <div 
      className="absolute top-0 left-0 right-0 z-0 pointer-events-none overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Background Image com UniversalImage para blur placeholder */}
      <UniversalImage
        src={imageSrc}
        alt={imageAlt}
        priority={true}
        blurCategory={blurCategory}
        disableBlur={false}
        containerClassName="w-full h-full"
        className="object-cover"
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
