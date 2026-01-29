import React, { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';
import { isImageCached, markImageLoaded } from '@/hooks/useImagePreload';

// Imagens locais para PRF e PF
import prfCapa from '@/assets/prf-capa.jpg';
import pfCapa from '@/assets/pf-004.jpg';

interface Carreira {
  id: string;
  nome: string;
  descricao: string;
  capaLocal?: string;
}

const CARREIRAS: Carreira[] = [
  { id: 'pf', nome: 'Polícia Federal', descricao: 'Agente e Delegado PF', capaLocal: prfCapa },
  { id: 'advogado', nome: 'Advogado/OAB', descricao: 'OAB e Advocacia' },
  { id: 'prf', nome: 'PRF', descricao: 'Polícia Rodoviária Federal', capaLocal: pfCapa },
  { id: 'juiz', nome: 'Juiz', descricao: 'Magistratura' },
  { id: 'delegado', nome: 'Delegado', descricao: 'Polícia Civil' },
  { id: 'promotor', nome: 'Promotor', descricao: 'Ministério Público' },
];

interface CarreiraCapaCache {
  [key: string]: string;
}

// Usar função do hook centralizado
const checkImageCache = isImageCached;

const CarreiraCard = memo(({ 
  carreira, 
  capaUrl, 
  isGenerating,
  onClick 
}: { 
  carreira: Carreira;
  capaUrl?: string;
  isGenerating: boolean;
  onClick: () => void;
}) => {
  const imagemFinal = carreira.capaLocal || capaUrl;
  const [imageLoaded, setImageLoaded] = useState(() => checkImageCache(imagemFinal || ''));

  // Verificar cache quando a imagem muda
  useEffect(() => {
    if (imagemFinal) {
      const isCached = checkImageCache(imagemFinal);
      if (isCached) {
        setImageLoaded(true);
      }
    }
  }, [imagemFinal]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Imagens locais (PRF/PF) - usar loading eager e alta prioridade
  const isLocalImage = !!carreira.capaLocal;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] group"
    >
      {/* Capa do livro */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:scale-[1.02] transition-transform duration-200">
        {imagemFinal ? (
          <>
            {/* Placeholder enquanto carrega */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              </div>
            )}
            <img
              src={imagemFinal}
              alt={carreira.nome}
              className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading={isLocalImage ? "eager" : "lazy"}
              fetchPriority={isLocalImage ? "high" : "auto"}
              decoding={isLocalImage ? "sync" : "async"}
              onLoad={handleImageLoad}
            />
          </>
        ) : isGenerating ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center">
            <span className="text-3xl">⚖️</span>
          </div>
        )}
        
        {/* Overlay com nome */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
          <h4 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
            {carreira.nome}
          </h4>
        </div>
      </div>
    </button>
  );
});

CarreiraCard.displayName = 'CarreiraCard';

interface CarreirasJuridicasCarouselProps {
  disabled?: boolean;
}

export const CarreirasJuridicasCarousel = ({ disabled = false }: CarreirasJuridicasCarouselProps) => {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<CarreiraCapaCache>({});
  const [gerando, setGerando] = useState<Set<string>>(new Set());
  
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: !disabled,
    duration: 20,
    skipSnaps: true
  });

  // Buscar capas do banco
  useEffect(() => {
    const buscarCapas = async () => {
      const { data } = await supabase
        .from('carreiras_capas' as any)
        .select('*');
      
      if (data) {
        const cache: CarreiraCapaCache = {};
        (data as any[]).forEach((item: any) => {
          cache[item.carreira] = item.url_capa;
        });
        setCapas(cache);
      }
    };
    
    buscarCapas();
  }, []);

  // Gerar capas faltantes automaticamente
  useEffect(() => {
    const gerarCapasFaltantes = async () => {
      for (const carreira of CARREIRAS) {
        if (carreira.capaLocal) continue;
        if (capas[carreira.id] || gerando.has(carreira.id)) continue;
        
        setGerando(prev => new Set([...prev, carreira.id]));
        
        try {
          const { data } = await supabase.functions.invoke('gerar-capa-carreira', {
            body: { carreira: carreira.id, nome: carreira.nome }
          });
          
          if (data?.url_capa) {
            setCapas(prev => ({ ...prev, [carreira.id]: data.url_capa }));
          }
        } catch (error) {
          console.error(`Erro ao gerar capa para ${carreira.nome}:`, error);
        } finally {
          setGerando(prev => {
            const next = new Set(prev);
            next.delete(carreira.id);
            return next;
          });
        }
      }
    };
    
    const timer = setTimeout(gerarCapasFaltantes, 1000);
    return () => clearTimeout(timer);
  }, [capas, gerando]);

  const handleCarreiraClick = (carreiraId: string) => {
    if (carreiraId === 'advogado') {
      navigate('/carreira/advogado');
    } else {
      navigate(`/carreira/${carreiraId}`);
    }
  };

  return (
    <div className="overflow-hidden -mx-1 px-1" ref={emblaRef}>
      <div className="flex gap-3">
        {CARREIRAS.map((carreira) => (
          <CarreiraCard
            key={carreira.id}
            carreira={carreira}
            capaUrl={capas[carreira.id]}
            isGenerating={gerando.has(carreira.id)}
            onClick={() => handleCarreiraClick(carreira.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CarreirasJuridicasCarousel;
