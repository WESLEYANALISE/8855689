import { supabase } from '@/integrations/supabase/client';

// Lista de tabelas de leis que têm coluna Narração
const TABELAS_LEIS = [
  "CF - Constituição Federal",
  "CC - Código Civil",
  "CP - Código Penal",
  "CPC – Código de Processo Civil",
  "CLT - Consolidação das Leis do Trabalho",
  "CDC – Código de Defesa do Consumidor",
  "CE – Código Eleitoral",
  "CF - Código Florestal",
  "CA - Código de Águas",
  "CC - Código de Caça",
  "CP - Código de Pesca",
  "CDM – Código de Minas",
  "CCOM – Código Comercial",
  "CBA Código Brasileiro de Aeronáutica",
  "CBT Código Brasileiro de Telecomunicações",
  "CDUS - Código de Defesa do Usuário",
  "CPI - Código de Propriedade Industrial",
];

export interface EstatisticasGerais {
  totalArtigos: number;
  totalNarrados: number;
  percentualGeral: number;
  porLei: {
    nome: string;
    nomeAmigavel: string;
    total: number;
    narrados: number;
    percentual: number;
  }[];
}

export interface ArtigoNarracao {
  id: number;
  numeroArtigo: string;
  artigo: string;
  temNarracao: boolean;
  urlNarracao: string | null;
}

export interface Anomalia {
  tipo: 'sem_narracao' | 'url_invalida' | 'muito_curto';
  lei: string;
  artigo?: string;
  descricao: string;
}

// Função para gerar nome amigável da tabela
function getNomeAmigavel(tableName: string): string {
  const mapa: Record<string, string> = {
    "CF - Constituição Federal": "Constituição Federal",
    "CC - Código Civil": "Código Civil",
    "CP - Código Penal": "Código Penal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CDC – Código de Defesa do Consumidor": "Código do Consumidor",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CF - Código Florestal": "Código Florestal",
    "CA - Código de Águas": "Código de Águas",
    "CC - Código de Caça": "Código de Caça",
    "CP - Código de Pesca": "Código de Pesca",
    "CDM – Código de Minas": "Código de Minas",
    "CCOM – Código Comercial": "Código Comercial",
    "CBA Código Brasileiro de Aeronáutica": "Código de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CDUS - Código de Defesa do Usuário": "Código do Usuário",
    "CPI - Código de Propriedade Industrial": "Propriedade Industrial",
  };
  return mapa[tableName] || tableName;
}

export const narracaoApi = {
  /**
   * Retorna lista de tabelas de leis disponíveis
   */
  getTabelasLeis(): string[] {
    return TABELAS_LEIS;
  },

  /**
   * Busca estatísticas gerais de narração de todas as leis
   */
  async buscarEstatisticasGerais(): Promise<EstatisticasGerais> {
    let totalGeral = 0;
    let narradosGeral = 0;
    const porLei: EstatisticasGerais['porLei'] = [];

    for (const tabela of TABELAS_LEIS) {
      try {
        // Total de artigos
        const { count: total, error: errorTotal } = await supabase
          .from(tabela as any)
          .select('*', { count: 'exact', head: true });

        if (errorTotal || !total) continue;

        // Artigos com narração
        const { count: narrados, error: errorNarrados } = await supabase
          .from(tabela as any)
          .select('*', { count: 'exact', head: true })
          .not('Narração', 'is', null);

        const qtdNarrados = narrados || 0;
        const percentual = total > 0 ? Math.round((qtdNarrados / total) * 100) : 0;

        porLei.push({
          nome: tabela,
          nomeAmigavel: getNomeAmigavel(tabela),
          total,
          narrados: qtdNarrados,
          percentual,
        });

        totalGeral += total;
        narradosGeral += qtdNarrados;
      } catch (e) {
        console.error(`Erro ao buscar estatísticas de ${tabela}:`, e);
      }
    }

    // Ordenar por percentual (do menor para maior - priorizar os que faltam mais)
    porLei.sort((a, b) => a.percentual - b.percentual);

    return {
      totalArtigos: totalGeral,
      totalNarrados: narradosGeral,
      percentualGeral: totalGeral > 0 ? Math.round((narradosGeral / totalGeral) * 100) : 0,
      porLei,
    };
  },

  /**
   * Busca artigos de uma lei específica
   */
  async buscarArtigosDaLei(tableName: string): Promise<ArtigoNarracao[]> {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('id, "Número do Artigo", Artigo, Narração, ordem_artigo')
        .order('ordem_artigo', { ascending: true });

      if (error) {
        console.error(`Erro ao buscar artigos de ${tableName}:`, error);
        return [];
      }

      // Filtrar apenas artigos que têm "Número do Artigo" preenchido com número
      const artigosComNumero = (data || []).filter((item: any) => {
        const numeroArtigo = item["Número do Artigo"];
        // Só incluir se tiver número do artigo preenchido e contiver pelo menos um dígito
        return numeroArtigo && /\d/.test(numeroArtigo);
      });

      // Mapear artigos com informações de ordenação
      const artigosMapeados = artigosComNumero.map((item: any) => {
        const numeroArtigo = item["Número do Artigo"];
        // Extrair número do artigo para ordenação e agrupamento (ex: "Art. 1º" -> 1, "1º" -> 1)
        const matchNumero = numeroArtigo.match(/(\d+)/);
        const ordemNumerica = matchNumero ? parseInt(matchNumero[1]) : 9999;
        // Extrair sufixo de letra para ordenação secundária (A=1, B=2, etc)
        const matchLetra = numeroArtigo.match(/[-–]([A-Za-z])$/);
        const ordemLetra = matchLetra ? matchLetra[1].toUpperCase().charCodeAt(0) - 64 : 0;
        // Chave única para agrupar (número + letra opcional)
        const chaveAgrupamento = `${ordemNumerica}-${ordemLetra}`;
        
        return {
          id: item.id,
          numeroArtigo,
          artigo: item.Artigo || '',
          temNarracao: !!item.Narração,
          urlNarracao: item.Narração || null,
          _ordemNumerica: ordemNumerica,
          _ordemLetra: ordemLetra,
          _chaveAgrupamento: chaveAgrupamento,
        };
      });

      // Agrupar por número do artigo e manter apenas um (preferir o que tem formato numérico simples como "1º")
      const artigosUnicos = new Map<string, typeof artigosMapeados[0]>();
      for (const artigo of artigosMapeados) {
        const existente = artigosUnicos.get(artigo._chaveAgrupamento);
        if (!existente) {
          artigosUnicos.set(artigo._chaveAgrupamento, artigo);
        } else {
          // Preferir formato simples (ex: "1º") sobre formato com prefixo (ex: "Art. 1")
          const temPrefixo = (s: string) => /^(Art|art)/i.test(s);
          if (temPrefixo(existente.numeroArtigo) && !temPrefixo(artigo.numeroArtigo)) {
            artigosUnicos.set(artigo._chaveAgrupamento, artigo);
          }
        }
      }

      // Converter para array e ordenar
      const artigos = Array.from(artigosUnicos.values());
      artigos.sort((a, b) => {
        if (a._ordemNumerica !== b._ordemNumerica) {
          return a._ordemNumerica - b._ordemNumerica;
        }
        return a._ordemLetra - b._ordemLetra;
      });

      // Remover campos auxiliares de ordenação
      return artigos.map(({ _ordemNumerica, _ordemLetra, _chaveAgrupamento, ...artigo }) => artigo);
    } catch (e) {
      console.error(`Erro ao buscar artigos de ${tableName}:`, e);
      return [];
    }
  },

  /**
   * Gera narração para um artigo específico usando a função gerar-narracao-vademecum
   */
  async gerarNarracao(
    tableName: string,
    id: number,
    texto: string,
    categoria: string,
    speakingRate: number = 1.0
  ): Promise<{ success: boolean; urlAudio?: string; error?: string }> {
    try {
      // Buscar o número do artigo real do banco
      const { data: artigoData, error: fetchError } = await supabase
        .from(tableName as any)
        .select('"Número do Artigo"')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { success: false, error: `Erro ao buscar artigo: ${fetchError.message}` };
      }

      const numeroArtigo = (artigoData as any)?.["Número do Artigo"] || `${id}`;

      // Usar a função gerar-narracao-vademecum que inclui o nome da lei e artigo por extenso
      const { data, error } = await supabase.functions.invoke('gerar-narracao-vademecum', {
        body: {
          tableName,
          numeroArtigo,
          textoArtigo: texto,
          articleId: id,
          speakingRate,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.audioUrl || data?.audioUrls?.[0]) {
        const urlAudio = data.audioUrl || data.audioUrls[0];
        return { success: true, urlAudio };
      }

      return { success: false, error: data?.error || 'Não foi possível gerar o áudio' };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
    }
  },

  /**
   * Apaga narração de um artigo (remove do banco E do Storage)
   */
  async apagarNarracao(
    tableName: string,
    id: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Primeiro, buscar a URL atual para extrair o caminho do arquivo
      const { data: artigoData, error: fetchError } = await supabase
        .from(tableName as any)
        .select('Narração')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { success: false, error: `Erro ao buscar artigo: ${fetchError.message}` };
      }

      const urlNarracao = (artigoData as any)?.Narração;

      // Se tiver URL, tentar apagar do Storage
      if (urlNarracao) {
        try {
          // Extrair o caminho do arquivo da URL
          // URL típica: https://xxx.supabase.co/storage/v1/object/public/audios/path/to/file.mp3
          const match = urlNarracao.match(/\/storage\/v1\/object\/public\/audios\/(.+)$/);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            const { error: storageError } = await supabase.storage
              .from('audios')
              .remove([filePath]);

            if (storageError) {
              console.warn('Erro ao apagar arquivo do Storage:', storageError);
              // Continua mesmo se falhar - pelo menos remove a referência do banco
            }
          }
        } catch (storageErr) {
          console.warn('Erro ao processar exclusão do Storage:', storageErr);
        }
      }

      // Atualizar banco para remover a URL
      const { error } = await supabase
        .from(tableName as any)
        .update({ Narração: null } as any)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
    }
  },

  /**
   * Detecta anomalias nas narrações
   */
  async detectarAnomalias(): Promise<Anomalia[]> {
    const anomalias: Anomalia[] = [];

    for (const tabela of TABELAS_LEIS) {
      try {
        // Verificar leis completamente sem narração
        const { count: total } = await supabase
          .from(tabela as any)
          .select('*', { count: 'exact', head: true });

        const { count: narrados } = await supabase
          .from(tabela as any)
          .select('*', { count: 'exact', head: true })
          .not('Narração', 'is', null);

        if (total && total > 0 && (!narrados || narrados === 0)) {
          anomalias.push({
            tipo: 'sem_narracao',
            lei: getNomeAmigavel(tabela),
            descricao: `Lei sem nenhuma narração (${total} artigos)`,
          });
        }
      } catch (e) {
        console.error(`Erro ao verificar anomalias de ${tabela}:`, e);
      }
    }

    return anomalias;
  },
};
