import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  List, 
  Type,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  CheckCircle2,
  Play,
  Layers,
  Lock,
  Target,
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import ConceitosToolsDrawer from "./ConceitosToolsDrawer";
import FlashcardStack from "./FlashcardStack";

interface Flashcard {
  pergunta: string;
  resposta: string;
}

interface Topico {
  numero: number;
  titulo: string;
  conteudo: string;
  flashcards?: Flashcard[];
  ehIntroducao?: boolean;
  ehSinteseEspecial?: boolean;
}

interface ConceitosReaderProps {
  conteudoGerado: string;
  titulo: string;
  materia?: string;
  capaUrl?: string;
  exemplos: any[];
  termos: any[];
  flashcards: any[];
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onQuestoesClick?: () => void;
  onFlashcardsClick?: () => void;
  hasQuestoes?: boolean;
  hasFlashcards?: boolean;
  topicoId?: number;
  onReadingStateChange?: (isReading: boolean) => void;
  progressoFlashcards?: number;
  progressoQuestoes?: number;
}

// Função para extrair flashcards de um conteúdo
const extrairFlashcardsDoConteudo = (conteudo: string): { conteudoLimpo: string; flashcards: Flashcard[] } => {
  const flashcardsMatch = conteudo.match(/```json-flashcards\s*([\s\S]*?)```/);
  
  if (!flashcardsMatch) {
    return { conteudoLimpo: conteudo, flashcards: [] };
  }
  
  try {
    const flashcardsJson = flashcardsMatch[1].trim();
    const flashcards = JSON.parse(flashcardsJson);
    const conteudoLimpo = conteudo.replace(/```json-flashcards\s*[\s\S]*?```/g, '').trim();
    return { conteudoLimpo, flashcards };
  } catch (e) {
    console.error("Erro ao parsear flashcards:", e);
    return { conteudoLimpo: conteudo, flashcards: [] };
  }
};

// Função para extrair capítulos do markdown - cada ## vira uma "página" no reader
// EXCETO seções técnicas que devem ficar integradas ao conteúdo
const SECOES_INTEGRADAS = [
  'aprofundamento de termos',
  'aprofundamento',
  'flashcards',
  'resumo',
  'conclusão',
  'quadro comparativo',
  'dica de prova',
  'você sabia',
  'caso prático',
  'em resumo'
];

// Seções que devem ser páginas separadas especiais (sem número de tópico)
const SECOES_ESPECIAIS = [
  'síntese final',
  'síntese'
];

// Verificar se o conteúdo é apenas um título/header sem conteúdo real
const isApenasHeader = (conteudo: string): boolean => {
  // Remove espaços, quebras de linha e markdown de headers
  const limpo = conteudo
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Se tem menos de 100 caracteres, provavelmente é só título
  // Ou se é só um título sem parágrafos
  if (limpo.length < 100) return true;
  
  // Verificar se não tem parágrafos reais (apenas títulos)
  const linhas = conteudo.split('\n').filter(l => l.trim());
  const linhasConteudo = linhas.filter(l => !l.trim().startsWith('#') && l.trim().length > 20);
  
  return linhasConteudo.length < 2;
};

const extrairTopicos = (markdown: string, tituloTopico: string): Topico[] => {
  if (!markdown) return [];
  
  // Limpar markdown
  let cleaned = markdown.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.replace(/^```markdown\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();
  
  // Remover título principal duplicado
  if (tituloTopico) {
    const tituloEscapado = tituloTopico.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}\\s*\\n+`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}[:\\-–—].*\\n+`, 'i'), '');
  }
  
  // Tentar dividir por ### primeiro (subtópicos numerados como "### 1. Título")
  // Se não houver ###, fallback para ##
  const temSubtopicos = /^### \d+\./gm.test(cleaned);
  const delimitador = temSubtopicos ? /^### /gm : /^## /gm;
  
  const secoes = cleaned.split(delimitador);
  
  const topicos: Topico[] = [];
  let conteudoIntroducao = "";
  let sinteseConteudo = "";
  
  secoes.forEach((secao, index) => {
    if (index === 0) {
      // Conteúdo antes do primeiro delimitador (introdução)
      const conteudoLimpo = secao.trim();
      // Verificar se tem conteúdo real, não apenas um título
      if (conteudoLimpo.length > 50 && !isApenasHeader(conteudoLimpo)) {
        conteudoIntroducao = conteudoLimpo;
      }
      return;
    }
    
    const linhas = secao.split('\n');
    const tituloRaw = linhas[0].trim();
    // Remover número do início (ex: "1. Jusnaturalismo" -> "Jusnaturalismo")
    const titulo = tituloRaw.replace(/^\d+\.\s*/, '').trim();
    const tituloLower = titulo.toLowerCase().replace(/[🔍🃏📌💡💼🎯⚠️]/g, '').trim();
    const conteudoBruto = linhas.slice(1).join('\n').trim();
    
    // Verificar se é seção integrada (não deve ser tópico separado)
    const ehSecaoIntegrada = SECOES_INTEGRADAS.some(s => tituloLower.includes(s));
    
    // Verificar se é seção especial (Síntese Final - página separada sem número)
    const ehSecaoEspecial = SECOES_ESPECIAIS.some(s => tituloLower.includes(s));
    
    if (ehSecaoEspecial && conteudoBruto.length > 30) {
      // Guardar síntese para adicionar no final
      sinteseConteudo = conteudoBruto;
    } else if (ehSecaoIntegrada) {
      // Adicionar ao último tópico se existir
      if (topicos.length > 0) {
        topicos[topicos.length - 1].conteudo += `\n\n## ${titulo}\n${conteudoBruto}`;
      }
    } else if (titulo && conteudoBruto.length > 30 && !isApenasHeader(conteudoBruto)) {
      // Criar novo tópico - apenas se tiver conteúdo real
      const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(conteudoBruto);
      topicos.push({
        numero: topicos.length + 1,
        titulo: titulo,
        conteudo: conteudoLimpo,
        flashcards
      });
    }
  });
  
  // Se temos introdução e pelo menos um tópico, adicionar introdução como primeiro
  if (conteudoIntroducao && topicos.length > 0) {
    const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(conteudoIntroducao);
    topicos.unshift({
      numero: 0,
      titulo: "Introdução",
      conteudo: conteudoLimpo,
      flashcards,
      ehIntroducao: true
    });
    // Renumerar
    topicos.forEach((t, i) => t.numero = i + 1);
  }
  
  // Adicionar síntese final como última página especial
  if (sinteseConteudo) {
    const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(sinteseConteudo);
    topicos.push({
      numero: topicos.length + 1,
      titulo: "Síntese Final",
      conteudo: conteudoLimpo,
      flashcards,
      ehSinteseEspecial: true
    });
  }
  
  // Se não conseguiu dividir, retorna conteúdo inteiro como único tópico
  return topicos.length > 0 ? topicos : [{
    numero: 1,
    titulo: "Conteúdo",
    conteudo: cleaned
  }];
};

const ConceitosReader = ({
  conteudoGerado,
  titulo,
  materia,
  capaUrl,
  exemplos,
  termos,
  flashcards,
  fontSize,
  onFontSizeChange,
  onQuestoesClick,
  onFlashcardsClick,
  hasQuestoes = false,
  hasFlashcards = false,
  topicoId,
  onReadingStateChange,
  progressoFlashcards = 0,
  progressoQuestoes = 0
}: ConceitosReaderProps) => {
  const { user } = useAuth();
  const [mostrarTelaBoasVindas, setMostrarTelaBoasVindas] = useState(true);
  const [mostrarIndice, setMostrarIndice] = useState(false);
  const [topicoAtual, setTopicoAtual] = useState(1);
  const [mostrarCapaTopico, setMostrarCapaTopico] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);
  const [brownNoiseInfoDismissed, setBrownNoiseInfoDismissed] = useState(() => {
    return localStorage.getItem('brownNoiseInfoDismissed') === 'true';
  });
  const [leituraCompleta, setLeituraCompleta] = useState(false);
  const [progressoLeitura, setProgressoLeitura] = useState(0); // 0-100
  const [flashcardsCompletos, setFlashcardsCompletos] = useState(false);
  const [praticaCompleta, setPraticaCompleta] = useState(false);
  const [progressoCarregado, setProgressoCarregado] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const brownNoiseRef = useRef<HTMLAudioElement | null>(null);

  // Carregar progresso salvo do banco de dados
  useEffect(() => {
    const carregarProgresso = async () => {
      if (!user?.id || !topicoId) {
        setProgressoCarregado(true);
        return;
      }
      
      try {
        const { data, error } = await (supabase as any)
          .from('conceitos_topicos_progresso')
          .select('*')
          .eq('user_id', user.id)
          .eq('topico_id', topicoId)
          .single();
        
        if (data && !error) {
          setLeituraCompleta(data.leitura_completa || false);
          setFlashcardsCompletos(data.flashcards_completos || false);
          setPraticaCompleta(data.pratica_completa || false);
          setProgressoLeitura(data.progresso_porcentagem || 0);
          // Posicionar no último tópico lido se houver progresso
          if (data.ultimo_topico_lido && data.ultimo_topico_lido > 1) {
            setTopicoAtual(data.ultimo_topico_lido);
          }
        }
      } catch (e) {
        // Não há progresso salvo ainda, ignorar erro
      }
      setProgressoCarregado(true);
    };
    
    carregarProgresso();
  }, [user?.id, topicoId]);

  // Notificar mudança de estado de leitura para o componente pai
  useEffect(() => {
    onReadingStateChange?.(!mostrarTelaBoasVindas);
  }, [mostrarTelaBoasVindas, onReadingStateChange]);

  // Função para voltar para a tela de boas-vindas (exposta via ref seria ideal, mas simplificando)
  const voltarParaBoasVindas = useCallback(() => {
    setMostrarTelaBoasVindas(true);
    setMostrarCapaTopico(false);
  }, []);

  // Função para salvar progresso no banco de dados
  const salvarProgresso = useCallback(async (dados: {
    progresso_porcentagem?: number;
    leitura_completa?: boolean;
    flashcards_completos?: boolean;
    ultimo_topico_lido?: number;
  }) => {
    if (!user?.id || !topicoId) return;
    
    try {
      await (supabase as any)
        .from('conceitos_topicos_progresso')
        .upsert({
          user_id: user.id,
          topico_id: topicoId,
          ...dados,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,topico_id'
        });
    } catch (e) {
      console.error('Erro ao salvar progresso:', e);
    }
  }, [user?.id, topicoId]);

  // Inicializa áudio de ruído marrom
  useEffect(() => {
    const brownNoise = new Audio('/audio/ruido-marrom.mp3');
    brownNoise.loop = true;
    brownNoise.volume = 0.3;
    brownNoiseRef.current = brownNoise;

    return () => {
      brownNoise.pause();
      brownNoise.src = '';
    };
  }, []);

  // Controla reprodução do ruído marrom
  useEffect(() => {
    if (brownNoiseRef.current) {
      if (brownNoiseEnabled && !mostrarTelaBoasVindas) {
        brownNoiseRef.current.play().catch(console.error);
      } else {
        brownNoiseRef.current.pause();
      }
    }
  }, [brownNoiseEnabled, mostrarTelaBoasVindas]);

  // Mostrar card explicativo quando ativar brown noise pela primeira vez
  useEffect(() => {
    if (brownNoiseEnabled && !brownNoiseInfoDismissed) {
      setShowBrownNoiseInfo(true);
    }
  }, [brownNoiseEnabled, brownNoiseInfoDismissed]);

  const handleDismissBrownNoiseInfo = () => {
    setShowBrownNoiseInfo(false);
    setBrownNoiseInfoDismissed(true);
    localStorage.setItem('brownNoiseInfoDismissed', 'true');
  };

  const topicos = extrairTopicos(conteudoGerado, titulo);
  const topicoData = topicos[topicoAtual - 1];
  const totalTopicos = topicos.length;
  const progressPercent = (topicoAtual / totalTopicos) * 100;

  // Touch handlers para swipe - DESABILITADO
  // A navegação agora é apenas via botões do footer
  const handleTouchStart = (e: React.TouchEvent) => {
    // Swipe desabilitado - navegação apenas por botões
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Swipe desabilitado - navegação apenas por botões
  };

  // Som de página sendo virada - usando o mesmo áudio da Leitura Dinâmica
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Criar elemento de áudio para som de página (mesmo da Biblioteca de Clássicos)
    const audio = new Audio('https://files.catbox.moe/g2jrb7.mp3');
    audio.volume = 0.4;
    audio.preload = 'auto';
    pageTurnAudioRef.current = audio;
    
    return () => {
      if (pageTurnAudioRef.current) {
        pageTurnAudioRef.current = null;
      }
    };
  }, []);

  const irParaTopico = useCallback((num: number, dir?: 'left' | 'right') => {
    if (num < 1 || num > totalTopicos) return;
    
    // Tocar som de página sendo virada
    if (pageTurnAudioRef.current) {
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.play().catch(() => {});
    }
    
    setDirection(dir || (num > topicoAtual ? 'left' : 'right'));
    setTopicoAtual(num);
    
    // Atualizar progresso de leitura
    const novoProgresso = Math.round((num / totalTopicos) * 100);
    setProgressoLeitura(prev => Math.max(prev, novoProgresso));
    
    // Marcar leitura como completa ao chegar no último tópico
    const completou = num === totalTopicos;
    if (completou) {
      setLeituraCompleta(true);
    }
    
    // Salvar progresso no banco de dados
    salvarProgresso({
      progresso_porcentagem: novoProgresso,
      leitura_completa: completou,
      ultimo_topico_lido: num
    });
    
    // Verificar se é introdução ou síntese (não mostrar capa para eles)
    const proximoTopico = topicos[num - 1];
    const pularCapa = proximoTopico?.ehIntroducao || proximoTopico?.ehSinteseEspecial;
    
    // Mostrar capa do tópico - apenas para tópicos normais
    setMostrarCapaTopico(!pularCapa);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [topicoAtual, totalTopicos, topicos, salvarProgresso]);

  const iniciarLeitura = () => {
    setMostrarTelaBoasVindas(false);
    setTopicoAtual(1);
    // Atualizar progresso inicial
    setProgressoLeitura(prev => Math.max(prev, Math.round((1 / totalTopicos) * 100)));
  };

  const handleLockedItemClick = (item: string) => {
    toast.info(
      `Complete a leitura para desbloquear ${item}`,
      {
        description: "Você precisa ler todo o conteúdo antes de acessar esta atividade.",
        duration: 4000
      }
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mostrarTelaBoasVindas) return;
      
      if (e.key === 'ArrowRight' && topicoAtual < totalTopicos) {
        irParaTopico(topicoAtual + 1, 'left');
      } else if (e.key === 'ArrowLeft' && topicoAtual > 1) {
        irParaTopico(topicoAtual - 1, 'right');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topicoAtual, totalTopicos, mostrarTelaBoasVindas]);

  // Animação de slide horizontal
  const pageVariants = {
    enter: (direction: string) => ({
      x: direction === 'left' ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      x: direction === 'left' ? '-100%' : '100%',
      opacity: 0
    })
  };

  // Tela de boas-vindas
  if (mostrarTelaBoasVindas) {
    return (
      <div className="min-h-screen flex flex-col pb-6">
        {/* Conteúdo scrollável */}
        <div className="flex-1 flex flex-col items-center px-4 py-8">
          {/* Capa */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mb-6"
          >
            {capaUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                <img 
                  src={capaUrl} 
                  alt={titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-amber-900/40 via-neutral-900/60 to-amber-900/40 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-amber-500/50" />
              </div>
            )}
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
              <span className="text-amber-400 text-xl">✦</span>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              {titulo}
            </h1>
            
            {materia && (
              <p className="text-amber-400/80 text-sm font-medium">{materia}</p>
            )}
            
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
              <span className="text-amber-400 text-xl">✦</span>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
            </div>
          </motion.div>

          {/* Badge de capítulos + Ruído Marrom - lado a lado */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => setMostrarIndice(!mostrarIndice)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
            >
              <List className="w-4 h-4 text-amber-400" />
              <span className="text-white/80 text-sm">
                {totalTopicos} tópicos
              </span>
            </button>
            
            {/* Ruído Marrom - ao lado dos tópicos */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              {brownNoiseEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-white/80 text-sm">Ruído Marrom</span>
              <Switch
                checked={brownNoiseEnabled}
                onCheckedChange={setBrownNoiseEnabled}
                className="data-[state=checked]:bg-amber-500 scale-90"
              />
            </div>
          </motion.div>

          {/* Índice de tópicos */}
          <AnimatePresence>
            {mostrarIndice && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mb-6 overflow-hidden"
              >
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-medium text-white">Índice</p>
                  </div>
                  
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                    {topicos.map((top, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTopicoAtual(top.numero);
                          setMostrarTelaBoasVindas(false);
                        }}
                        className="w-full flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-amber-400/60 font-mono text-xs w-6 flex-shrink-0">
                          {String(top.numero).padStart(2, '0')}
                        </span>
                        <span className="text-white/80 flex-1 truncate text-xs">
                          {top.titulo}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Container responsivo: lado a lado em telas maiores */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-3xl flex flex-col lg:flex-row gap-4 mb-6 px-2"
          >
            {/* Coluna Esquerda: 3 ITENS ORDENADOS */}
            <div className="flex-1 space-y-3">
              {/* 1. Começar Leitura - SEMPRE ATIVO */}
              <button
                onClick={iniciarLeitura}
                className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/30">
                    1
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-semibold">Começar Leitura</span>
                    </div>
                    {progressoLeitura > 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progressoLeitura} className="h-1.5 flex-1 bg-white/10" />
                        <span className="text-xs text-amber-400 font-medium">{progressoLeitura}%</span>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 mt-0.5">Leia todo o conteúdo do tópico</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* 2. Flashcards - BLOQUEADO ATÉ COMPLETAR LEITURA */}
              <button
                onClick={() => {
                  if (leituraCompleta && onFlashcardsClick) {
                    onFlashcardsClick();
                  } else if (!leituraCompleta) {
                    handleLockedItemClick("os Flashcards");
                  }
                }}
                className={`w-full rounded-xl p-4 transition-all group ${
                  leituraCompleta 
                    ? "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40" 
                    : "bg-white/5 border border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                    leituraCompleta 
                      ? "bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30" 
                      : "bg-white/10 text-white/40"
                  }`}>
                    {flashcardsCompletos ? <CheckCircle2 className="w-5 h-5" /> : "2"}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span className={`font-semibold ${leituraCompleta ? "text-white" : "text-white/50"}`}>
                        Flashcards
                      </span>
                      {!leituraCompleta && <Lock className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                    {leituraCompleta && flashcardsCompletos ? (
                      <p className="text-xs mt-0.5 text-purple-400 font-medium">✓ Completo</p>
                    ) : leituraCompleta ? (
                      <p className="text-xs mt-0.5 text-white/60">Revise com cartões de memória</p>
                    ) : (
                      <p className="text-xs mt-0.5 text-white/30">Complete a leitura para desbloquear</p>
                    )}
                    {/* Barra de progresso dos Flashcards */}
                    {leituraCompleta && !flashcardsCompletos && progressoFlashcards > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progressoFlashcards}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-purple-400 mt-1">{progressoFlashcards}% concluído</p>
                      </div>
                    )}
                  </div>
                  {leituraCompleta && (
                    <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </button>

              {/* 3. Praticar - BLOQUEADO ATÉ COMPLETAR FLASHCARDS */}
              <button
                onClick={() => {
                  if (flashcardsCompletos && hasQuestoes && onQuestoesClick) {
                    onQuestoesClick();
                  } else if (!flashcardsCompletos) {
                    handleLockedItemClick("as Questões. Complete os Flashcards primeiro");
                  } else {
                    toast.info("Questões ainda não disponíveis para este tópico");
                  }
                }}
                className={`w-full rounded-xl p-4 transition-all group ${
                  flashcardsCompletos 
                    ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40" 
                    : "bg-white/5 border border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                    flashcardsCompletos 
                      ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "bg-white/10 text-white/40"
                  }`}>
                    {praticaCompleta ? <CheckCircle2 className="w-5 h-5" /> : "3"}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className={`font-semibold ${flashcardsCompletos ? "text-white" : "text-white/50"}`}>
                        Praticar
                      </span>
                      {!flashcardsCompletos && <Lock className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                    {flashcardsCompletos && praticaCompleta ? (
                      <p className="text-xs mt-0.5 text-emerald-400 font-medium">✓ Completo</p>
                    ) : flashcardsCompletos ? (
                      <p className="text-xs mt-0.5 text-white/60">Teste seus conhecimentos</p>
                    ) : (
                      <p className="text-xs mt-0.5 text-white/30">Complete os flashcards para desbloquear</p>
                    )}
                    {/* Barra de progresso das Questões */}
                    {flashcardsCompletos && !praticaCompleta && progressoQuestoes > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
                            style={{ width: `${progressoQuestoes}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-1">{progressoQuestoes}% concluído</p>
                      </div>
                    )}
                  </div>
                  {flashcardsCompletos && (
                    <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Card Flutuante Ruído Marrom */}
          <AnimatePresence>
            {showBrownNoiseInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                onClick={handleDismissBrownNoiseInfo}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="w-full max-w-sm bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-900/30 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Capa com imagem */}
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src="/assets/ruido-marrom-cover.webp"
                      alt="Pessoa lendo concentrada"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="p-2 bg-amber-500/20 rounded-lg backdrop-blur-sm">
                        <Volume2 className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-400" />
                      O que é Ruído Marrom?
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">
                      O <strong className="text-amber-300">ruído marrom</strong> é um som de baixa frequência que ajuda a melhorar a concentração e foco durante a leitura. 
                      Diferente do ruído branco, ele tem frequências mais graves, lembrando o som de uma cachoeira distante ou vento forte.
                    </p>
                    
                    {/* Tags de benefícios */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/15 rounded-full text-xs text-amber-300 border border-amber-500/20">
                        🧠 Melhora o foco
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/15 rounded-full text-xs text-amber-300 border border-amber-500/20">
                        😌 Reduz ansiedade
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/15 rounded-full text-xs text-amber-300 border border-amber-500/20">
                        🎯 Aumenta produtividade
                      </span>
                    </div>

                    {/* Botão Entendi */}
                    <Button
                      onClick={handleDismissBrownNoiseInfo}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-amber-500/25"
                    >
                      Entendi
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Tela de capa do tópico (antes do conteúdo)
  if (mostrarCapaTopico && !mostrarTelaBoasVindas) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Background com capa */}
        <div className="absolute inset-0">
          {capaUrl ? (
            <>
              <img 
                src={capaUrl} 
                alt={titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/80 to-[#0a0a12]/40" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900/40 via-[#0a0a12] to-amber-900/40" />
          )}
        </div>

        {/* Conteúdo da capa */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          {/* Indicador de tópico - não mostrar para síntese especial */}
          {!topicoData?.ehSinteseEspecial && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <span className="text-amber-400/70 text-sm uppercase tracking-[0.3em] font-medium">
                Tópico {topicoData?.numero} de {totalTopicos}
              </span>
            </motion.div>
          )}

          {/* Decoração */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-400 text-2xl">✦</span>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
          </div>
          
          {/* Título do tópico */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
          >
            {topicoData?.titulo}
          </motion.h1>

          {/* Decoração */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-400 text-2xl">✦</span>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
          </div>

          {/* Barra decorativa */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-8 max-w-xs mx-auto"
          />
        </motion.div>

        {/* Botão continuar - FIXO no bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/90 to-transparent"
        >
          <button
            onClick={() => setMostrarCapaTopico(false)}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
          >
            Continuar Leitura →
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Tela de leitura
  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Área de conteúdo */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={topicoAtual}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.2 }
            }}
            className="min-h-full px-4 sm:px-6 py-6"
          >
            <div className="max-w-2xl mx-auto">
              {/* Header do tópico */}
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                  <span className="text-amber-400 text-sm">✦</span>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                </div>
                
                {/* Mostrar "Tópico X" apenas para tópicos normais (não introdução/síntese) */}
                {!topicoData?.ehIntroducao && !topicoData?.ehSinteseEspecial && (
                  <span className="text-amber-400/70 text-xs uppercase tracking-[0.2em] font-medium mb-2">
                    Tópico {topicoData?.ehIntroducao ? '' : (topicoData?.ehSinteseEspecial ? '' : topicoData?.numero)}
                  </span>
                )}
                
                <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {topicoData?.titulo}
                </h2>
                
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                  <span className="text-amber-400 text-sm">✦</span>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                </div>
              </div>

              {/* Conteúdo do tópico */}
              {(() => {
                // Detecta se é uma seção de linha do tempo para desabilitar termos
                const isLinhaTempo = topicoData?.titulo?.toLowerCase().match(
                  /linha do tempo|cronologia|evolução histórica|história|evolução|histórico/
                );
                
                return (
                  <div className="bg-[#12121a] rounded-xl border border-white/10 p-5">
                    <EnrichedMarkdownRenderer 
                      content={topicoData?.conteudo || ""}
                      fontSize={fontSize}
                      theme="classicos"
                      disableTermos={!!isLinhaTempo}
                    />
                  </div>
                );
              })()}

              {/* Flashcards do tópico */}
              {topicoData?.flashcards && topicoData.flashcards.length > 0 && (
                <div className="mt-8">
                  <FlashcardStack 
                    flashcards={topicoData.flashcards}
                    titulo={`Revise: ${topicoData.titulo}`}
                  />
                </div>
              )}

              {/* Mensagem de conclusão - aparece só no último tópico */}
              {topicoAtual === totalTopicos && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  <div className="text-center">
                    <p className="text-amber-400/70 text-sm mb-2">🎉 Você concluiu toda a leitura!</p>
                    <p className="text-gray-400 text-xs">Revise os flashcards acima para fixar o conteúdo</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Sheet de Índice */}
      <AnimatePresence>
        {mostrarIndice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setMostrarIndice(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-[#12121a] rounded-t-3xl border-t border-amber-500/30 max-h-[70vh] overflow-hidden"
            >
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="px-4 pb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-amber-400" />
                  Índice de Tópicos
                </h3>
              </div>
              <div className="overflow-y-auto max-h-[55vh] px-4 pb-6">
                {topicos.map((topico, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      irParaTopico(topico.numero, topico.numero > topicoAtual ? 'left' : 'right');
                      setMostrarIndice(false);
                    }}
                    className={`w-full text-left py-3 px-4 rounded-xl mb-2 transition-all flex items-center gap-3 ${
                      topicoAtual === topico.numero
                        ? 'bg-amber-500/20 border border-amber-500/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-sm font-bold min-w-[24px] ${
                      topicoAtual === topico.numero ? 'text-amber-400' : 'text-white/50'
                    }`}>
                      {topico.numero}
                    </span>
                    <span className={`text-sm ${
                      topicoAtual === topico.numero ? 'text-white' : 'text-white/70'
                    }`}>
                      {topico.titulo}
                    </span>
                    {topicoAtual === topico.numero && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet de Termos */}
      <AnimatePresence>
        {showToolsDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setShowToolsDrawer(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-[#12121a] rounded-t-3xl border-t border-amber-500/30 max-h-[70vh] overflow-hidden"
            >
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="px-4 pb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Termos Jurídicos
                </h3>
                <p className="text-white/50 text-xs mt-1">Clique em um termo para ver sua definição</p>
              </div>
              <div className="overflow-y-auto max-h-[55vh] px-4 pb-6">
                {termos && termos.length > 0 ? (
                  <div className="space-y-2">
                    {termos.map((termo, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <h4 className="text-amber-400 font-semibold text-sm mb-2">
                          {termo.termo || termo.title || termo.nome}
                        </h4>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {termo.definicao || termo.description || termo.descricao || "Definição não disponível"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Nenhum termo disponível</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer FIXO - estilo LeituraDinamica */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a12] border-t border-amber-500/20 z-50">
        {/* Barra de progresso */}
        <div className="px-4 pt-3">
          <Progress value={progressPercent} className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
        </div>
        
        {/* Controles de navegação */}
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
          {/* Botão Anterior - dourado */}
          <Button
            variant="ghost"
            onClick={() => irParaTopico(topicoAtual - 1, 'right')}
            disabled={topicoAtual <= 1}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 disabled:opacity-30 disabled:shadow-none transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          {/* Centro - Botões de ação */}
          <div className="flex items-center gap-3">
            {/* Botão de índice */}
            <Button
              variant="ghost"
              onClick={() => setMostrarIndice(true)}
              className="h-11 w-11 rounded-full bg-white/5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all"
            >
              <List className="w-5 h-5" />
            </Button>

            {/* Botão de termos */}
            <Button
              variant="ghost"
              onClick={() => setShowToolsDrawer(true)}
              className="h-11 w-11 rounded-full bg-white/5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all"
            >
              <BookOpen className="w-5 h-5" />
            </Button>
          </div>

          {/* Indicador de página */}
          <div className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-full min-w-[70px] text-center">
            <span className="font-bold text-white">{topicoAtual}</span>
            <span className="mx-1.5 text-white/30">/</span>
            <span>{totalTopicos}</span>
          </div>
          
          {/* Botão Próximo - dourado */}
          <Button
            variant="ghost"
            onClick={() => irParaTopico(topicoAtual + 1, 'left')}
            disabled={topicoAtual >= totalTopicos}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 disabled:opacity-30 disabled:shadow-none transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Floating Font Controls */}
      <div className="fixed bottom-36 right-4 z-50">
        <AnimatePresence>
          {showFontControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-14 right-0 bg-[#1a1a2e] border border-amber-500/30 rounded-xl p-3 shadow-xl shadow-black/50"
            >
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-amber-400 font-mono">{fontSize}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          onClick={() => setShowFontControls(!showFontControls)}
          className={`h-12 w-12 rounded-full shadow-lg ${
            showFontControls 
              ? 'bg-amber-500 text-white' 
              : 'bg-[#1a1a2e] border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Type className="w-5 h-5" />
        </Button>
      </div>

      {/* Drawer de ferramentas */}
      <ConceitosToolsDrawer
        isOpen={showToolsDrawer}
        onClose={() => setShowToolsDrawer(false)}
        exemplos={exemplos}
        termos={termos}
        flashcards={flashcards}
        fontSize={fontSize}
      />
    </div>
  );
};

export default ConceitosReader;
