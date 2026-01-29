import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, ChevronLeft, ChevronRight, Sparkles, BookOpen, HelpCircle, CheckCircle2, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactCardFlip from "react-card-flip";
interface VideoaulaOAB {
  id: number;
  video_id: string;
  area: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
  transcricao: string | null;
  sobre_aula: string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
}

// Extrai apenas o título limpo da aula (remove prefixos como "Direito X | OAB - ")
const extractCleanTitle = (fullTitle: string): string => {
  let title = fullTitle.replace(/\s*\|\s*CURSO GRATUITO\s*$/i, '');
  const oabMatch = title.match(/\|\s*OAB\s*-\s*(.+)$/i);
  if (oabMatch) return oabMatch[1].trim();
  const lastDashMatch = title.match(/^[^-]+-\s*(.+)$/);
  if (lastDashMatch && !title.includes('|')) return lastDashMatch[1].trim();
  return title.trim();
};

// Função para simplificar nome da área
const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

const VideoaulasOABViewPrimeiraFase = () => {
  const navigate = useNavigate();
  const { area, id } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const videoId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");

  // Buscar vídeo atual
  const { data: video, isLoading } = useQuery({
    queryKey: ["videoaula-oab-1fase", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("*")
        .eq("id", videoId)
        .single();
      
      if (error) throw error;
      return data as VideoaulaOAB;
    },
    enabled: !!videoId,
  });

  // Buscar lista para navegação
  const { data: allVideos } = useQuery({
    queryKey: ["videoaulas-oab-1fase-nav", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("id, titulo, ordem, sobre_aula")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!decodedArea,
  });

  // Navegação
  const currentIndex = allVideos?.findIndex(v => v.id === videoId) ?? -1;
  const prevVideo = currentIndex > 0 ? allVideos?.[currentIndex - 1] : null;
  const nextVideo = currentIndex < (allVideos?.length || 0) - 1 ? allVideos?.[currentIndex + 1] : null;

  // Mutation para gerar conteúdo
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!video) throw new Error("Vídeo não encontrado");
      
      const { data, error } = await supabase.functions.invoke("processar-videoaula-oab", {
        body: {
          videoId: video.video_id,
          titulo: video.titulo,
          tabela: "videoaulas_oab_primeira_fase",
          id: video.id,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videoaula-oab-1fase", videoId] });
    },
    onError: (error) => {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Videoaula não encontrada</p>
          <Button
            variant="outline"
            onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}`)}
            className="mt-4"
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-500/5">
      {/* Header com Voltar - estilo igual à página de áreas */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}`)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header do Vídeo */}
      <div className="pt-4 pb-2 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  {simplifyAreaName(decodedArea)}
                </span>
                <h1 className="text-base font-bold mt-1 leading-snug">{extractCleanTitle(video.titulo)}</h1>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Player */}
      <div className="px-4 mb-4">
        <div className="max-w-lg mx-auto">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${video.video_id}?rel=0`}
              title={video.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="px-4 mb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border">
            <Button
              variant="ghost"
              size="sm"
              disabled={!prevVideo}
              onClick={() => prevVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${prevVideo.id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1} de {allVideos?.length || 0}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!nextVideo}
              onClick={() => nextVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${nextVideo.id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de conteúdo */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-neutral-800/80">
              <TabsTrigger value="sobre" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <BookOpen className="w-4 h-4" />
                Sobre
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <Sparkles className="w-4 h-4" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="questoes" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <HelpCircle className="w-4 h-4" />
                Questões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre">
              {video.sobre_aula ? (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <div className="prose prose-sm prose-invert max-w-none 
                    prose-headings:text-red-400 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-strong:text-white
                    prose-li:text-gray-300 prose-li:marker:text-red-400
                    prose-ul:space-y-1 prose-ol:space-y-1
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{video.sobre_aula}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <EmptyContent 
                  title="Resumo não gerado" 
                  description="Clique no botão abaixo para gerar o resumo desta aula com IA"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent value="flashcards">
              {video.flashcards && video.flashcards.length > 0 ? (
                <FlashcardsView flashcards={video.flashcards} />
              ) : (
                <EmptyContent 
                  title="Flashcards não gerados" 
                  description="Clique no botão abaixo para gerar flashcards desta aula"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent value="questoes">
              {video.questoes && video.questoes.length > 0 ? (
                <QuestoesView questoes={video.questoes} />
              ) : (
                <EmptyContent 
                  title="Questões não geradas" 
                  description="Clique no botão abaixo para gerar questões desta aula"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lista de Aulas (Mini Sidebar) */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Outras Aulas
          </h2>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {allVideos?.map((v, index) => (
              <button
                key={v.id}
                onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${v.id}`)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all text-sm flex items-center gap-3",
                  v.id === videoId
                    ? "bg-red-500/20 border border-red-500/40 text-red-400"
                    : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-transparent text-foreground"
                )}
              >
                <span className="font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 line-clamp-2 leading-snug">{extractCleanTitle(v.titulo)}</span>
                {v.sobre_aula && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente vazio
const EmptyContent = ({ title, description, onGenerate, isGenerating }: {
  title: string;
  description: string;
  onGenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border">
    <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm px-4">{description}</p>
    <Button
      onClick={onGenerate}
      disabled={isGenerating}
      className="bg-red-600 hover:bg-red-700"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar com IA
        </>
      )}
    </Button>
  </div>
);

// Flashcards com flip animation
const FlashcardsView = ({ flashcards }: { flashcards: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = flashcards[currentIndex];
  const frente = card?.pergunta || card?.front || card?.frente || "";
  const verso = card?.resposta || card?.back || card?.verso || "";
  const exemplo = card?.exemplo || "";

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i + 1), 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i - 1), 100);
    }
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Card {currentIndex + 1} de {flashcards.length}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with flip */}
      <div className="py-4">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Front */}
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full min-h-[200px] bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500/50 transition-colors"
          >
            <p className="text-xs text-red-400 mb-3 font-medium uppercase">Pergunta</p>
            <p className="text-lg font-medium text-foreground leading-relaxed">{frente}</p>
            <p className="text-xs text-muted-foreground mt-4">Toque para ver a resposta</p>
          </button>

          {/* Back */}
          <button
            onClick={() => setIsFlipped(false)}
            className="w-full min-h-[200px] bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
          >
            <p className="text-xs text-emerald-400 mb-3 font-medium uppercase">Resposta</p>
            <p className="text-base text-foreground leading-relaxed">{verso}</p>
            <p className="text-xs text-muted-foreground mt-4">Toque para voltar à pergunta</p>
          </button>
        </ReactCardFlip>
      </div>

      {/* Exemplo prático - só aparece quando virado e se tiver exemplo */}
      {isFlipped && exemplo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{exemplo}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex-1 gap-2"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Questões
const QuestoesView = ({ questoes }: { questoes: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questao = questoes[currentIndex];
  const alternativas = questao?.alternativas || questao?.options || [];
  const respostaCorreta = questao?.resposta_correta ?? questao?.correct ?? questao?.correta ?? 0;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === respostaCorreta) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Questão {currentIndex + 1} de {questoes.length}</span>
        <span>Acertos: {score}</span>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="font-medium mb-4">{questao?.pergunta || questao?.question || questao?.enunciado}</p>
        
        <div className="space-y-2">
          {alternativas.map((alt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all text-sm",
                showResult && idx === respostaCorreta
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : showResult && idx === selectedAnswer
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-neutral-800/50 border-white/10 hover:border-white/20"
              )}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
              {alt}
            </button>
          ))}
        </div>

        {showResult && questao?.explicacao && (
          <div className={cn(
            "mt-4 p-3 rounded-lg border",
            selectedAnswer === respostaCorreta
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          )}>
            <p className="text-sm text-muted-foreground">{questao.explicacao}</p>
          </div>
        )}
      </div>

      {showResult && currentIndex < questoes.length - 1 && (
        <Button onClick={handleNext} className="w-full bg-red-600 hover:bg-red-700">
          Próxima questão
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default VideoaulasOABViewPrimeiraFase;
