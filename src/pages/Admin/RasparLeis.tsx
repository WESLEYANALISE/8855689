import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, RefreshCw, CheckCircle2, Loader2, Database, ExternalLink, Eye, Upload, X, Trash2, Calendar, FileText, Volume2, AlertTriangle, CheckCircle, XCircle, ArrowRight, Settings2, Sparkles, FileCode, Play, RotateCcw, Pencil, Save, RotateCw, Link, Search, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { rasparLeiApi } from '@/lib/api/rasparLei';
import { supabase } from '@/integrations/supabase/client';
import { URLS_PLANALTO, getUrlPlanalto, getNomeAmigavel } from '@/lib/urlsPlanalto';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ValidacaoVisualArtigos from '@/components/admin/ValidacaoVisualArtigos';
import ComparacaoArtigos from '@/components/admin/ComparacaoArtigos';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface ArtigoPrevia {
  "Número do Artigo": string | null;
  Artigo: string;
  ordem_artigo?: number;
  tipo?: string;
}

interface TabelaStatus {
  nome: string;
  nomeAmigavel: string;
  url: string | null;
  artigosExistentes: number;
  artigosComAudio: number;
  ultimaAtualizacao?: string;
  concluida?: boolean; // Se foi raspada e está em cache_leis_raspadas
}

interface RegrasFormatacao {
  quebraDuplaAntes: string[];
  quebraSimpleAntes: string[];
  artigosComSufixo: boolean;
  manterTextos: string[];
  removerReferencias: boolean;
  corrigirEspacos: boolean;
  corrigirPontuacao: boolean;
  normalizarArtigos: boolean;
}

interface Etapa1Data {
  textoBruto: string;
  htmlBruto?: string;
  caracteres: number;
  artigosDetectados: number;
  revogados: number;
  vetados: number;
  dataAtualizacao?: string;
  anoAtualizacao?: number;
  diasAtras?: number;
}

interface Etapa2Data {
  artigos: ArtigoPrevia[];
  totalArtigos: number;
  artigosNumerados: number;
  cabecalhos: number;
  analise: {
    primeiroArtigo: string | null;
    ultimoArtigo: string | null;
    totalArtigos: number;
    artigosEsperados: number;
    lacunas: Array<{ de: number; ate: number; quantidade: number }>;
    percentualExtracao: number;
  };
}

interface Etapa3Data {
  validacao: {
    aprovado: boolean;
    nota: number;
    problemas: Array<{
      tipo: string;
      descricao: string;
      artigos?: string[];
      sugestao?: string;
    }>;
    sugestoes: Array<{
      regra: string;
      descricao: string;
      prioridade: string;
      exemplos?: Array<{ artigo: string; indice: number }>;
    }>;
    resumo: string;
  };
  estatisticas: {
    primeiroArtigo: string;
    ultimoArtigo: string;
    artigosEsperados: number;
    artigosEncontrados: number;
    artigosNoTextoOriginal: number;
    divergencia: number;
    lacunas: number[];
    totalLacunas: number;
    percentualExtracao: number;
  };
}

interface ValidacaoLinha {
  indice: number;
  numero: string | null;
  status: 'ok' | 'alerta' | 'erro' | 'pendente';
  problema?: string;
  sugestao?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REGRAS PADRÃO DE FORMATAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

const REGRAS_PADRAO: RegrasFormatacao = {
  quebraDuplaAntes: ['TÍTULO', 'CAPÍTULO', 'LIVRO', 'SEÇÃO', 'SUBSEÇÃO', 'PARTE'],
  quebraSimpleAntes: ['§', 'Parágrafo único'],
  artigosComSufixo: true,
  manterTextos: ['(VETADO)', '(Revogado)', '(revogado)', 'Vetado', 'Revogado', '(Incluído pela...)', '(Redação dada pela...)', '(Vide...)', '(Vigência)', 'TODAS_ANOTACOES'],
  removerReferencias: true,
  corrigirEspacos: true,
  corrigirPontuacao: true,
  normalizarArtigos: true,
};

const CACHE_KEY = 'raspar_leis_tabelas_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const URLS_PERSONALIZADAS_KEY = 'raspar_leis_urls_personalizadas';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function RasparLeis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados gerais
  const [tabelas, setTabelas] = useState<TabelaStatus[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  
  // Estados de etapas
  const [etapaAtual, setEtapaAtual] = useState<1 | 2 | 3>(1);
  const [processando, setProcessando] = useState(false);
  const [populando, setPopulando] = useState(false);
  const [progressoPopular, setProgressoPopular] = useState(0);
  const [tabelasAtualizadas, setTabelasAtualizadas] = useState<Set<string>>(new Set()); // Tabelas editadas nesta sessão
  
  // Dados das etapas
  const [etapa1Data, setEtapa1Data] = useState<Etapa1Data | null>(null);
  const [etapa2Data, setEtapa2Data] = useState<Etapa2Data | null>(null);
  const [etapa3Data, setEtapa3Data] = useState<Etapa3Data | null>(null);
  
  // Regras de formatação (editáveis)
  const [regras, setRegras] = useState<RegrasFormatacao>(REGRAS_PADRAO);
  
  // Seleção de linhas para exclusão
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<Set<number>>(new Set());
  
  // Linha expandida
  const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null);
  
  // Linha destacada em amarelo (vinda de sugestão da IA)
  const [linhaDestacada, setLinhaDestacada] = useState<number | null>(null);

  // Validação linha por linha
  const [validacoesLinhas, setValidacoesLinhas] = useState<Map<number, ValidacaoLinha>>(new Map());
  const [validandoLinha, setValidandoLinha] = useState<number | null>(null);
  const [resumoValidacao, setResumoValidacao] = useState<{ ok: number; alertas: number; erros: number; total: number } | null>(null);
  
  // Upload de PDF
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [extraindoPdf, setExtraindoPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Texto bruto manual (editável)
  const [textoBrutoManual, setTextoBrutoManual] = useState<string>('');

  // Revisão (comparar texto bruto com formatado)
  const [revisandoFormatacao, setRevisandoFormatacao] = useState(false);
  
  // Correção com Gemini
  const [corrigindoFormatacao, setCorrigindoFormatacao] = useState(false);
  const [resultadoRevisao, setResultadoRevisao] = useState<{
    elementosFaltantes: Array<{
      tipo: string;
      identificador: string;
      textoOriginal: string;
      posicaoAproximada: string;
    }>;
    resumo: {
      ementaPresente: boolean;
      capitulosNoBruto: number;
      artigosNoBruto: number;
      elementosFaltantes: number;
      percentualCompletude: number;
      observacoes: string;
    };
    estruturaBruto?: {
      ementa: string;
      totalCapitulos: number;
      totalArtigos: number;
      capitulos: string[];
    };
  } | null>(null);

  // Comparação com dados existentes
  const [artigosExistentes, setArtigosExistentes] = useState<Array<{
    id: number;
    "Número do Artigo": string | null;
    Artigo: string;
    Narração?: string | null;
  }>>([]);
  const [carregandoExistentes, setCarregandoExistentes] = useState(false);
  const [mostrarComparacao, setMostrarComparacao] = useState(false);

  // URL editável
  const [urlEditavel, setUrlEditavel] = useState('');
  const [editandoUrl, setEditandoUrl] = useState(false);
  const [urlsPersonalizadas, setUrlsPersonalizadas] = useState<Record<string, string>>({});
  
  // Prompt customizável da IA
  const [mostrarPrompt, setMostrarPrompt] = useState(false);
  const [promptCustomizado, setPromptCustomizado] = useState('');
  const PROMPT_PADRAO = `Você é um especialista em formatação de textos legais brasileiros.

## TAREFA PRINCIPAL - REMOVER QUEBRAS DE LINHA ERRADAS:
O texto bruto vem do site do Planalto com QUEBRAS DE LINHA NO MEIO DAS FRASES. 
Sua tarefa é JUNTAR essas linhas fragmentadas em frases completas.

### PROBLEMA A RESOLVER:
O texto original tem quebras assim (ERRADO):
"execução da Reforma Agrária e promoção da Política
Agrícola.
§ 1º Considera-se
Reforma Agrária o conjunto de medidas que visem a
promover melhor distribuição da
terra, mediante modificações no regime de sua posse e
uso, a fim de atender aos
princípios de justiça social"

### COMO DEVE FICAR (CORRETO):
"execução da Reforma Agrária e promoção da Política Agrícola.
§ 1º Considera-se Reforma Agrária o conjunto de medidas que visem a promover melhor distribuição da terra, mediante modificações no regime de sua posse e uso, a fim de atender aos princípios de justiça social"

### REGRA SIMPLES:
1. Se uma linha NÃO começa com: Art., §, I -, II -, a), b), TÍTULO, CAPÍTULO, SEÇÃO, LIVRO
2. ENTÃO ela é continuação da linha anterior e deve ser JUNTA na mesma linha

## ONDE MANTER QUEBRAS DE LINHA (apenas nesses casos):
- ANTES de "Art." (novo artigo)
- ANTES de "§" ou "Parágrafo" (parágrafo)
- ANTES de numeração romana seguida de hífen (I -, II -, III -, etc.)
- ANTES de alíneas (a), b), c), etc.)
- ANTES de estruturas: TÍTULO, CAPÍTULO, SEÇÃO, LIVRO, PARTE

## ONDE NUNCA PODE TER QUEBRA:
- No meio de qualquer frase
- Entre palavras de uma mesma oração
- Depois de vírgula ou antes de ponto final

### PROIBIDO MARKDOWN:
- NUNCA use ** ou # ou * ou _
- Retorne TEXTO PURO

### LIMPEZA:
- Remover links, URLs
- REMOVER markdown existente
- PRESERVAR TODOS os textos entre parênteses, incluindo:
  - (Incluído pela Lei nº X)
  - (Redação dada pela Lei nº X)
  - (Vide Lei nº X)
  - (VETADO)
  - (Revogado)
  - (Vigência)
  - Qualquer anotação legislativa entre parênteses

### REGRA CRÍTICA - TEXTO RISCADO/TACHADO (DUPLICATAS):
No site do Planalto, texto antigo aparece RISCADO (tachado) seguido da versão nova.
Você DEVE identificar e IGNORAR COMPLETAMENTE qualquer texto que:
- Apareça duplicado (mesma numeração aparecendo 2+ vezes)
- Seja a PRIMEIRA versão quando houver duplicatas (versões antigas são sempre as primeiras)
- Esteja marcado visualmente como riscado/tachado no HTML original

REGRA SIMPLES: Se há 2 elementos com mesma numeração (ex: dois "§ 2º"), use APENAS O ÚLTIMO (de baixo).
Se há 3 elementos iguais, use APENAS O TERCEIRO. A versão válida é SEMPRE A ÚLTIMA.

### CONTEÚDO REVOGADO/VETADO - REGRA CRÍTICA:
IMPORTANTE: Você DEVE incluir TODOS os elementos que foram revogados ou vetados!
- Artigos, parágrafos, incisos ou alíneas com texto tachado DEVEM ser incluídos
- Para elementos revogados/vetados, inclua o texto COMPLETO seguido de "(Revogado)" ou "(VETADO)"
NUNCA ignore/omita parágrafos, incisos ou alíneas só porque estão tachados/revogados!

### REGRA CRÍTICA - EXPANDIR ARTIGOS REVOGADOS EM INTERVALO:
Quando encontrar intervalos como "Arts. 1° a 15. (Revogados)", você DEVE EXPANDIR cada artigo individualmente.

### PRESERVAR TODOS OS ARTIGOS:
- NUNCA pule artigos, mesmo que tenham conteúdo curto ou "(VETADO)"
- Artigos vetados devem aparecer como: "Art. 18. (VETADO)"
- Preserve a sequência completa de numeração

LEMBRE-SE: 
1. Cada artigo, parágrafo, inciso e alínea deve ter seu texto COMPLETO em uma única linha. NUNCA quebre no meio de frases!
2. NÃO siga a formatação de quebra de linha do texto original do Planalto!
3. Todo o conteúdo de um artigo/parágrafo/inciso deve ficar em UMA ÚNICA linha contínua.
4. Quando houver duplicatas, USE APENAS O ÚLTIMO elemento com aquela numeração!
5. Preserve TODOS os artigos na sequência, mesmo os vetados!

Retorne APENAS o texto formatado.`;
  const PROMPT_KEY = 'raspar_leis_prompt_custom';

  // Carregar URLs personalizadas e prompt do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(URLS_PERSONALIZADAS_KEY);
      if (saved) {
        setUrlsPersonalizadas(JSON.parse(saved));
      }
      // Carregar prompt customizado
      const savedPrompt = localStorage.getItem(PROMPT_KEY);
      if (savedPrompt) {
        setPromptCustomizado(savedPrompt);
      } else {
        setPromptCustomizado(PROMPT_PADRAO);
      }
    } catch {
      setPromptCustomizado(PROMPT_PADRAO);
    }
  }, []);

  // Atualizar URL editável quando tabela mudar
  useEffect(() => {
    if (tabelaSelecionada) {
      const urlPersonalizada = urlsPersonalizadas[tabelaSelecionada.nome];
      const urlPadrao = getUrlPlanalto(tabelaSelecionada.nome) || '';
      setUrlEditavel(urlPersonalizada || urlPadrao);
      setEditandoUrl(false);
    }
  }, [tabelaSelecionada, urlsPersonalizadas]);

  // Função para salvar URL personalizada
  const salvarUrlPersonalizada = () => {
    if (!tabelaSelecionada || !urlEditavel.trim()) return;
    
    const novasUrls = { ...urlsPersonalizadas, [tabelaSelecionada.nome]: urlEditavel.trim() };
    setUrlsPersonalizadas(novasUrls);
    localStorage.setItem(URLS_PERSONALIZADAS_KEY, JSON.stringify(novasUrls));
    
    // Atualizar tabela selecionada com a nova URL
    setTabelaSelecionada(prev => prev ? { ...prev, url: urlEditavel.trim() } : null);
    
    // Atualizar lista de tabelas
    setTabelas(prev => prev.map(t => 
      t.nome === tabelaSelecionada.nome 
        ? { ...t, url: urlEditavel.trim() } 
        : t
    ));
    
    setEditandoUrl(false);
    toast({ title: 'URL salva!', description: 'A URL personalizada foi salva como padrão' });
    addLog(`🔗 URL atualizada: ${urlEditavel.trim()}`);
  };

  // Função para restaurar URL padrão
  const restaurarUrlPadrao = () => {
    if (!tabelaSelecionada) return;
    
    const urlPadrao = getUrlPlanalto(tabelaSelecionada.nome) || '';
    const novasUrls = { ...urlsPersonalizadas };
    delete novasUrls[tabelaSelecionada.nome];
    setUrlsPersonalizadas(novasUrls);
    localStorage.setItem(URLS_PERSONALIZADAS_KEY, JSON.stringify(novasUrls));
    
    setUrlEditavel(urlPadrao);
    setTabelaSelecionada(prev => prev ? { ...prev, url: urlPadrao } : null);
    setTabelas(prev => prev.map(t => 
      t.nome === tabelaSelecionada.nome 
        ? { ...t, url: urlPadrao } 
        : t
    ));
    
    setEditandoUrl(false);
    toast({ title: 'URL restaurada!', description: 'Voltou para a URL padrão do código' });
    addLog(`🔗 URL restaurada para padrão: ${urlPadrao}`);
  };

  // Verificar se a URL é personalizada
  const isUrlPersonalizada = tabelaSelecionada && urlsPersonalizadas[tabelaSelecionada.nome];

  // ═══════════════════════════════════════════════════════════════════════════
  // CARREGAMENTO INICIAL
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const initTabelas = async () => {
      const cached = getCachedTabelas();
      if (cached) {
        // Sempre buscar status de conclusão atualizado do banco
        const { data: leisConcluidas } = await supabase
          .from('cache_leis_raspadas')
          .select('nome_tabela');
        
        const tabelasConcluidas = new Set(leisConcluidas?.map(l => l.nome_tabela) || []);
        
        // Atualizar o campo concluida com dados frescos do banco
        const tabelasAtualizadas = cached.map(t => ({
          ...t,
          concluida: tabelasConcluidas.has(t.nome)
        }));
        
        setTabelas(tabelasAtualizadas);
        setCarregando(false);
        const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        if (cachedData.timestamp) {
          const ageMs = Date.now() - cachedData.timestamp;
          const ageMinutes = Math.floor(ageMs / 60000);
          const ageHours = Math.floor(ageMinutes / 60);
          setCacheAge(ageHours > 0 ? `${ageHours}h atrás` : `${ageMinutes}min atrás`);
        }
      } else {
        carregarStatusTabelas();
      }
    };
    initTabelas();
  }, []);

  const getCachedTabelas = (): TabelaStatus[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);
      const isValid = Date.now() - data.timestamp < CACHE_DURATION;
      return isValid && data.tabelas?.length > 0 ? data.tabelas : null;
    } catch {
      return null;
    }
  };

  const carregarStatusTabelas = async (forceRefresh = false) => {
    if (forceRefresh) {
      localStorage.removeItem(CACHE_KEY);
      setCacheAge(null);
    }
    
    setCarregando(true);
    try {
      // Buscar leis concluídas (cache_leis_raspadas)
      const { data: leisConcluidas } = await supabase
        .from('cache_leis_raspadas')
        .select('nome_tabela');
      
      const tabelasConcluidas = new Set(leisConcluidas?.map(l => l.nome_tabela) || []);
      
      const tabelasComStatus: TabelaStatus[] = [];

      for (const nomeTabela of Object.keys(URLS_PLANALTO)) {
        const counts = await rasparLeiApi.contarArtigosEAudios(nomeTabela);
        const ultimaAtualizacao = counts.total > 0 
          ? await rasparLeiApi.buscarUltimaAtualizacao(nomeTabela)
          : undefined;
        
        tabelasComStatus.push({
          nome: nomeTabela,
          nomeAmigavel: getNomeAmigavel(nomeTabela),
          url: getUrlPlanalto(nomeTabela),
          artigosExistentes: counts.total,
          artigosComAudio: counts.comAudio,
          ultimaAtualizacao,
          concluida: tabelasConcluidas.has(nomeTabela),
        });
      }

      tabelasComStatus.sort((a, b) => a.nome.localeCompare(b.nome));
      setTabelas(tabelasComStatus);
      
      const cacheData = { tabelas: tabelasComStatus, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCacheAge('agora');
      
      if (forceRefresh) {
        toast({ title: 'Atualizado!', description: 'Lista de tabelas recarregada' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar tabelas', variant: 'destructive' });
    } finally {
      setCarregando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES DE LOG
  // ═══════════════════════════════════════════════════════════════════════════

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const limparProcesso = () => {
    setEtapa1Data(null);
    setEtapa2Data(null);
    setEtapa3Data(null);
    setEtapaAtual(1);
    setLogs([]);
    setLinhasSelecionadas(new Set());
    setResultadoRevisao(null);
    setArtigosExistentes([]);
    setMostrarComparacao(false);
    setTextoBrutoManual('');
  };

  // Carregar artigos existentes quando selecionar tabela com dados
  const carregarArtigosExistentes = async (tableName: string) => {
    setCarregandoExistentes(true);
    addLog('📦 Carregando artigos existentes do Supabase...');
    try {
      const artigos = await rasparLeiApi.buscarArtigosExistentes(tableName);
      setArtigosExistentes(artigos);
      addLog(`✅ ${artigos.length} artigos carregados do Supabase`);
      const audios = artigos.filter(a => a.Narração).length;
      if (audios > 0) {
        addLog(`🔊 ${audios} artigos com narração`);
      }
    } catch (error) {
      addLog(`❌ Erro ao carregar artigos: ${error}`);
    } finally {
      setCarregandoExistentes(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REVISÃO: Comparar texto bruto com formatado
  // ═══════════════════════════════════════════════════════════════════════════

  const executarRevisao = async () => {
    if (!etapa1Data?.textoBruto || !textoFormatadoStream) {
      toast({ title: 'Erro', description: 'Texto bruto e formatado são necessários', variant: 'destructive' });
      return;
    }

    setRevisandoFormatacao(true);
    setResultadoRevisao(null);
    addLog('───────────────────────────────────────────────────────────');
    addLog('🔍 REVISÃO: Comparando texto bruto com formatado...');

    try {
      const response = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/revisar-formatacao-leis',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textoBruto: etapa1Data.textoBruto,
            textoFormatado: textoFormatadoStream,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setResultadoRevisao({
          elementosFaltantes: result.elementosFaltantes || [],
          resumo: result.resumo,
          estruturaBruto: result.estruturaBruto,
        });
        
        addLog(`✅ Revisão concluída!`);
        addLog(`📊 Completude: ${result.resumo.percentualCompletude}%`);
        addLog(`📊 Elementos faltantes: ${result.elementosFaltantes?.length || 0}`);
        
        if (result.resumo.ementaPresente) {
          addLog(`✅ Ementa presente`);
        } else {
          addLog(`⚠️ Ementa NÃO encontrada no texto formatado`);
        }
        
        if (result.estruturaBruto?.totalCapitulos > 0) {
          addLog(`📚 Capítulos no bruto: ${result.estruturaBruto.totalCapitulos}`);
        }
        
        if (result.elementosFaltantes?.length > 0) {
          addLog(`⚠️ Elementos faltantes:`);
          for (const elem of result.elementosFaltantes.slice(0, 5)) {
            addLog(`   - ${elem.tipo}: ${elem.identificador}`);
          }
          if (result.elementosFaltantes.length > 5) {
            addLog(`   ... e mais ${result.elementosFaltantes.length - 5} elementos`);
          }
        }
        
        toast({ 
          title: result.elementosFaltantes?.length > 0 ? 'Revisão: Itens faltantes!' : 'Revisão OK!',
          description: result.resumo.observacoes.substring(0, 100),
          variant: result.elementosFaltantes?.length > 0 ? 'destructive' : 'default',
        });
      } else {
        throw new Error(result.error || 'Erro na revisão');
      }
    } catch (error) {
      addLog(`❌ Erro na revisão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na revisão', variant: 'destructive' });
    } finally {
      setRevisandoFormatacao(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CORREÇÃO COM GEMINI: Corrigir quebras de linha incorretas
  // ═══════════════════════════════════════════════════════════════════════════

  const executarCorrecaoGemini = async () => {
    if (!textoFormatadoStream || !etapa2Data) {
      toast({ title: 'Erro', description: 'Texto formatado é necessário', variant: 'destructive' });
      return;
    }

    setCorrigindoFormatacao(true);
    addLog('───────────────────────────────────────────────────────────');
    addLog('🔧 CORREÇÃO: Preparando texto e dividindo em chunks...');

    try {
      // FASE 1: Preparar e dividir em chunks
      const prepareResponse = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/corrigir-formatacao-lei',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textoFormatado: textoFormatadoStream }),
        }
      );

      const prepareResult = await prepareResponse.json();

      if (!prepareResult.success || prepareResult.mode !== 'prepare') {
        throw new Error(prepareResult.error || 'Erro ao preparar texto');
      }

      const { totalChunks, chunks } = prepareResult;
      addLog(`📊 Texto dividido em ${totalChunks} chunk(s)`);

      // FASE 2: Processar cada chunk individualmente
      const chunksCorrigidos: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const porcentagem = Math.round(((i + 1) / totalChunks) * 100);
        addLog(`⏳ Processando chunk ${i + 1}/${totalChunks} (${porcentagem}%)...`);
        
        const chunkResponse = await fetch(
          'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/corrigir-formatacao-lei',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chunkIndex: i,
              totalChunks,
              chunk: chunks[i],
            }),
          }
        );

        const chunkResult = await chunkResponse.json();

        if (!chunkResult.success || chunkResult.mode !== 'process') {
          addLog(`⚠️ Erro no chunk ${i + 1}, usando original`);
          chunksCorrigidos.push(chunks[i]);
        } else {
          chunksCorrigidos.push(chunkResult.chunkCorrigido);
          addLog(`✅ Chunk ${i + 1}/${totalChunks} concluído`);
        }
      }

      // FASE 3: Montar texto final
      addLog('🔗 Montando texto final...');
      
      const montarResponse = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/montar-lei-corrigida',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunksCorrigidos }),
        }
      );

      const montarResult = await montarResponse.json();

      if (!montarResult.success || !montarResult.textoCorrigido) {
        throw new Error(montarResult.error || 'Erro ao montar texto final');
      }

      addLog(`✅ Correção concluída!`);
      addLog(`📊 Chunks processados: ${totalChunks}`);
      addLog(`📊 Tamanho: ${textoFormatadoStream.length} → ${montarResult.textoCorrigido.length} chars`);
      
      // Verificar se houve perda de artigos
      const artigosNoTextoOriginal = (textoFormatadoStream.match(/Art\.?\s*\d+[º°]?/gi) || []).length;
      const artigosNoTextoCorrigido = (montarResult.textoCorrigido.match(/Art\.?\s*\d+[º°]?/gi) || []).length;
      
      if (artigosNoTextoOriginal > artigosNoTextoCorrigido + 2) {
        addLog(`⚠️ ALERTA: Texto original tinha ~${artigosNoTextoOriginal} artigos, mas só ${artigosNoTextoCorrigido} após correção`);
        addLog(`⚠️ Possível perda de artigos. Considere re-formatar com chunks menores.`);
      } else {
        addLog(`📊 Artigos detectados: ${artigosNoTextoOriginal} → ${artigosNoTextoCorrigido}`);
      }
      
      // Atualizar o texto formatado
      setTextoFormatadoStream(montarResult.textoCorrigido);
      
      // Re-extrair artigos do texto corrigido
      const artigos = extrairArtigosDoTexto(montarResult.textoCorrigido);
      const artigosNumerados = artigos.filter(a => a.numero !== null);
      const cabecalhos = artigos.filter(a => a.tipo !== 'artigo');
      
      // Detectar lacunas na sequência
      const numerosExtraidos = artigosNumerados
        .map(a => parseInt(a.numero?.replace(/[^\d]/g, '') || '0'))
        .filter(n => n > 0)
        .sort((a, b) => a - b);
      
      const lacunas: { de: number; ate: number; quantidade: number }[] = [];
      for (let i = 1; i < numerosExtraidos.length; i++) {
        const atual = numerosExtraidos[i];
        const anterior = numerosExtraidos[i - 1];
        if (atual - anterior > 1) {
          lacunas.push({
            de: anterior + 1,
            ate: atual - 1,
            quantidade: atual - anterior - 1
          });
        }
      }
      
      const lacunasReais = lacunas.filter(l => l.quantidade <= 10);
      const totalLacunasReais = lacunasReais.reduce((acc, l) => acc + l.quantidade, 0);
      const artigosEsperados = artigosNumerados.length + totalLacunasReais;
      const percentualExtracao = artigosEsperados > 0 ? Math.round((artigosNumerados.length / artigosEsperados) * 100) : 100;

      const analise = {
        primeiroArtigo: artigosNumerados[0]?.numero || null,
        ultimoArtigo: artigosNumerados[artigosNumerados.length - 1]?.numero || null,
        totalArtigos: artigosNumerados.length,
        artigosEsperados,
        percentualExtracao,
        lacunas: lacunasReais,
      };

      setEtapa2Data({
        artigos: artigos.map(a => ({
          "Número do Artigo": a.numero,
          Artigo: a.texto,
          ordem_artigo: a.ordem,
          tipo: a.tipo,
        })),
        totalArtigos: artigosNumerados.length,
        artigosNumerados: artigosNumerados.length,
        cabecalhos: cabecalhos.length,
        analise,
      });
      
      addLog(`📊 Artigos após correção: ${artigosNumerados.length}`);
      
      toast({ 
        title: 'Correção concluída!', 
        description: `Texto corrigido com ${totalChunks} chunk(s)` 
      });
    } catch (error) {
      addLog(`❌ Erro na correção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na correção', variant: 'destructive' });
    } finally {
      setCorrigindoFormatacao(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: RASPAGEM BRUTA
  // ═══════════════════════════════════════════════════════════════════════════

  const executarEtapa1 = async () => {
    const urlParaRaspar = urlEditavel || tabelaSelecionada?.url;
    if (!tabelaSelecionada || !urlParaRaspar) return;

    setProcessando(true);
    limparProcesso();
    addLog(`🌐 ETAPA 1: Raspando ${tabelaSelecionada.nomeAmigavel} com Browserless...`);
    addLog(`🔗 URL: ${urlParaRaspar}`);

    try {
      const response = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/raspar-planalto-browserless',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPlanalto: urlParaRaspar,
            tableName: tabelaSelecionada.nome,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Adaptar resposta do Browserless para o formato esperado
        const caracteres = result.totalCaracteres || result.textoCompleto?.length || 0;
        const artigosDetectados = result.estatisticas?.artigos || result.artigos?.length || 0;
        
        addLog(`✅ Raspagem Browserless concluída: ${caracteres} caracteres`);
        addLog(`📊 Artigos detectados: ${artigosDetectados}`);
        addLog(`📊 Estrutura: ${result.estatisticas?.livros || 0} livros, ${result.estatisticas?.capitulos || 0} capítulos`);
        if (result.metadados?.dataPublicacao) {
          addLog(`📅 Data publicação: ${result.metadados.dataPublicacao}`);
        }
        
        // Adaptar para o formato esperado pelo restante do sistema
        const adaptedResult: Etapa1Data = {
          textoBruto: result.textoCompleto || '',
          htmlBruto: result.textoCompleto,
          caracteres,
          artigosDetectados,
          revogados: (result.textoCompleto?.match(/revogad[oa]/gi) || []).length,
          vetados: (result.textoCompleto?.match(/vetad[oa]/gi) || []).length,
          dataAtualizacao: result.metadados?.dataPublicacao,
          anoAtualizacao: result.metadados?.dataPublicacao ? parseInt(result.metadados.dataPublicacao.split('-')[0]) : undefined,
          diasAtras: undefined,
        };
        
        setEtapa1Data(adaptedResult);
        toast({ title: 'Etapa 1 concluída!', description: `Texto extraído via Browserless (${artigosDetectados} artigos)` });
      } else {
        addLog(`❌ Erro: ${result.error}`);
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na raspagem', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  // Usar texto bruto manual (colado pelo usuário)
  const usarTextoBrutoManual = () => {
    if (!textoBrutoManual.trim()) {
      toast({ title: 'Erro', description: 'Cole ou digite o texto bruto', variant: 'destructive' });
      return;
    }

    const texto = textoBrutoManual.trim();
    const artigosDetectados = (texto.match(/Art\.\s*\d+/gi) || []).length;
    const revogados = (texto.match(/\(Revogad[oa]/gi) || []).length;
    const vetados = (texto.match(/\(VETADO/gi) || []).length;
    
    // Tentar detectar ano de atualização
    const matchAno = texto.match(/(\d{4})/);
    const anoAtualizacao = matchAno ? parseInt(matchAno[1]) : undefined;

    const result: Etapa1Data = {
      textoBruto: texto,
      caracteres: texto.length,
      artigosDetectados,
      revogados,
      vetados,
      anoAtualizacao,
      diasAtras: undefined,
    };

    addLog(`📋 Texto bruto colado manualmente`);
    addLog(`✅ ${texto.length.toLocaleString()} caracteres`);
    addLog(`📊 Artigos detectados: ${artigosDetectados}`);
    
    setEtapa1Data(result);
    toast({ title: 'Texto carregado!', description: 'Texto bruto pronto para formatar' });
  };

  // Extrair texto de PDF
  const extrairTextoDoPdf = async (file: File) => {
    setExtraindoPdf(true);
    addLog(`📄 Extraindo texto do PDF: ${file.name}...`);

    try {
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      addLog(`📦 Arquivo convertido (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      addLog(`🤖 Enviando para extração com Gemini...`);

      const response = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'pdf',
            arquivo: base64,
            nomeArquivo: file.name,
            acao: 'extrair',
          }),
        }
      );

      const result = await response.json();

      if (result.extraido) {
        const texto = result.extraido.trim();
        const artigosDetectados = (texto.match(/Art\.\s*\d+/gi) || []).length;
        const revogados = (texto.match(/\(Revogad[oa]/gi) || []).length;
        const vetados = (texto.match(/\(VETADO/gi) || []).length;

        addLog(`✅ Texto extraído: ${texto.length.toLocaleString()} caracteres`);
        addLog(`📊 Artigos detectados: ${artigosDetectados}`);

        const etapa1Result: Etapa1Data = {
          textoBruto: texto,
          caracteres: texto.length,
          artigosDetectados,
          revogados,
          vetados,
          anoAtualizacao: undefined,
          diasAtras: undefined,
        };

        setEtapa1Data(etapa1Result);
        setArquivoPdf(null);
        toast({ title: 'PDF processado!', description: `${artigosDetectados} artigos detectados` });
      } else {
        throw new Error(result.error || 'Falha ao extrair texto do PDF');
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha ao extrair texto do PDF', variant: 'destructive' });
    } finally {
      setExtraindoPdf(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Erro', description: 'Apenas arquivos PDF são aceitos', variant: 'destructive' });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: 'Erro', description: 'Arquivo muito grande (máx 20MB)', variant: 'destructive' });
        return;
      }
      setArquivoPdf(file);
      extrairTextoDoPdf(file);
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: FORMATAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const [textoFormatadoStream, setTextoFormatadoStream] = useState('');

  const [progressoFormatacao, setProgressoFormatacao] = useState(0);
  const [parteAtualFormatacao, setParteAtualFormatacao] = useState(0);
  const [totalPartesFormatacao, setTotalPartesFormatacao] = useState(0);

  const executarEtapa2 = async () => {
    if (!etapa1Data?.textoBruto || !tabelaSelecionada) return;

    setProcessando(true);
    setEtapa2Data(null);
    setEtapa3Data(null);
    setTextoFormatadoStream('');
    setProgressoFormatacao(0);
    setParteAtualFormatacao(0);
    setTotalPartesFormatacao(0);
    addLog('───────────────────────────────────────────────────────────');
    addLog('🤖 ETAPA 2: Formatando com Gemini 2.0 Flash (Edge Function dedicada)...');

    // Estimar tamanho esperado (texto formatado geralmente é ~1.2x o original)
    const tamanhoEsperado = Math.round(etapa1Data.textoBruto.length * 1.2);

    try {
      // Chamar edge function DEDICADA para Raspar Leis
      addLog('🧹 Iniciando pré-limpeza do HTML...');
      
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/formatar-raspar-leis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textoBruto: etapa1Data.textoBruto,
            htmlBruto: etapa1Data.htmlBruto || '',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na formatação');
      }

      // Processar stream SSE do formatar-lei-push
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let textoCompleto = '';
      let artigosExtraidos: string[] = [];
      let areasIdentificadas: string[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              addLog(`📝 ${data.message}`);
              if (data.progress) {
                setProgressoFormatacao(Math.min(90, data.progress));
              }
            } else if (data.type === 'html_clean') {
              addLog(`🧹 HTML pré-limpo: ${data.tamanhoOriginal} → ${data.tamanhoLimpo} chars (${data.reducao}% redução)`);
              setProgressoFormatacao(20);
            } else if (data.type === 'tables_extracted') {
              if (data.quantidade > 0) {
                addLog(`📊 ${data.quantidade} tabela(s) extraída(s) para anexos`);
              }
              setProgressoFormatacao(30);
            } else if (data.type === 'chunk_start') {
              setParteAtualFormatacao(data.chunk);
              setTotalPartesFormatacao(data.totalChunks);
              addLog(`📦 Processando chunk ${data.chunk}/${data.totalChunks}...`);
            } else if (data.type === 'chunk_complete') {
              addLog(`✅ Chunk ${data.chunk}/${data.totalChunks} concluído`);
              const progressoChunk = 30 + Math.round((data.chunk / data.totalChunks) * 50);
              setProgressoFormatacao(progressoChunk);
            } else if (data.type === 'chunk') {
              textoCompleto += data.texto;
              setTextoFormatadoStream(textoCompleto);
              const progressoChunk = Math.min(85, Math.round((textoCompleto.length / tamanhoEsperado) * 100));
              setProgressoFormatacao(progressoChunk);
            } else if (data.type === 'complete') {
              textoCompleto = data.texto || textoCompleto;
              artigosExtraidos = data.artigos || [];
              areasIdentificadas = data.areasIdentificadas || [];
              setProgressoFormatacao(100);
              addLog(`✅ Formatação concluída!`);
              if (data.chunksProcessados && data.chunksProcessados > 1) {
                addLog(`📦 ${data.chunksProcessados} chunks processados`);
              }
              if (areasIdentificadas.length > 0) {
                addLog(`🏷️ Áreas: ${areasIdentificadas.join(', ')}`);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseError) {
            // Ignorar linhas inválidas
          }
        }
      }

      setProgressoFormatacao(100);

      // Extrair artigos do texto formatado
      addLog('📊 Processando artigos...');
      console.log('Texto formatado completo:', textoCompleto.substring(0, 2000));
      
      const artigos = extrairArtigosDoTexto(textoCompleto);
      
      const artigosNumerados = artigos.filter(a => a.numero !== null);
      const cabecalhos = artigos.filter(a => a.tipo !== 'artigo');

      // Detectar lacunas na sequência
      const numerosExtraidos = artigosNumerados
        .map(a => parseInt(a.numero?.replace(/[^\d]/g, '') || '0'))
        .filter(n => n > 0)
        .sort((a, b) => a - b);
      
      const lacunas: { de: number; ate: number; quantidade: number }[] = [];
      for (let i = 1; i < numerosExtraidos.length; i++) {
        const atual = numerosExtraidos[i];
        const anterior = numerosExtraidos[i - 1];
        if (atual - anterior > 1) {
          lacunas.push({
            de: anterior + 1,
            ate: atual - 1,
            quantidade: atual - anterior - 1
          });
        }
      }

      addLog(`✅ Formatação concluída!`);
      addLog(`📊 Total: ${artigos.length} registros`);
      addLog(`📊 Artigos numerados: ${artigosNumerados.length}`);
      addLog(`📊 Cabeçalhos: ${cabecalhos.length}`);
      
      if (lacunas.length > 0) {
        const artigosFaltantes = lacunas.map(l => l.de === l.ate ? `${l.de}` : `${l.de}-${l.ate}`).join(', ');
        addLog(`⚠️ Lacunas detectadas: Artigos ${artigosFaltantes}`);
      }

      // Artigos esperados = quantidade de artigos encontrados (não o número do último artigo!)
      // Lacunas só são relevantes se forem pequenas (menos de 10 artigos consecutivos faltando)
      // Grandes "lacunas" geralmente indicam artigos revogados em bloco, não erros de extração
      const lacunasReais = lacunas.filter(l => l.quantidade <= 10);
      const totalLacunasReais = lacunasReais.reduce((acc, l) => acc + l.quantidade, 0);
      
      // Esperados = encontrados + lacunas pequenas (provavelmente erros de extração)
      const artigosEsperados = artigosNumerados.length + totalLacunasReais;
      const percentualExtracao = artigosEsperados > 0 ? Math.round((artigosNumerados.length / artigosEsperados) * 100) : 100;

      const analise = {
        primeiroArtigo: artigosNumerados[0]?.numero || null,
        ultimoArtigo: artigosNumerados[artigosNumerados.length - 1]?.numero || null,
        totalArtigos: artigosNumerados.length,
        artigosEsperados,
        percentualExtracao,
        lacunas: lacunasReais, // Só lacunas pequenas (prováveis erros)
      };

      setEtapa2Data({
        artigos: artigos.map(a => ({
          "Número do Artigo": a.numero,
          Artigo: a.texto,
          ordem_artigo: a.ordem,
          tipo: a.tipo,
        })),
        totalArtigos: artigosNumerados.length, // Apenas artigos numerados (Art. X), não cabeçalhos
        artigosNumerados: artigosNumerados.length,
        cabecalhos: cabecalhos.length,
        analise,
      });
      
      setEtapaAtual(2);
      toast({ title: 'Etapa 2 concluída!', description: 'Texto formatado com Gemini' });

    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na formatação', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  // Função auxiliar para extrair artigos do texto formatado pela Gemini
  const extrairArtigosDoTexto = (texto: string) => {
    const resultado: Array<{
      numero: string | null;
      texto: string;
      ordem: number;
      tipo: 'artigo' | 'titulo' | 'capitulo' | 'secao' | 'ementa' | 'preambulo' | 'cabeçalho' | 'assinatura' | 'data';
    }> = [];
    
    let ordem = 1;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NORMALIZAÇÃO: Substituir "Art. 1o" por "Art. 1°" (letra o → símbolo de grau)
    // ═══════════════════════════════════════════════════════════════════════════
    const textoNormalizado = texto
      .replace(/\bArt\.?\s*(\d+)o\b/g, 'Art. $1°')  // Art. 1o → Art. 1°
      .replace(/\bart\.?\s*(\d+)o\b/g, 'art. $1°')  // art. 1o → art. 1° (referências)
      .replace(/§\s*(\d+)o\b/g, '§ $1°')            // § 1o → § 1°
      .replace(/(\d+)o\s*[-–]/g, '$1° -');          // 1o - → 1° -
    
    // Processar linha por linha para capturar cabeçalhos separadamente
    const linhas = textoNormalizado.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    
    let artigoAtual: string[] = [];
    let numeroArtigoAtual: string | null = null;
    
    const finalizarArtigo = () => {
      if (artigoAtual.length > 0 && numeroArtigoAtual) {
        // Juntar o texto do artigo
        let textoArtigo = artigoAtual.join('\n\n');
        
        // ═══════════════════════════════════════════════════════════════════════════
        // SEPARAR DATA E ASSINATURAS QUE POSSAM ESTAR COLADAS NO FINAL DO ARTIGO
        // ═══════════════════════════════════════════════════════════════════════════
        const matchBrasilia = textoArtigo.match(/(.*?)\s*(Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}.*)/is);
        
        if (matchBrasilia) {
          // Separar o texto do artigo da data/assinaturas
          textoArtigo = matchBrasilia[1].trim();
          const textoAssinaturas = matchBrasilia[2].trim();
          
          // Adicionar artigo (sem a parte de assinaturas)
          if (textoArtigo) {
            resultado.push({
              numero: numeroArtigoAtual,
              texto: textoArtigo,
              ordem: ordem++,
              tipo: 'artigo',
            });
          }
          
          // Processar a parte de data/assinaturas separadamente
          // Separar por quebras de linha ou por padrões de nomes
          const partesAssinatura = textoAssinaturas
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 2);
          
          // Se não tem quebras, tentar separar por padrões
          if (partesAssinatura.length === 1 && textoAssinaturas.length > 100) {
            // Separar a data do resto
            const matchData = textoAssinaturas.match(/(Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}[^A-Z]*(?:República|Independência)[^A-Z]*\.?)\s*(.*)/i);
            
            if (matchData) {
              // Adicionar data
              resultado.push({
                numero: null,
                texto: matchData[1].trim(),
                ordem: ordem++,
                tipo: 'data',
              });
              
              // Separar nomes (em MAIÚSCULAS ou Capitalizados)
              const nomes = matchData[2];
              if (nomes) {
                // Encontrar nomes em MAIÚSCULAS
                const regexNomeMaiuscula = /([A-Z]{2,}(?:\s+[A-Z]+(?:\s+[A-Z]+)*)+)/g;
                let resto = nomes;
                const nomesEncontrados: string[] = [];
                
                let match;
                while ((match = regexNomeMaiuscula.exec(nomes)) !== null) {
                  nomesEncontrados.push(match[1].trim());
                  resto = resto.replace(match[1], '|||');
                }
                
                // Processar resto (nomes capitalizados)
                const partesResto = resto.split('|||').filter(p => p.trim().length > 3);
                for (const parte of partesResto) {
                  const palavras = parte.trim().split(/\s+/);
                  if (palavras.length >= 2 && palavras[0].match(/^[A-Z]/)) {
                    nomesEncontrados.push(parte.trim());
                  }
                }
                
                // Adicionar cada nome como assinatura
                for (const nome of nomesEncontrados) {
                  if (nome.length >= 5 && nome.length < 60) {
                    resultado.push({
                      numero: null,
                      texto: nome,
                      ordem: ordem++,
                      tipo: 'assinatura',
                    });
                  }
                }
              }
            } else {
              // Fallback: adicionar tudo como data
              resultado.push({
                numero: null,
                texto: textoAssinaturas,
                ordem: ordem++,
                tipo: 'data',
              });
            }
          } else {
            // Já tem quebras de linha, processar cada parte
            for (const parte of partesAssinatura) {
              const ehData = /^Brasília,/i.test(parte);
              resultado.push({
                numero: null,
                texto: parte,
                ordem: ordem++,
                tipo: ehData ? 'data' : 'assinatura',
              });
            }
          }
        } else {
          // Não tem data/assinaturas coladas, adicionar normalmente
          resultado.push({
            numero: numeroArtigoAtual,
            texto: textoArtigo,
            ordem: ordem++,
            tipo: 'artigo',
          });
        }
        
        artigoAtual = [];
        numeroArtigoAtual = null;
      }
    };
    
    // Padrões de cabeçalhos estruturais
    const regexCabecalhoEstrutural = /^(TÍTULO|CAPÍTULO|LIVRO|SEÇÃO|SUBSEÇÃO|PARTE)\s+[IVXLCDM0-9]+/i;
    
    // Padrão para data de assinatura (Brasília, 12 de janeiro de 2015...)
    const regexDataAssinatura = /^Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i;
    
    // Padrão para nomes de autoridades (DILMA ROUSSEFF, Joaquim Levy, etc.)
    const regexNomeAutoridade = /^([A-Z]{2,}(?:\s+[A-Z]{2,})+|[A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-Z][a-záàâãéèêíïóôõöúçñ]+)+)$/;
    
    // Palavras que indicam nome de estrutura (não artigo)
    const palavrasEstrutura = [
      'DAS ', 'DOS ', 'DA ', 'DO ', 'DE ', 'DISPOSIÇÕES', 'DEFINIÇÕES', 
      'PRINCÍPIOS', 'OBJETIVOS', 'DIRETRIZES', 'CONCEITOS', 'NORMAS',
      'PROCEDIMENTOS', 'SANÇÕES', 'PENALIDADES', 'INFRAÇÕES'
    ];
    
    // Flag para indicar que estamos na seção de assinaturas
    let emAssinaturas = false;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PRÉ-PROCESSAMENTO: Juntar linhas que devem ficar juntas
    // ═══════════════════════════════════════════════════════════════════════════
    const linhasProcessadas: string[] = [];
    let i = 0;
    
    while (i < linhas.length) {
      const linha = linhas[i];
      
      // 1. Cabeçalho institucional: "Presidência da República" + "Casa Civil" + "Subchefia..." + LEI/DECRETO
      if (linha.includes('Presidência da República')) {
        let cabecalhoCompleto = linha;
        let j = i + 1;
        // Juntar próximas linhas que fazem parte do cabeçalho institucional
        while (j < linhas.length) {
          const proximaLinha = linhas[j].trim();
          if (proximaLinha === 'Casa Civil' || 
              proximaLinha.includes('Subchefia') ||
              proximaLinha.includes('Assuntos Jurídicos')) {
            cabecalhoCompleto += ' | ' + proximaLinha;
            j++;
          } else if (proximaLinha.match(/^(LEI\s+N|DECRETO\s+N)/i)) {
            // Juntar a LEI/DECRETO e sua data se houver
            let leiCompleta = proximaLinha;
            let k = j + 1;
            while (k < linhas.length && k < j + 3) {
              const linhaSeguinte = linhas[k].trim();
              if (linhaSeguinte.match(/^DE\s+\d/i) || linhaSeguinte.match(/^\d{1,2}\s+DE/i)) {
                leiCompleta += ', ' + linhaSeguinte;
                k++;
              } else if (linhaSeguinte.match(/^(Observação|Texto)/i)) {
                // Info adicional
                leiCompleta += '. ' + linhaSeguinte;
                k++;
                break;
              } else {
                break;
              }
            }
            cabecalhoCompleto += ' ' + leiCompleta;
            j = k;
            break;
          } else {
            break;
          }
        }
        linhasProcessadas.push(cabecalhoCompleto);
        i = j;
        continue;
      }
      
      // 2. Ementa: "Dispõe sobre..." ou "Altera..." - juntar com próxima linha se fragmentada
      if ((linha.startsWith('Dispõe sobre') || 
           linha.startsWith('Altera ') || 
           linha.startsWith('Institui ') ||
           linha.startsWith('Regulamenta ') ||
           linha.startsWith('Estabelece ')) && 
          !linha.endsWith('.') && 
          !linha.includes('providências')) {
        let ementaCompleta = linha;
        let j = i + 1;
        // Continuar juntando até encontrar ponto final ou "providências"
        while (j < linhas.length && j < i + 5) {
          const proximaLinha = linhas[j].trim();
          // Parar se for início de algo novo
          if (proximaLinha.match(/^(Art\.|TÍTULO|CAPÍTULO|O PRESIDENTE|A PRESIDENT)/)) {
            break;
          }
          ementaCompleta += ' ' + proximaLinha;
          j++;
          // Parar se terminou a ementa
          if (proximaLinha.endsWith('.') || proximaLinha.includes('providências')) {
            break;
          }
        }
        linhasProcessadas.push(ementaCompleta.trim());
        i = j;
        continue;
      }
      
      // 3. Preâmbulo presidencial: "O PRESIDENTE DA REPÚBLICA" + "Faço saber..."
      if ((linha.includes('PRESIDENTE DA REPÚBLICA') || linha.includes('PRESIDENTA DA REPÚBLICA')) && 
          !linha.includes('Faço saber') && 
          !linha.includes('seguinte')) {
        let preambulo = linha;
        let j = i + 1;
        // Juntar próximas linhas até completar o preâmbulo
        while (j < linhas.length && j < i + 3) {
          const proximaLinha = linhas[j].trim();
          // Parar se for início de algo novo
          if (proximaLinha.match(/^(Art\.|TÍTULO|CAPÍTULO)/)) {
            break;
          }
          preambulo += ' ' + proximaLinha;
          j++;
          // Parar se completou o preâmbulo
          if (proximaLinha.includes('Lei:') || proximaLinha.includes('Lei.') || proximaLinha.includes('seguinte')) {
            break;
          }
        }
        linhasProcessadas.push(preambulo.trim());
        i = j;
        continue;
      }
      
      // 4. LEI Nº X.XXX - juntar com a data se fragmentado
      if (linha.match(/^LEI\s+N[ºo°]/i) && !linha.includes(' DE ')) {
        let leiCompleta = linha;
        let j = i + 1;
        while (j < linhas.length && j < i + 2) {
          const proximaLinha = linhas[j].trim();
          if (proximaLinha.match(/^DE\s+\d/i) || proximaLinha.match(/^\d{1,2}\s+DE/i)) {
            leiCompleta += ', ' + proximaLinha;
            j++;
            break;
          } else {
            break;
          }
        }
        linhasProcessadas.push(leiCompleta.trim());
        i = j;
        continue;
      }
      
      linhasProcessadas.push(linha);
      i++;
    }
    
    // Usar linhas processadas ao invés das originais
    const linhasParaProcessar = linhasProcessadas;
    
    for (const linha of linhasParaProcessar) {
      // Verificar se é data de assinatura (Brasília, ...)
      if (regexDataAssinatura.test(linha)) {
        finalizarArtigo();
        emAssinaturas = true;
        
        resultado.push({
          numero: null,
          texto: linha,
          ordem: ordem++,
          tipo: 'data',
        });
        continue;
      }
      
      // Se estamos na seção de assinaturas, verificar se é nome de autoridade
      if (emAssinaturas) {
        // Verificar se é nome de autoridade
        if (regexNomeAutoridade.test(linha) && 
            !regexCabecalhoEstrutural.test(linha) &&
            !linha.startsWith('Art.') &&
            linha.length >= 5 && 
            linha.length < 60) {
          resultado.push({
            numero: null,
            texto: linha,
            ordem: ordem++,
            tipo: 'assinatura',
          });
          continue;
        }
      }
      
      // Verificar se é cabeçalho estrutural (TÍTULO I, CAPÍTULO II, etc.)
      const ehCabecalhoEstrutural = regexCabecalhoEstrutural.test(linha);
      
      // Verificar se é nome de estrutura (DAS PESSOAS, DEFINIÇÕES, etc.)
      const ehNomeEstrutura = linha === linha.toUpperCase() && 
                              linha.length >= 4 && 
                              linha.length < 100 &&
                              !linha.startsWith('Art.') &&
                              !linha.startsWith('ART.') &&
                              !linha.match(/^[IVXLCDM]+\s*[–-]/) && // Não é inciso romano
                              !linha.match(/^§/) && // Não é parágrafo
                              !linha.match(/^\d+/) && // Não começa com número
                              !linha.match(/^[a-z]\)/i) && // Não é alínea
                              !linha.includes('(VETADO)') && 
                              !linha.includes('(REVOGADO)') &&
                              !linha.includes('(INCLUÍDO') &&
                              palavrasEstrutura.some(p => linha.startsWith(p));
      
      // Verificar se é início de artigo - APENAS "Art." com A maiúsculo
      // "art." minúsculo é referência dentro do texto, não novo artigo
      const matchArtigo = linha.match(/^Art\.?\s*(\d+(?:-[A-Z])?)[ºª°]?\s*[-–.]?\s*/);
      
      if (ehCabecalhoEstrutural) {
        // Finalizar artigo anterior se houver
        finalizarArtigo();
        emAssinaturas = false;
        
        // Adicionar cabeçalho como linha separada
        resultado.push({
          numero: null,
          texto: linha,
          ordem: ordem++,
          tipo: 'cabeçalho',
        });
      } else if (ehNomeEstrutura && !numeroArtigoAtual) {
        // Nome de estrutura só é cabeçalho se não estamos no meio de um artigo
        finalizarArtigo();
        
        resultado.push({
          numero: null,
          texto: linha,
          ordem: ordem++,
          tipo: 'cabeçalho',
        });
      } else if (matchArtigo) {
        // Finalizar artigo anterior
        finalizarArtigo();
        emAssinaturas = false;
        
        // Iniciar novo artigo
        let numeroArtigo = matchArtigo[1];
        // Adicionar "º" apenas para artigos 1-9, artigos 10+ não usam símbolo ordinal
        const numeroBase = parseInt(numeroArtigo.replace(/[^\d]/g, ''));
        if (numeroArtigo.includes('-')) {
          // Artigo com letra (ex: 1-A, 10-B)
          // Adicionar º apenas se número base for 1-9
          if (numeroBase >= 1 && numeroBase <= 9) {
            const partes = numeroArtigo.split('-');
            numeroArtigo = partes[0] + 'º-' + partes[1];
          }
        } else {
          // Artigo simples
          if (numeroBase >= 1 && numeroBase <= 9) {
            numeroArtigo = numeroArtigo + 'º';
          }
        }
        numeroArtigoAtual = numeroArtigo;
        artigoAtual = [linha];
      } else if (numeroArtigoAtual) {
        // Continuar artigo atual (parágrafos, incisos, alíneas, continuação de texto)
        artigoAtual.push(linha);
      } else {
        // Verificar se é inciso romano (I –, II –, III –, etc.) ou alínea (a), b), etc.)
        const ehInciso = /^[IVXLCDM]+\s*[–-]/.test(linha);
        const ehAlinea = /^[a-z]\)/i.test(linha);
        const ehParagrafo = /^§/.test(linha);
        
        if ((ehInciso || ehAlinea || ehParagrafo) && resultado.length > 0) {
          // Inciso/alínea/parágrafo órfão - associar ao último artigo encontrado
          const ultimoArtigo = [...resultado].reverse().find(r => r.tipo === 'artigo');
          if (ultimoArtigo) {
            ultimoArtigo.texto += '\n\n' + linha;
          }
        } else if (resultado.length < 10 && linha.length > 15) {
          // Determinar o tipo correto para linhas iniciais (cabeçalho/preâmbulo/ementa)
          let tipoLinha: 'cabeçalho' | 'preambulo' | 'ementa' = 'ementa';
          
          if (linha.includes('Presidência da República') || linha.includes('Casa Civil') || linha.includes('Subchefia')) {
            tipoLinha = 'cabeçalho';
          } else if (linha.includes('Faço saber') || linha.includes('PRESIDENTE') || linha.includes('PRESIDENTA')) {
            tipoLinha = 'preambulo';
          } else if (linha.match(/^LEI\s+N[ºo°]/i)) {
            tipoLinha = 'ementa';
          }
          
          resultado.push({
            numero: null,
            texto: linha,
            ordem: ordem++,
            tipo: tipoLinha,
          });
        }
      }
      // Linhas que não se encaixam em nada são ignoradas (espaços, ruídos)
    }
    
    // Finalizar último artigo
    finalizarArtigo();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVER ARTIGOS DUPLICADOS - MANTER APENAS O ÚLTIMO (anteriores = revogados)
    // ═══════════════════════════════════════════════════════════════════════════
    const artigosFinais: typeof resultado = [];
    const artigosPorNumero = new Map<string, number>(); // numero -> índice no array
    
    for (let i = 0; i < resultado.length; i++) {
      const item = resultado[i];
      
      if (item.tipo === 'artigo' && item.numero) {
        // Se já existe um artigo com esse número, remover o anterior (está revogado)
        const indiceAnterior = artigosPorNumero.get(item.numero);
        if (indiceAnterior !== undefined) {
          // Marcar o anterior para remoção (substituir por null temporariamente)
          // e colocar o novo no lugar
          const indexNoFinal = artigosFinais.findIndex((a, idx) => 
            a.tipo === 'artigo' && a.numero === item.numero
          );
          if (indexNoFinal !== -1) {
            artigosFinais.splice(indexNoFinal, 1);
          }
        }
        artigosPorNumero.set(item.numero, i);
      }
      
      artigosFinais.push(item);
    }
    
    // Reordenar para manter ordem correta
    let novaOrdem = 1;
    for (const item of artigosFinais) {
      item.ordem = novaOrdem++;
    }
    
    return artigosFinais;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: VALIDAÇÃO LINHA POR LINHA COM STREAMING
  // ═══════════════════════════════════════════════════════════════════════════

  const executarEtapa3 = async () => {
    if (!etapa2Data?.artigos || !tabelaSelecionada) return;

    setProcessando(true);
    setEtapa3Data(null);
    setValidacoesLinhas(new Map());
    setResumoValidacao(null);
    setValidandoLinha(null);
    addLog('───────────────────────────────────────────────────────────');
    addLog('🔍 ETAPA 3: Validando linha por linha...');

    try {
      const response = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/validar-artigos-streaming',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artigos: etapa2Data.artigos,
          }),
        }
      );

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming não suportado');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.type === 'start') {
              addLog(`📊 Iniciando validação de ${data.total} linhas...`);
            } else if (data.type === 'progress') {
              setValidandoLinha(data.indice);
            } else if (data.type === 'validacao') {
              // Atualizar validação da linha
              setValidacoesLinhas(prev => {
                const novo = new Map(prev);
                novo.set(data.indice, {
                  indice: data.indice,
                  numero: data.numero,
                  status: data.status,
                  problema: data.problema,
                  sugestao: data.sugestao,
                });
                return novo;
              });
            } else if (data.type === 'complete') {
              addLog(`✅ Validação concluída!`);
              addLog(`   ✓ OK: ${data.resumo.ok}`);
              addLog(`   ⚠ Alertas: ${data.resumo.alertas}`);
              addLog(`   ✗ Erros: ${data.resumo.erros}`);
              addLog(`   📊 Aprovação: ${data.resumo.percentualOk}%`);
              
              setResumoValidacao({
                ok: data.resumo.ok,
                alertas: data.resumo.alertas,
                erros: data.resumo.erros,
                total: data.resumo.total,
              });
              
              // Criar Etapa3Data compatível com o resto do código
              setEtapa3Data({
                validacao: {
                  aprovado: data.resumo.aprovado,
                  nota: data.resumo.percentualOk,
                  problemas: [],
                  sugestoes: [],
                  resumo: `${data.resumo.percentualOk}% das linhas estão OK. ${data.resumo.alertas} alertas, ${data.resumo.erros} erros.`,
                },
                estatisticas: {
                  primeiroArtigo: etapa2Data.analise.primeiroArtigo || '1º',
                  ultimoArtigo: etapa2Data.analise.ultimoArtigo || '',
                  artigosEsperados: etapa2Data.analise.artigosEsperados,
                  artigosEncontrados: etapa2Data.analise.totalArtigos,
                  artigosNoTextoOriginal: etapa1Data?.artigosDetectados || 0,
                  divergencia: 0,
                  lacunas: etapa2Data.analise.lacunas.map(l => l.de),
                  totalLacunas: etapa2Data.analise.lacunas.length,
                  percentualExtracao: etapa2Data.analise.percentualExtracao,
                },
              });
              
              setEtapaAtual(3);
              toast({ 
                title: data.resumo.aprovado ? 'Validação OK!' : 'Atenção!', 
                description: `${data.resumo.percentualOk}% OK - ${data.resumo.alertas} alertas`,
                variant: data.resumo.aprovado ? 'default' : 'destructive',
              });
            } else if (data.type === 'error') {
              addLog(`❌ Erro: ${data.message}`);
              toast({ title: 'Erro', description: data.message, variant: 'destructive' });
            }
          } catch {
            // Ignorar linhas inválidas
          }
        }
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na validação', variant: 'destructive' });
    } finally {
      setProcessando(false);
      setValidandoLinha(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ATUALIZAR REGRAS COM SUGESTÕES DA IA
  // ═══════════════════════════════════════════════════════════════════════════

  const aplicarSugestoes = () => {
    if (!etapa3Data?.validacao.sugestoes) return;

    addLog('🔄 Aplicando sugestões da IA nas regras...');
    
    // Para cada sugestão, tentar aplicar automaticamente
    for (const sugestao of etapa3Data.validacao.sugestoes) {
      addLog(`   ✨ ${sugestao.regra}: ${sugestao.descricao}`);
    }

    toast({ 
      title: 'Sugestões aplicadas!', 
      description: 'Volte para a Etapa 2 e execute novamente' 
    });
    
    setEtapaAtual(2);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // POPULAR TABELA
  // ═══════════════════════════════════════════════════════════════════════════

  const popularTabela = async () => {
    if (!etapa2Data?.artigos || !tabelaSelecionada) return;

    const artigosParaInserir = etapa2Data.artigos.filter((_, idx) => !linhasSelecionadas.has(idx));
    
    if (artigosParaInserir.length === 0) {
      toast({ title: 'Nenhum artigo', description: 'Todos foram excluídos', variant: 'destructive' });
      return;
    }

    setPopulando(true);
    setProgressoPopular(0);
    addLog('───────────────────────────────────────────────────────────');
    addLog(`💾 Inserindo ${artigosParaInserir.length} artigos...`);

    try {
      const totalArtigos = artigosParaInserir.length;
      
      for (let i = 0; i < totalArtigos; i += 10) {
        const progresso = Math.min(((i + 10) / totalArtigos) * 100, 99);
        setProgressoPopular(progresso);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const resultado = await rasparLeiApi.rasparComArtigos(
        tabelaSelecionada.nome, 
        artigosParaInserir.map(a => ({
          "Número do Artigo": a["Número do Artigo"] || '',
          Artigo: a.Artigo,
          ordem_artigo: a.ordem_artigo,
        }))
      );

      setProgressoPopular(100);

      if (resultado.success) {
        const preservados = (resultado as any).artigosPreservados || 0;
        addLog(`✅ ${resultado.totalInseridos} artigos inseridos!`);
        if (preservados > 0) {
          addLog(`🔊 ${preservados} artigos com áudio/explicações preservados`);
        }
        
        // Registrar em cache_leis_raspadas para marcar como concluída
        const { error: cacheError } = await supabase
          .from('cache_leis_raspadas')
          .upsert({
            nome_tabela: tabelaSelecionada.nome,
            total_artigos: resultado.totalInseridos || 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'nome_tabela' });
        
        if (cacheError) {
          console.warn('Erro ao registrar em cache_leis_raspadas:', cacheError);
        } else {
          addLog(`📋 Registrado em cache_leis_raspadas`);
        }
        
        toast({ 
          title: 'Sucesso!', 
          description: preservados > 0 
            ? `${resultado.totalInseridos} artigos inseridos (${preservados} com áudio/explicações preservados)`
            : `${resultado.totalInseridos} artigos inseridos`
        });

        // Marcar tabela como atualizada nesta sessão
        setTabelasAtualizadas(prev => new Set(prev).add(tabelaSelecionada.nome));

        setTabelas(prev => {
          const novasTabelas = prev.map(t => 
            t.nome === tabelaSelecionada.nome 
              ? { ...t, artigosExistentes: resultado.totalInseridos || 0, concluida: true } 
              : t
          );
          // Atualizar cache do localStorage com as tabelas atualizadas
          const cacheData = { tabelas: novasTabelas, timestamp: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          return novasTabelas;
        });

        limparProcesso();
        setTabelaSelecionada(null);
      } else {
        addLog(`❌ Erro: ${resultado.error}`);
        toast({ title: 'Erro', description: resultado.error, variant: 'destructive' });
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro'}`);
      toast({ title: 'Erro', description: 'Falha ao inserir', variant: 'destructive' });
    } finally {
      setPopulando(false);
      setProgressoPopular(0);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SELEÇÃO DE LINHAS
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleLinha = (idx: number) => {
    setLinhasSelecionadas(prev => {
      const novo = new Set(prev);
      if (novo.has(idx)) novo.delete(idx);
      else novo.add(idx);
      return novo;
    });
  };

  const excluirSelecionadas = () => {
    if (!etapa2Data || linhasSelecionadas.size === 0) return;
    
    const artigosRestantes = etapa2Data.artigos.filter((_, idx) => !linhasSelecionadas.has(idx));
    setEtapa2Data({
      ...etapa2Data,
      artigos: artigosRestantes,
      totalArtigos: artigosRestantes.length,
    });
    setLinhasSelecionadas(new Set());
    addLog(`🗑️ ${linhasSelecionadas.size} linhas excluídas`);
    toast({ title: 'Linhas excluídas', description: `${linhasSelecionadas.size} removidas` });
  };

  // Corrigir número do artigo (quando a validação detecta divergência)
  const corrigirNumeroArtigo = (indice: number, novoNumero: string) => {
    if (!etapa2Data) return;
    
    const novosArtigos = [...etapa2Data.artigos];
    novosArtigos[indice] = {
      ...novosArtigos[indice],
      "Número do Artigo": novoNumero
    };
    
    setEtapa2Data({
      ...etapa2Data,
      artigos: novosArtigos
    });
    
    // Atualizar validação para marcar como OK
    const novasValidacoes = new Map(validacoesLinhas);
    const validacaoAtual = novasValidacoes.get(indice);
    if (validacaoAtual) {
      novasValidacoes.set(indice, {
        ...validacaoAtual,
        status: 'ok',
        problema: undefined,
        sugestao: undefined
      });
      setValidacoesLinhas(novasValidacoes);
      
      // Atualizar resumo
      if (resumoValidacao) {
        setResumoValidacao({
          ...resumoValidacao,
          ok: resumoValidacao.ok + 1,
          alertas: Math.max(0, resumoValidacao.alertas - 1)
        });
      }
    }
    
    toast({ 
      title: 'Número corrigido', 
      description: `Artigo atualizado para ${novoNumero}` 
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const tabelasVazias = tabelas.filter(t => t.artigosExistentes === 0);
  const tabelasConcluidas = tabelas.filter(t => t.artigosExistentes > 0 && t.concluida);
  const tabelasOk = tabelas.filter(t => t.artigosExistentes > 0 && !t.concluida);

  return (
    <div className="min-h-screen bg-background pb-4">
      <div className="container mx-auto px-3 py-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">Sistema de Raspagem 3 Etapas</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Planalto → Formatação → Validação IA → Supabase</p>
          </div>
          <Button onClick={() => carregarStatusTabelas(true)} variant="outline" size="sm" disabled={carregando} className="shrink-0">
            <RefreshCw className={`h-3 w-3 ${carregando ? 'animate-spin' : ''} sm:mr-1`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Layout responsivo: stack em mobile, grid em desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">
          
          {/* COLUNA 1: Lista de Leis */}
          <div className={`lg:col-span-3 ${tabelaSelecionada ? 'hidden lg:block' : ''}`}>
            <Card className="lg:h-[calc(100vh-140px)]">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Leis ({tabelas.length})
                  <div className="flex items-center gap-1 ml-auto">
                    {cacheAge && <span className="text-[10px] text-muted-foreground">{cacheAge}</span>}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => carregarStatusTabelas(true)} 
                      disabled={carregando}
                    >
                      <RefreshCw className={`h-3 w-3 ${carregando ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Tabs defaultValue="vazias">
                  <TabsList className="grid w-full grid-cols-3 mb-2 h-8">
                    <TabsTrigger value="vazias" className="text-xs">Vazias ({tabelasVazias.length})</TabsTrigger>
                    <TabsTrigger value="ok" className="text-xs">OK ({tabelasOk.length})</TabsTrigger>
                    <TabsTrigger value="concluidas" className="text-xs">Concluído ({tabelasConcluidas.length})</TabsTrigger>
                  </TabsList>

                  {carregando ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <TabsContent value="vazias" className="mt-0">
                        <ScrollArea className="h-[50vh] lg:h-[calc(100vh-280px)]">
                          <div className="space-y-1">
                            {tabelasVazias.map(tabela => (
                              <div
                                key={tabela.nome}
                                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                  tabelaSelecionada?.nome === tabela.nome
                                    ? 'border-primary bg-primary/10'
                                    : 'border-transparent hover:bg-muted/50'
                                }`}
                                onClick={() => {
                                  setTabelaSelecionada(tabela);
                                  limparProcesso();
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium block truncate">{tabela.nomeAmigavel}</span>
                                </div>
                                {tabela.url && (
                                  <a
                                    href={tabela.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="ok" className="mt-0">
                        <ScrollArea className="h-[50vh] lg:h-[calc(100vh-280px)]">
                          <div className="space-y-1">
                            {tabelasOk.map(tabela => (
                              <div
                                key={tabela.nome}
                                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                  tabelaSelecionada?.nome === tabela.nome
                                    ? 'border-primary bg-primary/10'
                                    : tabelasAtualizadas.has(tabela.nome)
                                      ? 'border-emerald-400/50 bg-emerald-400/20 hover:bg-emerald-400/30'
                                      : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                                }`}
                                onClick={() => {
                                  setTabelaSelecionada(tabela);
                                  limparProcesso();
                                  carregarArtigosExistentes(tabela.nome);
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-medium block truncate">{tabela.nomeAmigavel}</span>
                                    {tabelasAtualizadas.has(tabela.nome) && (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                  {tabela.ultimaAtualizacao && (
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5" />
                                      {new Date(tabela.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{tabela.artigosExistentes}</Badge>
                                <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                                  <Volume2 className="h-2.5 w-2.5 mr-0.5" />
                                  {tabela.artigosComAudio}
                                </Badge>
                                {tabela.url && (
                                  <a
                                    href={tabela.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="concluidas" className="mt-0">
                        <ScrollArea className="h-[50vh] lg:h-[calc(100vh-280px)]">
                          <div className="space-y-1">
                            {tabelasConcluidas.map(tabela => (
                              <div
                                key={tabela.nome}
                                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                  tabelaSelecionada?.nome === tabela.nome
                                    ? 'border-primary bg-primary/10'
                                    : 'border-green-500/40 bg-green-500/10 hover:bg-green-500/20'
                                }`}
                                onClick={() => {
                                  setTabelaSelecionada(tabela);
                                  limparProcesso();
                                  carregarArtigosExistentes(tabela.nome);
                                }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-medium block truncate">{tabela.nomeAmigavel}</span>
                                  </div>
                                  {tabela.ultimaAtualizacao && (
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5" />
                                      {new Date(tabela.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-[10px] h-5 shrink-0 bg-green-500/20 text-green-700">{tabela.artigosExistentes}</Badge>
                                <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                                  <Volume2 className="h-2.5 w-2.5 mr-0.5" />
                                  {tabela.artigosComAudio}
                                </Badge>
                                {tabela.url && (
                                  <a
                                    href={tabela.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA 2: Área de Trabalho (3 Etapas) */}
          <div className={`lg:col-span-6 ${!tabelaSelecionada ? 'hidden lg:block' : ''}`}>
            {!tabelaSelecionada ? (
              <Card className="h-[calc(100vh-140px)] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Selecione uma lei na lista à esquerda</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Header da Lei Selecionada */}
                <Card>
                  <CardContent className="py-2 sm:py-3 px-3 sm:px-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-sm sm:text-base truncate">{tabelaSelecionada.nomeAmigavel}</h2>
                          {tabelaSelecionada.artigosExistentes > 0 && (
                            <Badge variant="secondary" className="text-[9px] h-5 shrink-0 bg-green-500/20 text-green-600 border-green-500/30">
                              {tabelaSelecionada.artigosExistentes} existentes
                            </Badge>
                          )}
                          {carregandoExistentes && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{tabelaSelecionada.nome}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setTabelaSelecionada(null); limparProcesso(); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Campo de URL editável */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {editandoUrl ? (
                        <>
                          <Input
                            value={urlEditavel}
                            onChange={(e) => setUrlEditavel(e.target.value)}
                            placeholder="https://www.planalto.gov.br/..."
                            className="h-7 text-xs flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                            onClick={salvarUrlPersonalizada}
                            title="Salvar URL"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              setEditandoUrl(false);
                              const urlPersonalizada = urlsPersonalizadas[tabelaSelecionada.nome];
                              const urlPadrao = getUrlPlanalto(tabelaSelecionada.nome) || '';
                              setUrlEditavel(urlPersonalizada || urlPadrao);
                            }}
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate flex-1" title={urlEditavel}>
                            {urlEditavel || 'Sem URL'}
                          </span>
                          {isUrlPersonalizada && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/30 shrink-0">
                              Personalizada
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => setEditandoUrl(true)}
                            title="Editar URL"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {isUrlPersonalizada && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={restaurarUrlPadrao}
                              title="Restaurar URL padrão"
                            >
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          )}
                          <a
                            href={urlEditavel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary shrink-0"
                            title="Abrir no navegador"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Steps - scrollable em mobile */}
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 overflow-x-auto pb-2">
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                    etapa1Data ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <FileCode className="h-3 w-3" />
                    <span className="hidden xs:inline">1.</span> Texto Bruto
                  </div>
                  <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground shrink-0" />
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                    etapa2Data ? 'bg-green-500/20 text-green-500' : etapa1Data ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Settings2 className="h-3 w-3" />
                    <span className="hidden xs:inline">2.</span> Formatação
                  </div>
                  <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground shrink-0" />
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                    etapa3Data ? 'bg-green-500/20 text-green-500' : etapa2Data ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden xs:inline">3.</span> Validação
                  </div>
                </div>

                {/* Botões de Ação - responsivo */}
                <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4">
                  {/* Botão Voltar Etapa */}
                  {(etapa1Data || etapa2Data || etapa3Data) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (etapa3Data) {
                          setEtapa3Data(null);
                          setEtapaAtual(2);
                          addLog('⬅️ Voltando para Etapa 2...');
                        } else if (etapa2Data) {
                          setEtapa2Data(null);
                          setEtapaAtual(1);
                          addLog('⬅️ Voltando para Etapa 1...');
                        } else if (etapa1Data) {
                          limparProcesso();
                          addLog('⬅️ Reiniciando processo...');
                        }
                      }}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Voltar</span>
                    </Button>
                  )}
                  
                  {!etapa1Data && (
                    <Button onClick={executarEtapa1} disabled={processando} className="flex-1 min-w-[140px]" size="sm">
                      {processando ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Play className="h-4 w-4 sm:mr-2" />}
                      <span className="truncate">Raspar Texto</span>
                    </Button>
                  )}
                  
                  {etapa1Data && !etapa2Data && (
                    <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                      <Button onClick={executarEtapa2} disabled={processando} className="flex-1" size="sm">
                        {processando ? (
                          <>
                            <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                            <span className="truncate">
                              {totalPartesFormatacao > 1 
                                ? `${parteAtualFormatacao}/${totalPartesFormatacao} (${progressoFormatacao}%)`
                                : `${progressoFormatacao}%`
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <Settings2 className="h-4 w-4 sm:mr-2" />
                            <span className="truncate">Formatar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {etapa2Data && !etapa3Data && (
                    <>
                      <Button onClick={() => { setEtapa2Data(null); setResultadoRevisao(null); }} variant="outline" size="sm" className="shrink-0">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={executarRevisao} 
                        disabled={processando || revisandoFormatacao || !textoFormatadoStream} 
                        variant="outline" 
                        size="sm" 
                        className="min-w-[80px]"
                      >
                        {revisandoFormatacao ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Revisar</span>
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={executarCorrecaoGemini} 
                        disabled={processando || corrigindoFormatacao || !textoFormatadoStream} 
                        variant="outline" 
                        size="sm" 
                        className="min-w-[80px] border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                      >
                        {corrigindoFormatacao ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Corrigir</span>
                          </>
                        )}
                      </Button>
                      <Button onClick={executarEtapa3} disabled={processando} variant="outline" size="sm" className="flex-1 min-w-[100px]">
                        {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 sm:mr-1" />}
                        <span className="hidden sm:inline truncate">Validar IA</span>
                      </Button>
                      <Button onClick={popularTabela} disabled={processando || populando} size="sm" className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700">
                        {populando ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /><span className="ml-1">{Math.round(progressoPopular)}%</span></>
                        ) : (
                          <><Upload className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline truncate">Popular</span></>
                        )}
                      </Button>
                    </>
                  )}

                  {etapa3Data && (
                    <>
                      {!etapa3Data.validacao.aprovado && (
                        <Button onClick={aplicarSugestoes} variant="outline" size="sm" className="flex-1 min-w-[100px]">
                          <RotateCcw className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline truncate">Sugestões</span>
                        </Button>
                      )}
                      <Button onClick={popularTabela} disabled={populando} size="sm" className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700">
                        {populando ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /><span className="ml-1">{Math.round(progressoPopular)}%</span></>
                        ) : (
                          <><Upload className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline truncate">Popular</span></>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Progresso de Formatação */}
                {processando && etapa1Data && !etapa2Data && (
                  <div className="px-2 sm:px-4">
                    <Progress value={progressoFormatacao} className="h-2" />
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">Formatando... {progressoFormatacao}%</p>
                  </div>
                )}

                {/* Progresso de Popular */}
                {populando && (
                  <div className="px-2 sm:px-4">
                    <Progress value={progressoPopular} className="h-2" />
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">Inserindo... {Math.round(progressoPopular)}%</p>
                  </div>
                )}

                {/* Conteúdo da Etapa Atual */}
                <Card className="min-h-[300px]">
                  <CardContent className="p-0">
                    <div className="p-4">
                      {/* Etapa 1: Texto Bruto */}
                      {etapa1Data && !etapa2Data && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa1Data.caracteres.toLocaleString()}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Caracteres</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa1Data.artigosDetectados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Artigos</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold text-amber-500">{etapa1Data.revogados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Revogados</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold text-amber-500">{etapa1Data.vetados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Vetados</div>
                            </div>
                          </div>
                          
                          {etapa1Data.anoAtualizacao && (
                            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <Calendar className="h-4 w-4 text-green-500" />
                              <span className="text-xs">
                                Última atualização: <strong>{etapa1Data.anoAtualizacao}</strong>
                                {etapa1Data.diasAtras && ` (${etapa1Data.diasAtras} dias atrás)`}
                              </span>
                            </div>
                          )}

                          <div className="border rounded-lg p-3 bg-black/50">
                            <p className="text-[10px] text-muted-foreground mb-2">Prévia do texto bruto:</p>
                            <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {etapa1Data.textoBruto.substring(0, 3000)}...
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Etapa 2: Tabela de Artigos */}
                      {etapa2Data && (
                        <div className="space-y-3">
                          {/* Stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa2Data.artigosNumerados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Artigos</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa2Data.cabecalhos}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Cabeçalhos</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa2Data.totalArtigos}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className={`text-sm sm:text-lg font-bold ${
                                etapa2Data.analise.percentualExtracao >= 90 ? 'text-green-500' :
                                etapa2Data.analise.percentualExtracao >= 70 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {etapa2Data.analise.percentualExtracao}%
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Extração</div>
                            </div>
                          </div>

                          {/* Resumo da validação linha por linha */}
                          {resumoValidacao && (
                            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-medium text-green-500">{resumoValidacao.ok}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-medium text-amber-500">{resumoValidacao.alertas}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs font-medium text-red-500">{resumoValidacao.erros}</span>
                              </div>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {Math.round((resumoValidacao.ok / resumoValidacao.total) * 100)}% OK
                              </span>
                            </div>
                          )}

                          {/* Linha sendo validada */}
                          {validandoLinha !== null && (
                            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg animate-pulse">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-xs">Validando linha {validandoLinha + 1} de {etapa2Data.artigos.length}...</span>
                            </div>
                          )}

                          {/* Resultado da Revisão */}
                          {resultadoRevisao && (
                            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Resultado da Revisão
                                </h4>
                                <Badge variant={resultadoRevisao.elementosFaltantes.length === 0 ? 'default' : 'destructive'}>
                                  {resultadoRevisao.resumo.percentualCompletude}% completo
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 bg-muted/50 rounded">
                                  <div className="font-medium">{resultadoRevisao.resumo.ementaPresente ? '✅' : '❌'}</div>
                                  <div className="text-muted-foreground">Ementa</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded">
                                  <div className="font-medium">{resultadoRevisao.estruturaBruto?.totalCapitulos || 0}</div>
                                  <div className="text-muted-foreground">Capítulos</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded">
                                  <div className="font-medium">{resultadoRevisao.estruturaBruto?.totalArtigos || 0}</div>
                                  <div className="text-muted-foreground">Artigos no Bruto</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded">
                                  <div className={`font-medium ${resultadoRevisao.resumo.elementosFaltantes > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {resultadoRevisao.resumo.elementosFaltantes}
                                  </div>
                                  <div className="text-muted-foreground">Faltantes</div>
                                </div>
                              </div>
                              
                              {resultadoRevisao.elementosFaltantes.length > 0 && (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-muted-foreground font-medium">Elementos faltantes:</p>
                                  {resultadoRevisao.elementosFaltantes.map((elem, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-1.5 bg-red-500/10 rounded text-xs">
                                      <Badge variant="outline" className="text-[10px]">{elem.tipo}</Badge>
                                      <span className="font-medium">{elem.identificador}</span>
                                      {elem.posicaoAproximada && (
                                        <span className="text-muted-foreground truncate">→ {elem.posicaoAproximada}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <p className="text-[10px] text-muted-foreground italic">{resultadoRevisao.resumo.observacoes}</p>
                            </div>
                          )}

                          {/* Validação Visual de Artigos - igual ValidarArtigos.tsx */}
                          {etapa1Data?.textoBruto && textoFormatadoStream && (
                            <ValidacaoVisualArtigos
                              textoBruto={etapa1Data.textoBruto}
                              textoFormatado={textoFormatadoStream}
                              onLocalizarArtigo={(numero, posicao) => {
                                addLog(`🔍 Localizando ${numero} na posição ${posicao}`);
                              }}
                            />
                          )}

                          {/* Comparação com dados existentes no Supabase */}
                          {artigosExistentes.length > 0 && etapa2Data && etapa2Data.artigos.length > 0 && (
                            <ComparacaoArtigos
                              artigosExistentes={artigosExistentes}
                              artigosNovos={etapa2Data.artigos}
                              onAplicarMudancas={(artigos, modificados) => {
                                addLog(`📊 ${modificados.length} artigos serão atualizados`);
                                toast({ title: 'Pronto para atualizar', description: `${modificados.length} artigos modificados identificados` });
                              }}
                            />
                          )}

                          {/* Botão excluir */}
                          {linhasSelecionadas.size > 0 && (
                            <Button onClick={excluirSelecionadas} variant="destructive" size="sm">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir ({linhasSelecionadas.size})
                            </Button>
                          )}

                          {/* Tabela */}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8">
                                  <input
                                    type="checkbox"
                                    checked={etapa2Data.artigos.length > 0 && linhasSelecionadas.size === etapa2Data.artigos.length}
                                    onChange={() => {
                                      if (linhasSelecionadas.size === etapa2Data.artigos.length) {
                                        setLinhasSelecionadas(new Set());
                                      } else {
                                        setLinhasSelecionadas(new Set(etapa2Data.artigos.map((_, i) => i)));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                </TableHead>
                                {validacoesLinhas.size > 0 && (
                                  <TableHead className="w-10 text-xs">Status</TableHead>
                                )}
                                <TableHead className="w-20 text-xs">Nº</TableHead>
                                <TableHead className="text-xs">Conteúdo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {etapa2Data.artigos.map((art, i) => {
                                const validacao = validacoesLinhas.get(i);
                                const statusClass = validacao?.status === 'ok' 
                                  ? 'bg-green-500/10 border-l-4 border-green-500' 
                                  : validacao?.status === 'alerta' 
                                    ? 'bg-amber-500/10 border-l-4 border-amber-500' 
                                    : validacao?.status === 'erro'
                                      ? 'bg-red-500/10 border-l-4 border-red-500'
                                      : validandoLinha === i 
                                        ? 'bg-primary/10 animate-pulse' 
                                        : '';
                                
                                return (
                                  <TableRow 
                                    key={i}
                                    id={`artigo-row-${i}`}
                                    className={`cursor-pointer hover:bg-muted/50 transition-all duration-300 ${statusClass} ${
                                      linhasSelecionadas.has(i) ? 'bg-destructive/10' : ''
                                    } ${
                                      linhaExpandida === i ? 'bg-primary/10' : ''
                                    } ${
                                      linhaDestacada === i ? 'bg-amber-500/30 animate-pulse' : ''
                                    }`}
                                    onClick={() => {
                                      setLinhaExpandida(linhaExpandida === i ? null : i);
                                      if (linhaDestacada === i) setLinhaDestacada(null);
                                    }}
                                  >
                                    <TableCell className="py-1" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={linhasSelecionadas.has(i)}
                                        onChange={() => toggleLinha(i)}
                                        className="rounded"
                                      />
                                    </TableCell>
                                    {validacoesLinhas.size > 0 && (
                                      <TableCell className="py-1 text-center">
                                        {validacao?.status === 'ok' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {validacao?.status === 'alerta' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        {validacao?.status === 'erro' && <XCircle className="h-4 w-4 text-red-500" />}
                                        {validandoLinha === i && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-xs py-1 align-top">
                                      {/* Mostrar número corrigido da validação se disponível */}
                                      {validacao?.numero && validacao.numero !== art["Número do Artigo"] ? (
                                        <div className="space-y-1">
                                          <span className="text-amber-500 font-medium">{validacao.numero}</span>
                                          <span className="text-[8px] text-muted-foreground line-through block">{art["Número do Artigo"]}</span>
                                        </div>
                                      ) : (
                                        art["Número do Artigo"] || <Badge variant="outline" className="text-[9px]">{art.tipo}</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs py-1">
                                      <div>
                                        <p className={`whitespace-pre-wrap ${linhaExpandida === i ? '' : 'line-clamp-2'}`}>
                                          {art.Artigo}
                                        </p>
                                        {/* Mostrar problema/sugestão quando expandido */}
                                        {linhaExpandida === i && validacao?.problema && (
                                          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                                            <p className="text-[10px] font-medium text-amber-600">⚠️ {validacao.problema}</p>
                                            {validacao.sugestao && (
                                              <p className="text-[10px] text-muted-foreground mt-1">💡 {validacao.sugestao}</p>
                                            )}
                                            {/* Botão Corrigir - aparece quando há sugestão de correção */}
                                            {validacao.sugestao?.includes('Corrigir') && validacao.numero && validacao.numero !== art["Número do Artigo"] && (
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="mt-2 h-6 text-[10px] bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  corrigirNumeroArtigo(i, validacao.numero!);
                                                }}
                                              >
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Corrigir para {validacao.numero}
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Etapa 3: Validação */}
                      {etapa3Data && (
                        <div className="space-y-4">
                          {/* Status */}
                          <div className={`p-4 rounded-lg border-2 ${
                            etapa3Data.validacao.aprovado 
                              ? 'border-green-500/30 bg-green-500/10' 
                              : 'border-red-500/30 bg-red-500/10'
                          }`}>
                            <div className="flex items-center gap-3">
                              {etapa3Data.validacao.aprovado ? (
                                <CheckCircle className="h-8 w-8 text-green-500" />
                              ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                              )}
                              <div>
                                <div className="font-bold text-lg">
                                  Nota: {etapa3Data.validacao.nota}/100
                                </div>
                                <p className="text-sm text-muted-foreground">{etapa3Data.validacao.resumo}</p>
                              </div>
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa3Data.estatisticas.artigosEncontrados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Encontrados</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa3Data.estatisticas.artigosEsperados}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Esperados</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-sm sm:text-lg font-bold">{etapa3Data.estatisticas.totalLacunas}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Lacunas</div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className={`text-sm sm:text-lg font-bold ${
                                etapa3Data.estatisticas.percentualExtracao >= 90 ? 'text-green-500' : 'text-amber-500'
                              }`}>
                                {etapa3Data.estatisticas.percentualExtracao}%
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">Extração</div>
                            </div>
                          </div>

                          {/* Problemas */}
                          {etapa3Data.validacao.problemas.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-4 w-4" />
                                Problemas Detectados
                              </h4>
                              {etapa3Data.validacao.problemas.map((prob, i) => (
                                <div key={i} className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <div className="font-medium text-xs">{prob.descricao}</div>
                                  {prob.sugestao && (
                                    <div className="text-[10px] text-muted-foreground mt-1">💡 {prob.sugestao}</div>
                                  )}
                                  
                                  {/* Artigos clicáveis */}
                                  {prob.artigos && prob.artigos.length > 0 && etapa2Data?.artigos && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <span className="text-[9px] text-muted-foreground">Ver:</span>
                                      {prob.artigos.slice(0, 5).map((numArt, j) => {
                                        const idx = etapa2Data.artigos.findIndex(a => a["Número do Artigo"] === numArt);
                                        if (idx < 0) return null;
                                        return (
                                          <button
                                            key={j}
                                            onClick={() => {
                                              if (etapaAtual === 3) setEtapaAtual(2);
                                              setLinhaDestacada(idx);
                                              setLinhaExpandida(idx);
                                              setTimeout(() => {
                                                const elemento = document.getElementById(`artigo-row-${idx}`);
                                                if (elemento) {
                                                  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }
                                              }, 100);
                                            }}
                                            className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500/40 rounded text-[9px] font-mono transition-colors cursor-pointer"
                                          >
                                            {numArt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sugestões */}
                          {etapa3Data.validacao.sugestoes.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-500">
                                <Sparkles className="h-4 w-4" />
                                Sugestões da IA
                              </h4>
                              {etapa3Data.validacao.sugestoes.map((sug, i) => (
                                <div key={i} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-xs">{sug.regra}</span>
                                    <Badge variant={sug.prioridade === 'alta' ? 'destructive' : 'secondary'} className="text-[9px]">
                                      {sug.prioridade}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1">{sug.descricao}</div>
                                  
                                  {/* Exemplos clicáveis */}
                                  {sug.exemplos && sug.exemplos.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <span className="text-[9px] text-muted-foreground">Exemplos:</span>
                                      {sug.exemplos.map((ex, j) => (
                                        <button
                                          key={j}
                                          onClick={() => {
                                            // Ir para etapa 2 se necessário
                                            if (etapaAtual === 3) {
                                              setEtapaAtual(2);
                                            }
                                            // Destacar a linha em amarelo
                                            setLinhaDestacada(ex.indice);
                                            setLinhaExpandida(ex.indice);
                                            // Scroll até a linha
                                            setTimeout(() => {
                                              const elemento = document.getElementById(`artigo-row-${ex.indice}`);
                                              if (elemento) {
                                                elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                              }
                                            }, 100);
                                          }}
                                          className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 rounded text-[9px] font-mono transition-colors cursor-pointer"
                                        >
                                          {ex.artigo}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Estado inicial - Textarea editável + Upload PDF */}
                      {!etapa1Data && !processando && !extraindoPdf && (
                        <div className="space-y-4">
                          {/* Área de Upload PDF */}
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="pdf-upload"
                            />
                            <label
                              htmlFor="pdf-upload"
                              className="flex flex-col items-center justify-center cursor-pointer"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-full">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Upload de PDF</p>
                                  <p className="text-[10px] text-muted-foreground">Arraste ou clique para enviar (máx 20MB)</p>
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[10px] text-muted-foreground uppercase">ou cole o texto</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Texto Bruto</Label>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{textoBrutoManual.length.toLocaleString()} caracteres</span>
                              {textoBrutoManual.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setTextoBrutoManual('')}
                                  className="h-6 px-2"
                                >
                                  Limpar
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <Textarea
                            value={textoBrutoManual}
                            onChange={(e) => setTextoBrutoManual(e.target.value)}
                            placeholder="Cole o texto bruto da lei aqui, ou clique em 'Raspar Texto' para buscar automaticamente do Planalto..."
                            className="min-h-[200px] font-mono text-xs bg-muted/30"
                          />
                          
                          {textoBrutoManual.length > 0 && (
                            <div className="flex justify-end">
                              <Button onClick={usarTextoBrutoManual} size="sm" variant="secondary">
                                <FileCode className="h-4 w-4 mr-2" />
                                Usar Este Texto
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Loading de extração de PDF */}
                      {extraindoPdf && (
                        <div className="flex flex-col items-center justify-center h-64">
                          <DotLottieReact 
                            src="https://lottie.host/d67166d6-1f9b-420f-82db-9d91c085006d/iG6u0nCNLc.lottie" 
                            loop 
                            autoplay 
                            style={{ width: 120, height: 120 }}
                          />
                          <p className="text-sm text-muted-foreground mt-4">Extraindo texto do PDF...</p>
                          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                        </div>
                      )}

                      {/* Loading */}
                      {processando && (
                        <div className="flex flex-col items-center justify-center h-64">
                          <DotLottieReact 
                            src="https://lottie.host/d67166d6-1f9b-420f-82db-9d91c085006d/iG6u0nCNLc.lottie" 
                            loop 
                            autoplay 
                            style={{ width: 120, height: 120 }}
                          />
                          <p className="text-sm text-muted-foreground mt-4">Processando...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* COLUNA 3: Painel de Regras + Logs - escondido em mobile quando lei selecionada */}
          <div className={`lg:col-span-3 space-y-4 ${tabelaSelecionada ? 'hidden lg:block' : 'hidden lg:block'}`}>
            {/* Regras de Formatação */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Regras de Formatação
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Quebra dupla antes de títulos</span>
                    <Switch checked={regras.quebraDuplaAntes.length > 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Normalizar Art. 1 o → Art. 1º</span>
                    <Switch checked={regras.normalizarArtigos} onCheckedChange={(v) => setRegras({...regras, normalizarArtigos: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Remover referências (Lei nº...)</span>
                    <Switch checked={regras.removerReferencias} onCheckedChange={(v) => setRegras({...regras, removerReferencias: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Corrigir espaços</span>
                    <Switch checked={regras.corrigirEspacos} onCheckedChange={(v) => setRegras({...regras, corrigirEspacos: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Art. 1-A, 1-B são separados</span>
                    <Switch checked={regras.artigosComSufixo} onCheckedChange={(v) => setRegras({...regras, artigosComSufixo: v})} />
                  </div>
                </div>

                <div className="border-t pt-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Manter textos:</p>
                  <div className="flex flex-wrap gap-1">
                    {regras.manterTextos.map((texto, i) => (
                      <Badge key={i} variant="outline" className="text-[9px]">{texto}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt IA Configurável */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Prompt da IA
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 ml-auto text-xs"
                    onClick={() => setMostrarPrompt(!mostrarPrompt)}
                  >
                    {mostrarPrompt ? 'Ocultar' : 'Ver/Editar'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {mostrarPrompt && (
                <CardContent className="px-3 pb-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">
                    Este é o prompt enviado para a IA formatar as leis. Edite para ajustar comportamentos.
                  </p>
                  <textarea
                    value={promptCustomizado}
                    onChange={(e) => setPromptCustomizado(e.target.value)}
                    className="w-full h-[200px] text-[10px] font-mono p-2 rounded border bg-muted/50 resize-y"
                    placeholder="Digite o prompt para a IA..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs h-7"
                      onClick={() => {
                        localStorage.setItem(PROMPT_KEY, promptCustomizado);
                        toast({ title: 'Prompt salvo!', description: 'O prompt será usado nas próximas formatações' });
                        addLog('💾 Prompt customizado salvo');
                      }}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        setPromptCustomizado(PROMPT_PADRAO);
                        localStorage.removeItem(PROMPT_KEY);
                        toast({ title: 'Prompt restaurado!', description: 'Voltou ao prompt padrão' });
                        addLog('🔄 Prompt restaurado ao padrão');
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Resetar
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60">
                    Dica: Adicione regras específicas como "sempre manter (Incluído pela...)" se necessário.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Logs */}
            <Card className="flex-1">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Logs ({logs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px] lg:h-[calc(100vh-480px)] px-3 pb-3">
                  <div className="font-mono text-[10px] space-y-0.5">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={`py-0.5 ${
                          log.includes('✅') || log.includes('✓') ? 'text-green-500' :
                          log.includes('❌') || log.includes('✗') ? 'text-red-500' :
                          log.includes('⚠️') ? 'text-amber-500' :
                          log.includes('🌐') || log.includes('📝') || log.includes('🤖') ? 'text-blue-400' :
                          log.includes('───') ? 'text-muted-foreground/50' :
                          'text-muted-foreground'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Logs compacto em mobile quando processando */}
          {tabelaSelecionada && logs.length > 0 && (
            <div className="lg:hidden">
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Logs ({logs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[120px] px-3 pb-3">
                    <div className="font-mono text-[9px] space-y-0.5">
                      {logs.slice(-10).map((log, i) => (
                        <div
                          key={i}
                          className={`py-0.5 ${
                            log.includes('✅') || log.includes('✓') ? 'text-green-500' :
                            log.includes('❌') || log.includes('✗') ? 'text-red-500' :
                            log.includes('⚠️') ? 'text-amber-500' :
                            'text-muted-foreground'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
