import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeiParaProcessar {
  id: string;
  numero_lei: string;
  ementa: string | null;
  data_publicacao: string | null;
  data_dou: string | null;
  url_planalto: string;
  status: string;
  texto_bruto?: string | null;
  texto_formatado?: string | null;
  artigos?: any[];
  areas_direito?: string[];
}

interface EstadoAutomacao {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  dia_atual: number | null;
  mes_atual: number | null;
  ano_atual: number | null;
  lei_atual_id: string | null;
  leis_processadas: number;
  leis_total: number;
  leis_com_erro: number;
  ultima_lei_processada: string | null;
  erros: Array<{ lei: string; erro: string; timestamp: string }>;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const ESTADO_ID = '00000000-0000-0000-0000-000000000001';

export function useAutomacaoFormatacao() {
  const [estado, setEstado] = useState<EstadoAutomacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pausadoRef = useRef(false);
  const processandoRef = useRef(false);

  // Carregar estado do banco
  const carregarEstado = useCallback(async () => {
    const { data, error } = await supabase
      .from('automacao_formatacao_leis')
      .select('*')
      .eq('id', ESTADO_ID)
      .single();
    
    if (!error && data) {
      setEstado(data as unknown as EstadoAutomacao);
    }
    setLoading(false);
  }, []);

  // Salvar estado no banco
  const salvarEstado = useCallback(async (novoEstado: Partial<EstadoAutomacao>) => {
    const { error } = await supabase
      .from('automacao_formatacao_leis')
      .update(novoEstado)
      .eq('id', ESTADO_ID);
    
    if (!error) {
      setEstado(prev => prev ? { ...prev, ...novoEstado } : null);
    }
    return !error;
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = `${now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);

  // Buscar leis pendentes ordenadas por data (mais recente primeiro), depois ordem_dou
  const buscarLeisPendentes = async (): Promise<LeiParaProcessar[]> => {
    const { data, error } = await supabase
      .from('leis_push_2025')
      .select('id, numero_lei, ementa, data_publicacao, data_dou, url_planalto, status, texto_bruto, texto_formatado, artigos, areas_direito, ordem_dou')
      .eq('status', 'pendente')
      .order('data_dou', { ascending: false, nullsFirst: false })
      .order('ordem_dou', { ascending: true, nullsFirst: false });
    
    if (error) {
      console.error('Erro ao buscar leis:', error);
      return [];
    }
    
    return (data || []) as LeiParaProcessar[];
  };

  // Buscar todas as leis de um dia específico para verificar se todas foram processadas
  const buscarLeisDoDia = async (data: string): Promise<string[]> => {
    const { data: leis, error } = await supabase
      .from('leis_push_2025')
      .select('numero_lei')
      .eq('data_dou', data);
    
    if (error || !leis) return [];
    return leis.map(l => l.numero_lei);
  };

  // Verificar se todas as leis de um dia estão na resenha diária
  const verificarDiaCompleto = async (data: string): Promise<boolean> => {
    const leisDoDia = await buscarLeisDoDia(data);
    if (leisDoDia.length === 0) return true;
    
    const { data: resenhas, error } = await supabase
      .from('resenha_diaria' as any)
      .select('numero_lei')
      .eq('data_publicacao', data);
    
    if (error) return false;
    
    const numerosResenha = new Set((resenhas || []).map((r: any) => r.numero_lei));
    return leisDoDia.every(num => numerosResenha.has(num));
  };

  // Verificar se lei já está na resenha diária
  const verificarJaNaResenha = async (numeroLei: string): Promise<boolean> => {
    const { data } = await supabase
      .from('resenha_diaria' as any)
      .select('id')
      .eq('numero_lei', numeroLei)
      .maybeSingle();
    
    return !!data;
  };

  // ========== FASE 5: REVISÃO DE EMENTA COM IA ==========
  const revisarEmentaComIA = async (lei: LeiParaProcessar): Promise<boolean> => {
    try {
      // Verificar se tem texto_bruto
      if (!lei.texto_bruto) {
        addLog(`⚠️ Sem texto bruto para revisão de ementa: ${lei.numero_lei}`, 'warning');
        return false;
      }

      // Verificar se ementa parece inválida
      const ementaAtual = lei.ementa || '';
      const pareceInvalida = 
        !ementaAtual ||
        ementaAtual.length < 20 ||
        /^Lei\s+(nº|Ordinária|Complementar)/i.test(ementaAtual) ||
        /^Ementa pendente/i.test(ementaAtual);

      if (!pareceInvalida) {
        addLog(`✅ Ementa parece válida: ${lei.numero_lei}`, 'info');
        return true;
      }

      addLog(`🔍 Fase 5: Revisando ementa com IA - ${lei.numero_lei}`, 'info');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revisar-ementa-lei`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leiId: lei.id }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        addLog(`❌ Erro na revisão de ementa: ${result.error || 'Erro desconhecido'}`, 'error');
        return false;
      }

      if (result.corrigidas > 0) {
        const novaEmenta = result.resultados?.[0]?.ementa_nova || '';
        addLog(`✅ Ementa corrigida: ${novaEmenta.substring(0, 60)}...`, 'success');
      } else {
        addLog(`ℹ️ Ementa não precisou de correção: ${lei.numero_lei}`, 'info');
      }

      return true;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro na revisão de ementa: ${mensagem}`, 'error');
      return false;
    }
  };

  // Processar uma lei individualmente
  const processarLei = async (lei: LeiParaProcessar): Promise<boolean> => {
    try {
      // Verificar se já está na resenha diária
      const jaProcessada = await verificarJaNaResenha(lei.numero_lei);
      if (jaProcessada) {
        addLog(`⏭️ Pulando ${lei.numero_lei} - já está na resenha diária`, 'info');
        
        // Marcar como aprovada se ainda estiver pendente
        await supabase
          .from('leis_push_2025')
          .update({ status: 'aprovado' })
          .eq('id', lei.id);
        
        return true; // Conta como sucesso
      }
      
      addLog(`🔄 Processando: ${lei.numero_lei}`, 'info');
      
      // ========== ETAPA 1: RASPAR TEXTO BRUTO ==========
      if (!lei.texto_bruto) {
        addLog(`📋 Etapa 1: Raspando texto bruto...`, 'info');
        
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
        
        lei.texto_bruto = resultRaspar.textoBruto;
        addLog(`✅ Texto bruto: ${resultRaspar.caracteres} caracteres`, 'success');
      }
      
      // ========== ETAPA 2-4: FORMATAR COM IA ==========
      addLog(`🤖 Etapas 2-4: Formatando com IA...`, 'info');
      
      const responseFormatar = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/formatar-lei-push`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textoBruto: lei.texto_bruto,
          }),
        }
      );

      if (!responseFormatar.ok) {
        const errorData = await responseFormatar.json();
        throw new Error(errorData.error || 'Erro no processamento');
      }

      // Processar stream
      const reader = responseFormatar.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let buffer = '';
      let textoFinal = '';
      let artigos: Array<{ numero: string; texto: string }> = [];

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
              textoFinal = data.texto;
              artigos = data.artigos || [];
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {
            // Ignorar linhas inválidas
          }
        }
      }

      // Salvar no banco
      await supabase
        .from('leis_push_2025')
        .update({ 
          texto_bruto: lei.texto_bruto,
          texto_formatado: textoFinal,
          artigos: artigos,
          status: 'aprovado'
        })
        .eq('id', lei.id);

      // ========== ETAPA 5: REVISÃO DE EMENTA ==========
      addLog(`🔍 Etapa 5: Revisando ementa com IA...`, 'info');
      
      // Atualizar lei com texto_bruto para a revisão
      lei.texto_bruto = lei.texto_bruto;
      await revisarEmentaComIA(lei);

      // Atualizar resenha diária
      await atualizarResenhaDiaria(lei, textoFinal, artigos);
      
      addLog(`✅ ${lei.numero_lei} formatada com ${artigos.length} artigos`, 'success');
      
      // Toast de notificação em tempo real
      toast.success(`Lei formatada: ${lei.numero_lei}`, {
        description: `${artigos.length} artigos extraídos`,
        duration: 3000,
      });
      
      return true;
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro em ${lei.numero_lei}: ${mensagemErro}`, 'error');
      
      toast.error(`Erro: ${lei.numero_lei}`, {
        description: mensagemErro.slice(0, 50),
        duration: 4000,
      });
      
      return false;
    }
  };

  // Extrair ementa real do texto formatado
  const extrairEmentaReal = (textoFormatado: string): string | null => {
    if (!textoFormatado) return null;
    
    // Procurar padrão que vem após a data e antes de "O PRESIDENTE"
    const regex = /(?:Vigência|Conversão da Medida Provisória|Regulamento|Texto compilado|Mensagem de veto)\s*\n*((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*(?:\n[^\n]*)?)/i;
    const match = textoFormatado.match(regex);
    
    if (match && match[1]) {
      return match[1].replace(/\s+/g, ' ').trim().substring(0, 500);
    }
    
    // Fallback: tentar encontrar diretamente
    const regexDireto = /((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*)/i;
    const matchDireto = textoFormatado.match(regexDireto);
    
    if (matchDireto && matchDireto[1]) {
      return matchDireto[1].replace(/\s+/g, ' ').trim().substring(0, 500);
    }
    
    return null;
  };

  // Atualizar resenha diária
  const atualizarResenhaDiaria = async (
    lei: LeiParaProcessar, 
    textoFormatado: string, 
    artigos: Array<{ numero: string; texto: string }>
  ) => {
    try {
      // Extrair ementa real do texto formatado
      const ementaReal = extrairEmentaReal(textoFormatado) || lei.ementa;
      
      const { data: existing } = await supabase
        .from('resenha_diaria' as any)
        .select('id')
        .eq('numero_lei', lei.numero_lei)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('resenha_diaria' as any)
          .update({
            ementa: ementaReal,
            artigos: artigos,
            areas_direito: lei.areas_direito,
            texto_formatado: textoFormatado,
            ordem_dou: (lei as any).ordem_dou || null,
          })
          .eq('id', (existing as any).id);
      } else {
        await supabase
          .from('resenha_diaria' as any)
          .insert({
            numero_lei: lei.numero_lei,
            ementa: ementaReal,
            data_publicacao: lei.data_publicacao || lei.data_dou,
            url_planalto: lei.url_planalto,
            artigos: artigos,
            areas_direito: lei.areas_direito,
            texto_formatado: textoFormatado,
            status: 'ativo',
            ordem_dou: (lei as any).ordem_dou || null,
          });
      }
      
      addLog(`📰 Resenha diária atualizada: ${lei.numero_lei}`, 'info');
    } catch (error) {
      console.error('Erro ao atualizar resenha:', error);
    }
  };

  // Extrair data de uma lei
  const extrairDataLei = (lei: LeiParaProcessar): { dia: number; mes: number; ano: number } | null => {
    const dataString = lei.data_dou || lei.data_publicacao;
    if (!dataString) return null;
    
    const match = dataString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    
    return {
      ano: parseInt(match[1]),
      mes: parseInt(match[2]),
      dia: parseInt(match[3])
    };
  };

  // Iniciar automação
  const iniciar = useCallback(async () => {
    if (processandoRef.current) return;
    
    processandoRef.current = true;
    pausadoRef.current = false;
    setLogs([]);
    
    addLog('🚀 Iniciando automação de formatação...', 'info');
    
    const leis = await buscarLeisPendentes();
    
    if (leis.length === 0) {
      addLog('✅ Nenhuma lei pendente para processar!', 'success');
      await salvarEstado({ status: 'completed', leis_processadas: 0, leis_total: 0 });
      processandoRef.current = false;
      return;
    }
    
    addLog(`📋 ${leis.length} leis pendentes encontradas`, 'info');
    
    // Ordenar por data (mais recente primeiro)
    leis.sort((a, b) => {
      const dataA = a.data_dou || a.data_publicacao || '';
      const dataB = b.data_dou || b.data_publicacao || '';
      return dataB.localeCompare(dataA);
    });
    
    const dataInicial = extrairDataLei(leis[0]);
    
    await salvarEstado({
      status: 'running',
      dia_atual: dataInicial?.dia || null,
      mes_atual: dataInicial?.mes || null,
      ano_atual: dataInicial?.ano || null,
      leis_processadas: 0,
      leis_total: leis.length,
      leis_com_erro: 0,
      erros: []
    });
    
    let processadas = 0;
    let erros = 0;
    const listaErros: Array<{ lei: string; erro: string; timestamp: string }> = [];
    
    for (const lei of leis) {
      // Verificar se foi pausado
      if (pausadoRef.current) {
        addLog('⏸️ Automação pausada pelo usuário', 'warning');
        await salvarEstado({
          status: 'paused',
          lei_atual_id: lei.id,
          leis_processadas: processadas,
          leis_com_erro: erros,
          erros: listaErros
        });
        processandoRef.current = false;
        return;
      }
      
      const dataLei = extrairDataLei(lei);
      
      // Atualizar estado com lei atual
      await salvarEstado({
        lei_atual_id: lei.id,
        dia_atual: dataLei?.dia || null,
        mes_atual: dataLei?.mes || null,
        ano_atual: dataLei?.ano || null,
        ultima_lei_processada: lei.numero_lei
      });
      
      const sucesso = await processarLei(lei);
      
      if (sucesso) {
        processadas++;
      } else {
        erros++;
        listaErros.push({
          lei: lei.numero_lei,
          erro: 'Falha no processamento',
          timestamp: new Date().toISOString()
        });
      }
      
      // Atualizar progresso
      await salvarEstado({
        leis_processadas: processadas,
        leis_com_erro: erros,
        erros: listaErros
      });
      
      // Pequeno delay entre leis para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    addLog(`🎉 Automação concluída! ${processadas}/${leis.length} leis formatadas`, 'success');
    
    await salvarEstado({
      status: 'completed',
      lei_atual_id: null,
      leis_processadas: processadas,
      leis_com_erro: erros,
      erros: listaErros
    });
    
    processandoRef.current = false;
    toast.success(`Automação concluída! ${processadas} leis formatadas`);
  }, [addLog, salvarEstado]);

  // Pausar automação
  const pausar = useCallback(async () => {
    pausadoRef.current = true;
    addLog('⏸️ Pausando automação...', 'warning');
  }, [addLog]);

  // Continuar automação
  const continuar = useCallback(async () => {
    if (processandoRef.current) return;
    if (!estado || estado.status !== 'paused') return;
    
    processandoRef.current = true;
    pausadoRef.current = false;
    
    addLog('▶️ Retomando automação...', 'info');
    
    const leis = await buscarLeisPendentes();
    
    if (leis.length === 0) {
      addLog('✅ Nenhuma lei pendente para processar!', 'success');
      await salvarEstado({ status: 'completed' });
      processandoRef.current = false;
      return;
    }
    
    // Encontrar índice da última lei processada
    let indiceInicio = 0;
    if (estado.lei_atual_id) {
      const idx = leis.findIndex(l => l.id === estado.lei_atual_id);
      if (idx >= 0) indiceInicio = idx;
    }
    
    const leisRestantes = leis.slice(indiceInicio);
    addLog(`📋 ${leisRestantes.length} leis restantes para processar`, 'info');
    
    await salvarEstado({
      status: 'running',
      leis_total: estado.leis_total || leis.length
    });
    
    let processadas = estado.leis_processadas || 0;
    let erros = estado.leis_com_erro || 0;
    const listaErros = [...(estado.erros || [])];
    
    for (const lei of leisRestantes) {
      if (pausadoRef.current) {
        addLog('⏸️ Automação pausada pelo usuário', 'warning');
        await salvarEstado({
          status: 'paused',
          lei_atual_id: lei.id,
          leis_processadas: processadas,
          leis_com_erro: erros,
          erros: listaErros
        });
        processandoRef.current = false;
        return;
      }
      
      const dataLei = extrairDataLei(lei);
      
      await salvarEstado({
        lei_atual_id: lei.id,
        dia_atual: dataLei?.dia || null,
        mes_atual: dataLei?.mes || null,
        ano_atual: dataLei?.ano || null,
        ultima_lei_processada: lei.numero_lei
      });
      
      const sucesso = await processarLei(lei);
      
      if (sucesso) {
        processadas++;
      } else {
        erros++;
        listaErros.push({
          lei: lei.numero_lei,
          erro: 'Falha no processamento',
          timestamp: new Date().toISOString()
        });
      }
      
      await salvarEstado({
        leis_processadas: processadas,
        leis_com_erro: erros,
        erros: listaErros
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    addLog(`🎉 Automação concluída! ${processadas} leis formatadas`, 'success');
    
    await salvarEstado({
      status: 'completed',
      lei_atual_id: null,
      leis_processadas: processadas,
      leis_com_erro: erros,
      erros: listaErros
    });
    
    processandoRef.current = false;
    toast.success(`Automação concluída! ${processadas} leis formatadas`);
  }, [estado, addLog, salvarEstado]);

  // Resetar automação
  const resetar = useCallback(async () => {
    pausadoRef.current = true;
    processandoRef.current = false;
    setLogs([]);
    
    await salvarEstado({
      status: 'idle',
      dia_atual: null,
      mes_atual: null,
      ano_atual: null,
      lei_atual_id: null,
      leis_processadas: 0,
      leis_total: 0,
      leis_com_erro: 0,
      ultima_lei_processada: null,
      erros: []
    });
    
    addLog('🔄 Automação resetada', 'info');
  }, [addLog, salvarEstado]);

  // Carregar estado inicial
  useEffect(() => {
    carregarEstado();
  }, [carregarEstado]);

  return {
    estado,
    loading,
    logs,
    iniciar,
    pausar,
    continuar,
    resetar,
    isProcessando: processandoRef.current
  };
}
