import { User, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

interface PoliticoBiografiaCardProps {
  nome: string;
  cargo?: string;
  partido?: string;
  uf?: string;
  fotoUrl?: string;
  periodo?: string;
  onClick?: () => void;
  index?: number;
  corTema?: 'amber' | 'emerald' | 'purple';
}

export const PoliticoBiografiaCard = ({
  nome,
  cargo,
  partido,
  uf,
  fotoUrl,
  periodo,
  onClick,
  index = 0,
  corTema = 'amber'
}: PoliticoBiografiaCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const corClasses = {
    amber: {
      bg: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/30 hover:border-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
      glow: 'hover:shadow-amber-500/20'
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/30 hover:border-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
      glow: 'hover:shadow-emerald-500/20'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30 hover:border-purple-400',
      badge: 'bg-purple-500/20 text-purple-300',
      glow: 'hover:shadow-purple-500/20'
    }
  };

  const cores = corClasses[corTema];

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl p-4
        bg-gradient-to-br ${cores.bg}
        border ${cores.border}
        backdrop-blur-sm
        shadow-lg ${cores.glow} hover:shadow-xl
        transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1
        group animate-fade-in
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Foto */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800">
            {!imageError && fotoUrl ? (
              <>
                {!imageLoaded && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
                  </div>
                )}
                <img
                  src={fotoUrl}
                  alt={nome}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                <User className="w-8 h-8 text-neutral-400" />
              </div>
            )}
          </div>
          
          {/* Indicador de clicável */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3 text-neutral-700" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2">
            {nome}
          </h3>
          
          {cargo && (
            <p className="text-xs text-neutral-400 mb-2 line-clamp-1">
              {cargo}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1.5">
            {partido && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${cores.badge}`}>
                {partido}
              </span>
            )}
            {uf && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                {uf}
              </span>
            )}
            {periodo && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-500/20 text-neutral-300">
                {periodo}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
