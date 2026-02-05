import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ReactCardFlip from "react-card-flip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw, Loader2, Scale, ChevronDown, Share2 } from "lucide-react";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface Flashcard {
  id?: number;
  front: string;
  back: string;
  exemplo?: string;
  base_legal?: string;
  url_imagem_exemplo?: string;
  url_audio_exemplo?: string;
  "audio-pergunta"?: string;
  "audio-resposta"?: string;
}

export type StudyMode = 'imersao' | 'guiado' | 'leitura';

export interface FlashcardSettings {
  autoNarration: boolean;
  showExamples: boolean;
  studyMode?: StudyMode;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  tema?: string;
  area?: string;
  settings?: FlashcardSettings;
  tabela?: 'gerados' | 'artigos-lei';
  codigoNome?: string;
  numeroArtigo?: string;
}

const defaultSettings: FlashcardSettings = {
  autoNarration: true,
  showExamples: true,
};

export const FlashcardViewer = memo(({
  flashcards,
  tema,
  area,
  settings = defaultSettings,
  tabela = 'gerados',
  codigoNome,
  numeroArtigo,
}: FlashcardViewerProps) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingExampleAudio, setIsGeneratingExampleAudio] = useState(false);
  const [isPlayingExampleAudio, setIsPlayingExampleAudio] = useState(false);
  const [localImageUrls, setLocalImageUrls] = useState<Record<number, string>>({});
  const [localAudioUrls, setLocalAudioUrls] = useState<Record<string, string>>({});
  const [localExampleAudioUrls, setLocalExampleAudioUrls] = useState<Record<number, string>>({});
  const [localBaseLegal, setLocalBaseLegal] = useState<Record<number, string>>({});
  const [localExemplos, setLocalExemplos] = useState<Record<number, string>>({});
  const [isGeneratingBaseLegal, setIsGeneratingBaseLegal] = useState(false);
  const [isGeneratingExemplo, setIsGeneratingExemplo] = useState(false);
  const [isBaseLegalOpen, setIsBaseLegalOpen] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(settings.autoNarration);
  const [audioProgress, setAudioProgress] = useState(0);
  const [exampleAudioProgress, setExampleAudioProgress] = useState(0);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [preGeneratedCards, setPreGeneratedCards] = useState<Set<number>>(new Set());
  const { playNarration, stopNarration } = useNarrationPlayer();
  const hasGeneratedImageRef = useRef<Record<number, boolean>>({});
  const hasGeneratedBaseLegalRef = useRef<Record<number, boolean>>({});
  const hasGeneratedExemploRef = useRef<Record<number, boolean>>({});
  const hasStartedPreGeneration = useRef(false);
  const currentAudioTypeRef = useRef<'pergunta' | 'resposta' | 'exemplo' | null>(null);
  const exampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const isFlippedRef = useRef(isFlipped);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  const stopAllAudio = useCallback(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.onended = null;
      mainAudioRef.current.onerror = null;
      mainAudioRef.current.ontimeupdate = null;
      mainAudioRef.current.pause();
      mainAudioRef.current.currentTime = 0;
      mainAudioRef.current = null;
    }
    if (exampleAudioRef.current) {
      exampleAudioRef.current.onended = null;
      exampleAudioRef.current.onerror = null;
      exampleAudioRef.current.ontimeupdate = null;
      exampleAudioRef.current.pause();
      exampleAudioRef.current.currentTime = 0;
      exampleAudioRef.current = null;
    }
    stopNarration();
    setIsPlayingAudio(false);
    setIsPlayingExampleAudio(false);
    setAudioProgress(0);
    setExampleAudioProgress(0);
    currentAudioTypeRef.current = null;
  }, [stopNarration]);

  const stopAllAudioRef = useRef(stopAllAudio);
  stopAllAudioRef.current = stopAllAudio;

  useEffect(() => {
    return () => {
      stopAllAudioRef.current();
    };
  }, []);

  const playAudio = async (url: string, tipo: 'pergunta' | 'resposta' | 'exemplo', onEnded?: () => void, expectedIndex?: number, expectedFlipped?: boolean) => {
    if (!url || !narrationEnabled) return;
    
    const capturedIndex = expectedIndex ?? currentIndexRef.current;
    const capturedFlipped = expectedFlipped ?? isFlippedRef.current;
    
    stopAllAudio();
    
    if (tipo === 'exemplo') {
      setExampleAudioProgress(0);
    } else {
      setAudioProgress(0);
    }
    
    currentAudioTypeRef.current = tipo;
    
    const audio = new Audio(url);
    
    if (tipo === 'exemplo') {
      exampleAudioRef.current = audio;
      setIsPlayingExampleAudio(true);
    } else {
      mainAudioRef.current = audio;
      setIsPlayingAudio(true);
    }
    
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        const progress = (audio.currentTime / audio.duration) * 100;
        if (tipo === 'exemplo') {
          setExampleAudioProgress(progress);
        } else {
          setAudioProgress(progress);
        }
      }
    };
    
    audio.onended = () => {
      if (tipo === 'exemplo') {
        setIsPlayingExampleAudio(false);
        setExampleAudioProgress(0);
        exampleAudioRef.current = null;
      } else {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        mainAudioRef.current = null;
      }
      currentAudioTypeRef.current = null;
      
      if (onEnded && currentIndexRef.current === capturedIndex && isFlippedRef.current === capturedFlipped) {
        onEnded();
      }
    };
    audio.onerror = () => {
      if (tipo === 'exemplo') {
        setIsPlayingExampleAudio(false);
        setExampleAudioProgress(0);
        exampleAudioRef.current = null;
      } else {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        mainAudioRef.current = null;
      }
      currentAudioTypeRef.current = null;
    };
    
    try {
      await playNarration(audio);
    } catch (error) {
      try {
        await audio.play();
      } catch (playError) {
        if (tipo === 'exemplo') {
          setIsPlayingExampleAudio(false);
          setExampleAudioProgress(0);
          exampleAudioRef.current = null;
        } else {
          setIsPlayingAudio(false);
          setAudioProgress(0);
          mainAudioRef.current = null;
        }
        currentAudioTypeRef.current = null;
      }
    }
  };

  const generateAudioSilent = async (flashcardId: number, tipo: 'pergunta' | 'resposta', texto: string) => {
    return null;
  };

  const generateAudio = async (flashcardId: number, tipo: 'pergunta' | 'resposta', texto: string) => {
    return null;
  };

  const generateExampleAudio = async (flashcardId: number, texto: string) => {
    return null;
  };

  const playExampleAudio = async () => {
    console.log('🔇 Reprodução de áudio desativada temporariamente');
    return;
  };

  const generateImage = async (flashcardId: number, exemplo: string) => {
    if (hasGeneratedImageRef.current[flashcardId]) return;
    if (localImageUrls[flashcardId]) return;
    
    hasGeneratedImageRef.current[flashcardId] = true;
    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-imagem-flashcard", {
        body: { 
          flashcard_id: flashcardId, 
          exemplo,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        setLocalImageUrls(prev => ({
          ...prev,
          [flashcardId]: data.url
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      hasGeneratedImageRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateBaseLegal = async (flashcardId: number, pergunta: string, resposta: string) => {
    if (hasGeneratedBaseLegalRef.current[flashcardId]) return;
    if (localBaseLegal[flashcardId]) return;
    
    hasGeneratedBaseLegalRef.current[flashcardId] = true;
    setIsGeneratingBaseLegal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-base-legal", {
        body: { 
          flashcard_id: flashcardId, 
          pergunta,
          resposta,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined,
          area: area
        }
      });

      if (error) throw error;

      if (data?.base_legal) {
        setLocalBaseLegal(prev => ({
          ...prev,
          [flashcardId]: data.base_legal
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar base legal:", error);
      hasGeneratedBaseLegalRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingBaseLegal(false);
    }
  };

  const generateExemplo = async (flashcardId: number, pergunta: string, resposta: string, area?: string) => {
    if (hasGeneratedExemploRef.current[flashcardId]) return;
    if (localExemplos[flashcardId]) return;
    
    hasGeneratedExemploRef.current[flashcardId] = true;
    setIsGeneratingExemplo(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-exemplo-flashcard", {
        body: { 
          flashcard_id: flashcardId, 
          pergunta,
          resposta,
          area,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined
        }
      });

      if (error) throw error;

      if (data?.exemplo) {
        setLocalExemplos(prev => ({
          ...prev,
          [flashcardId]: data.exemplo
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar exemplo:", error);
      hasGeneratedExemploRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingExemplo(false);
    }
  };

  const preGenerateAllCards = async () => {
    console.log('🔇 Pré-geração de áudio desativada temporariamente');
    return;
  };

  const generateExampleAudioSilent = async (flashcardId: number, texto: string) => {
    return null;
  };

  useEffect(() => {
    if (flashcards.length > 0 && !hasStartedPreGeneration.current) {
      const timer = setTimeout(() => {
        preGenerateAllCards();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [flashcards]);

  useEffect(() => {
    if (!isFlipped || !settings.showExamples) return;
    
    const currentCard = flashcards[currentIndex];
    if (!currentCard.id) return;

    const exemplo = localExemplos[currentCard.id] || currentCard.exemplo;
    
    if (!exemplo) {
      generateExemplo(currentCard.id, currentCard.front, currentCard.back);
      return;
    }
    
    const imageUrl = localImageUrls[currentCard.id] || currentCard.url_imagem_exemplo;
    if (imageUrl) return;
    
    generateImage(currentCard.id, exemplo);
  }, [isFlipped, currentIndex, settings.showExamples, localExemplos]);

  const handleNext = useCallback(() => {
    stopAllAudio();
    setIsFlipped(false);
    setDirection('right');
    setCurrentIndex(prev => (prev + 1) % flashcards.length);
  }, [flashcards.length, stopAllAudio]);

  const handlePrevious = useCallback(() => {
    stopAllAudio();
    setIsFlipped(false);
    setDirection('left');
    setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
  }, [flashcards.length, stopAllAudio]);

  const handleFlip = useCallback(() => {
    stopAllAudio();
    setIsFlipped(prev => !prev);
    setIsBaseLegalOpen(false);
  }, [stopAllAudio]);

  const handleShare = useCallback(() => {
    const currentCard = flashcards[currentIndex];
    const currentExemplo = currentCard.id 
      ? (localExemplos[currentCard.id] || currentCard.exemplo) 
      : currentCard.exemplo;
    
    const codigoInfo = codigoNome && numeroArtigo ? `*${codigoNome} - Art. ${numeroArtigo}*\n\n` : '';
    const perguntaText = `📝 *Pergunta:*\n${currentCard.front}\n\n`;
    const respostaText = `✅ *Resposta:*\n${currentCard.back}\n\n`;
    const exemploText = currentExemplo ? `💡 *Exemplo Prático:*\n${currentExemplo}\n\n` : '';
    const footer = `_Estudando com o App Direito_ 📚`;
    
    const message = encodeURIComponent(`${codigoInfo}${perguntaText}${respostaText}${exemploText}${footer}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, [flashcards, currentIndex, localExemplos, codigoNome, numeroArtigo]);

  if (flashcards.length === 0) return null;
  
  const currentCard = flashcards[currentIndex];
  
  const imageUrl = currentCard.id 
    ? localImageUrls[currentCard.id] || currentCard.url_imagem_exemplo 
    : currentCard.url_imagem_exemplo;

  const currentExemplo = currentCard.id 
    ? (localExemplos[currentCard.id] || currentCard.exemplo) 
    : currentCard.exemplo;

  return (
    <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4 overflow-hidden">
      {/* Header com contador */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="text-sm text-muted-foreground">
          Flashcard {currentIndex + 1} de {flashcards.length}
        </div>
      </div>

      {/* Card principal com flip - CSS animation em vez de framer-motion */}
      <div 
        key={currentIndex} 
        className="animate-[fadeIn_200ms_ease-out]"
      >
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Frente - Pergunta */}
          <div 
            onClick={handleFlip} 
            className="min-h-[280px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-6 flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative break-words"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header com código/artigo e botão compartilhar */}
            {codigoNome && numeroArtigo && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[hsl(270,60%,55%)]">
                  {codigoNome} • Art. {numeroArtigo}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-[hsl(270,60%,55%)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar
                </Button>
              </div>
            )}
            
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="w-full space-y-3">
                <p className="text-lg font-semibold mb-2">{currentCard.front}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">Clique para ver a resposta</p>
          </div>

          {/* Verso - Resposta */}
          <div 
            className="min-h-[280px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow relative break-words flex flex-col overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header com código/artigo e botão compartilhar */}
            {codigoNome && numeroArtigo && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[hsl(270,60%,55%)]">
                  {codigoNome} • Art. {numeroArtigo}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-[hsl(270,60%,55%)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar
                </Button>
              </div>
            )}
            
            <div 
              onClick={handleFlip} 
              className="flex-1 flex items-center justify-center cursor-pointer"
            >
              <p className="text-foreground leading-relaxed text-sm text-center">
                {currentCard.back}
              </p>
            </div>

            {/* Botão Base Legal - apenas para flashcards gerados e apenas para admin */}
            {tabela !== 'artigos-lei' && isAdmin && (
              <div className="mt-3 relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-2 border-[hsl(270,60%,55%)]/30 hover:bg-[hsl(270,60%,55%)]/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpen = !isBaseLegalOpen;
                    setIsBaseLegalOpen(newOpen);
                    
                    if (newOpen && currentCard.id && !currentCard.base_legal && !localBaseLegal[currentCard.id]) {
                      generateBaseLegal(currentCard.id, currentCard.front, currentCard.back);
                    }
                  }}
                  disabled={isGeneratingBaseLegal}
                >
                  {isGeneratingBaseLegal ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Scale className="w-3 h-3" />
                      Base Legal
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isBaseLegalOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </Button>
                
                {/* Card flutuante de Base Legal - CSS animation */}
                {isBaseLegalOpen && (
                  <div className="mt-2 overflow-hidden animate-[slideUp_200ms_ease-out]">
                    <div className="p-3 bg-[hsl(270,60%,55%)]/10 rounded-lg border border-[hsl(270,60%,55%)]/30">
                      {isGeneratingBaseLegal ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Gerando base legal com IA...
                        </div>
                      ) : (
                        <div className="text-xs text-foreground leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                          <ReactMarkdown>
                            {currentCard.id && localBaseLegal[currentCard.id] 
                              ? localBaseLegal[currentCard.id] 
                              : currentCard.base_legal || "Clique para gerar a base legal automaticamente."}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p 
              onClick={handleFlip}
              className="text-xs text-muted-foreground text-center mt-3 cursor-pointer"
            >
              Clique para voltar
            </p>
          </div>
        </ReactCardFlip>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center gap-4">
        <Button onClick={handlePrevious} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={handleFlip} variant="ghost" size="icon">
          <RotateCw className="w-4 h-4" />
        </Button>

        <Button onClick={handleNext} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Card de exemplo prático */}
      {settings.showExamples && isFlipped && (
        <Card className="border-[hsl(270,60%,55%)]/30 bg-card/50 animate-[fadeIn_200ms_ease-out]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[hsl(270,60%,55%)] flex items-center gap-2">
                <span>💡</span> Exemplo Prático
              </p>
            </div>
            
            {isGeneratingExemplo ? (
              <div className="flex items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando exemplo prático com IA...</span>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed text-left">
                {currentCard.id ? (localExemplos[currentCard.id] || currentCard.exemplo) : currentCard.exemplo}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

FlashcardViewer.displayName = 'FlashcardViewer';
