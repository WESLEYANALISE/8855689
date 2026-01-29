import brasaoRepublica from "@/assets/brasao-republica.png";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeiHeaderProps {
  titulo: string;
  subtitulo?: string;
  ementa?: string;
  className?: string;
  // Props para favoritos
  isFavorita?: boolean;
  onToggleFavorita?: () => void;
  isTogglingFavorita?: boolean;
  showFavoriteButton?: boolean;
}

// Mapeamento de ementas oficiais das leis
const ementasLeis: Record<string, string> = {
  "Código Penal": "Código Penal.",
  "Código Civil": "Institui o Código Civil.",
  "Código de Processo Civil": "Código de Processo Civil.",
  "Código de Processo Penal": "Código de Processo Penal.",
  "Constituição Federal": "Constituição da República Federativa do Brasil.",
  "Consolidação das Leis do Trabalho": "Aprova a Consolidação das Leis do Trabalho.",
  "Código de Defesa do Consumidor": "Dispõe sobre a proteção do consumidor e dá outras providências.",
  "Código Tributário Nacional": "Dispõe sobre o Sistema Tributário Nacional e institui normas gerais de direito tributário aplicáveis à União, Estados e Municípios.",
  "Código de Trânsito Brasileiro": "Institui o Código de Trânsito Brasileiro.",
  "Código Eleitoral": "Institui o Código Eleitoral.",
  "Código Brasileiro de Aeronáutica": "Dispõe sobre o Código Brasileiro de Aeronáutica.",
  "Código Comercial": "Código Comercial.",
  "Código de Minas": "Dá nova redação ao Decreto-lei nº 1.985, de 29 de janeiro de 1940 (Código de Minas).",
  "Código Penal Militar": "Código Penal Militar.",
  "Código de Processo Penal Militar": "Código de Processo Penal Militar.",
  "Código Florestal": "Dispõe sobre a proteção da vegetação nativa.",
};

export const LeiHeader = ({ 
  titulo, 
  subtitulo, 
  ementa, 
  className = "",
  isFavorita = false,
  onToggleFavorita,
  isTogglingFavorita = false,
  showFavoriteButton = false
}: LeiHeaderProps) => {
  // Normalizar título para lookup (CÓDIGO PENAL -> Código Penal)
  const tituloNormalizado = titulo
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  // Buscar ementa pelo título normalizado
  const ementaFinal = ementa || ementasLeis[tituloNormalizado] || ementasLeis[titulo] || null;

  return (
    <div className={`flex flex-col items-center justify-center py-6 px-4 ${className}`}>
      {/* Brasão da República com botão de favoritar */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
        <img 
          src={brasaoRepublica} 
          alt="Brasão da República Federativa do Brasil" 
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-lg"
        />
        
        {/* Botão de favoritar - ao lado do brasão */}
        {showFavoriteButton && onToggleFavorita && (
          <button
            onClick={onToggleFavorita}
            disabled={isTogglingFavorita}
            className={cn(
              "absolute -right-2 top-0 p-2 rounded-full transition-all duration-200 z-20",
              "bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg",
              "hover:scale-110 active:scale-95",
              isTogglingFavorita && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isFavorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star 
              className={cn(
                "w-5 h-5 transition-all duration-200",
                isFavorita 
                  ? "fill-amber-500 text-amber-500" 
                  : "text-muted-foreground hover:text-amber-500"
              )} 
            />
          </button>
        )}
      </div>
      
      {/* Nome da Lei */}
      <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center tracking-wide">
        {titulo}
      </h1>
      
      {subtitulo && (
        <p className="text-sm text-muted-foreground mt-1 text-center">
          {subtitulo}
        </p>
      )}
      
      {/* Linha decorativa */}
      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4" />
      
      {/* Ementa em vermelho - abaixo da linha */}
      {ementaFinal && (
        <p className="text-xs text-red-400 mt-3 text-center italic max-w-md">
          {ementaFinal}
        </p>
      )}
    </div>
  );
};
