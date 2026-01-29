import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApifyPost {
  id: string;
  shortCode: string;
  caption?: string;
  displayUrl?: string;
  videoUrl?: string;
  images?: Array<{ src: string }>;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
  ownerUsername?: string;
  type?: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usernames, resultsLimit = 20, tipo = "posts" } = await req.json();

    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_API_TOKEN) {
      throw new Error("APIFY_API_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      throw new Error("Forneça ao menos um username");
    }

    console.log(`Buscando ${tipo} de: ${usernames.join(", ")}`);

    // Escolher o Actor baseado no tipo
    const actorId = tipo === "reels" 
      ? "apify~instagram-reel-scraper"
      : "apify~instagram-post-scraper";

    // Chamar Apify - usa "username" (array) não "usernames"
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernames, // API espera "username" como array
          resultsLimit,
        }),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error("Erro Apify:", errorText);
      throw new Error(`Erro ao buscar do Instagram: ${apifyResponse.status}`);
    }

    const posts: ApifyPost[] = await apifyResponse.json();
    console.log(`Recebidos ${posts.length} posts do Apify`);

    // Processar e salvar posts
    const resultados = [];
    for (const post of posts) {
      try {
        // Extrair título da legenda (primeira linha)
        const legenda = post.caption || "";
        const titulo = legenda.split("\n")[0].substring(0, 200) || "Post do Instagram";

        // Preparar imagens
        const imagens = post.images?.map((img, i) => ({
          slideNumero: i + 1,
          url: img.src,
        })) || (post.displayUrl ? [{ slideNumero: 1, url: post.displayUrl }] : []);

        // Determinar tipo de mídia
        const tipoMidia = post.videoUrl ? "reel" : (imagens.length > 1 ? "carrossel" : "imagem");

        // Inserir/atualizar no banco
        const { data, error } = await supabase
          .from("posts_juridicos")
          .upsert({
            instagram_id: post.id,
            titulo,
            legenda,
            imagens,
            video_url: post.videoUrl || null,
            tipo_midia: tipoMidia,
            fonte: "instagram",
            fonte_perfil: post.ownerUsername || usernames[0],
            fonte_url: post.url || `https://instagram.com/p/${post.shortCode}`,
            likes_original: post.likesCount || 0,
            comentarios_original: post.commentsCount || 0,
            data_publicacao: post.timestamp || new Date().toISOString(),
            status: "publicado",
          }, { 
            onConflict: "instagram_id",
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) {
          console.error(`Erro ao salvar post ${post.id}:`, error);
          continue;
        }

        resultados.push({
          id: data.id,
          instagram_id: post.id,
          titulo,
          tipo_midia: tipoMidia,
          perfil: post.ownerUsername,
        });
      } catch (e) {
        console.error(`Erro processando post ${post.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Importados ${resultados.length} posts de ${usernames.length} perfis`,
        total: resultados.length,
        posts: resultados,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
