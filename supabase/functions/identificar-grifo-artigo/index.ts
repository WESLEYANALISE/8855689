import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter chaves Gemini com fallback
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const keyPremium = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (keyPremium) keys.push(keyPremium);
  
  return keys;
}

async function callGeminiWithFallback(prompt: string, keys: string[]): Promise<string> {
  for (let i = 0; i < keys.length; i++) {
    try {
      console.log(`🔑 Tentando chave Gemini ${i + 1}/${keys.length}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys[i]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`⚠️ Chave ${i + 1} retornou ${response.status}, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na chave ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      console.error(`Erro com chave ${i + 1}:`, error);
      continue;
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoArtigo, enunciado, alternativaCorreta, comentario, tabelaCodigo, numeroArtigo, questaoId, salvarCache } = await req.json();

    if (!textoArtigo || !enunciado) {
      return new Response(
        JSON.stringify({ error: "Texto do artigo e enunciado são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se tabelaCodigo e numeroArtigo foram fornecidos, verificar cache primeiro
    if (tabelaCodigo && numeroArtigo) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: cacheData } = await supabase
        .from('questoes_grifos_cache')
        .select('trechos_grifados')
        .eq('tabela_codigo', tabelaCodigo)
        .eq('numero_artigo', numeroArtigo)
        .maybeSingle();

      if (cacheData?.trechos_grifados && cacheData.trechos_grifados.length > 0) {
        console.log("✅ Grifos encontrados no cache");
        return new Response(
          JSON.stringify({ trechos: cacheData.trechos_grifados, fromCache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const keys = getGeminiKeys();
    if (keys.length === 0) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    console.log(`🔑 ${keys.length} chaves Gemini disponíveis`);

    const prompt = `Você é um especialista em análise de textos jurídicos. Sua tarefa é identificar APENAS as palavras ou frases CURTAS do artigo que correspondem DIRETAMENTE à resposta correta da questão.

ARTIGO DE LEI:
"${textoArtigo}"

QUESTÃO/ENUNCIADO:
"${enunciado}"

ALTERNATIVA CORRETA:
"${alternativaCorreta || 'Não informada'}"

REGRAS ESTRITAS:
1. Grife APENAS as palavras que aparecem na alternativa correta E no artigo
2. NÃO grife frases inteiras ou parágrafos - apenas os termos específicos relevantes
3. Se a alternativa correta é "instrumento público", grife APENAS "instrumento público" no artigo
4. Se a alternativa menciona um prazo como "30 dias", grife APENAS "trinta dias" ou "30 dias" no artigo
5. Grife no MÁXIMO 2 trechos curtos (cada um com no máximo 30 caracteres)
6. Os trechos devem ser copiados EXATAMENTE como aparecem no artigo

EXEMPLO:
- Se a pergunta é sobre emancipação por instrumento público
- E a alternativa correta é "Instrumento público"
- Grife APENAS: "instrumento público" (não parágrafos inteiros)

Responda APENAS em formato JSON válido:
{
  "trechos": ["termo exato 1", "termo exato 2"]
}`;

    console.log("🔍 Identificando trechos para grifo com Gemini...");

    const content = await callGeminiWithFallback(prompt, keys);

    console.log("📝 Resposta do Gemini:", content);

    // Extrair JSON da resposta
    let trechos: string[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        trechos = parsed.trechos || [];
      }
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      const trechoMatches = content.match(/"([^"]{10,})"/g);
      if (trechoMatches) {
        trechos = trechoMatches.map((t: string) => t.replace(/"/g, '')).slice(0, 3);
      }
    }

    // Validar que os trechos existem no artigo (mínimo 5 caracteres, máximo 2 trechos)
    const trechosValidados = trechos.filter((trecho: string) => {
      const normalizado = trecho.toLowerCase().trim();
      return textoArtigo.toLowerCase().includes(normalizado) && trecho.length >= 5;
    }).slice(0, 2);

    console.log("✅ Trechos validados:", trechosValidados);

    // Salvar no cache se solicitado
    if (salvarCache && tabelaCodigo && numeroArtigo && trechosValidados.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: upsertError } = await supabase
        .from('questoes_grifos_cache')
        .upsert({
          tabela_codigo: tabelaCodigo,
          numero_artigo: numeroArtigo,
          questao_id: questaoId,
          trechos_grifados: trechosValidados,
          texto_artigo: textoArtigo.substring(0, 5000), // Limitar tamanho
          enunciado: enunciado.substring(0, 1000),
          alternativa_correta: alternativaCorreta?.substring(0, 500),
        }, {
          onConflict: 'tabela_codigo,numero_artigo'
        });

      if (upsertError) {
        console.error("Erro ao salvar no cache:", upsertError);
      } else {
        console.log("💾 Grifos salvos no cache");
      }
    }

    return new Response(
      JSON.stringify({ trechos: trechosValidados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("❌ Erro em identificar-grifo-artigo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido", trechos: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});