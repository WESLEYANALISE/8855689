import { supabase } from '@/integrations/supabase/client';

interface LacunaArtigo {
  de: number;
  ate: number;
  quantidade: number;
  motivo?: string;
  tipo?: 'revogado' | 'vetado' | 'nao_localizado' | 'nao_regulamentado';
}

interface AnaliseArtigos {
  primeiroArtigo: string | null;
  ultimoArtigo: string | null;
  ultimoNumero: number;
  artigosEsperados: number;
  artigosEncontrados: number;
  percentualExtracao: number;
  lacunas: LacunaArtigo[];
  relatorioGemini?: string;
  artigosNoTextoOriginal?: number;
  divergencia?: number;
}

interface RaspagemResponse {
  success: boolean;
  error?: string;
  totalArtigos?: number;
  totalInseridos?: number;
  preview?: Array<{
    "Número do Artigo": string;
    Artigo: string;
  }>;
  message?: string;
  markdownPreview?: string;
  markdownOriginal?: string;
  ultimaAtualizacao?: string;
  anoAtualizacao?: number;
  diasAtras?: number;
  logs?: string[];
  analiseArtigos?: AnaliseArtigos;
}

interface RaspagemOptions {
  mode?: 'preview' | 'preview_raw' | 'analyze' | 'scrape';
  onLog?: (log: string) => void;
}

export const rasparLeiApi = {
  /**
   * Raspa uma lei do Planalto usando streaming para logs em tempo real
   * @param tableName Nome da tabela no Supabase
   * @param urlPlanalto URL da lei no Planalto
   * @param options Opções de raspagem
   * @param onLog Callback para receber logs em tempo real
   */
  async rasparStreaming(
    tableName: string,
    urlPlanalto: string,
    mode: 'preview' | 'preview_raw' | 'analyze' | 'scrape',
    onLog: (log: string) => void
  ): Promise<RaspagemResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://izspjvegxdfgkgibpyst.supabase.co'}/functions/v1/raspar-lei`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
        },
        body: JSON.stringify({ tableName, urlPlanalto, mode, streaming: true }),
      }
    );

    if (!response.ok) {
      return { success: false, error: `Erro HTTP: ${response.status}` };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'Não foi possível ler o stream' };
    }

    const decoder = new TextDecoder();
    let result: RaspagemResponse = { success: false };
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Processar linhas SSE completas
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Mantém linha incompleta no buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'log') {
              onLog(data.message);
            } else if (data.type === 'result') {
              result = data;
            }
          } catch (e) {
            console.error('Erro ao parsear SSE:', e, line);
          }
        }
      }
    }

    return result;
  },

  /**
   * Raspa uma lei do Planalto e insere na tabela correspondente (modo legado)
   * @param tableName Nome da tabela no Supabase
   * @param urlPlanalto URL da lei no Planalto
   * @param options Opções de raspagem (preview ou scrape)
   */
  async raspar(
    tableName: string, 
    urlPlanalto: string, 
    options: RaspagemOptions = { mode: 'scrape' }
  ): Promise<RaspagemResponse> {
    const { data, error } = await supabase.functions.invoke('raspar-lei', {
      body: { 
        tableName, 
        urlPlanalto,
        mode: options.mode || 'scrape'
      },
    });

    if (error) {
      console.error('Erro ao raspar lei:', error);
      return { success: false, error: error.message };
    }

    // Se houver callback de log, envia todos os logs do servidor
    if (options.onLog && data?.logs) {
      for (const log of data.logs) {
        options.onLog(log);
      }
    }

    return data as RaspagemResponse;
  },

  /**
   * Visualiza prévia dos artigos SEM processamento de IA (texto como veio)
   */
  async previewRaw(tableName: string, urlPlanalto: string, onLog?: (log: string) => void): Promise<RaspagemResponse> {
    if (onLog) {
      return this.rasparStreaming(tableName, urlPlanalto, 'preview_raw', onLog);
    }
    return this.raspar(tableName, urlPlanalto, { mode: 'preview_raw', onLog });
  },

  /**
   * Analisa com IA (Gemini) - processa o texto com limpeza e validação
   */
  async analyzeWithAI(tableName: string, urlPlanalto: string, onLog?: (log: string) => void): Promise<RaspagemResponse> {
    if (onLog) {
      return this.rasparStreaming(tableName, urlPlanalto, 'analyze', onLog);
    }
    return this.raspar(tableName, urlPlanalto, { mode: 'analyze', onLog });
  },

  /**
   * Visualiza prévia dos artigos com streaming de logs (COM IA - modo legado)
   */
  async preview(tableName: string, urlPlanalto: string, onLog?: (log: string) => void): Promise<RaspagemResponse> {
    if (onLog) {
      return this.rasparStreaming(tableName, urlPlanalto, 'preview', onLog);
    }
    return this.raspar(tableName, urlPlanalto, { mode: 'preview', onLog });
  },

  /**
   * Verifica quantos artigos existem em uma tabela
   */
  async contarArtigos(tableName: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`Erro ao contar artigos de ${tableName}:`, error);
        return 0;
      }

      return count || 0;
    } catch (e) {
      console.error(`Erro ao contar artigos de ${tableName}:`, e);
      return 0;
    }
  },

  /**
   * Conta artigos e quantos têm áudio (Narração)
   */
  async contarArtigosEAudios(tableName: string): Promise<{ total: number; comAudio: number }> {
    try {
      // Conta total de artigos
      const { count: total, error: errorTotal } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });

      if (errorTotal) {
        console.error(`Erro ao contar artigos de ${tableName}:`, errorTotal);
        return { total: 0, comAudio: 0 };
      }

      // Conta artigos com áudio (Narração não nula)
      const { count: comAudio, error: errorAudio } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true })
        .not('Narração', 'is', null);

      if (errorAudio) {
        // Tabela pode não ter coluna Narração
        return { total: total || 0, comAudio: 0 };
      }

      return { total: total || 0, comAudio: comAudio || 0 };
    } catch (e) {
      console.error(`Erro ao contar artigos de ${tableName}:`, e);
      return { total: 0, comAudio: 0 };
    }
  },

  /**
   * Verifica status de múltiplas tabelas
   */
  async verificarStatusTabelas(tableNames: string[]): Promise<Record<string, number>> {
    const status: Record<string, number> = {};
    
    await Promise.all(
      tableNames.map(async (tableName) => {
        status[tableName] = await this.contarArtigos(tableName);
      })
    );

    return status;
  },

  /**
   * Busca a última atualização de uma tabela (baseado na coluna ultima_atualizacao)
   */
  async buscarUltimaAtualizacao(tableName: string): Promise<string | undefined> {
    try {
      // Tenta buscar a coluna ultima_atualizacao (formato ISO date)
      const { data, error } = await supabase
        .from(tableName as any)
        .select('ultima_atualizacao')
        .not('ultima_atualizacao', 'is', null)
        .order('ultima_atualizacao', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return undefined;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = data[0] as any;
      return record?.ultima_atualizacao as string | undefined;
    } catch (e) {
      console.error(`Erro ao buscar última atualização de ${tableName}:`, e);
      return undefined;
    }
  },

  /**
   * Limpa uma tabela antes de reprocessar
   */
  async limparTabela(tableName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .neq('id', 0);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
    }
  },

  /**
   * Verifica quais colunas existem numa tabela
   */
  async verificarColunas(tableName: string): Promise<Set<string>> {
    try {
      // Buscar uma única linha para ver as colunas disponíveis
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);

      if (error && !error.message.includes('0 rows')) {
        console.warn(`Erro ao verificar colunas de ${tableName}:`, error.message);
        // Tenta buscar schema information
        return new Set(['Número do Artigo', 'Artigo', 'ultima_atualizacao']);
      }

      if (data && data.length > 0) {
        return new Set(Object.keys(data[0]));
      }

      // Se não há dados, tentar insert de teste para ver colunas aceitas
      // Retorna colunas básicas como fallback
      return new Set(['Número do Artigo', 'Artigo', 'ultima_atualizacao']);
    } catch (e) {
      console.error(`Erro ao verificar colunas de ${tableName}:`, e);
      return new Set(['Número do Artigo', 'Artigo', 'ultima_atualizacao']);
    }
  },

  /**
   * Verifica se a coluna ID é GENERATED ALWAYS (não aceita valores manuais)
   */
  async verificarIdGeneratedAlways(tableName: string): Promise<boolean> {
    try {
      // Tentar inserir e deletar com ID explícito para verificar
      const { error } = await supabase
        .from(tableName as any)
        .insert({ id: 999999, "Número do Artigo": "__TEST__", Artigo: "__TEST__" });
      
      if (error) {
        // Se o erro menciona "GENERATED ALWAYS", não podemos inserir id
        if (error.message.includes('GENERATED ALWAYS') || 
            error.message.includes('cannot insert a non-DEFAULT value')) {
          console.log(`📋 Tabela ${tableName} - ID é GENERATED ALWAYS`);
          return true;
        }
        // Outro erro, assume que podemos inserir id
        console.log(`📋 Tabela ${tableName} - Erro diferente: ${error.message}`);
      } else {
        // Inseriu com sucesso, deletar o registro de teste
        await supabase.from(tableName as any).delete().eq('id', 999999);
      }
      
      return false;
    } catch (e) {
      console.error(`Erro ao verificar ID de ${tableName}:`, e);
      return false;
    }
  },

  /**
   * Insere artigos diretamente na tabela (a partir da prévia editada)
   * PRESERVA: Narração, exemplo, explicacao_*, flashcards, questoes, termos dos artigos existentes
   */
  async rasparComArtigos(
    tableName: string, 
    artigos: Array<{ "Número do Artigo": string; Artigo: string; ordem_artigo?: number }>
  ): Promise<RaspagemResponse & { artigosPreservados?: number }> {
    try {
      // Verificar quais colunas existem na tabela
      const colunasExistentes = await this.verificarColunas(tableName);
      const temOrdemArtigo = colunasExistentes.has('ordem_artigo');
      const temUltimaAtualizacao = colunasExistentes.has('ultima_atualizacao');
      const temNarracao = colunasExistentes.has('Narração');
      const temExemplo = colunasExistentes.has('exemplo');
      
      // Verificar se a coluna ID é GENERATED ALWAYS
      const idGeradoAutomaticamente = await this.verificarIdGeneratedAlways(tableName);
      
      console.log(`📋 Tabela ${tableName} - ordem_artigo=${temOrdemArtigo}, ultima_atualizacao=${temUltimaAtualizacao}, id_auto=${idGeradoAutomaticamente}`);

      // Buscar artigos existentes para preservar conteúdo
      const { data: artigosExistentes } = await supabase
        .from(tableName as any)
        .select('*');
      
      // Criar mapa de artigos existentes por número
      const mapaExistentes = new Map<string, Record<string, any>>();
      if (artigosExistentes) {
        for (const art of artigosExistentes) {
          const num = art["Número do Artigo"];
          if (num) {
            mapaExistentes.set(num, art);
          }
        }
      }
      
      // Campos a preservar
      const camposPreservar = [
        'Narração', 'exemplo', 'Comentario', 'Aula',
        'explicacao_resumido', 'explicacao_simples_maior16', 'explicacao_simples_menor16', 'explicacao_tecnico',
        'flashcards', 'questoes', 'termos', 'termos_aprofundados'
      ];
      
      let artigosPreservados = 0;

      // Limpar tabela
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .neq('id', 0);

      if (deleteError) {
        console.error('Erro ao limpar tabela:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Preparar artigos para inserção preservando conteúdo existente
      const artigosParaInserir = artigos.map((art, idx) => {
        const artigo: Record<string, any> = {
          "Número do Artigo": art["Número do Artigo"],
          Artigo: art.Artigo,
        };
        
        // Só incluir ID se NÃO for GENERATED ALWAYS
        if (!idGeradoAutomaticamente) {
          artigo.id = idx + 1;
        }
        
        if (temOrdemArtigo) {
          artigo.ordem_artigo = art.ordem_artigo || idx + 1;
        }
        
        if (temUltimaAtualizacao) {
          artigo.ultima_atualizacao = new Date().toISOString().split('T')[0];
        }
        
        // PRESERVAR campos do artigo existente (se houver)
        const existente = mapaExistentes.get(art["Número do Artigo"]);
        if (existente) {
          let preservouAlgo = false;
          for (const campo of camposPreservar) {
            if (existente[campo] !== null && existente[campo] !== undefined && existente[campo] !== '') {
              artigo[campo] = existente[campo];
              preservouAlgo = true;
            }
          }
          if (preservouAlgo) {
            artigosPreservados++;
          }
        }
        
        return artigo;
      });

      // Inserir em batches de 50
      const batchSize = 50;
      let totalInseridos = 0;

      for (let i = 0; i < artigosParaInserir.length; i += batchSize) {
        const batch = artigosParaInserir.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from(tableName as any)
          .insert(batch);

        if (insertError) {
          console.error(`Erro ao inserir batch ${i}:`, insertError);
          return { 
            success: false, 
            error: insertError.message,
            totalInseridos 
          };
        }

        totalInseridos += batch.length;
      }

      return { 
        success: true, 
        totalInseridos,
        totalArtigos: artigos.length,
        artigosPreservados
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
    }
  },

  /**
   * Busca todos os artigos existentes de uma tabela para comparação
   */
  async buscarArtigosExistentes(tableName: string): Promise<Array<{
    id: number;
    "Número do Artigo": string | null;
    Artigo: string;
    Narração?: string | null;
  }>> {
    try {
      // Primeiro verifica se a tabela tem coluna Narração
      const colunasExistentes = await this.verificarColunas(tableName);
      const temNarracao = colunasExistentes.has('Narração');
      
      const selectQuery = temNarracao 
        ? 'id, "Número do Artigo", Artigo, Narração'
        : 'id, "Número do Artigo", Artigo';

      const { data, error } = await supabase
        .from(tableName as any)
        .select(selectQuery)
        .order('id', { ascending: true });

      if (error) {
        console.error(`Erro ao buscar artigos de ${tableName}:`, error);
        return [];
      }

      return (data as unknown as Array<{
        id: number;
        "Número do Artigo": string | null;
        Artigo: string;
        Narração?: string | null;
      }>) || [];
    } catch (e) {
      console.error(`Erro ao buscar artigos de ${tableName}:`, e);
      return [];
    }
  }
};
