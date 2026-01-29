import { supabase } from "@/integrations/supabase/client";
import { CODIGO_TO_TABLE, TABLE_TO_CODIGO } from "@/lib/codigoMappings";

export interface VadeMecumArtigo {
  id: number;
  numeroArtigo: string;
  artigo: string;
  explicacaoTecnico: string | null;
  narracao: string | null;
  tableName: string;
}

export interface VadeMecumCodigo {
  codigo: string;
  tableName: string;
  total: number;
  comExplicacao: number;
  comNarracao: number;
}

// Buscar lista de códigos disponíveis do Vade Mecum
export async function buscarCodigosVadeMecum(): Promise<VadeMecumCodigo[]> {
  const codigos: VadeMecumCodigo[] = [];
  
  // Ordenar as entradas por nome do código
  const entries = Object.entries(CODIGO_TO_TABLE).sort((a, b) => 
    a[1].localeCompare(b[1])
  );
  
  // Para cada tabela, verificar se existe e contar artigos
  for (const [codigo, tableName] of entries) {
    try {
      // Tentar buscar contagem da tabela
      const { count: total, error } = await supabase
        .from(tableName as any)
        .select("*", { count: "exact", head: true });
      
      if (error) continue; // Tabela não existe ou sem acesso
      
      // Contar artigos com explicação técnica
      const { count: comExplicacao } = await supabase
        .from(tableName as any)
        .select("*", { count: "exact", head: true })
        .not("explicacao_tecnico", "is", null);
      
      // Contar artigos com narração
      const { count: comNarracao } = await supabase
        .from(tableName as any)
        .select("*", { count: "exact", head: true })
        .not("Narração", "is", null);
      
      codigos.push({
        codigo,
        tableName,
        total: total || 0,
        comExplicacao: comExplicacao || 0,
        comNarracao: comNarracao || 0
      });
    } catch (e) {
      // Ignorar tabelas que não existem
    }
  }
  
  return codigos;
}

// Buscar artigos de um código específico que têm explicação gerada
export async function buscarArtigosComExplicacao(tableName: string): Promise<VadeMecumArtigo[]> {
  const { data, error } = await supabase
    .from(tableName as any)
    .select("id, \"Número do Artigo\", Artigo, explicacao_tecnico, Narração")
    .not("explicacao_tecnico", "is", null)
    .order("ordem_artigo", { ascending: true, nullsFirst: false })
    .limit(500);
  
  if (error) {
    console.error("Erro ao buscar artigos:", error);
    throw error;
  }
  
  return (data || []).map((item: any) => ({
    id: item.id,
    numeroArtigo: item["Número do Artigo"] || "",
    artigo: item.Artigo || "",
    explicacaoTecnico: item.explicacao_tecnico,
    narracao: item["Narração"],
    tableName
  }));
}

// Buscar todos os artigos de um código (com ou sem explicação)
export async function buscarTodosArtigos(tableName: string): Promise<VadeMecumArtigo[]> {
  const { data, error } = await supabase
    .from(tableName as any)
    .select("id, \"Número do Artigo\", Artigo, explicacao_tecnico, Narração")
    .order("ordem_artigo", { ascending: true, nullsFirst: false })
    .limit(1000);
  
  if (error) {
    console.error("Erro ao buscar artigos:", error);
    throw error;
  }
  
  return (data || []).map((item: any) => ({
    id: item.id,
    numeroArtigo: item["Número do Artigo"] || "",
    artigo: item.Artigo || "",
    explicacaoTecnico: item.explicacao_tecnico,
    narracao: item["Narração"],
    tableName
  }));
}

// Gerar explicação para um artigo (modo técnico)
export async function gerarExplicacaoVadeMecum(
  tableName: string, 
  artigoId: number,
  numeroArtigo: string,
  textoArtigo: string
): Promise<void> {
  const { error } = await supabase.functions.invoke("gerar-artigo-explicacao", {
    body: {
      tableName,
      articleId: artigoId,
      numeroArtigo,
      textoArtigo,
      modo: "tecnico"
    }
  });
  
  if (error) {
    console.error("Erro ao gerar explicação:", error);
    throw error;
  }
}

// Gerar narração para um artigo
export async function gerarNarracaoVadeMecum(
  tableName: string,
  artigoId: number,
  numeroArtigo: string,
  textoArtigo: string
): Promise<{ audioUrl: string; totalPartes: number }> {
  const { data, error } = await supabase.functions.invoke("gerar-narracao-vademecum", {
    body: {
      tableName,
      articleId: artigoId,
      numeroArtigo,
      textoArtigo
    }
  });
  
  if (error) {
    console.error("Erro ao gerar narração:", error);
    throw error;
  }
  
  return {
    audioUrl: data.audioUrl,
    totalPartes: data.totalPartes || 1
  };
}

// Excluir explicação de um artigo
export async function excluirExplicacaoVadeMecum(
  tableName: string,
  artigoId: number
): Promise<void> {
  const { error } = await supabase
    .from(tableName as any)
    .update({ explicacao_tecnico: null })
    .eq("id", artigoId);
  
  if (error) {
    console.error("Erro ao excluir explicação:", error);
    throw error;
  }
}

// Excluir narração de um artigo
export async function excluirNarracaoVadeMecum(
  tableName: string,
  artigoId: number
): Promise<void> {
  const { error } = await supabase
    .from(tableName as any)
    .update({ "Narração": null })
    .eq("id", artigoId);
  
  if (error) {
    console.error("Erro ao excluir narração:", error);
    throw error;
  }
}

// Buscar estatísticas do Vade Mecum para o dashboard
export async function buscarEstatisticasVadeMecum(): Promise<{
  total: number;
  comExplicacao: number;
  comNarracao: number;
}> {
  const codigos = await buscarCodigosVadeMecum();
  
  return codigos.reduce(
    (acc, codigo) => ({
      total: acc.total + codigo.total,
      comExplicacao: acc.comExplicacao + codigo.comExplicacao,
      comNarracao: acc.comNarracao + codigo.comNarracao
    }),
    { total: 0, comExplicacao: 0, comNarracao: 0 }
  );
}
