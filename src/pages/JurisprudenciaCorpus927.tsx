import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Scale, BookOpen, Loader2, ExternalLink, Copy, RefreshCw, AlertCircle, Gavel, FileText, BookMarked, Users, User, X, ChevronDown, ChevronUp, HelpCircle, Award, Layers, Info, Crown, Bell, Newspaper } from 'lucide-react';
import JurisprudenciaLoadingAnimation from '@/components/jurisprudencia/JurisprudenciaLoadingAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import JurisprudenciaListaCompacta from '@/components/jurisprudencia/JurisprudenciaListaCompacta';
import JurisprudenciaCardsGrid from '@/components/jurisprudencia/JurisprudenciaCardsGrid';
import JurisprudenciaDrawer from '@/components/jurisprudencia/JurisprudenciaDrawer';
import JurisprudenciaResultadosAnimados from '@/components/jurisprudencia/JurisprudenciaResultadosAnimados';
import JurisprudenciaCategoriaLista from '@/components/jurisprudencia/JurisprudenciaCategoriaLista';
import NoticiasJurisprudenciaTab from '@/components/jurisprudencia/NoticiasJurisprudenciaTab';
import { JurisprudenciaBackground } from '@/components/JurisprudenciaBackground';
import constituicaoBackground from '@/assets/constituicao-background.webp';

interface Legislacao {
  id: string;
  codigo: string;
  nome_completo: string;
  sigla: string | null;
  url_base: string;
  ativa: boolean;
}

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  enunciado?: string;      // Texto curto do enunciado (abaixo do Tema)
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  link?: string;
  linkInteiroTeor?: string;
  linkTese?: string;       // Link "ver tese" (Repercussão Geral)
  linkEmenta?: string;     // Link "ver ementa" (Repercussão Geral)
  textoTese?: string;      // Texto completo da tese (extraído diretamente)
  textoEmenta?: string;    // Texto completo da ementa (extraído diretamente)
  posicionamentosSemelhantes?: number;
  destaques?: string;
  resumo?: string;
  pontosChave?: string[];
  processadoPorIA?: boolean;
}

interface ResultadoBusca {
  legislacao: string;
  artigo: string;
  texto_artigo: string;
  jurisprudencias: JurisprudenciaItem[];
  url_fonte: string;
}

interface InteiroTeorData {
  titulo: string;
  conteudo: string;
  secoes: {
    dados?: string;
    relatorio?: string;
    ementa?: string;
    voto?: string;
    acordao?: string;
  };
}

// Categorias conforme o site Corpus 927
const CATEGORIAS = {
  controle_constitucionalidade: { 
    label: 'Controle de Constitucionalidade', 
    cor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    corBorda: 'border-rose-500',
    icone: Gavel,
    descricao: 'ADI, ADC, ADPF'
  },
  sumula_vinculante: { 
    label: 'Súmulas Vinculantes', 
    cor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    corBorda: 'border-amber-500',
    icone: Crown,
    descricao: 'Efeito vinculante para todos'
  },
  repercussao_geral: { 
    label: 'Repercussão Geral', 
    cor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    corBorda: 'border-purple-500',
    icone: Scale,
    descricao: 'Temas do STF'
  },
  recurso_repetitivo: { 
    label: 'Recursos Repetitivos', 
    cor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    corBorda: 'border-blue-500',
    icone: FileText,
    descricao: 'Temas do STJ'
  },
  sumula_stj: { 
    label: 'Súmulas do STJ', 
    cor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
    corBorda: 'border-cyan-500',
    icone: BookOpen,
    descricao: 'Entendimentos consolidados'
  },
  sumula_stf: { 
    label: 'Súmulas do STF', 
    cor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
    corBorda: 'border-indigo-500',
    icone: BookOpen,
    descricao: 'Entendimentos consolidados'
  },
  jurisprudencia_tese: { 
    label: 'Jurisprudências em Tese', 
    cor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
    corBorda: 'border-teal-500',
    icone: FileText,
    descricao: 'Teses do STJ'
  },
  posicionamento_agrupado: { 
    label: 'Posicionamento Agrupado', 
    cor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    corBorda: 'border-emerald-500',
    icone: Users,
    descricao: 'Decisões convergentes do STJ'
  },
  posicionamento_isolado: { 
    label: 'Posicionamentos Isolados', 
    cor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200',
    corBorda: 'border-slate-500',
    icone: User,
    descricao: 'Decisões específicas do STJ'
  },
};

type CategoriaKey = keyof typeof CATEGORIAS;

// Categorias para a tela de introdução com cores de borda específicas (ordenadas da mais forte para a mais fraca)
const CATEGORIAS_INTRO = [
  { key: 'sumula_vinculante', label: 'Súmulas Vinculantes', descricao: 'Efeito vinculante para todos', icone: Crown, corBorda: 'border-l-amber-500' },
  { key: 'controle_constitucionalidade', label: 'Controle de Constitucionalidade', descricao: 'ADI, ADC, ADPF', icone: Gavel, corBorda: 'border-l-rose-500' },
  { key: 'repercussao_geral', label: 'Repercussão Geral', descricao: 'Temas do STF', icone: Scale, corBorda: 'border-l-purple-500' },
  { key: 'recurso_repetitivo', label: 'Recursos Repetitivos', descricao: 'Temas do STJ', icone: FileText, corBorda: 'border-l-blue-500' },
  { key: 'sumula_stf', label: 'Súmulas do STF', descricao: 'Entendimentos consolidados', icone: BookOpen, corBorda: 'border-l-indigo-500' },
  { key: 'sumula_stj', label: 'Súmulas do STJ', descricao: 'Entendimentos consolidados', icone: BookOpen, corBorda: 'border-l-cyan-500' },
  { key: 'posicionamento_isolado', label: 'Posicionamentos Isolados STJ', descricao: 'Decisões específicas do STJ', icone: User, corBorda: 'border-l-slate-500' },
  { key: 'posicionamento_agrupado', label: 'Posicionamentos Agrupados STJ', descricao: 'Decisões convergentes do STJ', icone: Users, corBorda: 'border-l-emerald-500' },
];

// Hierarquia das jurisprudências (da mais vinculante para a menos)
const HIERARQUIA_JURISPRUDENCIA = [
  {
    ordem: 1,
    nome: "Súmulas Vinculantes",
    sigla: "SV",
    tribunal: "STF - Supremo Tribunal Federal",
    descricao: "Enunciados que resumem entendimento pacificado do STF sobre matéria constitucional",
    vinculacao: "Obrigatória para todos os órgãos do Judiciário e Administração Pública",
    quemFaz: "Aprovada por 2/3 dos ministros do STF",
    cor: "amber",
    exemploPratico: "SV 56: 'A falta de estabelecimento penal adequado não autoriza a manutenção do condenado em regime prisional mais gravoso.' → Réu condenado em regime semiaberto não pode ficar em presídio fechado se não houver colônia agrícola.",
    fundamentoLegal: "Art. 103-A da Constituição Federal",
    efeitoPratico: "Se um juiz descumprir, cabe Reclamação direta ao STF para cassação da decisão.",
    requisitos: "Reiteradas decisões sobre matéria constitucional + Aprovação por 2/3 dos ministros (8 de 11)"
  },
  {
    ordem: 2,
    nome: "Controle de Constitucionalidade",
    sigla: "ADI, ADC, ADPF",
    tribunal: "STF - Supremo Tribunal Federal",
    descricao: "Decisões que analisam a compatibilidade de leis com a Constituição Federal",
    vinculacao: "Efeito erga omnes (vale para todos) e vinculante",
    quemFaz: "Julgado pelo plenário do STF",
    cor: "rose",
    exemploPratico: "ADI 4277: Reconheceu a união estável entre pessoas do mesmo sexo como entidade familiar, aplicando-se a todos os casais homoafetivos do país.",
    fundamentoLegal: "Arts. 102, I, 'a' e 103 da Constituição Federal",
    efeitoPratico: "A lei declarada inconstitucional perde eficácia para todos, como se nunca tivesse existido.",
    requisitos: "Legitimados específicos (Presidente, PGR, Governadores, partidos, etc.)"
  },
  {
    ordem: 3,
    nome: "Repercussão Geral",
    sigla: "RG",
    tribunal: "STF - Supremo Tribunal Federal",
    descricao: "Temas de relevância constitucional que transcendem o interesse das partes",
    vinculacao: "Vinculante para todos os tribunais em casos idênticos",
    quemFaz: "Reconhecida por 2/3 dos ministros do STF",
    cor: "purple",
    exemploPratico: "Tema 1.046: Decidiu que acordo extrajudicial trabalhista que verse sobre direitos disponíveis é válido e deve ser homologado pela Justiça do Trabalho.",
    fundamentoLegal: "Art. 102, §3º da CF e Arts. 1.035 a 1.041 do CPC",
    efeitoPratico: "Todos os processos sobre o mesmo tema ficam suspensos até o julgamento do STF.",
    requisitos: "Demonstrar questões relevantes do ponto de vista econômico, político, social ou jurídico"
  },
  {
    ordem: 4,
    nome: "Recursos Repetitivos",
    sigla: "REsp Repetitivo",
    tribunal: "STJ - Superior Tribunal de Justiça",
    descricao: "Decisões sobre questões federais que se repetem em múltiplos processos",
    vinculacao: "Vinculante para tribunais inferiores em casos semelhantes",
    quemFaz: "Julgado por seção ou corte especial do STJ",
    cor: "blue",
    exemploPratico: "Tema 952: Definiu que o prazo prescricional para cobrança de dívidas de condomínio é de 5 anos (e não 10), aplicando-se a todos os casos.",
    fundamentoLegal: "Art. 1.036 a 1.041 do CPC",
    efeitoPratico: "Recursos sobre a mesma questão são devolvidos aos tribunais de origem para aplicar a tese.",
    requisitos: "Multiplicidade de recursos com idêntica controvérsia de direito federal"
  },
  {
    ordem: 5,
    nome: "Súmulas do STF",
    sigla: "Súmula STF",
    tribunal: "STF - Supremo Tribunal Federal",
    descricao: "Entendimentos antigos consolidados (anteriores às súmulas vinculantes)",
    vinculacao: "Orientação persuasiva, não é obrigatória",
    quemFaz: "Aprovada pela maioria dos ministros do STF",
    cor: "indigo",
    exemploPratico: "Súmula 331: 'É legítima a incidência do ISS sobre operações de locação de bens móveis.' → Alugar carros, equipamentos etc. gera cobrança de ISS pelo município.",
    fundamentoLegal: "Art. 102 da CF e RISTF",
    efeitoPratico: "Orientam a interpretação, mas não obrigam como as vinculantes.",
    requisitos: "Jurisprudência dominante sobre matéria constitucional ou processual"
  },
  {
    ordem: 6,
    nome: "Súmulas do STJ",
    sigla: "Súmula STJ",
    tribunal: "STJ - Superior Tribunal de Justiça",
    descricao: "Entendimentos consolidados sobre interpretação de legislação federal",
    vinculacao: "Orientação persuasiva, não é obrigatória",
    quemFaz: "Aprovada pela maioria dos ministros do STJ",
    cor: "cyan",
    exemploPratico: "Súmula 385: 'Da anotação irregular em cadastro de proteção ao crédito, não cabe indenização por dano moral quando preexistente legítima inscrição.' → Se você já tem nome sujo, outra negativação errada não gera dano moral.",
    fundamentoLegal: "Art. 122 do RISTJ (Regimento Interno do STJ)",
    efeitoPratico: "Juízes costumam seguir, mas podem decidir diferente fundamentando adequadamente.",
    requisitos: "Decisões reiteradas sobre interpretação de lei federal"
  },
  {
    ordem: 7,
    nome: "Jurisprudência em Teses",
    sigla: "JT",
    tribunal: "STJ - Superior Tribunal de Justiça",
    descricao: "Compilação de teses jurídicas extraídas de julgados reiterados",
    vinculacao: "Orientação, sem força vinculante formal",
    quemFaz: "Elaborada pela Secretaria de Jurisprudência do STJ",
    cor: "teal",
    exemploPratico: "Edição 100 (CDC): 'O fornecedor responde solidariamente pelos defeitos de qualidade do produto que o tornem impróprio para consumo.' → Lojas e fabricantes respondem juntos.",
    fundamentoLegal: "Resolução STJ/GP n. 8/2012",
    efeitoPratico: "Funciona como pesquisa qualificada, facilitando encontrar o entendimento predominante.",
    requisitos: "Análise sistemática de julgados pela Secretaria de Jurisprudência"
  }
];

// Termos jurídicos / Glossário
const TERMOS_JURIDICOS = [
  { termo: "Jurisprudência", definicao: "Conjunto de decisões reiteradas dos tribunais sobre determinada matéria, que serve de orientação para casos futuros." },
  { termo: "Precedente", definicao: "Decisão judicial anterior que serve de referência e modelo para julgamento de casos futuros semelhantes." },
  { termo: "Súmula", definicao: "Resumo da interpretação pacífica de um tribunal sobre determinada questão jurídica." },
  { termo: "Vinculante", definicao: "Que obriga todos os órgãos do Poder Judiciário e da Administração Pública a seguir o mesmo entendimento." },
  { termo: "Erga omnes", definicao: "Expressão latina que significa 'contra todos'. Efeito que vale para toda a sociedade, não apenas para as partes do processo." },
  { termo: "Tese", definicao: "Conclusão ou entendimento jurídico extraído de uma decisão judicial sobre determinado tema." },
  { termo: "Ementa", definicao: "Resumo oficial dos principais pontos e fundamentos de uma decisão judicial." },
  { termo: "Acórdão", definicao: "Decisão proferida por um colegiado de juízes (câmara, turma ou plenário) de um tribunal." },
  { termo: "Edições", definicao: "Conjunto de decisões agrupadas sobre um mesmo tema ou assunto jurídico." },
  { termo: "HC", definicao: "Habeas Corpus - remédio constitucional para proteger a liberdade de locomoção." },
  { termo: "RHC", definicao: "Recurso em Habeas Corpus - recurso contra decisão denegatória de HC." },
  { termo: "REsp", definicao: "Recurso Especial - recurso ao STJ para uniformizar interpretação de lei federal." },
  { termo: "ADI", definicao: "Ação Direta de Inconstitucionalidade - questiona lei ou ato normativo perante o STF." },
  { termo: "ADC", definicao: "Ação Declaratória de Constitucionalidade - confirma que uma lei é constitucional." },
  { termo: "ADPF", definicao: "Arguição de Descumprimento de Preceito Fundamental - protege preceitos essenciais da CF." },
  { termo: "RG", definicao: "Repercussão Geral - requisito para RE no STF demonstrando relevância nacional." },
  { termo: "RE", definicao: "Recurso Extraordinário - recurso ao STF em matéria constitucional." },
];

export default function JurisprudenciaCorpus927() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [legislacaoSelecionada, setLegislacaoSelecionada] = useState<string>('');
  const [numeroArtigo, setNumeroArtigo] = useState<string>('');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [tipoBusca, setTipoBusca] = useState<'artigo' | 'tema'>('artigo');
  const [buscando, setBuscando] = useState(false);
  const [carregandoLegislacoes, setCarregandoLegislacoes] = useState(true);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [fonte, setFonte] = useState<string>('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');
  const [etapaBusca, setEtapaBusca] = useState<string[]>([]);
  
  // Usar URL param para controlar a view (sincroniza com Header navigation)
  const viewAtual = searchParams.get('view');
  const mostrarBusca = viewAtual === 'busca';
  const mostrarResultados = viewAtual === 'resultados';
  const mostrarListaCategoria = viewAtual === 'lista-categoria';
  
  // Estado para categoria expandida (lista completa)
  const [categoriaExpandida, setCategoriaExpandida] = useState<string>('');
  const [itensCategoria, setItensCategoria] = useState<JurisprudenciaItem[]>([]);
  
  // Função para navegar entre views mantendo sincronização com Header
  const irParaBusca = () => {
    setSearchParams({ view: 'busca' });
  };
  
  const irParaResultados = () => {
    setSearchParams({ view: 'resultados' });
  };
  
  const irParaListaCategoria = (categoria: string, itens: JurisprudenciaItem[]) => {
    setCategoriaExpandida(categoria);
    setItensCategoria(itens);
    setSearchParams({ view: 'lista-categoria' });
  };
  const [animacaoIniciada, setAnimacaoIniciada] = useState(false);
  const [modalEducativo, setModalEducativo] = useState(false);
  const [mostrarTodosTermos, setMostrarTodosTermos] = useState(false);
  const [hierarquiaExpandida, setHierarquiaExpandida] = useState<number | null>(null);
  
  // Estados para o modal de inteiro teor
  const [inteiroTeorAberto, setInteiroTeorAberto] = useState(false);
  const [inteiroTeorData, setInteiroTeorData] = useState<InteiroTeorData | null>(null);
  const [buscandoInteiroTeor, setBuscandoInteiroTeor] = useState(false);
  const [linkInteiroTeorAtual, setLinkInteiroTeorAtual] = useState<string>('');
  
  // Estados para o drawer de jurisprudência
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [jurisprudenciaSelecionada, setJurisprudenciaSelecionada] = useState<JurisprudenciaItem | null>(null);
  const [jurisprudenciaIndex, setJurisprudenciaIndex] = useState(0);

  // Iniciar animação após montar
  useEffect(() => {
    const timer = setTimeout(() => setAnimacaoIniciada(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    carregarLegislacoes();
  }, []);

  const buscarInteiroTeor = async (link: string) => {
    setLinkInteiroTeorAtual(link);
    setInteiroTeorAberto(true);
    setBuscandoInteiroTeor(true);
    setInteiroTeorData(null);

    try {
      const { data, error } = await supabase.functions.invoke('buscar-inteiro-teor-corpus927', {
        body: { linkInteiroTeor: link },
      });

      if (error) throw error;

      if (data.success && data.data) {
        setInteiroTeorData(data.data);
      } else {
        toast.error(data.error || 'Erro ao buscar inteiro teor');
      }
    } catch (error) {
      console.error('Erro ao buscar inteiro teor:', error);
      toast.error('Erro ao buscar inteiro teor');
    } finally {
      setBuscandoInteiroTeor(false);
    }
  };

  const carregarLegislacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('legislacoes_corpus927')
        .select('*')
        .eq('ativa', true)
        .order('nome_completo');

      if (error) throw error;
      setLegislacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar legislações:', error);
      toast.error('Erro ao carregar legislações');
    } finally {
      setCarregandoLegislacoes(false);
    }
  };

  const adicionarEtapa = (etapa: string) => {
    setEtapaBusca(prev => [...prev, etapa]);
  };

  const buscarJurisprudencia = async (forcarAtualizacao = false) => {
    if (!legislacaoSelecionada || !numeroArtigo.trim()) {
      toast.error('Selecione a legislação e informe o número do artigo');
      return;
    }

    setBuscando(true);
    setResultado(null);
    setEtapaBusca([]);

    try {
      // Etapa 1: Iniciar busca
      adicionarEtapa('🔍 Iniciando busca...');
      await new Promise(r => setTimeout(r, 200));

      // Etapa 2: Verificar cache
      adicionarEtapa('📦 Verificando cache local...');
      await new Promise(r => setTimeout(r, 300));

      // Etapa 3: Conectar ao servidor
      adicionarEtapa('🌐 Conectando à API dos Tribunais...');

      const { data, error } = await supabase.functions.invoke('buscar-jurisprudencia-corpus927', {
        body: {
          legislacao: legislacaoSelecionada,
          artigo: numeroArtigo.trim(),
          forcarAtualizacao,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Processar etapas retornadas pela API (com logs detalhados)
        if (data.etapas && Array.isArray(data.etapas)) {
          for (const etapa of data.etapas) {
            let icon = '';
            if (etapa.status === 'ok') icon = '✅';
            else if (etapa.status === 'erro') icon = '❌';
            else if (etapa.status === 'processando') icon = '⏳';
            
            const suffix = etapa.quantidade !== undefined ? ` (${etapa.quantidade})` : '';
            
            // Identificar etapas específicas para ícones mais descritivos
            let etapaTexto = etapa.etapa;
            if (etapa.etapa.toLowerCase().includes('firecrawl') || etapa.etapa.toLowerCase().includes('conectando')) {
              etapaTexto = `🌐 ${etapa.etapa}`;
            } else if (etapa.etapa.toLowerCase().includes('gemini') || etapa.etapa.toLowerCase().includes('ia')) {
              etapaTexto = `🤖 ${etapa.etapa}`;
            } else if (etapa.etapa.toLowerCase().includes('cache')) {
              etapaTexto = `📦 ${etapa.etapa}`;
            } else if (etapa.etapa.toLowerCase().includes('fase 1') || etapa.etapa.toLowerCase().includes('extraí')) {
              etapaTexto = `📥 ${etapa.etapa}`;
            } else if (etapa.etapa.toLowerCase().includes('fase 2') || etapa.etapa.toLowerCase().includes('organiz')) {
              etapaTexto = `🧠 ${etapa.etapa}`;
            }
            
            adicionarEtapa(`${icon} ${etapaTexto}${suffix}`);
            await new Promise(r => setTimeout(r, 100));
          }
        } else if (data.fonte === 'cache') {
          adicionarEtapa('✅ 📦 Dados encontrados no cache!');
        } else {
          adicionarEtapa('✅ 🌐 Dados recebidos do Corpus 927');
          await new Promise(r => setTimeout(r, 200));
        }

        // Verificar se houve processamento por IA
        const processadosPorIA = data.data.jurisprudencias?.filter((j: JurisprudenciaItem) => j.processadoPorIA)?.length || 0;
        if (processadosPorIA > 0) {
          adicionarEtapa(`✅ 🤖 ${processadosPorIA} texto(s) organizado(s) pela IA`);
        }

        adicionarEtapa(`✅ 📊 ${data.data.jurisprudencias?.length || 0} jurisprudência(s) encontrada(s)`);
        
        setResultado(data.data);
        setFonte(data.fonte);
        
        // Definir a primeira categoria com itens como ativa
        const grupos = agruparJurisprudencias(data.data.jurisprudencias || []);
        const primeiraCategoria = Object.keys(grupos)[0];
        if (primeiraCategoria) {
          setCategoriaAtiva(primeiraCategoria);
        }
        
        // Navegar para a tela de resultados animados
        irParaResultados();
      } else {
        adicionarEtapa('❌ Erro na busca');
        toast.error(data.error || 'Erro ao buscar jurisprudência');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      adicionarEtapa('❌ Erro de conexão com o servidor');
      toast.error('Erro ao buscar jurisprudência');
    } finally {
      setBuscando(false);
    }
  };

  // Busca por tema/palavra-chave
  const buscarJurisprudenciaPorTema = async () => {
    if (!termoBusca.trim()) {
      toast.error('Informe um termo para buscar');
      return;
    }

    setBuscando(true);
    setResultado(null);
    setEtapaBusca([]);

    try {
      adicionarEtapa('🔍 Buscando por tema...');
      await new Promise(r => setTimeout(r, 200));

      adicionarEtapa('📚 Pesquisando súmulas e teses...');
      await new Promise(r => setTimeout(r, 300));

      const { data, error } = await supabase.functions.invoke('buscar-jurisprudencia-por-tema', {
        body: {
          termo: termoBusca.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        adicionarEtapa(`✅ ${data.data.jurisprudencias?.length || 0} resultado(s) encontrado(s)`);
        
        setResultado(data.data);
        setFonte(data.fonte || 'busca-tema');
        
        const grupos = agruparJurisprudencias(data.data.jurisprudencias || []);
        const primeiraCategoria = Object.keys(grupos)[0];
        if (primeiraCategoria) {
          setCategoriaAtiva(primeiraCategoria);
        }
        
        irParaResultados();
      } else {
        adicionarEtapa('❌ Nenhum resultado encontrado');
        toast.error(data.error || 'Nenhuma jurisprudência encontrada para este termo');
      }
    } catch (error) {
      console.error('Erro na busca por tema:', error);
      adicionarEtapa('❌ Erro na busca');
      toast.error('Erro ao buscar jurisprudência por tema');
    } finally {
      setBuscando(false);
    }
  };

  const copiarTexto = (texto: string, titulo?: string) => {
    const textoCompleto = titulo ? `${titulo}\n\n${texto}` : texto;
    navigator.clipboard.writeText(textoCompleto);
    toast.success('Texto copiado!');
  };

  const agruparJurisprudencias = (items: JurisprudenciaItem[]): Record<string, JurisprudenciaItem[]> => {
    const grupos: Record<string, JurisprudenciaItem[]> = {};
    items.forEach(item => {
      if (!grupos[item.tipo]) {
        grupos[item.tipo] = [];
      }
      grupos[item.tipo].push(item);
    });
    return grupos;
  };

  const legislacaoInfo = legislacoes.find(l => l.codigo === legislacaoSelecionada);
  const gruposJurisprudencia = resultado ? agruparJurisprudencias(resultado.jurisprudencias) : {};
  const categoriasComItens = Object.keys(gruposJurisprudencia) as CategoriaKey[];

  return (
    <JurisprudenciaBackground>
      {/* Modal de Inteiro Teor */}
      <Dialog open={inteiroTeorAberto} onOpenChange={setInteiroTeorAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <FileText className="w-5 h-5 text-amber-600" />
              {buscandoInteiroTeor ? 'Carregando...' : inteiroTeorData?.titulo || 'Inteiro Teor'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-auto">
            {buscandoInteiroTeor ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                  <p className="text-sm text-muted-foreground">Buscando conteúdo completo...</p>
                </div>
              </div>
            ) : inteiroTeorData ? (
              <div className="space-y-4 pr-4">
                {/* Apenas 3 seções: Ementa, Relatório, Voto */}
                {inteiroTeorData.secoes.ementa && (
                  <SecaoColapsavel
                    titulo="⚖️ Ementa"
                    conteudo={inteiroTeorData.secoes.ementa}
                    abertoPorPadrao={true}
                  />
                )}
                
                {inteiroTeorData.secoes.relatorio && (
                  <SecaoColapsavel
                    titulo="📄 Relatório"
                    conteudo={inteiroTeorData.secoes.relatorio}
                    abertoPorPadrao={false}
                  />
                )}
                
                {/* Voto inclui o acórdão */}
                {(inteiroTeorData.secoes.voto || inteiroTeorData.secoes.acordao) && (
                  <SecaoColapsavel
                    titulo="📝 Voto"
                    conteudo={[
                      inteiroTeorData.secoes.voto,
                      inteiroTeorData.secoes.acordao ? `\n\n--- ACÓRDÃO ---\n\n${inteiroTeorData.secoes.acordao}` : ''
                    ].filter(Boolean).join('')}
                    abertoPorPadrao={false}
                  />
                )}
                
                {/* Se não houver seções, mostrar conteúdo completo */}
                {!inteiroTeorData.secoes.ementa && !inteiroTeorData.secoes.relatorio && !inteiroTeorData.secoes.voto && !inteiroTeorData.secoes.acordao && inteiroTeorData.conteudo && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/50 p-4 rounded-lg">
                      {inteiroTeorData.conteudo}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum conteúdo encontrado
              </div>
            )}
          </ScrollArea>
          
          {/* Footer com ações */}
          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (inteiroTeorData?.conteudo) {
                  navigator.clipboard.writeText(inteiroTeorData.conteudo);
                  toast.success('Conteúdo copiado!');
                }
              }}
              disabled={!inteiroTeorData?.conteudo}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar tudo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(linkInteiroTeorAtual, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir fonte externa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL EDUCATIVO - O que é jurisprudência? */}
      <Dialog open={modalEducativo} onOpenChange={setModalEducativo}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-[#1a1a1a] border-amber-500/30">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-white">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                O que é Jurisprudência?
              </DialogTitle>
              <button 
                onClick={() => setModalEducativo(false)}
                className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition-colors"
              >
                <X className="w-5 h-5 text-amber-500" />
              </button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-auto pr-4">
            <div className="space-y-6 pb-4">
              {/* Explicação inicial */}
              <div className="bg-[#2a2a2a] rounded-xl p-4 border-l-4 border-amber-500">
                <p className="text-sm text-white/80 leading-relaxed">
                  <strong className="text-amber-400">Jurisprudência</strong> é o conjunto de decisões reiteradas 
                  dos tribunais superiores sobre determinada matéria jurídica. Funciona como uma "bússola" 
                  para advogados e juízes, indicando como os tribunais têm interpretado as leis.
                </p>
                <p className="text-sm text-white/80 leading-relaxed mt-3">
                  Quando um tribunal decide a mesma questão da mesma forma várias vezes, isso se torna 
                  <strong className="text-amber-400"> jurisprudência</strong>. Algumas têm força 
                  <strong className="text-amber-400"> vinculante</strong> (obrigatória), outras são apenas orientativas.
                </p>
              </div>

              {/* Seção de Termos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-white">Termos Importantes</h3>
                  <Badge variant="outline" className="text-xs text-white/50 border-white/20 ml-auto">
                    {TERMOS_JURIDICOS.length} termos
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {(mostrarTodosTermos ? TERMOS_JURIDICOS : TERMOS_JURIDICOS.slice(0, 3)).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#2a2a2a] rounded-lg p-3 hover:bg-[#333] transition-colors"
                    >
                      <span className="text-amber-400 font-medium text-sm">{item.termo}:</span>
                      <span className="text-white/70 text-sm ml-1">{item.definicao}</span>
                    </div>
                  ))}
                </div>
                
                {/* Botão Ver Mais / Ver Menos Termos */}
                <Button 
                  variant="ghost" 
                  onClick={() => setMostrarTodosTermos(!mostrarTodosTermos)}
                  className="w-full mt-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                >
                  {mostrarTodosTermos ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Ver mais ({TERMOS_JURIDICOS.length - 3} termos)
                    </>
                  )}
                </Button>
              </div>

              {/* Seção de Hierarquia */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-white">Hierarquia das Jurisprudências</h3>
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50 ml-auto">
                    Da mais forte para a mais fraca
                  </Badge>
                </div>
                <div className="space-y-3">
                  {HIERARQUIA_JURISPRUDENCIA.map((item) => (
                    <div 
                      key={item.ordem} 
                      className={`bg-[#2a2a2a] rounded-xl p-4 border-l-4 border-${item.cor}-500 transition-colors`}
                    >
                      {/* Header com número e nome */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-7 h-7 rounded-full bg-${item.cor}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xs font-bold text-${item.cor}-400`}>{item.ordem}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-white">{item.nome}</h4>
                            <Badge variant="outline" className={`text-xs text-${item.cor}-400 border-${item.cor}-500/50`}>
                              {item.sigla}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">{item.tribunal}</p>
                        </div>
                      </div>
                      
                      {/* Descrição */}
                      <p className="text-xs text-white/70 mb-2">{item.descricao}</p>
                      
                      {/* Info boxes básicos */}
                      <div className="grid grid-cols-1 gap-1.5 mt-3">
                        <div className="flex items-start gap-2">
                          <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-white/60"><span className="text-amber-400">Vinculação:</span> {item.vinculacao}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Gavel className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-white/60"><span className="text-amber-400">Quem produz:</span> {item.quemFaz}</p>
                        </div>
                      </div>
                      
                      {/* Botão Ver Mais */}
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setHierarquiaExpandida(hierarquiaExpandida === item.ordem ? null : item.ordem)}
                        className={`w-full mt-3 text-${item.cor}-400 hover:text-${item.cor}-300 hover:bg-${item.cor}-500/10 text-xs`}
                      >
                        {hierarquiaExpandida === item.ordem ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 mr-1" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 mr-1" />
                            Ver mais
                          </>
                        )}
                      </Button>
                      
                      {/* Conteúdo Expandido */}
                      {hierarquiaExpandida === item.ordem && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Exemplo Prático */}
                          <div className="bg-green-950/30 p-3 rounded-lg border border-green-700/30">
                            <p className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Exemplo Prático:
                            </p>
                            <p className="text-xs text-green-100/80 leading-relaxed">{item.exemploPratico}</p>
                          </div>
                          
                          {/* Fundamento Legal */}
                          <div className="flex items-start gap-2">
                            <Scale className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-white/60">
                              <span className="text-blue-400">Base Legal:</span> {item.fundamentoLegal}
                            </p>
                          </div>
                          
                          {/* Efeito Prático */}
                          <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-700/30">
                            <p className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                              <Gavel className="w-3 h-3" />
                              Efeito Prático:
                            </p>
                            <p className="text-xs text-amber-100/80 leading-relaxed">{item.efeitoPratico}</p>
                          </div>
                          
                          {/* Requisitos */}
                          <div className="flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-white/60">
                              <span className="text-purple-400">Requisitos:</span> {item.requisitos}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* TELA DE LISTA DA CATEGORIA (Ver Mais) */}
      {mostrarListaCategoria && itensCategoria.length > 0 ? (
        <>
          <JurisprudenciaCategoriaLista
            categoria={categoriaExpandida}
            itens={itensCategoria}
            onItemClick={(item, idx) => {
              setJurisprudenciaSelecionada(item);
              setJurisprudenciaIndex(idx);
              setDrawerAberto(true);
            }}
          />
          
          {/* Drawer para detalhes da jurisprudência */}
          <JurisprudenciaDrawer
            isOpen={drawerAberto}
            onClose={() => setDrawerAberto(false)}
            item={jurisprudenciaSelecionada}
            currentIndex={jurisprudenciaIndex}
            totalItems={itensCategoria.length}
            onNavigate={(direction) => {
              const newIndex = direction === 'next' 
                ? Math.min(jurisprudenciaIndex + 1, itensCategoria.length - 1)
                : Math.max(jurisprudenciaIndex - 1, 0);
              setJurisprudenciaIndex(newIndex);
              setJurisprudenciaSelecionada(itensCategoria[newIndex]);
            }}
            onAbrirInteiroTeor={buscarInteiroTeor}
          />
        </>
      ) : mostrarResultados && resultado ? (
        <>
          <JurisprudenciaResultadosAnimados
            resultado={resultado}
            legislacaoInfo={legislacaoInfo}
            onVoltar={irParaBusca}
            onJurisprudenciaClick={(item, idx) => {
              setJurisprudenciaSelecionada(item);
              setJurisprudenciaIndex(idx);
              setDrawerAberto(true);
            }}
            onAbrirFonte={(url) => window.open(url, '_blank')}
            onVerMaisCategoria={irParaListaCategoria}
          />
          
          {/* Drawer para detalhes da jurisprudência */}
          <JurisprudenciaDrawer
            isOpen={drawerAberto}
            onClose={() => setDrawerAberto(false)}
            item={jurisprudenciaSelecionada}
            currentIndex={jurisprudenciaIndex}
            totalItems={resultado.jurisprudencias.length}
            onNavigate={(direction) => {
              const allItems = resultado.jurisprudencias;
              const newIndex = direction === 'next' 
                ? Math.min(jurisprudenciaIndex + 1, allItems.length - 1)
                : Math.max(jurisprudenciaIndex - 1, 0);
              setJurisprudenciaIndex(newIndex);
              setJurisprudenciaSelecionada(allItems[newIndex]);
            }}
            onAbrirInteiroTeor={buscarInteiroTeor}
          />
        </>
      ) : !mostrarBusca ? (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header sticky com blur - padrão Flashcards/Vade Mecum */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/vade-mecum')}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Jurisprudência</h1>
                <p className="text-muted-foreground text-sm">
                  Corpus 927 • <span className="text-amber-400 font-semibold">STF & STJ</span>
                </p>
              </div>
            </div>
          </div>

          {/* Container com imagem de fundo preenchendo tudo */}
          <div 
            className="flex-1 relative"
            style={{
              backgroundImage: `url(${constituicaoBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay semi-transparente */}
            <div className="absolute inset-0 bg-black/65" />
            
            {/* Conteúdo */}
            <div className="relative z-10 px-4 pt-4">
              {/* Sistema de Tabs */}
              <Tabs defaultValue="explorar" className="w-full">
                <TabsList className="grid grid-cols-2 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
                  <TabsTrigger 
                    value="explorar" 
                    className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Explorar</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="noticias" 
                    className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>Notícias</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent 
                  value="explorar" 
                  className="mt-4 pb-24"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                  <div 
                    className={`mb-4 transition-all duration-700 ${
                      animacaoIniciada ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                  >
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20">
                      <Scale className="w-12 h-12 text-amber-500" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 mb-6">
                    <h2 
                      className={`text-lg font-bold text-foreground mb-2 transition-all duration-700 delay-100 ${
                        animacaoIniciada ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      Corpus 927
                    </h2>

                    <p 
                      className={`text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto transition-all duration-700 delay-200 ${
                        animacaoIniciada ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      Compilação da jurisprudência consolidada do STF e STJ, organizada por artigo de lei. 
                      Súmulas vinculantes, recursos repetitivos, repercussão geral e precedentes relevantes.
                    </p>
                  </div>

                  {/* Botões de ação */}
                  <div 
                    className={`flex flex-col gap-3 w-full max-w-sm mb-8 transition-all duration-700 delay-300 ${
                      animacaoIniciada ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                  >
                    <Button 
                      onClick={() => irParaBusca()} 
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold h-12"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Acessar Pesquisa
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setModalEducativo(true)} 
                      className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 h-12"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      O que é jurisprudência?
                    </Button>
                  </div>
                </div>

                {/* Título da seção de categorias */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Tipos de Precedentes
                  </p>
                </div>

                {/* Carrossel contínuo de categorias */}
                <div className="overflow-hidden relative">
                  <div 
                    className="flex gap-2 animate-carousel-slow"
                    style={{
                      width: 'max-content',
                    }}
                  >
                    {/* Duplicar items para loop infinito */}
                    {[...CATEGORIAS_INTRO, ...CATEGORIAS_INTRO].map((cat, idx) => {
                      const Icone = cat.icone;
                      return (
                        <div
                          key={`${cat.key}-${idx}`}
                          className={`flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card/80 backdrop-blur-md border-l-4 ${cat.corBorda} w-[120px] h-[140px] justify-center flex-shrink-0`}
                        >
                          <Icone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <h3 className="text-[10px] font-semibold text-foreground leading-tight">{cat.label}</h3>
                            <p className="text-[8px] text-muted-foreground leading-tight mt-1">{cat.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="noticias" className="mt-4 pb-24">
                <NoticiasJurisprudenciaTab />
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header compacto */}
          <div className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white">
            <div className="container mx-auto px-3 py-3 md:py-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/vade-mecum')}
                  className="shrink-0 bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Button>
                <Scale className="w-6 h-6 md:w-10 md:h-10" />
                <div>
                  <h1 className="text-lg md:text-3xl font-bold">Corpus 927</h1>
                  <p className="text-white/80 text-xs md:text-base">
                    Jurisprudência consolidada
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-3 py-3 md:py-6 space-y-4 md:space-y-6">
        {/* Card de Busca compacto */}
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              Buscar Jurisprudência
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Pesquise por número de artigo ou por tema/palavra-chave
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-3 md:space-y-4">
            {/* Seletor de tipo de busca */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
              <Button
                variant={tipoBusca === 'artigo' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTipoBusca('artigo')}
                className={`flex-1 ${tipoBusca === 'artigo' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Por Artigo
              </Button>
              <Button
                variant={tipoBusca === 'tema' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTipoBusca('tema')}
                className={`flex-1 ${tipoBusca === 'tema' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
              >
                <Search className="w-4 h-4 mr-2" />
                Por Tema
              </Button>
            </div>

            {tipoBusca === 'artigo' ? (
              /* Busca por artigo */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Legislação</label>
                  <Select
                    value={legislacaoSelecionada}
                    onValueChange={setLegislacaoSelecionada}
                    disabled={carregandoLegislacoes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a legislação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {legislacoes.map(leg => (
                        <SelectItem key={leg.codigo} value={leg.codigo}>
                          {leg.sigla ? `${leg.sigla} - ${leg.nome_completo}` : leg.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Número do Artigo</label>
                  <div className={`relative ${buscando ? 'animate-pulse' : ''}`}>
                    <Input
                      type="text"
                      placeholder="Ex: 121, 155, 5..."
                      value={numeroArtigo}
                      onChange={e => setNumeroArtigo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarJurisprudencia()}
                      className={buscando ? 'border-amber-500/50 ring-1 ring-amber-500/30' : ''}
                    />
                    {buscando && (
                      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-amber-500/10 to-transparent pointer-events-none"
                        style={{ animation: 'shimmer 2s ease-in-out infinite' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Busca por tema */
              <div className="space-y-2">
                <label className="text-sm font-medium">Palavra-chave ou Tema</label>
                <div className={`relative ${buscando ? 'animate-pulse' : ''}`}>
                  <Input
                    type="text"
                    placeholder="Ex: dolo, culpa, responsabilidade civil, prescrição..."
                    value={termoBusca}
                    onChange={e => setTermoBusca(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && buscarJurisprudenciaPorTema()}
                    className={buscando ? 'border-amber-500/50 ring-1 ring-amber-500/30' : ''}
                  />
                  {buscando && (
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-amber-500/10 to-transparent pointer-events-none"
                      style={{ animation: 'shimmer 2s ease-in-out infinite' }}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite um termo jurídico para buscar súmulas, teses e precedentes relacionados
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => tipoBusca === 'artigo' ? buscarJurisprudencia() : buscarJurisprudenciaPorTema()}
                disabled={buscando || (tipoBusca === 'artigo' ? (!legislacaoSelecionada || !numeroArtigo.trim()) : !termoBusca.trim())}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {buscando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>

              {resultado && (
                <Button
                  variant="outline"
                  onClick={() => buscarJurisprudencia(true)}
                  disabled={buscando}
                  title="Forçar atualização"
                >
                  <RefreshCw className={`w-4 h-4 ${buscando ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {/* Animação de loading com Lottie */}
            {buscando && (
              <JurisprudenciaLoadingAnimation etapas={etapaBusca} />
            )}
          </CardContent>
        </Card>

        {/* Resultado */}
        {resultado && (
          <div className="space-y-4">
            {/* Info do Artigo */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                    <span>Art. {resultado.artigo} - {legislacaoInfo?.sigla || legislacaoInfo?.nome_completo}</span>
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copiarTexto(resultado.texto_artigo)}
                      title="Copiar texto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => window.open(resultado.url_fonte, '_blank')}
                      title="Abrir fonte original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {fonte === 'cache' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                      📦 Cache
                    </Badge>
                  )}
                  {fonte === 'corpus927' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                      🔍 Atualizado
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                    {resultado.jurisprudencias.length} jurisprudência(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {limparTextoArtigo(resultado.texto_artigo) || 'Texto do artigo não encontrado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Jurisprudências - LAYOUT MISTO: Cards para importantes + Lista para posicionamentos */}
            {resultado.jurisprudencias.length > 0 ? (
              <div className="space-y-4">
                {/* Seção de Destaques (Cards lado a lado) */}
                {(() => {
                  // Categorias que aparecem em cards
                  const categoriasCards = ['controle_constitucionalidade', 'sumula_vinculante', 'repercussao_geral', 'recurso_repetitivo', 'sumula_stj', 'sumula_stf', 'jurisprudencia_tese'];
                  const itensCards = resultado.jurisprudencias.filter(j => categoriasCards.includes(j.tipo));
                  
                  // Categorias que aparecem em lista
                  const categoriasLista = ['posicionamento_agrupado', 'posicionamento_isolado'];
                  const itensLista = resultado.jurisprudencias.filter(j => categoriasLista.includes(j.tipo));
                  
                  return (
                    <>
                      {/* Cards dos Destaques */}
                      {itensCards.length > 0 && (
                        <div className="space-y-2 bg-gradient-to-br from-rose-950/30 to-rose-900/20 rounded-xl p-3 border border-rose-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-rose-500/20 flex items-center justify-center">
                                <Scale className="w-3.5 h-3.5 text-rose-400" />
                              </div>
                              <h3 className="text-sm font-semibold text-rose-100">Precedentes Vinculantes</h3>
                            </div>
                            <Badge className="text-[10px] px-1.5 py-0 h-5 bg-rose-500/20 text-rose-300 border-rose-500/30">
                              {itensCards.length}
                            </Badge>
                          </div>
                          <JurisprudenciaCardsGrid
                            jurisprudencias={itensCards}
                            onJurisprudenciaClick={(item, idx) => {
                              setJurisprudenciaSelecionada(item);
                              setJurisprudenciaIndex(idx);
                              setDrawerAberto(true);
                            }}
                          />
                        </div>
                      )}

                      {/* Lista dos Posicionamentos */}
                      {itensLista.length > 0 && (
                        <div className="space-y-2 mt-3 bg-gradient-to-br from-rose-950/30 to-rose-900/20 rounded-xl p-3 border border-rose-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-rose-500/20 flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-rose-400" />
                              </div>
                              <h3 className="text-sm font-semibold text-rose-100">Posicionamentos do STJ</h3>
                            </div>
                            <Badge className="text-[10px] px-1.5 py-0 h-5 bg-rose-500/20 text-rose-300 border-rose-500/30">
                              {itensLista.length}
                            </Badge>
                          </div>
                          <JurisprudenciaListaCompacta
                            jurisprudencias={itensLista}
                            onJurisprudenciaClick={(item, idx) => {
                              setJurisprudenciaSelecionada(item);
                              setJurisprudenciaIndex(itensCards.length + idx);
                              setDrawerAberto(true);
                            }}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center text-center gap-3">
                    <AlertCircle className="w-12 h-12 text-yellow-500" />
                    <p className="text-muted-foreground">
                      Nenhuma jurisprudência encontrada para este artigo no Corpus 927.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resultado.url_fonte, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Verificar fonte original
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Drawer para detalhes da jurisprudência */}
            <JurisprudenciaDrawer
              isOpen={drawerAberto}
              onClose={() => setDrawerAberto(false)}
              item={jurisprudenciaSelecionada}
              currentIndex={jurisprudenciaIndex}
              totalItems={resultado.jurisprudencias.length}
              onNavigate={(direction) => {
                const allItems = resultado.jurisprudencias;
                const newIndex = direction === 'next' 
                  ? Math.min(jurisprudenciaIndex + 1, allItems.length - 1)
                  : Math.max(jurisprudenciaIndex - 1, 0);
                setJurisprudenciaIndex(newIndex);
                setJurisprudenciaSelecionada(allItems[newIndex]);
              }}
              onAbrirInteiroTeor={buscarInteiroTeor}
            />
          </div>
        )}

        {/* Info inicial - apenas a balança */}
        {!resultado && !buscando && (
          <div className="flex flex-col items-center justify-center py-16">
            <Scale className="w-20 h-20 text-amber-600/40" />
          </div>
        )}
          </div>
        </>
      )}
    </JurisprudenciaBackground>
  );
}

// Componente separado para cada card de jurisprudência - versão compacta
interface JurisprudenciaCardProps {
  item: JurisprudenciaItem;
  categoria: {
    label: string;
    cor: string;
    corBorda: string;
  };
  onCopy: (texto: string, titulo?: string) => void;
  onAbrirInteiroTeor?: (link: string) => void;
}

function JurisprudenciaCard({ item, categoria, onCopy, onAbrirInteiroTeor }: JurisprudenciaCardProps) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(false);
  
  // Limpar e formatar o texto
  const textoCompleto = limparTextoCliente(item.ementa || item.texto || '');
  const teseTexto = limparTextoCliente(item.tese || '');

  // Separar o ACÓRDÃO do texto principal (se existir)
  const separarAcordao = (texto: string): { principal: string; acordao: string | null } => {
    // Procurar por padrões como "--- ACÓRDÃO ---", "**ACÓRDÃO**", "ACÓRDÃO:", etc.
    const acordaoMatch = texto.match(/(?:[-–—]{2,}\s*)?(?:\*\*)?ACÓRDÃO(?:\*\*)?(?:\s*[-–—]{2,})?[:\s]*([\s\S]*)/i);
    
    if (acordaoMatch) {
      const indexAcordao = texto.indexOf(acordaoMatch[0]);
      const principal = texto.substring(0, indexAcordao).trim();
      const acordao = acordaoMatch[1]?.trim() || acordaoMatch[0].replace(/[-–—*]/g, '').trim();
      return { principal, acordao };
    }
    return { principal: texto, acordao: null };
  };

  const { principal: textoPrincipal, acordao: textoAcordao } = separarAcordao(textoCompleto);

  // Função para renderizar texto com destaques em amarelo
  const renderTextoComDestaques = (texto: string) => {
    if (!texto) return null;
    
    // Converter **texto** para <mark>
    const partes = texto.split(/\*\*([^*]+)\*\*/g);
    if (partes.length === 1) return texto;
    
    return partes.map((parte, idx) => 
      idx % 2 === 1 
        ? <mark key={idx} className="bg-yellow-200 dark:bg-yellow-700/50 px-0.5 rounded">{parte}</mark>
        : parte
    );
  };

  // Usar texto com destaques se disponível, mas remover a parte do acórdão
  const textoExibirOriginal = item.destaques || textoPrincipal;
  const { principal: textoExibir } = item.destaques 
    ? separarAcordao(textoExibirOriginal) 
    : { principal: textoExibirOriginal };
  const temDestaques = item.destaques && item.destaques.includes('**');

  return (
    <Card className={`border-l-4 ${categoria.corBorda} hover:shadow-sm transition-shadow`}>
      <CardContent className="p-3 space-y-2">
        {/* Header compacto */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={`font-semibold text-xs px-2 py-0.5 ${item.link ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
              onClick={() => item.link && navigate(`/jurisprudencia-webview?link=${encodeURIComponent(item.link)}&titulo=${encodeURIComponent(item.titulo)}`)}
            >
              {item.titulo}
            </Badge>
            {item.tribunal && (
              <Badge 
                variant="secondary" 
                className={`text-xs px-1.5 py-0 ${
                  item.tribunal === 'STF' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                }`}
              >
                {item.tribunal}
              </Badge>
            )}
            {item.data && (
              <span className="text-xs text-muted-foreground">
                {item.data}
              </span>
            )}
            {/* Badge de processado por IA */}
            {item.processadoPorIA && (
              <Badge 
                variant="secondary" 
                className="text-xs px-1.5 py-0 bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
              >
                🤖 IA
              </Badge>
            )}
            {/* Badge de posicionamentos semelhantes */}
            {item.posicionamentosSemelhantes && item.posicionamentosSemelhantes > 0 && (
              <Badge 
                variant="secondary" 
                className="text-xs px-1.5 py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
              >
                <Users className="w-3 h-3 mr-1" />
                {item.posicionamentosSemelhantes} semelhante(s)
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(textoCompleto, item.titulo)}
              className="h-6 w-6 p-0"
              title="Copiar"
            >
              <Copy className="w-3 h-3" />
            </Button>
            {/* Botão Ver inteiro teor */}
            {item.linkInteiroTeor && onAbrirInteiroTeor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAbrirInteiroTeor(item.linkInteiroTeor!)}
                className="h-6 w-6 p-0 text-amber-600"
                title="Ver inteiro teor"
              >
                <FileText className="w-3 h-3" />
              </Button>
            )}
            {item.link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/jurisprudencia-webview?link=${encodeURIComponent(item.link!)}&titulo=${encodeURIComponent(item.titulo)}`)}
                className="h-6 w-6 p-0"
                title="Ver fonte"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Relator compacto */}
        {item.relator && (
          <p className="text-xs text-muted-foreground">
            Rel.: {item.relator}
          </p>
        )}

        {/* Resumo IA (se disponível) */}
        {item.resumo && (
          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-2">
            <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1">
              🤖 Resumo IA:
            </p>
            <p className="text-sm text-violet-900 dark:text-violet-100 leading-relaxed">
              {item.resumo}
            </p>
          </div>
        )}

        {/* Pontos-chave IA (se disponível) */}
        {item.pontosChave && item.pontosChave.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
              📌 Pontos-chave:
            </p>
            <ul className="text-xs text-amber-900 dark:text-amber-100 space-y-0.5">
              {item.pontosChave.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-amber-500">•</span>
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ementa com line-clamp e destaques */}
        {textoExibir && (
          <div>
            <p className={`text-sm leading-relaxed text-foreground/90 whitespace-pre-line ${!expandido && textoExibir.length > 250 ? 'line-clamp-3' : ''}`}>
              {temDestaques ? renderTextoComDestaques(textoExibir) : textoExibir}
            </p>
            {textoExibir.length > 250 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-amber-600 mt-1"
                onClick={() => setExpandido(!expandido)}
              >
                {expandido ? '↑ Recolher' : '↓ Ver mais'}
              </Button>
            )}
          </div>
        )}

        {/* Textos expandíveis de Tese e Ementa (Repercussão Geral) */}
        {(item.textoTese || item.textoEmenta || item.linkTese || item.linkEmenta) && (
          <div className="space-y-2 pt-2 border-t border-dashed">
            {/* Texto da Tese */}
            {item.textoTese && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                  <FileText className="w-3 h-3" />
                  ver tese
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 text-sm bg-green-950/20 p-3 rounded-lg border border-green-700/50">
                  <p className="leading-relaxed text-green-100 whitespace-pre-line">{item.textoTese}</p>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Texto da Ementa */}
            {item.textoEmenta && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <BookOpen className="w-3 h-3" />
                  ver ementa
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 text-sm bg-blue-950/20 p-3 rounded-lg border border-blue-700/50">
                  <p className="leading-relaxed text-blue-100 whitespace-pre-line">{item.textoEmenta}</p>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Links externos (fallback se não tiver texto) */}
            {(!item.textoTese && item.linkTese) && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-green-600 hover:text-green-700"
                onClick={() => window.open(item.linkTese, '_blank')}
              >
                <FileText className="w-3 h-3 mr-1" />
                ver tese (link externo)
              </Button>
            )}
            {(!item.textoEmenta && item.linkEmenta) && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => window.open(item.linkEmenta, '_blank')}
              >
                <BookOpen className="w-3 h-3 mr-1" />
                ver ementa (link externo)
              </Button>
            )}
          </div>
        )}

        {/* ACÓRDÃO como collapsible separado */}
        {textoAcordao && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
              <Gavel className="w-3 h-3" />
              ver acórdão
              <ChevronDown className="w-3 h-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm bg-orange-950/20 p-3 rounded-lg border border-orange-700/50">
              <p className="leading-relaxed text-orange-100 whitespace-pre-line">{textoAcordao}</p>
            </CollapsibleContent>
          </Collapsible>
        )}


        {/* Link para inteiro teor */}
        {item.linkInteiroTeor && onAbrirInteiroTeor && (
          <div className="pt-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-amber-600"
              onClick={() => onAbrirInteiroTeor(item.linkInteiroTeor!)}
            >
              <FileText className="w-3 h-3 mr-1" />
              Ver inteiro teor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para seção colapsável do inteiro teor
interface SecaoColapsavelProps {
  titulo: string;
  conteudo: string;
  abertoPorPadrao?: boolean;
}

function SecaoColapsavel({ titulo, conteudo, abertoPorPadrao = false }: SecaoColapsavelProps) {
  const [aberto, setAberto] = useState(abertoPorPadrao);

  return (
    <Collapsible open={aberto} onOpenChange={setAberto}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto bg-muted/50 hover:bg-muted"
        >
          <span className="font-medium text-sm">{titulo}</span>
          {aberto ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 py-2">
        <div className="text-sm leading-relaxed whitespace-pre-wrap bg-background border rounded-lg p-3 max-h-80 overflow-auto">
          {conteudo}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Função para limpar texto do artigo (remover jurisprudências e redações)
function limparTextoArtigo(texto: string): string {
  if (!texto) return '';
  
  return texto
    // Remover "(Redação dada pela Lei n° ...)" e variantes
    .replace(/\(Redação\s+dada\s+pela\s+Lei\s+n[°º]?\s*[\d.,]+[^)]*\)/gi, '')
    .replace(/\(Incluído\s+pela\s+Lei\s+n[°º]?\s*[\d.,]+[^)]*\)/gi, '')
    .replace(/\(Alterado\s+pela\s+Lei\s+n[°º]?\s*[\d.,]+[^)]*\)/gi, '')
    .replace(/\(Revogado\s+pela\s+Lei\s+n[°º]?\s*[\d.,]+[^)]*\)/gi, '')
    .replace(/\(Vide\s+[^)]+\)/gi, '')
    
    // Remover seções de jurisprudência e todo conteúdo após
    .replace(/Jurisprudência\s+em\s+teses[\s\S]*$/gi, '')
    .replace(/Posicionamentos?\s+isolados?[\s\S]*$/gi, '')
    .replace(/Posicionamentos?\s+agrupados?[\s\S]*$/gi, '')
    .replace(/EDIÇÃO\s+N\.\s*\d+[\s\S]*$/gi, '')
    
    // Remover blocos de processos
    .replace(/\b(AREsp|REsp|AgRg|AGRAVO|RECURSO|HC|RHC|MS|ARE|RE)\s+\d+[\s\S]*$/gi, '')
    
    // Formatar parágrafos e incisos
    .replace(/\s*(§\s*\d+[°ºª]?)/g, '\n\n$1')
    .replace(/\s*([IVXLCDM]+)\s*[-–—]\s*/g, '\n\n$1 - ')
    
    // Limpar espaços e quebras excessivas
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .trim();
}

// Função para limpar texto no cliente
function limparTextoCliente(texto: string): string {
  if (!texto) return '';
  
  return texto
    // Remover atributos HTML escapados
    .replace(/\d+">/g, '')
    .replace(/[a-z-]+="[^"]*"/gi, '')
    // Remover textos de botões
    .replace(/ver\s+tese/gi, '')
    .replace(/ver\s+ementa/gi, '')
    .replace(/ver\s+mais/gi, '')
    // Remover cabeçalhos do processo
    .replace(/RELATOR\s*:\s*MINISTR[OA]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+/gi, '')
    .replace(/AGRAVAN?TE\s*:\s*[^\n]+/gi, '')
    .replace(/AGRAVAD[OA]\s*:\s*[^\n]+/gi, '')
    .replace(/RECORRENTE\s*:\s*[^\n]+/gi, '')
    .replace(/RECORRID[OA]\s*:\s*[^\n]+/gi, '')
    .replace(/ADVOGAD[OA]\s*:\s*[^\n]+/gi, '')
    // Limpar espaços excessivos (mas preservar quebras de linha!)
    .replace(/[ \t]+/g, ' ')
    // Adicionar quebras de linha antes de parágrafos numerados (1., 2., 3.)
    .replace(/([.!?])\s*(\d{1,2})\.\s+/g, '$1\n\n$2. ')
    // Limpar quebras excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
