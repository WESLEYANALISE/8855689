import { useState, useEffect } from "react";
import { BarChart3, Users, DollarSign, Building2, Target, Heart, Gavel, Landmark, ShieldAlert, FileText, Scale, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export type PainelId = "estatisticas" | "pessoal" | "despesas" | "litigantes" | "metas" | "saude" | "juri" | "inss" | "violencia" | "fazenda";

interface PainelConfig {
  id: PainelId;
  nome: string;
  icone: React.ReactNode;
  numero: number;
}

const paineis: PainelConfig[] = [{
  id: "estatisticas",
  nome: "Estatísticas",
  icone: <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 1
}, {
  id: "pessoal",
  nome: "Dados de Pessoal",
  icone: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 2
}, {
  id: "despesas",
  nome: "Despesas e Receitas",
  icone: <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 3
}, {
  id: "litigantes",
  nome: "Grandes Litigantes",
  icone: <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 4
}, {
  id: "metas",
  nome: "Metas",
  icone: <Target className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 5
}, {
  id: "saude",
  nome: "Direito à Saúde",
  icone: <Heart className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 6
}, {
  id: "juri",
  nome: "Painel Júri",
  icone: <Gavel className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 7
}, {
  id: "inss",
  nome: "Painel INSS",
  icone: <FileText className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 8
}, {
  id: "violencia",
  nome: "Violência contra Mulher",
  icone: <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 9
}, {
  id: "fazenda",
  nome: "Fazenda Nacional",
  icone: <Landmark className="w-6 h-6 sm:w-7 sm:h-7" />,
  numero: 10
}];

const CACHE_KEY = 'justica-numeros-bg-image';
const BACKGROUND_PROMPT = `A majestic bronze statue of Lady Themis, the Greek goddess of Justice, holding balanced scales in one hand and a sword in the other, standing tall on an elegant marble pedestal at dawn. Golden sunrise light illuminates the scene from behind, creating a dramatic silhouette effect. In the foreground, two silhouettes of people admiringly looking up at the statue with reverence. Soft morning mist surrounds the base, elegant neoclassical architecture with marble columns in the background. Warm golden and deep blue tones, cinematic lighting, photorealistic, atmospheric perspective, ultra high resolution, 16:9 aspect ratio hero image`;

interface MenuJusticaNumeroProps {
  onSelecionarPainel: (painel: PainelId) => void;
  onVoltar?: () => void;
}

export function MenuJusticaNumeros({
  onSelecionarPainel,
  onVoltar
}: MenuJusticaNumeroProps) {
  const [imagemFundo, setImagemFundo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const raio = 145;

  useEffect(() => {
    const carregarImagem = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setImagemFundo(cached);
        setCarregando(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('generate-background-image', {
          body: { prompt: BACKGROUND_PROMPT }
        });
        if (error) {
          console.error('Erro ao gerar imagem:', error);
          setCarregando(false);
          return;
        }
        if (data?.imageUrl) {
          localStorage.setItem(CACHE_KEY, data.imageUrl);
          setImagemFundo(data.imageUrl);
        }
      } catch (err) {
        console.error('Erro ao chamar edge function:', err);
      } finally {
        setCarregando(false);
      }
    };
    carregarImagem();
  }, []);

  const gerarPathTimeline = () => {
    const pontos: string[] = [];
    const centroX = 200;
    const centroY = 200;
    paineis.forEach((_, index) => {
      const anguloDeg = -90 + index * 36;
      const anguloRad = anguloDeg * Math.PI / 180;
      const x = centroX + Math.cos(anguloRad) * raio;
      const y = centroY + Math.sin(anguloRad) * raio;
      if (index === 0) {
        pontos.push(`M ${x} ${y}`);
      } else {
        pontos.push(`L ${x} ${y}`);
      }
    });
    const primeiroAngulo = -90 * Math.PI / 180;
    const xFinal = centroX + Math.cos(primeiroAngulo) * raio;
    const yFinal = centroY + Math.sin(primeiroAngulo) * raio;
    pontos.push(`L ${xFinal} ${yFinal}`);
    return pontos.join(' ');
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col overflow-hidden">
      {/* Imagem de fundo */}
      {imagemFundo && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-fade-in" 
          style={{ backgroundImage: `url(${imagemFundo})` }} 
        />
      )}

      {/* Gradiente de fallback */}
      {!imagemFundo && !carregando && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
      )}

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* Header */}
      <header className="relative z-20 flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-sm border-b border-white/10 animate-fade-in">
        {onVoltar && (
          <Button variant="ghost" size="sm" onClick={onVoltar} className="text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Button>
        )}
        <div className="flex-1 text-center pr-12" />
      </header>

      {/* Loading state */}
      {carregando && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <span className="text-sm text-white/70">Gerando imagem de fundo...</span>
          </div>
        </div>
      )}

      {/* Container principal */}
      <div 
        className={`relative z-10 flex-1 flex flex-col items-center justify-center py-6 transition-opacity duration-500 ${carregando ? 'opacity-30' : 'opacity-100'}`}
      >
        {/* Container do círculo timeline */}
        <div className="relative w-[400px] h-[400px] sm:w-[440px] sm:h-[440px]">
          {/* SVG para linha da timeline */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
            <defs>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <circle cx="200" cy="200" r={raio} fill="none" stroke="url(#timelineGradient)" strokeWidth="2" strokeDasharray="10 5" opacity="0.4" />
            <path d={gerarPathTimeline()} fill="none" stroke="url(#timelineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
          </svg>

          {/* Centro */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-scale-in" />

          {/* Botões ao redor do círculo */}
          {paineis.map((painel, index) => {
            const anguloDeg = -90 + index * 36;
            const anguloRad = anguloDeg * Math.PI / 180;
            const x = Math.cos(anguloRad) * raio;
            const y = Math.sin(anguloRad) * raio;
            return (
              <div 
                key={painel.id} 
                className="absolute w-16 h-16 sm:w-[72px] sm:h-[72px] animate-scale-in" 
                style={{
                  left: `calc(50% + ${x}px - 2rem)`,
                  top: `calc(50% + ${y}px - 2rem)`,
                  animationDelay: `${0.15 + index * 0.05}s`
                }}
              >
                <button
                  onClick={() => onSelecionarPainel(painel.id)}
                  className="relative w-full h-full flex flex-col items-center justify-center rounded-full bg-card/95 backdrop-blur-sm border-2 border-white/30 hover:border-primary hover:bg-card hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 group hover:scale-110"
                >
                  <div className="text-primary group-hover:text-primary transition-colors">
                    {painel.icone}
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-foreground/80 group-hover:text-foreground text-center leading-tight mt-1 px-1 max-w-full line-clamp-2 font-medium">
                    {painel.nome}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Subtítulo */}
        <div className="text-center mt-8 px-6 animate-fade-in">
          <p className="text-base sm:text-lg text-white font-medium mb-2">
            Explore os dados do Judiciário Brasileiro
          </p>
          <p className="text-sm text-white/60">
            Clique em uma categoria para acessar as estatísticas detalhadas
          </p>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 mt-6 animate-fade-in">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <span className="text-xs text-white/40 uppercase tracking-widest">Timeline Circular</span>
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </div>
    </div>
  );
}
