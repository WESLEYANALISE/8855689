import { Sparkles, Brain, Lightbulb, Zap } from "lucide-react";

interface SlideDicaEstudoProps {
  tecnica?: string;
  dica?: string;
  conteudo: string;
  titulo?: string;
}

const tecnicaIcons: Record<string, any> = {
  'Mnemônico': Brain,
  'Associação': Zap,
  'Visualização': Lightbulb,
  'default': Sparkles
};

const tecnicaColors: Record<string, string> = {
  'Mnemônico': 'from-pink-500 to-rose-500',
  'Associação': 'from-yellow-500 to-orange-500',
  'Visualização': 'from-cyan-500 to-blue-500',
  'default': 'from-violet-500 to-purple-500'
};

export const SlideDicaEstudo = ({ tecnica, dica, conteudo, titulo }: SlideDicaEstudoProps) => {
  const displayContent = dica || conteudo;
  const Icon = tecnicaIcons[tecnica || 'default'] || tecnicaIcons.default;
  const gradient = tecnicaColors[tecnica || 'default'] || tecnicaColors.default;
  
  // Split content into lines for better presentation
  const lines = displayContent.split('\n').filter(l => l.trim());
  
  return (
    <div className="space-y-4">
      {/* Technique badge */}
      {tecnica && (
        <div 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${gradient} shadow-lg animate-scale-in`}
        >
          <Icon className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">
            Técnica: {tecnica}
          </span>
        </div>
      )}
      
      {/* Main tip content */}
      <div 
        className="relative bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-5 border border-violet-500/20 animate-fade-in"
        style={{ animationDelay: '100ms' }}
      >
        {/* Sparkle decorations */}
        <div className="absolute top-3 right-3">
          <Sparkles className="w-5 h-5 text-violet-400/50" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Sparkles className="w-4 h-4 text-purple-400/40" />
        </div>
        
        <div className="space-y-3">
          {lines.map((line, idx) => (
            <p 
              key={idx}
              className="text-foreground leading-relaxed flex items-start gap-2 animate-fade-in"
              style={{ animationDelay: `${200 + idx * 100}ms` }}
            >
              {lines.length > 1 && (
                <span className="text-violet-400 mt-1">•</span>
              )}
              <span>{line}</span>
            </p>
          ))}
        </div>
      </div>
      
      {/* Memory tip indicator */}
      <div 
        className="flex items-center gap-2 text-muted-foreground bg-card/50 rounded-lg px-3 py-2 animate-fade-in"
        style={{ animationDelay: '400ms' }}
      >
        <Brain className="w-4 h-4 text-violet-400" />
        <span className="text-xs">Dica de memorização para fixar o conteúdo</span>
      </div>
    </div>
  );
};