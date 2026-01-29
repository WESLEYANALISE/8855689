import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { UniversalImage } from '@/components/ui/universal-image';
import type { BlurCategory } from '@/lib/blurPlaceholders';

import politicoEsquerda from '@/assets/politico-esquerda.png';
import politicoCentro from '@/assets/politico-centro.png';
import politicoDireita from '@/assets/politico-direita.png';

interface Orientacao {
  id: string;
  label: string;
  image: string;
  gradient: string;
  glowColor: string;
  ringColor: string;
  accentColor: string;
  blurCategory: BlurCategory;
}

const orientacoes: Orientacao[] = [
  {
    id: 'esquerda',
    label: 'Esquerda',
    image: politicoEsquerda,
    gradient: 'from-red-900/80 via-red-800/60 to-transparent',
    glowColor: 'shadow-red-500/50',
    ringColor: 'ring-red-500/60',
    accentColor: 'bg-red-500',
    blurCategory: 'red',
  },
  {
    id: 'centro',
    label: 'Centro',
    image: politicoCentro,
    gradient: 'from-yellow-900/80 via-yellow-800/60 to-transparent',
    glowColor: 'shadow-yellow-500/50',
    ringColor: 'ring-yellow-500/60',
    accentColor: 'bg-yellow-500',
    blurCategory: 'amber',
  },
  {
    id: 'direita',
    label: 'Direita',
    image: politicoDireita,
    gradient: 'from-blue-900/80 via-blue-800/60 to-transparent',
    glowColor: 'shadow-blue-500/50',
    ringColor: 'ring-blue-500/60',
    accentColor: 'bg-blue-500',
    blurCategory: 'blue',
  },
];

export function EstudosPoliticosSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-5 h-5 text-amber-400" />
        <h2 className="font-semibold text-base text-white">Estudos Políticos</h2>
      </div>

      {/* Grid horizontal com 3 colunas */}
      <div className="grid grid-cols-3 gap-3">
        {orientacoes.map((orientacao) => (
          <div
            key={orientacao.id}
            className="group relative cursor-pointer"
            onClick={() => navigate(`/politica/estudos/${orientacao.id}`)}
          >
            {/* Glow effect on hover */}
            <div 
              className={`absolute -inset-1 rounded-xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-70 ${orientacao.glowColor}`}
              style={{ background: 'currentColor' }}
            />
            
            {/* Main card */}
            <div 
              className={`relative overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:${orientacao.ringColor} group-hover:scale-[1.03]`}
            >
              {/* Container com aspect ratio fixo */}
              <div className="relative aspect-[3/4] overflow-hidden">
                {/* UniversalImage com blur placeholder e prioridade máxima */}
                <UniversalImage
                  src={orientacao.image}
                  alt={orientacao.label}
                  priority
                  blurCategory={orientacao.blurCategory}
                  containerClassName="absolute inset-0 w-full h-full"
                  className="transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Overlay com gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-t ${orientacao.gradient} transition-opacity duration-300 pointer-events-none`} />
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" 
                  style={{ transition: 'transform 0.7s ease-out, opacity 0.3s ease-out' }}
                />
                
                {/* Accent line at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${orientacao.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                
                {/* Label no rodapé com efeito */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-center pointer-events-none">
                  <div className="flex items-center justify-center gap-1">
                    <h3 className="font-bold text-sm text-white drop-shadow-lg transition-transform duration-300 group-hover:translate-x-[-4px]">
                      {orientacao.label}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-white opacity-0 translate-x-[-8px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}