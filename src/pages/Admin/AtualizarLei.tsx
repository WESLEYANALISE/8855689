import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, RefreshCw, Loader2, GitCompare, Check, AlertTriangle, 
  Music, Calendar, FileText, CheckCircle2, XCircle, ArrowRightLeft,
  ChevronDown, ChevronRight, Trash2, Volume2, Eye, Download, Play,
  Sparkles, ArrowRight, Pencil, Save, RotateCcw, Link, ExternalLink,
  FileCode, Table2, Copy
} from 'lucide-react';
import brasaoRepublica from '@/assets/brasao-republica.png';
import { useToast } from '@/hooks/use-toast';
import { getUrlPlanalto, getNomeAmigavel } from '@/lib/urlsPlanalto';
import { supabase } from '@/integrations/supabase/client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ModalComparacaoLei } from '@/components/admin/ModalComparacaoLei';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface Artigo {
  id?: number;
  "Número do Artigo": string;
  Artigo: string;
  Narração?: string;
  ordem_artigo?: number;
}

interface ArtigoAlterado {
  numero: string;
  conteudoAntigo: string;
  conteudoNovo: string;
  diferencas: string[];
  textoIdentico: boolean;
}

interface AudioAfetado {
  artigo: string;
  tipo: 'remover' | 'atualizar' | 'manter';
  urlAudio?: string;
  motivo: string;
}

interface MapeamentoAudio {
  numeroArtigo: string;
  acao: 'manter' | 'remover' | 'ignorar';
  urlAudio?: string;
  novaOrdem?: number;
}

interface Estatisticas {
  artigosAtuais: number;
  artigosNovos: number;
  inclusoes: number;
  alteracoes: number;
  exclusoes: number;
  audiosAtuais: number;
  audiosManter: number;
  audiosRemover: number;
  audiosRegravar: number;
}

interface ComparacaoResult {
  artigosNovos: Array<{ numero: string; conteudo: string }>;
  artigosRemovidos: Array<{ numero: string; conteudo: string }>;
  artigosAlterados: ArtigoAlterado[];
  audiosAfetados: AudioAfetado[];
  mapeamentoAudios: MapeamentoAudio[];
  resumo: string;
  analiseDetalhada?: string;
  estatisticas: Estatisticas;
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
  historicoAlteracoes?: string[];
}

interface Etapa2Data {
  textoLimpo: string;
  caracteres: number;
  artigosDetectados: number;
  paragrafosDetectados: number;
  revogados: number;
  vetados: number;
}

interface Etapa3Data {
  textoFormatado: string;
  artigos: Artigo[];
  totalArtigos: number;
  artigosNumerados: number;
  cabecalhos: number;
  assinaturas?: string;
}

interface Etapa4Data {
  validacao: {
    aprovado: boolean;
    nota: number;
    problemas: Array<{
      tipo: string;
      descricao: string;
      artigos?: string[];
      sugestao?: string;
    }>;
    correcoes?: Array<{
      tipo: string;
      descricao: string;
    }>;
    resumo: string;
  };
  estatisticas: {
    artigosEsperados: number;
    artigosEncontrados: number;
    lacunas: number[];
    totalLacunas: number;
    percentualExtracao: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AtualizarLei() {
  const navigate = useNavigate();
  const { tableName } = useParams<{ tableName: string }>();
  const { toast } = useToast();
  
  // Estados gerais
  const [artigosAtuais, setArtigosAtuais] = useState<Artigo[]>([]);
  const [comparacao, setComparacao] = useState<ComparacaoResult | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<1 | 2 | 3 | 4>(1);
  const [processando, setProcessando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showModalComparacao, setShowModalComparacao] = useState(false);
  const [artigoExpandido, setArtigoExpandido] = useState<string | null>(null);
  const [showAnaliseDetalhada, setShowAnaliseDetalhada] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Dados das 4 etapas
  const [etapa1Data, setEtapa1Data] = useState<Etapa1Data | null>(null);
  const [etapa2Data, setEtapa2Data] = useState<Etapa2Data | null>(null);
  const [etapa3Data, setEtapa3Data] = useState<Etapa3Data | null>(null);
  const [etapa4Data, setEtapa4Data] = useState<Etapa4Data | null>(null);
  
  // Progresso geral
  const [progressoGeral, setProgressoGeral] = useState(0);
  const [parteAtualFormatacao, setParteAtualFormatacao] = useState(0);
  const [totalPartesFormatacao, setTotalPartesFormatacao] = useState(0);
  
  // URL editável
  const [urlEditavel, setUrlEditavel] = useState('');
  const [editandoUrl, setEditandoUrl] = useState(false);
  const [salvandoUrl, setSalvandoUrl] = useState(false);
  
  const decodedTableName = tableName ? decodeURIComponent(tableName) : '';
  const nomeAmigavel = getNomeAmigavel(decodedTableName);
  const urlPlanaltoDefault = getUrlPlanalto(decodedTableName);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARREGAMENTO INICIAL
  // ═══════════════════════════════════════════════════════════════════════════

  // Carregar URL customizada do banco (prioridade) ou usar default
  useEffect(() => {
    const carregarUrlCustomizada = async () => {
      if (!decodedTableName) return;
      
      try {
        const { data, error } = await supabase
          .from('urls_planalto_customizadas')
          .select('url_planalto')
          .eq('nome_tabela', decodedTableName)
          .single();
        
        if (data?.url_planalto) {
          setUrlEditavel(data.url_planalto);
        } else if (urlPlanaltoDefault) {
          setUrlEditavel(urlPlanaltoDefault);
        }
      } catch {
        // Sem URL customizada, usar default
        if (urlPlanaltoDefault) {
          setUrlEditavel(urlPlanaltoDefault);
        }
      }
    };
    
    carregarUrlCustomizada();
  }, [decodedTableName, urlPlanaltoDefault]);

  useEffect(() => {
    if (decodedTableName) {
      carregarArtigosAtuais();
    }
  }, [decodedTableName]);

  const carregarArtigosAtuais = async () => {
    try {
      const { data, error } = await supabase
        .from(decodedTableName as any)
        .select('*')
        .order('ordem_artigo', { ascending: true });

      if (error) throw error;
      setArtigosAtuais((data as unknown as Artigo[]) || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar artigos atuais', variant: 'destructive' });
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
    setEtapa4Data(null);
    setComparacao(null);
    setEtapaAtual(1);
    setLogs([]);
    setProgressoGeral(0);
  };

  // Salvar URL customizada no banco
  const salvarUrlCustomizada = async () => {
    if (!urlEditavel || !decodedTableName) return;
    
    setSalvandoUrl(true);
    try {
      const { error } = await supabase
        .from('urls_planalto_customizadas')
        .upsert(
          { nome_tabela: decodedTableName, url_planalto: urlEditavel },
          { onConflict: 'nome_tabela' }
        );
      
      if (error) throw error;
      
      toast({ title: 'URL salva!', description: 'Esta URL será usada como padrão para esta lei.' });
      setEditandoUrl(false);
    } catch (error) {
      console.error('Erro ao salvar URL:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a URL', variant: 'destructive' });
    } finally {
      setSalvandoUrl(false);
    }
  };

  // Extrair histórico de alterações do texto bruto com contexto do artigo
  const extrairHistoricoAlteracoes = (texto: string): string[] => {
    const alteracaoRegex = /\((?:[^)]*(?:Lei\s+n[ºo°]|Incluído|Redação\s+dada|Alterado|Revogado|Acrescido|Inserido|Modificado)[^)]*)\)/gi;
    
    // Mapa para agrupar: alteração -> artigos afetados
    const alteracaoParaArtigos = new Map<string, Set<string>>();
    
    // Encontrar todos os matches com índice
    let match;
    while ((match = alteracaoRegex.exec(texto)) !== null) {
      const alteracao = match[0].replace(/[()]/g, '').trim();
      if (alteracao.length <= 10 || alteracao.length >= 200) continue;
      
      // Buscar contexto do artigo antes deste match (até 500 caracteres antes)
      const textoBefore = texto.slice(Math.max(0, match.index - 500), match.index);
      
      // Procurar por Art. X, § Y, inciso, alínea no contexto
      const artigoMatch = textoBefore.match(/(?:Art\.\s*(\d+[\-\w]*(?:-[A-Z])?)|§\s*(\d+º?)|([IVXLCDM]+)\s*[-–]|([a-z])\))/gi);
      
      let contexto = '';
      if (artigoMatch && artigoMatch.length > 0) {
        // Pegar o último match (mais próximo da alteração)
        const ultimoMatch = artigoMatch[artigoMatch.length - 1];
        
        // Buscar também o Art. principal se encontramos um § ou inciso
        const artPrincipal = textoBefore.match(/Art\.\s*(\d+[\-\w]*(?:-[A-Z])?)/gi);
        if (artPrincipal && artPrincipal.length > 0) {
          const artNum = artPrincipal[artPrincipal.length - 1];
          if (ultimoMatch.startsWith('§') || ultimoMatch.match(/^[IVXLCDM]+/i) || ultimoMatch.match(/^[a-z]\)/)) {
            contexto = `${artNum}, ${ultimoMatch}`;
          } else {
            contexto = ultimoMatch;
          }
        } else {
          contexto = ultimoMatch;
        }
      }
      
      // Agrupar por alteração
      if (!alteracaoParaArtigos.has(alteracao)) {
        alteracaoParaArtigos.set(alteracao, new Set());
      }
      if (contexto) {
        alteracaoParaArtigos.get(alteracao)!.add(contexto);
      }
    }
    
    // Construir resultado com artigos
    const historico: { texto: string; ano: number }[] = [];
    alteracaoParaArtigos.forEach((artigos, alteracao) => {
      const artigosStr = artigos.size > 0 ? Array.from(artigos).slice(0, 3).join(', ') : '';
      const textoFinal = artigosStr ? `${artigosStr} → ${alteracao}` : alteracao;
      
      // Extrair ano da data (formato brasileiro: DD.MM.YYYY ou DD/MM/YYYY ou DD-MM-YYYY)
      // Ou "de YYYY" no final
      const dataMatch = alteracao.match(/(?:de\s+)?(\d{1,2})[./-](\d{1,2})[./-](\d{4})|de\s+(\d{4})(?:\s*\)|$)/i);
      let ano = 0;
      if (dataMatch) {
        // Se encontrou data completa (grupo 3) ou apenas ano (grupo 4)
        ano = parseInt(dataMatch[3] || dataMatch[4] || '0');
      } else {
        // Fallback: pegar o último número de 4 dígitos que parece ano (19XX ou 20XX)
        const anosMatch = alteracao.match(/\b(19\d{2}|20\d{2})\b/g);
        if (anosMatch && anosMatch.length > 0) {
          // Pegar o último ano mencionado (geralmente é o ano da lei)
          ano = parseInt(anosMatch[anosMatch.length - 1]);
        }
      }
      
      historico.push({ texto: textoFinal, ano });
    });
    
    // Ordenar por ano (mais recente primeiro)
    historico.sort((a, b) => b.ano - a.ano);
    
    return historico.slice(0, 50).map(h => h.texto);
  };

  // Função para destacar diferenças entre textos (word diff)
  const renderDiff = (textoAntigo: string, textoNovo: string): { antes: React.ReactNode; depois: React.ReactNode } => {
    const palavrasAntigas = textoAntigo.split(/(\s+)/);
    const palavrasNovas = textoNovo.split(/(\s+)/);
    
    // Criar sets para comparação rápida
    const setAntigo = new Set(palavrasAntigas.filter(p => p.trim()));
    const setNovo = new Set(palavrasNovas.filter(p => p.trim()));
    
    // Renderizar texto antigo com palavras removidas destacadas
    const antesJsx = palavrasAntigas.map((palavra, i) => {
      if (!palavra.trim()) return palavra;
      const foiRemovida = !setNovo.has(palavra);
      return foiRemovida 
        ? <span key={i} className="bg-red-500/30 text-red-300 px-0.5 rounded">{palavra}</span>
        : palavra;
    });
    
    // Renderizar texto novo com palavras adicionadas destacadas
    const depoisJsx = palavrasNovas.map((palavra, i) => {
      if (!palavra.trim()) return palavra;
      const foiAdicionada = !setAntigo.has(palavra);
      return foiAdicionada 
        ? <span key={i} className="bg-green-500/30 text-green-300 px-0.5 rounded">{palavra}</span>
        : palavra;
    });
    
    return { antes: antesJsx, depois: depoisJsx };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: RASPAGEM BRUTA
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // NOVO FLUXO DE 4 ETAPAS
  // ═══════════════════════════════════════════════════════════════════════════

  const executarFluxoCompleto = async () => {
    const urlParaRaspar = urlEditavel || urlPlanaltoDefault;
    if (!urlParaRaspar) {
      toast({ title: 'Erro', description: 'URL do Planalto não encontrada', variant: 'destructive' });
      return;
    }

    setProcessando(true);
    limparProcesso();
    
    try {
      // ═══════════════════════════════════════════════════════════════════════════
      // ETAPA 1: BUSCAR NA INTERNET
      // ═══════════════════════════════════════════════════════════════════════════
      setProgressoGeral(5);
      addLog('═══════════════════════════════════════════════════════════');
      addLog(`🌐 ETAPA 1/4: BUSCAR NA INTERNET`);
      addLog('═══════════════════════════════════════════════════════════');
      addLog(`🔗 URL: ${urlParaRaspar}`);

      const { data: dataEtapa1, error: errorEtapa1 } = await supabase.functions.invoke('raspar-planalto-bruto', {
        body: { urlPlanalto: urlParaRaspar, tableName: decodedTableName }
      });

      if (errorEtapa1 || !dataEtapa1?.success) {
        throw new Error(dataEtapa1?.error || 'Falha ao raspar texto');
      }
      
      const historicoAlteracoes = extrairHistoricoAlteracoes(dataEtapa1.textoBruto || dataEtapa1.htmlBruto || '');
      
      const etapa1Result: Etapa1Data = {
        textoBruto: dataEtapa1.textoBruto,
        htmlBruto: dataEtapa1.htmlBruto,
        caracteres: dataEtapa1.caracteres,
        artigosDetectados: dataEtapa1.artigosDetectados,
        revogados: dataEtapa1.revogados,
        vetados: dataEtapa1.vetados,
        dataAtualizacao: dataEtapa1.dataAtualizacao,
        anoAtualizacao: dataEtapa1.anoAtualizacao,
        diasAtras: dataEtapa1.diasAtras,
        historicoAlteracoes,
      };
      
      setEtapa1Data(etapa1Result);
      setProgressoGeral(20);
      addLog(`✅ Raspagem: ${dataEtapa1.caracteres.toLocaleString()} caracteres`);
      addLog(`📊 Artigos detectados: ${dataEtapa1.artigosDetectados}`);

      // ═══════════════════════════════════════════════════════════════════════════
      // ETAPA 2: CONVERTER HTML → TEXTO LIMPO (Gemini)
      // ═══════════════════════════════════════════════════════════════════════════
      setProgressoGeral(25);
      addLog('───────────────────────────────────────────────────────────');
      addLog('🔄 ETAPA 2/4: CONVERTER HTML → TEXTO LIMPO');
      addLog('───────────────────────────────────────────────────────────');

      const { data: dataEtapa2, error: errorEtapa2 } = await supabase.functions.invoke('converter-html-texto', {
        body: { 
          htmlBruto: etapa1Result.htmlBruto || etapa1Result.textoBruto,
          textoBruto: etapa1Result.textoBruto
        }
      });

      if (errorEtapa2 || !dataEtapa2?.success) {
        throw new Error(dataEtapa2?.error || 'Falha ao converter HTML');
      }

      const etapa2Result: Etapa2Data = {
        textoLimpo: dataEtapa2.textoLimpo,
        caracteres: dataEtapa2.estatisticas?.caracteres || dataEtapa2.textoLimpo.length,
        artigosDetectados: dataEtapa2.estatisticas?.artigosDetectados || 0,
        paragrafosDetectados: dataEtapa2.estatisticas?.paragrafosDetectados || 0,
        revogados: dataEtapa2.estatisticas?.revogados || 0,
        vetados: dataEtapa2.estatisticas?.vetados || 0,
      };

      setEtapa2Data(etapa2Result);
      setEtapaAtual(2);
      setProgressoGeral(45);
      addLog(`✅ Conversão: ${etapa2Result.caracteres.toLocaleString()} caracteres`);
      addLog(`📊 Artigos: ${etapa2Result.artigosDetectados} | Parágrafos: ${etapa2Result.paragrafosDetectados}`);

      // ═══════════════════════════════════════════════════════════════════════════
      // ETAPA 3: LIMPAR E FORMATAR (Gemini)
      // ═══════════════════════════════════════════════════════════════════════════
      setProgressoGeral(50);
      addLog('───────────────────────────────────────────────────────────');
      addLog('🧹 ETAPA 3/4: LIMPAR E FORMATAR');
      addLog('───────────────────────────────────────────────────────────');

      const { data: dataEtapa3, error: errorEtapa3 } = await supabase.functions.invoke('formatar-texto-lei', {
        body: { 
          textoLimpo: etapa2Result.textoLimpo,
          tableName: decodedTableName
        }
      });

      if (errorEtapa3 || !dataEtapa3?.success) {
        throw new Error(dataEtapa3?.error || 'Falha ao formatar texto');
      }

      const etapa3Result: Etapa3Data = {
        textoFormatado: dataEtapa3.textoFormatado,
        artigos: dataEtapa3.artigos || [],
        totalArtigos: dataEtapa3.estatisticas?.totalArtigos || 0,
        artigosNumerados: dataEtapa3.estatisticas?.artigosNumerados || 0,
        cabecalhos: dataEtapa3.estatisticas?.cabecalhos || 0,
        assinaturas: dataEtapa3.assinaturas,
      };

      setEtapa3Data(etapa3Result);
      setEtapaAtual(3);
      setProgressoGeral(75);
      addLog(`✅ Formatação: ${etapa3Result.totalArtigos} registros`);
      addLog(`📊 Artigos numerados: ${etapa3Result.artigosNumerados}`);

      // ═══════════════════════════════════════════════════════════════════════════
      // ETAPA 4: VALIDAÇÃO (Gemini verifica e corrige)
      // ═══════════════════════════════════════════════════════════════════════════
      setProgressoGeral(80);
      addLog('───────────────────────────────────────────────────────────');
      addLog('✓ ETAPA 4/4: VALIDAÇÃO FINAL');
      addLog('───────────────────────────────────────────────────────────');

      const { data: dataEtapa4, error: errorEtapa4 } = await supabase.functions.invoke('validar-artigos-gemini', {
        body: { 
          artigos: etapa3Result.artigos,
          textoFormatado: etapa3Result.textoFormatado,
          textoBruto: etapa1Result.textoBruto,
          tableName: decodedTableName
        }
      });

      if (errorEtapa4 || !dataEtapa4?.success) {
        throw new Error(dataEtapa4?.error || 'Falha na validação');
      }

      const etapa4Result: Etapa4Data = {
        validacao: dataEtapa4.validacao || {
          aprovado: true,
          nota: 100,
          problemas: [],
          resumo: 'Validação concluída'
        },
        estatisticas: dataEtapa4.estatisticas || {
          artigosEsperados: etapa3Result.artigosNumerados,
          artigosEncontrados: etapa3Result.artigosNumerados,
          lacunas: [],
          totalLacunas: 0,
          percentualExtracao: 100,
        },
      };

      setEtapa4Data(etapa4Result);
      setEtapaAtual(4);
      setProgressoGeral(100);
      
      const statusEmoji = etapa4Result.validacao.aprovado ? '✅' : '⚠️';
      addLog(`${statusEmoji} Validação: ${etapa4Result.validacao.nota}/100`);
      addLog(`📊 ${etapa4Result.validacao.resumo}`);
      
      if (etapa4Result.validacao.problemas?.length > 0) {
        addLog(`⚠️ Problemas encontrados: ${etapa4Result.validacao.problemas.length}`);
      }

      addLog('═══════════════════════════════════════════════════════════');
      addLog('🎉 FLUXO COMPLETO FINALIZADO!');
      addLog('═══════════════════════════════════════════════════════════');

      toast({ 
        title: 'Processamento concluído!', 
        description: `${etapa3Result.totalArtigos} registros extraídos - Nota: ${etapa4Result.validacao.nota}/100` 
      });

    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha no processamento', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  // Função para extrair artigos do texto formatado (usada pela Etapa 3 se necessário)
  const extrairArtigosDoTexto = (texto: string): Artigo[] => {
    const linhas = texto.split('\n').filter(l => l.trim());
    const artigos: Artigo[] = [];
    let ordem = 1;
    let tituloDescritivo: string | null = null;

    for (let i = 0; i < linhas.length; i++) {
      const trimmed = linhas[i].trim();
      if (!trimmed) continue;

      // Detectar artigo numerado
      const matchArtigo = trimmed.match(/^Art\.?\s*(\d+[A-Z]?[-]?[A-Z]?)[\.\s°º]*/i);
      
      if (matchArtigo) {
        // Se há título descritivo pendente, incluir no conteúdo do artigo
        const conteudoCompleto = tituloDescritivo 
          ? `${tituloDescritivo}\n${trimmed}`
          : trimmed;
        
        artigos.push({
          "Número do Artigo": `Art. ${matchArtigo[1]}`,
          Artigo: conteudoCompleto,
          ordem_artigo: ordem++,
        });
        tituloDescritivo = null; // Resetar
      } else if (trimmed.match(/^(TÍTULO|CAPÍTULO|LIVRO|SEÇÃO|PARTE|SUBSEÇÃO)/i)) {
        // Cabeçalho estrutural (TÍTULO I, CAPÍTULO II, etc.)
        artigos.push({
          "Número do Artigo": trimmed.split(/\s+/).slice(0, 2).join(' '),
          Artigo: trimmed,
          ordem_artigo: ordem++,
        });
        tituloDescritivo = null;
      } else if (
        i + 1 < linhas.length &&
        linhas[i + 1].trim().match(/^Art\.?\s*\d/i) &&
        trimmed.length < 100 &&
        !trimmed.match(/^(§|Parágrafo|[IVXLCDM]+\s*[–-]|[a-z]\))/i)
      ) {
        tituloDescritivo = trimmed;
      } else if (tituloDescritivo === null && !trimmed.match(/^(§|Parágrafo|[IVXLCDM]+\s*[–-]|[a-z]\))/i)) {
        if (trimmed.length < 80 && !trimmed.includes('.') && trimmed.split(' ').length <= 8) {
          tituloDescritivo = trimmed;
        }
      }
    }

    return artigos;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARAÇÃO (após fluxo de 4 etapas) - Usa etapa3Data.artigos
  // ═══════════════════════════════════════════════════════════════════════════

  const executarComparacao = async () => {
    if (!etapa3Data?.artigos) return;

    setProcessando(true);
    setComparacao(null);
    setProgressoGeral(85);
    addLog('───────────────────────────────────────────────────────────');
    addLog('🔄 COMPARANDO VERSÕES...');

    try {
      const { data, error } = await supabase.functions.invoke('comparar-lei', {
        body: {
          tableName: decodedTableName,
          artigosAtuais: artigosAtuais.map((a, i) => ({
            numero: a["Número do Artigo"],
            conteudo: a.Artigo,
            temAudio: !!a.Narração,
            urlAudio: a.Narração,
            ordem: a.ordem_artigo ?? i + 1
          })),
          artigosNovos: etapa3Data.artigos.map((a, i) => ({
            numero: a["Número do Artigo"],
            conteudo: a.Artigo,
            ordem: a.ordem_artigo ?? i + 1
          }))
        }
      });

      setProgressoGeral(100);

      if (error) throw error;
      
      addLog(`✅ Comparação concluída!`);
      addLog(`📊 Novos: ${data.estatisticas.inclusoes}`);
      addLog(`📊 Alterados: ${data.estatisticas.alteracoes}`);
      addLog(`📊 Removidos: ${data.estatisticas.exclusoes}`);
      addLog(`🎵 Áudios a manter: ${data.estatisticas.audiosManter}`);
      
      setComparacao(data);
      toast({ title: 'Comparação concluída!', description: 'Análise de diferenças pronta' });
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({ title: 'Erro', description: 'Falha na comparação', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRMAR ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const confirmarAtualizacao = async () => {
    if (!comparacao || !etapa3Data) return;

    setAtualizando(true);
    try {
      const { data, error } = await supabase.functions.invoke('atualizar-lei-inteligente', {
        body: {
          tableName: decodedTableName,
          artigosNovos: etapa3Data.artigos.map((a, i) => ({
            numero: a["Número do Artigo"],
            conteudo: a.Artigo,
            ordem: a.ordem_artigo ?? i + 1
          })),
          mapeamentoAudios: comparacao.mapeamentoAudios,
          deletarAudiosRemovidos: true
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({ 
          title: 'Atualização concluída!', 
          description: `${data.totalInseridos} artigos. ${data.audiosMantidos} áudios preservados, ${data.audiosRemovidos} removidos.`
        });
        setShowConfirmDialog(false);
        navigate('/admin/raspar-leis');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro na atualização:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar lei', variant: 'destructive' });
    } finally {
      setAtualizando(false);
    }
  };

  const artigosComAudio = artigosAtuais.filter(a => a.Narração).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background pb-4">
      <div className="container mx-auto px-3 py-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/raspar-leis')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              Atualizar Lei
            </h1>
            <p className="text-xs text-muted-foreground">{nomeAmigavel}</p>
          </div>
          {urlEditavel && (
            <a 
              href={urlEditavel} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Ver no Planalto
            </a>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Card className="p-3">
            <div className="text-2xl font-bold text-primary">{artigosAtuais.length}</div>
            <div className="text-xs text-muted-foreground">Artigos Atuais</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-blue-500">{etapa3Data?.artigos?.length || '-'}</div>
            <div className="text-xs text-muted-foreground">Nova Versão</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-amber-500">{artigosComAudio}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Com Áudio
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-green-500">
              {comparacao?.estatisticas.audiosManter ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground">Áudios a Manter</div>
          </Card>
        </div>

        {/* Indicador de 4 Etapas */}
        <div className="flex flex-wrap items-center justify-center gap-1 mb-4 p-3 bg-muted/50 rounded-lg">
          <Badge 
            variant={etapa1Data ? 'default' : etapaAtual === 1 && processando ? 'secondary' : 'outline'}
            className={`transition-all text-xs ${etapa1Data ? 'bg-green-600' : ''}`}
          >
            {etapa1Data ? <CheckCircle2 className="h-3 w-3 mr-1" /> : '1.'} Buscar
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge 
            variant={etapa2Data ? 'default' : etapaAtual === 2 && processando ? 'secondary' : 'outline'}
            className={`transition-all text-xs ${etapa2Data ? 'bg-green-600' : ''}`}
          >
            {etapa2Data ? <CheckCircle2 className="h-3 w-3 mr-1" /> : '2.'} Converter
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge 
            variant={etapa3Data ? 'default' : etapaAtual === 3 && processando ? 'secondary' : 'outline'}
            className={`transition-all text-xs ${etapa3Data ? 'bg-green-600' : ''}`}
          >
            {etapa3Data ? <CheckCircle2 className="h-3 w-3 mr-1" /> : '3.'} Formatar
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge 
            variant={etapa4Data ? 'default' : etapaAtual === 4 && processando ? 'secondary' : 'outline'}
            className={`transition-all text-xs ${etapa4Data ? 'bg-green-600' : ''}`}
          >
            {etapa4Data ? <CheckCircle2 className="h-3 w-3 mr-1" /> : '4.'} Validar
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Left Column - Actions & Preview */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* URL Editável */}
            {!etapa1Data && !processando && (
              <Card className="border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">URL do Planalto</span>
                    {!editandoUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto"
                        onClick={() => setEditandoUrl(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {editandoUrl ? (
                    <div className="space-y-2">
                      <Input
                        value={urlEditavel}
                        onChange={(e) => setUrlEditavel(e.target.value)}
                        placeholder="https://www.planalto.gov.br/..."
                        className="text-xs h-8"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={salvarUrlCustomizada}
                          disabled={salvandoUrl}
                          className="flex-1 h-7 text-xs"
                        >
                          {salvandoUrl ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3 mr-1" />
                          )}
                          {salvandoUrl ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        onClick={() => {
                            setUrlEditavel(urlPlanaltoDefault || '');
                            setEditandoUrl(false);
                          }}
                          className="h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {urlEditavel || urlPlanaltoDefault || 'Nenhuma URL configurada'}
                      </p>
                      {urlEditavel && (
                        <a 
                          href={urlEditavel} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Botão Etapa 1 - Raspar */}
            {!etapa1Data && !processando && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <Download className="h-12 w-12 mx-auto text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      Clique para raspar a versão mais recente da lei do Planalto.
                    </p>
                    <Button 
                      onClick={executarFluxoCompleto}
                      disabled={!urlEditavel && !urlPlanaltoDefault}
                      className="bg-amber-600 hover:bg-amber-700 gap-2"
                      size="lg"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar Processamento (4 Etapas)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {processando && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24">
                      <DotLottieReact 
                        src="https://lottie.host/d67166d6-1f9b-420f-82db-9d91c085006d/iG6u0nCNLc.lottie" 
                        loop 
                        autoplay 
                      />
                    </div>
                    <div className="text-center w-full max-w-md">
                      {/* Barra de Progresso Principal */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-amber-500">
                            {etapaAtual === 1 ? 'Etapa 1/4: Buscando' : 
                             etapaAtual === 2 ? 'Etapa 2/4: Convertendo' : 
                             etapaAtual === 3 ? 'Etapa 3/4: Formatando' : 
                             'Etapa 4/4: Validando'}
                          </span>
                          <span className="text-sm font-bold text-amber-500">
                            {progressoGeral > 0 ? `${progressoGeral}%` : '...'}
                          </span>
                        </div>
                        <Progress 
                          value={progressoGeral || 10} 
                          className="h-3 bg-amber-950/30" 
                        />
                      </div>
                      
                      {/* Detalhes do Progresso */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground mt-2">
                          {etapaAtual === 1 ? 'Extraindo texto do Planalto...' : 
                           etapaAtual === 2 ? 'Convertendo HTML para texto limpo...' : 
                           etapaAtual === 3 ? 'Formatando e organizando artigos...' : 
                           'Validando estrutura e conteúdo...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prévia Etapa 1 */}
            {etapa1Data && !processando && (
              <Card className="border-green-500/30">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Etapa 1: Texto Bruto Raspado
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{etapa1Data.caracteres.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">Caracteres</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{etapa1Data.artigosDetectados}</div>
                      <div className="text-[10px] text-muted-foreground">Artigos Detectados</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{etapa1Data.revogados}</div>
                      <div className="text-[10px] text-muted-foreground">Revogados</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{etapa1Data.vetados}</div>
                      <div className="text-[10px] text-muted-foreground">Vetados</div>
                    </div>
                  </div>

                  {etapa1Data.dataAtualizacao && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Última atualização: {etapa1Data.dataAtualizacao}
                      {etapa1Data.diasAtras !== undefined && (
                        <Badge variant="outline">{etapa1Data.diasAtras} dias atrás</Badge>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Prévia do Texto Bruto */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          Ver prévia do texto bruto
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ScrollArea className="h-[200px] mt-2 border rounded p-2">
                          <pre className="text-xs whitespace-pre-wrap">
                            {etapa1Data.textoBruto.substring(0, 5000)}
                            {etapa1Data.textoBruto.length > 5000 && '\n\n... (texto truncado)'}
                          </pre>
                        </ScrollArea>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Histórico de Alterações */}
                    {etapa1Data.historicoAlteracoes && etapa1Data.historicoAlteracoes.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                            <FileText className="h-3 w-3" />
                            Histórico de Alterações ({etapa1Data.historicoAlteracoes.length})
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ScrollArea className="h-[200px] mt-2 border rounded">
                            <div className="p-2 space-y-1">
                              {etapa1Data.historicoAlteracoes.map((alt, i) => {
                                const anoMatch = alt.match(/\d{4}/);
                                return (
                                  <div key={i} className="flex items-start gap-2 p-1.5 bg-muted/30 rounded text-xs">
                                    {anoMatch && (
                                      <Badge variant="outline" className="shrink-0 text-[10px]">
                                        {anoMatch[0]}
                                      </Badge>
                                    )}
                                    <span className="text-muted-foreground">{alt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>

                  {/* O fluxo agora é automático - não precisa de botão manual */}
                </CardContent>
              </Card>
            )}

            {/* Prévia Etapa 3 - Artigos Formatados */}
            {etapa3Data && !processando && (
              <Card className="border-blue-500/30">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    Resultado: Artigos Formatados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Stats em destaque */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-blue-500">{etapa3Data.artigosNumerados}</div>
                      <div className="text-xs text-muted-foreground">Artigos</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-purple-500">{etapa3Data.cabecalhos}</div>
                      <div className="text-xs text-muted-foreground">Cabeçalhos</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold">{etapa3Data.totalArtigos}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                  
                  {/* Validação */}
                  {etapa4Data && (
                    <div className={`p-3 rounded-lg ${etapa4Data.validacao.aprovado ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Validação: {etapa4Data.validacao.nota}/100</span>
                        <Badge variant={etapa4Data.validacao.aprovado ? 'default' : 'secondary'}>
                          {etapa4Data.validacao.aprovado ? 'Aprovado' : 'Verificar'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{etapa4Data.validacao.resumo}</p>
                    </div>
                  )}

                  {/* Sistema de Abas */}
                  <Tabs defaultValue="formatado" className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <ScrollArea className="w-full sm:w-auto">
                        <TabsList className="h-8 sm:h-9">
                          <TabsTrigger value="bruto" className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3">
                            <FileCode className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Texto</span> Bruto
                          </TabsTrigger>
                          <TabsTrigger value="formatado" className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                            <span className="hidden sm:inline">Texto</span> Formatado
                          </TabsTrigger>
                          <TabsTrigger value="previa" className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3">
                            <Table2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                            Prévia
                          </TabsTrigger>
                        </TabsList>
                      </ScrollArea>
                      {urlEditavel && (
                        <a
                          href={urlEditavel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver original
                        </a>
                      )}
                    </div>

                    {/* Tab: Texto Bruto */}
                    <TabsContent value="bruto">
                      <div className="flex items-center justify-end mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {etapa1Data?.caracteres?.toLocaleString() || 0} caracteres
                        </Badge>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-4 rounded-lg font-mono">
                          {etapa1Data?.textoBruto || ''}
                        </pre>
                      </ScrollArea>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1"
                        onClick={() => {
                          if (etapa1Data?.textoBruto) {
                            navigator.clipboard.writeText(etapa1Data.textoBruto);
                            toast({ title: 'Copiado!', description: 'Texto bruto copiado para a área de transferência' });
                          }
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </Button>
                    </TabsContent>

                    {/* Tab: Texto Formatado (com brasão, cabeçalho oficial, artigos formatados) */}
                    <TabsContent value="formatado">
                      <div className="flex items-center justify-end mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {etapa3Data.artigosNumerados} artigos
                        </Badge>
                      </div>

                      {/* Brasão centralizado */}
                      <div className="flex flex-col items-center mb-6">
                        <img 
                          src={brasaoRepublica} 
                          alt="Brasão da República" 
                          className="h-20 w-auto"
                        />
                        <div className="text-center mt-3 text-[#8B7355] text-sm font-medium">
                          <p>Presidência da República</p>
                          <p>Casa Civil</p>
                          <p>Secretaria Especial para Assuntos Jurídicos</p>
                        </div>
                      </div>

                      {/* Estrutura da Lei */}
                      <div className="space-y-4 text-center">
                        <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                          {nomeAmigavel.toUpperCase()}
                        </h3>
                      </div>

                      {/* Artigos */}
                      <ScrollArea className="h-[400px] mt-6">
                        <div className="space-y-3 text-left">
                          {etapa3Data.artigos
                            .filter(artigo => artigo.Artigo && artigo.Artigo.trim().length > 0)
                            .map((artigo, index) => {
                              const isArtigo = artigo["Número do Artigo"]?.toLowerCase().startsWith('art');
                              const isCabecalho = !isArtigo && (
                                artigo["Número do Artigo"]?.toLowerCase().includes('capítulo') ||
                                artigo["Número do Artigo"]?.toLowerCase().includes('título') ||
                                artigo["Número do Artigo"]?.toLowerCase().includes('livro') ||
                                artigo["Número do Artigo"]?.toLowerCase().includes('seção') ||
                                artigo["Número do Artigo"]?.toLowerCase().includes('parte')
                              );
                              
                              if (isCabecalho) {
                                return (
                                  <div key={index} className="py-4 text-center">
                                    <div className="font-bold text-purple-500 text-sm uppercase">
                                      {artigo["Número do Artigo"]}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {artigo.Artigo.replace(artigo["Número do Artigo"] || '', '').trim()}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={index} className="py-4 last:border-0">
                                  <div className="font-bold text-red-600 text-lg mb-2">
                                    {artigo["Número do Artigo"]}
                                  </div>
                                  <div className="h-px w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent mb-3" />
                                  <div className="text-sm text-foreground whitespace-pre-wrap">
                                    {artigo.Artigo}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    {/* Tab: Prévia (Comparação Novos vs Removidos) */}
                    <TabsContent value="previa">
                      <ScrollArea className="h-[300px] border rounded-lg">
                        <div className="divide-y divide-border">
                          {etapa3Data.artigos.map((art, i) => (
                            <div key={i} className="p-3 hover:bg-muted/30 transition-colors">
                              <Badge variant="default" className="text-[10px] mb-1">
                                {art["Número do Artigo"]}
                              </Badge>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {art.Artigo}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>

                  {!comparacao && (
                    <Button 
                      onClick={executarComparacao}
                      className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                      size="lg"
                    >
                      <GitCompare className="h-4 w-4" />
                      Comparar com Versão Atual
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Artigos Alterados */}
            {comparacao && comparacao.artigosAlterados.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                    Artigos Alterados ({comparacao.artigosAlterados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[400px]">
                    <div className="p-3 space-y-2">
                      {comparacao.artigosAlterados.map((artigo) => {
                        const audioInfo = comparacao.audiosAfetados.find(a => a.artigo === artigo.numero);
                        const isExpanded = artigoExpandido === artigo.numero;
                        
                        return (
                          <Collapsible 
                            key={artigo.numero}
                            open={isExpanded}
                            onOpenChange={() => setArtigoExpandido(isExpanded ? null : artigo.numero)}
                          >
                            <div className="border rounded-lg overflow-hidden">
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0" />
                                  )}
                                  <Badge variant="outline">{artigo.numero}</Badge>
                                  {audioInfo?.tipo === 'atualizar' && (
                                    <Badge variant="destructive" className="text-[10px] gap-1">
                                      <Volume2 className="h-2.5 w-2.5" />
                                      Regravar
                                    </Badge>
                                  )}
                                  <div className="flex-1 text-left">
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {artigo.diferencas.join(' • ')}
                                    </span>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="p-3 space-y-3 border-t">
                                  <div className="grid md:grid-cols-2 gap-3">
                                    {(() => {
                                      const { antes, depois } = renderDiff(artigo.conteudoAntigo, artigo.conteudoNovo);
                                      return (
                                        <>
                                          <div className="bg-red-500/5 border border-red-500/20 rounded p-2">
                                            <p className="text-[10px] font-medium text-red-500 mb-1 flex items-center gap-1">
                                              <XCircle className="h-3 w-3" /> ANTES (removido em vermelho)
                                            </p>
                                            <p className="text-xs whitespace-pre-wrap">
                                              {antes}
                                            </p>
                                          </div>
                                          <div className="bg-green-500/5 border border-green-500/20 rounded p-2">
                                            <p className="text-[10px] font-medium text-green-500 mb-1 flex items-center gap-1">
                                              <CheckCircle2 className="h-3 w-3" /> DEPOIS (adicionado em verde)
                                            </p>
                                            <p className="text-xs whitespace-pre-wrap">
                                              {depois}
                                            </p>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Novos e Removidos */}
            {comparacao && (comparacao.artigosNovos.length > 0 || comparacao.artigosRemovidos.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {comparacao.artigosNovos.length > 0 && (
                  <Card className="border-green-500/30">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Novos ({comparacao.artigosNovos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-[200px]">
                        <div className="p-2 space-y-1">
                          {comparacao.artigosNovos.map((art, i) => (
                            <div key={i} className="p-2 bg-green-500/5 rounded text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{art.numero}</Badge>
                              <p className="line-clamp-2 text-muted-foreground">{art.conteudo}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
                
                {comparacao.artigosRemovidos.length > 0 && (
                  <Card className="border-red-500/30">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        Removidos ({comparacao.artigosRemovidos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-[200px]">
                        <div className="p-2 space-y-1">
                          {comparacao.artigosRemovidos.map((art, i) => (
                            <div key={i} className="p-2 bg-red-500/5 rounded text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{art.numero}</Badge>
                              <p className="line-clamp-2 text-muted-foreground line-through">{art.conteudo}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Logs & Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {/* Logs */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs">Logs do Processo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1 font-mono text-[10px]">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Inicie o processo para ver os logs
                      </p>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="text-muted-foreground">{log}</div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {comparacao && (
              <>
                {/* Botão Ver Comparação */}
                <Button 
                  onClick={() => setShowModalComparacao(true)}
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Eye className="h-5 w-5" />
                  Ver Comparação Detalhada
                </Button>

                {/* Resumo da Análise */}
                <Card className="border-primary/30">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Análise Comparativa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm">{comparacao.resumo}</p>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-500">
                          {comparacao.estatisticas.inclusoes}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Novos</div>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-amber-500">
                          {comparacao.estatisticas.alteracoes}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Alterados</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-red-500">
                          {comparacao.estatisticas.exclusoes}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Removidos</div>
                      </div>
                    </div>

                    {comparacao.analiseDetalhada && (
                      <Collapsible open={showAnaliseDetalhada} onOpenChange={setShowAnaliseDetalhada}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                            Ver análise detalhada
                            {showAnaliseDetalhada ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 p-3 bg-muted/50 rounded text-xs whitespace-pre-wrap">
                            {comparacao.analiseDetalhada}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>

                {/* Áudios Afetados */}
                <Card className="border-amber-500/30">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Impacto nos Áudios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-500/10 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {comparacao.estatisticas.audiosManter}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Manter</div>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded">
                        <div className="text-lg font-bold text-amber-600">
                          {comparacao.estatisticas.audiosRegravar}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Regravar</div>
                      </div>
                      <div className="p-2 bg-red-500/10 rounded">
                        <div className="text-lg font-bold text-red-600">
                          {comparacao.estatisticas.audiosRemover}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Apagar</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botão de Confirmar */}
                <Button 
                  onClick={() => setShowConfirmDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                  size="lg"
                >
                  <Check className="h-4 w-4" />
                  Confirmar Atualização
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  ⚠️ Esta ação irá substituir todos os artigos.
                </p>
              </>
            )}

            {/* Botão de Recomeçar */}
            {(etapa1Data || etapa2Data || comparacao) && !processando && (
              <Button 
                variant="outline" 
                onClick={limparProcesso}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recomeçar Processo
              </Button>
            )}
          </div>
        </div>

        {/* Dialog de Confirmação */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar Atualização
              </DialogTitle>
              <DialogDescription>
                Esta ação irá atualizar a lei com a nova versão raspada.
              </DialogDescription>
            </DialogHeader>

            {comparacao && (
              <div className="space-y-3 py-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded text-center">
                    <div className="font-bold">{artigosAtuais.length}</div>
                    <div className="text-xs text-muted-foreground">Artigos atuais</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <div className="font-bold">{etapa3Data?.artigos.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Novos artigos</div>
                  </div>
                </div>

                <div className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Áudios preservados
                    </span>
                    <Badge variant="secondary">{comparacao.estatisticas.audiosManter}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-amber-600">
                      <RefreshCw className="h-4 w-4" />
                      Precisam regravar
                    </span>
                    <Badge variant="secondary">{comparacao.estatisticas.audiosRegravar}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Serão apagados
                    </span>
                    <Badge variant="destructive">{comparacao.estatisticas.audiosRemover}</Badge>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={atualizando}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmarAtualizacao} 
                disabled={atualizando}
                className="bg-green-600 hover:bg-green-700"
              >
                {atualizando ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Comparação Visual */}
        {comparacao && (
          <ModalComparacaoLei
            open={showModalComparacao}
            onClose={() => setShowModalComparacao(false)}
            comparacao={comparacao}
            nomeLei={nomeAmigavel}
          />
        )}
      </div>
    </div>
  );
}
