import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Loader2,
  BookOpen,
  Play,
  CheckCircle2,
  BookMarked,
  Type,
  List,
  ZoomIn
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerClose 
} from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { AudioCapituloPlayer, AudioCapituloPlayerRef } from "./AudioCapituloPlayer";
import { AudioPaginaPlayer, AudioPaginaPlayerRef } from "./AudioPaginaPlayer";

interface LeituraDinamicaReaderProps {
  isOpen: boolean;
  onClose: () => void;
  tituloLivro: string;
  tituloLeituraDinamica?: string;
  imagemCapa?: string;
  autorLivro?: string;
}

interface PaginaConteudo {
  numero: number;
  capitulo?: string;
  conteudo: string;
  formatado?: boolean;
  isChapterStart?: boolean;
  urlCapaCapitulo?: string;
  urlAudioCapitulo?: string;
  urlAudioPagina?: string;
}

interface CapituloIndice {
  numero: number;
  titulo: string;
  pagina_inicio: number;
}

interface Capitulo {
  nome: string;
  paginaInicio: number;
}

// Mapeamento de títulos entre BIBLIOTECA-CLASSICOS e BIBLIOTECA-LEITURA-DINAMICA
const MAPEAMENTO_TITULOS: Record<string, string> = {
  "O Monge e o Executivo": "Monge",
  "A Arte da Guerra": "Arte Da Guerra",
  "O Leviatã": "Leviatã",
  "O Contrato Social": "contrato social",
  "O Príncipe": "Príncipe",
  "A República": "República",
  "O Caso dos Exploradores de Cavernas": "Exploradores de Cavernas",
  "Meditações": "Meditações",
  "Ética a Nicômaco": "Ética a Nicômaco",
  "Política": "Política",
  "Dos Delitos e das Penas": "delitos",
  "Crime e Castigo": "Crime-e-Castigo",
  "1984": "George Orwell",
};

const LeituraDinamicaReader = ({
  isOpen,
  onClose,
  tituloLivro,
  tituloLeituraDinamica,
  imagemCapa,
  autorLivro
}: LeituraDinamicaReaderProps) => {
  const [paginas, setPaginas] = useState<PaginaConteudo[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(0);
  // Tamanho responsivo: 15px mobile, 17px tablet, 18px desktop
  const getDefaultFontSize = () => {
    if (typeof window === 'undefined') return 16;
    const width = window.innerWidth;
    if (width < 480) return 15;      // Mobile pequeno
    if (width < 768) return 16;      // Mobile grande
    if (width < 1024) return 17;     // Tablet
    return 18;                        // Desktop
  };
  const [fontSize, setFontSize] = useState(getDefaultFontSize);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [indiceCapitulos, setIndiceCapitulos] = useState<CapituloIndice[]>([]);
  const [mostrarTelaBemVindo, setMostrarTelaBemVindo] = useState(true);
  const [isFormatandoTudo, setIsFormatandoTudo] = useState(false);
  const [capituloFormatandoAtual, setCapituloFormatandoAtual] = useState(0);
  const [totalCapitulosFormatar, setTotalCapitulosFormatar] = useState(0);
  const [formatacaoConcluida, setFormatacaoConcluida] = useState(false);
  const [paginasLiberadas, setPaginasLiberadas] = useState(0);
  const [formatacaoEmBackground, setFormatacaoEmBackground] = useState(false);
  const [isAnalisandoCapitulos, setIsAnalisandoCapitulos] = useState(false);
  const [analiseCapitulosConcluida, setAnaliseCapitulosConcluida] = useState(false);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [imagemZoom, setImagemZoom] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formatacaoAbortRef = useRef(false);
  const audioPlayerRef = useRef<AudioCapituloPlayerRef>(null);
  const audioPaginaPlayerRef = useRef<AudioPaginaPlayerRef>(null);
  const [audioEstaReproduzindo, setAudioEstaReproduzindo] = useState(false);
  const [audioAutoPlay, setAudioAutoPlay] = useState(true);

  // Limpar HTML problemático e converter para texto legível
  const limparConteudo = (texto: string): string => {
    if (!texto) return 'Conteúdo não disponível';
    
    let limpo = texto;
    
    if (texto.includes('<')) {
      limpo = texto
        .replace(/<p[^>]*class="indent"[^>]*>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '\n\n')
        .replace(/<\/p>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<blockquote[^>]*>/gi, '\n\n> ')
        .replace(/<\/blockquote>/gi, '\n\n')
        .replace(/<strong[^>]*>/gi, '**')
        .replace(/<\/strong>/gi, '**')
        .replace(/<b[^>]*>/gi, '**')
        .replace(/<\/b>/gi, '**')
        .replace(/<em[^>]*>/gi, '*')
        .replace(/<\/em>/gi, '*')
        .replace(/<i[^>]*>/gi, '*')
        .replace(/<\/i>/gi, '*')
        .replace(/<h1[^>]*>/gi, '\n\n# ')
        .replace(/<\/h1>/gi, '\n\n')
        .replace(/<h2[^>]*>/gi, '\n\n## ')
        .replace(/<\/h2>/gi, '\n\n')
        .replace(/<h3[^>]*>/gi, '\n\n### ')
        .replace(/<\/h3>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        .replace(/<[ou]l[^>]*>/gi, '\n')
        .replace(/<\/[ou]l>/gi, '\n')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '');
    }
    
    limpo = limpo
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
      .replace(/([a-záàâãéèêíïóôõöúç])\n([a-záàâãéèêíïóôõöúç])/gi, '$1$2')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
    
    return limpo || 'Conteúdo não disponível';
  };

  // Buscar título mapeado
  const getTituloParaBusca = useCallback(() => {
    if (tituloLeituraDinamica) return tituloLeituraDinamica;
    const mapeado = MAPEAMENTO_TITULOS[tituloLivro];
    if (mapeado) return mapeado;
    return tituloLivro.split(' ').slice(0, 3).join(' ');
  }, [tituloLivro, tituloLeituraDinamica]);

  // Analisar capítulos do livro com Gemini
  const analisarCapitulos = async (paginasParaAnalise: { pagina: number; conteudo: string }[]) => {
    setIsAnalisandoCapitulos(true);
    
    try {
      console.log('Analisando capítulos do livro...');
      
      const response = await supabase.functions.invoke('analisar-capitulos-livro', {
        body: {
          livroTitulo: getTituloParaBusca(),
          paginas: paginasParaAnalise
        }
      });

      if (response.data?.success) {
        const indice = response.data.indice as CapituloIndice[];
        setIndiceCapitulos(indice);
        
        // Converter para formato de capítulos usado internamente
        const capitulosConvertidos: Capitulo[] = indice.map(cap => ({
          nome: cap.titulo,
          paginaInicio: cap.pagina_inicio
        }));
        setCapitulos(capitulosConvertidos);
        setAnaliseCapitulosConcluida(true);
        
        console.log(`Análise concluída: ${indice.length} capítulos identificados`);
        
        if (response.data.cached) {
          console.log('Índice carregado do cache');
        }
      } else {
        throw new Error(response.data?.error || 'Erro na análise');
      }
    } catch (error) {
      console.error('Erro ao analisar capítulos:', error);
      // Fallback: criar índice básico
      setIndiceCapitulos([{ numero: 1, titulo: 'Conteúdo do Livro', pagina_inicio: 1 }]);
      setCapitulos([{ nome: 'Conteúdo do Livro', paginaInicio: 1 }]);
      setAnaliseCapitulosConcluida(true);
    } finally {
      setIsAnalisandoCapitulos(false);
    }
  };

  // Buscar conteúdo do livro
  const fetchConteudo = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    try {
      const tituloParaBuscar = getTituloParaBusca();
      console.log('Buscando livro com título:', tituloParaBuscar);

      // NOVO FLUXO: Primeiro verificar se há páginas formatadas (cache)
      // Usar ILIKE para buscar com correspondência parcial
      let { data: paginasFormatadas } = await supabase
        .from("leitura_paginas_formatadas")
        .select("numero_pagina, html_formatado, is_chapter_start, capitulo_titulo, url_capa_capitulo, numero_capitulo, url_audio_capitulo, url_audio_pagina")
        .ilike("livro_titulo", `%${tituloParaBuscar}%`)
        .order("numero_pagina", { ascending: true });

      console.log('Páginas formatadas encontradas:', paginasFormatadas?.length || 0);

      // Se encontrou páginas formatadas, usar diretamente sem depender do OCR
      if (paginasFormatadas && paginasFormatadas.length > 0) {
        console.log('[Cache Hit] Usando páginas formatadas diretamente');
        
        // Processar páginas formatadas diretamente
        const paginasProcessadas: PaginaConteudo[] = paginasFormatadas.map((p: any) => ({
          numero: p.numero_pagina,
          capitulo: p.capitulo_titulo || "",
          conteudo: p.html_formatado || "",
          formatado: true,
          isChapterStart: p.is_chapter_start || false,
          urlCapaCapitulo: p.url_capa_capitulo || undefined,
          urlAudioCapitulo: p.url_audio_capitulo || undefined,
          urlAudioPagina: p.url_audio_pagina || undefined
        }));

        // Buscar índice de capítulos
        const { data: indiceData } = await supabase
          .from("leitura_livros_indice")
          .select("*")
          .ilike("livro_titulo", `%${tituloParaBuscar}%`)
          .single();

        if (indiceData?.analise_concluida && indiceData.indice_capitulos) {
          const indice = indiceData.indice_capitulos as unknown as CapituloIndice[];
          setIndiceCapitulos(indice);
          setCapitulos(indice.map(cap => ({ nome: cap.titulo, paginaInicio: cap.pagina_inicio })));
          setAnaliseCapitulosConcluida(true);
          console.log('Índice carregado:', indice.length, 'capítulos');
        }

        setPaginas(paginasProcessadas);
        setTotalPaginas(paginasProcessadas.length);
        setFormatacaoConcluida(true);
        setMostrarTelaBemVindo(true);

        // Gerar capas para capítulos sem capa em background
        const capitulosSemCapa = paginasProcessadas.filter(p => p.isChapterStart && !p.urlCapaCapitulo);
        if (capitulosSemCapa.length > 0) {
          console.log(`[fetchConteudo] ${capitulosSemCapa.length} capítulos sem capa, iniciando geração...`);
          gerarCapasEmBackground(paginasProcessadas, tituloParaBuscar);
        }

        return;
      }

      // Se não há cache formatado, buscar do OCR original
      console.log('[Cache Miss] Buscando do OCR original...');
      
      const { data: paginasRaw, error } = await (supabase as any)
        .from("BIBLIOTECA-LEITURA-DINAMICA")
        .select("*")
        .ilike("Titulo da Obra", `%${tituloParaBuscar}%`)
        .order("Pagina", { ascending: true });

      if (error) {
        console.error('Erro ao buscar páginas:', error);
        throw error;
      }

      console.log('Páginas OCR encontradas:', paginasRaw?.length || 0);

      if (!paginasRaw || paginasRaw.length === 0) {
        toast.error("Conteúdo não encontrado para este livro");
        onClose();
        return;
      }

      // Usar o título exato do banco de dados para buscas de cache
      const tituloExatoDoBanco = paginasRaw[0]?.["Titulo da Obra"] || tituloParaBuscar;
      console.log('Título exato para cache:', tituloExatoDoBanco);

      // Buscar índice de capítulos já existente
      const { data: indiceExistente } = await supabase
        .from("leitura_livros_indice")
        .select("*")
        .ilike("livro_titulo", `%${tituloParaBuscar}%`)
        .single();

      if (indiceExistente?.analise_concluida && indiceExistente.indice_capitulos) {
        const indice = indiceExistente.indice_capitulos as unknown as CapituloIndice[];
        setIndiceCapitulos(indice);
        setCapitulos(indice.map(cap => ({ nome: cap.titulo, paginaInicio: cap.pagina_inicio })));
        setAnaliseCapitulosConcluida(true);
        console.log('Índice carregado do cache:', indice.length, 'capítulos');
      }

      // Mapear páginas do OCR com numeração sequencial (começando de 1)
      const paginasProcessadas: PaginaConteudo[] = paginasRaw.map((p: any, index: number) => {
        const conteudoBruto = p["Conteúdo"] || p.Conteúdo || "";
        
        return {
          numero: index + 1, // Numeração sequencial começando de 1
          capitulo: p["Titulo do Capitulo"] || "",
          conteudo: limparConteudo(conteudoBruto),
          formatado: false,
          isChapterStart: false,
          urlCapaCapitulo: undefined
        };
      });

      setPaginas(paginasProcessadas);
      setTotalPaginas(paginasProcessadas.length);
      setFormatacaoConcluida(false);
      setMostrarTelaBemVindo(true);

      // Se não tem índice, iniciar análise de capítulos
      if (!indiceExistente?.analise_concluida) {
        const paginasParaAnalise = paginasRaw.map((p: any, index: number) => ({
          pagina: index + 1, // Usar numeração sequencial
          conteudo: p["Conteúdo"] || p.Conteúdo || ""
        }));
        analisarCapitulos(paginasParaAnalise);
      }
    } catch (error) {
      console.error("Erro ao buscar conteúdo:", error);
      toast.error("Erro ao carregar conteúdo do livro");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, getTituloParaBusca, onClose]);

  // Flag para controlar auto-formatação
  const [autoFormatacaoIniciada, setAutoFormatacaoIniciada] = useState(false);

  useEffect(() => {
    if (isOpen) {
      formatacaoAbortRef.current = false;
      // Resetar apenas estados de controle, não de conteúdo
      // O fetchConteudo vai determinar se já está formatado ou não
      setPaginaAtual(1);
      setIsFormatandoTudo(false);
      setCapituloFormatandoAtual(0);
      setTotalCapitulosFormatar(0);
      setPaginasLiberadas(0);
      setFormatacaoEmBackground(false);
      setAutoFormatacaoIniciada(false);
      // NÃO resetar mostrarTelaBemVindo aqui - deixar o fetchConteudo decidir
      // baseado em se o conteúdo já está formatado
      fetchConteudo();
    } else {
      formatacaoAbortRef.current = true;
    }
  }, [isOpen, fetchConteudo]);

  // Polling para progresso de formatação em tempo real
  useEffect(() => {
    if (!isFormatandoTudo) return;
    
    const tituloParaBuscar = getTituloParaBusca();
    
    const interval = setInterval(async () => {
      try {
        // Buscar maior numero_capitulo já formatado usando ILIKE para match flexível
        const { data } = await supabase
          .from('leitura_paginas_formatadas')
          .select('numero_capitulo')
          .ilike('livro_titulo', `%${tituloParaBuscar}%`)
          .not('numero_capitulo', 'is', null)
          .order('numero_capitulo', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          const capAtual = data[0].numero_capitulo || 0;
          if (capAtual > capituloFormatandoAtual) {
            setCapituloFormatandoAtual(capAtual);
            console.log(`[Progresso] Capítulo ${capAtual}/${totalCapitulosFormatar} formatado`);
          }
        }
      } catch (e) {
        console.error('Erro no polling de progresso:', e);
      }
    }, 1500); // Verificar a cada 1.5 segundos para progresso mais responsivo
    
    return () => clearInterval(interval);
  }, [isFormatandoTudo, getTituloParaBusca, capituloFormatandoAtual, totalCapitulosFormatar]);

  // Auto-iniciar formatação quando carregar conteúdo (se ainda não formatado)
  useEffect(() => {
    if (!isLoading && paginas.length > 0 && !formatacaoConcluida && !autoFormatacaoIniciada && !isFormatandoTudo && mostrarTelaBemVindo && analiseCapitulosConcluida) {
      console.log('[Auto-Format] Iniciando formatação automática...');
      setAutoFormatacaoIniciada(true);
      formatarTodasPaginas();
    }
  }, [isLoading, paginas.length, formatacaoConcluida, autoFormatacaoIniciada, isFormatandoTudo, mostrarTelaBemVindo, analiseCapitulosConcluida]);

  // Recarregar páginas do cache após formatação
  const recarregarPaginasDoCache = async () => {
    const tituloParaBuscar = getTituloParaBusca();
    
    // Usar ILIKE para correspondência flexível
    const { data: paginasFormatadas, error } = await supabase
      .from("leitura_paginas_formatadas")
      .select("numero_pagina, html_formatado, is_chapter_start, capitulo_titulo, url_capa_capitulo, url_audio_capitulo, url_audio_pagina")
      .ilike("livro_titulo", `%${tituloParaBuscar}%`)
      .order("numero_pagina", { ascending: true });
    
    if (paginasFormatadas && paginasFormatadas.length > 0) {
      // Usar diretamente as páginas formatadas (já vêm corretas do backend)
      const novasPaginas: PaginaConteudo[] = paginasFormatadas.map((p: any) => ({
        numero: p.numero_pagina,
        capitulo: p.capitulo_titulo || '',
        conteudo: p.html_formatado || '',
        formatado: true,
        isChapterStart: p.is_chapter_start || false,
        urlCapaCapitulo: p.url_capa_capitulo || undefined,
        urlAudioCapitulo: p.url_audio_capitulo || undefined
      }));
      
      // Usar diretamente sem reorganizar (já vem organizado do backend)
      setPaginas(novasPaginas);
      setTotalPaginas(novasPaginas.length);
      
      // Disparar geração de capas em background para capítulos sem capa
      gerarCapasEmBackground(novasPaginas, tituloParaBuscar);
      
      return true;
    }
    
    return false;
  };

  // Gerar capas de capítulos em background
  const gerarCapasEmBackground = async (paginas: PaginaConteudo[], livroTitulo: string) => {
    const capitulosInicio = paginas.filter(p => p.isChapterStart && !p.urlCapaCapitulo);
    
    if (capitulosInicio.length === 0) return;
    
    console.log(`Gerando capas para ${capitulosInicio.length} capítulos...`);
    
    // Gerar uma capa por vez para não sobrecarregar
    for (const pagina of capitulosInicio) {
      if (!pagina.capitulo) continue;
      
      try {
        const response = await supabase.functions.invoke('gerar-capa-capitulo-leitura', {
          body: {
            livroTitulo,
            capituloTitulo: pagina.capitulo,
            numeroCapitulo: pagina.numero
          }
        });
        
        if (response.data?.imagem_url) {
          // Atualizar estado local com a nova capa
          setPaginas(prev => prev.map(p => 
            p.capitulo === pagina.capitulo && p.isChapterStart 
              ? { ...p, urlCapaCapitulo: response.data.imagem_url }
              : p
          ));
        }
        
        // Delay entre gerações para evitar rate limit
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        console.error(`Erro ao gerar capa para "${pagina.capitulo}":`, error);
      }
    }
  };

  // Formatar páginas POR CAPÍTULO - SÓ libera leitura quando 100% concluído
  const formatarTodasPaginas = async () => {
    setIsFormatandoTudo(true);
    const tituloParaBuscar = getTituloParaBusca();
    
    // Verificar se já existe cache formatado
    const { data: cacheExistente } = await supabase
      .from("leitura_paginas_formatadas")
      .select("id")
      .eq("livro_titulo", tituloParaBuscar)
      .limit(1);
    
    if (cacheExistente && cacheExistente.length > 0) {
      // Já existe cache, carregar dele
      const sucesso = await recarregarPaginasDoCache();
      if (sucesso) {
        setFormatacaoConcluida(true);
        setIsFormatandoTudo(false);
        return;
      }
    }
    
    // Se não há cache, iniciar formatação por capítulo
    try {
      // Buscar índice para saber quantos capítulos
      const { data: indiceData } = await supabase
        .from('leitura_livros_indice')
        .select('indice_capitulos')
        .eq('livro_titulo', tituloParaBuscar)
        .single();
      
      const numCapitulos = Array.isArray(indiceData?.indice_capitulos) ? indiceData.indice_capitulos.length : 1;
      setTotalCapitulosFormatar(numCapitulos);
      setCapituloFormatandoAtual(1);
      
      console.log(`[Reader] Iniciando formatação por capítulo: ${numCapitulos} capítulos`);
      
      // Chamar edge function que formata por capítulo
      const response = await supabase.functions.invoke('formatar-paginas-livro', {
        body: { tituloLivro: tituloParaBuscar }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      console.log('[Reader] Formatação por capítulo concluída:', response.data);
      
      // Recarregar páginas formatadas do cache
      const sucesso = await recarregarPaginasDoCache();
      
      if (!sucesso) {
        // Se falhou ao recarregar, manter páginas atuais
        console.warn('[Reader] Falha ao recarregar cache após formatação');
      }
      
      setFormatacaoConcluida(true);
    } catch (error) {
      console.error('Erro ao formatar por capítulo:', error);
      toast.error('Erro ao formatar livro. Tente novamente.');
      // Manter páginas atuais em caso de erro
      setFormatacaoConcluida(true);
    } finally {
      setIsFormatandoTudo(false);
      setFormatacaoEmBackground(false);
    }
  };

  // Função para abrir a leitura após formatação - SEMPRE começar na página 1
  const abrirLeitura = () => {
    setPaginaAtual(1);
    setMostrarTelaBemVindo(false);
  };

  // Scroll para topo ao mudar de página
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [paginaAtual]);

  // Verificar se página é apenas editorial (sem conteúdo relevante)
  const isPaginaEditorial = (conteudo: string) => {
    if (!conteudo) return true;
    const editorialPatterns = [
      'Esta página contém apenas informações editoriais',
      '[PAGINA_SEM_CONTEUDO]',
      'Conteúdo não disponível'
    ];
    return editorialPatterns.some(pattern => conteudo.includes(pattern));
  };

  // Verificar se o conteúdo é um sumário/índice (não deve exibir header de capítulo)
  const isSumarioOuIndice = (conteudo: string) => {
    if (!conteudo) return false;
    const texto = conteudo.toLowerCase();
    
    // Padrões que indicam sumário/índice
    const padroesSumario = [
      /capítulo\s+(um|dois|três|quatro|cinco|seis|sete|oito|nove|dez)[\s\S]{0,30}•\s*\d+/i,
      /capítulo\s+[ivxlc]+[\s\S]{0,30}[-–—•]\s*\d+/i,
      /capítulo\s+\d+[\s\S]{0,30}[-–—•]\s*\d+/i,
      /sumário|índice|contents|table of contents/i,
      /^[\s\S]{0,200}(capítulo\s+\w+[\s\S]{0,50}){3,}/i, // 3+ capítulos listados seguidos
    ];
    
    // Padrões de páginas editoriais/lixo
    const padroesEditorial = [
      /dados\s+de\s+odinright/i,
      /elivros/i,
      /sobre\s+a\s+obra/i,
      /domínio\s+público/i,
      /uso\s+comercial.*proibido/i,
      /ficha\s+catalográfica/i,
      /isbn[:\s]?[\d\-x]+/i,
      /copyright|©\s*\d{4}/i,
      /todos\s+os\s+direitos\s+reservados/i,
    ];

    // Verificar se é sumário
    for (const padrao of padroesSumario) {
      if (padrao.test(conteudo)) return true;
    }
    
    // Verificar se é editorial
    for (const padrao of padroesEditorial) {
      if (padrao.test(texto)) return true;
    }
    
    return false;
  };

  // Verificar se deve exibir header de capítulo
  const deveExibirHeaderCapitulo = (pagina: PaginaConteudo) => {
    if (!pagina.isChapterStart || !pagina.capitulo) return false;
    
    // Não exibir para capítulos com títulos editoriais
    const titulosEditoriais = [
      /dados\s+de\s+odinright/i,
      /sobre\s+a\s+obra/i,
      /ficha\s+catalográfica/i,
      /sumário/i,
      /índice/i,
    ];
    
    for (const padrao of titulosEditoriais) {
      if (padrao.test(pagina.capitulo)) return false;
    }
    
    // Verificar se o conteúdo é sumário/índice
    if (isSumarioOuIndice(pagina.conteudo)) return false;
    
    return true;
  };

  // Encontrar próxima página válida (pulando editoriais)
  const encontrarPaginaValida = (inicio: number, dir: 'left' | 'right'): number => {
    const step = dir === 'left' ? 1 : -1;
    let novaPagina = inicio;
    
    while (novaPagina >= 1 && novaPagina <= totalPaginas) {
      const paginaData = paginas[novaPagina - 1];
      if (paginaData && !isPaginaEditorial(paginaData.conteudo)) {
        return novaPagina;
      }
      novaPagina += step;
    }
    
    return paginaAtual;
  };

  // Som de página sendo virada - usando áudio real
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Criar elemento de áudio para som de página
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
  
  const playPageTurnSound = useCallback(() => {
    try {
      if (pageTurnAudioRef.current) {
        pageTurnAudioRef.current.currentTime = 0;
        pageTurnAudioRef.current.play().catch(() => {});
      }
    } catch (e) {
      // Silenciosamente ignora erros de áudio
    }
  }, []);

  const irParaPagina = (novaPagina: number, dir: 'left' | 'right') => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      const paginaValida = encontrarPaginaValida(novaPagina, dir);
      if (paginaValida !== paginaAtual) {
        // Parar áudio da página atual
        audioPaginaPlayerRef.current?.stop();
        audioPlayerRef.current?.pause();
        
        playPageTurnSound();
        setDirection(dir);
        setPaginaAtual(paginaValida);
      }
    }
  };

  const irParaCapitulo = (paginaInicio: number) => {
    const idx = paginas.findIndex(p => p.numero === paginaInicio);
    if (idx !== -1) {
      const paginaValida = encontrarPaginaValida(idx + 1, 'left');
      setDirection('left');
      setPaginaAtual(paginaValida);
    }
  };

  // Touch handlers para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && paginaAtual < totalPaginas) {
        irParaPagina(paginaAtual + 1, 'left');
      } else if (diff < 0 && paginaAtual > 1) {
        irParaPagina(paginaAtual - 1, 'right');
      }
    }
    setTouchStart(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || mostrarTelaBemVindo) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        irParaPagina(paginaAtual + 1, 'left');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        irParaPagina(paginaAtual - 1, 'right');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paginaAtual, totalPaginas, onClose, mostrarTelaBemVindo]);

  const progressPercent = totalPaginas > 0 ? (paginaAtual / totalPaginas) * 100 : 0;
  const progressFormatacao = totalPaginas > 0 ? ((paginas.filter(p => p.formatado).length) / totalPaginas) * 100 : 0;
  const paginaData = paginas[paginaAtual - 1];

  // Encontrar capítulo atual baseado na página - MUST be before any early returns
  const getCapituloAtual = useCallback(() => {
    if (indiceCapitulos.length === 0) return null;
    
    for (let i = indiceCapitulos.length - 1; i >= 0; i--) {
      if (paginaAtual >= indiceCapitulos[i].pagina_inicio) {
        return indiceCapitulos[i];
      }
    }
    return indiceCapitulos[0];
  }, [indiceCapitulos, paginaAtual]);

  const capituloAtual = getCapituloAtual();

  // Animação de virar página
  const pageVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -100 : 100,
      opacity: 0,
    }),
  };

  // Iniciar leitura - se já formatado, vai direto; senão formata tudo
  const iniciarLeitura = () => {
    if (formatacaoConcluida) {
      const primeiraPaginaValida = encontrarPaginaValida(1, 'left');
      setPaginaAtual(primeiraPaginaValida);
      setMostrarTelaBemVindo(false);
    } else {
      formatarTodasPaginas();
    }
  };

  // Tela de Boas-vindas/Capa e Formatação
  if (mostrarTelaBemVindo && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full w-full h-full max-h-full p-0 flex flex-col bg-gradient-to-b from-[#0d0d14] via-[#12121a] to-[#0d0d14] border-0 rounded-none sm:rounded-none">
          {/* Header simples */}
          <div className="flex items-center justify-end px-4 py-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              disabled={isFormatandoTudo}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 flex flex-col items-center justify-start px-6 pb-8 overflow-y-auto">
            {/* Capa do livro */}
            {imagemCapa && !isFormatandoTudo && !isAnalisandoCapitulos && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                <img 
                  src={imagemCapa} 
                  alt={tituloLivro}
                  className="relative w-36 h-48 object-cover rounded-lg shadow-2xl shadow-amber-500/20"
                />
              </motion.div>
            )}

            {/* Título e autor */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-4"
            >
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">
                {tituloLivro}
              </h1>
              {autorLivro && !isFormatandoTudo && !isAnalisandoCapitulos && (
                <p className="text-amber-400/80 font-serif text-sm">{autorLivro}</p>
              )}
            </motion.div>

            {/* Estado de análise de capítulos */}
            {isAnalisandoCapitulos && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm space-y-4 mb-6"
              >
                <div className="text-center space-y-2">
                  <BookMarked className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                  <p className="text-white font-serif text-sm">Analisando estrutura do livro...</p>
                  <p className="text-amber-400/70 text-xs">
                    Identificando capítulos e criando índice
                  </p>
                </div>
              </motion.div>
            )}

            {/* Estado de formatação por capítulo */}
            {isFormatandoTudo && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm space-y-4"
              >
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
                  <p className="text-white font-serif text-sm">Preparando livro para leitura...</p>
                  <p className="text-amber-400 text-xs">
                    Formatando capítulo {capituloFormatandoAtual} de {totalCapitulosFormatar || '...'}
                  </p>
                </div>
                
                <Progress 
                  value={totalCapitulosFormatar > 0 ? (capituloFormatandoAtual / totalCapitulosFormatar) * 100 : 0} 
                  className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" 
                />
                
                <p className="text-xs text-white/50 text-center">
                  Processando capítulos inteiros para evitar cortes
                </p>
              </motion.div>
            )}

            {/* Conteúdo quando não está formatando nem analisando */}
            {!isFormatandoTudo && !isAnalisandoCapitulos && (
              <>
                {/* Informações do livro */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-wrap items-center justify-center gap-3 mb-4"
                >
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white/80 text-xs">{totalPaginas} páginas</span>
                  </div>
                  
                  {indiceCapitulos.length > 0 && (
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                      <List className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white/80 text-xs">{indiceCapitulos.length} capítulos</span>
                    </div>
                  )}

                  {formatacaoConcluida && (
                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 text-xs">Pronto</span>
                    </div>
                  )}
                </motion.div>

                {/* Índice de capítulos */}
                {indiceCapitulos.length > 0 && analiseCapitulosConcluida && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="w-full max-w-md mb-4"
                  >
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookMarked className="w-4 h-4 text-amber-400" />
                        <p className="text-sm font-medium text-white">Índice</p>
                      </div>
                      
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                        {indiceCapitulos.map((cap, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
                          >
                            <span className="text-amber-400/60 font-mono text-xs w-6 flex-shrink-0">
                              {String(cap.numero).padStart(2, '0')}
                            </span>
                            <span className="text-white/80 flex-1 truncate text-xs">
                              {cap.titulo}
                            </span>
                            <span className="text-white/40 text-xs flex-shrink-0">
                              p.{cap.pagina_inicio}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Botão iniciar - só mostra quando formatação concluída */}
                {formatacaoConcluida && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Button
                      onClick={iniciarLeitura}
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-amber-500/30"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Ler
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 flex flex-col bg-[#0d0d14] border-0 rounded-none sm:rounded-none">
        {/* Header - mais organizado */}
        <div className="flex flex-col border-b border-white/10 bg-[#12121a]">
          {/* Linha principal */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <BookOpen className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="font-serif font-bold text-base text-white">{tituloLivro}</h2>
                {autorLivro && (
                  <p className="text-xs text-amber-400/70 font-serif">{autorLivro}</p>
                )}
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Indicador de formatação em background */}
              {formatacaoEmBackground && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-full animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span className="text-xs text-amber-400 hidden sm:inline">Preparando...</span>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0d0d14]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
              <p className="text-amber-400 font-serif">Carregando livro...</p>
            </div>
          ) : paginaData ? (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={paginaAtual}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "tween", duration: 0.15, ease: "easeOut" },
                  opacity: { duration: 0.1 }
                }}
                className="min-h-full px-4 sm:px-8 md:px-16 lg:px-24 py-8"
              >
                <div className="max-w-3xl mx-auto">
                  {/* Header de capítulo com capa (se for início de capítulo válido - não sumários/editoriais) */}
                  {deveExibirHeaderCapitulo(paginaData) && (
                    <div className="flex flex-col items-center justify-center text-center relative mb-8">
                      {/* Capa do capítulo */}
                      {paginaData.urlCapaCapitulo ? (
                        <div className="w-full aspect-video max-w-2xl mb-6 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                          <img 
                            src={paginaData.urlCapaCapitulo} 
                            alt={`Capa - ${paginaData.capitulo}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video max-w-2xl mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-amber-900/40 via-neutral-900/60 to-amber-900/40 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
                            <span className="text-amber-400/60 text-xs">Gerando capa...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Título do capítulo */}
                      <div className="py-4">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                          <span className="text-amber-400 text-xl">✦</span>
                          <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                        </div>
                        
                        <span className="text-amber-400/70 text-xs uppercase tracking-[0.3em] font-medium mb-2 block">
                          Capítulo
                        </span>
                        
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-4 px-4 leading-tight">
                          {paginaData.capitulo?.replace(/^(CAPÍTULO:\s*)/i, '')}
                        </h1>
                        
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                          <span className="text-amber-400 text-xl">✦</span>
                          <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                        </div>
                      </div>
                      
                      {/* Player de áudio do capítulo */}
                      {paginaData.urlAudioCapitulo && (
                        <div className="w-full max-w-2xl mt-4 px-4">
                          <AudioCapituloPlayer 
                            ref={audioPlayerRef}
                            audioUrl={paginaData.urlAudioCapitulo}
                            tituloCapitulo={paginaData.capitulo?.replace(/^(CAPÍTULO:\s*)/i, '')}
                            onPlayStateChange={setAudioEstaReproduzindo}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Conteúdo da página - tratar páginas editoriais/sumários como tela de título */}
                  {isPaginaEditorial(paginaData.conteudo) || isSumarioOuIndice(paginaData.conteudo) ? (
                    // Tela de título elegante para páginas sem conteúdo
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full" />
                        <div className="relative z-10 py-12">
                          <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                            <span className="text-amber-400 text-2xl">✦</span>
                            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                          </div>
                          
                          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                            {tituloLivro}
                          </h1>
                          
                          {autorLivro && (
                            <p className="text-amber-400/80 text-lg font-serif italic">{autorLivro}</p>
                          )}
                          
                          <div className="flex items-center justify-center gap-3 mt-6">
                            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                            <span className="text-amber-400 text-2xl">✦</span>
                            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                          </div>
                          
                          <p className="text-white/50 text-sm mt-8">
                            Deslize para começar a leitura →
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="prose prose-invert max-w-none leading-loose"
                      style={{ fontSize: `${fontSize}px`, lineHeight: '1.85', fontFamily: "'Merriweather', 'Georgia', serif" }}
                    >
                      {paginaData.conteudo && paginaData.conteudo !== 'Conteúdo não disponível' ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p 
                                className="mb-6 text-gray-200 leading-relaxed tracking-wide" 
                                style={{ 
                                  fontFamily: "'Merriweather', 'Georgia', serif",
                                  fontSize: `${fontSize}px`,
                                  lineHeight: '1.9',
                                  textAlign: 'justify',
                                  hyphens: 'auto'
                                }}
                              >
                                {children}
                              </p>
                            ),
                            h1: ({ children }) => (
                              <h1 
                                className="text-3xl font-bold mb-6 text-center text-white" 
                                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                              >
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 
                                className="text-2xl font-semibold mb-4 mt-8 text-amber-300 border-b border-amber-500/30 pb-2" 
                                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                              >
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 
                                className="text-xl font-medium mb-3 mt-6 text-amber-200 flex items-center gap-2" 
                                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                              >
                                <span className="text-amber-500 text-sm">▸</span>
                                {children}
                              </h3>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote 
                                className="relative my-8 py-6 px-8 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border-l-4 border-amber-500 rounded-r-2xl"
                                style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
                              >
                                <span className="absolute -top-2 left-3 text-6xl text-amber-500/20 select-none">"</span>
                                <div 
                                  className="relative z-10 text-amber-100/90 italic leading-relaxed"
                                  style={{ 
                                    fontSize: `${fontSize + 1}px`,
                                    lineHeight: '1.95',
                                    letterSpacing: '0.02em'
                                  }}
                                >
                                  {children}
                                </div>
                                <span className="absolute -bottom-4 right-6 text-6xl text-amber-500/20 select-none rotate-180">"</span>
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong 
                                className="font-bold text-amber-200"
                                style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontWeight: 700 }}
                              >
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em 
                                className="text-amber-100/80"
                                style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontStyle: 'italic' }}
                              >
                                {children}
                              </em>
                            ),
                            hr: () => (
                              <div className="flex items-center justify-center my-12 gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/50" />
                                <span className="text-amber-400 text-xl">✦</span>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/50" />
                              </div>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-4 my-6 pl-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="space-y-4 my-6 pl-2 list-decimal list-inside">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-3 text-gray-200" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                                <span className="text-amber-400 mt-1.5 text-sm flex-shrink-0">◆</span>
                                <span className="flex-1" style={{ lineHeight: '1.8' }}>{children}</span>
                              </li>
                            ),
                            // Renderização de imagens com zoom
                            img: ({ src, alt }) => (
                              <div className="my-6 flex justify-center">
                                <div className="relative group cursor-pointer" onClick={() => setImagemZoom(src || null)}>
                                  <img
                                    src={src}
                                    alt={alt || 'Imagem do livro'}
                                    className="max-w-full max-h-[60vh] rounded-lg shadow-xl shadow-black/40 border border-amber-500/20 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                  </div>
                                </div>
                              </div>
                            ),
                          }}
                        >
                          {/* Limpar Markdown mal formatado e remover títulos duplicados */}
                          {(() => {
                            let content = paginaData.conteudo;
                            
                            // Corrigir **## e **### que não devem existir
                            content = content
                              .replace(/\*\*\s*(#{2,3})\s*/g, '$1 ')
                              .replace(/(#{2,3})\s*\*\*/g, '$1 ')
                              .replace(/\*\*(#{2,3}[^*\n]+)\*\*/g, '$1')
                              .replace(/^##\s+\*\*([^*]+)\*\*$/gm, '## $1')
                              .replace(/^###\s+\*\*([^*]+)\*\*$/gm, '### $1');
                            
                            // Remover título duplicado se for início de capítulo
                            if (paginaData.isChapterStart && paginaData.capitulo) {
                              content = content
                                .replace(/^##\s*CAPÍTULO:\s*[^\n]+\n*/i, '')
                                .replace(/^##\s*[^\n]+\n*/i, '')
                                .replace(new RegExp(`^##\\s*${paginaData.capitulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n*`, 'i'), '')
                                .trim();
                            }
                            
                            return content;
                          })()}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-gray-400 text-center">
                          Conteúdo não disponível
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 font-serif">Conteúdo não disponível</p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-white/10 bg-[#12121a]">
          {/* Player de áudio do capítulo (aparece em todas as páginas do capítulo) */}
          {(() => {
            // Encontrar o áudio do capítulo atual
            const audioCapituloAtual = paginas.find(p => 
              p.isChapterStart && 
              p.urlAudioCapitulo && 
              capituloAtual && 
              p.capitulo?.includes(capituloAtual.titulo)
            )?.urlAudioCapitulo || 
            // Fallback: buscar pela página de início do capítulo
            paginas.find(p => 
              p.numero === capituloAtual?.pagina_inicio && 
              p.urlAudioCapitulo
            )?.urlAudioCapitulo;
            
            return audioCapituloAtual ? (
              <div className="px-4 py-2 border-b border-white/5">
                <AudioPaginaPlayer 
                  ref={audioPaginaPlayerRef}
                  audioUrl={audioCapituloAtual}
                  autoPlay={false}
                  onPlayStateChange={setAudioEstaReproduzindo}
                />
              </div>
            ) : null;
          })()}
          
          {/* Indicador do capítulo atual */}
          {capituloAtual && (
            <div className="px-4 py-2 border-b border-white/5 bg-amber-500/5">
              <p className="text-xs text-center">
                <span className="text-white/50">Lendo: </span>
                <span className="text-amber-400 font-medium">{capituloAtual.titulo}</span>
              </p>
            </div>
          )}
          
          {/* Barra de progresso */}
          <div className="px-4 pt-3">
            <Progress value={progressPercent} className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
          </div>
          
          {/* Controles de navegação */}
          <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => irParaPagina(paginaAtual - 1, 'right')}
              disabled={paginaAtual <= 1 || isLoading}
              className="h-12 w-12 sm:h-10 sm:w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-7 h-7 sm:w-6 sm:h-6" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Drawer de capítulos */}
              {indiceCapitulos.length > 0 && (
                <Drawer open={showChapterDrawer} onOpenChange={setShowChapterDrawer}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 sm:h-9 border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30 px-3 sm:px-4 gap-2 rounded-full transition-all"
                    >
                      <BookMarked className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Capítulos</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-[#12121a] border-t border-amber-500/20 max-h-[70vh]">
                    <div className="px-4 py-4 border-b border-white/10">
                      <h3 className="text-lg font-serif font-bold text-white text-center">Índice do Livro</h3>
                      <p className="text-xs text-amber-400/70 text-center mt-1">{indiceCapitulos.length} capítulos</p>
                    </div>
                    <div className="overflow-y-auto max-h-[50vh] py-2">
                      {indiceCapitulos.map((cap, idx) => (
                        <DrawerClose asChild key={idx}>
                          <button
                            onClick={() => {
                              irParaCapitulo(cap.pagina_inicio);
                              setShowChapterDrawer(false);
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                              capituloAtual?.numero === cap.numero 
                                ? 'bg-amber-500/15 border-l-2 border-amber-400' 
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <span className={`font-mono text-sm w-7 flex-shrink-0 ${
                              capituloAtual?.numero === cap.numero ? 'text-amber-400' : 'text-amber-400/60'
                            }`}>
                              {String(cap.numero).padStart(2, '0')}
                            </span>
                            <span className={`flex-1 text-sm ${
                              capituloAtual?.numero === cap.numero ? 'text-amber-400 font-medium' : 'text-white/80'
                            }`}>
                              {cap.titulo}
                            </span>
                            <span className="text-xs text-white/40">p.{cap.pagina_inicio}</span>
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              )}

              <div className="text-sm text-gray-400 bg-white/5 px-3 py-2 sm:py-1.5 rounded-full" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                <span className="font-bold text-white">{paginaAtual}</span>
                <span className="mx-1 sm:mx-1.5 text-white/30">/</span>
                <span>{totalPaginas}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => irParaPagina(paginaAtual + 1, 'left')}
              disabled={paginaAtual >= totalPaginas || isLoading}
              className="h-12 w-12 sm:h-10 sm:w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-7 h-7 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Floating Font Controls - Bottom Right */}
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
                    onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  >
                    <span className="text-lg font-bold">A+</span>
                  </Button>
                  <span className="text-xs text-amber-400 font-mono">{fontSize}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  >
                    <span className="text-sm font-bold">A-</span>
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
      </DialogContent>

      {/* Modal de Zoom para Imagens */}
      <Dialog open={!!imagemZoom} onOpenChange={() => setImagemZoom(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95 border-amber-500/20">
          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setImagemZoom(null)}
              className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </Button>
            {imagemZoom && (
              <img
                src={imagemZoom}
                alt="Imagem ampliada"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default LeituraDinamicaReader;
