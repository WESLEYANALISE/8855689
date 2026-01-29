import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, titulo } = await req.json();
    
    if (!videoId) {
      throw new Error("videoId é obrigatório");
    }

    console.log("Gerando resumo do vídeo:", videoId);

    // Obter transcrição do vídeo com timeout
    const transcriptionController = new AbortController();
    const transcriptionTimeout = setTimeout(() => transcriptionController.abort(), 30000); // 30s timeout

    let transcriptionResponse;
    try {
      transcriptionResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/obter-transcricao-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ videoId }),
          signal: transcriptionController.signal,
        }
      );
    } catch (error) {
      clearTimeout(transcriptionTimeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Timeout ao obter transcrição do vídeo. Tente novamente.");
      }
      throw new Error("Erro de conexão ao obter transcrição");
    } finally {
      clearTimeout(transcriptionTimeout);
    }

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.json();
      throw new Error(error.error || "Não foi possível obter a transcrição do vídeo");
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.transcription;
    const isFallback = transcriptionData.isFallback || false;

    // Gerar resumo com Gemini
    const promptPrefix = isFallback 
      ? "Com base no título e descrição deste vídeo educacional, crie um resumo estruturado:"
      : "Você é um especialista em educação jurídica. Analise a transcrição desta videoaula e crie um resumo COMPLETO e DIDÁTICO.";

    const prompt = `${promptPrefix}

**TÍTULO DA AULA:** ${titulo || "Videoaula"}

**CONTEÚDO:**
${transcription}

**INSTRUÇÕES:**
- Crie um resumo estruturado em Markdown
- Use emojis profissionais (⚖️ 📚 📌 💡 ⭐ 🎯 etc)
- Organize em seções claras:
  1. 🎯 **Tema Principal** - qual o assunto central da aula
  2. 📚 **Tópicos Abordados** - liste os principais tópicos ${isFallback ? 'que provavelmente serão' : ''} abordados
  3. 💡 **Conceitos-Chave** - destaque os conceitos ${isFallback ? 'relacionados ao tema' : 'principais explicados'}
  4. 📖 **Aplicação Prática** - ${isFallback ? 'onde e como esse conhecimento pode ser aplicado' : 'exemplos práticos mencionados'}
  5. ⭐ **Pontos de Destaque** - principais ${isFallback ? 'aspectos importantes do tema' : 'aprendizados e pontos de atenção'}
- Seja detalhado mas objetivo
- Use listas numeradas e bullets
- ${isFallback ? 'Baseie-se no contexto jurídico geral do tema' : 'Cite artigos de lei mencionados'}
- Mantenha a linguagem clara e acessível
${isFallback ? '\n**IMPORTANTE:** Como não há transcrição completa disponível, este resumo é baseado no título e descrição do vídeo, fornecendo uma visão geral do tema.' : ''}

Gere o resumo completo:`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar resumo:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Falha ao gerar resumo com IA");
    }

    const aiData = await aiResponse.json();
    const resumo = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("Resumo gerado com sucesso");

    return new Response(
      JSON.stringify({ 
        resumo,
        titulo: titulo || "Resumo da Videoaula"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função gerar-resumo-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
