import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Volume2, 
  VolumeX, 
  Loader2,
  BookOpen,
  CheckCircle,
  XCircle,
  Plus,
  ImageIcon,
  Lightbulb,
  PlayCircle,
  Sparkles,
  Quote,
  Star,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import GeneratingResumoProgress from "./GeneratingResumoProgress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Citacao {
  autor: string;
  fala: string;
}

interface Exemplo {
  titulo: string;
  descricao: string;
  imagem_descricao?: string;
  url_imagem?: string | null;
}

interface Capitulo {
  numero?: number;
  titulo: string;
  texto: string;
  url_imagem?: string | null;
  url_audio?: string | null;
  citacoes?: Citacao[];
  pontos_chave?: string[];
  exemplo?: Exemplo | null;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: string;
  comentario: string;
}

interface ResumoCapitulos {
  introducao: Capitulo;
  capitulos: Capitulo[];
  conclusao?: Capitulo | null;
}

interface CapituloInfo {
  numero: number;
  titulo: string;
  status: 'pendente' | 'gerando' | 'concluido';
}

interface LivroResumoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  tituloLivro: string;
  autorLivro?: string;
  resumoCapitulos: ResumoCapitulos | null;
  questoesResumo: Questao[] | null;
  isLoading?: boolean;
  etapaGeracao?: 'pesquisando' | 'descoberto' | 'gerando' | 'concluido';
  capitulosGerados?: number;
  totalCapitulos?: number;
  capitulosInfo?: CapituloInfo[];
  onGerarProximoLote?: () => void;
  livroId?: number;
  biblioteca?: string;
  onImagemGerada?: (url: string, pageIndex: number) => void;
}

const LivroResumoPlayer = ({
  isOpen,
  onClose,
  tituloLivro,
  autorLivro,
  resumoCapitulos,
  questoesResumo,
  isLoading = false,
  etapaGeracao = 'pesquisando',
  capitulosGerados = 0,
  totalCapitulos = 0,
  capitulosInfo = [],
  onGerarProximoLote,
  livroId,
  biblioteca,
  onImagemGerada
}: LivroResumoPlayerProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respostaConfirmada, setRespostaConfirmada] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [questoesRespondidas, setQuestoesRespondidas] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [exemploImageLoading, setExemploImageLoading] = useState(true);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [autoplayAudio, setAutoplayAudio] = useState(() => {
    const saved = localStorage.getItem('resumo-autoplay-audio');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Salvar preferência de autoplay
  useEffect(() => {
    localStorage.setItem('resumo-autoplay-audio', JSON.stringify(autoplayAudio));
  }, [autoplayAudio]);

  // Formatar tempo em minutos:segundos
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Construir páginas (incluindo conclusão se existir)
  const paginas: Capitulo[] = resumoCapitulos ? [
    resumoCapitulos.introducao,
    ...resumoCapitulos.capitulos,
    ...(resumoCapitulos.conclusao ? [resumoCapitulos.conclusao] : [])
  ] : [];

  const totalPaginas = paginas.length + (questoesResumo?.length ? 1 : 0);
  const isQuestoesPage = currentPage >= paginas.length;
  const paginaAtual = isQuestoesPage ? null : paginas[currentPage];
  
  // Verificar se é a página de conclusão
  const isConclusaoPage = resumoCapitulos?.conclusao && currentPage === paginas.length - 1 && !isQuestoesPage;
  
  // Verificar se falta gerar mais capítulos
  const faltaGerarMais = capitulosGerados > 0 && totalCapitulos > 0 && capitulosGerados < totalCapitulos;

  // Função para gerar imagem manualmente
  const handleGerarImagem = async () => {
    if (!livroId || !biblioteca || !paginaAtual || gerandoImagem) return;
    
    setGerandoImagem(true);
    toast.loading("Gerando imagem...", { id: "gerando-imagem" });
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-imagem-capitulo', {
        body: {
          livroId,
          biblioteca,
          tituloLivro,
          autorLivro,
          tituloCapitulo: paginaAtual.titulo,
          textoCapitulo: paginaAtual.texto,
          pageIndex: currentPage
        }
      });
      
      if (error) throw error;
      
      if (data?.url_imagem) {
        toast.success("Imagem gerada com sucesso!", { id: "gerando-imagem" });
        onImagemGerada?.(data.url_imagem, currentPage);
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (err: any) {
      console.error("Erro ao gerar imagem:", err);
      toast.error("Erro ao gerar imagem", { id: "gerando-imagem" });
    } finally {
      setGerandoImagem(false);
    }
  };

  useEffect(() => {
    // Parar áudio e resetar loading da imagem ao mudar de página
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setImageLoading(true);
    setExemploImageLoading(true);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    // Scroll para o topo ao mudar de página
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Autoplay áudio quando mudar de página
  useEffect(() => {
    if (autoplayAudio && paginaAtual?.url_audio && audioRef.current && !isLoading) {
      // Pequeno delay para garantir que o áudio carregou
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // Navegadores podem bloquear autoplay
            console.log('Autoplay bloqueado pelo navegador');
          });
          setIsPlaying(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage, autoplayAudio, paginaAtual?.url_audio, isLoading]);

  useEffect(() => {
    // Resetar ao fechar
    if (!isOpen) {
      setCurrentPage(0);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
      setQuestaoAtual(0);
      setAcertos(0);
      setQuestoesRespondidas(0);
      setImageLoading(true);
      setExemploImageLoading(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isOpen]);

  const toggleAudio = () => {
    if (!audioRef.current || !paginaAtual?.url_audio) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentPage < totalPaginas - 1) {
      setCurrentPage(prev => prev + 1);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
    }
  };

  const handleConfirmarResposta = () => {
    if (!respostaSelecionada || !questoesResumo) return;
    
    const questao = questoesResumo[questaoAtual];
    const acertou = respostaSelecionada.charAt(0) === questao.correta;
    
    if (acertou) {
      setAcertos(prev => prev + 1);
    }
    setQuestoesRespondidas(prev => prev + 1);
    setRespostaConfirmada(true);
  };

  const handleProximaQuestao = () => {
    if (questaoAtual < (questoesResumo?.length || 0) - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 overflow-hidden rounded-none border-0 m-0"
        style={{ margin: 0, borderRadius: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>
                {isQuestoesPage 
                  ? `Questão ${questaoAtual + 1} de ${questoesResumo?.length || 0}`
                  : `Página ${currentPage + 1} de ${paginas.length}`
                }
              </span>
            </div>
            {faltaGerarMais && (
              <span className="text-xs text-accent">
                {capitulosGerados}/{totalCapitulos} capítulos gerados
              </span>
            )}
          </div>
          {/* Toggle Autoplay */}
          <div className="flex items-center gap-2">
            <PlayCircle className={cn("w-4 h-4", autoplayAudio ? "text-accent" : "text-muted-foreground")} />
            <Switch
              checked={autoplayAudio}
              onCheckedChange={setAutoplayAudio}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {isLoading ? (
            <GeneratingResumoProgress
              tituloLivro={tituloLivro}
              autorLivro={autorLivro}
              etapa={etapaGeracao}
              totalCapitulos={totalCapitulos}
              capitulosGerados={capitulosGerados}
              capitulosInfo={capitulosInfo}
            />
          ) : isQuestoesPage && questoesResumo ? (
            // Página de questões
            <div className="p-4 space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Teste seu conhecimento</h2>
                <p className="text-muted-foreground">
                  Acertos: {acertos}/{questoesRespondidas}
                </p>
              </div>

              <div className="bg-card/50 rounded-xl p-6 border border-border">
                <p className="text-lg font-medium mb-6">
                  {questoesResumo[questaoAtual].pergunta}
                </p>

                <div className="space-y-3">
                  {questoesResumo[questaoAtual].alternativas.map((alt, idx) => {
                    const letra = alt.charAt(0);
                    const isSelected = respostaSelecionada === alt;
                    const isCorreta = letra === questoesResumo[questaoAtual].correta;
                    const showResult = respostaConfirmada;

                    return (
                      <button
                        key={idx}
                        onClick={() => !respostaConfirmada && setRespostaSelecionada(alt)}
                        disabled={respostaConfirmada}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border transition-all",
                          !showResult && isSelected && "border-accent bg-accent/10",
                          !showResult && !isSelected && "border-border hover:border-accent/50",
                          showResult && isCorreta && "border-green-500 bg-green-500/10",
                          showResult && isSelected && !isCorreta && "border-red-500 bg-red-500/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {showResult && isCorreta && (
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          )}
                          {showResult && isSelected && !isCorreta && (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          <span>{alt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {respostaConfirmada && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg animate-fade-in">
                    <p className="text-sm font-medium mb-2">Comentário:</p>
                    <p className="text-sm text-muted-foreground">
                      {questoesResumo[questaoAtual].comentario}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  {!respostaConfirmada ? (
                    <Button 
                      onClick={handleConfirmarResposta}
                      disabled={!respostaSelecionada}
                    >
                      Confirmar
                    </Button>
                  ) : questaoAtual < questoesResumo.length - 1 ? (
                    <Button onClick={handleProximaQuestao}>
                      Próxima questão
                    </Button>
                  ) : (
                    <div className="text-center w-full">
                      <p className="text-lg font-medium mb-2">
                        Você completou o resumo!
                      </p>
                      <p className="text-muted-foreground">
                        Resultado final: {acertos}/{questoesResumo.length} acertos
                      </p>
                      <Button onClick={onClose} className="mt-4">
                        Fechar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : paginaAtual ? (
            // Página de conteúdo
            <div key={currentPage} className="animate-fade-in">
              {/* Imagem no topo - ocupa largura total */}
              {paginaAtual.url_imagem ? (
                <div className="relative w-full aspect-video bg-muted">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                  )}
                  <img
                    src={paginaAtual.url_imagem}
                    alt={paginaAtual.titulo}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-300",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-accent/20 to-primary/20 flex flex-col items-center justify-center gap-4">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Imagem não gerada</p>
                  </div>
                  {livroId && biblioteca && (
                    <Button 
                      onClick={handleGerarImagem}
                      disabled={gerandoImagem}
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                    >
                      {gerandoImagem ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {gerandoImagem ? "Gerando..." : "Gerar imagem"}
                    </Button>
                  )}
                </div>
              )}

              {/* Conteúdo com padding */}
              <div className="p-4 space-y-5 max-w-2xl mx-auto">
                {/* Título */}
                <h2 className="text-2xl font-bold">{paginaAtual.titulo}</h2>

                {/* Player de áudio */}
                {paginaAtual.url_audio && (
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl border border-accent/30">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={toggleAudio}
                      className="shrink-0 h-10 w-10"
                    >
                      {isPlaying ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">
                        {isPlaying ? "Pausar narração" : "🎧 Ouvir narração"}
                      </span>
                      {audioDuration > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                        </span>
                      )}
                    </div>
                    {/* Barra de progresso */}
                    {audioDuration > 0 && (
                      <div 
                        className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer max-w-[120px]"
                        onClick={(e) => {
                          if (!audioRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          audioRef.current.currentTime = percentage * audioDuration;
                        }}
                      >
                        <div 
                          className="h-full bg-accent transition-all duration-100"
                          style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                        />
                      </div>
                    )}
                    <audio
                      ref={audioRef}
                      src={paginaAtual.url_audio}
                      onEnded={() => setIsPlaying(false)}
                      onLoadedMetadata={() => {
                        if (audioRef.current) {
                          setAudioDuration(audioRef.current.duration);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setAudioCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  </div>
                )}

                {/* Citações destacadas */}
                {paginaAtual.citacoes && paginaAtual.citacoes.length > 0 && (
                  <div className="space-y-3">
                    {paginaAtual.citacoes.map((citacao, idx) => (
                      <div 
                        key={idx} 
                        className="bg-accent/10 border-l-4 border-accent rounded-r-lg p-4 relative"
                      >
                        <Quote className="w-5 h-5 text-accent/40 absolute top-3 right-3" />
                        <p className="italic text-foreground pr-6 leading-relaxed">
                          "{citacao.fala}"
                        </p>
                        <p className="text-sm text-accent font-medium mt-2">
                          — {citacao.autor}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Texto principal */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="text-muted-foreground leading-relaxed text-base space-y-4">
                    {paginaAtual.texto.split(/\n\n+/).map((paragrafo, idx) => (
                      <p key={idx} className="whitespace-pre-wrap">
                        {paragrafo}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Pontos-Chave */}
                {paginaAtual.pontos_chave && paginaAtual.pontos_chave.length > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
                      <Star className="w-4 h-4" />
                      Pontos-Chave
                    </h4>
                    <ul className="space-y-2">
                      {paginaAtual.pontos_chave.map((ponto, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exemplo Prático (se existir) */}
                {paginaAtual.exemplo && paginaAtual.exemplo.descricao && (
                  <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-4 text-accent">
                      <Lightbulb className="w-5 h-5" />
                      {paginaAtual.exemplo.titulo || "Exemplo Prático"}
                    </h3>
                    
                    {/* Imagem do exemplo */}
                    {paginaAtual.exemplo.url_imagem && (
                      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                        {exemploImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <Loader2 className="w-6 h-6 animate-spin text-accent" />
                          </div>
                        )}
                        <img
                          src={paginaAtual.exemplo.url_imagem}
                          alt="Ilustração do exemplo"
                          className={cn(
                            "w-full h-full object-cover transition-opacity duration-300",
                            exemploImageLoading ? "opacity-0" : "opacity-100"
                          )}
                          onLoad={() => setExemploImageLoading(false)}
                          onError={() => setExemploImageLoading(false)}
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {paginaAtual.exemplo.descricao}
                    </p>
                  </div>
                )}

                {/* Botão para gerar mais capítulos */}
                {faltaGerarMais && currentPage === paginas.length - 1 && onGerarProximoLote && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={onGerarProximoLote}
                      className="w-full"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Gerar próximos 5 capítulos ({capitulosGerados}/{totalCapitulos})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Navigation */}
        {!isLoading && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="min-w-[100px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {/* Progress indicator */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[40%] px-2">
              {paginas.length <= 10 ? (
                // Dots para poucos capítulos
                Array.from({ length: totalPaginas }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentPage(idx);
                      setRespostaSelecionada(null);
                      setRespostaConfirmada(false);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all shrink-0",
                      idx === currentPage 
                        ? "bg-accent w-4" 
                        : "bg-muted hover:bg-muted-foreground/50"
                    )}
                  />
                ))
              ) : (
                // Número para muitos capítulos
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPaginas}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentPage === totalPaginas - 1}
              className="min-w-[100px]"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LivroResumoPlayer;
