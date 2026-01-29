import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Download, Search, RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2, ClipboardPaste, Database, Save, Trash2, Volume2, GitCompare, ArrowRightLeft, Plus, Minus, Edit, Check, X, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { URLS_PLANALTO, getNomeAmigavel } from '@/lib/urlsPlanalto';

// Categorias organizadas
const CATEGORIAS = {
  'Constituição': {
    emoji: '📜',
    cor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    leis: ['CF - Constituição Federal']
  },
  'Códigos Principais': {
    emoji: '⚖️',
    cor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    leis: [
      'CC - Código Civil',
      'CP - Código Penal',
      'CPC – Código de Processo Civil',
      'CPP – Código de Processo Penal',
      'CLT - Consolidação das Leis do Trabalho',
      'CTN – Código Tributário Nacional',
      'CDC – Código de Defesa do Consumidor',
      'CE – Código Eleitoral',
      'CTB Código de Trânsito Brasileiro'
    ]
  },
  'Códigos Militares': {
    emoji: '🎖️',
    cor: 'bg-green-500/20 text-green-600 dark:text-green-400',
    leis: [
      'CPM – Código Penal Militar',
      'CPPM – Código de Processo Penal Militar'
    ]
  },
  'Códigos Especiais': {
    emoji: '📋',
    cor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    leis: [
      'CA - Código de Águas',
      'CBA Código Brasileiro de Aeronáutica',
      'CBT Código Brasileiro de Telecomunicações',
      'CC - Código de Caça',
      'CCOM – Código Comercial',
      'CDM – Código de Minas',
      'CDUS - Código de Defesa do Usuário',
      'CF - Código Florestal',
      'CP - Código de Pesca',
      'CPI - Código de Propriedade Industrial',
      'LLD - Lei de Lavagem de Dinheiro'
    ]
  },
  'Estatutos': {
    emoji: '👥',
    cor: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    leis: [
      'ESTATUTO - CIDADE',
      'ESTATUTO - DESARMAMENTO',
      'ESTATUTO - ECA',
      'ESTATUTO - IDOSO',
      'ESTATUTO - IGUALDADE RACIAL',
      'ESTATUTO - OAB',
      'ESTATUTO - PESSOA COM DEFICIÊNCIA',
      'ESTATUTO - TORCEDOR',
      'EST - Estatuto da Juventude',
      'EST - Estatuto da Metrópole',
      'EST - Estatuto da Migração',
      'EST - Estatuto da MPE',
      'EST - Estatuto da Terra',
      'EST - Estatuto do Desporto',
      'EST - Estatuto do Índio',
      'EST - Estatuto do Refugiado',
      'EST - Estatuto dos Militares',
      'EST - Estatuto Magistério Superior',
      'EST - Estatuto Pessoa com Câncer',
      'EST - Estatuto Segurança Privada'
    ]
  },
  'Leis Penais Especiais': {
    emoji: '🚨',
    cor: 'bg-red-500/20 text-red-600 dark:text-red-400',
    leis: [
      'Lei 11.340 de 2006 - Maria da Penha',
      'Lei 11.343 de 2006 - Lei de Drogas',
      'Lei 12.850 de 2013 - Organizações Criminosas',
      'Lei 13.869 de 2019 - Abuso de Autoridade',
      'Lei 13.964 de 2019 - Pacote Anticrime',
      'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático',
      'Lei 7.210 de 1984 - Lei de Execução Penal',
      'Lei 8.072 de 1990 - Crimes Hediondos',
      'Lei 9.099 de 1995 - Juizados Especiais',
      'Lei 9.296 de 1996 - Interceptação Telefônica',
      'Lei 9.455 de 1997 - Tortura'
    ]
  }
};

interface LeiStatus {
  tableName: string;
  artigos: number;
  status: 'vazia' | 'parcial' | 'completa';
  ultimaAtualizacao?: string;
}

interface ExtracaoProgress {
  etapa: number;
  descricao: string;
  progresso: number;
  chunksProcessados?: number;
  totalChunks?: number;
}

interface RascunhoLei {
  id: string;
  nome_lei: string;
  tabela_destino: string;
  artigos: ArtigoExtraido[];
  total_artigos: number;
  created_at: string;
}

interface LogEntry {
  id: number;
  timestamp: Date;
  tipo: 'info' | 'success' | 'warning' | 'error' | 'progress';
  mensagem: string;
  detalhes?: string;
}

interface ArtigoExtraido {
  numero: string;          // Só o número (1º, 2º) ou vazio para capítulos/seções
  texto: string;           // Texto completo incluindo "Art. 1º -" se for artigo
  ordem: number;
  tipo?: 'cabecalho' | 'artigo' | 'capitulo' | 'secao' | 'subsecao' | 'preambulo' | 'ementa' | 'orgao' | 'identificacao' | 'data' | 'assinatura' | 'aviso' | 'nota';
  audioUrl?: string;       // URL do áudio existente
  excluirAudio?: boolean;  // Flag para marcar exclusão de áudio
}

interface CabecalhoLei {
  orgao: string;           // "Presidência da República\nSecretaria-Geral\nSubchefia para Assuntos Jurídicos"
  identificacao: string;   // "LEI Nº 13.460, DE 26 DE JUNHO DE 2017"
  ementa?: string;
}

const TEMPO_ESTIMADO_ETAPAS = {
  1: { min: 3, max: 8, descricao: 'Raspando HTML do Planalto' },
  2: { min: 15, max: 45, descricao: 'Convertendo HTML para texto (Gemini)' },
  3: { min: 20, max: 60, descricao: 'Formatando texto da lei (Gemini)' },
  4: { min: 10, max: 30, descricao: 'Validando artigos extraídos' },
};

const AtualizarLeiHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [leisStatus, setLeisStatus] = useState<Record<string, LeiStatus>>({});
  const [loading, setLoading] = useState(true);
  const [leiExtraindo, setLeiExtraindo] = useState<string | null>(null);
  const [extracaoProgress, setExtracaoProgress] = useState<ExtracaoProgress | null>(null);
  const [geraPdfLoading, setGeraPdfLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tempoInicio, setTempoInicio] = useState<Date | null>(null);
  const [tempoEtapaInicio, setTempoEtapaInicio] = useState<Date | null>(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [artigosExtraidos, setArtigosExtraidos] = useState<ArtigoExtraido[]>([]);
  const [cabecalhoLei, setCabecalhoLei] = useState<CabecalhoLei | null>(null);
  const [showPrevia, setShowPrevia] = useState(false);
  const [previaLei, setPreviaLei] = useState<string>('');
  const [showTextoBruto, setShowTextoBruto] = useState(false);
  const [textoBruto, setTextoBruto] = useState('');
  const [nomeLeiManual, setNomeLeiManual] = useState('');
  const [populandoTabela, setPopulandoTabela] = useState(false);
  const [audiosExistentes, setAudiosExistentes] = useState<Record<string, string>>({});
  const [showConfirmPopular, setShowConfirmPopular] = useState(false);
  const [leiParaTextoBruto, setLeiParaTextoBruto] = useState<string>('');
  const [rascunhos, setRascunhos] = useState<RascunhoLei[]>([]);
  const [loadingRascunhos, setLoadingRascunhos] = useState(false);
  const [leisAtualizadas, setLeisAtualizadas] = useState<Record<string, boolean>>({});
  const [metodoExtracao, setMetodoExtracao] = useState<'firecrawl' | 'browserless'>('browserless');
  const [textoStreaming, setTextoStreaming] = useState<string>('');
  const [showStreaming, setShowStreaming] = useState(false);
  const [textoBrutoSalvo, setTextoBrutoSalvo] = useState<string>(''); // Para refazer formatação
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'concluidas'>('pendentes'); // Aba de alternância
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  
  // Estados para comparação de leis
  const [showComparacao, setShowComparacao] = useState(false);
  const [comparandoLei, setComparandoLei] = useState(false);
  const [resultadoComparacao, setResultadoComparacao] = useState<{
    artigosNovos: Array<{ numero: string; conteudo: string; ordem?: number }>;
    artigosRemovidos: Array<{ numero: string; conteudo: string }>;
    artigosAlterados: Array<{ numero: string; conteudoAntigo: string; conteudoNovo: string; diferencas: string[] }>;
    audiosAfetados: Array<{ artigo: string; tipo: 'remover' | 'atualizar' | 'manter'; urlAudio?: string; motivo: string }>;
    mapeamentoAudios: Array<{ numeroArtigo: string; acao: 'manter' | 'remover' | 'ignorar'; urlAudio?: string; novaOrdem?: number }>;
    resumo: string;
    analiseDetalhada: string;
    estatisticas: {
      artigosAtuais: number;
      artigosNovos: number;
      inclusoes: number;
      alteracoes: number;
      exclusoes: number;
      audiosAtuais: number;
      audiosManter: number;
      audiosRemover: number;
      audiosRegravar: number;
    };
  } | null>(null);
  const [aplicandoComparacao, setAplicandoComparacao] = useState(false);
  const [validandoComGemini, setValidandoComGemini] = useState(false);

  // Carregar leis atualizadas do localStorage
  useEffect(() => {
    const salvas = localStorage.getItem('leis-atualizadas');
    if (salvas) {
      setLeisAtualizadas(JSON.parse(salvas));
    }
  }, []);

  // Salvar leis atualizadas no localStorage
  const toggleLeiAtualizada = (lei: string) => {
    setLeisAtualizadas(prev => {
      const novo = { ...prev, [lei]: !prev[lei] };
      localStorage.setItem('leis-atualizadas', JSON.stringify(novo));
      return novo;
    });
  };

  // Timer para atualizar tempo decorrido
  useEffect(() => {
    if (!tempoInicio || !leiExtraindo) {
      setTempoDecorrido(0);
      return;
    }
    
    const interval = setInterval(() => {
      setTempoDecorrido((Date.now() - tempoInicio.getTime()) / 1000);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [tempoInicio, leiExtraindo]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (tipo: LogEntry['tipo'], mensagem: string, detalhes?: string) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date(),
      tipo,
      mensagem,
      detalhes
    }]);
  };

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${Math.round(segundos)}s`;
    const mins = Math.floor(segundos / 60);
    const secs = Math.round(segundos % 60);
    return `${mins}m ${secs}s`;
  };

  // Normalizar texto - trocar "1o" por "1º", etc.
  const normalizarOrdinal = (texto: string): string => {
    // Trocar padrões como "1o", "2o", "Art. 1o" por "1º", "2º", "Art. 1º"
    return texto
      .replace(/(\d+)o(?=\s|\.|\,|\)|$)/g, '$1º')
      .replace(/(\d+)O(?=\s|\.|\,|\)|$)/g, '$1º')
      .replace(/§\s*(\d+)o/g, '§ $1º')
      .replace(/Art\.?\s*(\d+)o/gi, 'Art. $1º');
  };

  // Função para processar streaming com suporte a chunks
  const processarStreamingComChunks = async (
    textoBruto: string,
    tableName: string,
    onProgress: (texto: string, chunkAtual?: number, totalChunks?: number) => void,
    addLogFn: (tipo: LogEntry['tipo'], mensagem: string, detalhes?: string) => void
  ): Promise<string> => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-streaming`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };

    // Primeira chamada para verificar se precisa chunking
    const initialResponse = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ textoBruto, tableName })
    });

    if (!initialResponse.ok) {
      const errorData = await initialResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro no streaming: ${initialResponse.status}`);
    }

    // Verificar o content-type para saber se é JSON (precisa chunking) ou stream
    const contentType = initialResponse.headers.get('content-type') || '';
    
    // Se for stream (text/event-stream), processar diretamente
    if (contentType.includes('text/event-stream')) {
      return await processarStreamResponse(initialResponse, (texto) => onProgress(texto));
    }
    
    // É JSON - pode ser chunking, texto formatado direto ou erro
    const jsonData = await initialResponse.json();
    
    if (jsonData.needsChunking && jsonData.chunks) {
      addLogFn('info', `📦 Texto grande detectado, dividindo em ${jsonData.chunks.length} partes`);
      
      let textoCompleto = '';
      
      for (let i = 0; i < jsonData.chunks.length; i++) {
        addLogFn('progress', `🔄 Processando parte ${i + 1}/${jsonData.chunks.length}...`);
        onProgress(textoCompleto, i + 1, jsonData.chunks.length);
        
        // Processar cada chunk
        const chunkResponse = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            textoBruto: jsonData.chunks[i],
            tableName,
            chunkIndex: i,
            totalChunks: jsonData.chunks.length
          })
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro no chunk ${i + 1}: ${chunkResponse.status}`);
        }

        // Processar stream do chunk
        const chunkTexto = await processarStreamResponse(chunkResponse, (texto) => {
          onProgress(textoCompleto + texto, i + 1, jsonData.chunks.length);
        });
        
        textoCompleto += chunkTexto;
        addLogFn('success', `✅ Parte ${i + 1}/${jsonData.chunks.length} concluída`, `${chunkTexto.length} caracteres`);
      }
      
      return textoCompleto;
    }
    
    // Se o JSON tem texto formatado direto, retornar
    if (jsonData.textoFormatado) {
      onProgress(jsonData.textoFormatado);
      return jsonData.textoFormatado;
    }
    
    // Se tem erro no JSON, lançar
    if (jsonData.error) {
      throw new Error(jsonData.error);
    }
    
    throw new Error('Resposta inesperada da API');
  };

  // Função auxiliar para processar response de stream
  const processarStreamResponse = async (
    response: Response,
    onChunk: (textoAcumulado: string) => void
  ): Promise<string> => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let textoAcumulado = '';
    let textBuffer = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            textoAcumulado += content;
            onChunk(textoAcumulado);
          }
        } catch {
          // JSON incompleto, continuar
        }
      }
    }
    
    return textoAcumulado;
  };

  // Processar texto formatado pela Gemini para extrair artigos
  const processarTextoFormatado = (texto: string): ArtigoExtraido[] => {
    const linhas = texto.split('\n');
    const artigos: ArtigoExtraido[] = [];
    let ordem = 1;
    let artigoAtual: ArtigoExtraido | null = null;
    
    for (const linha of linhas) {
      const linhaLimpa = normalizarOrdinal(linha.trim());
      if (!linhaLimpa) continue;
      
      // Detectar tipo pelo prefixo [TIPO]:
      if (linhaLimpa.startsWith('[INSTITUICAO]:')) {
        // Salvar artigo anterior se existir
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace('[INSTITUICAO]:', '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'identificacao' });
      } else if (linhaLimpa.startsWith('[CABECALHO]:')) {
        // Salvar artigo anterior se existir
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace('[CABECALHO]:', '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'identificacao' });
      } else if (linhaLimpa.startsWith('[EMENTA]:')) {
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace('[EMENTA]:', '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'ementa' });
      } else if (linhaLimpa.startsWith('[TITULO]:') || linhaLimpa.startsWith('[CAPITULO]:') || linhaLimpa.startsWith('[SECAO]:')) {
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace(/\[(TITULO|CAPITULO|SECAO)\]:/, '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'capitulo' });
      } else if (linhaLimpa.startsWith('[ARTIGO]:')) {
        // Salvar artigo anterior se existir
        if (artigoAtual) {
          artigos.push(artigoAtual);
        }
        const conteudo = linhaLimpa.replace('[ARTIGO]:', '').trim();
        // Extrair número do artigo (com ou sem letra: Art. 10, Art. 10-A, Art. 5º)
        const match = conteudo.match(/^Art\.?\s*(\d+)(?:-?([A-Z]))?/i);
        let numero = '';
        if (match) {
          const num = parseInt(match[1], 10);
          const letra = match[2] ? `-${match[2].toUpperCase()}` : '';
          // 1-9 com º, 10+ sem º
          numero = num < 10 ? `${num}º${letra}` : `${num}${letra}`;
        }
        artigoAtual = { numero, texto: conteudo, ordem: ordem++, tipo: 'artigo' };
      } else if (linhaLimpa.startsWith('[PARAGRAFO]:')) {
        // Concatenar ao artigo atual
        const conteudo = linhaLimpa.replace('[PARAGRAFO]:', '').trim();
        if (artigoAtual) {
          artigoAtual.texto += '\n\n' + conteudo;
        }
      } else if (linhaLimpa.startsWith('[INCISO]:')) {
        // Concatenar ao artigo atual com quebra dupla
        const conteudo = linhaLimpa.replace('[INCISO]:', '').trim();
        if (artigoAtual) {
          artigoAtual.texto += '\n\n' + conteudo;
        }
      } else if (linhaLimpa.startsWith('[ALINEA]:')) {
        // Concatenar ao artigo atual com quebra dupla
        const conteudo = linhaLimpa.replace('[ALINEA]:', '').trim();
        if (artigoAtual) {
          artigoAtual.texto += '\n\n' + conteudo;
        }
      } else if (linhaLimpa.startsWith('[ASSINATURA]:')) {
        // Salvar artigo anterior se existir
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace('[ASSINATURA]:', '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'assinatura' as any });
      } else if (linhaLimpa.startsWith('[NOTA]:')) {
        if (artigoAtual) {
          artigos.push(artigoAtual);
          artigoAtual = null;
        }
        const conteudo = linhaLimpa.replace('[NOTA]:', '').trim();
        artigos.push({ numero: '', texto: conteudo, ordem: ordem++, tipo: 'nota' as any });
      }
      // Ignorar linhas sem prefixo válido
    }
    
    // Salvar último artigo se existir
    if (artigoAtual) {
      artigos.push(artigoAtual);
    }
    
    return artigos;
  };

  const getTempoDecorridoFormatado = () => {
    return formatarTempo(tempoDecorrido);
  };

  const calcularTempoEstimado = (etapa: number) => {
    const info = TEMPO_ESTIMADO_ETAPAS[etapa as keyof typeof TEMPO_ESTIMADO_ETAPAS];
    if (!info) return 'calculando...';
    return `${info.min}-${info.max}s`;
  };

  // Carregar status de todas as leis e rascunhos
  useEffect(() => {
    carregarStatusLeis();
    carregarRascunhos();
  }, []);

  // Carregar rascunhos do Supabase
  const carregarRascunhos = async () => {
    setLoadingRascunhos(true);
    try {
      const { data, error } = await supabase
        .from('rascunhos_leis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // Cast os dados para o tipo correto
        const rascunhosFormatados: RascunhoLei[] = data.map((r: any) => ({
          id: r.id,
          nome_lei: r.nome_lei,
          tabela_destino: r.tabela_destino,
          artigos: r.artigos as ArtigoExtraido[],
          total_artigos: r.total_artigos,
          created_at: r.created_at,
        }));
        setRascunhos(rascunhosFormatados);
      }
    } catch (e) {
      console.error('Erro ao carregar rascunhos:', e);
    } finally {
      setLoadingRascunhos(false);
    }
  };

  // Salvar rascunho no Supabase
  const salvarRascunhoSupabase = async (nomeLei: string, tabelaDestino: string, artigos: ArtigoExtraido[]) => {
    try {
      // Verificar se já existe rascunho para esta tabela
      const { data: existente } = await supabase
        .from('rascunhos_leis')
        .select('id')
        .eq('tabela_destino', tabelaDestino)
        .maybeSingle();

      if (existente) {
        // Atualizar rascunho existente
        const { error } = await supabase
          .from('rascunhos_leis')
          .update({
            nome_lei: nomeLei,
            artigos: JSON.parse(JSON.stringify(artigos)),
            total_artigos: artigos.filter(a => a.tipo === 'artigo').length,
          })
          .eq('id', existente.id);
        
        if (error) throw error;
        toast.success('Rascunho atualizado no banco de dados');
      } else {
        // Criar novo rascunho
        const { error } = await supabase
          .from('rascunhos_leis')
          .insert([{
            nome_lei: nomeLei,
            tabela_destino: tabelaDestino,
            artigos: JSON.parse(JSON.stringify(artigos)),
            total_artigos: artigos.filter(a => a.tipo === 'artigo').length,
          }]);
        
        if (error) throw error;
        toast.success('Rascunho salvo no banco de dados');
      }

      // Recarregar rascunhos
      await carregarRascunhos();
    } catch (e: any) {
      console.error('Erro ao salvar rascunho:', e);
      toast.error('Erro ao salvar rascunho: ' + e.message);
    }
  };

  // Excluir rascunho
  const excluirRascunho = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rascunhos_leis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Rascunho excluído');
      await carregarRascunhos();
    } catch (e: any) {
      console.error('Erro ao excluir rascunho:', e);
      toast.error('Erro ao excluir: ' + e.message);
    }
  };

  // Carregar rascunho para prévia
  const carregarRascunhoParaPrevia = (rascunho: RascunhoLei) => {
    setArtigosExtraidos(rascunho.artigos);
    setCabecalhoLei(null);
    setPreviaLei(rascunho.tabela_destino);
    setShowPrevia(true);
    toast.success('Rascunho carregado');
  };

  const carregarStatusLeis = async () => {
    setLoading(true);
    const statusMap: Record<string, LeiStatus> = {};

    // Para cada lei no URLS_PLANALTO, verificar status
    for (const tableName of Object.keys(URLS_PLANALTO)) {
      try {
        // Buscar contagem e última atualização
        const { data, count, error } = await supabase
          .from(tableName as any)
          .select('ultima_atualizacao', { count: 'exact' })
          .order('ultima_atualizacao', { ascending: false })
          .limit(1);

        if (!error) {
          const qtd = count || 0;
          const dataArr = data as any[];
          const ultimaAtualizacao = dataArr?.[0]?.ultima_atualizacao || null;
          statusMap[tableName] = {
            tableName,
            artigos: qtd,
            status: qtd === 0 ? 'vazia' : 'completa',
            ultimaAtualizacao
          };
        } else {
          statusMap[tableName] = {
            tableName,
            artigos: 0,
            status: 'vazia'
          };
        }
      } catch {
        statusMap[tableName] = {
          tableName,
          artigos: 0,
          status: 'vazia'
        };
      }
    }

    setLeisStatus(statusMap);
    setLoading(false);
  };

  const abrirPlanalto = (url: string) => {
    window.open(url, '_blank');
  };

  const iniciarExtracao = async (tableName: string) => {
    const url = URLS_PLANALTO[tableName];
    if (!url) {
      toast.error('URL do Planalto não encontrada para esta lei');
      return;
    }

    // Reset logs e iniciar timer
    setLogs([]);
    const inicio = new Date();
    setTempoInicio(inicio);
    setLeiExtraindo(tableName);
    
    addLog('info', '🚀 Iniciando extração', `Lei: ${tableName}`);
    addLog('info', '🔗 URL do Planalto', url);
    
    try {
      // ========== ETAPA 1: Raspar HTML bruto ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 1, descricao: `Raspando HTML do Planalto (${metodoExtracao === 'browserless' ? 'Browserless' : 'Firecrawl'})...`, progresso: 5 });
      addLog('progress', '📡 ETAPA 1/4: Raspando HTML do Planalto', `Tempo estimado: ${calcularTempoEstimado(1)}`);
      addLog('info', `Usando método: ${metodoExtracao === 'browserless' ? '🌐 Browserless (Puppeteer)' : '🔥 Firecrawl'}`);
      
      let etapa1: any;
      
      if (metodoExtracao === 'browserless') {
        // Usar Browserless com Puppeteer + Gemini Streaming
        const { data, error } = await supabase.functions.invoke('raspar-planalto-browserless', {
          body: { urlPlanalto: url, tableName }
        });
        
        if (error || !data?.success) {
          addLog('error', '❌ Erro na raspagem Browserless', data?.error || 'Erro desconhecido');
          throw new Error(data?.error || 'Erro na etapa 1 (Browserless)');
        }
        
        // Exibir metadados extraídos
        if (data.metadados?.titulo) {
          addLog('info', `📜 Título: ${data.metadados.titulo}`);
        }
        if (data.estatisticas) {
          addLog('info', `📊 Estrutura: ${data.estatisticas.livros} livros, ${data.estatisticas.titulos} títulos, ${data.estatisticas.capitulos} capítulos`);
          addLog('info', `📄 Artigos detectados: ${data.estatisticas.artigos}`);
        }
        
        const tempoEtapa1 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
        addLog('success', '✅ Raspagem concluída', `${data.totalCaracteres?.toLocaleString() || 0} caracteres em ${formatarTempo(tempoEtapa1)}`);
        
        // Salvar texto bruto para poder refazer formatação
        setTextoBrutoSalvo(data.textoCompleto);
        
        // ========== ETAPA 2: Formatar com Gemini em Streaming ==========
        setTempoEtapaInicio(new Date());
        setExtracaoProgress({ etapa: 2, descricao: 'Formatando com IA (streaming)...', progresso: 30 });
        addLog('progress', '🤖 ETAPA 2/2: Formatando lei com Gemini (streaming)', 'Acompanhe em tempo real');
        
        // Iniciar streaming
        setTextoStreaming('');
        setShowStreaming(true);
        
        try {
          const textoAcumulado = await processarStreamingComChunks(
            data.textoCompleto,
            tableName,
            (texto, chunkAtual, totalChunks) => {
              setTextoStreaming(texto);
              if (chunkAtual && totalChunks) {
                setExtracaoProgress({ 
                  etapa: 2, 
                  descricao: `Formatando parte ${chunkAtual}/${totalChunks}...`, 
                  progresso: 30 + (chunkAtual / totalChunks) * 60,
                  chunksProcessados: chunkAtual,
                  totalChunks
                });
              }
            },
            addLog
          );

          addLog('success', '✅ Formatação concluída', `${textoAcumulado.length} caracteres`);
          
          // Processar texto formatado para extrair artigos
          const artigos = processarTextoFormatado(textoAcumulado);
          addLog('info', `📊 Artigos extraídos: ${artigos.length}`);
          
          // Salvar artigos
          if (artigos.length > 0) {
            setCabecalhoLei(null);
            setArtigosExtraidos(artigos);
            setPreviaLei(tableName);
            
            await salvarRascunhoSupabase(getNomeAmigavel(tableName), tableName, artigos);
            addLog('success', '💾 Rascunho salvo automaticamente');
          }
          
          // Conclusão
          const tempoTotal = (Date.now() - inicio.getTime()) / 1000;
          setExtracaoProgress({ etapa: 2, descricao: 'Concluído!', progresso: 100 });
          addLog('success', '🎉 EXTRAÇÃO FINALIZADA!', `${artigos.length} artigos em ${formatarTempo(tempoTotal)}`);
          
          toast.success(`Extração concluída! ${artigos.length} artigos`);
          
          await carregarStatusLeis();
          
          setTimeout(() => {
            setShowStreaming(false);
            setShowPrevia(true);
            setLeiExtraindo(null);
            setExtracaoProgress(null);
            setTempoInicio(null);
          }, 2000);
          
          return; // Sair da função, já finalizou
          
        } catch (streamError: any) {
          addLog('error', '❌ Erro no streaming', streamError.message);
          setShowStreaming(false);
          throw streamError;
        }
      } else {
        // Usar Firecrawl (método original)
        addLog('info', 'Conectando ao Firecrawl API...');
        const { data, error } = await supabase.functions.invoke('raspar-planalto-bruto', {
          body: { urlPlanalto: url, tableName }
        });

        if (error || !data?.success) {
          addLog('error', '❌ Erro na raspagem', data?.error || 'Erro desconhecido');
          throw new Error(data?.error || 'Erro na etapa 1');
        }
        
        etapa1 = data;
      }

      const tempoEtapa1 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      addLog('success', '✅ Raspagem concluída', `${etapa1.caracteres?.toLocaleString() || 0} caracteres em ${formatarTempo(tempoEtapa1)}`);
      addLog('info', `📊 Artigos detectados: ${etapa1.artigosDetectados || 0}`);
      if (etapa1.usouHtml !== undefined) {
        addLog('info', `📄 Formato: ${etapa1.usouHtml ? 'HTML (tabelas detectadas)' : 'Markdown'}`);
      }
      if (etapa1.dataAtualizacao) {
        addLog('info', `📅 Data de atualização: ${etapa1.dataAtualizacao}`);
      }
      
      // Verificar se a raspagem retornou conteúdo suficiente
      const caracteresMinimos = 1000;
      if ((etapa1.caracteres || 0) < caracteresMinimos) {
        addLog('error', '❌ Raspagem insuficiente', `Apenas ${etapa1.caracteres || 0} caracteres (mínimo: ${caracteresMinimos})`);
        addLog('warning', '⚠️ O site do Planalto pode estar bloqueando a raspagem ou houve problema temporário');
        throw new Error(`Raspagem insuficiente: apenas ${etapa1.caracteres || 0} caracteres retornados. Tente novamente ou use "Colar texto bruto".`);
      }
      
      setExtracaoProgress({ etapa: 1, descricao: 'Raspagem concluída!', progresso: 20 });

      // ========== ETAPA 2: Converter HTML para texto ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 2, descricao: 'Convertendo HTML para texto...', progresso: 25 });
      addLog('progress', '🔄 ETAPA 2/4: Convertendo HTML para texto', `Tempo estimado: ${calcularTempoEstimado(2)}`);
      addLog('info', 'Enviando conteúdo para Gemini...');
      const tamanhoConteudo = etapa1.htmlBruto?.length || etapa1.textoBruto?.length || 0;
      const chunksEstimados = Math.ceil(tamanhoConteudo / 50000);
      addLog('info', `Tamanho do conteúdo: ${tamanhoConteudo.toLocaleString()} caracteres`);
      if (chunksEstimados > 1) {
        addLog('info', `📦 Será dividido em ~${chunksEstimados} chunks para processamento`);
      }
      
      const { data: etapa2, error: error2 } = await supabase.functions.invoke('converter-html-texto', {
        body: { htmlBruto: etapa1.htmlBruto || etapa1.textoBruto }
      });

      if (error2 || !etapa2?.success) {
        addLog('error', '❌ Erro na conversão', etapa2?.error || 'Erro desconhecido');
        throw new Error(etapa2?.error || 'Erro na etapa 2');
      }

      const tempoEtapa2 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      addLog('success', '✅ Conversão concluída', `${etapa2.textoLimpo?.length?.toLocaleString() || 0} caracteres em ${formatarTempo(tempoEtapa2)}`);
      if (etapa2.estatisticas) {
        addLog('info', `📊 Estatísticas: ${etapa2.estatisticas.artigosDetectados || 0} artigos detectados`);
        if (etapa2.estatisticas.chunksProcessados > 1) {
          addLog('info', `📦 Chunks processados: ${etapa2.estatisticas.chunksProcessados}/${etapa2.estatisticas.totalChunks}`);
        }
      }
      setExtracaoProgress({ etapa: 2, descricao: 'Conversão concluída!', progresso: 45 });

      // ========== ETAPA 3: Formatar texto da lei ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 3, descricao: 'Formatando texto da lei...', progresso: 50 });
      addLog('progress', '📝 ETAPA 3/4: Formatando texto da lei', `Tempo estimado: ${calcularTempoEstimado(3)}`);
      addLog('info', 'Limpando referências legislativas...');
      addLog('info', 'Removendo duplicatas e organizando estrutura...');
      
      const { data: etapa3, error: error3 } = await supabase.functions.invoke('formatar-texto-lei', {
        body: { textoLimpo: etapa2.textoLimpo, textoBrutoOriginal: etapa1.textoBruto }
      });

      if (error3 || !etapa3?.success) {
        addLog('error', '❌ Erro na formatação', etapa3?.error || 'Erro desconhecido');
        throw new Error(etapa3?.error || 'Erro na etapa 3');
      }

      const tempoEtapa3 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      addLog('success', '✅ Formatação concluída', `${etapa3.artigos?.length || 0} artigos extraídos em ${formatarTempo(tempoEtapa3)}`);
      if (etapa3.estatisticas) {
        addLog('info', `📊 Estrutura: ${etapa3.estatisticas.cabecalhos || 0} cabeçalhos, ${etapa3.estatisticas.artigosNumerados || 0} artigos`);
      }
      
      // NOVO: Verificar discrepância entre artigos detectados e extraídos
      if (etapa3.estatisticas?.avisoDiscrepancia) {
        addLog('warning', '⚠️ Possível truncamento detectado', etapa3.estatisticas.avisoDiscrepancia);
      } else if (etapa3.estatisticas?.artigosDetectadosOriginal && etapa3.estatisticas?.artigosNumerados) {
        const detectados = etapa3.estatisticas.artigosDetectadosOriginal;
        const extraidos = etapa3.estatisticas.artigosNumerados;
        if (detectados > extraidos) {
          addLog('info', `📋 Artigos: ${extraidos} extraídos de ${detectados} detectados no texto original`);
        }
      }
      
      setExtracaoProgress({ etapa: 3, descricao: 'Formatação concluída!', progresso: 75 });

      // ========== ETAPA 4: Validar artigos com Gemini (apenas se houver artigos) ==========
      if (etapa3.artigos && etapa3.artigos.length > 0) {
        setTempoEtapaInicio(new Date());
        setExtracaoProgress({ etapa: 4, descricao: 'Validando artigos extraídos...', progresso: 80 });
        addLog('progress', '✔️ ETAPA 4/4: Validando artigos extraídos', `Tempo estimado: ${calcularTempoEstimado(4)}`);
        addLog('info', `Validando sequência de ${etapa3.artigos?.length || 0} artigos...`);
        
        const { data: etapa4, error: error4 } = await supabase.functions.invoke('validar-artigos-gemini', {
          body: { 
            artigos: etapa3.artigos,
            textoOriginal: etapa3.textoFormatado,
            tableName 
          }
        });

        const tempoEtapa4 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
        
        if (error4) {
          addLog('warning', '⚠️ Aviso na validação', error4.message || 'Verifique os logs');
        } else {
          addLog('success', '✅ Validação concluída', `em ${formatarTempo(tempoEtapa4)}`);
        }
      } else {
        addLog('warning', '⚠️ ETAPA 4/4: Pulada - nenhum artigo para validar');
        addLog('error', '❌ Nenhum artigo foi extraído. Verifique o texto bruto.');
      }

      // ========== CONCLUSÃO ==========
      const tempoTotal = (Date.now() - inicio.getTime()) / 1000;
      setExtracaoProgress({ etapa: 4, descricao: 'Extração concluída!', progresso: 100 });
      
      addLog('success', '🎉 EXTRAÇÃO FINALIZADA COM SUCESSO!', '');
      addLog('info', `📊 Total de artigos: ${etapa3.artigos?.length || 0}`);
      addLog('info', `⏱️ Tempo total: ${formatarTempo(tempoTotal)}`);

      // Salvar artigos para prévia - todos os itens vão para a tabela
      if (etapa3.artigos && etapa3.artigos.length > 0) {
        const artigosFormatados: ArtigoExtraido[] = etapa3.artigos.map((a: any, idx: number) => {
          const tipoItem = a.tipo || 'artigo';
          const ehArtigoNumerado = tipoItem === 'artigo' && a.numero;
          
          // Coluna A: só o número para artigos (1°, 2°), vazio para outros
          let numeroSimples = '';
          if (ehArtigoNumerado) {
            const match = a.numero.match(/(\d+)[°º]?/);
            if (match) {
              numeroSimples = match[1] + '°';
            }
          }
          
          return {
            numero: numeroSimples,
            texto: (a.texto || a.conteudo || '').trim(),
            ordem: a.ordem || idx + 1,
            tipo: tipoItem
          };
        });
        
        // Não usamos mais cabeçalho separado - tudo vai na tabela
        setCabecalhoLei(null);
        setArtigosExtraidos(artigosFormatados);
        setPreviaLei(tableName);
        
        // Salvar automaticamente como rascunho no Supabase
        await salvarRascunhoSupabase(getNomeAmigavel(tableName), tableName, artigosFormatados);
        addLog('success', '💾 Rascunho salvo automaticamente no banco de dados');
        addLog('info', '📋 Prévia da tabela disponível - clique para visualizar');
      }

      toast.success(`Extração concluída! ${etapa3.artigos?.length || 0} artigos em ${formatarTempo(tempoTotal)}`);
      
      // Recarregar status
      await carregarStatusLeis();

      // Mostrar prévia após 2 segundos
      setTimeout(() => {
        setShowPrevia(true);
        setLeiExtraindo(null);
        setExtracaoProgress(null);
        setTempoInicio(null);
        setTempoEtapaInicio(null);
      }, 2000);

    } catch (error: any) {
      console.error('Erro na extração:', error);
      addLog('error', '💥 ERRO NA EXTRAÇÃO', error.message);
      toast.error(`Erro: ${error.message}`);
      setLeiExtraindo(null);
      setExtracaoProgress(null);
      setTempoInicio(null);
      setTempoEtapaInicio(null);
    }
  };

  // Formatar texto bruto diretamente com Gemini
  const formatarTextoBruto = async () => {
    if (!textoBruto.trim()) {
      toast.error('Cole o texto da lei para formatar');
      return;
    }

    if (!nomeLeiManual.trim()) {
      toast.error('Informe um nome para identificar a lei');
      return;
    }

    setShowTextoBruto(false);
    
    // Reset logs e iniciar timer
    setLogs([]);
    const inicio = new Date();
    setTempoInicio(inicio);
    setLeiExtraindo(nomeLeiManual);
    
    addLog('info', '🚀 Iniciando formatação de texto bruto', `Lei: ${nomeLeiManual}`);
    addLog('info', `📄 Texto recebido: ${textoBruto.length.toLocaleString()} caracteres`);
    
    try {
      // ========== ETAPA 1: Skip (não precisa raspar) ==========
      setExtracaoProgress({ etapa: 1, descricao: 'Texto bruto recebido...', progresso: 20 });
      addLog('success', '✅ ETAPA 1/4: Texto bruto recebido', 'Pulando raspagem');

      // ========== ETAPA 2: Converter para texto limpo ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 2, descricao: 'Convertendo texto...', progresso: 30 });
      addLog('progress', '🔄 ETAPA 2/4: Convertendo texto', `Tempo estimado: ${calcularTempoEstimado(2)}`);
      
      const chunksEstimados = Math.ceil(textoBruto.length / 50000);
      if (chunksEstimados > 1) {
        addLog('info', `📦 Será dividido em ~${chunksEstimados} chunks para processamento`);
      }
      
      const { data: etapa2, error: error2 } = await supabase.functions.invoke('converter-html-texto', {
        body: { htmlBruto: textoBruto }
      });

      if (error2 || !etapa2?.success) {
        addLog('error', '❌ Erro na conversão', etapa2?.error || 'Erro desconhecido');
        throw new Error(etapa2?.error || 'Erro na etapa 2');
      }

      const tempoEtapa2 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      addLog('success', '✅ Conversão concluída', `${etapa2.textoLimpo?.length?.toLocaleString() || 0} caracteres em ${formatarTempo(tempoEtapa2)}`);
      if (etapa2.estatisticas?.chunksProcessados > 1) {
        addLog('info', `📦 Chunks processados: ${etapa2.estatisticas.chunksProcessados}/${etapa2.estatisticas.totalChunks}`);
      }
      setExtracaoProgress({ etapa: 2, descricao: 'Conversão concluída!', progresso: 50 });

      // ========== ETAPA 3: Formatar texto da lei ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 3, descricao: 'Formatando texto da lei...', progresso: 55 });
      addLog('progress', '📝 ETAPA 3/4: Formatando texto da lei', `Tempo estimado: ${calcularTempoEstimado(3)}`);
      
      const { data: etapa3, error: error3 } = await supabase.functions.invoke('formatar-texto-lei', {
        body: { textoLimpo: etapa2.textoLimpo, textoBrutoOriginal: textoBruto }
      });

      if (error3 || !etapa3?.success) {
        addLog('error', '❌ Erro na formatação', etapa3?.error || 'Erro desconhecido');
        throw new Error(etapa3?.error || 'Erro na etapa 3');
      }

      const tempoEtapa3 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      addLog('success', '✅ Formatação concluída', `${etapa3.artigos?.length || 0} artigos extraídos em ${formatarTempo(tempoEtapa3)}`);
      
      // NOVO: Verificar discrepância entre artigos detectados e extraídos
      if (etapa3.estatisticas?.avisoDiscrepancia) {
        addLog('warning', '⚠️ Possível truncamento detectado', etapa3.estatisticas.avisoDiscrepancia);
      } else if (etapa3.estatisticas?.artigosDetectadosOriginal && etapa3.estatisticas?.artigosNumerados) {
        const detectados = etapa3.estatisticas.artigosDetectadosOriginal;
        const extraidos = etapa3.estatisticas.artigosNumerados;
        if (detectados > extraidos) {
          addLog('info', `📋 Artigos: ${extraidos} extraídos de ${detectados} detectados no texto original`);
        }
      }
      
      setExtracaoProgress({ etapa: 3, descricao: 'Formatação concluída!', progresso: 80 });

      // ========== ETAPA 4: Validar ==========
      setTempoEtapaInicio(new Date());
      setExtracaoProgress({ etapa: 4, descricao: 'Validando artigos...', progresso: 85 });
      addLog('progress', '✔️ ETAPA 4/4: Validando artigos', `Tempo estimado: ${calcularTempoEstimado(4)}`);
      
      const { data: etapa4, error: error4 } = await supabase.functions.invoke('validar-artigos-gemini', {
        body: { 
          artigos: etapa3.artigos,
          textoOriginal: etapa3.textoFormatado,
          tableName: nomeLeiManual
        }
      });

      const tempoEtapa4 = ((Date.now() - (tempoEtapaInicio?.getTime() || Date.now())) / 1000);
      
      if (error4) {
        addLog('warning', '⚠️ Aviso na validação', error4.message || 'Verifique os logs');
      } else {
        addLog('success', '✅ Validação concluída', `em ${formatarTempo(tempoEtapa4)}`);
      }

      // ========== CONCLUSÃO ==========
      const tempoTotal = (Date.now() - inicio.getTime()) / 1000;
      setExtracaoProgress({ etapa: 4, descricao: 'Formatação concluída!', progresso: 100 });
      
      addLog('success', '🎉 FORMATAÇÃO FINALIZADA COM SUCESSO!', '');
      addLog('info', `📊 Total de artigos: ${etapa3.artigos?.length || 0}`);
      addLog('info', `⏱️ Tempo total: ${formatarTempo(tempoTotal)}`);

      // Salvar artigos para prévia
      if (etapa3.artigos && etapa3.artigos.length > 0) {
        const artigosFormatados: ArtigoExtraido[] = etapa3.artigos.map((a: any, idx: number) => {
          const tipoItem = a.tipo || 'artigo';
          const ehArtigoNumerado = tipoItem === 'artigo' && a.numero;
          
          let numeroSimples = '';
          if (ehArtigoNumerado) {
            const match = a.numero.match(/(\d+)[°º]?/);
            if (match) {
              numeroSimples = match[1] + '°';
            }
          }
          
          return {
            numero: numeroSimples,
            texto: (a.texto || a.conteudo || '').trim(),
            ordem: a.ordem || idx + 1,
            tipo: tipoItem
          };
        });
        
        setCabecalhoLei(null);
        setArtigosExtraidos(artigosFormatados);
        setPreviaLei(nomeLeiManual);
        
        // Salvar automaticamente como rascunho no Supabase
        await salvarRascunhoSupabase(getNomeAmigavel(nomeLeiManual), nomeLeiManual, artigosFormatados);
        addLog('success', '💾 Rascunho salvo automaticamente no banco de dados');
        addLog('info', '📋 Prévia da tabela disponível - clique para visualizar');
      }

      toast.success(`Formatação concluída! ${etapa3.artigos?.length || 0} artigos em ${formatarTempo(tempoTotal)}`);

      // Limpar campos
      setTextoBruto('');

      // Mostrar prévia após 2 segundos
      setTimeout(() => {
        setShowPrevia(true);
        setLeiExtraindo(null);
        setExtracaoProgress(null);
        setTempoInicio(null);
        setTempoEtapaInicio(null);
      }, 2000);

    } catch (error: any) {
      console.error('Erro na formatação:', error);
      addLog('error', '💥 ERRO NA FORMATAÇÃO', error.message);
      toast.error(`Erro: ${error.message}`);
      setLeiExtraindo(null);
      setExtracaoProgress(null);
      setTempoInicio(null);
      setTempoEtapaInicio(null);
    }
  };

  const gerarPDF = async (tableName: string) => {
    setGeraPdfLoading(tableName);
    
    try {
      // Buscar todos os artigos da lei
      const { data: artigos, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('ordem_artigo', { ascending: true });

      if (error) throw error;

      if (!artigos || artigos.length === 0) {
        toast.error('Nenhum artigo encontrado para gerar PDF');
        return;
      }

      // Criar PDF

      // Criar PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margemEsquerda = 30;
      const margemDireita = 20;
      const margemSuperior = 25;
      const margemInferior = 25;
      const larguraUtil = 210 - margemEsquerda - margemDireita;
      let yPos = margemSuperior;
      let pagina = 1;

      // Título
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      const titulo = getNomeAmigavel(tableName);
      doc.text(titulo, 105, yPos, { align: 'center' });
      yPos += 15;

      // Data de geração
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // Linha separadora
      doc.setLineWidth(0.5);
      doc.line(margemEsquerda, yPos, 210 - margemDireita, yPos);
      yPos += 10;

      // Artigos
      doc.setFontSize(11);
      
      // Cast para any para evitar erros de tipo
      const artigosList = artigos as any[];
      
      for (const artigo of artigosList) {
        const texto = artigo.Artigo || artigo.artigo || '';
        const numero = artigo['Número do Artigo'] || artigo.numero_artigo || '';
        
        if (!texto) continue;

        // Verificar se precisa de nova página
        if (yPos > 297 - margemInferior - 20) {
          // Número da página
          doc.setFontSize(10);
          doc.text(`${pagina}`, 105, 290, { align: 'center' });
          
          doc.addPage();
          pagina++;
          yPos = margemSuperior;
        }

        // Número do artigo em negrito
        if (numero) {
          doc.setFont('times', 'bold');
          doc.text(numero, margemEsquerda, yPos);
          yPos += 5;
        }

        // Texto do artigo
        doc.setFont('times', 'normal');
        const linhas = doc.splitTextToSize(texto, larguraUtil);
        
        for (const linha of linhas) {
          if (yPos > 297 - margemInferior) {
            doc.setFontSize(10);
            doc.text(`${pagina}`, 105, 290, { align: 'center' });
            
            doc.addPage();
            pagina++;
            yPos = margemSuperior;
            doc.setFontSize(11);
          }
          doc.text(linha, margemEsquerda, yPos);
          yPos += 5;
        }
        
        yPos += 5; // Espaço entre artigos
      }

      // Última página
      doc.setFontSize(10);
      doc.text(`${pagina}`, 105, 290, { align: 'center' });

      // Download
      const nomeArquivo = tableName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${nomeArquivo}.pdf`);
      
      toast.success('PDF gerado com sucesso!');

    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      setGeraPdfLoading(null);
    }
  };

  // Buscar áudios existentes na tabela antes de popular
  const buscarAudiosExistentes = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('"Número do Artigo", "Narração"')
        .not('Narração', 'is', null);

      if (error) {
        console.error('Erro ao buscar áudios:', error);
        return {};
      }

      const audios: Record<string, string> = {};
      (data || []).forEach((item: any) => {
        const numArtigo = item['Número do Artigo'] || '';
        const audioUrl = item['Narração'] || '';
        if (numArtigo && audioUrl) {
          // Extrai só o número do artigo para usar como chave
          const match = numArtigo.match(/(\d+)[°º]?/);
          if (match) {
            audios[match[1]] = audioUrl;
          }
        }
      });

      return audios;
    } catch (error) {
      console.error('Erro ao buscar áudios:', error);
      return {};
    }
  };

  // Preparar para popular tabela - busca áudios existentes primeiro
  const prepararPopularTabela = async () => {
    if (!previaLei) return;
    
    setPopulandoTabela(true);
    toast.info('Buscando áudios existentes...');
    
    try {
      const audios = await buscarAudiosExistentes(previaLei);
      setAudiosExistentes(audios);
      
      // Vincular áudios aos artigos extraídos
      const artigosComAudio = artigosExtraidos.map(artigo => {
        if (artigo.tipo === 'artigo' && artigo.numero) {
          const numMatch = artigo.numero.match(/(\d+)/);
          if (numMatch && audios[numMatch[1]]) {
            return { ...artigo, audioUrl: audios[numMatch[1]], excluirAudio: false };
          }
        }
        return artigo;
      });
      
      setArtigosExtraidos(artigosComAudio);
      setShowConfirmPopular(true);
      
      const qtdAudios = Object.keys(audios).length;
      if (qtdAudios > 0) {
        toast.success(`${qtdAudios} áudios encontrados na tabela existente`);
      } else {
        toast.info('Nenhum áudio existente encontrado');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao buscar áudios existentes');
    } finally {
      setPopulandoTabela(false);
    }
  };

  // Toggle excluir áudio
  const toggleExcluirAudio = (ordem: number) => {
    setArtigosExtraidos(prev => 
      prev.map(a => a.ordem === ordem ? { ...a, excluirAudio: !a.excluirAudio } : a)
    );
  };

  // Popular tabela de fato
  const executarPopularTabela = async () => {
    if (!previaLei || artigosExtraidos.length === 0) return;
    
    setPopulandoTabela(true);
    setShowConfirmPopular(false);
    
    try {
      // Preparar artigos para inserção - apenas artigos (não cabeçalhos)
      const artigosParaInserir = artigosExtraidos
        .filter(a => a.tipo === 'artigo')
        .map(artigo => {
          const audioUrl = artigo.excluirAudio ? null : artigo.audioUrl;
          return {
            numero: artigo.numero.replace('°', ''),
            texto: artigo.texto,
            audioUrl
          };
        });

      // Primeiro limpar a tabela existente
      const { error: deleteError } = await supabase
        .from(previaLei as any)
        .delete()
        .neq('id', 0); // Deleta todos

      if (deleteError) {
        console.error('Erro ao limpar tabela:', deleteError);
        // Continua mesmo com erro (tabela pode estar vazia)
      }

      // Inserir novos artigos
      const { data, error } = await supabase.functions.invoke('popular-tabela-lei', {
        body: { 
          tabela: previaLei, 
          artigos: artigosParaInserir 
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao popular tabela');
      }

      toast.success(`Tabela atualizada com ${data.inseridos} artigos!`);
      
      // Excluir rascunho correspondente (se existir)
      const rascunhoCorrespondente = rascunhos.find(r => r.tabela_destino === previaLei);
      if (rascunhoCorrespondente) {
        const { error: deleteRascunhoError } = await supabase
          .from('rascunhos_leis')
          .delete()
          .eq('id', rascunhoCorrespondente.id);
        
        if (!deleteRascunhoError) {
          toast.success('Rascunho removido automaticamente');
        }
      }
      
      // Recarregar status e rascunhos
      await Promise.all([carregarStatusLeis(), carregarRascunhos()]);
      
      // Fechar modal
      setShowPrevia(false);
      
    } catch (error: any) {
      console.error('Erro ao popular tabela:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setPopulandoTabela(false);
    }
  };

  // Guardar prévia no localStorage
  const guardarPrevia = () => {
    if (!previaLei || artigosExtraidos.length === 0) return;
    
    const previewKey = `lei_previa_${previaLei}`;
    const dataToSave = {
      lei: previaLei,
      artigos: artigosExtraidos,
      cabecalho: cabecalhoLei,
      dataGuardada: new Date().toISOString()
    };
    
    localStorage.setItem(previewKey, JSON.stringify(dataToSave));
    toast.success('Prévia guardada com sucesso!');
  };

  // Refazer formatação com Gemini (usar texto bruto salvo)
  const refazerFormatacao = async () => {
    if (!textoBrutoSalvo || !previaLei) {
      toast.error('Nenhum texto bruto disponível para refazer');
      return;
    }

    setShowPrevia(false);
    setTextoStreaming('');
    setShowStreaming(true);
    addLog('progress', '🔄 Refazendo formatação com Gemini...');

    try {
      const textoAcumulado = await processarStreamingComChunks(
        textoBrutoSalvo,
        previaLei,
        (texto, chunkAtual, totalChunks) => {
          setTextoStreaming(texto);
          if (chunkAtual && totalChunks) {
            addLog('progress', `🔄 Processando parte ${chunkAtual}/${totalChunks}...`);
          }
        },
        addLog
      );

      addLog('success', '✅ Reformatação concluída', `${textoAcumulado.length} caracteres`);
      
      const artigos = processarTextoFormatado(textoAcumulado);
      addLog('info', `📊 Artigos extraídos: ${artigos.length}`);
      
      if (artigos.length > 0) {
        setCabecalhoLei(null);
        setArtigosExtraidos(artigos);
        await salvarRascunhoSupabase(getNomeAmigavel(previaLei), previaLei, artigos);
        addLog('success', '💾 Rascunho atualizado');
      }

      toast.success(`Reformatação concluída! ${artigos.length} artigos`);
      
      setTimeout(() => {
        setShowStreaming(false);
        setShowPrevia(true);
      }, 1500);

    } catch (error: any) {
      addLog('error', '❌ Erro na reformatação', error.message);
      toast.error(`Erro: ${error.message}`);
      setShowStreaming(false);
    }
  };

  // Validar e completar com Gemini (revisar formatação e preencher lacunas)
  const validarComGemini = async () => {
    if (!textoBrutoSalvo || !previaLei || artigosExtraidos.length === 0) {
      toast.error('Nenhum texto bruto disponível para validar');
      return;
    }

    setValidandoComGemini(true);
    addLog('progress', '🔍 Validando formatação com Gemini...');

    try {
      // Buscar ementa do texto bruto se não existir nos artigos
      const ementaExistente = artigosExtraidos.find(a => a.tipo === 'ementa');
      
      // Montar prompt para Gemini validar e completar
      const artigosTexto = artigosExtraidos
        .filter(a => a.tipo === 'artigo')
        .map(a => `${a.numero}: ${a.texto.substring(0, 200)}...`)
        .slice(0, 10)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('validar-formatacao-gemini', {
        body: {
          textoBruto: textoBrutoSalvo,
          artigosExtraidos: artigosExtraidos.map(a => ({
            numero: a.numero,
            texto: a.texto,
            tipo: a.tipo,
            ordem: a.ordem
          })),
          temEmenta: !!ementaExistente,
          tableName: previaLei
        }
      });

      if (error) throw error;

      if (data.artigos && data.artigos.length > 0) {
        setArtigosExtraidos(data.artigos);
        addLog('success', `✅ Validação concluída: ${data.artigos.length} elementos`);
        
        if (data.ementaAdicionada) {
          addLog('info', '📋 Ementa recuperada do texto bruto');
        }
        if (data.artigosCorrigidos > 0) {
          addLog('info', `🔧 ${data.artigosCorrigidos} artigos corrigidos`);
        }

        await salvarRascunhoSupabase(getNomeAmigavel(previaLei), previaLei, data.artigos);
        toast.success(`Validação concluída! ${data.mensagem || ''}`);
      } else {
        addLog('info', '✓ Formatação já está correta');
        toast.info('Formatação já está correta, nenhuma alteração necessária');
      }

    } catch (error: any) {
      addLog('error', '❌ Erro na validação', error.message);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setValidandoComGemini(false);
    }
  };

  // Comparar lei extraída com a lei existente no banco
  const compararLei = async () => {
    if (!previaLei || artigosExtraidos.length === 0) {
      toast.error('Nenhuma lei extraída para comparar');
      return;
    }

    setComparandoLei(true);
    setResultadoComparacao(null);
    
    try {
      // Buscar artigos atuais da tabela
      const { data: artigosAtuais, error: fetchError } = await supabase
        .from(previaLei as any)
        .select('*')
        .order('ordem_artigo', { ascending: true });

      if (fetchError) {
        throw new Error(`Erro ao buscar artigos atuais: ${fetchError.message}`);
      }

      // Formatar artigos atuais para comparação
      const artigosAtuaisFormatados = (artigosAtuais || []).map((a: any, idx: number) => ({
        numero: a['Número do Artigo'] || a.numero_artigo || `Art. ${idx + 1}`,
        conteudo: a.Artigo || a.artigo || '',
        temAudio: !!(a.Narração || a.narracao),
        urlAudio: a.Narração || a.narracao || undefined,
        ordem: a.ordem_artigo || idx + 1
      }));

      // Formatar artigos novos (extraídos)
      const artigosNovosFormatados = artigosExtraidos
        .filter(a => a.tipo === 'artigo')
        .map((a, idx) => ({
          numero: a.numero ? `Art. ${a.numero}` : `Art. ${idx + 1}`,
          conteudo: a.texto,
          ordem: a.ordem || idx + 1
        }));

      if (artigosAtuaisFormatados.length === 0) {
        toast.info('Tabela vazia - todos os artigos serão novos');
        // Se a tabela está vazia, não precisa comparar
        setResultadoComparacao({
          artigosNovos: artigosNovosFormatados,
          artigosRemovidos: [],
          artigosAlterados: [],
          audiosAfetados: [],
          mapeamentoAudios: [],
          resumo: `A tabela está vazia. Serão inseridos ${artigosNovosFormatados.length} artigos novos.`,
          analiseDetalhada: 'Como a tabela não possui artigos, todos os artigos extraídos serão inseridos como novos.',
          estatisticas: {
            artigosAtuais: 0,
            artigosNovos: artigosNovosFormatados.length,
            inclusoes: artigosNovosFormatados.length,
            alteracoes: 0,
            exclusoes: 0,
            audiosAtuais: 0,
            audiosManter: 0,
            audiosRemover: 0,
            audiosRegravar: 0
          }
        });
        setShowComparacao(true);
        return;
      }

      // Chamar edge function de comparação
      const { data: resultado, error: compareError } = await supabase.functions.invoke('comparar-lei', {
        body: {
          tableName: previaLei,
          artigosAtuais: artigosAtuaisFormatados,
          artigosNovos: artigosNovosFormatados
        }
      });

      if (compareError) {
        throw new Error(`Erro na comparação: ${compareError.message}`);
      }

      setResultadoComparacao(resultado);
      setShowComparacao(true);
      toast.success('Comparação concluída!');
      
    } catch (error: any) {
      console.error('Erro na comparação:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setComparandoLei(false);
    }
  };

  // Aplicar mudanças após comparação
  const aplicarMudancasComparacao = async () => {
    if (!previaLei || !resultadoComparacao) {
      toast.error('Nenhum resultado de comparação para aplicar');
      return;
    }

    setAplicandoComparacao(true);
    
    try {
      // Preparar artigos para inserção
      const artigosParaInserir = artigosExtraidos.map((a, idx) => {
        // Verificar se tem áudio para manter
        const mapeamento = resultadoComparacao.mapeamentoAudios.find(m => {
          const numMatch = a.numero?.match(/(\d+)/);
          const mapeamentoMatch = m.numeroArtigo.match(/(\d+)/);
          return numMatch && mapeamentoMatch && numMatch[1] === mapeamentoMatch[1];
        });

        return {
          numero: a.texto,  // Texto completo vai na coluna Artigo
          audioUrl: mapeamento?.acao === 'manter' ? mapeamento.urlAudio : undefined
        };
      });

      // Chamar edge function de atualização inteligente
      const { data, error } = await supabase.functions.invoke('atualizar-lei-inteligente', {
        body: {
          tableName: previaLei,
          artigosNovos: artigosParaInserir.map((a, idx) => ({
            numero: artigosExtraidos[idx].numero || '',
            conteudo: artigosExtraidos[idx].texto,
            ordem: artigosExtraidos[idx].ordem || idx + 1
          })),
          mapeamentoAudios: resultadoComparacao.mapeamentoAudios,
          deletarAudiosRemovidos: true
        }
      });

      if (error) {
        throw new Error(`Erro ao aplicar mudanças: ${error.message}`);
      }

      toast.success(`Atualização concluída! ${data?.estatisticas?.artigosInseridos || 0} artigos atualizados, ${data?.estatisticas?.audiosMantidos || 0} áudios preservados.`);
      
      // Fechar modais e recarregar
      setShowComparacao(false);
      setShowPrevia(false);
      setResultadoComparacao(null);
      await carregarStatusLeis();
      
    } catch (error: any) {
      console.error('Erro ao aplicar mudanças:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setAplicandoComparacao(false);
    }
  };

  // Carregar prévia salva
  const carregarPreviaSalva = (tableName: string) => {
    const previewKey = `lei_previa_${tableName}`;
    const saved = localStorage.getItem(previewKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setArtigosExtraidos(parsed.artigos || []);
        setCabecalhoLei(parsed.cabecalho || null);
        setPreviaLei(tableName);
        setShowPrevia(true);
        toast.success('Prévia carregada do cache');
        return true;
      } catch (e) {
        console.error('Erro ao carregar prévia:', e);
      }
    }
    return false;
  };

  // Verificar se existe prévia salva
  const temPreviaSalva = (tableName: string) => {
    const previewKey = `lei_previa_${tableName}`;
    return !!localStorage.getItem(previewKey);
  };

  // Filtrar leis baseado na busca e aba ativa
  const filtrarCategoria = (leis: string[]) => {
    let resultado = leis;
    
    // Filtrar por aba ativa (pendentes/concluídas)
    if (abaAtiva === 'pendentes') {
      resultado = resultado.filter(lei => !leisAtualizadas[lei]);
    } else {
      resultado = resultado.filter(lei => leisAtualizadas[lei]);
    }
    
    // Filtrar por busca
    if (searchTerm) {
      resultado = resultado.filter(lei => 
        lei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getNomeAmigavel(lei).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return resultado;
  };

  const renderStatusBadge = (status: LeiStatus | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Sem dados</Badge>;
    }

    switch (status.status) {
      case 'completa':
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />{status.artigos} artigos</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-0"><AlertCircle className="w-3 h-3 mr-1" />{status.artigos} artigos</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Vazia</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Atualizar Leis</h1>
              <p className="text-sm text-muted-foreground">Central de extração e download de legislação</p>
            </div>
          </div>

          {/* Barra de busca e Seletor de Método */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lei..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Seletor de Método de Extração */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button
                variant={metodoExtracao === 'firecrawl' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetodoExtracao('firecrawl')}
                className="gap-1.5"
              >
                <Zap className="h-4 w-4" />
                Firecrawl
              </Button>
              <Button
                variant={metodoExtracao === 'browserless' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetodoExtracao('browserless')}
                className="gap-1.5"
              >
                <Globe className="h-4 w-4" />
                Browserless
              </Button>
            </div>
            
            {/* Tabs Pendentes/Concluídas */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button
                variant={abaAtiva === 'pendentes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAbaAtiva('pendentes')}
                className="gap-1.5"
              >
                <Clock className="h-4 w-4" />
                Pendentes
                <Badge variant="secondary" className="ml-1 text-xs">
                  {Object.values(CATEGORIAS).flatMap(c => c.leis).filter(lei => !leisAtualizadas[lei]).length}
                </Badge>
              </Button>
              <Button
                variant={abaAtiva === 'concluidas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAbaAtiva('concluidas')}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluídas
                <Badge variant="secondary" className="ml-1 text-xs">
                  {Object.values(CATEGORIAS).flatMap(c => c.leis).filter(lei => leisAtualizadas[lei]).length}
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="container mx-auto px-4 py-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando status das leis...</span>
            </div>
          ) : (
            <>
              {/* Seção de Rascunhos Salvos - só mostra na aba Pendentes */}
              {abaAtiva === 'pendentes' && rascunhos.length > 0 && (
                <Card className="overflow-hidden border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardHeader className="bg-primary/10 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Save className="h-5 w-5 text-primary" />
                      Rascunhos Salvos
                      <Badge variant="secondary" className="ml-auto">{rascunhos.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {rascunhos.map((rascunho) => (
                        <div 
                          key={rascunho.id} 
                          className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{rascunho.nome_lei}</h3>
                              <Badge className="bg-primary/20 text-primary border-0 text-[10px]">
                                Rascunho
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{rascunho.total_artigos} artigos</span>
                              <span>•</span>
                              <span>Salvo em {new Date(rascunho.created_at).toLocaleDateString('pt-BR')} às {new Date(rascunho.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => carregarRascunhoParaPrevia(rascunho)}
                              title="Ver prévia e popular tabela"
                              className="border-primary/50 hover:bg-primary/10"
                            >
                              <Database className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Popular Tabela</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => excluirRascunho(rascunho.id)}
                              title="Excluir rascunho"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categorias de leis */}
              {Object.entries(CATEGORIAS).map(([categoria, config]) => {
                const leisFiltradas = filtrarCategoria(config.leis);
                if (leisFiltradas.length === 0) return null;

              return (
                <Card key={categoria} className="overflow-hidden">
                  <CardHeader className={`${config.cor} border-b`}>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span>{config.emoji}</span>
                      {categoria}
                      <Badge variant="secondary" className="ml-auto">{leisFiltradas.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {leisFiltradas.map((lei) => {
                        const url = URLS_PLANALTO[lei];
                        const status = leisStatus[lei];
                        const isExtraindo = leiExtraindo === lei;
                        const isGeraPdf = geraPdfLoading === lei;

                        return (
                          <div 
                            key={lei} 
                            className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                          >
                            {/* Info da lei */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{lei}</h3>
                                {status?.ultimaAtualizacao && (
                                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-0 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {new Date(status.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStatusBadge(status)}
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Link Planalto */}
                              {url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirPlanalto(url)}
                                  title="Abrir no Planalto"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Colar texto bruto */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLeiParaTextoBruto(lei);
                                  setNomeLeiManual(lei);
                                  setShowTextoBruto(true);
                                }}
                                title="Colar texto bruto para esta lei"
                              >
                                <ClipboardPaste className="h-4 w-4" />
                              </Button>

                              {/* Extrair texto */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => iniciarExtracao(lei)}
                                disabled={isExtraindo || !url}
                                title="Extrair texto do Planalto"
                              >
                                {isExtraindo ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <span className="ml-1 hidden sm:inline">Extrair</span>
                              </Button>

                              {/* Checkbox de lei atualizada */}
                              <div className="flex items-center gap-1.5" title="Marcar como atualizada">
                                <Checkbox
                                  id={`check-${lei}`}
                                  checked={leisAtualizadas[lei] || false}
                                  onCheckedChange={() => toggleLeiAtualizada(lei)}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                              </div>

                              {/* Baixar PDF */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => gerarPDF(lei)}
                                disabled={isGeraPdf || (status?.artigos || 0) === 0}
                                title="Baixar PDF para leitura"
                              >
                                {isGeraPdf ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                <span className="ml-1 hidden sm:inline">PDF</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              
              {/* Mensagem quando não há leis na aba selecionada */}
              {Object.entries(CATEGORIAS).every(([_, config]) => filtrarCategoria(config.leis).length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  {abaAtiva === 'concluidas' ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">Nenhuma lei concluída</h3>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Marque o checkbox ao lado de cada lei para movê-la para esta aba
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500/30 mb-4" />
                      <h3 className="text-lg font-medium text-green-600">Todas as leis foram concluídas!</h3>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Parabéns! Todas as leis foram atualizadas.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modal de progresso de extração com logs */}
      <Dialog open={!!leiExtraindo} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-primary ${extracaoProgress?.progresso !== 100 ? 'animate-spin' : ''}`} />
                Extraindo Lei
              </div>
              {tempoInicio && (
                <Badge variant="outline" className="font-mono">
                  ⏱️ {getTempoDecorridoFormatado()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{leiExtraindo}</div>
              {leiExtraindo && URLS_PLANALTO[leiExtraindo] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(URLS_PLANALTO[leiExtraindo!], '_blank')}
                  className="text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Ver no Planalto
                </Button>
              )}
            </div>
            {extracaoProgress && (
              <>
                {/* Barra de progresso */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso geral</span>
                    <span>{extracaoProgress.progresso}%</span>
                  </div>
                  <Progress value={extracaoProgress.progresso} className="h-2" />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-primary">Etapa {extracaoProgress.etapa}/4:</span>
                  <span className="text-muted-foreground">{extracaoProgress.descricao}</span>
                </div>

                {/* Indicadores de etapas */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((etapa) => (
                    <div key={etapa} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          etapa < extracaoProgress.etapa
                            ? 'bg-green-500'
                            : etapa === extracaoProgress.etapa
                            ? 'bg-primary animate-pulse'
                            : 'bg-muted'
                        }`}
                      />
                      <div className="text-[10px] text-muted-foreground text-center">
                        {etapa === 1 && 'Raspar'}
                        {etapa === 2 && 'Converter'}
                        {etapa === 3 && 'Formatar'}
                        {etapa === 4 && 'Validar'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Logs em tempo real */}
                <div className="flex-1 min-h-0">
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Logs em tempo real
                  </div>
                  <ScrollArea className="h-[250px] border rounded-lg bg-muted/30">
                    <div className="p-3 space-y-1 font-mono text-xs">
                      {logs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`flex gap-2 ${
                            log.tipo === 'error' ? 'text-red-500' :
                            log.tipo === 'warning' ? 'text-yellow-500' :
                            log.tipo === 'success' ? 'text-green-500' :
                            log.tipo === 'progress' ? 'text-primary font-semibold' :
                            'text-muted-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground/60 shrink-0">
                            [{log.timestamp.toLocaleTimeString('pt-BR')}]
                          </span>
                          <span className="break-all">
                            {log.mensagem}
                            {log.detalhes && (
                              <span className="text-muted-foreground ml-1">
                                — {log.detalhes}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de prévia dos artigos extraídos */}
      <Dialog open={showPrevia} onOpenChange={setShowPrevia}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Prévia dos Artigos Extraídos
              </div>
              <Badge variant="secondary">
                {artigosExtraidos.filter(a => a.tipo === 'artigo').length} artigos
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-sm text-muted-foreground mb-2">
            Lei: <span className="font-medium text-foreground">{getNomeAmigavel(previaLei)}</span>
          </div>

          {/* Cabeçalho institucional e Ementa em destaque */}
          {(() => {
            const orgaoItem = artigosExtraidos.find(a => a.tipo === 'orgao');
            const ementaItem = artigosExtraidos.find(a => a.tipo === 'ementa');
            const identificacaoItem = artigosExtraidos.find(a => a.tipo === 'identificacao');
            
            if (orgaoItem || ementaItem || identificacaoItem) {
              return (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                  {orgaoItem && (
                    <div className="text-xs text-muted-foreground text-center mb-2 whitespace-pre-line">
                      {orgaoItem.texto}
                    </div>
                  )}
                  {identificacaoItem && (
                    <div className="font-bold text-primary text-sm mb-1 uppercase text-center">
                      {identificacaoItem.texto}
                    </div>
                  )}
                  {ementaItem && (
                    <div className="text-sm italic text-muted-foreground leading-relaxed">
                      {ementaItem.texto}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Ementa não encontrada. Use o botão "Validar com Gemini" para recuperar do texto bruto.
                </div>
              </div>
            );
          })()}

          {/* Tabela de artigos - inclui cabeçalho, artigos, data e assinaturas */}
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[50px_1fr_60px] gap-3 font-medium text-sm">
              <div>Nº</div>
              <div>Conteúdo</div>
              <div className="text-center">Áudio</div>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {artigosExtraidos.map((artigo, idx) => {
                  const tipo = artigo.tipo || 'artigo';
                  const ehCabecalho = ['orgao', 'identificacao', 'ementa', 'preambulo', 'cabecalho'].includes(tipo);
                  const ehCapituloSecao = ['capitulo', 'secao', 'subsecao'].includes(tipo);
                  const ehDataAssinatura = ['data', 'assinatura'].includes(tipo);
                  const ehAviso = tipo === 'aviso';
                  const ehNota = tipo === 'nota';
                  const temAudio = !!artigo.audioUrl;
                  
                  // Verificar se é texto institucional (Presidência, Secretaria, etc.)
                  const ehInstitucional = tipo === 'identificacao' && 
                    (artigo.texto.includes('Presidência') || 
                     artigo.texto.includes('Secretaria') || 
                     artigo.texto.includes('Subchefia'));
                  
                  return (
                    <div 
                      key={`${artigo.ordem}-${idx}`}
                      className={`px-3 py-2 grid grid-cols-[50px_1fr_60px] gap-3 hover:bg-muted/30 transition-colors ${
                        ehCabecalho ? 'bg-muted/10' : 
                        ehCapituloSecao ? 'bg-muted/20' : 
                        ehDataAssinatura ? 'bg-amber-500/5' :
                        ehNota ? 'bg-red-500/10' :
                        ehAviso ? 'bg-red-500/10' : ''
                      }`}
                    >
                      <div className="font-medium text-primary text-sm">
                        {artigo.numero}
                      </div>
                      <div className={`text-sm leading-relaxed whitespace-pre-line ${
                        ehInstitucional ? 'font-bold uppercase text-amber-500' :
                        tipo === 'identificacao' ? 'font-bold uppercase text-primary' :
                        tipo === 'ementa' ? 'italic text-muted-foreground' :
                        tipo === 'orgao' ? 'text-muted-foreground text-xs' :
                        tipo === 'preambulo' ? 'text-muted-foreground' :
                        ehCapituloSecao ? 'font-semibold uppercase' : 
                        ehDataAssinatura ? 'text-amber-500 font-medium' :
                        ehNota ? 'text-red-500 italic text-xs' :
                        ehAviso ? 'text-red-500 italic text-xs' :
                        'text-foreground'
                      }`}>
                        {artigo.texto.length > 800 
                          ? artigo.texto.substring(0, 800) + '...' 
                          : artigo.texto}
                      </div>
                      <div className="flex items-center justify-center">
                        {temAudio && (
                          <div className="flex items-center gap-1">
                            <Volume2 className={`h-4 w-4 ${artigo.excluirAudio ? 'text-muted-foreground line-through' : 'text-green-500'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={guardarPrevia} title="Guardar esta prévia para uso futuro">
                <Save className="h-4 w-4 mr-2" />
                Guardar Prévia
              </Button>
              {textoBrutoSalvo && (
                <Button 
                  variant="outline" 
                  onClick={refazerFormatacao} 
                  title="Refazer formatação com IA"
                  className="border-amber-500/50 hover:bg-amber-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refazer
                </Button>
              )}
              {textoBrutoSalvo && (
                <Button 
                  variant="outline" 
                  onClick={validarComGemini}
                  disabled={validandoComGemini}
                  title="Validar formatação e completar lacunas com Gemini"
                  className="border-purple-500/50 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                >
                  {validandoComGemini ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Validar com Gemini
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowPrevia(false)}>
                Fechar
              </Button>
              <Button variant="outline" onClick={() => {
                setShowPrevia(false);
                gerarPDF(previaLei);
              }}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline"
                onClick={compararLei}
                disabled={comparandoLei}
                className="border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                title="Comparar com a versão atual na tabela"
              >
                {comparandoLei ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GitCompare className="h-4 w-4 mr-2" />
                )}
                Comparar
              </Button>
              <Button 
                onClick={prepararPopularTabela}
                disabled={populandoTabela}
                className="bg-green-600 hover:bg-green-700"
              >
                {populandoTabela ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Popular Tabela
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para popular tabela */}
      <Dialog open={showConfirmPopular} onOpenChange={setShowConfirmPopular}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Confirmar Popular Tabela
            </DialogTitle>
            <DialogDescription>
              Revise os áudios existentes antes de popular a tabela. Os áudios marcados serão mantidos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex-1 overflow-hidden">
            <div className="text-sm mb-4">
              <span className="font-medium">Lei:</span> {getNomeAmigavel(previaLei)}
              <br />
              <span className="font-medium">Artigos a inserir:</span> {artigosExtraidos.filter(a => a.tipo === 'artigo').length}
              <br />
              <span className="font-medium">Áudios existentes:</span> {Object.keys(audiosExistentes).length}
            </div>

            {/* Lista de artigos com áudio */}
            {artigosExtraidos.some(a => a.audioUrl) && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 border-b px-4 py-2 text-sm font-medium">
                  Artigos com Áudio
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="divide-y">
                    {artigosExtraidos.filter(a => a.audioUrl).map((artigo, idx) => (
                      <div key={idx} className="px-4 py-2 flex items-center justify-between hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!artigo.excluirAudio}
                            onCheckedChange={() => toggleExcluirAudio(artigo.ordem)}
                          />
                          <span className="font-medium text-primary">Art. {artigo.numero}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {artigo.texto.substring(0, 60)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {artigo.excluirAudio ? (
                            <Badge variant="outline" className="text-red-500 border-red-500">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-600 border-0">
                              <Volume2 className="h-3 w-3 mr-1" />
                              Manter
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {!artigosExtraidos.some(a => a.audioUrl) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum áudio existente para preservar
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmPopular(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={executarPopularTabela}
              disabled={populandoTabela}
              className="bg-primary"
            >
              {populandoTabela ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Confirmar e Popular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para colar texto bruto */}
      <Dialog open={showTextoBruto} onOpenChange={(open) => {
        setShowTextoBruto(open);
        if (!open) {
          setLeiParaTextoBruto('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-primary" />
              Formatar Texto Bruto
              {leiParaTextoBruto && (
                <Badge variant="secondary" className="ml-2">{leiParaTextoBruto}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Cole o texto da lei copiado do Planalto ou de outra fonte. A IA vai formatar automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-hidden">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Lei (tabela de destino)</label>
              <Input
                placeholder="Ex: Lei 14.000 de 2020 - Minha Lei"
                value={nomeLeiManual}
                onChange={(e) => setNomeLeiManual(e.target.value)}
                disabled={!!leiParaTextoBruto}
              />
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Texto da Lei</label>
              <Textarea
                placeholder="Cole aqui o texto completo da lei..."
                value={textoBruto}
                onChange={(e) => setTextoBruto(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            {textoBruto && (
              <div className="text-xs text-muted-foreground">
                {textoBruto.length.toLocaleString()} caracteres
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextoBruto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={formatarTextoBruto}
              disabled={!textoBruto.trim() || !nomeLeiManual.trim()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Formatar com Gemini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Streaming - Formatação em Tempo Real */}
      <Dialog open={showStreaming} onOpenChange={setShowStreaming}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
              Formatando Lei em Tempo Real
              {previaLei && (
                <Badge variant="secondary" className="ml-2">{getNomeAmigavel(previaLei)}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              A Gemini está reconstruindo a lei artigo por artigo. Acompanhe em tempo real.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden py-4">
            <div className="bg-muted/30 rounded-lg border h-[500px] overflow-hidden">
              <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Processando...
                </span>
                <span className="text-xs text-muted-foreground">
                  {textoStreaming.length.toLocaleString()} caracteres
                </span>
              </div>
              <ScrollArea className="h-[450px]">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {textoStreaming || 'Aguardando resposta da IA...'}
                  <span className="animate-pulse">▊</span>
                </pre>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStreaming(false)}>
              Minimizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Comparação de Lei */}
      <Dialog open={showComparacao} onOpenChange={setShowComparacao}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-amber-500" />
              Comparação de Lei
              <Badge variant="secondary" className="ml-2">{getNomeAmigavel(previaLei)}</Badge>
            </DialogTitle>
            <DialogDescription>
              Resultado da comparação entre a versão atual no banco e a nova versão extraída.
            </DialogDescription>
          </DialogHeader>
          
          {resultadoComparacao && (
            <div className="py-4 flex-1 overflow-hidden flex flex-col gap-4">
              {/* Resumo Estatístico */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{resultadoComparacao.estatisticas.artigosAtuais}</div>
                  <div className="text-xs text-muted-foreground">Artigos Atuais</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{resultadoComparacao.estatisticas.inclusoes}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" /> Novos
                  </div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{resultadoComparacao.estatisticas.alteracoes}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Edit className="h-3 w-3" /> Alterados
                  </div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{resultadoComparacao.estatisticas.exclusoes}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Minus className="h-3 w-3" /> Removidos
                  </div>
                </div>
              </div>

              {/* Resumo de Áudios */}
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{resultadoComparacao.estatisticas.audiosManter}</span>
                    <span className="text-muted-foreground">manter</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{resultadoComparacao.estatisticas.audiosRemover}</span>
                    <span className="text-muted-foreground">remover</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{resultadoComparacao.estatisticas.audiosRegravar}</span>
                    <span className="text-muted-foreground">regravar</span>
                  </span>
                </div>
              </div>

              {/* Resumo da IA */}
              {resultadoComparacao.resumo && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-primary mb-1">Resumo da Análise</div>
                  <div className="text-sm text-foreground">{resultadoComparacao.resumo}</div>
                </div>
              )}

              {/* Abas de detalhes */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4 pr-4">
                    {/* Artigos Novos */}
                    {resultadoComparacao.artigosNovos.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-green-500/20 px-4 py-2 text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                          <Plus className="h-4 w-4" />
                          Artigos Novos ({resultadoComparacao.artigosNovos.length})
                        </div>
                        <div className="divide-y max-h-[200px] overflow-y-auto">
                          {resultadoComparacao.artigosNovos.slice(0, 10).map((artigo, idx) => (
                            <div key={idx} className="px-4 py-2 text-sm">
                              <span className="font-medium text-green-600">{artigo.numero}</span>
                              <p className="text-muted-foreground truncate">{artigo.conteudo.substring(0, 150)}...</p>
                            </div>
                          ))}
                          {resultadoComparacao.artigosNovos.length > 10 && (
                            <div className="px-4 py-2 text-sm text-muted-foreground italic">
                              ... e mais {resultadoComparacao.artigosNovos.length - 10} artigos
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Artigos Alterados */}
                    {resultadoComparacao.artigosAlterados.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-amber-500/20 px-4 py-2 text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <Edit className="h-4 w-4" />
                          Artigos Alterados ({resultadoComparacao.artigosAlterados.length})
                        </div>
                        <div className="divide-y max-h-[200px] overflow-y-auto">
                          {resultadoComparacao.artigosAlterados.slice(0, 10).map((artigo, idx) => (
                            <div key={idx} className="px-4 py-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-amber-600">{artigo.numero}</span>
                                {artigo.diferencas.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {artigo.diferencas.slice(0, 2).map((dif, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{dif}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-red-500/5 p-2 rounded">
                                  <span className="text-red-600 font-medium">Antes:</span>
                                  <p className="text-muted-foreground line-clamp-2">{artigo.conteudoAntigo.substring(0, 100)}...</p>
                                </div>
                                <div className="bg-green-500/5 p-2 rounded">
                                  <span className="text-green-600 font-medium">Depois:</span>
                                  <p className="text-muted-foreground line-clamp-2">{artigo.conteudoNovo.substring(0, 100)}...</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {resultadoComparacao.artigosAlterados.length > 10 && (
                            <div className="px-4 py-2 text-sm text-muted-foreground italic">
                              ... e mais {resultadoComparacao.artigosAlterados.length - 10} artigos
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Artigos Removidos */}
                    {resultadoComparacao.artigosRemovidos.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-red-500/20 px-4 py-2 text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
                          <Minus className="h-4 w-4" />
                          Artigos Removidos ({resultadoComparacao.artigosRemovidos.length})
                        </div>
                        <div className="divide-y max-h-[200px] overflow-y-auto">
                          {resultadoComparacao.artigosRemovidos.slice(0, 10).map((artigo, idx) => (
                            <div key={idx} className="px-4 py-2 text-sm">
                              <span className="font-medium text-red-600">{artigo.numero}</span>
                              <p className="text-muted-foreground truncate line-through">{artigo.conteudo.substring(0, 150)}...</p>
                            </div>
                          ))}
                          {resultadoComparacao.artigosRemovidos.length > 10 && (
                            <div className="px-4 py-2 text-sm text-muted-foreground italic">
                              ... e mais {resultadoComparacao.artigosRemovidos.length - 10} artigos
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Análise Detalhada da IA */}
                    {resultadoComparacao.analiseDetalhada && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                          Análise Detalhada
                        </div>
                        <div className="p-4 text-sm text-muted-foreground whitespace-pre-line">
                          {resultadoComparacao.analiseDetalhada}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowComparacao(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={aplicarMudancasComparacao}
              disabled={aplicandoComparacao}
              className="bg-green-600 hover:bg-green-700"
            >
              {aplicandoComparacao ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Aplicar Mudanças
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AtualizarLeiHub;
