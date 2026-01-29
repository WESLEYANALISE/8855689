import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASTA_PRINCIPAL = "1bm7HHnMnnLtMHj7AiVr920yFNCyQdADf";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3/files";
const BATCH_SIZE = 100;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  createdTime?: string;
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

interface SyncStats {
  total: number;
  novos: number;
  atualizados: number;
  erros: number;
  categorias: Record<string, number>;
}

async function listarConteudoDrive(
  folderId: string,
  apiKey: string,
  tipo: "folder" | "file" = "file",
  pageToken?: string
): Promise<DriveListResponse> {
  const mimeQuery = tipo === "folder" 
    ? "mimeType='application/vnd.google-apps.folder'" 
    : "mimeType!='application/vnd.google-apps.folder'";
  
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and ${mimeQuery} and trashed=false`,
    key: apiKey,
    fields: "files(id,name,mimeType,size,webViewLink,createdTime),nextPageToken",
    pageSize: "1000",
  });
  
  if (pageToken) {
    params.append("pageToken", pageToken);
  }
  
  const response = await fetch(`${DRIVE_API_BASE}?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao listar Drive: ${response.status}`, error);
    throw new Error(`Drive API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Buscar todos os arquivos de uma pasta (incluindo subpastas recursivamente)
async function listarArquivosRecursivo(
  pastaId: string,
  apiKey: string,
  categoria: string,
  subcategoria: string = ""
): Promise<{ arquivo: DriveFile; subcategoria: string }[]> {
  const arquivos: { arquivo: DriveFile; subcategoria: string }[] = [];
  
  // Buscar arquivos nesta pasta
  let pageToken: string | undefined;
  do {
    const resultado = await listarConteudoDrive(pastaId, apiKey, "file", pageToken);
    for (const arquivo of resultado.files) {
      arquivos.push({ arquivo, subcategoria });
    }
    pageToken = resultado.nextPageToken;
  } while (pageToken);
  
  // Buscar subpastas e processar recursivamente
  let subpastasPageToken: string | undefined;
  do {
    const subpastas = await listarConteudoDrive(pastaId, apiKey, "folder", subpastasPageToken);
    for (const subpasta of subpastas.files) {
      const novaSubcategoria = subcategoria ? `${subcategoria} > ${subpasta.name}` : subpasta.name;
      console.log(`  Subpasta encontrada: ${novaSubcategoria}`);
      const arquivosSubpasta = await listarArquivosRecursivo(subpasta.id, apiKey, categoria, novaSubcategoria);
      arquivos.push(...arquivosSubpasta);
    }
    subpastasPageToken = subpastas.nextPageToken;
  } while (subpastasPageToken);
  
  return arquivos;
}

async function processarLote(
  supabase: any,
  arquivos: { arquivo: DriveFile; subcategoria: string }[],
  categoria: string,
  pastaId: string,
  stats: SyncStats
): Promise<void> {
  if (arquivos.length === 0) return;
  
  const driveIds = arquivos.map(a => a.arquivo.id);
  const { data: existentes } = await supabase
    .from("peticoes_modelos")
    .select("arquivo_drive_id")
    .in("arquivo_drive_id", driveIds);
  
  const existentesSet = new Set((existentes || []).map((e: any) => e.arquivo_drive_id));
  
  const paraInserir: any[] = [];
  const paraAtualizar: any[] = [];
  
  for (const { arquivo, subcategoria } of arquivos) {
    const categoriaCompleta = subcategoria ? `${categoria} > ${subcategoria}` : categoria;
    const dados = {
      categoria: categoriaCompleta,
      nome_arquivo: arquivo.name,
      link_direto: arquivo.webViewLink || `https://drive.google.com/file/d/${arquivo.id}/view`,
      tipo_arquivo: arquivo.mimeType,
      tamanho_bytes: arquivo.size ? parseInt(arquivo.size) : null,
      arquivo_drive_id: arquivo.id,
      pasta_id: pastaId,
      updated_at: new Date().toISOString(),
    };
    
    if (existentesSet.has(arquivo.id)) {
      paraAtualizar.push(dados);
    } else {
      paraInserir.push(dados);
    }
  }
  
  if (paraInserir.length > 0) {
    const { error } = await supabase
      .from("peticoes_modelos")
      .insert(paraInserir);
    
    if (error) {
      console.error(`Erro ao inserir lote:`, error);
      stats.erros += paraInserir.length;
    } else {
      stats.novos += paraInserir.length;
    }
  }
  
  if (paraAtualizar.length > 0) {
    const { error } = await supabase
      .from("peticoes_modelos")
      .upsert(paraAtualizar, { onConflict: "arquivo_drive_id" });
    
    if (error) {
      console.error(`Erro ao atualizar lote:`, error);
      stats.erros += paraAtualizar.length;
    } else {
      stats.atualizados += paraAtualizar.length;
    }
  }
  
  stats.total += arquivos.length;
}

async function verificarSeParado(supabase: any, logId: string): Promise<boolean> {
  const { data } = await supabase
    .from("peticoes_sync_log")
    .select("status")
    .eq("id", logId)
    .single();
  return data?.status === "stopped";
}

async function processarPasta(
  supabase: any,
  pastaId: string,
  categoria: string,
  apiKey: string,
  stats: SyncStats,
  logId: string
): Promise<boolean> {
  console.log(`Processando categoria: ${categoria} (pasta: ${pastaId})`);
  
  // Verificar se foi parado
  if (await verificarSeParado(supabase, logId)) {
    console.log("Sincronização foi interrompida pelo usuário");
    return false;
  }
  
  // Buscar todos os arquivos recursivamente (incluindo subpastas)
  const todosArquivos = await listarArquivosRecursivo(pastaId, apiKey, categoria);
  console.log(`Categoria ${categoria}: encontrados ${todosArquivos.length} arquivos (incluindo subpastas)`);
  
  // Processar em lotes
  for (let i = 0; i < todosArquivos.length; i += BATCH_SIZE) {
    // Verificar se foi parado a cada lote
    if (await verificarSeParado(supabase, logId)) {
      console.log("Sincronização foi interrompida pelo usuário");
      return false;
    }
    
    const lote = todosArquivos.slice(i, i + BATCH_SIZE);
    await processarLote(supabase, lote, categoria, pastaId, stats);
    
    // Atualizar progresso
    await supabase
      .from("peticoes_sync_log")
      .update({
        total_arquivos: stats.total,
        novos_arquivos: stats.novos,
        atualizados: stats.atualizados,
        erros: stats.erros,
        detalhes: { categorias: stats.categorias, em_progresso: categoria },
      })
      .eq("id", logId);
    console.log(`Progresso: ${stats.total} arquivos (${stats.novos} novos, ${stats.atualizados} atualizados, ${stats.erros} erros)`);
  }
  
  stats.categorias[categoria] = todosArquivos.length;
  return true;
}

async function executarSincronizacao(supabase: any, apiKey: string, logId: string) {
  const stats: SyncStats = {
    total: 0,
    novos: 0,
    atualizados: 0,
    erros: 0,
    categorias: {},
  };
  
  try {
    console.log("Buscando categorias na pasta principal...");
    const { files: subpastas } = await listarConteudoDrive(PASTA_PRINCIPAL, apiKey, "folder");
    console.log(`Encontradas ${subpastas.length} categorias`);
    
    for (const pasta of subpastas) {
      try {
        const continuar = await processarPasta(supabase, pasta.id, pasta.name, apiKey, stats, logId);
        if (!continuar) {
          console.log("Sincronização interrompida");
          return;
        }
      } catch (error) {
        console.error(`Erro na categoria ${pasta.name}:`, error);
        stats.erros++;
      }
    }
    
    await supabase
      .from("peticoes_sync_log")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        total_arquivos: stats.total,
        novos_arquivos: stats.novos,
        atualizados: stats.atualizados,
        erros: stats.erros,
        detalhes: { categorias: stats.categorias },
      })
      .eq("id", logId);
    
    console.log(`Sincronização concluída: ${stats.total} arquivos, ${stats.novos} novos, ${stats.atualizados} atualizados, ${stats.erros} erros`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na sincronização:", error);
    
    await supabase
      .from("peticoes_sync_log")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        erros: stats.erros + 1,
        detalhes: { ...stats.categorias, erro: errorMessage },
      })
      .eq("id", logId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const apiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_DRIVE_API_KEY não configurada");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: logData, error: logError } = await supabase
      .from("peticoes_sync_log")
      .insert({ status: "running" })
      .select()
      .single();
    
    if (logError) throw logError;
    const logId = logData.id;
    
    console.log(`Iniciando sincronização RECURSIVA (log: ${logId})`);
    
    // Usar waitUntil para background task
    // @ts-ignore - EdgeRuntime disponível em Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(executarSincronizacao(supabase, apiKey, logId));
    } else {
      // Fallback para execução normal (dev)
      executarSincronizacao(supabase, apiKey, logId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        logId,
        message: "Sincronização iniciada em background",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao iniciar sincronização:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
