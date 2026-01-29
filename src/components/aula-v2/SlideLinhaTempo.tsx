import { Clock, CheckCircle2 } from "lucide-react";
import { EtapaTimeline } from "./types";

interface SlideLinhaTempo {
  etapas: EtapaTimeline[];
  titulo?: string;
  conteudo?: string;
}

export const SlideLinhaTempo = ({ etapas, titulo, conteudo }: SlideLinhaTempo) => {
  if (!etapas || etapas.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Linha do tempo não disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Intro text if provided */}
      {conteudo && (
        <p className="text-foreground leading-relaxed mb-4 animate-fade-in">
          {conteudo}
        </p>
      )}
      
      {/* Timeline */}
      <div className="relative pl-8 space-y-6">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
        
        {etapas.map((etapa, idx) => (
          <div
            key={idx}
            className="relative animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Circle marker */}
            <div className="absolute -left-5 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-xs font-bold text-white">{idx + 1}</span>
            </div>
            
            {/* Content card */}
            <div className="bg-card/60 rounded-xl p-4 border border-border/50 ml-2 hover:border-primary/30 transition-colors">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                {etapa.titulo}
              </h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {etapa.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Timeline indicator */}
      <div className="flex items-center gap-2 pt-2 text-muted-foreground animate-fade-in">
        <Clock className="w-4 h-4 text-blue-400" />
        <span className="text-xs">Sequência de etapas/procedimentos</span>
      </div>
    </div>
  );
};
