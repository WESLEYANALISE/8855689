import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnaliseResponse {
  resumo_objetivo: string;
  tema_central: string;
  problema_pesquisa: string;
  objetivo_geral: string;
  metodologia: string;
  principais_conclusoes: string;
  contribuicoes_academicas: string;
  sugestoes_abordagem: string[];
  tema_saturado: boolean;
  atualizacoes_necessarias: string[];
}

async function chamarGemini(prompt: string): Promise<AnaliseResponse> {
  const geminiKeys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
  ].filter(Boolean);
  
  for (const key of geminiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        }
      );
      
      if (!response.ok) {
        console.error(`Gemini error com key: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Tentar extrair JSON da resposta
      const jsonMatch = texto.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error("JSON não encontrado na resposta");
      
    } catch (error) {
      console.error("Erro com chave Gemini:", error);
      continue;
    }
  }
  
  throw new Error("Todas as chaves Gemini falharam");
}

async function extrairTextoPDF(pdfUrl: string, firecrawlApiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pdfUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Falha ao extrair texto do PDF");
    }
    
    const data = await response.json();
    return data.data?.markdown || "";
    
  } catch (error) {
    console.error("Erro ao extrair PDF:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { tccId, titulo, autor, link_acesso, resumo_original, texto_completo } = await req.json();
    
    if (!titulo) {
      return new Response(
        JSON.stringify({ error: "Título do TCC é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    let textoParaAnalise = texto_completo || "";
    
    // Se não tiver texto e tiver link, tentar extrair
    if (!textoParaAnalise && link_acesso && firecrawlApiKey) {
      console.log("Tentando extrair texto do link:", link_acesso);
      textoParaAnalise = await extrairTextoPDF(link_acesso, firecrawlApiKey);
    }
    
    // Usar resumo original como fallback
    if (!textoParaAnalise && resumo_original) {
      textoParaAnalise = resumo_original;
    }
    
    // Se ainda não tiver texto, usar apenas o título
    if (!textoParaAnalise) {
      textoParaAnalise = `Título: ${titulo}\nAutor: ${autor || 'Não informado'}`;
    }
    
    // Limitar texto para evitar tokens excessivos
    const textoTruncado = textoParaAnalise.substring(0, 30000);
    
    const prompt = `Você é um especialista em análise de trabalhos acadêmicos jurídicos brasileiros.

Analise o seguinte TCC/dissertação/tese e forneça uma análise estruturada COMPLETA.

TÍTULO DO TRABALHO:
${titulo}

AUTOR:
${autor || 'Não informado'}

CONTEÚDO DISPONÍVEL:
${textoTruncado}

---

Retorne EXATAMENTE no formato JSON abaixo, SEM markdown, SEM \`\`\`json:

{
  "resumo_objetivo": "Resumo objetivo em até 15 linhas, explicando o que o trabalho aborda, sua importância e principais achados",
  "tema_central": "O tema principal do trabalho em uma frase clara",
  "problema_pesquisa": "Qual problema ou questão o trabalho busca responder",
  "objetivo_geral": "O objetivo principal do trabalho",
  "metodologia": "Método de pesquisa utilizado (revisão bibliográfica, estudo de caso, pesquisa empírica, etc.)",
  "principais_conclusoes": "As principais conclusões e descobertas do trabalho",
  "contribuicoes_academicas": "Qual a contribuição deste trabalho para o Direito brasileiro",
  "sugestoes_abordagem": [
    "Sugestão 1: Uma forma de abordar o mesmo tema de maneira diferente ou complementar",
    "Sugestão 2: Um recorte temático pouco explorado relacionado ao tema",
    "Sugestão 3: Uma atualização possível considerando mudanças legislativas recentes"
  ],
  "tema_saturado": false,
  "atualizacoes_necessarias": [
    "Atualização 1: Lei ou jurisprudência recente que afeta o tema"
  ]
}

IMPORTANTE: 
- Seja específico e detalhado nas análises
- Use linguagem acadêmica mas acessível
- Considere o contexto jurídico brasileiro atual
- Se o conteúdo for limitado, faça inferências baseadas no título e área do Direito`;

    console.log("Chamando Gemini para análise do TCC:", titulo);
    
    const analise = await chamarGemini(prompt);
    
    // Salvar no banco de dados se tiver ID
    if (tccId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error: updateError } = await supabase
        .from("tcc_pesquisas")
        .update({
          resumo_ia: analise.resumo_objetivo,
          tema_central: analise.tema_central,
          problema_pesquisa: analise.problema_pesquisa,
          objetivo_geral: analise.objetivo_geral,
          metodologia: analise.metodologia,
          principais_conclusoes: analise.principais_conclusoes,
          contribuicoes: analise.contribuicoes_academicas,
          sugestoes_abordagem: analise.sugestoes_abordagem,
          tema_saturado: analise.tema_saturado,
          atualizacoes_necessarias: analise.atualizacoes_necessarias,
          texto_completo: textoTruncado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tccId);
      
      if (updateError) {
        console.error("Erro ao salvar análise:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        analise,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro na análise do TCC:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
