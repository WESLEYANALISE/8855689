import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

// Configuração das carreiras
const CARREIRAS_CONFIG: Record<string, { nome: string; descricao: string; contexto: string }> = {
  promotor: {
    nome: "Promotor de Justiça",
    descricao: "Ministério Público",
    contexto: "carreira de Promotor de Justiça do Ministério Público, incluindo atribuições, concurso, atuação em áreas criminais e cíveis, defesa da sociedade e fiscalização da lei"
  },
  defensor: {
    nome: "Defensor Público",
    descricao: "Defensoria Pública",
    contexto: "carreira de Defensor Público, incluindo atuação na defesa dos hipossuficientes, acesso à justiça, concurso público, áreas de atuação e importância social"
  },
  procurador: {
    nome: "Procurador",
    descricao: "Advocacia Pública",
    contexto: "carreira de Procurador (AGU, PGE, PGM), incluindo defesa do Estado, consultoria jurídica, concursos, áreas de atuação e diferenças entre as procuradorias"
  },
  pcivil: {
    nome: "Polícia Civil",
    descricao: "Investigação Estadual",
    contexto: "carreira na Polícia Civil, incluindo funções de investigador, escrivão e delegado, procedimentos investigativos, concursos e atuação na segurança pública estadual"
  },
  pmilitar: {
    nome: "Polícia Militar",
    descricao: "Policiamento Ostensivo",
    contexto: "carreira na Polícia Militar, incluindo hierarquia, formação, concursos, policiamento ostensivo, operações especiais e progressão na carreira"
  }
};

async function chamarGemini(prompt: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Chave com limite excedido, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro Gemini: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error) {
      console.error(`Erro com chave Gemini:`, error);
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

async function gerarListaArtigos(carreira: string, config: typeof CARREIRAS_CONFIG[string]): Promise<Array<{ ordem: number; titulo: string; descricao_curta: string; topicos: string[] }>> {
  const prompt = `Você é um especialista em carreiras jurídicas no Brasil.

Gere uma lista de EXATAMENTE 20 artigos educativos sobre a ${config.contexto}.

Para cada artigo, forneça:
1. Um título atrativo e informativo
2. Uma descrição curta (máximo 150 caracteres)
3. 3 tópicos/tags relevantes

IMPORTANTE: Os artigos devem cobrir desde introdução básica até temas avançados, seguindo uma progressão lógica de aprendizado.

Responda APENAS com um JSON válido no formato:
[
  {
    "ordem": 1,
    "titulo": "Título do artigo",
    "descricao_curta": "Descrição breve do conteúdo",
    "topicos": ["tópico1", "tópico2", "tópico3"]
  }
]

Gere exatamente 20 artigos, numerados de 1 a 20.`;

  const response = await chamarGemini(prompt);
  
  // Extrair JSON da resposta
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Não foi possível extrair JSON da resposta");
  }
  
  const artigos = JSON.parse(jsonMatch[0]);
  return artigos;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carreira } = await req.json();

    if (!carreira || !CARREIRAS_CONFIG[carreira]) {
      return new Response(
        JSON.stringify({ error: "Carreira inválida", carreiras_validas: Object.keys(CARREIRAS_CONFIG) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = CARREIRAS_CONFIG[carreira];
    console.log(`Gerando artigos para carreira: ${carreira} (${config.nome})`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existem artigos para esta carreira
    const { data: existingArticles, error: checkError } = await supabase
      .from("BLOGGER_JURIDICO")
      .select("id")
      .eq("categoria", carreira)
      .limit(1);

    if (checkError) {
      throw new Error(`Erro ao verificar artigos existentes: ${checkError.message}`);
    }

    if (existingArticles && existingArticles.length > 0) {
      return new Response(
        JSON.stringify({ message: `Artigos já existem para a carreira ${carreira}`, total: existingArticles.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar lista de artigos
    console.log("Gerando lista de artigos com Gemini...");
    const artigos = await gerarListaArtigos(carreira, config);
    console.log(`Gerados ${artigos.length} artigos`);

    // Inserir artigos no banco
    const artigosParaInserir = artigos.map((artigo) => ({
      categoria: carreira,
      ordem: artigo.ordem,
      titulo: artigo.titulo,
      descricao_curta: artigo.descricao_curta,
      topicos: artigo.topicos,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("BLOGGER_JURIDICO")
      .insert(artigosParaInserir)
      .select();

    if (insertError) {
      throw new Error(`Erro ao inserir artigos: ${insertError.message}`);
    }

    console.log(`Inseridos ${insertedData?.length || 0} artigos com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        carreira,
        artigos_gerados: insertedData?.length || 0,
        artigos: insertedData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
