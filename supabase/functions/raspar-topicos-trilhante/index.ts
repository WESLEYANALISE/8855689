import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de matérias para slugs do Trilhante
const MATERIAS_TRILHANTE: Record<string, string> = {
  "História do Direito": "historia-do-direito",
  "Teoria Geral dos Prazos e Prazos na LINDB": "teoria-geral-dos-prazos-e-prazos-na-lindb",
  "Iniciando no Mundo do Direito": "iniciando-no-mundo-do-direito",
  "Introdução ao Estudo do Direito": "introducao-ao-estudo-do-direito",
  "Filosofia do Direito": "filosofia-do-direito",
  "Hans Kelsen": "hans-kelsen",
  "Introdução à Sociologia do Direito": "introducao-a-sociologia-do-direito",
  "Direito Romano": "direito-romano",
  "Teoria Geral dos Direitos Humanos": "teoria-geral-dos-direitos-humanos",
  "Direitos da Personalidade": "direitos-da-personalidade",
  "LINDB": "lindb",
  "Pessoas no Código Civil": "pessoas-no-codigo-civil",
  "A Formação do Capitalismo": "a-formacao-do-capitalismo",
  "História Constitucional do Brasil": "historia-constitucional-do-brasil",
  "Constitucionalismo e Classificação das Constituições": "constitucionalismo-e-classificacao-das-constituicoes",
  "Noções Gerais de Direito Penal": "nocoes-gerais-de-direito-penal",
};

async function fetchTopicosFromTrilhante(cursoSlug: string): Promise<Array<{ titulo: string; urlLeitura: string; ordem: number }>> {
  const url = `https://trilhante.com.br/trilha/iniciando-no-mundo-do-direito/curso/${cursoSlug}`;
  
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    console.error(`Error fetching ${url}: ${response.status}`);
    return [];
  }

  const html = await response.text();
  console.log(`HTML length: ${html.length} chars`);
  
  // Debug: log um trecho do HTML para ver o formato
  const sampleStart = html.indexOf('Conteúdo do Curso');
  if (sampleStart > -1) {
    console.log(`Sample around 'Conteúdo do Curso': ${html.substring(sampleStart, sampleStart + 500)}`);
  }
  
  const topicos: Array<{ titulo: string; urlLeitura: string; ordem: number }> = [];
  const seen = new Set<string>();
  let ordem = 1;
  
  // Padrão 1: Links com tag <a> que contêm "Leitura" no texto
  // Formato: <a href="...aula/slug"...>Título</a>...Leitura
  const pattern1 = /<a[^>]+href="([^"]*\/aula\/[^"]+)"[^>]*>([^<]+)<\/a>[^<]*<[^>]*>[^<]*Leitura/gi;
  
  // Padrão 2: Estrutura de lista com data attributes
  // Formato: href="...aula/slug"...>Título<...Leitura
  const pattern2 = /href="(https?:\/\/trilhante\.com\.br[^"]*\/aula\/([^"]+))"[^>]*>\s*<[^>]*>\s*([^<]+)/gi;
  
  // Padrão 3: Qualquer link de aula seguido por marcador de leitura
  const pattern3 = /href="([^"]*trilhante[^"]*\/aula\/([^"]+))"[^>]*>([^<]*)</gi;
  
  let match;
  
  // Tentar padrão 1
  while ((match = pattern1.exec(html)) !== null) {
    const [, urlCompleta, titulo] = match;
    const tituloLimpo = titulo.trim();
    
    if (seen.has(tituloLimpo) || tituloLimpo.toLowerCase().includes('parte')) continue;
    
    seen.add(tituloLimpo);
    topicos.push({ titulo: tituloLimpo, urlLeitura: urlCompleta, ordem: ordem++ });
  }
  
  // Se não encontrou nada, tentar padrão 3 com filtro por "Leitura"
  if (topicos.length === 0) {
    // Buscar todas as seções que contêm "Leitura" (não vídeo nem exercício)
    const leituraBlocks = html.split(/Leitura(?:Grátis)?/i);
    
    for (let i = 0; i < leituraBlocks.length - 1; i++) {
      const block = leituraBlocks[i];
      
      // Pegar o último link antes de "Leitura"
      const lastLinkMatch = [...block.matchAll(/href="([^"]*\/aula\/([^"]+))"[^>]*>(?:<[^>]*>)*([^<]*)/gi)].pop();
      
      if (lastLinkMatch) {
        const [, urlCompleta, slug, titulo] = lastLinkMatch;
        const tituloLimpo = titulo.trim().replace(/\s+/g, ' ');
        
        // Ignorar partes, exercícios, vídeos
        if (seen.has(tituloLimpo) || 
            tituloLimpo.toLowerCase().includes('parte') ||
            slug.endsWith('-2') ||
            slug.includes('exercicio') ||
            tituloLimpo.length < 3) {
          continue;
        }
        
        seen.add(tituloLimpo);
        topicos.push({ titulo: tituloLimpo, urlLeitura: urlCompleta, ordem: ordem++ });
      }
    }
  }
  
  console.log(`Found ${topicos.length} topics for ${cursoSlug}:`, topicos.map(t => t.titulo));
  
  return topicos;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { materiaId, teste } = await req.json().catch(() => ({}));

    // Modo teste: apenas tenta um curso e retorna debug
    if (teste) {
      const topicos = await fetchTopicosFromTrilhante("historia-do-direito");
      return new Response(
        JSON.stringify({ teste: true, topicos }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar matérias para processar
    let query = supabase
      .from("conceitos_materias")
      .select("*")
      .eq("ativo", true);
    
    if (materiaId) {
      query = query.eq("id", materiaId);
    }
    
    const { data: materias, error: materiasError } = await query.order("area_ordem");
    
    if (materiasError) throw materiasError;
    if (!materias || materias.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma matéria encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultados: Array<{ materia: string; topicosInseridos: number; erro?: string }> = [];

    for (const materia of materias) {
      const slug = MATERIAS_TRILHANTE[materia.nome];
      
      if (!slug) {
        console.log(`Slug não mapeado para: ${materia.nome}`);
        resultados.push({ materia: materia.nome, topicosInseridos: 0, erro: "Slug não mapeado" });
        continue;
      }

      try {
        // Verificar se já tem tópicos
        const { count } = await supabase
          .from("conceitos_topicos")
          .select("*", { count: "exact", head: true })
          .eq("materia_id", materia.id);
        
        if (count && count > 0) {
          console.log(`Matéria ${materia.nome} já tem ${count} tópicos, pulando...`);
          resultados.push({ materia: materia.nome, topicosInseridos: 0, erro: `Já tem ${count} tópicos` });
          continue;
        }

        // Buscar tópicos do Trilhante
        const topicos = await fetchTopicosFromTrilhante(slug);
        
        if (topicos.length === 0) {
          resultados.push({ materia: materia.nome, topicosInseridos: 0, erro: "Nenhum tópico encontrado" });
          continue;
        }

        // Inserir tópicos
        const topicosPraInserir = topicos.map((t) => ({
          materia_id: materia.id,
          titulo: t.titulo,
          ordem: t.ordem,
          url_fonte: t.urlLeitura,
          ativo: true,
        }));

        const { error: insertError } = await supabase
          .from("conceitos_topicos")
          .insert(topicosPraInserir);
        
        if (insertError) throw insertError;

        resultados.push({ materia: materia.nome, topicosInseridos: topicos.length });
        
        // Delay entre requisições para não sobrecarregar
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (err) {
        console.error(`Erro ao processar ${materia.nome}:`, err);
        resultados.push({ materia: materia.nome, topicosInseridos: 0, erro: String(err) });
      }
    }

    const totalInseridos = resultados.reduce((acc, r) => acc + r.topicosInseridos, 0);

    return new Response(
      JSON.stringify({
        success: true,
        totalMaterias: materias.length,
        totalTopicosInseridos: totalInseridos,
        resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
