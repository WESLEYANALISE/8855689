import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rotação de chaves Gemini
function getGeminiKey(): string {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("Nenhuma chave Gemini configurada");
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentarioId, titulo, descricao } = await req.json();

    if (!documentarioId || !descricao) {
      return new Response(
        JSON.stringify({ error: "ID e descrição são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKey = getGeminiKey();
    console.log("Usando chave Gemini para análise do documentário");

    const prompt = `Você é um especialista em documentários jurídicos. Analise o seguinte documentário e forneça uma análise completa em português brasileiro.

**Título:** ${titulo}

**Descrição do documentário:**
${descricao}

Forneça uma análise estruturada com:

## 📺 Sobre o Documentário
Uma breve sinopse do que se trata o documentário.

## 🎯 Temas Principais
Liste os principais temas jurídicos abordados.

## 📚 Relevância Jurídica
Explique a importância deste documentário para estudantes e profissionais do direito.

## 💡 O Que Você Vai Aprender
Pontos-chave que o espectador pode extrair do documentário.

## 🔗 Áreas do Direito Relacionadas
Quais áreas do direito estão mais relacionadas ao tema.

Seja objetivo, informativo e mantenha um tom didático.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Gemini:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const analise = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analise) {
      throw new Error("Resposta vazia da IA");
    }

    // Salvar análise no banco
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("documentarios_juridicos")
      .update({ analise_ia: analise })
      .eq("id", documentarioId);

    if (updateError) {
      console.error("Erro ao salvar análise:", updateError);
    }

    console.log("Análise gerada com sucesso para:", titulo);

    return new Response(
      JSON.stringify({ analise }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
