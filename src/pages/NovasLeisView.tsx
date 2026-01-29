import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, ExternalLink, Copy, Share2, ChevronDown, ChevronUp, RefreshCw, Database, Loader2, Sparkles, CheckCircle, Play, FileCode, RotateCcw, Trash2, Zap, AlertCircle, ChevronRight, Home, Wand2, FileEdit, Table2, Eye } from 'lucide-react';
import brasaoRepublica from '@/assets/brasao-republica.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeiCompleta {
  id: string;
  numero_lei: string;
  ementa: string | null;
  data_publicacao: string | null;
  url_planalto: string;
  texto_formatado: string | null;
  texto_bruto: string | null;
  artigos: Array<{ numero: string; texto: string }>;
  anexos?: Array<{ titulo: string; referencia: string }>;
  assinatura?: string | null;
  areas_direito: string[];
  status: 'pendente' | 'aprovado' | 'publicado';
  created_at: string;
}

type EtapaAtual = 1 | 2 | 3 | 4;

interface ValidacaoResultado {
  aprovado: boolean;
  nota: number;
  problemas: string[];
  sugestoes: string[];
}

// Tipos de legislação e suas tabelas correspondentes
const TIPOS_LEGISLACAO = {
  'DECRETO': 'DECRETOS_VADEMECUM',
  'LEI ORDINÁRIA': 'LEIS_ORDINARIAS_VADEMECUM',
  'LEI COMPLEMENTAR': 'LEIS_COMPLEMENTARES_VADEMECUM',
  'MEDIDA PROVISÓRIA': 'MEDIDAS_PROVISORIAS_VADEMECUM',
  'PROJETO DE LEI': 'PL_VADEMECUM',
  'PLP': 'PLP_VADEMECUM',
  'PEC': 'PEC_VADEMECUM',
} as const;

type TipoLegislacao = keyof typeof TIPOS_LEGISLACAO;

export default function NovasLeisView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoProcessar = searchParams.get('auto') === 'true';
  
  const [lei, setLei] = useState<LeiCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de etapas
  const [etapaAtual, setEtapaAtual] = useState<EtapaAtual>(1);
  const [processando, setProcessando] = useState(false);
  const [processandoAuto, setProcessandoAuto] = useState(false);
  const [progressoFormatacao, setProgressoFormatacao] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Dados das etapas
  const [textoBruto, setTextoBruto] = useState<string | null>(null);
  const [textoLimpo, setTextoLimpo] = useState<string | null>(null);
  const [textoFormatado, setTextoFormatado] = useState<string | null>(null);
  const [textoFinal, setTextoFinal] = useState<string | null>(null);
  const [artigosExtraidos, setArtigosExtraidos] = useState<Array<{ numero: string; texto: string }>>([]);
  const [anexosExtraidos, setAnexosExtraidos] = useState<Array<{ titulo: string; referencia: string }>>([]);
  const [assinaturaExtraida, setAssinaturaExtraida] = useState<string | null>(null);
  const [validacao, setValidacao] = useState<ValidacaoResultado | null>(null);
  const [estruturaLei, setEstruturaLei] = useState<{
    numeroLei: string;
    ementa: string;
    preambulo: string;
    artigos: Array<{ numero: string; texto: string }>;
    dataLocal: string;
    presidente: string;
    ministros: string[];
    avisoPublicacao: string;
  } | null>(null);
  
  const [openArtigos, setOpenArtigos] = useState<Set<number>>(new Set([0]));
  const [popularTabela, setPopularTabela] = useState(false);
  const [jaPopulado, setJaPopulado] = useState(false);
  const [removendoResenha, setRemovendoResenha] = useState(false);
  const [metodoFormatacao, setMetodoFormatacao] = useState<1 | 2 | 3 | 4>(1);
  const [popularVadeMecumLoading, setPopularVadeMecumLoading] = useState(false);
  const [jaPopuladoVadeMecum, setJaPopuladoVadeMecum] = useState(false);
  const [tipoDetectado, setTipoDetectado] = useState<TipoLegislacao | null>(null);
  
  // Estados para comparação de 4 métodos simultâneos
  const [comparandoMetodos, setComparandoMetodos] = useState(false);
  const [resultadosComparacao, setResultadosComparacao] = useState<{
    metodo: number;
    texto: string;
    artigos: number;
    loading: boolean;
    erro?: string;
  }[]>([]);
  const [metodoSelecionado, setMetodoSelecionado] = useState<number | null>(null);
  const [revisandoEmenta, setRevisandoEmenta] = useState(false);

  // Helper para verificar se ementa está truncada
  const ementaEstaTruncada = (ementa: string | null): boolean => {
    if (!ementa) return false;
    const ementaTrimmed = ementa.trim();
    const terminacoesTruncadas = /(?:,\s*$|\s+(?:da?|de|do|das?|dos?|e|ou|a|o|as|os|para|com|em|no|na|ao|à)$)/i;
    return terminacoesTruncadas.test(ementaTrimmed);
  };

  // Função para revisar ementa manualmente
  const revisarEmenta = async () => {
    if (!lei?.id) return;
    
    setRevisandoEmenta(true);
    addLog('📋 Revisando ementa...');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revisar-ementa-lei`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leiId: lei.id,
            forcarRevisao: true,
          }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.ementaCorrigida) {
        addLog(`✅ Ementa corrigida: "${result.ementaCorrigida.substring(0, 80)}..."`);
        setLei(prev => prev ? { ...prev, ementa: result.ementaCorrigida } : prev);
        toast.success('Ementa corrigida com sucesso!');
      } else if (result.message) {
        addLog(`ℹ️ ${result.message}`);
        toast.info(result.message);
      } else {
        addLog('⚠️ Não foi possível corrigir a ementa');
        toast.error('Não foi possível corrigir a ementa');
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro'}`);
      toast.error('Erro ao revisar ementa');
    } finally {
      setRevisandoEmenta(false);
    }
  };

  useEffect(() => {
    if (id) fetchLei();
  }, [id]);
  
  // Auto processar se veio da listagem com ?auto=true
  useEffect(() => {
    if (autoProcessar && lei && !processandoAuto && !textoBruto && !textoFormatado) {
      processarAutomaticamente();
    }
  }, [autoProcessar, lei, processandoAuto, textoBruto, textoFormatado]);
  
  const verificarResenha = async (numeroLei: string) => {
    const { data } = await supabase
      .from('resenha_diaria' as any)
      .select('id')
      .eq('numero_lei', numeroLei)
      .single();
    
    setJaPopulado(!!data);
    
    // Detectar tipo e verificar se já está no Vade Mecum
    const tipo = detectarTipoLegislacao(numeroLei);
    setTipoDetectado(tipo);
    
    if (tipo) {
      const tabela = TIPOS_LEGISLACAO[tipo];
      const { data: existeVadeMecum } = await supabase
        .from(tabela as any)
        .select('id')
        .eq('numero_lei', numeroLei)
        .single();
      
      setJaPopuladoVadeMecum(!!existeVadeMecum);
    }
  };
  
  // Detectar tipo de legislação pelo número da lei
  const detectarTipoLegislacao = (numeroLei: string): TipoLegislacao | null => {
    const textoUpper = numeroLei.toUpperCase();
    
    if (textoUpper.includes('DECRETO') || textoUpper.match(/^DEC\.?\s*N[ºo°]/i)) {
      return 'DECRETO';
    }
    if (textoUpper.includes('LEI COMPLEMENTAR') || textoUpper.match(/^LC\.?\s*N[ºo°]/i) || textoUpper.match(/^L\.?C\.?\s*N[ºo°]/i)) {
      return 'LEI COMPLEMENTAR';
    }
    if (textoUpper.includes('MEDIDA PROVISÓRIA') || textoUpper.match(/^MP\.?\s*N[ºo°]/i) || textoUpper.match(/^M\.?P\.?\s*N[ºo°]/i)) {
      return 'MEDIDA PROVISÓRIA';
    }
    if (textoUpper.includes('PROJETO DE LEI COMPLEMENTAR') || textoUpper.match(/^PLP\.?\s*N[ºo°]/i)) {
      return 'PLP';
    }
    if (textoUpper.includes('PROPOSTA DE EMENDA') || textoUpper.match(/^PEC\.?\s*N[ºo°]/i)) {
      return 'PEC';
    }
    if (textoUpper.includes('PROJETO DE LEI') || textoUpper.match(/^PL\.?\s*N[ºo°]/i)) {
      return 'PROJETO DE LEI';
    }
    if (textoUpper.includes('LEI N') || textoUpper.match(/^LEI\.?\s*N[ºo°]/i)) {
      return 'LEI ORDINÁRIA';
    }
    
    return null;
  };
  
  // Popular tabela do Vade Mecum
  const popularTabelaVadeMecum = async () => {
    if (!lei || !textoFormatado || artigosExtraidos.length === 0) {
      toast.error('Formate a lei primeiro');
      return;
    }
    
    const tipo = tipoDetectado || detectarTipoLegislacao(lei.numero_lei);
    if (!tipo) {
      toast.error('Tipo de legislação não identificado');
      return;
    }
    
    const tabela = TIPOS_LEGISLACAO[tipo];
    
    setPopularVadeMecumLoading(true);
    addLog('───────────────────────────────────────────────────────────');
    addLog(`📦 Populando tabela ${tabela}...`);
    addLog(`📋 Tipo detectado: ${tipo}`);

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from(tabela as any)
        .select('id')
        .eq('numero_lei', lei.numero_lei)
        .single();

      if (existing) {
        addLog('⚠️ Lei já existe nesta tabela');
        toast.info('Esta lei já está no Vade Mecum');
        setPopularVadeMecumLoading(false);
        return;
      }

      // Inserir na tabela correspondente
      const { error: insertError } = await supabase
        .from(tabela as any)
        .insert({
          numero_lei: lei.numero_lei,
          tipo_ato: tipo,
          ementa: lei.ementa,
          data_publicacao: lei.data_publicacao || lei.created_at?.split('T')[0],
          url_planalto: lei.url_planalto,
          texto_formatado: textoFormatado,
          artigos: artigosExtraidos,
          areas_direito: lei.areas_direito,
          vigencia: 'vigente'
        });

      if (insertError) throw insertError;

      addLog(`✅ Lei adicionada à tabela ${tabela}!`);
      setJaPopuladoVadeMecum(true);
      toast.success(`Lei adicionada ao Vade Mecum (${tipo})!`);
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Erro ao adicionar lei ao Vade Mecum');
    } finally {
      setPopularVadeMecumLoading(false);
    }
  };
  
  // Remover do Vade Mecum
  const removerDoVadeMecum = async () => {
    if (!lei || !tipoDetectado) return;
    
    const tabela = TIPOS_LEGISLACAO[tipoDetectado];
    
    setPopularVadeMecumLoading(true);
    addLog(`🗑️ Removendo da tabela ${tabela}...`);

    try {
      const { error } = await supabase
        .from(tabela as any)
        .delete()
        .eq('numero_lei', lei.numero_lei);

      if (error) throw error;

      addLog('✅ Removida do Vade Mecum');
      setJaPopuladoVadeMecum(false);
      toast.success('Lei removida do Vade Mecum');
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Erro ao remover do Vade Mecum');
    } finally {
      setPopularVadeMecumLoading(false);
    }
  };

  // Função para transformar menções de "Anexo X" em links clicáveis
  const renderizarTextoComAnexosClicaveis = (texto: string, urlPlanalto: string) => {
    // Regex para encontrar menções a anexos (Anexo I, Anexo II, anexo 1, etc)
    const regexAnexo = /\b(Anexo|ANEXO|anexo)\s+([IVXLCDM]+|[0-9]+|[A-Z])\b/g;
    
    const partes: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regexAnexo.exec(texto)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        partes.push(texto.slice(lastIndex, match.index));
      }
      
      // Adicionar o link do anexo
      const textoAnexo = match[0];
      partes.push(
        <a
          key={`anexo-${match.index}`}
          href={urlPlanalto}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
          title={`Ver ${textoAnexo} no Planalto`}
        >
          {textoAnexo}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < texto.length) {
      partes.push(texto.slice(lastIndex));
    }
    
    return partes.length > 0 ? partes : texto;
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchLei = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leis_push_2025')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      const leiData = {
        ...data,
        artigos: (data.artigos as Array<{ numero: string; texto: string }>) || []
      } as LeiCompleta;
      
      setLei(leiData);
      
      if (leiData.texto_bruto) {
        setTextoBruto(leiData.texto_bruto);
        setEtapaAtual(leiData.texto_formatado ? 2 : 1);
      }
      if (leiData.texto_formatado) {
        setTextoFormatado(leiData.texto_formatado);
        setArtigosExtraidos(leiData.artigos || []);
        // Passar artigos do banco para evitar re-extração truncada
        setEstruturaLei(extrairEstruturaLei(leiData.texto_formatado, leiData, leiData.artigos));
        setEtapaAtual(leiData.artigos?.length > 0 ? 3 : 2);
      }
      
      verificarResenha(leiData.numero_lei);
    } else {
      toast.error('Lei não encontrada');
      navigate('/novas-leis');
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSAMENTO AUTOMÁTICO COMPLETO - 5 ETAPAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const processarAutomaticamente = async () => {
    if (!lei?.url_planalto) return;
    
    setProcessandoAuto(true);
    setLogs([]);
    setProgressoFormatacao(0);
    addLog('🤖 PROCESSAMENTO AUTOMÁTICO - 5 ETAPAS');
    addLog('═══════════════════════════════════════════════════════════');
    
    try {
      // ═══════════════════════════════════════════════════════════════════
      // ETAPA 1: Raspar texto bruto
      // ═══════════════════════════════════════════════════════════════════
      addLog('');
      addLog('📋 ETAPA 1/4: Raspando texto bruto...');
      addLog(`🔗 URL: ${lei.url_planalto}`);
      setProgressoFormatacao(5);
      
      const responseRaspar = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/raspar-planalto-bruto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPlanalto: lei.url_planalto,
            tableName: 'leis_push_2025',
          }),
        }
      );

      const resultRaspar = await responseRaspar.json();

      if (!resultRaspar.success) {
        throw new Error(resultRaspar.error || 'Falha na raspagem');
      }
      
      addLog(`✅ Texto bruto: ${resultRaspar.caracteres} caracteres`);
      setProgressoFormatacao(15);
      
      await supabase
        .from('leis_push_2025')
        .update({ texto_bruto: resultRaspar.textoBruto })
        .eq('id', lei.id);
      
      setTextoBruto(resultRaspar.textoBruto);
      const textoParaProcessar = resultRaspar.textoBruto;

      // ═══════════════════════════════════════════════════════════════════
      // ETAPAS 2, 3, 4: Limpeza + Formatação + Revisão (via formatar-lei-push)
      // ═══════════════════════════════════════════════════════════════════
      addLog('');
      addLog('📋 ETAPAS 2-4: Limpeza → Formatação → Revisão...');
      
      const responseFormatar = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-push`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textoBruto: textoParaProcessar,
          }),
        }
      );

      if (!responseFormatar.ok) {
        const errorData = await responseFormatar.json();
        throw new Error(errorData.error || 'Erro no processamento');
      }

      const reader = responseFormatar.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let buffer = '';
      let textoFinalResult = '';
      let textoLimpoResult = '';
      let textoFormatadoResult = '';
      let artigosResult: Array<{ numero: string; texto: string }> = [];

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
            
            if (data.type === 'etapa') {
              const etapaNum = data.etapa;
              const status = data.status;
              const nome = data.nome;
              
              if (status === 'processando') {
                addLog(`⏳ ${nome}...`);
              } else if (status === 'completo') {
                addLog(`✅ ${nome}: ${data.caracteres || ''} chars`);
                
                // Atualizar progresso
                if (etapaNum === 1) setProgressoFormatacao(20);
                if (etapaNum === 2) {
                  setProgressoFormatacao(45);
                  setTextoLimpo('processando');
                }
                if (etapaNum === 3) {
                  setProgressoFormatacao(70);
                  setTextoFormatado('processando');
                }
                if (etapaNum === 4) {
                  setProgressoFormatacao(90);
                  setTextoFinal('processando');
                }
              }
            } else if (data.type === 'complete') {
              textoFinalResult = data.texto;
              textoLimpoResult = data.textoLimpo || '';
              textoFormatadoResult = data.textoFormatado || '';
              artigosResult = data.artigos || [];
              const anexosResult = data.anexos || [];
              const assinaturaResult = data.assinatura || null;
              setAnexosExtraidos(anexosResult);
              setAssinaturaExtraida(assinaturaResult);
              setProgressoFormatacao(100);
              addLog('');
              addLog(`✅ Pipeline completo! ${artigosResult.length} artigos, ${anexosResult.length} anexos`);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseError) {
            // Ignorar linhas inválidas de JSON
          }
        }
      }

      // Atualizar estados
      setTextoLimpo(textoLimpoResult);
      setTextoFormatado(textoFormatadoResult);
      setTextoFinal(textoFinalResult);
      setArtigosExtraidos(artigosResult);
      if (lei) setEstruturaLei(extrairEstruturaLei(textoFinalResult, lei));
      
      // Salvar no banco
      await supabase
        .from('leis_push_2025')
        .update({ 
          texto_formatado: textoFinalResult,
          artigos: artigosResult,
          status: 'aprovado'
        })
        .eq('id', lei.id);

      // Validação local simples
      const resultadoValidacao = await validarComGemini(textoFinalResult, artigosResult);
      setValidacao(resultadoValidacao);
      
      addLog('');
      addLog(`📊 Validação: ${resultadoValidacao.nota}/100 - ${resultadoValidacao.aprovado ? 'Aprovada' : 'Ressalvas'}`);

      // ═══════════════════════════════════════════════════════════════════
      // ETAPA 5: Revisão de Ementa com IA
      // ═══════════════════════════════════════════════════════════════════
      addLog('');
      addLog('📋 ETAPA 5/5: Revisão de Ementa...');
      setProgressoFormatacao(95);
      
      try {
        // Verificar se ementa parece inválida (começa com "Lei nº" ou está vazia ou truncada)
        const ementaAtual = lei.ementa || '';
        const ementaTrimmed = ementaAtual.trim();
        
        // Detectar ementas truncadas (terminam com vírgula, preposição, artigo, etc.)
        const terminacoesTruncadas = /(?:,\s*$|\s+(?:da?|de|do|das?|dos?|e|ou|a|o|as|os|para|com|em|no|na|ao|à)$)/i;
        const ementaTruncada = terminacoesTruncadas.test(ementaTrimmed);
        
        const ementaInvalida = !ementaAtual || 
          ementaAtual.startsWith('Lei nº') || 
          ementaAtual.startsWith('Lei Complementar') ||
          ementaAtual.startsWith('Decreto') ||
          ementaAtual.startsWith('Medida Provisória') ||
          ementaAtual.length < 20 ||
          ementaTruncada;
        
        if (ementaInvalida && textoParaProcessar) {
          addLog('⚠️ Ementa inválida detectada, extraindo do texto bruto...');
          
          const responseEmenta = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revisar-ementa-lei`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leiId: lei.id,
              }),
            }
          );
          
          const resultEmenta = await responseEmenta.json();
          
          if (resultEmenta.success && resultEmenta.ementaCorrigida) {
            addLog(`✅ Ementa corrigida: "${resultEmenta.ementaCorrigida.substring(0, 80)}..."`);
            // Atualizar lei local
            setLei(prev => prev ? { ...prev, ementa: resultEmenta.ementaCorrigida } : prev);
          } else if (resultEmenta.message) {
            addLog(`ℹ️ ${resultEmenta.message}`);
          } else {
            addLog('⚠️ Não foi possível extrair ementa');
          }
        } else {
          addLog('✅ Ementa já está correta');
        }
      } catch (ementaError) {
        addLog(`⚠️ Erro na revisão de ementa: ${ementaError instanceof Error ? ementaError.message : 'Erro'}`);
      }

      setProgressoFormatacao(100);
      addLog('');
      addLog('═══════════════════════════════════════════════════════════');
      addLog('🎉 PROCESSAMENTO AUTOMÁTICO CONCLUÍDO (5 ETAPAS)!');
      setEtapaAtual(4);
      
      // Recarregar dados da lei do banco para garantir estado atualizado
      await fetchLei();
      
      toast.success('Processamento automático concluído!');
      
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('Falha no processamento automático');
    } finally {
      setProcessandoAuto(false);
    }
  };

  const validarComGemini = async (texto: string, artigos: Array<{ numero: string; texto: string }>): Promise<ValidacaoResultado> => {
    // Validação básica local (pode ser expandida para usar Gemini API)
    const problemas: string[] = [];
    const sugestoes: string[] = [];
    let nota = 100;
    
    // Verificar se tem artigos
    if (artigos.length === 0) {
      problemas.push('Nenhum artigo extraído');
      nota -= 40;
    }
    
    // Verificar se artigos têm texto
    const artigosSemTexto = artigos.filter(a => !a.texto || a.texto.length < 10);
    if (artigosSemTexto.length > 0) {
      problemas.push(`${artigosSemTexto.length} artigos com pouco ou nenhum texto`);
      nota -= artigosSemTexto.length * 2;
    }
    
    // Verificar formatação
    if (!texto.includes('###')) {
      problemas.push('Formatação de artigos não detectada');
      nota -= 20;
    }
    
    // Verificar se texto foi muito reduzido
    if (texto.length < 500) {
      problemas.push('Texto formatado muito curto');
      nota -= 15;
    }
    
    // Sugestões
    if (artigos.length > 50) {
      sugestoes.push('Lei grande - considere revisar artigos-chave');
    }
    
    return {
      aprovado: nota >= 70,
      nota: Math.max(0, nota),
      problemas,
      sugestoes
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: RASPAR TEXTO BRUTO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const executarEtapa1 = async () => {
    if (!lei?.url_planalto) return;

    setProcessando(true);
    setLogs([]);
    addLog(`🌐 ETAPA 1: Raspando texto bruto...`);
    addLog(`🔗 URL: ${lei.url_planalto}`);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/raspar-planalto-bruto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPlanalto: lei.url_planalto,
            tableName: 'leis_push_2025',
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        addLog(`✅ Raspagem concluída: ${result.caracteres} caracteres`);
        addLog(`📊 Artigos detectados: ${result.artigosDetectados}`);
        
        await supabase
          .from('leis_push_2025')
          .update({ texto_bruto: result.textoBruto })
          .eq('id', lei.id);
        
        setTextoBruto(result.textoBruto);
        setEtapaAtual(1);
        toast.success('Texto bruto extraído com sucesso!');
      } else {
        addLog(`❌ Erro: ${result.error}`);
        toast.error(result.error || 'Falha na raspagem');
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('Falha na raspagem');
    } finally {
      setProcessando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: FORMATAÇÃO COM GEMINI
  // ═══════════════════════════════════════════════════════════════════════════
  
  const executarEtapa2 = async (metodo: 1 | 2 | 3 | 4 = metodoFormatacao) => {
    if (!textoBruto || !lei) return;

    setProcessando(true);
    setProgressoFormatacao(0);
    addLog('───────────────────────────────────────────────────────────');
    addLog(`🤖 ETAPA 2: Formatando com Gemini (Método ${metodo})...`);
    const descricoes: Record<number, string> = {
      1: '📋 Prompt básico + regex agressivo',
      2: '📝 Few-shot (exemplos ANTES/DEPOIS) + regex',
      3: '🎯 Foco em § primeiro + regex completo',
      4: '📦 JSON estruturado + conversão + regex'
    };
    addLog(descricoes[metodo] || '');


    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-push`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textoBruto: textoBruto,
            metodo_formatacao: metodo,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na formatação');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let textoCompleto = '';
      let buffer = '';
      const tamanhoEsperado = Math.round(textoBruto.length * 1.2);

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
            
            if (data.type === 'start') {
              addLog(`📦 Dividindo em ${data.totalPartes} partes...`);
            } else if (data.type === 'parte_start') {
              addLog(`📝 Processando parte ${data.parte}/${data.totalPartes}...`);
            } else if (data.type === 'parte_end') {
              addLog(`✅ Parte ${data.parte}/${data.totalPartes} concluída`);
              const progressoParte = Math.round((data.parte / data.totalPartes) * 95);
              setProgressoFormatacao(progressoParte);
            } else if (data.type === 'chunk') {
              textoCompleto += data.texto;
              const progresso = Math.min(95, Math.round((textoCompleto.length / tamanhoEsperado) * 100));
              setProgressoFormatacao(progresso);
            } else if (data.type === 'complete') {
              textoCompleto = data.texto;
              setProgressoFormatacao(100);
              addLog('✅ Formatação concluída!');
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseError) {
            // Ignorar linhas inválidas
          }
        }
      }

      const artigos = extrairArtigosDoTexto(textoCompleto);
      addLog(`📊 ${artigos.length} artigos extraídos`);
      
      await supabase
        .from('leis_push_2025')
        .update({ 
          texto_formatado: textoCompleto,
          artigos: artigos,
          status: 'aprovado'
        })
        .eq('id', lei.id);
      
      setTextoFormatado(textoCompleto);
      setArtigosExtraidos(artigos);
      if (lei) setEstruturaLei(extrairEstruturaLei(textoCompleto, lei));
      setEtapaAtual(2);
      toast.success('Formatação concluída!');
      
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('Falha na formatação');
    } finally {
      setProcessando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARAR 4 MÉTODOS SIMULTANEAMENTE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RASPAR + COMPARAR 4 MÉTODOS (BOTÃO INICIAL)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const rasparECompararMetodos = async () => {
    if (!lei?.url_planalto) {
      toast.error('URL do Planalto não disponível');
      return;
    }

    setComparandoMetodos(true);
    setLogs([]);
    addLog('═══════════════════════════════════════════════════════════');
    addLog('🌐 ETAPA 1: Raspando texto bruto...');
    addLog(`🔗 URL: ${lei.url_planalto}`);

    try {
      // ETAPA 1: Raspar texto bruto
      const responseRaspar = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/raspar-planalto-bruto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urlPlanalto: lei.url_planalto,
            tableName: 'leis_push_2025',
          }),
        }
      );

      const resultRaspar = await responseRaspar.json();

      if (!resultRaspar.success) {
        throw new Error(resultRaspar.error || 'Falha na raspagem');
      }

      addLog(`✅ Raspagem concluída: ${resultRaspar.caracteres} caracteres`);
      
      const textoBrutoRaspado = resultRaspar.textoBruto;
      setTextoBruto(textoBrutoRaspado);
      
      await supabase
        .from('leis_push_2025')
        .update({ texto_bruto: textoBrutoRaspado })
        .eq('id', lei.id);

      // ETAPA 2: Comparar 4 métodos
      addLog('');
      addLog('═══════════════════════════════════════════════════════════');
      addLog('🔄 COMPARANDO 4 MÉTODOS DE FORMATAÇÃO SIMULTANEAMENTE...');

      setResultadosComparacao([
        { metodo: 1, texto: '', artigos: 0, loading: true },
        { metodo: 2, texto: '', artigos: 0, loading: true },
        { metodo: 3, texto: '', artigos: 0, loading: true },
        { metodo: 4, texto: '', artigos: 0, loading: true },
      ]);
      setMetodoSelecionado(null);

      const processarMetodoInterno = async (metodo: number, textoBase: string) => {
        try {
          addLog(`📝 Método ${metodo}: Iniciando...`);
          
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-push`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                textoBruto: textoBase,
                metodo_formatacao: metodo,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('Stream não disponível');

          const decoder = new TextDecoder();
          let textoCompleto = '';
          let buffer = '';
          let artigosCount = 0;

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
                
                if (data.type === 'complete') {
                  textoCompleto = data.texto;
                  artigosCount = data.total_artigos || 0;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // Ignorar
              }
            }
          }

          addLog(`✅ Método ${metodo}: Concluído (${artigosCount} artigos)`);
          
          setResultadosComparacao(prev => 
            prev.map(r => r.metodo === metodo 
              ? { ...r, texto: textoCompleto, artigos: artigosCount, loading: false }
              : r
            )
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erro desconhecido';
          addLog(`❌ Método ${metodo}: ${msg}`);
          
          setResultadosComparacao(prev => 
            prev.map(r => r.metodo === metodo 
              ? { ...r, loading: false, erro: msg }
              : r
            )
          );
        }
      };

      // Executar os 4 métodos em paralelo
      await Promise.all([
        processarMetodoInterno(1, textoBrutoRaspado),
        processarMetodoInterno(2, textoBrutoRaspado),
        processarMetodoInterno(3, textoBrutoRaspado),
        processarMetodoInterno(4, textoBrutoRaspado),
      ]);

      addLog('═══════════════════════════════════════════════════════════');
      addLog('✅ COMPARAÇÃO CONCLUÍDA! Selecione o melhor resultado.');
      setEtapaAtual(1);
      
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('Falha no processo');
    } finally {
      setComparandoMetodos(false);
    }
  };

  const compararMetodos = async () => {
    if (!textoBruto) {
      toast.error('Raspe o texto bruto primeiro');
      return;
    }

    setComparandoMetodos(true);
    setResultadosComparacao([
      { metodo: 1, texto: '', artigos: 0, loading: true },
      { metodo: 2, texto: '', artigos: 0, loading: true },
      { metodo: 3, texto: '', artigos: 0, loading: true },
      { metodo: 4, texto: '', artigos: 0, loading: true },
    ]);
    setMetodoSelecionado(null);
    addLog('═══════════════════════════════════════════════════════════');
    addLog('🔄 COMPARANDO 4 MÉTODOS DE FORMATAÇÃO SIMULTANEAMENTE...');

    const processarMetodo = async (metodo: number) => {
      try {
        addLog(`📝 Método ${metodo}: Iniciando...`);
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-push`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              textoBruto: textoBruto,
              metodo_formatacao: metodo,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream não disponível');

        const decoder = new TextDecoder();
        let textoCompleto = '';
        let buffer = '';
        let artigosCount = 0;

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
              
              if (data.type === 'complete') {
                textoCompleto = data.texto;
                artigosCount = data.total_artigos || 0;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignorar
            }
          }
        }

        addLog(`✅ Método ${metodo}: Concluído (${artigosCount} artigos)`);
        
        setResultadosComparacao(prev => 
          prev.map(r => r.metodo === metodo 
            ? { ...r, texto: textoCompleto, artigos: artigosCount, loading: false }
            : r
          )
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        addLog(`❌ Método ${metodo}: ${msg}`);
        
        setResultadosComparacao(prev => 
          prev.map(r => r.metodo === metodo 
            ? { ...r, loading: false, erro: msg }
            : r
          )
        );
      }
    };

    // Executar os 4 métodos em paralelo
    await Promise.all([
      processarMetodo(1),
      processarMetodo(2),
      processarMetodo(3),
      processarMetodo(4),
    ]);

    addLog('═══════════════════════════════════════════════════════════');
    addLog('✅ COMPARAÇÃO CONCLUÍDA! Selecione o melhor resultado.');
    setComparandoMetodos(false);
  };

  const aplicarMetodoSelecionado = async () => {
    if (metodoSelecionado === null) {
      toast.error('Selecione um método primeiro');
      return;
    }

    const resultado = resultadosComparacao.find(r => r.metodo === metodoSelecionado);
    if (!resultado || !resultado.texto) {
      toast.error('Resultado não disponível');
      return;
    }

    const artigos = extrairArtigosDoTexto(resultado.texto);
    
    if (lei) {
      await supabase
        .from('leis_push_2025')
        .update({ 
          texto_formatado: resultado.texto,
          artigos: artigos,
          status: 'aprovado'
        })
        .eq('id', lei.id);
    }

    setTextoFormatado(resultado.texto);
    setArtigosExtraidos(artigos);
    if (lei) setEstruturaLei(extrairEstruturaLei(resultado.texto, lei));
    setResultadosComparacao([]);
    setEtapaAtual(2);
    
    toast.success(`Método ${metodoSelecionado} aplicado com sucesso!`);
    addLog(`✅ Método ${metodoSelecionado} selecionado e salvo!`);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: POPULAR VADE MECUM (RESENHA DIÁRIA)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const popularVadeMecum = async () => {
    if (!lei || artigosExtraidos.length === 0) {
      toast.error('Formate a lei primeiro');
      return;
    }
    
    setPopularTabela(true);
    addLog('───────────────────────────────────────────────────────────');
    addLog('📦 ETAPA 3: Populando Resenha Diária...');

    try {
      const { data: existing } = await supabase
        .from('resenha_diaria' as any)
        .select('id')
        .eq('numero_lei', lei.numero_lei)
        .single();

      if (existing) {
        // Atualizar lei existente na Resenha Diária
        addLog('🔄 Lei já existe, atualizando com novo texto formatado...');
        
        const existingId = (existing as any).id;
        const { error: updateError } = await supabase
          .from('resenha_diaria' as any)
          .update({
            ementa: lei.ementa,
            artigos: artigosExtraidos,
            areas_direito: lei.areas_direito,
            texto_formatado: textoFormatado,
          })
          .eq('id', existingId);

        if (updateError) throw updateError;

        addLog('✅ Resenha Diária atualizada com sucesso!');
        setEtapaAtual(3);
        setJaPopulado(true);
        toast.success('Resenha Diária atualizada com novo texto formatado!');
        setPopularTabela(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('resenha_diaria' as any)
        .insert({
          numero_lei: lei.numero_lei,
          ementa: lei.ementa,
          data_publicacao: lei.data_publicacao || lei.created_at?.split('T')[0],
          url_planalto: lei.url_planalto,
          artigos: artigosExtraidos,
          areas_direito: lei.areas_direito,
          texto_formatado: textoFormatado,
          status: 'ativo'
        });

      if (insertError) throw insertError;

      addLog('✅ Lei adicionada à Resenha Diária!');
      setEtapaAtual(3);
      setJaPopulado(true);
      toast.success('Lei adicionada à Resenha Diária do Vade Mecum!');
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Erro ao adicionar lei ao Vade Mecum');
    } finally {
      setPopularTabela(false);
    }
  };
  
  const removerDaResenha = async () => {
    if (!lei) return;
    
    setRemovendoResenha(true);
    addLog('🗑️ Removendo da Resenha Diária...');

    try {
      const { error } = await supabase
        .from('resenha_diaria' as any)
        .delete()
        .eq('numero_lei', lei.numero_lei);

      if (error) throw error;

      addLog('✅ Removida da Resenha Diária');
      setJaPopulado(false);
      setEtapaAtual(2);
      toast.success('Lei removida da Resenha Diária');
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Erro ao remover da Resenha Diária');
    } finally {
      setRemovendoResenha(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const extrairArtigosDoTexto = (texto: string): Array<{ numero: string; texto: string }> => {
    const artigos: Array<{ numero: string; texto: string }> = [];
    
    // Tentar extrair com formato ### (texto formatado pelo Gemini)
    const regexFormatado = /###\s*Art\.?\s*(\d+[A-Z]?[-–]?[A-Z]?)/gi;
    let partsFormatado = texto.split(regexFormatado);
    
    if (partsFormatado.length > 1) {
      for (let i = 1; i < partsFormatado.length; i += 2) {
        const numero = partsFormatado[i];
        const textoArtigo = partsFormatado[i + 1]?.trim() || '';
        
        if (numero && textoArtigo) {
          artigos.push({
            numero: `Art. ${numero}`,
            texto: textoArtigo.split(/###\s*Art\./i)[0].trim()
          });
        }
      }
      return artigos;
    }
    
    // Fallback: extrair com formato Art. (MAIÚSCULO apenas) - "art." minúsculo é referência
    // IMPORTANTE: Regex case-sensitive para evitar pegar "art. 165" que é referência
    const regexBruto = /(?:^|\n)\s*(Art\.?\s*\d+[º°]?[A-Z]?[-–]?[A-Z]?\.?)\s*[-–]?\s*/g;
    const matches = [...texto.matchAll(regexBruto)];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const numero = match[1].replace(/\s+/g, ' ').trim();
      const inicio = match.index! + match[0].length;
      const fim = i < matches.length - 1 ? matches[i + 1].index : texto.length;
      const textoArtigo = texto.substring(inicio, fim).trim();
      
      if (numero && textoArtigo && textoArtigo.length > 5) {
        artigos.push({
          numero: numero.replace(/\.?$/, ''),
          texto: textoArtigo.trim() // Sem limite - artigos longos devem ser exibidos completos
        });
      }
    }
    
    return artigos;
  };

  // Extrair estrutura completa da lei do texto formatado
  // Se artigosExistentes for passado (do banco), usa eles ao invés de re-extrair
  const extrairEstruturaLei = (texto: string, leiInfo: LeiCompleta, artigosExistentes?: Array<{ numero: string; texto: string }>) => {
    const estrutura = {
      numeroLei: '',
      ementa: '',
      preambulo: '',
      artigos: [] as Array<{ numero: string; texto: string }>,
      dataLocal: '',
      presidente: '',
      ministros: [] as string[],
      avisoPublicacao: '' // Novo: "Este texto não substitui..."
    };

    // Extrair número da lei (ex: LEI Nº 15.278, DE 1º DE DEZEMBRO DE 2025)
    // O título TERMINA no ano (ex: "2025") - não inclui a ementa
    const regexNumeroLei = /(?:LEI\s*(?:COMPLEMENTAR\s*)?N[ºo°]?\s*[\d.]+[^,]*,\s*DE\s*\d{1,2}[º°]?\s*DE\s*\w+\s*DE\s*\d{4})/i;
    const matchNumero = texto.match(regexNumeroLei);
    if (matchNumero) {
      // Limpa parênteses e texto extra que podem ter vazado para o título
      let tituloLimpo = matchNumero[0]
        .replace(/\)[,\s].*$/i, '') // Remove ")" e tudo após
        .replace(/\s*\([^)]*$/, '') // Remove parênteses abertos sem fechar
        .toUpperCase()
        .trim();
      estrutura.numeroLei = tituloLimpo;
    } else if (leiInfo.numero_lei) {
      estrutura.numeroLei = leiInfo.numero_lei.toUpperCase();
    }

    // Prioridade: usar ementa do banco de dados (já corrigida)
    // Só extrair do texto se o banco não tiver ou tiver valor inválido
    const ementaBanco = leiInfo.ementa || '';
    const ementaInvalida = !ementaBanco || 
      ementaBanco.includes('Lei nº') || 
      ementaBanco.includes('Lei Ordinária') || 
      ementaBanco.includes('Lei Complementar nº') ||
      ementaBanco === 'Ementa pendente de extração' ||
      ementaBanco.length < 20;
    
    if (!ementaInvalida) {
      estrutura.ementa = ementaBanco;
    } else {
      // Fallback: tentar extrair do texto entre o número da lei e "O PRESIDENTE"
      const inicioEmenta = matchNumero ? texto.indexOf(matchNumero[0]) + matchNumero[0].length : 0;
      const fimEmenta = texto.search(/O\s*(?:VICE-)?PRESIDENTE\s*DA\s*REPÚBLICA/i);
      if (fimEmenta > inicioEmenta) {
        let ementaExtraida = texto.substring(inicioEmenta, fimEmenta).trim().replace(/^[\s\n\r,)\]]+|[\s\n\r]+$/g, '');
        ementaExtraida = ementaExtraida.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        ementaExtraida = ementaExtraida.replace(/^[,\s\)]+/, '').trim();
        if (ementaExtraida.length > 20) {
          estrutura.ementa = ementaExtraida;
        }
      }
    }

    // Extrair preâmbulo (O PRESIDENTE DA REPÚBLICA...)
    const regexPreambulo = /O\s*PRESIDENTE\s*DA\s*REPÚBLICA[^:]*:\s*/i;
    const matchPreambulo = texto.match(regexPreambulo);
    if (matchPreambulo) {
      estrutura.preambulo = matchPreambulo[0].trim();
    }

    // Usar artigos do banco se disponíveis (completos), senão extrair do texto
    estrutura.artigos = artigosExistentes && artigosExistentes.length > 0 
      ? artigosExistentes 
      : extrairArtigosDoTexto(texto);

    // Extrair data e local (Brasília, ...) - procurar no final do texto
    const linhas = texto.split('\n');
    const ultimasLinhas = linhas.slice(-30); // últimas 30 linhas
    
    const ministrosEncontrados = new Set<string>();
    
    for (const linha of ultimasLinhas) {
      const linhaLimpa = linha.trim();
      
      // Data e local
      if (linhaLimpa.toLowerCase().startsWith('brasília') && linhaLimpa.includes('da Independência')) {
        estrutura.dataLocal = linhaLimpa;
      }
      
      // Presidente (nomes conhecidos em caixa alta)
      if (/^(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF)/i.test(linhaLimpa)) {
        estrutura.presidente = linhaLimpa.toUpperCase();
      }
      
      // Aviso de publicação
      if (linhaLimpa.toLowerCase().includes('este texto não substitui')) {
        estrutura.avisoPublicacao = linhaLimpa;
      }
    }

    // Se não encontrou com regex específico, buscar padrão mais flexível
    if (!estrutura.dataLocal) {
      const regexDataLocal = /Brasília[,\s]+\d+[^\n]+(?:Independência|República)[^\n]*/i;
      const matchDataLocal = texto.match(regexDataLocal);
      if (matchDataLocal) {
        estrutura.dataLocal = matchDataLocal[0].trim();
      }
    }

    // Extrair ministros (nomes após o presidente)
    if (estrutura.presidente) {
      const posPresidente = texto.toUpperCase().lastIndexOf(estrutura.presidente);
      if (posPresidente > -1) {
        const textoAposPresidente = texto.substring(posPresidente + estrutura.presidente.length);
        const linhasMinistros = textoAposPresidente.split('\n').filter(l => l.trim().length > 0);
        for (const linha of linhasMinistros.slice(0, 10)) {
          const linhaLimpa = linha.trim();
          // Verificar se parece nome de pessoa (não começa com palavras-chave)
          if (linhaLimpa.length > 5 && linhaLimpa.length < 100 && 
              !linhaLimpa.toLowerCase().startsWith('este texto') && 
              !linhaLimpa.startsWith('Art.') &&
              !linhaLimpa.startsWith('###') &&
              !linhaLimpa.startsWith('*') &&
              !linhaLimpa.toLowerCase().includes('publicado') &&
              !linhaLimpa.toLowerCase().includes('dou') &&
              !ministrosEncontrados.has(linhaLimpa.toUpperCase())) {
            ministrosEncontrados.add(linhaLimpa.toUpperCase());
            estrutura.ministros.push(linhaLimpa);
          }
        }
      }
    }

    return estrutura;
  };

  // Formatar texto com quebras de linha - corrige quebras indevidas e mantém estrutura
  const formatarTextoComParagrafos = (texto: string) => {
    if (!texto) return [];
    
    // Se o texto contém HTML (tabelas, divs), retorna como bloco único para preservar estrutura
    if (texto.includes('<div') || texto.includes('<table') || texto.includes('<th') || texto.includes('<td')) {
      return [texto];
    }
    
    // Primeiro, corrigir quebras de linha indevidas
    let textoCorrigido = texto
      // CRÍTICO: Junta "art. X" (minúsculo) com linha anterior - é referência, não artigo novo
      .replace(/\n+(art\.\s*\d+[º°]?(?:-[A-Z])?)/gi, ' $1')
      // Junta § referência com texto anterior (quando não é parágrafo novo, ex: "art. 165, § 2º")
      .replace(/,\s*\n+(§\s*\d+[º°]?)/g, ', $1')
      // Junta referências a § após preposições (do, da, no, na, ao): "constantes no § 10." fica junto
      .replace(/(d[oae]s?|n[oae]s?|a[os]?)\s*\n+(§\s*\d+[º°]?)/gi, '$1 $2')
      // Junta § com seu texto (§ 5º\nTexto -> § 5º Texto) quando é parágrafo
      .replace(/(§\s*\d+[º°]?\.?)\s*\n+\s*(?!§)/g, '$1 ')
      // Junta linhas que terminam com letra e próxima começa com letra minúscula (palavras quebradas)
      .replace(/([a-záéíóúâêîôûãõç])\n([a-záéíóúâêîôûãõç])/gi, '$1$2')
      // Junta linhas que terminam com "(" e próxima começa com texto
      .replace(/\(\n(\w)/g, '($1')
      // Junta linhas quebradas no meio de palavras entre parênteses
      .replace(/\(([^)]*)\n([^)]*)\)/g, '($1$2)')
      // Junta alíneas que ficaram na linha de baixo (ex: "30 (trint\na)" -> "30 (trinta)")
      .replace(/(\w)\n([a-z]\))/gi, '$1$2')
      // Junta "da Constituição", "da Lei", etc. com linha anterior
      .replace(/\n+(d[ao]\s+(?:Constituição|Lei|Decreto|Emenda|Código))/gi, ' $1')
      // Junta "e na Lei", "e no Decreto", etc. com linha anterior
      .replace(/\n+(e\s+n[ao]\s+(?:Lei|Decreto|Emenda))/gi, ' $1')
      // Junta referências a "Lei Complementar nº X" quebradas incorretamente
      .replace(/\n+(Lei\s+(?:Complementar\s+)?n[º°]\s*[\d.]+)/gi, ' $1')
      // Junta datas quebradas ("de X de mês de AAAA")
      .replace(/\n+(de\s+\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/gi, ' $1');
    
    // Agora adiciona quebras onde deve haver (antes de §, mas APENAS quando é novo parágrafo)
    textoCorrigido = textoCorrigido
      // Quebra antes de § APENAS quando após ponto final E seguido de texto com maiúscula (novo parágrafo)
      .replace(/([.!?"])\s*(§\s*\d+[º°]?\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n\n$2')
      // Preserva quebras antes de incisos romanos
      .replace(/([.!?"])\s*([IVXLCDM]+\s*[-–])/g, '$1\n\n$2');
    
    // Divide em partes apenas por quebras duplas
    const partes = textoCorrigido.split(/\n\n+/).filter(part => part.trim());
    
    // Limpa espaços extras e junta linhas simples dentro de cada parte
    return partes.map(parte => 
      parte.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    );
  };

  // Verifica se o texto é apenas aspas ou caracteres de citação
  const isApenasAspas = (texto: string) => {
    if (!texto) return true;
    const textoLimpo = texto.replace(/["„""'']/g, '').trim();
    return textoLimpo.length === 0;
  };

  const toggleArtigo = (index: number) => {
    setOpenArtigos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success('Texto copiado!');
  };

  const compartilhar = () => {
    if (lei) {
      const texto = `${lei.numero_lei}\n\n${lei.ementa || ''}\n\nVeja mais: ${window.location.href}`;
      if (navigator.share) {
        navigator.share({ title: lei.numero_lei, text: texto, url: window.location.href });
      } else {
        copiarTexto(texto);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: LeiCompleta['status']) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Nova</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">Formatada</Badge>;
      case 'publicado':
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">Publicada</Badge>;
      default:
        return null;
    }
  };

  const limparProcesso = async () => {
    // Limpar todos os estados locais
    setTextoBruto(null);
    setTextoLimpo(null);
    setTextoFormatado(null);
    setTextoFinal(null);
    setArtigosExtraidos([]);
    setEtapaAtual(1);
    setLogs([]);
    setValidacao(null);
    setResultadosComparacao([]);
    setMetodoSelecionado(null);
    setProgressoFormatacao(0);
    setEstruturaLei(null);
    setJaPopulado(false);
    
    // Também limpar dados formatados do banco para permitir reprocessamento
    if (id) {
      try {
        await supabase
          .from('leis_push_2025')
          .update({
            texto_formatado: null,
            artigos_extraidos: null,
            status: 'pendente'
          })
          .eq('id', id);
        
        addLog('🔄 Processo reiniciado - dados limpos do banco');
        addLog('📄 Clique em "Processar Automaticamente" para iniciar do zero');
        toast.success('Processo reiniciado! Pronto para reprocessar.');
      } catch (error) {
        console.error('Erro ao limpar banco:', error);
        addLog('⚠️ Erro ao limpar dados do banco');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando lei...</p>
        </div>
      </div>
    );
  }

  if (!lei) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-4xl">
        {/* Header Compacto Mobile */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/novas-leis')}
              className="shrink-0 h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium truncate">{lei.numero_lei}</span>
            {getStatusBadge(lei.status)}
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={compartilhar} className="h-8 w-8">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copiarTexto(textoFormatado || lei.ementa || '')} className="h-8 w-8">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Título e Data - Compacto */}
        <div className="mb-3 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold mb-1">{lei.numero_lei}</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lei.data_publicacao || lei.created_at)}</span>
            {autoProcessar && (
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1 text-[10px]">
                <Zap className="w-2.5 h-2.5" />
                Auto
              </Badge>
            )}
          </div>
        </div>

        {/* Indicador de Etapas - 5 Etapas: Bruto, Limpeza, Formatação, Revisão, Ementa */}
        <Card className="mb-3 sm:mb-6 bg-muted/30">
          <CardContent className="p-2 sm:p-4">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground pb-1">
                <div className="flex items-center gap-0.5 shrink-0">
                  <FileCode className="w-3 h-3" />
                  <span className={textoBruto ? 'text-green-500 font-medium' : ''}>1.Bruto</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <Wand2 className="w-3 h-3" />
                  <span className={textoLimpo ? 'text-green-500 font-medium' : ''}>2.Limpeza</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <FileEdit className="w-3 h-3" />
                  <span className={textoFormatado ? 'text-green-500 font-medium' : ''}>3.Regex</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  <span className={textoFinal ? 'text-green-500 font-medium' : ''}>4.Revisão</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <FileText className="w-3 h-3" />
                  <span className={lei?.ementa && !lei.ementa.startsWith('Lei nº') && !lei.ementa.startsWith('Lei Complementar') ? 'text-green-500 font-medium' : ''}>5.Ementa</span>
                </div>
              </div>
            </ScrollArea>
            
            {(processando || processandoAuto) && (
              <div className="space-y-1 mt-2">
                <Progress value={progressoFormatacao} className="h-1.5 sm:h-2" />
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">{progressoFormatacao}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validação (se houver) */}
        {validacao && (
          <Card className={`mb-3 sm:mb-6 ${validacao.aprovado ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {validacao.aprovado ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  )}
                  <span className="font-semibold text-xs sm:text-sm">
                    {validacao.aprovado ? 'Aprovada' : 'Ressalvas'}
                  </span>
                </div>
                <Badge variant={validacao.aprovado ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                  {validacao.nota}/100
                </Badge>
              </div>
              {validacao.problemas.length > 0 && (
                <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1 mt-1 sm:mt-2">
                  {validacao.problemas.slice(0, 2).map((p, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>⚠️</span>
                      <span className="line-clamp-1">{p}</span>
                    </li>
                  ))}
                  {validacao.problemas.length > 2 && (
                    <li className="text-muted-foreground">+{validacao.problemas.length - 2} mais...</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botão Principal de Ação */}
        <div className="mb-3 sm:mb-6 space-y-2">
          {/* Botão Processar Automático - aparece quando não tem textoFormatado (mesmo que tenha textoBruto) */}
          {!textoFormatado && !processandoAuto && (
            <Button 
              onClick={processarAutomaticamente} 
              disabled={processando || processandoAuto}
              className="w-full gap-2 h-10 sm:h-12 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{textoBruto ? 'Continuar Processamento (5 etapas)' : 'Processar Automaticamente (5 etapas)'}</span>
              <span className="sm:hidden">{textoBruto ? 'Continuar' : 'Processar Automático'}</span>
            </Button>
          )}
          
          {processandoAuto && (
            <Button 
              disabled
              className="w-full gap-2 h-12 bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando automaticamente...
            </Button>
          )}
          
          {/* Botões de ação pós-processamento */}
          {!processandoAuto && textoFormatado && (
            <>
              {jaPopulado ? (
                <Button 
                  onClick={removerDaResenha} 
                  disabled={removendoResenha}
                  variant="outline"
                  className="w-full gap-2 h-10 sm:h-12 text-sm border-destructive text-destructive hover:bg-destructive/10"
                >
                  {removendoResenha ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remover da Resenha Diária</span>
                      <span className="sm:hidden">Remover Resenha</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={popularVadeMecum} 
                  disabled={popularTabela}
                  className="w-full gap-2 h-12"
                >
                  {popularTabela ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Populando Resenha Diária...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Popular Resenha Diária
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          
          {(textoBruto || textoFormatado) && !processandoAuto && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={limparProcesso}
              className="gap-1 text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              Reiniciar
            </Button>
          )}
        </div>

        {/* Tabs: Texto Bruto / Texto Formatado / Prévia da Tabela */}
        {textoFormatado && textoBruto && (
          <Card className="mb-3 sm:mb-6">
            <CardContent className="p-2 sm:p-4">
              <Tabs defaultValue="formatado" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
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
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        Prévia
                      </TabsTrigger>
                    </TabsList>
                  </ScrollArea>
                  {lei?.url_planalto && (
                    <a
                      href={lei.url_planalto}
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
                      {textoBruto.length.toLocaleString()} caracteres
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-4 rounded-lg font-mono">
                      {textoBruto}
                    </pre>
                  </ScrollArea>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={() => copiarTexto(textoBruto)}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </Button>
                </TabsContent>

                {/* Tab: Texto Formatado */}
                <TabsContent value="formatado">
                  <div className="flex items-center justify-end mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {estruturaLei?.artigos?.length || artigosExtraidos.length} artigos
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
                    {/* Número da Lei em caixa alta */}
                    {(estruturaLei?.numeroLei || lei?.numero_lei) && (
                      <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                        {(estruturaLei?.numeroLei || lei?.numero_lei || '')
                          .replace(/^Vigência\s*\|?\s*/i, '')
                          .toUpperCase()}
                      </h3>
                    )}

                    {/* Ementa em vermelho */}
                    {(estruturaLei?.ementa || lei?.ementa) && (
                      <div className="max-w-2xl mx-auto">
                        <p className="text-sm text-red-500 italic">
                          {(estruturaLei?.ementa || lei?.ementa || '').replace(/^Vigência\s*\|?\s*/i, '')}
                        </p>
                        {/* Aviso e botão para corrigir ementa truncada */}
                        {ementaEstaTruncada(lei?.ementa || null) && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Ementa truncada
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={revisarEmenta}
                              disabled={revisandoEmenta}
                              className="h-6 text-xs gap-1 text-primary"
                            >
                              {revisandoEmenta ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Corrigindo...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  Corrigir
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preâmbulo */}
                    {estruturaLei?.preambulo && (
                      <p className="text-sm font-medium text-foreground">
                        {estruturaLei.preambulo}
                      </p>
                    )}
                  </div>

                  {/* Artigos */}
                  {(estruturaLei?.artigos?.length || artigosExtraidos.length > 0) && (
                    <div className="mt-6 space-y-3 text-left">
                      {(estruturaLei?.artigos || artigosExtraidos)
                        .filter(artigo => !isApenasAspas(artigo.texto))
                        .map((artigo, index) => {
                          // Limpar texto do artigo - remover assinatura que pode ter vazado
                          let textoLimpo = artigo.texto
                            .replace(/\nBrasília,\s*\d+.*$/gis, '')
                            .replace(/\n(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF|FERNANDO\s*HENRIQUE\s*CARDOSO)[\s\S]*$/gis, '')
                            .replace(/\nEste texto não substitui[\s\S]*$/gis, '')
                            .trim();
                          
                          return (
                            <div key={index} className="py-4 last:border-0">
                              <div className="font-bold text-red-600 text-lg mb-2">
                                {artigo.numero}
                              </div>
                              <div className="h-px w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent mb-3" />
                              <div className="text-sm text-foreground space-y-3">
                                {/* Número do artigo no texto também */}
                                <p>
                                  <span className="font-semibold">{artigo.numero}</span>{' '}
                                  {renderizarTextoComAnexosClicaveis(formatarTextoComParagrafos(textoLimpo)[0] || '', lei?.url_planalto || '#')}
                                </p>
                                {formatarTextoComParagrafos(textoLimpo).slice(1).map((parte, i) => {
                                  if (parte.includes('<div') || parte.includes('<table')) {
                                    return (
                                      <div 
                                        key={i} 
                                        className="overflow-x-auto w-full"
                                        dangerouslySetInnerHTML={{ __html: parte }}
                                      />
                                    );
                                  }
                                  return <p key={i}>{renderizarTextoComAnexosClicaveis(parte, lei?.url_planalto || '#')}</p>;
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Anexos citados no texto - extraídos automaticamente */}
                  {(() => {
                    // Extrair anexos mencionados no texto da lei (não os anexos completos)
                    // Também buscar nos artigos extraídos
                    const textoParaBusca = [
                      textoFinal || textoFormatado || textoBruto || '',
                      ...(artigosExtraidos || []).map(a => a.texto)
                    ].join(' ');
                    
                    const anexosCitados = new Set<string>();
                    
                    // Regex para encontrar menções a anexos no texto (Anexo I, Anexo II, Anexo único, etc)
                    const regexAnexoNumerado = /\b(?:anexo|Anexo|ANEXO)\s+([IVXLCDM]+|[0-9]+|[A-Z]|único|ÚNICO|Único)\b/gi;
                    let match;
                    while ((match = regexAnexoNumerado.exec(textoParaBusca)) !== null) {
                      const numeroAnexo = match[1].toUpperCase();
                      anexosCitados.add(numeroAnexo);
                    }
                    
                    // Também detectar "do Anexo" ou "no Anexo" sem número (anexo único implícito)
                    const regexAnexoSemNumero = /\b(?:d[oa]|n[oa]|constante\s+d[oa]|indicado\s+n[oa])\s+(?:anexo|Anexo|ANEXO)(?!\s+[IVXLCDM]+|\s+[0-9]+|\s+[A-Z]\b)/gi;
                    if (regexAnexoSemNumero.test(textoParaBusca) && anexosCitados.size === 0) {
                      anexosCitados.add('ÚNICO');
                    }
                    
                    const listaAnexos = Array.from(anexosCitados).sort((a, b) => {
                      // Ordenar por número romano ou número
                      const romanos: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'ÚNICO': 0 };
                      const numA = romanos[a] || parseInt(a) || 0;
                      const numB = romanos[b] || parseInt(b) || 0;
                      return numA - numB;
                    });
                    
                    if (listaAnexos.length === 0) return null;
                    
                    return (
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-400">
                          <FileText className="w-4 h-4" />
                          Anexos da Lei ({listaAnexos.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {listaAnexos.map((anexo, index) => (
                            <a
                              key={index}
                              href={lei?.url_planalto || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 bg-blue-500/20 border border-blue-500/40 rounded-md hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {anexo === 'ÚNICO' ? 'Ver Anexo' : `Anexo ${anexo}`}
                            </a>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Clique para ver no Planalto
                        </p>
                      </div>
                    );
                  })()}

                  {/* Assinatura (Presidente + Ministros) - Separada */}
                  {assinaturaExtraida && (
                    <div className="mt-8 pt-6 border-t border-border/50 text-center">
                      {assinaturaExtraida.split('\n\n').map((linha, index) => (
                        <p key={index} className={`text-sm ${index === 0 ? 'text-muted-foreground italic' : index === 1 ? 'font-semibold uppercase mt-2' : 'text-muted-foreground mt-1'}`}>
                          {linha}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Fallback: Data e Local se não tiver assinatura extraída */}
                  {!assinaturaExtraida && estruturaLei?.dataLocal && (
                    <p className="mt-6 text-sm text-center text-muted-foreground italic">
                      {estruturaLei.dataLocal}
                    </p>
                  )}

                  {/* Fallback: Presidente se não tiver assinatura extraída */}
                  {!assinaturaExtraida && estruturaLei?.presidente && (
                    <p className="mt-4 text-sm text-center font-semibold uppercase text-muted-foreground">
                      {estruturaLei.presidente}
                    </p>
                  )}

                  {/* Fallback: Ministros se não tiver assinatura extraída */}
                  {!assinaturaExtraida && estruturaLei?.ministros && estruturaLei.ministros.length > 0 && (
                    <div className="mt-2 text-center">
                      {estruturaLei.ministros.map((ministro, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {ministro}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Aviso de Publicação - em vermelho */}
                  {estruturaLei?.avisoPublicacao && (
                    <p className="mt-6 text-sm text-center text-red-500 italic">
                      {estruturaLei.avisoPublicacao}
                    </p>
                  )}

                  {/* Botão Copiar */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 gap-1"
                    onClick={() => copiarTexto(
                      [
                        estruturaLei?.numeroLei || lei?.numero_lei || '',
                        estruturaLei?.ementa || lei?.ementa || '',
                        estruturaLei?.preambulo || '',
                        ...(estruturaLei?.artigos || artigosExtraidos).map(a => `${a.numero} ${a.texto}`),
                        estruturaLei?.dataLocal || '',
                        estruturaLei?.presidente || '',
                        ...(estruturaLei?.ministros || [])
                      ].filter(Boolean).join('\n\n')
                    )}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar Todos
                  </Button>
                </TabsContent>

                {/* Tab: Prévia da Tabela */}
                <TabsContent value="previa">
                  <div className="space-y-4">
                    {/* Tipo detectado */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Tipo detectado:</span>
                        {tipoDetectado ? (
                          <Badge className="bg-primary/20 text-primary">
                            {tipoDetectado}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Não identificado
                          </Badge>
                        )}
                      </div>
                      {tipoDetectado && (
                        <Badge variant="secondary" className="text-xs">
                          Tabela: {TIPOS_LEGISLACAO[tipoDetectado]}
                        </Badge>
                      )}
                    </div>

                    {/* Preview de como ficará na tabela */}
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Prévia do registro
                        </h4>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[150px]">Campo</TableHead>
                              <TableHead>Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Número</TableCell>
                              <TableCell>{lei?.numero_lei}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Tipo</TableCell>
                              <TableCell>{tipoDetectado || 'Não identificado'}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Ementa</TableCell>
                              <TableCell className="text-xs max-w-md truncate">{lei?.ementa?.substring(0, 150)}...</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Data Publicação</TableCell>
                              <TableCell>{formatDate(lei?.data_publicacao || lei?.created_at || null)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Artigos</TableCell>
                              <TableCell>{artigosExtraidos.length} artigos extraídos</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Vigência</TableCell>
                              <TableCell>
                                <Badge className="bg-green-500/20 text-green-600">Vigente</Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Lista de artigos preview */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-semibold mb-3">Artigos ({artigosExtraidos.length})</h4>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {artigosExtraidos.slice(0, 10).map((artigo, index) => (
                              <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                                <span className="font-semibold text-primary">{artigo.numero}:</span>{' '}
                                <span className="text-muted-foreground">{artigo.texto.substring(0, 100)}...</span>
                              </div>
                            ))}
                            {artigosExtraidos.length > 10 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                ... e mais {artigosExtraidos.length - 10} artigos
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Botão Popular Tabela */}
                    <div className="flex gap-2">
                      {jaPopuladoVadeMecum ? (
                        <Button 
                          onClick={removerDoVadeMecum}
                          disabled={popularVadeMecumLoading}
                          variant="outline"
                          className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive/10"
                        >
                          {popularVadeMecumLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Removendo...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Remover do Vade Mecum
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={popularTabelaVadeMecum}
                          disabled={popularVadeMecumLoading || !tipoDetectado}
                          className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        >
                          {popularVadeMecumLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Populando tabela...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4" />
                              Popular Tabela ({tipoDetectado || 'N/A'})
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {!tipoDetectado && (
                      <p className="text-xs text-yellow-600 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Não foi possível identificar o tipo de legislação automaticamente
                      </p>
                    )}

                    {jaPopuladoVadeMecum && (
                      <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Esta lei já está no Vade Mecum
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Logs ({logs.length})
              </h2>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">{log}</div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Link para fonte */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <a
              href={lei.url_planalto}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    Ver texto oficial
                  </p>
                  <p className="text-xs text-muted-foreground">Planalto.gov.br</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 rotate-[-90deg] text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
