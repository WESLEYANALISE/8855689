import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, X, Clock, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";

interface QuestaoEscrevente {
  id: number;
  Questao: number;
  Enunciado: string;
  "Alternativa A": string;
  "Alternativa B": string;
  "Alternativa C": string;
  "Alternativa D": string;
  "Alternativa E": string;
  Gabarito: string;
  Materia: string;
  Ano: number;
  Cargo: string;
  Banca: string;
  Orgao: string;
  Nivel: string;
  "Texto Português": string | null;
  Imagem: string | null;
}

const SimuladoEscreventeResolver = () => {
  const navigate = useNavigate();
  const { ano } = useParams();
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [tempoInicio] = useState(Date.now());
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [mostrarTextoBase, setMostrarTextoBase] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [feedbackAudioUrls, setFeedbackAudioUrls] = useState<{ correta?: string; incorreta?: string }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [tempoInicio]);

  // Carregar áudios de feedback
  useEffect(() => {
    const carregarAudios = async () => {
      try {
        const [resCorreta, resIncorreta] = await Promise.all([
          supabase.from('AUDIO_FEEDBACK_CACHE').select('url_audio').eq('tipo', 'correta').single(),
          supabase.from('AUDIO_FEEDBACK_CACHE').select('url_audio').eq('tipo', 'incorreta').single()
        ]);
        
        setFeedbackAudioUrls({
          correta: resCorreta.data?.url_audio,
          incorreta: resIncorreta.data?.url_audio
        });
      } catch (err) {
        console.log('Erro ao carregar áudios de feedback:', err);
      }
    };
    carregarAudios();
  }, []);

  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Buscar questões do ano selecionado
  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-escrevente-questoes", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-ESCREVENTE" as any)
        .select("*")
        .eq("Ano", parseInt(ano || "0"))
        .order("Questao", { ascending: true });

      if (error) throw error;
      return data as unknown as QuestaoEscrevente[];
    },
    enabled: !!ano
  });

  const questaoAtualData = questoes?.[questaoAtual];
  const totalQuestoes = questoes?.length || 0;
  const progresso = totalQuestoes > 0 ? ((questaoAtual + 1) / totalQuestoes) * 100 : 0;

  // Verificar se a questão tem texto base (Português)
  const temTextoBase = useMemo(() => {
    return questaoAtualData?.["Texto Português"] && questaoAtualData["Texto Português"].trim().length > 0;
  }, [questaoAtualData]);

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
    idle: { x: 0 }
  };

  // Função para reproduzir feedback de voz
  const playVoiceFeedback = (isCorrect: boolean): Promise<void> => {
    return new Promise((resolve) => {
      const url = isCorrect ? feedbackAudioUrls.correta : feedbackAudioUrls.incorreta;
      
      if (!url) {
        resolve();
        return;
      }
      
      const audio = new Audio(url);
      audio.volume = 0.8;
      
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      
      audio.play().catch(() => resolve());
    });
  };

  // Formatar texto base com quebras de linha
  const formatarTextoBase = (texto: string) => {
    if (!texto) return "";
    
    // Separar instruções do texto principal
    let textoFormatado = texto
      // Quebra dupla após instruções de leitura
      .replace(/(Leia o texto para responder (?:às|as) questões? de \d+ a \d+\.?)/gi, "$1\n\n")
      .replace(/(Leia o texto a seguir para responder (?:às|as) questões?)/gi, "$1\n\n")
      // Quebra antes de citações/referências
      .replace(/\((https?:\/\/[^)]+)\)/g, "\n\n($1)")
      .replace(/\(Adaptado\)/gi, "\n\n(Adaptado)")
      // Preservar parágrafos
      .replace(/\n\s*\n/g, "\n\n")
      // Identar citações entre aspas
      .replace(/"([^"]+)"/g, '\n\n"$1"\n\n');
    
    return textoFormatado.trim();
  };

  // Processar enunciado e alternativas para substituir [IMAGEM]
  const processarTextoComImagem = (texto: string, imagemUrl: string | null) => {
    if (!texto) return { texto: "", temImagem: false };
    
    const temImagem = /\[IMAGEM\]/gi.test(texto);
    
    if (temImagem && imagemUrl) {
      const partes = texto.split(/\[IMAGEM\]/gi);
      return {
        partes,
        imagemUrl,
        temImagem: true
      };
    }
    
    return { texto, temImagem: false };
  };

  const selecionarResposta = (letra: string) => {
    if (mostrarResultado) return;
    setRespostas((prev) => ({
      ...prev,
      [questaoAtual]: letra
    }));
  };

  const proximaQuestao = () => {
    if (questaoAtual < totalQuestoes - 1) {
      setQuestaoAtual((prev) => prev + 1);
      setMostrarResultado(false);
      setMostrarTextoBase(false);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual((prev) => prev - 1);
      setMostrarResultado(false);
      setMostrarTextoBase(false);
    }
  };

  const irParaQuestao = (index: number) => {
    setQuestaoAtual(index);
    setMostrarResultado(false);
    setMostrarTextoBase(false);
  };

  const verificarResposta = async () => {
    if (!respostas[questaoAtual]) {
      toast.error("Selecione uma alternativa");
      return;
    }
    
    const respostaCorreta = questaoAtualData?.Gabarito?.toUpperCase();
    const respostaSelecionada = respostas[questaoAtual]?.toUpperCase();
    const acertou = respostaSelecionada === respostaCorreta;
    
    // Animação de shake se errou
    if (!acertou) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    }
    
    setMostrarResultado(true);
    
    // 1. Som de beep (acerto/erro)
    await playFeedbackSound(acertou ? 'correct' : 'error');
    
    // 2. Voz "Parabéns, você acertou!" ou "Ops, você errou."
    await playVoiceFeedback(acertou);
    
    // Toast de feedback
    if (acertou) {
      toast.success("Parabéns! Você acertou! 🎉");
    } else {
      toast.error(`Ops! Você errou. A resposta correta é ${respostaCorreta}`);
    }
  };

  const finalizarSimulado = () => {
    const acertos = questoes?.filter(
      (q, idx) => respostas[idx]?.toUpperCase() === q.Gabarito?.toUpperCase()
    ).length || 0;

    navigate(`/ferramentas/simulados/escrevente/${ano}/resultado`, {
      state: {
        acertos,
        total: totalQuestoes,
        tempo: tempoDecorrido,
        respostas,
        ano
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!questaoAtualData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Nenhuma questão encontrada para {ano}</p>
        <Button onClick={() => navigate("/ferramentas/simulados/escrevente")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const alternativas = [
    { letra: "A", texto: questaoAtualData["Alternativa A"] },
    { letra: "B", texto: questaoAtualData["Alternativa B"] },
    { letra: "C", texto: questaoAtualData["Alternativa C"] },
    { letra: "D", texto: questaoAtualData["Alternativa D"] },
    { letra: "E", texto: questaoAtualData["Alternativa E"] }
  ].filter((a) => a.texto);

  const respostaCorreta = questaoAtualData.Gabarito?.toUpperCase();
  const respostaSelecionada = respostas[questaoAtual]?.toUpperCase();

  // Processar enunciado
  const enunciadoProcessado = processarTextoComImagem(
    questaoAtualData.Enunciado,
    questaoAtualData.Imagem
  );

  // Renderizar texto com imagem
  const renderizarTextoComImagem = (
    processado: ReturnType<typeof processarTextoComImagem>,
    className?: string
  ) => {
    if (processado.temImagem && 'partes' in processado && processado.partes) {
      return (
        <div className={className}>
          {processado.partes.map((parte, idx) => (
            <span key={idx}>
              <span className="whitespace-pre-wrap">{parte}</span>
              {idx < processado.partes!.length - 1 && processado.imagemUrl && (
                <div className="my-4">
                  <img
                    src={processado.imagemUrl}
                    alt="Imagem da questão"
                    className="max-w-full rounded-lg border border-border/50"
                  />
                </div>
              )}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className={cn("whitespace-pre-wrap", className)}>
        {'texto' in processado ? processado.texto : ''}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Barra de progresso e timer */}
      <div className="sticky top-0 z-10 bg-background border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/ferramentas/simulados/escrevente`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Sair
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{ano}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatarTempo(tempoDecorrido)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progresso} className="flex-1 h-2" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                {questaoAtual + 1}/{totalQuestoes}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh]">
              <SheetHeader>
                <SheetTitle>Ir para questão</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <div className="grid grid-cols-5 gap-2 pb-4">
                  {questoes?.map((q, idx) => (
                    <Button
                      key={idx}
                      variant={questaoAtual === idx ? "default" : respostas[idx] ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => irParaQuestao(idx)}
                      className={cn(
                        "h-10 w-10",
                        respostas[idx] && questaoAtual !== idx && "border-primary/50"
                      )}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Conteúdo com animação shake */}
      <motion.div 
        ref={containerRef}
        variants={shakeVariants}
        animate={shakeError ? "shake" : "idle"}
        className="flex-1 p-3 md:p-6 space-y-4 pb-28"
      >
        {/* Área/Matéria */}
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-0">
            {questaoAtualData.Materia}
          </Badge>
          {temTextoBase && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarTextoBase(!mostrarTextoBase)}
              className="text-xs gap-1"
            >
              <FileText className="w-3 h-3" />
              {mostrarTextoBase ? "Ocultar Texto" : "Ver Texto"}
              {mostrarTextoBase ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>

        {/* Texto Base (Português) - formatado */}
        {temTextoBase && mostrarTextoBase && (
          <Card className="bg-muted/30 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto para as questões
              </h4>
              <div className="text-sm leading-relaxed max-h-[50vh] overflow-y-auto prose prose-sm dark:prose-invert">
                {formatarTextoBase(questaoAtualData["Texto Português"] || "").split("\n\n").map((paragrafo, idx) => (
                  <p key={idx} className="mb-3 text-foreground/90">
                    {paragrafo}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enunciado */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Questão {questaoAtualData.Questao}
            </p>
            {renderizarTextoComImagem(enunciadoProcessado, "text-sm leading-relaxed")}
          </CardContent>
        </Card>

        {/* Alternativas */}
        <div className="space-y-2">
          {alternativas.map((alt) => {
            const isSelected = respostaSelecionada === alt.letra;
            const isCorrect = alt.letra === respostaCorreta;
            const showCorrect = mostrarResultado && isCorrect;
            const showWrong = mostrarResultado && isSelected && !isCorrect;

            // Processar alternativa para imagem
            const altProcessada = processarTextoComImagem(alt.texto, questaoAtualData.Imagem);

            return (
              <button
                key={alt.letra}
                onClick={() => selecionarResposta(alt.letra)}
                disabled={mostrarResultado}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  isSelected && !mostrarResultado && "border-primary bg-primary/10",
                  showCorrect && "border-green-500 bg-green-500/10",
                  showWrong && "border-red-500 bg-red-500/10",
                  !isSelected && !showCorrect && !showWrong && "border-border hover:border-primary/50",
                  "disabled:cursor-default"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                      isSelected && !mostrarResultado && "bg-primary text-primary-foreground",
                      showCorrect && "bg-green-500 text-white",
                      showWrong && "bg-red-500 text-white",
                      !isSelected && !showCorrect && !showWrong && "bg-muted"
                    )}
                  >
                    {showCorrect ? <Check className="w-4 h-4" /> :
                      showWrong ? <X className="w-4 h-4" /> : alt.letra}
                  </span>
                  <div className="flex-1 text-sm">
                    {renderizarTextoComImagem(altProcessada)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Footer fixo com botão Responder */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-20">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={questaoAnterior}
            disabled={questaoAtual === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {!mostrarResultado ? (
            <Button 
              onClick={verificarResposta} 
              className="flex-1"
              disabled={!respostas[questaoAtual]}
            >
              Responder
            </Button>
          ) : questaoAtual < totalQuestoes - 1 ? (
            <Button onClick={proximaQuestao} className="flex-1">
              Próxima
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finalizarSimulado} className="flex-1">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladoEscreventeResolver;