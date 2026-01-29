import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowRight, Volume2, Loader2, BookOpen, Bell, Calendar, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const textoExplicativo = `A Resenha Diária é seu portal de atualização legislativa em tempo real. Todos os dias, acompanhamos as publicações do Diário Oficial da União e trazemos para você as novas leis, decretos, medidas provisórias e demais atos normativos publicados pelo Planalto.

Com a Resenha Diária, você:

• Fica por dentro das mudanças legislativas assim que elas acontecem
• Acompanha novas leis ordinárias e complementares
• Monitora decretos presidenciais e medidas provisórias
• Recebe análises simplificadas de cada ato normativo
• Identifica rapidamente a área do direito afetada

A atualização é diária e automática, garantindo que você nunca perca uma mudança importante na legislação brasileira. Ideal para estudantes, advogados e qualquer pessoa que precisa se manter atualizada com o ordenamento jurídico.`;

export default function ResenhaDiariaSobre() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleNarrar = async () => {
    // Se já está tocando, pausa
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    // Se já tem áudio carregado, apenas toca
    if (audioElement) {
      audioElement.play();
      setIsPlaying(true);
      return;
    }

    // Gerar áudio
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-audio-professora`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: textoExplicativo }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar áudio");
      }

      const data = await response.json();
      
      if (data.audioBase64) {
        const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        setAudioElement(audio);
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Erro ao gerar narração:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Atualização Diária",
      description: "Novas leis publicadas todos os dias"
    },
    {
      icon: FileText,
      title: "Diário Oficial",
      description: "Direto do Planalto para você"
    },
    {
      icon: BookOpen,
      title: "Análise Simplificada",
      description: "Entenda cada ato normativo"
    },
    {
      icon: Bell,
      title: "Nunca Perca Nada",
      description: "Fique sempre atualizado"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header customizado */}
      <header className="w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center justify-between px-4 gap-3 max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-all hover:scale-105 border border-border/50 hover:border-border flex-shrink-0 group" 
            aria-label="Voltar para Início"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5] flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Voltar</span>
              <span className="text-sm font-semibold truncate max-w-[100px]">Início</span>
            </div>
          </button>
          
          <h1 className="text-base font-bold text-foreground truncate flex-1 text-center">
            Sobre
          </h1>
          
          <div className="w-[72px]" /> {/* Spacer para centralizar título */}
        </div>
      </header>
      
      <div className="p-4 pb-24 space-y-6">
        {/* Ícone e título */}
        <div className="flex flex-col items-center text-center pt-4">
          <div className="bg-red-900/30 rounded-3xl p-5 mb-4 ring-2 ring-red-700/30">
            <Scale className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Resenha Diária
          </h1>
          <p className="text-muted-foreground text-sm">
            Sua fonte de atualização legislativa
          </p>
        </div>

        {/* Grid de features */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center"
            >
              <div className="bg-red-900/20 rounded-xl p-2.5 mb-2">
                <feature.icon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Texto explicativo */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              O que é a Resenha Diária?
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNarrar}
              disabled={isLoading}
              className="gap-2 rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : isPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 animate-pulse text-primary" />
                  Pausar
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Ouvir
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {textoExplicativo}
          </div>
        </div>

        {/* Botão principal */}
        <Button
          onClick={() => navigate('/vade-mecum/resenha-diaria')}
          className="w-full h-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-base font-semibold gap-2"
        >
          Ver resenha diária completa
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
