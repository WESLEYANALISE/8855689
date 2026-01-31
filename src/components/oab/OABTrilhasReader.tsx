import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  List, 
  Volume2,
  VolumeX,
  CheckCircle2,
  Play,
  Layers,
  Lock,
  Target,
  Plus,
  Minus,
  ChevronUp,
  Info,
  Link2,
  ImageIcon,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import FlashcardStack from "@/components/conceitos/FlashcardStack";
import { useNavigate } from "react-router-dom";
import { QuadroComparativoVisual, extrairTabelaDoMarkdown } from "./QuadroComparativoVisual";
import DragDropMatchingGame from "@/components/DragDropMatchingGame";

interface CorrespondenciaItem {
  termo: string;
  definicao: string;
}

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
  tipo?: string;
  dados_interativos?: { 
    pares?: Array<{ termo: string; definicao: string }>;
    dica_estudo?: string;
  };
}

interface OABTrilhasReaderProps {
  conteudoGerado: string;
  paginas?: Array<{ 
    titulo: string; 
    markdown: string; 
    tipo?: string;
    dados_interativos?: { 
      pares?: Array<{ termo: string; definicao: string }>;
      dica_estudo?: string;
    };
  }>;
  titulo: string;
  materia?: string;
  capaUrl?: string;
  flashcards: any[];
  questoes: any[];
  topicoId: number;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  correspondencias?: CorrespondenciaItem[];
  onGerarCapa?: () => void;
  isGeneratingCapa?: boolean;
}

/**
 * Normaliza o conteúdo gerado antes de renderizar no Reader.
 * - Remove vazamentos de payload (ex.: ```json { "paginas": [...] } ``` dentro do Markdown)
 * - Remove numeração decimal em headings (ex.: "### 1.1. Título")
 */
/**
 * Corrige tabelas Markdown malformadas onde todas as células estão em uma única linha.
 * Transforma: "| A | B | C ||---|---|| 1 | 2 | 3 |" em linhas separadas corretamente.
 */
const fixMalformedTables = (input: string): string => {
  if (!input || !input.includes("|")) return input;
  
  // Processa linha por linha
  const lines = input.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Se a linha não parece uma tabela colapsada, mantém como está
    if (!trimmed.includes('|') || trimmed.split('|').length < 5) {
      result.push(line);
      continue;
    }
    
    // Detectar se tem separador de tabela (|---|---|) na mesma linha
    const sepMatch = trimmed.match(/\|\s*[-:]+\s*(?:\|\s*[-:]+\s*)+\|/);
    
    if (!sepMatch) {
      result.push(line);
      continue;
    }
    
    // Encontrar posição do separador
    const sepIndex = trimmed.indexOf(sepMatch[0]);
    const header = trimmed.slice(0, sepIndex).trim();
    const separator = sepMatch[0];
    const body = trimmed.slice(sepIndex + separator.length).trim();
    
    // Contar colunas pelo header
    const headerCells = header.split('|').filter(c => c.trim() !== '');
    const colCount = headerCells.length;
    
    if (colCount === 0) {
      result.push(line);
      continue;
    }
    
    // Reconstruir header com formato correto
    const formattedHeader = '| ' + headerCells.map(c => c.trim()).join(' | ') + ' |';
    
    // Reconstruir separador
    const formattedSep = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    
    // Dividir body em linhas baseado no número de colunas
    const bodyCells = body.split('|').filter(c => c.trim() !== '');
    const dataRows: string[] = [];
    
    for (let i = 0; i < bodyCells.length; i += colCount) {
      const rowCells = bodyCells.slice(i, i + colCount);
      if (rowCells.length === colCount) {
        dataRows.push('| ' + rowCells.map(c => c.trim()).join(' | ') + ' |');
      } else if (rowCells.length > 0) {
        // Linha incompleta - preencher com células vazias
        while (rowCells.length < colCount) {
          rowCells.push('');
        }
        dataRows.push('| ' + rowCells.map(c => c.trim()).join(' | ') + ' |');
      }
    }
    
    // Adicionar todas as linhas formatadas
    result.push(formattedHeader);
    result.push(formattedSep);
    result.push(...dataRows);
  }
  
  return result.join('\n');
};

const sanitizeReaderMarkdown = (input: string): string => {
  if (!input) return "";

  let out = input;

  // Remove blocos de código JSON que contêm o payload de páginas (bug de geração)
  out = out.replace(/```\s*json\s*([\s\S]*?)```/gi, (full, inner) => {
    const normalized = String(inner || "");
    if (/\"paginas\"\s*:\s*\[/i.test(normalized)) return "";
    return full;
  });

  // Em alguns casos o bloco vem como ```json\n{...} sem espaços extras
  out = out.replace(/```\s*([\s\S]*?)```/g, (full, inner) => {
    const normalized = String(inner || "");
    if (/\{[\s\S]*\"paginas\"\s*:\s*\[[\s\S]*\}/i.test(normalized)) return "";
    return full;
  });

  // Remove numeração decimal (1.1, 2.3.1 etc.) em headings
  out = out
    .replace(/^(#{1,6}\s*)\d+(?:\.\d+)+\.\s+/gm, "$1")
    .replace(/^(#{1,6}\s*)\d+\.\s+/gm, "$1");

  // Limpa excesso de linhas em branco geradas pela remoção
  out = out.replace(/\n{4,}/g, "\n\n\n").trim();

  // Remove numeração de linhas (ex.: "2: ") que às vezes vaza para o markdown
  // (isso quebra o parsing e pode deixar páginas aparentando vazias)
  out = out.replace(/^\s*\d+:\s?/gm, "");

  // Corrige tabelas Markdown malformadas (todas em uma linha)
  out = fixMalformedTables(out);

  return out;
};

/**
 * Alguns registros antigos (ou quando o reparo falha) caem no fallback de 6 páginas
 * e a página 2 recebe o JSON inteiro como markdown.
 * Aqui tentamos recuperar o array `paginas` desse JSON embutido para renderizar corretamente.
 */
const tryExtractPaginasFromEmbeddedJson = (
  raw: string
): Array<{ titulo: string; markdown: string; tipo?: string }> | null => {
  if (!raw) return null;

  // Primeiro remove ruídos comuns (numeração de linhas e fences)
  let text = String(raw)
    .replace(/^\s*\d+:\s?/gm, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  if (!/"paginas"\s*:\s*\[/i.test(text)) return null;

  // Tenta isolar um objeto JSON grande (do primeiro { ao último })
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const candidate = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    const paginas = Array.isArray(parsed?.paginas) ? parsed.paginas : null;
    if (!paginas || paginas.length === 0) return null;
    return paginas;
  } catch {
    return null;
  }
};

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

// Seções integradas - não viram tópicos separados
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

const SECOES_ESPECIAIS = ['síntese final', 'síntese'];

const isApenasHeader = (conteudo: string): boolean => {
  const limpo = conteudo.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/\n+/g, ' ').trim();
  if (limpo.length < 100) return true;
  const linhas = conteudo.split('\n').filter(l => l.trim());
  const linhasConteudo = linhas.filter(l => !l.trim().startsWith('#') && l.trim().length > 20);
  return linhasConteudo.length < 2;
};

const extrairTopicos = (markdown: string, tituloTopico: string): Topico[] => {
  if (!markdown) return [];
  
  let cleaned = markdown.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.replace(/^```markdown\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();
  
  if (tituloTopico) {
    const tituloEscapado = tituloTopico.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}\\s*\\n+`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}[:\\-–—].*\\n+`, 'i'), '');
  }
  
  const temSubtopicos = /^### \d+\./gm.test(cleaned);
  const delimitador = temSubtopicos ? /^### /gm : /^## /gm;
  const secoes = cleaned.split(delimitador);
  
  const topicos: Topico[] = [];
  let conteudoIntroducao = "";
  let sinteseConteudo = "";
  
  secoes.forEach((secao, index) => {
    if (index === 0) {
      const conteudoLimpo = secao.trim();
      if (conteudoLimpo.length > 50 && !isApenasHeader(conteudoLimpo)) {
        conteudoIntroducao = conteudoLimpo;
      }
      return;
    }
    
    const linhas = secao.split('\n');
    const tituloRaw = linhas[0].trim();
    const titulo = tituloRaw.replace(/^\d+\.\s*/, '').trim();
    const tituloLower = titulo.toLowerCase().replace(/[🔍🃏📌💡💼🎯⚠️]/g, '').trim();
    const conteudoBruto = linhas.slice(1).join('\n').trim();
    
    const ehSecaoIntegrada = SECOES_INTEGRADAS.some(s => tituloLower.includes(s));
    const ehSecaoEspecial = SECOES_ESPECIAIS.some(s => tituloLower.includes(s));
    
    if (ehSecaoEspecial && conteudoBruto.length > 30) {
      sinteseConteudo = conteudoBruto;
    } else if (ehSecaoIntegrada) {
      if (topicos.length > 0) {
        topicos[topicos.length - 1].conteudo += `\n\n## ${titulo}\n${conteudoBruto}`;
      }
    } else if (titulo && conteudoBruto.length > 30 && !isApenasHeader(conteudoBruto)) {
      const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(conteudoBruto);
      topicos.push({ numero: topicos.length + 1, titulo, conteudo: conteudoLimpo, flashcards });
    }
  });
  
  if (conteudoIntroducao && topicos.length > 0) {
    const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(conteudoIntroducao);
    topicos.unshift({ numero: 0, titulo: "Introdução", conteudo: conteudoLimpo, flashcards, ehIntroducao: true });
    topicos.forEach((t, i) => t.numero = i + 1);
  }
  
  if (sinteseConteudo) {
    const { conteudoLimpo, flashcards } = extrairFlashcardsDoConteudo(sinteseConteudo);
    topicos.push({ numero: topicos.length + 1, titulo: "Síntese Final", conteudo: conteudoLimpo, flashcards, ehSinteseEspecial: true });
  }
  
  return topicos.length > 0 ? topicos : [{ numero: 1, titulo: "Conteúdo", conteudo: cleaned }];
};

const OABTrilhasReader = ({
  conteudoGerado,
  paginas,
  titulo,
  materia,
  capaUrl,
  flashcards,
  questoes,
  topicoId,
  fontSize = 15,
  onFontSizeChange,
  correspondencias = [],
  onGerarCapa,
  isGeneratingCapa = false
}: OABTrilhasReaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const brownNoiseRef = useRef<HTMLAudioElement | null>(null);
  
  // Estados
  const [mostrarTelaBoasVindas, setMostrarTelaBoasVindas] = useState(true);
  const [mostrarCapaTopico, setMostrarCapaTopico] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Sempre começa do tópico 1 quando o Reader é montado (não persistir posição)
  const [topicoAtual, setTopicoAtual] = useState(1);
  
  // Reset para tópico 1 sempre que o conteúdo mudar (ex: navegação entre páginas)
  useEffect(() => {
    setTopicoAtual(1);
    setMostrarCapaTopico(false);
  }, [titulo, conteudoGerado]);
  const [mostrarIndice, setMostrarIndice] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showFontControls, setShowFontControls] = useState(false);
  const [direction, setDirection] = useState(0);
  
  // Progresso
  const [leituraCompleta, setLeituraCompleta] = useState(false);
  const [flashcardsCompletos, setFlashcardsCompletos] = useState(false);
  const [praticaCompleta, setPraticaCompleta] = useState(false);
  const [progressoLeitura, setProgressoLeitura] = useState(0);
  const [progressoFlashcards, setProgressoFlashcards] = useState(0);
  const [progressoQuestoes, setProgressoQuestoes] = useState(0);

  // Monitorar scroll da página para barra de progresso de leitura
  useEffect(() => {
    const handleScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };
    
    window.addEventListener('scroll', handleScrollProgress);
    return () => window.removeEventListener('scroll', handleScrollProgress);
  }, [topicoAtual]);

  // Normalizar páginas: se houver JSON embutido (bug), recupera as páginas reais
  const paginasNormalizadas = (() => {
    if (Array.isArray(paginas) && paginas.length > 0) {
      for (const p of paginas) {
        const recovered = tryExtractPaginasFromEmbeddedJson(p?.markdown || "");
        if (recovered) return recovered;
      }
      return paginas;
    }

    const recoveredFromConteudo = tryExtractPaginasFromEmbeddedJson(conteudoGerado || "");
    return recoveredFromConteudo || undefined;
  })();

  // Títulos padrão das páginas (alinhado com a edge function)
  const TITULOS_PAGINAS_PADRAO = [
    "Introdução",
    "Conteúdo Completo", 
    "Desmembrando o Tema",
    "Entendendo na Prática",
    "Quadro Comparativo",
    "Dicas para Memorizar",
    "Ligar Termos",
    "Síntese Final"
  ];
  
  // Extrair tópicos do conteúdo
  const topicosRaw: Topico[] = Array.isArray(paginasNormalizadas) && paginasNormalizadas.length > 0
    ? paginasNormalizadas.map((p, idx) => ({
        numero: idx + 1,
        titulo: p.titulo || TITULOS_PAGINAS_PADRAO[idx] || `Página ${idx + 1}`,
        conteudo: sanitizeReaderMarkdown(p.markdown || ""),
        tipo: p.tipo,
        dados_interativos: (p as any).dados_interativos,
      }))
    : extrairTopicos(sanitizeReaderMarkdown(conteudoGerado || ""), titulo);
  
  // Garantir ordem correta: correspondências ANTES de síntese final
  const topicos = (() => {
    const sinteseIdx = topicosRaw.findIndex(t => 
      t.tipo === 'sintese_final' || 
      t.titulo?.toLowerCase().includes('síntese') ||
      t.titulo?.toLowerCase().includes('sintese')
    );
    const correspondenciasIdx = topicosRaw.findIndex(t => 
      t.tipo === 'correspondencias' || 
      t.titulo?.toLowerCase().includes('correspondência') ||
      t.titulo?.toLowerCase().includes('ligar termos')
    );
    
    // Se ambos existem e correspondências está depois de síntese, reordenar
    if (sinteseIdx !== -1 && correspondenciasIdx !== -1 && correspondenciasIdx > sinteseIdx) {
      const reordenado = [...topicosRaw];
      const [correspondencias] = reordenado.splice(correspondenciasIdx, 1);
      reordenado.splice(sinteseIdx, 0, correspondencias);
      // Renumerar
      return reordenado.map((t, i) => ({ ...t, numero: i + 1 }));
    }
    
    return topicosRaw;
  })();
  const totalTopicos = topicos.length;
  const topicoData = topicos.find(t => t.numero === topicoAtual);
  const progressPercent = (topicoAtual / totalTopicos) * 100;

  // Áudio de virar página
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
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
      if (brownNoiseEnabled) {
        brownNoiseRef.current.play().catch(console.error);
      } else {
        brownNoiseRef.current.pause();
      }
    }
  }, [brownNoiseEnabled]);

  // Listener para mostrar botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handler para toggle do ruído marrom com card explicativo
  const handleBrownNoiseToggle = useCallback((enabled: boolean) => {
    setBrownNoiseEnabled(enabled);
    if (enabled) {
      setShowBrownNoiseInfo(true);
    }
  }, []);

  const handleDismissBrownNoiseInfo = useCallback(() => {
    setShowBrownNoiseInfo(false);
  }, []);

  // Carregar progresso do banco
  useEffect(() => {
    const carregarProgresso = async () => {
      if (!user || !topicoId) return;
      
      try {
        const { data } = await supabase
          .from('oab_trilhas_estudo_progresso')
          .select('*')
          .eq('user_id', user.id)
          .eq('topico_id', topicoId)
          .single();
        
        if (data) {
          setLeituraCompleta(data.leitura_completa || false);
          setFlashcardsCompletos(data.flashcards_completos || false);
          setPraticaCompleta(data.pratica_completa || false);
          setProgressoLeitura(data.progresso_leitura || 0);
          setProgressoFlashcards(data.progresso_flashcards || 0);
          setProgressoQuestoes(data.progresso_questoes || 0);
          if (data.ultimo_topico_lido) setTopicoAtual(data.ultimo_topico_lido);
        }
      } catch (error) {
        console.log("Sem progresso anterior");
      }
    };
    
    carregarProgresso();
  }, [user, topicoId]);

  // Salvar progresso
  const salvarProgresso = useCallback(async (updates: any) => {
    if (!user || !topicoId) return;
    
    try {
      await supabase
        .from('oab_trilhas_estudo_progresso')
        .upsert({
          user_id: user.id,
          topico_id: topicoId,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  }, [user, topicoId]);

  // Navegação com som
  const irParaTopico = useCallback((num: number, dir?: 'left' | 'right') => {
    if (num < 1 || num > totalTopicos) return;
    
    // Tocar som de página
    if (pageTurnAudioRef.current) {
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.play().catch(() => {});
    }
    
    setDirection(dir === 'left' ? 1 : -1);
    setTopicoAtual(num);
    
    // Scroll to top - both window and content container
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Salvar progresso
    const novoProgresso = Math.round((num / totalTopicos) * 100);
    setProgressoLeitura(novoProgresso);
    salvarProgresso({ 
      progresso_leitura: novoProgresso,
      ultimo_topico_lido: num 
    });
  }, [totalTopicos, salvarProgresso]);

  const iniciarLeitura = () => {
    setMostrarTelaBoasVindas(false);
    setMostrarCapaTopico(true);
  };

  const handleFlashcardsClick = () => {
    if (leituraCompleta) {
      navigate(`/oab/trilhas-aprovacao/topico/${topicoId}/flashcards`);
    }
  };

  const handleQuestoesClick = () => {
    if (flashcardsCompletos) {
      navigate(`/oab/trilhas-aprovacao/topico/${topicoId}/questoes`);
    }
  };

  const handleLockedItemClick = (item: string) => {
    toast.info(`Complete a etapa anterior para desbloquear ${item}`);
  };

  const concluirLeitura = () => {
    setLeituraCompleta(true);
    salvarProgresso({ leitura_completa: true, progresso_leitura: 100 });
    setMostrarTelaBoasVindas(true);
    toast.success("Leitura concluída! Flashcards desbloqueados.");
  };

  const pageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 80 : -80, opacity: 0 })
  };

  const hasFlashcards = flashcards && flashcards.length > 0;
  const hasQuestoes = questoes && questoes.length > 0;

  // Tela de Boas-Vindas
  if (mostrarTelaBoasVindas) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background com capa */}
        <div className="absolute inset-0">
          {capaUrl ? (
            <>
              <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/90 to-[#0a0a12]/60" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-900/40 via-[#0a0a12] to-red-900/40" />
          )}
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-32">
          {/* Capa Visual */}
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
              /* Placeholder com botão para gerar capa */
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 bg-gradient-to-br from-red-900/30 via-[#1a1a2e] to-orange-900/30 border border-white/10 flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-white/5 rounded-full">
                  <ImageIcon className="w-10 h-10 text-white/30" />
                </div>
                {onGerarCapa && (
                  <button
                    onClick={onGerarCapa}
                    disabled={isGeneratingCapa}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-full text-sm text-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                  >
                    {isGeneratingCapa ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gerando capa...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>Gerar Capa</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Decoração + Título */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
              <span className="text-red-400 text-xl">✦</span>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              {titulo}
            </h1>
            
            {materia && <p className="text-red-400/80 text-sm font-medium">{materia}</p>}
            
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
              <span className="text-red-400 text-xl">✦</span>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
            </div>
          </motion.div>

          {/* Badges: Tópicos + Ruído Marrom */}
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
              <List className="w-4 h-4 text-red-400" />
              <span className="text-white/80 text-sm">{totalTopicos} tópicos</span>
            </button>
            
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              {brownNoiseEnabled ? (
                <Volume2 className="w-4 h-4 text-red-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-white/80 text-sm">Ruído Marrom</span>
              <Switch
                checked={brownNoiseEnabled}
                onCheckedChange={handleBrownNoiseToggle}
                className="data-[state=checked]:bg-red-500 scale-90"
              />
            </div>
          </motion.div>

          {/* Índice Dropdown */}
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
                    <BookOpen className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-medium text-white">Índice</p>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                    {topicos.map((top, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTopicoAtual(top.numero);
                          setMostrarTelaBoasVindas(false);
                          setMostrarCapaTopico(true);
                        }}
                        className="w-full flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-red-400/60 font-mono text-xs w-6 flex-shrink-0">
                          {String(top.numero).padStart(2, '0')}
                        </span>
                        <span className="text-white/80 flex-1 truncate text-xs">{top.titulo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Módulos Sequenciais */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-md space-y-3 px-2"
          >
            {/* 1. Leitura */}
            <button onClick={iniciarLeitura} className="w-full bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/40 rounded-xl p-4 transition-all group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-red-500/30">1</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-red-400" />
                    <span className="text-white font-semibold">Começar Leitura</span>
                  </div>
                  {progressoLeitura > 0 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progressoLeitura} className="h-1.5 flex-1 bg-white/10" />
                      <span className="text-xs text-red-400 font-medium">{progressoLeitura}%</span>
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 mt-0.5">Leia todo o conteúdo do tópico</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. Flashcards */}
            <button
              onClick={() => {
                if (leituraCompleta) handleFlashcardsClick();
                else handleLockedItemClick("os Flashcards");
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
                    ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30" 
                    : "bg-white/10 text-white/50"
                }`}>
                  {leituraCompleta ? "2" : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className={`font-semibold ${leituraCompleta ? "text-white" : "text-white/50"}`}>Flashcards</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${leituraCompleta ? "text-white/50" : "text-white/30"}`}>
                    {hasFlashcards ? `${flashcards.length} cards` : "Revise com flashcards"}
                  </p>
                </div>
                {leituraCompleta ? (
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <Lock className="w-4 h-4 text-white/30" />
                )}
              </div>
            </button>

            {/* 3. Praticar */}
            <button
              onClick={() => {
                if (flashcardsCompletos) handleQuestoesClick();
                else handleLockedItemClick("a Prática");
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
                    ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30" 
                    : "bg-white/10 text-white/50"
                }`}>
                  {flashcardsCompletos ? "3" : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className={`font-semibold ${flashcardsCompletos ? "text-white" : "text-white/50"}`}>Praticar</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${flashcardsCompletos ? "text-white/50" : "text-white/30"}`}>
                    {hasQuestoes ? `${questoes.length} questões` : "Teste seus conhecimentos"}
                  </p>
                </div>
                {flashcardsCompletos ? (
                  <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <Lock className="w-4 h-4 text-white/30" />
                )}
              </div>
            </button>
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
                  className="w-full max-w-sm bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/30 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header com ícone */}
                  <div className="relative h-24 bg-gradient-to-r from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <div className="p-4 bg-red-500/20 rounded-full backdrop-blur-sm">
                      <Volume2 className="w-8 h-8 text-red-400" />
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-red-400" />
                      O que é Ruído Marrom?
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">
                      O <strong className="text-red-300">ruído marrom</strong> é um som de baixa frequência que ajuda a melhorar a concentração e foco durante a leitura. 
                      Diferente do ruído branco, ele tem frequências mais graves, lembrando o som de uma cachoeira distante ou vento forte.
                    </p>
                    
                    {/* Tags de benefícios */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 rounded-full text-xs text-red-300 border border-red-500/20">
                        🧠 Melhora o foco
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 rounded-full text-xs text-red-300 border border-red-500/20">
                        😌 Reduz ansiedade
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 rounded-full text-xs text-red-300 border border-red-500/20">
                        🎯 Aumenta produtividade
                      </span>
                    </div>

                    {/* Botão Entendi */}
                    <Button
                      onClick={handleDismissBrownNoiseInfo}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-red-500/25"
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

  // Tela de Capa do Tópico
  if (mostrarCapaTopico && !mostrarTelaBoasVindas) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0">
          {capaUrl ? (
            <>
              <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/80 to-[#0a0a12]/40" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-900/40 via-[#0a0a12] to-red-900/40" />
          )}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          {!topicoData?.ehSinteseEspecial && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
              <span className="text-red-400/70 text-sm uppercase tracking-[0.3em] font-medium">
                Tópico {topicoData?.numero} de {totalTopicos}
              </span>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
            <span className="text-red-400 text-2xl">✦</span>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
          </div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
          >
            {topicoData?.titulo}
          </motion.h1>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
            <span className="text-red-400 text-2xl">✦</span>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
          </div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-8 max-w-xs mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/90 to-transparent"
        >
          <button
            onClick={() => setMostrarCapaTopico(false)}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
          >
            Continuar Leitura →
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Tela de Leitura
  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Barra de Progresso de Leitura (Scroll) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      <div ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={topicoAtual}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }, opacity: { duration: 0.2 } }}
            className="min-h-full px-4 sm:px-6 py-6"
          >
            <div className="max-w-2xl mx-auto">
              {/* Header do tópico */}
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
                  <span className="text-red-400 text-sm">✦</span>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
                </div>
                
                {!topicoData?.ehIntroducao && !topicoData?.ehSinteseEspecial && (
                  <span className="text-red-400/70 text-xs uppercase tracking-[0.2em] font-medium mb-2">
                    Tópico {topicoData?.numero}
                  </span>
                )}
                
                <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {topicoData?.titulo}
                </h2>
                
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
                  <span className="text-red-400 text-sm">✦</span>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="bg-[#12121a] rounded-xl border border-white/10 p-5">
                {/* Detectar tipo de página e renderizar de acordo */}
                {(() => {
                  // Detectar se é página de Correspondências (Ligar Termos)
                  const isCorrespondencias = topicoData?.tipo === 'correspondencias' || 
                    topicoData?.titulo?.toLowerCase().includes('ligar termos') ||
                    topicoData?.titulo?.toLowerCase().includes('correspondências');
                  
                  // Função para extrair pares de correspondências do conteúdo
                  const extrairParesDoConteudo = (conteudo: string): Array<{termo: string; definicao: string}> => {
                    if (!conteudo) return [];
                    
                    // Tentar extrair JSON do formato "correspondencias [ {...}, {...} ]"
                    const jsonMatch = conteudo.match(/correspondencias\s*\[\s*(\{[\s\S]*?\}(?:\s*,\s*\{[\s\S]*?\})*)\s*\]/i);
                    if (jsonMatch) {
                      try {
                        const jsonStr = `[${jsonMatch[1]}]`;
                        const parsed = JSON.parse(jsonStr);
                        return parsed.map((item: any) => ({
                          termo: item.termo || item.conceito || '',
                          definicao: item.definicao || item.descricao || ''
                        }));
                      } catch (e) {
                        console.error('Erro ao parsear correspondências:', e);
                      }
                    }
                    
                    // Fallback: tentar encontrar padrão { "termo": "...", "definicao": "..." }
                    const termosRegex = /\{\s*"termo"\s*:\s*"([^"]+)"\s*,\s*"definicao"\s*:\s*"([^"]+)"\s*\}/g;
                    const pares: Array<{termo: string; definicao: string}> = [];
                    let match;
                    while ((match = termosRegex.exec(conteudo)) !== null) {
                      pares.push({ termo: match[1], definicao: match[2] });
                    }
                    
                    return pares;
                  };
                  
                  // Se for correspondências, tentar extrair pares
                  if (isCorrespondencias) {
                    // Prioridade: 1) dados_interativos.pares do tópico, 2) prop correspondencias, 3) extrair do conteúdo
                    const paresDoTopico = topicoData?.dados_interativos?.pares;
                    const paresParaUsar = (paresDoTopico && paresDoTopico.length > 0)
                      ? paresDoTopico
                      : (correspondencias && correspondencias.length > 0)
                        ? correspondencias 
                        : extrairParesDoConteudo(topicoData?.conteudo || '');
                    
                    if (paresParaUsar && paresParaUsar.length > 0) {
                      return (
                        <div className="space-y-6">
                          <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-4">
                              <Link2 className="w-5 h-5 text-red-400" />
                              <span className="text-red-400 font-medium">Exercício Interativo</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                              Conecte os Termos às Definições
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Clique em um termo e depois na definição correspondente para fazer a conexão
                            </p>
                          </div>
                          <DragDropMatchingGame 
                            items={paresParaUsar.map(c => ({ 
                              conceito: c.termo, 
                              definicao: c.definicao 
                            }))}
                            onComplete={(score) => {
                              toast.success(`Parabéns! Você acertou ${score} de ${paresParaUsar.length} conexões!`);
                            }}
                          />
                        </div>
                      );
                    }
                  }
                  
                  // Detectar se é Quadro Comparativo e renderizar visual interativo
                  const isQuadroComparativo = topicoData?.titulo?.toLowerCase().includes('quadro comparativo');
                  const tabelaExtraida = isQuadroComparativo && topicoData?.conteudo 
                    ? extrairTabelaDoMarkdown(topicoData.conteudo) 
                    : null;
                  
                  if (isQuadroComparativo && tabelaExtraida) {
                    // Renderiza APENAS a tabela visual, sem texto antes
                    return (
                      <QuadroComparativoVisual 
                        cabecalhos={tabelaExtraida.cabecalhos}
                        linhas={tabelaExtraida.linhas}
                      />
                    );
                  }
                  
                  // Renderização padrão com EnrichedMarkdownRenderer
                  return (
                    <EnrichedMarkdownRenderer 
                      content={topicoData?.conteudo || ""}
                      fontSize={fontSize}
                      theme="classicos"
                    />
                  );
                })()}
              </div>

              {/* Flashcards do tópico */}
              {topicoData?.flashcards && topicoData.flashcards.length > 0 && (
                <div className="mt-8">
                  <FlashcardStack 
                    flashcards={topicoData.flashcards}
                    titulo={`Revise: ${topicoData.titulo}`}
                  />
                </div>
              )}

              {/* Mensagem de conclusão */}
              {topicoAtual === totalTopicos && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  <div className="text-center">
                    <p className="text-red-400/70 text-sm mb-2">🎉 Você concluiu toda a leitura!</p>
                    <p className="text-gray-400 text-xs">Revise os flashcards acima para fixar o conteúdo</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer FIXO - estilo ConceitosReader */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a12] border-t border-red-500/20 z-50">
        {/* Barra de progresso */}
        <div className="px-4 pt-3">
          <Progress value={progressPercent} className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" />
        </div>
        
        {/* Controles de navegação */}
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
          {/* Botão Anterior - vermelho */}
          <Button
            variant="ghost"
            onClick={() => irParaTopico(topicoAtual - 1, 'right')}
            disabled={topicoAtual <= 1}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-30 disabled:shadow-none transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          {/* Centro - Botões de ação */}
          <div className="flex items-center gap-3">
            {/* Botão de índice */}
            <Button
              variant="ghost"
              onClick={() => setMostrarIndice(true)}
              className="h-11 w-11 rounded-full bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-all"
            >
              <List className="w-5 h-5" />
            </Button>

            {/* Botão de termos */}
            <Button
              variant="ghost"
              onClick={() => setShowToolsDrawer(true)}
              className="h-11 w-11 rounded-full bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-all"
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
          
          {/* Botão Próximo ou Concluir */}
          {topicoAtual >= totalTopicos ? (
            <Button
              variant="ghost"
              onClick={concluirLeitura}
              className="h-12 px-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
            >
              Concluir ✓
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => irParaTopico(topicoAtual + 1, 'left')}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-44 right-4 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center transition-all"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Font Controls */}
      <div className="fixed bottom-28 right-4 z-50">
        <AnimatePresence>
          {showFontControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-14 right-0 bg-[#1a1a2e] border border-red-500/30 rounded-xl p-3 shadow-xl shadow-black/50"
            >
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => onFontSizeChange?.(Math.min(24, fontSize + 2))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-white/60">{fontSize}px</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => onFontSizeChange?.(Math.max(12, fontSize - 2))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          onClick={() => setShowFontControls(!showFontControls)}
          className={`h-12 w-12 rounded-full shadow-xl transition-all ${
            showFontControls 
              ? "bg-red-500 text-white hover:bg-red-600" 
              : "bg-[#1a1a2e] border border-red-500/30 text-red-400 hover:bg-red-500/20"
          }`}
        >
          <span className="font-bold text-sm">Aa</span>
        </Button>
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
              className="absolute bottom-0 left-0 right-0 bg-[#12121a] rounded-t-3xl border-t border-red-500/30 max-h-[70vh] overflow-hidden"
            >
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="px-4 pb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-red-400" />
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
                        ? "bg-red-500/20 border border-red-500/40"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      topicoAtual === topico.numero
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-white/70"
                    }`}>
                      {topico.numero}
                    </span>
                    <span className={`flex-1 ${topicoAtual === topico.numero ? "text-white font-medium" : "text-white/70"}`}>
                      {topico.titulo}
                    </span>
                    {topicoAtual === topico.numero && (
                      <span className="text-red-400 text-xs">Atual</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OABTrilhasReader;
