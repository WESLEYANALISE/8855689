import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Minus, Plus, BookOpen, Loader2, Sparkles, List, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface LeituraInterativaProps {
  isOpen: boolean;
  onClose: () => void;
  livroTitulo: string;
  autor?: string;
  capaUrl?: string;
  totalPaginas: number;
  fonteTabela: string;
  livroId?: number;
}

interface Pagina {
  id: number;
  Livro: string;
  Conteúdo?: string;
}

// Nova interface para páginas repaginadas
interface PaginaRepaginada {
  tipo: 'conteudo' | 'transicao_parte' | 'transicao_livro' | 'transicao_capitulo';
  html?: string;
  estrutura?: {
    tipo: 'parte' | 'livro' | 'capitulo';
    nome: string;
    numero?: number;
    titulo?: string;
    posicao?: number;
  };
}

interface Capitulo {
  numero: number;
  titulo: string;
  parte?: string;
  pagina_inicio_estimada: number;
  pagina_inicio_real?: number;
  tema: string;
  cor_tema: string;
  icone: string;
  url_imagem?: string;
}

interface EstruturaCapitulos {
  capitulos: Capitulo[];
}

const iconMap: Record<string, React.ReactNode> = {
  book: <BookOpen className="w-12 h-12" />,
  scale: <span className="text-5xl">⚖️</span>,
  crown: <span className="text-5xl">👑</span>,
  sword: <span className="text-5xl">⚔️</span>,
  scroll: <span className="text-5xl">📜</span>,
  feather: <span className="text-5xl">🪶</span>,
  landmark: <span className="text-5xl">🏛️</span>,
  users: <span className="text-5xl">👥</span>,
  heart: <span className="text-5xl">❤️</span>,
  shield: <span className="text-5xl">🛡️</span>,
};

// Variantes de animação para transição de páginas
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.3,
};

const LeituraInterativa = ({
  isOpen,
  onClose,
  livroTitulo,
  autor,
  capaUrl,
  totalPaginas,
  fonteTabela,
  livroId
}: LeituraInterativaProps) => {
  const [paginas, setPaginas] = useState<Record<number, Pagina>>({});
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [fontSize, setFontSize] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [showCapa, setShowCapa] = useState(true);
  const [estruturaCapitulos, setEstruturaCapitulos] = useState<EstruturaCapitulos | null>(null);
  const [carregandoEstrutura, setCarregandoEstrutura] = useState(false);
  const [textoFormatado, setTextoFormatado] = useState<Record<number, string>>({});
  const [paginasRepaginadas, setPaginasRepaginadas] = useState<Record<number, PaginaRepaginada>>({});
  const [formatandoPagina, setFormatandoPagina] = useState(false);
  const [capituloAtual, setCapituloAtual] = useState<Capitulo | null>(null);
  const [mostrandoCapaCapitulo, setMostrandoCapaCapitulo] = useState(false);
  const [direction, setDirection] = useState(0);
  
  // Estados para formatação inicial
  const [formatacaoInicial, setFormatacaoInicial] = useState(false);
  const [progressoFormatacao, setProgressoFormatacao] = useState(0);
  const [paginasFormatadas, setPaginasFormatadas] = useState(0);
  const [livroJaFormatado, setLivroJaFormatado] = useState(false);
  const [formatacaoEmBackground, setFormatacaoEmBackground] = useState(false);
  const [totalPaginasRepaginadas, setTotalPaginasRepaginadas] = useState(0);

  // Estados para capas de capítulos e índice
  const [capasCapitulos, setCapasCapitulos] = useState<Record<number, string>>({});
  const [gerandoCapa, setGerandoCapa] = useState(false);
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [gerandoTodasCapas, setGerandoTodasCapas] = useState(false);
  const [progressoCapas, setProgressoCapas] = useState({ atual: 0, total: 0 });
  
  // Rastrear quais capítulos já tiveram a capa vista
  const [capitulosCapaVista, setCapitulosCapaVista] = useState<Set<number>>(new Set());

  // Calcular capítulo atual baseado na página
  const capituloAtualNavegacao = useMemo(() => {
    if (!estruturaCapitulos || paginaAtual === 0) return null;
    
    return estruturaCapitulos.capitulos.reduce((atual, cap) => {
      if (cap.pagina_inicio_estimada <= paginaAtual) {
        return cap;
      }
      return atual;
    }, estruturaCapitulos.capitulos[0]);
  }, [estruturaCapitulos, paginaAtual]);

  // Detectar capítulo no HTML da página atual
  const detectarCapituloNoHtml = useCallback((html: string): Capitulo | null => {
    if (!estruturaCapitulos || !html) return null;
    
    // Regex para detectar títulos de capítulo no HTML
    const regexCapitulo = /CAPÍTULO\s+([IVXLCDM\d]+)/i;
    const match = html.match(regexCapitulo);
    
    if (match) {
      const numeroRomano = match[1];
      // Encontrar o capítulo correspondente na estrutura
      const capitulo = estruturaCapitulos.capitulos.find(cap => {
        // Converter número para romano ou verificar diretamente
        const numeroCapRomano = converterParaRomano(cap.numero);
        return numeroRomano.toUpperCase() === numeroCapRomano || 
               numeroRomano === String(cap.numero);
      });
      return capitulo || null;
    }
    return null;
  }, [estruturaCapitulos]);

  // Converter número para romano
  const converterParaRomano = (num: number): string => {
    const romanos: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, symbol] of romanos) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  // Estado para formatação do banco
  const [formatacaoStatus, setFormatacaoStatus] = useState<string>('');
  const [carregandoDoBanco, setCarregandoDoBanco] = useState(false);

  // Verificar se já está formatado na nova tabela LEITURA_FORMATADA
  const verificarCacheCompleto = useCallback(async (): Promise<boolean> => {
    if (!livroId) return false;
    
    try {
      // Primeiro verificar na nova tabela LEITURA_FORMATADA
      const { data } = await supabase
        .from('LEITURA_FORMATADA')
        .select('status, total_paginas')
        .eq('biblioteca_classicos_id', livroId)
        .single();
      
      if (data?.status === 'concluido' && data.total_paginas > 0) {
        return true;
      }
    } catch (error) {
      console.log('[LeituraInterativa] Verificando cache local como fallback');
    }
    
    // Fallback: verificar localStorage
    const cacheKey = `leitura_completa_${livroId || 'default'}`;
    return localStorage.getItem(cacheKey) === 'true';
  }, [livroId]);

  // Carregar páginas formatadas da nova tabela LEITURA_FORMATADA
  const carregarDoBanco = useCallback(async (): Promise<Record<number, string>> => {
    if (!livroId) return {};
    
    setCarregandoDoBanco(true);
    try {
      // Carregar da nova tabela LEITURA_FORMATADA
      const { data, error } = await supabase
        .from('LEITURA_FORMATADA')
        .select('paginas, estrutura, status, progresso, total_paginas')
        .eq('biblioteca_classicos_id', livroId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[LeituraInterativa] Erro ao carregar do banco:', error);
        return {};
      }
      
      if (data?.paginas && typeof data.paginas === 'object') {
        const paginasBanco = data.paginas as Record<string, any>;
        const formatados: Record<number, string> = {};
        const repaginadas: Record<number, PaginaRepaginada> = {};
        
        Object.entries(paginasBanco).forEach(([key, value]) => {
          const numPagina = parseInt(key);
          
          // Novo formato da LEITURA_FORMATADA
          if (typeof value === 'object' && value !== null && 'tipo' in value) {
            repaginadas[numPagina] = value as PaginaRepaginada;
            if (value.html) {
              formatados[numPagina] = value.html;
            }
          } else if (typeof value === 'string') {
            formatados[numPagina] = value;
          }
        });
        
        if (Object.keys(repaginadas).length > 0) {
          console.log(`[LeituraInterativa] ${Object.keys(repaginadas).length} páginas repaginadas carregadas da LEITURA_FORMATADA`);
          setPaginasRepaginadas(repaginadas);
          setTotalPaginasRepaginadas(data.total_paginas || Object.keys(repaginadas).length);
        }
        
        // Carregar estrutura de capítulos para navegação
        const estruturaData = data.estrutura as any;
        if (estruturaData?.capitulos_navegacao) {
          const caps = estruturaData.capitulos_navegacao.map((cap: any) => ({
            numero: cap.numero,
            titulo: cap.titulo || cap.nome,
            pagina_inicio_estimada: cap.pagina,
            pagina_inicio_real: cap.pagina,
            tema: cap.titulo || '',
            cor_tema: '#6366f1',
            icone: 'book'
          }));
          setEstruturaCapitulos({ capitulos: caps });
        }
        
        if (Object.keys(formatados).length > 0) {
          console.log(`[LeituraInterativa] ${Object.keys(formatados).length} páginas formatadas carregadas`);
          setTextoFormatado(formatados);
          setFormatacaoStatus(data.status || '');
          return formatados;
        }
      }
    } catch (error) {
      console.error('[LeituraInterativa] Erro ao carregar do banco:', error);
    } finally {
      setCarregandoDoBanco(false);
    }
    
    // Fallback: carregar do localStorage
    return carregarDoLocalStorage();
  }, [livroId]);

  // Fallback: Carregar do localStorage
  const carregarDoLocalStorage = useCallback(() => {
    const formatados: Record<number, string> = {};
    for (let i = 1; i <= totalPaginas; i++) {
      const cacheKey = `leitura_formatada_${livroId || 'default'}_${i}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        formatados[i] = cached;
      }
    }
    if (Object.keys(formatados).length > 0) {
      setTextoFormatado(formatados);
    }
    return formatados;
  }, [livroId, totalPaginas]);

  // Carregar capas de capítulos do banco (de estrutura_capitulos na leitura_interativa)
  const carregarCapasCapitulos = useCallback(async () => {
    if (!livroId) return;
    try {
      // Primeiro tentar carregar da leitura_interativa (fonte principal)
      const { data: leituraData } = await supabase
        .from('leitura_interativa')
        .select('estrutura_capitulos')
        .eq('biblioteca_classicos_id', livroId)
        .single();

      if (leituraData?.estrutura_capitulos) {
        const estrutura = leituraData.estrutura_capitulos as any;
        const capas: Record<number, string> = {};
        
        if (estrutura.capitulos) {
          estrutura.capitulos.forEach((cap: any) => {
            if (cap.url_imagem && cap.numero) {
              capas[cap.numero] = cap.url_imagem;
            }
          });
        }
        
        if (Object.keys(capas).length > 0) {
          console.log('[LeituraInterativa] Capas carregadas da estrutura:', Object.keys(capas).length);
          setCapasCapitulos(capas);
          return;
        }
      }
      
      // Fallback: tentar resumo_capitulos do BIBLIOTECA-CLASSICOS
      const { data } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('resumo_capitulos')
        .eq('id', livroId)
        .single();

      if (data?.resumo_capitulos) {
        const resumo = data.resumo_capitulos as any;
        const capas: Record<number, string> = {};
        
        if (resumo.introducao?.url_imagem) {
          capas[0] = resumo.introducao.url_imagem;
        }
        
        if (resumo.capitulos) {
          resumo.capitulos.forEach((cap: any, index: number) => {
            if (cap.url_imagem) {
              capas[index + 1] = cap.url_imagem;
            }
          });
        }
        
        setCapasCapitulos(capas);
      }
    } catch (error) {
      console.error('Erro ao carregar capas:', error);
    }
  }, [livroId]);

  useEffect(() => {
    const inicializar = async () => {
      if (isOpen && livroId) {
        carregarEstrutura();
        carregarCapasCapitulos();
        const dados = await carregarDoBanco();
        
        // Verificar se já está formatado
        if (Object.keys(dados).length >= totalPaginas * 0.9) {
          setLivroJaFormatado(true);
        } else {
          setLivroJaFormatado(false);
        }
      }
    };
    
    inicializar();
    
    if (isOpen) {
      setShowCapa(true);
      setPaginaAtual(0);
      setFormatacaoInicial(false);
      setProgressoFormatacao(0);
      setPaginasFormatadas(0);
      setCapitulosCapaVista(new Set());
      setFormatacaoEmBackground(false);
    }
  }, [isOpen, livroId, carregarDoBanco, carregarCapasCapitulos, totalPaginas]);

  // POLLING: Buscar progresso da formatação em tempo real (nova tabela LEITURA_FORMATADA)
  useEffect(() => {
    if (!formatacaoEmBackground || !livroId) return;

    console.log('[LeituraInterativa] Iniciando polling de progresso...');
    
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('LEITURA_FORMATADA')
          .select('progresso, status, paginas, total_paginas, estrutura')
          .eq('biblioteca_classicos_id', livroId)
          .single();
        
        if (data) {
          const paginasObj = data.paginas as Record<string, any> | null;
          const numPaginas = paginasObj ? Object.keys(paginasObj).length : 0;
          
          setProgressoFormatacao(data.progresso || 0);
          setPaginasFormatadas(numPaginas);
          setTotalPaginasRepaginadas(data.total_paginas || numPaginas);
          
          // Atualizar textos formatados em tempo real
          if (paginasObj && numPaginas > Object.keys(textoFormatado).length) {
            const formatados: Record<number, string> = {};
            const repaginadas: Record<number, PaginaRepaginada> = {};
            
            Object.entries(paginasObj).forEach(([key, value]) => {
              const numPagina = parseInt(key);
              if (typeof value === 'object' && value !== null && 'tipo' in value) {
                repaginadas[numPagina] = value as PaginaRepaginada;
                if (value.html) formatados[numPagina] = value.html;
              } else if (typeof value === 'string') {
                formatados[numPagina] = value;
              }
            });
            
            if (Object.keys(repaginadas).length > 0) setPaginasRepaginadas(repaginadas);
            setTextoFormatado(formatados);
            
            // Atualizar estrutura de capítulos
            const estruturaData = data.estrutura as any;
            if (estruturaData?.capitulos_navegacao && !estruturaCapitulos) {
              const caps = estruturaData.capitulos_navegacao.map((cap: any) => ({
                numero: cap.numero,
                titulo: cap.titulo || cap.nome,
                pagina_inicio_estimada: cap.pagina,
                pagina_inicio_real: cap.pagina,
                tema: cap.titulo || '',
                cor_tema: '#6366f1',
                icone: 'book'
              }));
              setEstruturaCapitulos({ capitulos: caps });
            }
          }
          
          // Verificar se formatação concluiu
          if (data.status === 'concluido') {
            console.log('[LeituraInterativa] Formatação concluída!');
            clearInterval(interval);
            setFormatacaoEmBackground(false);
            setFormatacaoInicial(false);
            setLivroJaFormatado(true);
            toast.success('Livro formatado com sucesso!');
            
            // Se o usuário ainda está na tela de formatação, ir para leitura
            if (showCapa === false && paginaAtual === 0) {
              setPaginaAtual(1);
            }
          } else if (data.status === 'erro') {
            console.error('[LeituraInterativa] Erro na formatação');
            clearInterval(interval);
            setFormatacaoEmBackground(false);
            setFormatacaoInicial(false);
            toast.error('Erro ao formatar. Tente novamente.');
          }
        }
      } catch (error) {
        console.error('[LeituraInterativa] Erro no polling:', error);
      }
    }, 2000); // Polling a cada 2 segundos
    
    return () => {
      console.log('[LeituraInterativa] Parando polling');
      clearInterval(interval);
    };
  }, [formatacaoEmBackground, livroId, showCapa, paginaAtual, textoFormatado]);

  // Carregar página quando navegar
  useEffect(() => {
    if (isOpen && paginaAtual > 0 && !formatacaoInicial) {
      carregarPagina(paginaAtual);
    }
  }, [isOpen, paginaAtual, formatacaoInicial]);

  const romanToNumber = useCallback((roman: string): number | null => {
    const romanMap: Record<string, number> = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
      'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
      'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25,
      'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30
    };
    return romanMap[roman.toUpperCase()] || null;
  }, []);

  // Detectar início de capítulo - NOVO: Verificar páginas repaginadas primeiro
  useEffect(() => {
    // Nunca detectar capítulo na página 1 ou quando já está mostrando capa
    if (paginaAtual <= 0 || mostrandoCapaCapitulo) return;
    
    // NOVO: Verificar se é uma página de transição do sistema repaginado
    const paginaRepaginada = paginasRepaginadas[paginaAtual];
    if (paginaRepaginada && paginaRepaginada.tipo !== 'conteudo') {
      // É uma página de transição - criar capítulo temporário para exibir
      const estruturaTransicao = paginaRepaginada.estrutura;
      if (estruturaTransicao) {
        const numeroTransicao = estruturaTransicao.numero || 0;
        
        // CORREÇÃO: Verificar se esta transição já foi vista
        if (capitulosCapaVista.has(numeroTransicao)) {
          return; // Já viu esta capa, não mostrar novamente
        }
        
        const corTema = paginaRepaginada.tipo === 'transicao_parte' 
          ? '#8B5CF6' 
          : paginaRepaginada.tipo === 'transicao_livro' 
            ? '#3B82F6' 
            : '#10B981';
        
        const capituloTransicao: Capitulo = {
          numero: numeroTransicao,
          titulo: estruturaTransicao.titulo || estruturaTransicao.nome,
          parte: estruturaTransicao.tipo === 'parte' ? estruturaTransicao.nome : undefined,
          pagina_inicio_estimada: paginaAtual,
          pagina_inicio_real: paginaAtual,
          tema: estruturaTransicao.nome,
          cor_tema: corTema,
          icone: estruturaTransicao.tipo === 'parte' ? 'scroll' : estruturaTransicao.tipo === 'livro' ? 'book' : 'feather'
        };
        
        setCapituloAtual(capituloTransicao);
        setMostrandoCapaCapitulo(true);
        return;
      }
    }
    
    // Fallback: Sistema antigo de detecção por HTML
    if (!estruturaCapitulos || paginaAtual <= 1) return;
    
    const html = textoFormatado[paginaAtual];
    let capituloDetectado: Capitulo | null = null;
    
    // 1. Primeiro: Tentar detectar pelo HTML (mais preciso)
    if (html) {
      const regexCapitulo = /CAPÍTULO\s+([IVXLCDM]+|\d+)/i;
      const match = html.match(regexCapitulo);
      
      if (match) {
        const numeroStr = match[1].toUpperCase();
        const numero = romanToNumber(numeroStr) || parseInt(numeroStr, 10);
        
        if (!isNaN(numero)) {
          capituloDetectado = estruturaCapitulos.capitulos.find(c => c.numero === numero) || null;
        }
      }
    }
    
    // 2. Fallback por página real (se detectada durante formatação)
    if (!capituloDetectado) {
      capituloDetectado = estruturaCapitulos.capitulos.find(
        cap => cap.pagina_inicio_real === paginaAtual
      ) || null;
    }
    
    // 3. Fallback por estimativa
    if (!capituloDetectado) {
      capituloDetectado = estruturaCapitulos.capitulos.find(
        cap => cap.pagina_inicio_estimada === paginaAtual
      ) || null;
    }
    
    // 4. Se detectou capítulo, mostrar capa APENAS se ainda não foi vista
    if (capituloDetectado && !capitulosCapaVista.has(capituloDetectado.numero)) {
      setCapituloAtual(capituloDetectado);
      setMostrandoCapaCapitulo(true);
    }
  }, [paginaAtual, textoFormatado, paginasRepaginadas, estruturaCapitulos, mostrandoCapaCapitulo, capitulosCapaVista, romanToNumber]);

  const carregarEstrutura = async () => {
    if (!livroId) return;
    try {
      const { data } = await supabase
        .from('leitura_interativa')
        .select('estrutura_capitulos')
        .eq('biblioteca_classicos_id', livroId)
        .single();

      if (data?.estrutura_capitulos) {
        const estrutura = data.estrutura_capitulos as unknown as EstruturaCapitulos;
        if (estrutura.capitulos && estrutura.capitulos.length > 0) {
          setEstruturaCapitulos(estrutura);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estrutura:', error);
    }
  };

  const gerarEstrutura = async () => {
    if (!livroId) return;
    setCarregandoEstrutura(true);
    try {
      const { data, error } = await supabase.functions.invoke('processar-estrutura-livro', {
        body: { livroId, totalPaginas, livroTitulo }
      });

      if (error) throw error;
      setEstruturaCapitulos(data);
      toast.success('Estrutura de capítulos gerada!');
    } catch (error) {
      console.error('Erro ao gerar estrutura:', error);
      toast.error('Erro ao processar estrutura do livro');
    } finally {
      setCarregandoEstrutura(false);
    }
  };

  // Gerar capa de um capítulo específico (retorna sucesso/falha)
  const gerarCapaCapituloSingle = async (capitulo: Capitulo, textoContexto?: string): Promise<boolean> => {
    if (!livroId) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-imagem-capitulo', {
        body: {
          livroId,
          biblioteca: 'classicos',
          tituloLivro: livroTitulo,
          autorLivro: autor || '',
          tituloCapitulo: capitulo.titulo,
          textoCapitulo: textoContexto || capitulo.tema,
          pageIndex: capitulo.numero
        }
      });

      if (error) throw error;

      if (data?.url_imagem) {
        setCapasCapitulos(prev => ({ ...prev, [capitulo.numero]: data.url_imagem }));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao gerar capa do capítulo ${capitulo.numero}:`, error);
      return false;
    }
  };

  // Gerar TODAS as capas em sequência
  const gerarTodasCapas = async (capituloInicial?: Capitulo) => {
    if (!livroId || !estruturaCapitulos) return;
    
    setGerandoTodasCapas(true);
    const capitulosSemCapa = estruturaCapitulos.capitulos.filter(
      cap => !capasCapitulos[cap.numero]
    );
    
    setProgressoCapas({ atual: 0, total: capitulosSemCapa.length });
    toast.info(`Gerando ${capitulosSemCapa.length} capas de capítulos...`);
    
    let sucessos = 0;
    
    for (let i = 0; i < capitulosSemCapa.length; i++) {
      const cap = capitulosSemCapa[i];
      setProgressoCapas({ atual: i + 1, total: capitulosSemCapa.length });
      
      const sucesso = await gerarCapaCapituloSingle(cap);
      if (sucesso) sucessos++;
      
      // Pequena pausa entre gerações para não sobrecarregar a API
      if (i < capitulosSemCapa.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setGerandoTodasCapas(false);
    setProgressoCapas({ atual: 0, total: 0 });
    
    if (sucessos === capitulosSemCapa.length) {
      toast.success(`Todas as ${sucessos} capas geradas com sucesso!`);
    } else {
      toast.warning(`${sucessos} de ${capitulosSemCapa.length} capas geradas.`);
    }
  };

  // Função wrapper para gerar capa - dispara geração de todas
  const gerarCapaCapitulo = async (capitulo: Capitulo, textoContexto?: string) => {
    if (!livroId || !estruturaCapitulos) return;
    
    setGerandoCapa(true);
    
    // Gerar a capa do capítulo atual primeiro
    const sucesso = await gerarCapaCapituloSingle(capitulo, textoContexto);
    
    if (sucesso) {
      toast.success(`Capa do Capítulo ${capitulo.numero} gerada!`);
      
      // Verificar se há outras capas para gerar
      const capitulosSemCapa = estruturaCapitulos.capitulos.filter(
        cap => cap.numero !== capitulo.numero && !capasCapitulos[cap.numero]
      );
      
      if (capitulosSemCapa.length > 0) {
        setGerandoCapa(false);
        // Iniciar geração das demais capas em background
        gerarTodasCapas();
      } else {
        setGerandoCapa(false);
      }
    } else {
      toast.error('Erro ao gerar capa do capítulo');
      setGerandoCapa(false);
    }
  };

  // Função para limpar HTML do Gemini (remove markdown e estrutura completa)
  const limparConteudoHtml = useCallback((html: string): string => {
    if (!html) return '';
    
    let limpo = html.trim();
    
    // Remover blocos markdown ```html ... ```
    limpo = limpo.replace(/^```html\s*/gi, '');
    limpo = limpo.replace(/^```\s*/gi, '');
    limpo = limpo.replace(/```\s*$/gi, '');
    
    // Extrair conteúdo do body se existir estrutura HTML completa
    const bodyMatch = limpo.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      limpo = bodyMatch[1];
    }
    
    // Remover tags de estrutura HTML completa
    limpo = limpo.replace(/<!DOCTYPE[^>]*>/gi, '');
    limpo = limpo.replace(/<\/?html[^>]*>/gi, '');
    limpo = limpo.replace(/<head>[\s\S]*?<\/head>/gi, '');
    limpo = limpo.replace(/<\/?body[^>]*>/gi, '');
    limpo = limpo.replace(/<meta[^>]*>/gi, '');
    limpo = limpo.replace(/<title>[\s\S]*?<\/title>/gi, '');
    limpo = limpo.replace(/<style>[\s\S]*?<\/style>/gi, '');
    
    return limpo.trim();
  }, []);

  const formatarTextoBasico = (texto: string): string => {
    if (!texto) return '';
    
    let textoLimpo = texto
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
    
    const paragrafos = textoLimpo.split(/\n\n+/);
    
    return paragrafos.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      
      if (/^(CAPÍTULO|LIVRO|PARTE|TÍTULO|SEÇÃO)\s+([IVXLCDM\d]+)/i.test(trimmed)) {
        const match = trimmed.match(/^(CAPÍTULO|LIVRO|PARTE|TÍTULO|SEÇÃO)\s+([IVXLCDM\d]+)\s*[-–:]?\s*(.*)$/i);
        if (match) {
          const tipo = match[1].toUpperCase();
          const numero = match[2];
          const titulo = match[3] || '';
          return `<h2 class="chapter-title">${tipo} ${numero}${titulo ? `<br/><span class="chapter-subtitle">${titulo}</span>` : ''}</h2>`;
        }
      }
      
      if (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.includes('.')) {
        return `<h3 class="subtitle">${trimmed}</h3>`;
      }
      
      if (trimmed.startsWith('"') || trimmed.startsWith('«') || trimmed.startsWith('"')) {
        return `<blockquote>${trimmed}</blockquote>`;
      }
      
      if (/^\[\d+\]/.test(trimmed) || /^\d+\.\s/.test(trimmed) && trimmed.length < 200) {
        return `<p class="footnote">${trimmed}</p>`;
      }
      
      return `<p class="indent">${trimmed}</p>`;
    }).filter(Boolean).join('');
  };

  // Formatar uma única página com Gemini
  const formatarPaginaComGemini = async (numeroPagina: number, texto: string): Promise<string> => {
    const cacheKey = `leitura_formatada_${livroId || 'default'}_${numeroPagina}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('formatar-leitura', {
        body: { texto, livroTitulo, paginaNumero: numeroPagina }
      });

      if (error) throw error;
      
      if (data?.html_formatado) {
        localStorage.setItem(cacheKey, data.html_formatado);
        return data.html_formatado;
      }
      throw new Error('Sem resposta');
    } catch (error) {
      console.error(`Erro ao formatar página ${numeroPagina}:`, error);
      const formatado = formatarTextoBasico(texto);
      localStorage.setItem(cacheKey, formatado);
      return formatado;
    }
  };

  // Iniciar formatação de todas as páginas (usando Edge Function para salvar no banco)
  const iniciarFormatacao = async () => {
    if (!livroId) return;

    // Primeiro: Verificar se já existe no banco
    const dadosBanco = await carregarDoBanco();
    if (Object.keys(dadosBanco).length >= totalPaginas * 0.9) {
      console.log('[LeituraInterativa] Livro já formatado no banco');
      setShowCapa(false);
      setPaginaAtual(1);
      return;
    }

    // Se não existe no banco, chamar Edge Function para formatar
    setFormatacaoInicial(true);
    setProgressoFormatacao(0);
    setPaginasFormatadas(0);
    toast.info('Iniciando formatação do livro...');

    try {
      // Chamar nova Edge Function que formata e salva na LEITURA_FORMATADA
      const { data, error } = await supabase.functions.invoke('formatar-leitura-interativa', {
        body: { 
          livroId, 
          livroTitulo,
          autor,
          capaUrl,
          forcarReformatar: false 
        }
      });

      if (error) throw error;

      if (data?.status === 'concluido') {
        const formatadosDoBanco = await carregarDoBanco();
        setTextoFormatado(formatadosDoBanco);
        setFormatacaoInicial(false);
        setShowCapa(false);
        setPaginaAtual(1);
        toast.success('Livro carregado!');
        return;
      }

      if (data?.status === 'iniciando' || data?.status === 'em_progresso') {
        console.log('[LeituraInterativa] Formatação iniciada em background');
        setFormatacaoEmBackground(true);
      }
    } catch (error) {
      console.error('[LeituraInterativa] Erro na Edge Function, tentando formatação local:', error);
      
      // Fallback: formatação local (método antigo)
      await formatarLocalmente();
    }
  };

  // Ler páginas disponíveis (durante formatação em background)
  const lerPaginasDisponiveis = () => {
    setFormatacaoInicial(false);
    setShowCapa(false);
    setPaginaAtual(1);
    toast.info(`Lendo ${paginasFormatadas} páginas disponíveis. Formatação continua em background.`);
  };

  // Forçar reformatação completa (apaga tudo e refaz)
  const forcarReformatacao = async () => {
    if (!livroId) return;

    setFormatacaoInicial(true);
    setProgressoFormatacao(0);
    setPaginasFormatadas(0);
    setTextoFormatado({});
    setLivroJaFormatado(false);
    setShowCapa(false);
    
    // Limpar localStorage
    for (let i = 1; i <= totalPaginas; i++) {
      localStorage.removeItem(`leitura_formatada_${livroId}_${i}`);
    }
    localStorage.removeItem(`leitura_completa_${livroId}`);
    
    toast.info('Reiniciando formatação completa...');

    try {
      const { data, error } = await supabase.functions.invoke('formatar-leitura-interativa', {
        body: { 
          livroId, 
          livroTitulo,
          autor,
          capaUrl,
          forcarReformatar: true 
        }
      });

      if (error) throw error;

      if (data?.status === 'iniciando' || data?.status === 'em_progresso') {
        console.log('[LeituraInterativa] Reformatação iniciada em background');
        setFormatacaoEmBackground(true);
      }
    } catch (error) {
      console.error('[LeituraInterativa] Erro ao reformatar:', error);
      toast.error('Erro ao reformatar. Tente novamente.');
      setFormatacaoInicial(false);
    }
  };

  // Formatação local removida - usar apenas Edge Function
  const formatarLocalmente = async () => {
    console.log('[LeituraInterativa] Formatação local desativada - usando Edge Function');
    toast.info('Usando formatação via servidor...');
    
    // Chamar a nova Edge Function de formatação
    try {
      const { data, error } = await supabase.functions.invoke('formatar-leitura-interativa', {
        body: {
          livroId,
          livroTitulo,
          autor,
          capaUrl,
          forcarReformatar: true
        }
      });
      
      if (error) throw error;
      
      if (data?.status === 'iniciando' || data?.status === 'em_progresso') {
        setFormatacaoEmBackground(true);
        toast.success('Formatação iniciada em background!');
      }
    } catch (error) {
      console.error('Erro ao iniciar formatação:', error);
      toast.error('Erro ao iniciar formatação');
    }
  };

  const carregarPagina = async (numeroPagina: number) => {
    // Se já temos o texto formatado, não precisa carregar nada
    if (textoFormatado[numeroPagina]) {
      return;
    }
    
    // Verificar cache localStorage
    const cacheKey = `leitura_formatada_${livroId || 'default'}_${numeroPagina}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTextoFormatado(prev => ({ ...prev, [numeroPagina]: cached }));
      return;
    }
    
    // Se não tem texto formatado, a página ainda não foi processada
    // O sistema de repaginação processa tudo de uma vez
    console.log(`[LeituraInterativa] Página ${numeroPagina} não disponível - aguardando formatação`);
  };

  const aumentarFonte = () => setFontSize(prev => Math.min(prev + 2, 28));
  const diminuirFonte = () => setFontSize(prev => Math.max(prev - 2, 12));

  const proximaPagina = () => {
    const totalReal = totalPaginasRepaginadas > 0 ? totalPaginasRepaginadas : totalPaginas;
    console.log('[LeituraInterativa] proximaPagina chamado:', { 
      mostrandoCapaCapitulo, 
      capituloAtual: capituloAtual?.numero, 
      paginaAtual, 
      totalReal 
    });
    setDirection(1);
    if (mostrandoCapaCapitulo && capituloAtual) {
      // Marcar capa como vista antes de continuar
      setCapitulosCapaVista(prev => new Set(prev).add(capituloAtual.numero));
      setMostrandoCapaCapitulo(false);
      setCapituloAtual(null);
      console.log('[LeituraInterativa] Capa do capítulo fechada, mostrando conteúdo');
    } else if (paginaAtual < totalReal) {
      setPaginaAtual(prev => prev + 1);
      console.log('[LeituraInterativa] Avançando para página:', paginaAtual + 1);
    }
  };

  const paginaAnterior = () => {
    setDirection(-1);
    if (mostrandoCapaCapitulo && capituloAtual) {
      // NÃO marcar como vista ao voltar - só marca quando avança ("Começar Capítulo")
      // Assim a capa aparece novamente quando o usuário navegar para frente
      setMostrandoCapaCapitulo(false);
      setCapituloAtual(null);
      // Voltar para página anterior
      if (paginaAtual > 1) {
        setPaginaAtual(prev => prev - 1);
      }
    } else if (paginaAtual === 1) {
      setShowCapa(true);
      setPaginaAtual(0);
    } else if (paginaAtual > 1) {
      setPaginaAtual(prev => prev - 1);
    }
  };

  // Função para revalidar/reformatar uma página específica
  const revalidarPagina = async (numeroPagina: number) => {
    const cacheKey = `leitura_formatada_${livroId || 'default'}_${numeroPagina}`;
    localStorage.removeItem(cacheKey);
    
    const paginaOriginal = paginas[numeroPagina];
    if (paginaOriginal?.Livro) {
      setFormatandoPagina(true);
      toast.info('Reformatando página...');
      const novoHtml = await formatarPaginaComGemini(numeroPagina, paginaOriginal.Livro);
      setTextoFormatado(prev => ({ ...prev, [numeroPagina]: novoHtml }));
      setFormatandoPagina(false);
      toast.success('Página reformatada!');
    }
  };

  // Navegar para um capítulo específico - usa página REAL se disponível
  const navegarParaCapitulo = (capitulo: Capitulo) => {
    // Remover do conjunto de capas vistas para forçar exibição da capa
    setCapitulosCapaVista(prev => {
      const newSet = new Set(prev);
      newSet.delete(capitulo.numero);
      return newSet;
    });
    setCapituloAtual(capitulo);
    setMostrandoCapaCapitulo(true);
    // IMPORTANTE: Usar página REAL detectada pelo conteúdo, senão usar estimada
    const paginaDestino = capitulo.pagina_inicio_real || capitulo.pagina_inicio_estimada;
    console.log(`[LeituraInterativa] Navegando para Cap ${capitulo.numero}: real=${capitulo.pagina_inicio_real}, estimada=${capitulo.pagina_inicio_estimada}, destino=${paginaDestino}`);
    setPaginaAtual(paginaDestino);
    setIndiceAberto(false);
    setShowCapa(false);
  };

  const paginaConteudo = paginas[paginaAtual];
  const conteudoFormatado = textoFormatado[paginaAtual];
  // Usar total repaginado se disponível, senão usar total original
  const totalPaginasReal = totalPaginasRepaginadas > 0 ? totalPaginasRepaginadas : totalPaginas;
  const progresso = totalPaginasReal > 0 ? (paginaAtual / totalPaginasReal) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-medium truncate max-w-[180px]">{livroTitulo}</h1>
          {/* Indicador de Capítulo */}
          {!showCapa && !formatacaoInicial && capituloAtualNavegacao && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              Cap. {capituloAtualNavegacao.numero} • {capituloAtualNavegacao.titulo.substring(0, 25)}...
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={diminuirFonte} className="h-8 w-8">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          <Button variant="ghost" size="icon" onClick={aumentarFonte} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Conteúdo com AnimatePresence para transições e gestos de swipe */}
      <main 
        className="flex-1 overflow-hidden touch-pan-y"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as any)._touchStartX = touch.clientX;
          (e.currentTarget as any)._touchStartY = touch.clientY;
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any)._touchStartX;
          const startY = (e.currentTarget as any)._touchStartY;
          if (startX === undefined || startY === undefined) return;
          
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;
          
          // Só considerar swipe horizontal se o movimento horizontal for maior que vertical
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX < 0) {
              // Swipe para esquerda = próxima página
              proximaPagina();
            } else {
              // Swipe para direita = página anterior
              paginaAnterior();
            }
          }
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {formatacaoInicial ? (
            // Tela de Formatação Inicial
            <motion.div
              key="formatacao"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-8"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {Math.round(progressoFormatacao)}%
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Formatando Livro...</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">
                {formatacaoEmBackground 
                  ? 'Formatação em progresso. Você pode começar a ler!'
                  : 'Preparando o texto para melhor leitura no celular'
                }
              </p>
              
              <div className="w-full max-w-xs mb-4">
                <Progress value={progressoFormatacao} className="h-3" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {paginasFormatadas} de {totalPaginas} páginas
              </p>
              
              {/* Botão para ler páginas disponíveis */}
              {paginasFormatadas >= 5 && (
                <Button 
                  onClick={lerPaginasDisponiveis}
                  variant="default"
                  size="lg"
                  className="gap-2 animate-pulse"
                >
                  <BookOpen className="w-5 h-5" />
                  Ler {paginasFormatadas} páginas disponíveis
                </Button>
              )}
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : showCapa ? (
            // Capa Principal
            <motion.div
              key="capa"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-full p-6 bg-gradient-to-b from-primary/5 to-background overflow-auto"
            >
              <div className="relative mb-6 shadow-2xl rounded-lg overflow-hidden">
                {capaUrl ? (
                  <img 
                    src={capaUrl} 
                    alt={livroTitulo}
                    className="w-56 h-auto max-h-80 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-56 aspect-[2/3] bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-amber-500/50" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">{livroTitulo}</h1>
              {autor && <p className="text-muted-foreground mb-4">{autor}</p>}
              <p className="text-sm text-muted-foreground mb-6">{totalPaginas} páginas</p>
              
              {livroId && !estruturaCapitulos && (
                <Button 
                  onClick={gerarEstrutura} 
                  disabled={carregandoEstrutura}
                  className="mb-4 gap-2"
                  variant="outline"
                >
                  {carregandoEstrutura ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Gerar Capas dos Capítulos
                </Button>
              )}
              
              <Button onClick={iniciarFormatacao} size="lg" className="gap-2">
                <BookOpen className="w-5 h-5" />
                Iniciar Leitura
              </Button>
              
              {livroJaFormatado && (
                <div className="flex flex-col items-center gap-2 mt-3">
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Livro já formatado
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={forcarReformatacao}
                    className="text-xs text-muted-foreground"
                  >
                    Reformatar do zero
                  </Button>
                </div>
              )}
            </motion.div>
          ) : mostrandoCapaCapitulo && capituloAtual ? (
            // Capa do Capítulo com Imagem
            <motion.div
              key={`capitulo-${capituloAtual.numero}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-full p-6 overflow-auto"
              style={{ 
                background: `linear-gradient(135deg, ${capituloAtual.cor_tema}15 0%, ${capituloAtual.cor_tema}05 100%)`
              }}
            >
              {/* Imagem do Capítulo */}
              {capasCapitulos[capituloAtual.numero] ? (
                <motion.img
                  src={capasCapitulos[capituloAtual.numero]}
                  alt={`Capa Capítulo ${capituloAtual.numero}`}
                  className="w-full max-w-sm h-48 object-cover rounded-xl mb-6 shadow-2xl"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                />
              ) : (
                <motion.div 
                  className="w-full max-w-sm h-48 rounded-xl mb-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed"
                  style={{ 
                    background: `linear-gradient(135deg, ${capituloAtual.cor_tema}30, ${capituloAtual.cor_tema}10)`,
                    borderColor: `${capituloAtual.cor_tema}40`
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {gerandoCapa || gerandoTodasCapas ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: capituloAtual.cor_tema }} />
                      <span className="text-sm text-muted-foreground">
                        {gerandoTodasCapas && progressoCapas.total > 0 
                          ? `Gerando capa ${progressoCapas.atual}/${progressoCapas.total}...`
                          : 'Gerando imagem...'
                        }
                      </span>
                      {gerandoTodasCapas && progressoCapas.total > 0 && (
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full transition-all duration-300 rounded-full"
                            style={{ 
                              width: `${(progressoCapas.atual / progressoCapas.total) * 100}%`,
                              backgroundColor: capituloAtual.cor_tema 
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <Button 
                      onClick={() => gerarCapaCapitulo(capituloAtual)} 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Gerar Capa
                    </Button>
                  )}
                </motion.div>
              )}

              {capituloAtual.parte && (
                <motion.span 
                  className="text-sm font-semibold tracking-widest uppercase mb-2"
                  style={{ color: capituloAtual.cor_tema }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {capituloAtual.parte}
                </motion.span>
              )}
              
              <motion.div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${capituloAtual.cor_tema}20` }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <span style={{ color: capituloAtual.cor_tema }}>
                  {iconMap[capituloAtual.icone] || <BookOpen className="w-10 h-10" />}
                </span>
              </motion.div>
              
              <motion.div 
                className="text-4xl font-bold mb-2"
                style={{ color: capituloAtual.cor_tema }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Capítulo {capituloAtual.numero}
              </motion.div>
              
              <motion.div 
                className="w-24 h-1 rounded-full mb-4" 
                style={{ backgroundColor: capituloAtual.cor_tema }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              />
              
              <motion.h2 
                className="text-lg font-semibold text-center mb-3 max-w-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {capituloAtual.titulo}
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground text-center text-sm italic max-w-xs mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                "{capituloAtual.tema}"
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[LeituraInterativa] Começar Capítulo clicado');
                    proximaPagina();
                  }} 
                  size="lg" 
                  className="gap-2 z-50 relative"
                >
                  Começar Capítulo
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            // Conteúdo da Página
            <motion.div
              key={`pagina-${paginaAtual}`}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="h-full overflow-auto"
            >
              <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
                {formatandoPagina && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Formatando texto...
                  </div>
                )}
                
                {conteudoFormatado ? (
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none leitura-content"
                    style={{ fontSize: `${fontSize}px` }}
                    dangerouslySetInnerHTML={{ __html: limparConteudoHtml(conteudoFormatado) }}
                  />
                ) : paginaConteudo?.Livro ? (
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none leitura-content"
                    style={{ fontSize: `${fontSize}px` }}
                    dangerouslySetInnerHTML={{ __html: formatarTextoBasico(paginaConteudo.Livro) }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Conteúdo não disponível</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress */}
      {!showCapa && !formatacaoInicial && (
        <div className="px-4 py-2 bg-card/95 border-t">
          <Progress value={progresso} className="h-1" />
        </div>
      )}

      {/* Footer com Índice */}
      <footer className="flex items-center justify-between px-4 py-3 border-t bg-card/95 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LeituraInterativa] Botão página anterior (footer) clicado');
            paginaAnterior();
          }}
          disabled={showCapa}
          size="icon"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        {/* Botão Central com Índice */}
        <Sheet open={indiceAberto} onOpenChange={setIndiceAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {showCapa ? 'Capa' : mostrandoCapaCapitulo ? `Cap. ${capituloAtual?.numero}` : `${paginaAtual} / ${totalPaginasReal}`}
              </span>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Índice de Capítulos</SheetTitle>
            </SheetHeader>
            
            <div className="mt-4 overflow-auto max-h-[calc(70vh-80px)]">
              {estruturaCapitulos?.capitulos.map(cap => (
                <button
                  key={cap.numero}
                  onClick={() => navegarParaCapitulo(cap)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-muted rounded-lg transition-colors ${
                    capituloAtualNavegacao?.numero === cap.numero ? 'bg-primary/10' : ''
                  }`}
                >
                  {capasCapitulos[cap.numero] ? (
                    <img 
                      src={capasCapitulos[cap.numero]} 
                      className="w-16 h-12 rounded object-cover flex-shrink-0" 
                      alt={`Cap ${cap.numero}`}
                    />
                  ) : (
                    <div 
                      className="w-16 h-12 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cap.cor_tema}20` }}
                    >
                      <span className="text-2xl">
                        {iconMap[cap.icone] ? (
                          <span style={{ color: cap.cor_tema }} className="text-lg">
                            {cap.icone === 'book' ? '📖' : cap.icone === 'scale' ? '⚖️' : cap.icone === 'crown' ? '👑' : cap.icone === 'sword' ? '⚔️' : cap.icone === 'scroll' ? '📜' : cap.icone === 'feather' ? '🪶' : cap.icone === 'landmark' ? '🏛️' : cap.icone === 'users' ? '👥' : cap.icone === 'heart' ? '❤️' : cap.icone === 'shield' ? '🛡️' : '📖'}
                          </span>
                        ) : '📖'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm">Capítulo {cap.numero}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{cap.titulo}</p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground flex-shrink-0">p.{cap.pagina_inicio_estimada}</span>
                </button>
              ))}
              
              {(!estruturaCapitulos || estruturaCapitulos.capitulos.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhum capítulo disponível</p>
                  <p className="text-sm">Gere a estrutura na capa do livro</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <Button 
          variant="ghost" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LeituraInterativa] Botão próxima página (footer) clicado');
            proximaPagina();
          }}
          disabled={!showCapa && !mostrandoCapaCapitulo && paginaAtual >= totalPaginasReal}
          size="icon"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </footer>

      {/* Estilos otimizados para mobile */}
      <style>{`
        .leitura-content p.indent {
          text-indent: 1.5em;
          margin-bottom: 1.25em;
          line-height: 1.75;
          text-align: left;
          color: hsl(var(--foreground) / 0.9);
        }
        
        .leitura-content h2.chapter-title {
          font-size: 1.3em;
          font-weight: 700;
          text-align: center;
          margin: 2em 0 1.5em;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: hsl(var(--primary));
        }
        
        .leitura-content h2.chapter-title .chapter-subtitle {
          display: block;
          font-size: 0.7em;
          font-weight: 500;
          text-transform: none;
          margin-top: 0.5em;
          letter-spacing: normal;
          color: hsl(var(--foreground));
        }
        
        .leitura-content h3.subtitle {
          font-size: 1.1em;
          font-weight: 600;
          text-align: center;
          margin: 1.5em 0 1em;
          color: hsl(var(--foreground) / 0.8);
        }
        
        .leitura-content blockquote {
          border-left: 3px solid hsl(var(--primary) / 0.5);
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        
        .leitura-content p.footnote {
          font-size: 0.85em;
          color: hsl(var(--muted-foreground));
          border-top: 1px solid hsl(var(--border));
          margin-top: 2em;
          padding-top: 1em;
        }
        
        .leitura-content .emphasis {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default LeituraInterativa;
