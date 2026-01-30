import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UniversalImage } from "@/components/ui/universal-image";

interface NoticiaCarouselCardProps {
  noticia: {
    id: string | number;
    titulo: string;
    imagem?: string;
    imagem_webp?: string;
    imagemCached?: string;
    fonte?: string;
    data?: string;
    link?: string;
    categoria_tipo?: string;
    analise?: string;
  };
  priority?: boolean; // Se true, carrega com prioridade alta
}

const formatarDataHora = (dataString: string) => {
  try {
    if (!dataString) return '';
    if (dataString.includes('T')) {
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return '';
      // NÃO adiciona +3h - o navegador já converte UTC para horário local automaticamente
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (dataString.includes('/') && dataString.includes(':')) return dataString;
    if (dataString.includes('-')) {
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return dataString;
  } catch {
    return '';
  }
};

const NoticiaCarouselCard = memo(({ noticia, priority = false }: NoticiaCarouselCardProps) => {
  const navigate = useNavigate();
  
  // Prioriza: Cache em memória > WebP otimizado > Original
  const primaryUrl = noticia.imagemCached || noticia.imagem_webp || noticia.imagem;
  const fallbackUrl = noticia.imagem_webp || noticia.imagem;
  
  // Estado para controlar qual URL usar (fallback quando blob expira)
  const [currentImageUrl, setCurrentImageUrl] = useState(primaryUrl);
  const [imageError, setImageError] = useState(false);
  // Estado para controlar loading da imagem (skeleton shimmer)
  const [isLoading, setIsLoading] = useState(true);
  
  // Atualiza URL quando props mudam (ex: após visibilitychange)
  useEffect(() => {
    const newUrl = noticia.imagemCached || noticia.imagem_webp || noticia.imagem;
    if (newUrl !== currentImageUrl) {
      setCurrentImageUrl(newUrl);
      setImageError(false);
      setIsLoading(true); // Reset loading ao trocar imagem
    }
  }, [noticia.imagemCached, noticia.imagem_webp, noticia.imagem]);
  
  // Quando blob URL falha, usa URL original
  const handleImageError = () => {
    if (!imageError && fallbackUrl && currentImageUrl !== fallbackUrl) {
      setCurrentImageUrl(fallbackUrl);
      setImageError(true);
    }
  };

  const handleClick = () => {
    const categoria = noticia.categoria_tipo || 'Geral';
    const isPolitica = categoria.toLowerCase().includes('polític') || 
                       categoria.toLowerCase().includes('politic');
    
    const noticiaData = {
      id: noticia.id,
      categoria: categoria,
      portal: noticia.fonte || '',
      titulo: noticia.titulo,
      capa: noticia.imagem || '',
      link: noticia.link,
      dataHora: noticia.data,
      analise_ia: noticia.analise
    };
    
    if (isPolitica) {
      navigate(`/politica/noticias/${noticia.id}`, { state: { noticia: noticiaData } });
    } else {
      navigate(`/noticias-juridicas/${noticia.id}`, { state: { noticia: noticiaData } });
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-[240px] cursor-pointer group"
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
        {/* Imagem - proporção 16:9 com UniversalImage */}
        <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
          {currentImageUrl ? (
            <UniversalImage
              src={currentImageUrl}
              alt={noticia.titulo}
              priority={priority}
              blurCategory="news"
              containerClassName="w-full h-full"
              onImageError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 via-background to-background">
              <span className="text-3xl">📰</span>
            </div>
          )}
          
          {/* Badge da categoria no canto inferior esquerdo */}
          {noticia.categoria_tipo && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-red-600 shadow-md z-10">
              {noticia.categoria_tipo === 'Concurso Público' ? 'Concurso' : noticia.categoria_tipo}
            </span>
          )}
        </div>

        {/* Conteúdo abaixo - altura fixa para consistência */}
        <div className="p-2.5 flex flex-col gap-1.5 flex-1 min-h-[60px]">
          <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
            {noticia.titulo}
          </h3>
          
          {noticia.data && (
            <p className="text-[10px] text-muted-foreground mt-auto">
              {formatarDataHora(noticia.data)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

NoticiaCarouselCard.displayName = 'NoticiaCarouselCard';

export default NoticiaCarouselCard;
