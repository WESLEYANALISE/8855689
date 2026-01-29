import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactCardFlip from "react-card-flip";
import { 
  ArrowLeft, Loader2, Target, X, Sparkles, Info, 
  Volume2, Play, Pause, Waves, CheckCircle2, Type
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import StandardPageHeader from "@/components/StandardPageHeader";

// Imagem de fundo imersiva
import bgTrilhasOab from "@/assets/bg-trilhas-oab.webp";

type TabType = "conteudo" | "exemplos" | "termos" | "flashcards";

interface Exemplo {
  titulo: string;
  situacao: string;
  analise: string;
  conclusao: string;
}

interface Termo {
  termo: string;
  definicao: string;
  origem?: string;
}

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

// Função para limpar markdown
const cleanMarkdown = (content?: string, titulo?: string): string => {
  if (!content) return "";
  let cleaned = content;
  
  // Remove título duplicado no início
  if (titulo) {
    const tituloRegex = new RegExp(`^#\\s*${titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i');
    cleaned = cleaned.replace(tituloRegex, '');
  }
  
  // Remove # Título no início
  cleaned = cleaned.replace(/^#\s+[^\n]+\n+/, '');
  
  return cleaned.trim();
};

const TrilhasEticaEstudo = () => {
  const navigate = useNavigate();
  const { topicoId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>("conteudo");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [showQuestoesCard, setShowQuestoesCard] = useState(false);
  const [showQuestoesIntro, setShowQuestoesIntro] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  
  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const brownNoiseRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioError, setAudioError] = useState(false);
  
  // Brown noise state
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);

  // Inicializa áudio de ruído marrom
  useEffect(() => {
    const brownNoise = new Audio('/audio/ruido-marrom.mp3');
    brownNoise.loop = true;
    brownNoise.volume = 0.3;
    brownNoiseRef.current = brownNoise;

    return () => {
      if (brownNoiseRef.current) {
        brownNoiseRef.current.pause();
        brownNoiseRef.current = null;
      }
    };
  }, []);

  const aumentarFonte = () => setFontSize(prev => Math.min(prev + 2, 24));
  const diminuirFonte = () => setFontSize(prev => Math.max(prev - 2, 12));

  // Toggle brown noise
  const toggleBrownNoise = () => {
    if (!brownNoiseEnabled) {
      setShowBrownNoiseInfo(true);
    } else {
      setBrownNoiseEnabled(false);
      brownNoiseRef.current?.pause();
    }
  };

  const confirmBrownNoiseInfo = () => {
    setShowBrownNoiseInfo(false);
    setBrownNoiseEnabled(true);
    brownNoiseRef.current?.play().catch(() => {});
  };

  // Audio player handlers
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setAudioProgress(value[0]);
  };

  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Detectar se a geração está travada
  const [isGeracaoTravada, setIsGeracaoTravada] = useState(false);
  
  // Buscar tópico com tema
  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["oab-etica-topico", topicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_etica_topicos")
        .select(`
          *,
          tema:oab_etica_temas(*)
        `)
        .eq("id", parseInt(topicoId!))
        .single();

      if (error) throw error;
      
      // Verificar se está travado
      if (data?.status === "gerando" && data?.updated_at) {
        const updatedAt = new Date(data.updated_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - updatedAt) / (1000 * 60);
        setIsGeracaoTravada(diffMinutes > 5);
      } else {
        setIsGeracaoTravada(false);
      }
      
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando") return 3000;
      if (data?.status === "concluido" && !data?.capa_url) return 5000;
      return false;
    },
  });

  // Mutation para gerar conteúdo
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-etica-oab", {
        body: { topico_id: parseInt(topicoId!) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setIsGeracaoTravada(false);
      refetch();
      toast.success(data?.message || "Conteúdo gerado com sucesso!");
    },
    onError: (error) => {
      setIsGeracaoTravada(false);
      refetch();
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
      console.error(error);
    },
  });

  // Gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (topico && topico.status === "pendente" && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate();
    }
  }, [topico?.status]);

  const exemplos: Exemplo[] = (topico?.exemplos as unknown as Exemplo[]) || [];
  const termos: Termo[] = (topico?.termos as unknown as Termo[]) || [];
  const flashcards: Flashcard[] = (topico?.flashcards as unknown as Flashcard[]) || [];
  const questoes: Questao[] = (topico?.questoes as unknown as Questao[]) || [];
  const flashcardAtual = flashcards[flashcardIndex];

  const proximoFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    }, 100);
  };

  const anteriorFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isGerando = topico?.status === "gerando" || gerarConteudoMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header Global */}
      <StandardPageHeader
        title={topico?.titulo || "Carregando..."}
        subtitle={topico?.tema?.titulo}
        backPath={topico?.tema?.id ? `/oab/trilhas-etica/${topico.tema.id}` : undefined}
      />

      {/* Capa do Tópico */}
      {topico?.capa_url && (
        <div className="relative w-full aspect-video max-h-[200px] overflow-hidden -mt-8">
          <img 
            src={topico.capa_url} 
            alt={topico.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/50 to-transparent" />
        </div>
      )}
      
      {/* Header do conteúdo */}
      <div className={`${topico?.capa_url ? 'pt-0 -mt-12 relative z-10' : 'pt-2'} pb-4 px-4`}>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-amber-400">{topico?.ordem}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  {topico?.tema?.titulo}
                </span>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{topico?.titulo}</h1>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          {isGerando ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {!isGeracaoTravada ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
                  <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
                  <p className="text-sm text-gray-400">
                    A IA está criando o material de estudo para este tópico.
                    <br />
                    Isso pode levar alguns segundos.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Info className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Geração demorando mais que o esperado</h2>
                  <p className="text-neutral-400 mb-4">
                    A geração está demorando mais de 5 minutos.
                    <br />
                    Você pode tentar novamente.
                  </p>
                  <Button
                    onClick={() => {
                      setIsGeracaoTravada(false);
                      gerarConteudoMutation.mutate();
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                {/* Abas de Estudo */}
                <div className="mb-4">
                  <TabsList className="grid w-full grid-cols-4 h-10 bg-[#12121a] border border-white/10">
                    <TabsTrigger value="conteudo" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="exemplos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Exemplos
                    </TabsTrigger>
                    <TabsTrigger value="termos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Termos
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Flashcards
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* ============ CONTEÚDO ============ */}
                <TabsContent value="conteudo" className="mt-0">
                  {/* Audio Player */}
                  {topico?.url_narracao && !audioError && (
                    <div className="bg-[#12121a] rounded-xl border border-amber-500/30 p-4 mb-4 space-y-3">
                      <audio
                        ref={audioRef}
                        src={topico.url_narracao}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onError={() => setAudioError(true)}
                        preload="metadata"
                      />
                      
                      {/* Player principal */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlayPause}
                          className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-black" />
                          ) : (
                            <Play className="w-5 h-5 text-black ml-0.5" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Volume2 className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-amber-400 font-medium">Narrar Conteúdo</span>
                          </div>
                          <Slider
                            value={[audioProgress]}
                            max={audioDuration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatTime(audioProgress)}</span>
                            <span>{formatTime(audioDuration)}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={changeSpeed}
                          className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors flex-shrink-0"
                        >
                          {playbackSpeed}x
                        </button>
                      </div>
                      
                      {/* Toggle Ruído Marrom */}
                      <div className="pt-2 border-t border-white/10">
                        <button
                          onClick={toggleBrownNoise}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                            brownNoiseEnabled 
                              ? 'bg-amber-500/20 border border-amber-500/40' 
                              : 'bg-neutral-800/50 border border-white/10 hover:border-amber-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Waves className={`w-4 h-4 ${brownNoiseEnabled ? 'text-amber-400' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${brownNoiseEnabled ? 'text-amber-400' : 'text-gray-300'}`}>
                              Ruído Marrom
                            </span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${
                            brownNoiseEnabled ? 'bg-amber-500' : 'bg-neutral-700'
                          }`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              brownNoiseEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-[#12121a] rounded-xl border border-white/10 p-5">
                    <EnrichedMarkdownRenderer 
                      content={cleanMarkdown(topico?.conteudo_gerado, topico?.titulo)}
                      fontSize={fontSize}
                      theme="classicos"
                    />
                  </div>
                </TabsContent>

                {/* ============ EXEMPLOS ============ */}
                <TabsContent value="exemplos" className="mt-0 space-y-4">
                  {exemplos.map((exemplo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#12121a] rounded-xl border border-white/10 p-5"
                    >
                      <h3 className="font-semibold text-amber-400 mb-4" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: `${fontSize + 2}px` }}>
                        {exemplo.titulo}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Situação</span>
                          <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.situacao}
                          </p>
                        </div>
                        <div className="my-4 flex items-center justify-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                          <span className="text-amber-500/40 text-xs">✦</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        </div>
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Análise</span>
                          <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.analise}
                          </p>
                        </div>
                        <div className="my-4 flex items-center justify-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                          <span className="text-amber-500/40 text-xs">✦</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        </div>
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Conclusão</span>
                          <p className="mt-2 text-amber-400 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.conclusao}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {exemplos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum exemplo disponível
                    </div>
                  )}
                </TabsContent>

                {/* ============ TERMOS ============ */}
                <TabsContent value="termos" className="mt-0 space-y-3">
                  {termos.map((termo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#12121a] rounded-xl border border-white/10 p-5"
                    >
                      <h3 className="font-semibold text-amber-400" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: `${fontSize + 2}px` }}>
                        {termo.termo}
                      </h3>
                      <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                        {termo.definicao}
                      </p>
                      {termo.origem && (
                        <p className="text-xs text-amber-500/60 mt-3 italic">
                          Origem: {termo.origem}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  {termos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum termo disponível
                    </div>
                  )}
                </TabsContent>

                {/* ============ FLASHCARDS ============ */}
                <TabsContent value="flashcards" className="mt-0">
                  {flashcards.length > 0 && flashcardAtual ? (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-gray-500">
                        {flashcardIndex + 1} de {flashcards.length}
                      </div>

                      <div className="perspective-1000">
                        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
                          {/* FRENTE */}
                          <motion.div
                            key={`front-${flashcardIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="min-h-[280px] bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent rounded-xl border-2 border-amber-500/30 p-6 flex flex-col items-center justify-center cursor-pointer"
                            onClick={() => setIsFlipped(true)}
                          >
                            <div className="text-xs text-amber-500/60 uppercase tracking-wider mb-4">Pergunta</div>
                            <p className="text-center text-lg font-medium text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                              {flashcardAtual.frente}
                            </p>
                            <p className="text-xs text-gray-500 mt-6">Toque para ver a resposta</p>
                          </motion.div>

                          {/* VERSO */}
                          <motion.div
                            key={`back-${flashcardIndex}`}
                            className="min-h-[280px] bg-gradient-to-br from-green-900/20 via-green-800/10 to-transparent rounded-xl border-2 border-green-500/30 p-6 flex flex-col cursor-pointer"
                            onClick={() => setIsFlipped(false)}
                          >
                            <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Resposta</div>
                            <p className="text-center flex-1 flex items-center justify-center font-medium text-white" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                              {flashcardAtual.verso}
                            </p>
                            
                            {flashcardAtual.exemplo && (
                              <div className="mt-4 pt-4 border-t border-green-500/20">
                                <div className="text-xs text-amber-500/70 mb-1">💡 EXEMPLO</div>
                                <p className="text-sm text-gray-400" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                                  {flashcardAtual.exemplo}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 text-center mt-4">Toque para voltar</p>
                          </motion.div>
                        </ReactCardFlip>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={anteriorFlashcard}
                          className="flex-1 py-3 bg-[#12121a] border border-white/10 text-gray-400 rounded-xl font-medium hover:bg-white/5 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={proximoFlashcard}
                          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum flashcard disponível
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Botão Flutuante de Questões */}
      {!showQuestoesCard && !isGerando && topico?.conteudo_gerado && activeTab !== 'flashcards' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (questoes.length === 0) {
              toast.info("Questões ainda não disponíveis para este tópico");
            } else {
              setShowQuestoesCard(true);
            }
          }}
          className="fixed bottom-32 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center z-50"
        >
          <Target className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Controle de Tamanho de Fonte */}
      {!showQuestoesCard && !isGerando && topico?.conteudo_gerado && activeTab !== 'flashcards' && (
        <div className="fixed bottom-32 left-4 flex flex-col gap-2 z-50">
          <button
            onClick={aumentarFonte}
            className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-colors"
          >
            <Type className="w-4 h-4 text-white" />
            <span className="text-xs text-amber-400 absolute -right-1 -top-1">+</span>
          </button>
          <button
            onClick={diminuirFonte}
            className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-colors"
          >
            <Type className="w-3 h-3 text-white" />
            <span className="text-xs text-amber-400 absolute -right-1 -top-1">−</span>
          </button>
        </div>
      )}

      {/* Card Flutuante de Questões */}
      <AnimatePresence>
        {showQuestoesCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestoesCard(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div className="bg-[#12121a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="relative h-40">
                  <img src={bgTrilhasOab} alt="Praticar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/60 to-transparent" />
                </div>
                <div className="p-5 -mt-12 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Vamos praticar?</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    São <span className="font-semibold text-white">{questoes.length} questões</span> para você praticar o que aprendeu.
                  </p>
                  <Button 
                    onClick={() => toast.info("Questões serão implementadas em breve!")} 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
                  >
                    Começar
                  </Button>
                </div>
                <button 
                  onClick={() => setShowQuestoesCard(false)} 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Ruído Marrom */}
      <Dialog open={showBrownNoiseInfo} onOpenChange={setShowBrownNoiseInfo}>
        <DialogContent className="sm:max-w-md bg-[#12121a] border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Waves className="w-5 h-5 text-amber-500" />
              O que é Ruído Marrom?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <p className="text-gray-300 text-sm leading-relaxed">
              O <span className="text-amber-400 font-medium">ruído marrom</span> é um som contínuo de baixa frequência, 
              similar ao som de uma cachoeira distante ou vento forte.
            </p>
            
            <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <h4 className="text-amber-400 font-medium text-sm mb-2">Benefícios para leitura e estudo:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Aumenta o <strong className="text-white">foco e concentração</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Mascara <strong className="text-white">ruídos distraidores</strong> do ambiente</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Especialmente útil para pessoas com <strong className="text-amber-400">TDAH</strong></span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={confirmBrownNoiseInfo}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrilhasEticaEstudo;
