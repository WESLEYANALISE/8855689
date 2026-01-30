import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UniversalImage } from '@/components/ui/universal-image';

// Imagens locais para PRF e PF
import prfCapa from '@/assets/prf-capa.jpg';
import pfCapa from '@/assets/pf-004-opt.webp';

interface Carreira {
  id: string;
  nome: string;
  descricao: string;
  capaLocal?: string;
}

const CARREIRAS: Carreira[] = [
  { id: 'advogado', nome: 'Advogado/OAB', descricao: 'OAB e Advocacia' },
  { id: 'juiz', nome: 'Juiz', descricao: 'Magistratura' },
  { id: 'delegado', nome: 'Delegado', descricao: 'Polícia Civil' },
  { id: 'promotor', nome: 'Promotor', descricao: 'Ministério Público' },
  { id: 'prf', nome: 'PRF', descricao: 'Polícia Rodoviária Federal', capaLocal: prfCapa },
  { id: 'pf', nome: 'Polícia Federal', descricao: 'Agente e Delegado PF', capaLocal: pfCapa },
];

interface CarreiraCapaCache {
  [key: string]: string;
}

const CarreiraCard = memo(({ 
  carreira, 
  capaUrl, 
  isGenerating,
  onClick,
  priority = false
}: { 
  carreira: Carreira;
  capaUrl?: string;
  isGenerating: boolean;
  onClick: () => void;
  priority?: boolean;
}) => {
  const imagemFinal = carreira.capaLocal || capaUrl;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[140px] cursor-pointer group"
    >
      <div 
        className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-border/30 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
        style={{
          boxShadow: '4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.05)'
        }}
      >
        {imagemFinal ? (
          <UniversalImage
            src={imagemFinal}
            alt={carreira.nome}
            priority={priority}
            blurCategory="career"
            containerClassName="w-full h-full"
          />
        ) : isGenerating ? (
          <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-950 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-white/70 text-xs">Gerando...</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center">
            <span className="text-4xl">⚖️</span>
          </div>
        )}
        
        {/* Overlay com título */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg">
            {carreira.nome}
          </h3>
          <p className="text-white/70 text-[10px] mt-0.5">
            {carreira.descricao}
          </p>
        </div>
      </div>
    </div>
  );
});

CarreiraCard.displayName = 'CarreiraCard';

export const CarreirasCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    duration: 20,
    skipSnaps: true
  });
  
  const [capas, setCapas] = useState<CarreiraCapaCache>({});
  const [gerando, setGerando] = useState<Set<string>>(new Set());

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
        // Pular carreiras com capa local
        if (carreira.capaLocal) continue;
        
        // Pular se já tem capa ou está gerando
        if (capas[carreira.id] || gerando.has(carreira.id)) continue;
        
        // Marcar como gerando
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
    
    // Aguardar capas carregarem do banco antes de gerar
    const timer = setTimeout(gerarCapasFaltantes, 1000);
    return () => clearTimeout(timer);
  }, [capas, gerando]);

  return (
    <div className="overflow-hidden -mx-1 px-1" ref={emblaRef}>
      <div className="flex gap-3">
        {CARREIRAS.map((carreira, index) => (
          <CarreiraCard
            key={carreira.id}
            carreira={carreira}
            capaUrl={capas[carreira.id]}
            isGenerating={gerando.has(carreira.id)}
            onClick={() => navigate(`/carreira/${carreira.id}`)}
            priority={index < 3}
          />
        ))}
      </div>
    </div>
  );
};

export default CarreirasCarousel;
