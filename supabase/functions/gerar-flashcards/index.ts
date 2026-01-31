import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v3.5.0-gemini-2.5";
const MODEL = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pool de chaves API (1, 2, 3) - igual à professora
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
  console.log(`[gerar-flashcards] Iniciando com ${GEMINI_KEYS.length} chaves disponíveis`);
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[i];
    console.log(`[gerar-flashcards] Tentando chave ${i + 1}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: config,
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[gerar-flashcards] Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        if (errorText.includes('API key expired') || errorText.includes('INVALID_ARGUMENT')) {
          console.log(`[gerar-flashcards] Chave ${i + 1} expirada/inválida, tentando próxima...`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-flashcards] Erro na chave ${i + 1}: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[gerar-flashcards] ✅ Sucesso com chave ${i + 1}`);
        return text;
      } else {
        console.log(`[gerar-flashcards] Resposta vazia da chave ${i + 1}`);
        continue;
      }
    } catch (error) {
      console.error(`[gerar-flashcards] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves API esgotadas ou com erro');
}

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards@${REVISION}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, conteudo, tableName, numeroArtigo, area, artigo, tipo } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (GEMINI_KEYS.length === 0) {
      throw new Error("Nenhuma chave GEMINI_KEY_1/2/3 configurada");
    }
    
    console.log(`✅ ${GEMINI_KEYS.length} chaves Gemini disponíveis`);
    console.log(`🤖 Usando modelo: ${MODEL}`);
    console.log(`📚 Tipo: ${tipo || 'flashcards'}, Área: ${area}, Artigo: ${numeroArtigo || artigo}`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ========== MODO LACUNAS ==========
    if (tipo === 'lacunas') {
      const textoConteudo = conteudo || content;
      const artigoNumero = artigo || numeroArtigo;
      
      if (!textoConteudo) {
        return new Response(
          JSON.stringify({ error: "Conteúdo é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar cache em COMPLETE_LEI_CACHE
      if (area && artigoNumero) {
        const { data: cached } = await supabase
          .from("COMPLETE_LEI_CACHE")
          .select('*')
          .eq('area', area)
          .eq('artigo', artigoNumero)
          .single();

        if (cached) {
          console.log(`✅ Retornando exercício de lacunas do cache`);
          return new Response(
            JSON.stringify({
              textoComLacunas: cached.texto_com_lacunas,
              palavras: cached.palavras,
              lacunas: cached.lacunas,
              cached: true
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Gerar exercício de lacunas com IA
      const lacunasPrompt = `Você é um assistente educacional especializado em criar exercícios de preenchimento de lacunas para estudantes de Direito.

Dado o seguinte texto legal, crie um exercício de "complete a lei":

TEXTO:
${textoConteudo}

INSTRUÇÕES:
1. Identifique entre 4 e 8 palavras-chave importantes do texto (termos jurídicos, substantivos relevantes, verbos principais)
2. Substitua cada palavra-chave por "_____" no texto
3. Liste as palavras removidas (na ordem que aparecem no texto)
4. Para cada lacuna, indique sua posição (0, 1, 2...) e a palavra correta

RETORNE APENAS um JSON válido neste formato exato:
{
  "textoComLacunas": "O texto com as _____ no lugar das palavras removidas",
  "palavras": ["palavra1", "palavra2", "palavra3"],
  "lacunas": [
    {"posicao": 0, "palavraCorreta": "palavra1"},
    {"posicao": 1, "palavraCorreta": "palavra2"},
    {"posicao": 2, "palavraCorreta": "palavra3"}
  ]
}

IMPORTANTE:
- O número de "_____" no texto DEVE ser igual ao número de palavras no array
- Cada lacuna deve ter uma posição correspondente (0 para primeira lacuna, 1 para segunda, etc.)
- Retorne APENAS o JSON, sem explicações adicionais.`;

      console.log("🚀 Gerando exercício de lacunas...");

      const text = await callGeminiWithFallback(lacunasPrompt, { temperature: 0.3, maxOutputTokens: 4000 });
      
      // Parse JSON
      let jsonText = text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      jsonText = jsonText.trim();
      if (!jsonText.startsWith('{')) {
        const startIndex = jsonText.indexOf('{');
        if (startIndex !== -1) {
          jsonText = jsonText.substring(startIndex);
        }
      }

      const parsed = JSON.parse(jsonText);
      
      if (!parsed.textoComLacunas || !parsed.palavras || !parsed.lacunas) {
        throw new Error("Formato de resposta inválido");
      }

      console.log(`✅ Exercício gerado com ${parsed.lacunas.length} lacunas`);

      // Salvar no cache
      if (area && artigoNumero) {
        try {
          const { error: insertError } = await supabase
            .from("COMPLETE_LEI_CACHE")
            .insert({
              area: area,
              artigo: artigoNumero,
              texto_com_lacunas: parsed.textoComLacunas,
              palavras: parsed.palavras,
              lacunas: parsed.lacunas,
            });

          if (insertError) {
            console.error("❌ Erro ao salvar cache:", insertError);
          } else {
            console.log("💾 Exercício salvo no cache");
          }
        } catch (e) {
          console.error("❌ Erro ao salvar cache:", e);
        }
      }

      return new Response(
        JSON.stringify({
          textoComLacunas: parsed.textoComLacunas,
          palavras: parsed.palavras,
          lacunas: parsed.lacunas,
          cached: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== MODO FLASHCARDS (comportamento original) ==========
    // Verificar se já existem flashcards em cache na tabela FLASHCARDS - ARTIGOS LEI
    if (area && numeroArtigo && tipo !== 'chat') {
      const { data: cached } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select('*')
        .eq('area', area)
        .eq('tema', parseInt(numeroArtigo));

      if (cached && cached.length > 0) {
        console.log(`✅ Retornando ${cached.length} flashcards do cache - 0 tokens gastos`);
        return new Response(
          JSON.stringify({ 
            flashcards: cached.map(f => ({ 
              id: f.id,
              front: f.pergunta, 
              back: f.resposta, 
              exemplo: f.exemplo,
              base_legal: f.base_legal,
              url_imagem_exemplo: f.url_imagem_exemplo,
              url_audio_exemplo: f.url_audio_exemplo,
              "audio-pergunta": f["audio-pergunta"],
              "audio-resposta": f["audio-resposta"],
            })), 
            cached: true,
            count: cached.length 
          }),
          { 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "X-Function-Revision": REVISION,
              "X-Model": MODEL,
            } 
          }
        );
      }
    }

    const systemPrompt = `Você é um professor de Direito especialista em criar flashcards.

REGRAS OBRIGATÓRIAS:
1. Analise TODO o conteúdo do artigo
2. Crie flashcards para CADA conceito/aspecto importante
3. MÍNIMO 10 flashcards, crie quantos forem necessários para cobrir tudo
4. PROIBIDO REPETIR - cada flashcard DEVE ser sobre tema/aspecto DIFERENTE
5. VARIE os tipos de perguntas:
   - Conceito (O que é...?)
   - Requisitos (Quais os requisitos...?)
   - Aplicação (Quando se aplica...?)
   - Exceções (Em que casos não se aplica...?)
   - Prazos (Qual o prazo...?)
   - Penas/Sanções (Qual a consequência...?)
   - Sujeitos (Quem pode...?)
6. EXEMPLO PRÁTICO OBRIGATÓRIO - situação CONCRETA da vida real com nomes fictícios, mostrando a aplicação do conceito
7. BASE LEGAL OBRIGATÓRIA - cite artigos, parágrafos, incisos, leis, súmulas, jurisprudências relevantes
8. Respostas CONCISAS e diretas
9. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `Analise este artigo e crie flashcards para cobrir TODO o conteúdo:

${content}

INSTRUÇÕES:
- Identifique TODOS os conceitos, requisitos, exceções, prazos e regras
- Crie flashcard para CADA aspecto (mínimo 10, sem máximo)
- NÃO REPITA conceitos - cada flashcard único
- EXEMPLO PRÁTICO obrigatório: situação real com nomes (João, Maria, empresa X) mostrando a aplicação prática
- BASE LEGAL obrigatória: cite o artigo específico, parágrafos, leis relacionadas, súmulas se houver

JSON formato:
{"flashcards":[{"front":"pergunta","back":"resposta","exemplo":"João comprou um carro usado de Maria. Depois descobriu um defeito oculto. João pode pedir abatimento do preço dentro de 30 dias, pois aplica-se o vício redibitório.","base_legal":"Art. 441 a 446 do Código Civil; Súmula 388 STJ"}]}`;

    console.log("🚀 Gerando flashcards com Gemini...");

    const text = await callGeminiWithFallback(
      `${systemPrompt}\n\n${userPrompt}`,
      { temperature: 0.5, maxOutputTokens: 16000 }
    );
    
    console.log("📝 Resposta bruta recebida, processando...");
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Clean up the JSON text
    jsonText = jsonText.trim();
    if (!jsonText.startsWith('{')) {
      const startIndex = jsonText.indexOf('{');
      if (startIndex !== -1) {
        jsonText = jsonText.substring(startIndex);
      }
    }
    
    // Tentar reparar JSON truncado
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.log("⚠️ JSON truncado, tentando reparar...");
      
      // Encontrar último flashcard completo
      const lastCompleteIndex = jsonText.lastIndexOf('{"front"');
      if (lastCompleteIndex > 0) {
        // Verificar se tem um flashcard completo antes
        const beforeLast = jsonText.substring(0, lastCompleteIndex);
        const lastBraceIndex = beforeLast.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          jsonText = beforeLast.substring(0, lastBraceIndex + 1) + ']}';
          console.log("🔧 JSON reparado, tentando parse novamente...");
          try {
            parsed = JSON.parse(jsonText);
          } catch {
            // Fallback: extrair flashcards individualmente com regex
            console.log("🔧 Tentando extração por regex...");
            const flashcardRegex = /\{"front"\s*:\s*"([^"]+)"\s*,\s*"back"\s*:\s*"([^"]+)"\s*,\s*"exemplo"\s*:\s*"([^"]+)"\s*\}/g;
            const matches = [...jsonText.matchAll(flashcardRegex)];
            if (matches.length > 0) {
              parsed = {
                flashcards: matches.map(m => ({ front: m[1], back: m[2], exemplo: m[3] }))
              };
              console.log(`✅ Extraídos ${matches.length} flashcards via regex`);
            } else {
              throw new Error("Não foi possível extrair flashcards do JSON");
            }
          }
        } else {
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }
    
    const flashcards = parsed.flashcards;

    console.log(`✅ ${flashcards.length} flashcards gerados`);

    // Salvar flashcards na tabela FLASHCARDS - ARTIGOS LEI (cada um como uma linha)
    if (area && numeroArtigo && flashcards && flashcards.length > 0 && tipo !== 'chat') {
      try {
        const flashcardsToInsert = flashcards.map((f: any) => ({
          area: area,
          tema: parseInt(numeroArtigo),
          pergunta: f.front,
          resposta: f.back,
          exemplo: f.exemplo || null,
          base_legal: f.base_legal || null,
        }));

        const { error: insertError } = await supabase
          .from("FLASHCARDS - ARTIGOS LEI")
          .insert(flashcardsToInsert);

        if (insertError) {
          console.error(`❌ Erro ao salvar flashcards:`, insertError);
        } else {
          console.log(`💾 ${flashcards.length} flashcards salvos na tabela FLASHCARDS - ARTIGOS LEI`);
          console.log(`📊 Próximos requests para ${area} Art. ${numeroArtigo} usarão cache (0 tokens)`);
        }
      } catch (e) {
        console.error(`❌ Erro ao salvar flashcards:`, e);
      }
    }

    return new Response(
      JSON.stringify({ 
        flashcards: flashcards.map((f: any) => ({ 
          front: f.front, 
          back: f.back, 
          exemplo: f.exemplo,
          base_legal: f.base_legal 
        })), 
        cached: false,
        count: flashcards.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        } 
      }
    );
  } catch (error) {
    console.error("❌ Erro em gerar-flashcards:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: "google",
        model: MODEL,
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        },
      }
    );
  }
});
