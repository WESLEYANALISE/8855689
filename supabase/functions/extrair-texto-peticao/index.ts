import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean);

let geminiKeyIndex = 0;

function getNextGeminiKey(): string {
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return key || "";
}

// Extrair texto de DOC/DOCX via Google Drive export
async function extrairTextoDoc(fileId: string, apiKey: string): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=text/plain&key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao exportar DOC: ${error}`);
  }
  
  return await response.text();
}

// Baixar arquivo do Google Drive
async function baixarArquivo(fileId: string, apiKey: string): Promise<Uint8Array> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media&key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao baixar arquivo: ${error}`);
  }
  
  return new Uint8Array(await response.arrayBuffer());
}

// Extrair texto de DOCX usando mammoth.js (rápido e sem custo)
async function extrairTextoDocx(fileBytes: Uint8Array): Promise<string> {
  const result = await mammoth.extractRawText({ 
    arrayBuffer: fileBytes.buffer as ArrayBuffer 
  });
  return result.value;
}

// Extrair texto de documento usando Gemini Vision (para PDF e outros)
async function extrairTextoComGemini(fileBytes: Uint8Array, mimeType: string): Promise<string> {
  const geminiKey = getNextGeminiKey();
  if (!geminiKey) {
    throw new Error("Nenhuma chave Gemini disponível");
  }

  const base64File = btoa(String.fromCharCode(...fileBytes));
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64File
              }
            },
            {
              text: "Extraia TODO o texto deste documento. Mantenha a formatação original, incluindo parágrafos, listas, títulos e estrutura do documento. Retorne apenas o texto extraído, sem comentários adicionais."
            }
          ]
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 65536
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro Gemini: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Determinar tipo de arquivo pelo mime type do Drive
async function obterTipoArquivo(fileId: string, apiKey: string): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?fields=mimeType,name&key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Erro ao obter informações do arquivo");
  }
  
  const data = await response.json();
  return data.mimeType || "";
}

// Processar uma petição
async function processarPeticao(
  supabase: any,
  peticao: any,
  apiKey: string
): Promise<{ sucesso: boolean; erro?: string; pulado?: boolean }> {
  try {
    // Pular arquivos temporários do Word (começam com ~$)
    if (peticao.nome_arquivo?.startsWith("~$")) {
      console.log(`Pulando arquivo temporário: ${peticao.nome_arquivo}`);
      return { sucesso: true, pulado: true };
    }
    // Atualizar status para "processando"
    await supabase
      .from("peticoes_modelos")
      .update({ texto_extraido_status: "processando" })
      .eq("id", peticao.id);

    const fileId = peticao.arquivo_drive_id;
    const mimeType = await obterTipoArquivo(fileId, apiKey);
    
    let textoExtraido = "";
    
    // Para Google Docs nativos, usar export
    if (mimeType === "application/vnd.google-apps.document") {
      textoExtraido = await extrairTextoDoc(fileId, apiKey);
    } 
    // Para DOCX, usar mammoth.js (muito mais rápido e sem custo)
    else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log(`Extraindo texto de ${peticao.nome_arquivo} com mammoth.js...`);
      const fileBytes = await baixarArquivo(fileId, apiKey);
      textoExtraido = await extrairTextoDocx(fileBytes);
    }
    // Para DOC antigo, PDF e outros formatos, usar Gemini Vision
    else {
      console.log(`Extraindo texto de ${peticao.nome_arquivo} (${mimeType}) com Gemini...`);
      const fileBytes = await baixarArquivo(fileId, apiKey);
      textoExtraido = await extrairTextoComGemini(fileBytes, mimeType);
    }

    // Salvar texto extraído
    await supabase
      .from("peticoes_modelos")
      .update({
        texto_extraido: textoExtraido,
        texto_extraido_at: new Date().toISOString(),
        texto_extraido_status: "sucesso"
      })
      .eq("id", peticao.id);

    return { sucesso: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao processar petição ${peticao.id}:`, errorMessage);
    
    await supabase
      .from("peticoes_modelos")
      .update({
        texto_extraido_status: "erro",
        texto_extraido: `ERRO: ${errorMessage}`
      })
      .eq("id", peticao.id);

    return { sucesso: false, erro: errorMessage };
  }
}

// Configuração de paralelismo
const PARALLEL_BATCH_SIZE = 10;

// Função para processar em background continuamente
async function processarEmBackground(
  supabase: any,
  driveApiKey: string,
  jobId: string,
  modo: string,
  tamanhoLote: number
) {
  console.log(`[JOB ${jobId}] Iniciando processamento em background...`);
  
  let totalSucesso = 0;
  let totalErros = 0;
  let totalProcessadas = 0;
  let continuar = true;

  try {
    while (continuar) {
      // Verificar se o job foi pausado
      const { data: jobStatus } = await supabase
        .from("extracao_jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (jobStatus?.status === "pausado") {
        console.log(`[JOB ${jobId}] Job pausado pelo usuário`);
        break;
      }

      // Buscar próximo lote de petições
      let query = supabase
        .from("peticoes_modelos")
        .select("id, arquivo_drive_id, nome_arquivo, categoria");

      if (modo === "pendentes") {
        query = query.is("texto_extraido_status", null);
      } else if (modo === "erros") {
        query = query.eq("texto_extraido_status", "erro");
      }

      const { data: peticoes, error } = await query.limit(tamanhoLote);

      if (error) {
        console.error(`[JOB ${jobId}] Erro ao buscar petições:`, error);
        throw error;
      }

      if (!peticoes || peticoes.length === 0) {
        console.log(`[JOB ${jobId}] Nenhuma petição pendente. Finalizando.`);
        continuar = false;
        break;
      }

      console.log(`[JOB ${jobId}] Processando lote de ${peticoes.length} petições...`);

      // Processar em lotes paralelos
      for (let i = 0; i < peticoes.length; i += PARALLEL_BATCH_SIZE) {
        const batch = peticoes.slice(i, i + PARALLEL_BATCH_SIZE);
        
        const batchResults = await Promise.all(
        batch.map((peticao: any) => processarPeticao(supabase, peticao, driveApiKey))
        );
        
        for (const resultado of batchResults) {
          if (resultado.pulado) {
            // Não conta como processado
          } else if (resultado.sucesso) {
            totalSucesso++;
          } else {
            totalErros++;
          }
          totalProcessadas++;
        }

        // Atualizar progresso do job
        await supabase
          .from("extracao_jobs")
          .update({
            total_processadas: totalProcessadas,
            total_sucesso: totalSucesso,
            total_erros: totalErros,
            ultimo_erro: batchResults.find(r => r.erro)?.erro
          })
          .eq("id", jobId);

        // Pequena pausa entre batches
        if (i + PARALLEL_BATCH_SIZE < peticoes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Pausa entre lotes principais
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Marcar job como concluído
    await supabase
      .from("extracao_jobs")
      .update({
        status: "concluido",
        finalizado_at: new Date().toISOString(),
        total_processadas: totalProcessadas,
        total_sucesso: totalSucesso,
        total_erros: totalErros
      })
      .eq("id", jobId);

    console.log(`[JOB ${jobId}] Processamento concluído: ${totalSucesso} sucesso, ${totalErros} erros`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[JOB ${jobId}] Erro fatal:`, errorMessage);
    
    await supabase
      .from("extracao_jobs")
      .update({
        status: "erro",
        ultimo_erro: errorMessage,
        finalizado_at: new Date().toISOString()
      })
      .eq("id", jobId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const driveApiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { modo = "pendentes", peticaoId, limite = 100, jobId, acao } = body;

    // Ação para pausar um job
    if (acao === "pausar" && jobId) {
      await supabase
        .from("extracao_jobs")
        .update({ status: "pausado" })
        .eq("id", jobId);
      
      return new Response(JSON.stringify({ sucesso: true, mensagem: "Job pausado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Ação para iniciar processamento contínuo em background
    if (acao === "iniciar_background") {
      // Contar total pendentes
      const { count: totalPendentes } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true })
        .is("texto_extraido_status", null);

      // Criar job
      const { data: novoJob, error: jobError } = await supabase
        .from("extracao_jobs")
        .insert({
          status: "processando",
          modo,
          tamanho_lote: limite,
          total_pendentes: totalPendentes || 0
        })
        .select()
        .single();

      if (jobError) throw jobError;

      console.log(`Novo job criado: ${novoJob.id}`);

      // Iniciar processamento em background usando EdgeRuntime.waitUntil
      EdgeRuntime.waitUntil(processarEmBackground(supabase, driveApiKey, novoJob.id, modo, limite));

      return new Response(JSON.stringify({ 
        sucesso: true, 
        jobId: novoJob.id,
        totalPendentes,
        mensagem: "Processamento iniciado em background" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Modo legado: processar uma petição específica
    if (peticaoId) {
      const { data } = await supabase
        .from("peticoes_modelos")
        .select("id, arquivo_drive_id, nome_arquivo, categoria")
        .eq("id", peticaoId)
        .single();
      
      if (data) {
        const resultado = await processarPeticao(supabase, data, driveApiKey);
        return new Response(JSON.stringify({
          total: 1,
          sucesso: resultado.sucesso ? 1 : 0,
          erro: resultado.sucesso ? 0 : 1,
          erros: resultado.erro ? [resultado.erro] : []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Modo legado: processar um lote único
    let peticoes: any[] = [];

    if (modo === "pendentes") {
      const { data } = await supabase
        .from("peticoes_modelos")
        .select("id, arquivo_drive_id, nome_arquivo, categoria")
        .is("texto_extraido_status", null)
        .limit(limite);
      
      peticoes = data || [];
    } else if (modo === "todas") {
      const { data } = await supabase
        .from("peticoes_modelos")
        .select("id, arquivo_drive_id, nome_arquivo, categoria")
        .limit(limite);
      
      peticoes = data || [];
    } else if (modo === "erros") {
      const { data } = await supabase
        .from("peticoes_modelos")
        .select("id, arquivo_drive_id, nome_arquivo, categoria")
        .eq("texto_extraido_status", "erro")
        .limit(limite);

      peticoes = data || [];
    }

    console.log(`Processando ${peticoes.length} petições...`);

    const resultados = {
      total: peticoes.length,
      sucesso: 0,
      erro: 0,
      pulados: 0,
      erros: [] as string[]
    };

    // Processar em lotes paralelos
    for (let i = 0; i < peticoes.length; i += PARALLEL_BATCH_SIZE) {
      const batch = peticoes.slice(i, i + PARALLEL_BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(peticao => processarPeticao(supabase, peticao, driveApiKey))
      );
      
      for (let j = 0; j < batchResults.length; j++) {
        const resultado = batchResults[j];
        if (resultado.pulado) {
          resultados.pulados++;
        } else if (resultado.sucesso) {
          resultados.sucesso++;
        } else {
          resultados.erro++;
          resultados.erros.push(`${batch[j].nome_arquivo}: ${resultado.erro}`);
        }
      }
      
      if (i + PARALLEL_BATCH_SIZE < peticoes.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Extração concluída: ${resultados.sucesso} sucesso, ${resultados.erro} erros`);

    return new Response(JSON.stringify(resultados), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro na função:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
