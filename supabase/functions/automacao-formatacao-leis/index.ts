import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  ordem_dou?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🚀 Iniciando automação de formatação de leis...");

    // Buscar leis pendentes ordenadas por data (mais recente primeiro)
    const { data: leis, error: leisError } = await supabase
      .from("leis_push_2025")
      .select("id, numero_lei, ementa, data_publicacao, data_dou, url_planalto, status, texto_bruto, texto_formatado, artigos, areas_direito, ordem_dou")
      .eq("status", "pendente")
      .order("data_dou", { ascending: false, nullsFirst: false })
      .order("ordem_dou", { ascending: true, nullsFirst: false })
      .limit(10); // Processar 10 por vez para não sobrecarregar

    if (leisError) {
      console.error("Erro ao buscar leis:", leisError);
      throw leisError;
    }

    if (!leis || leis.length === 0) {
      console.log("✅ Nenhuma lei pendente para processar");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma lei pendente", processadas: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 ${leis.length} leis pendentes encontradas`);

    let processadas = 0;
    let erros = 0;

    for (const lei of leis as LeiParaProcessar[]) {
      try {
        // Verificar se já está na resenha diária
        const { data: existeResenha } = await supabase
          .from("resenha_diaria")
          .select("id")
          .eq("numero_lei", lei.numero_lei)
          .maybeSingle();

        if (existeResenha) {
          console.log(`⏭️ Pulando ${lei.numero_lei} - já está na resenha diária`);
          await supabase
            .from("leis_push_2025")
            .update({ status: "aprovado" })
            .eq("id", lei.id);
          processadas++;
          continue;
        }

        console.log(`🔄 Processando: ${lei.numero_lei}`);

        let textoBruto = lei.texto_bruto;

        // Etapa 1: Raspar texto bruto se não existir
        if (!textoBruto) {
          console.log(`📋 Raspando texto bruto de ${lei.numero_lei}...`);
          
          const responseRaspar = await fetch(
            `${supabaseUrl}/functions/v1/raspar-planalto-bruto`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                urlPlanalto: lei.url_planalto,
                tableName: "leis_push_2025",
              }),
            }
          );

          const resultRaspar = await responseRaspar.json();

          if (!resultRaspar.success) {
            throw new Error(resultRaspar.error || "Falha na raspagem");
          }

          textoBruto = resultRaspar.textoBruto;
          console.log(`✅ Texto bruto: ${resultRaspar.caracteres} caracteres`);
        }

        // Etapa 2: Formatar via edge function
        console.log(`🤖 Formatando ${lei.numero_lei} com IA...`);

        const responseFormatar = await fetch(
          `${supabaseUrl}/functions/v1/formatar-lei-push`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ textoBruto }),
          }
        );

        if (!responseFormatar.ok) {
          const errorData = await responseFormatar.json();
          throw new Error(errorData.error || "Erro no processamento");
        }

        // Processar stream
        const reader = responseFormatar.body?.getReader();
        if (!reader) throw new Error("Stream não disponível");

        const decoder = new TextDecoder();
        let buffer = "";
        let textoFinal = "";
        let artigos: Array<{ numero: string; texto: string }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "complete") {
                textoFinal = data.texto;
                artigos = data.artigos || [];
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch {
              // Ignorar linhas inválidas
            }
          }
        }

        // Salvar no banco
        await supabase
          .from("leis_push_2025")
          .update({
            texto_bruto: textoBruto,
            texto_formatado: textoFinal,
            artigos: artigos,
            status: "aprovado",
          })
          .eq("id", lei.id);

        // Priorizar ementa do banco se for válida (completa)
        const ementaDoBanco = lei.ementa;
        const ementaValida = ementaDoBanco && 
          ementaDoBanco.length > 30 && 
          !ementaDoBanco.toLowerCase().startsWith('lei nº') &&
          !ementaDoBanco.toLowerCase().startsWith('decreto nº') &&
          !ementaDoBanco.startsWith('Ementa pendente');

        // Usar ementa do banco se válida, senão tentar extrair
        const ementaReal = ementaValida ? ementaDoBanco : (extrairEmentaReal(textoFinal) || ementaDoBanco);

        // Atualizar resenha diária
        const { data: existing } = await supabase
          .from("resenha_diaria")
          .select("id")
          .eq("numero_lei", lei.numero_lei)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("resenha_diaria")
            .update({
              ementa: ementaReal,
              artigos: artigos,
              areas_direito: lei.areas_direito,
              texto_formatado: textoFinal,
              ordem_dou: lei.ordem_dou,
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("resenha_diaria")
            .insert({
              numero_lei: lei.numero_lei,
              ementa: ementaReal,
              data_publicacao: lei.data_publicacao || lei.data_dou,
              url_planalto: lei.url_planalto,
              artigos: artigos,
              areas_direito: lei.areas_direito,
              texto_formatado: textoFinal,
              status: "ativo",
              ordem_dou: lei.ordem_dou,
            });
        }

        console.log(`✅ ${lei.numero_lei} formatada com ${artigos.length} artigos`);
        
        // Gerar explicações automaticamente
        try {
          console.log(`📝 Gerando explicações para ${lei.numero_lei}...`);
          const responseExplicacoes = await fetch(
            `${supabaseUrl}/functions/v1/gerar-explicacoes-resenha`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ lei_id: lei.numero_lei }),
            }
          );
          
          if (responseExplicacoes.ok) {
            const resultExplicacoes = await responseExplicacoes.json();
            console.log(`✅ Explicações geradas: ${resultExplicacoes.artigos_explicados || 0} artigos`);
          } else {
            console.log(`⚠️ Explicações serão geradas depois para ${lei.numero_lei}`);
          }
        } catch (erroExplicacao) {
          console.log(`⚠️ Erro nas explicações de ${lei.numero_lei}:`, erroExplicacao);
        }
        
        processadas++;

        // Pequeno delay entre leis
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Erro em ${lei.numero_lei}:`, error);
        erros++;
      }
    }

    console.log(`🎉 Automação concluída! ${processadas} processadas, ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        processadas,
        erros,
        total: leis.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na automação:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extrairEmentaReal(textoFormatado: string): string | null {
  if (!textoFormatado) return null;

  // Regex melhorado: captura desde o verbo até encontrar "O PRESIDENTE", "Art." ou "###"
  // Usa [\s\S]*? para capturar múltiplas linhas
  const regex =
    /(?:Vigência|Conversão da Medida Provisória|Regulamento|Texto compilado|Mensagem de veto)\s*\n*((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[\s\S]*?)(?=O\s*PRESIDENTE|Art\.\s*1|Art\s1|###|\n\n\n)/i;
  const match = textoFormatado.match(regex);

  if (match && match[1]) {
    return match[1].replace(/\s+/g, " ").trim().substring(0, 800);
  }

  // Fallback: regex direto também com múltiplas linhas
  const regexDireto =
    /((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[\s\S]*?)(?=O\s*PRESIDENTE|Art\.\s*1|Art\s1|###|\n\n\n)/i;
  const matchDireto = textoFormatado.match(regexDireto);

  if (matchDireto && matchDireto[1]) {
    return matchDireto[1].replace(/\s+/g, " ").trim().substring(0, 800);
  }

  return null;
}
