import { useState, useEffect } from 'react';
import heroConstituicao from "@/assets/hero-constituicao.webp";

interface JurisprudenciaBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const JurisprudenciaBackground = ({ children, className = "" }: JurisprudenciaBackgroundProps) => {
  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = heroConstituicao;
    return img.complete;
  });

  useEffect(() => {
    if (imageLoaded) return;
    
    const img = new Image();
    img.src = heroConstituicao;
    
    if (img.complete) {
      setImageLoaded(true);
    } else {
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden ${className}`}>
      {/* Background com Constituição/Planalto */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroConstituicao}
          alt="Constituição Federal - Planalto"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-25' : 'opacity-0'
          }`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.3) 0%,
              hsl(var(--background) / 0.5) 30%,
              hsl(var(--background) / 0.8) 60%,
              hsl(var(--background)) 100%
            )`
          }}
        />
      </div>
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
