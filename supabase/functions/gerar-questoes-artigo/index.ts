import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v9.0.1-model-fix";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para chamar Gemini com fallback de múltiplas chaves
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
  ].filter(Boolean);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`🔑 Tentando chave ${i + 1}/${keys.length}...`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 65000 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log(`✅ Resposta obtida com chave ${i + 1}`);
          return text;
        }
      }

      const errorText = await response.text();
      if (response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
        console.log(`⚠️ Chave ${i + 1} com quota excedida, tentando próxima...`);
        continue;
      }

      console.error(`❌ Erro com chave ${i + 1}: ${response.status}`);
    } catch (error) {
      console.error(`❌ Erro de requisição com chave ${i + 1}:`, error);
    }
  }

  throw new Error("Todas as chaves de API falharam");
}

// Função para fazer parse seguro do JSON
function parseJsonSeguro(text: string): any {
  let jsonText = text;
  
  // Remover markdown
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  jsonText = jsonText.trim();
  if (!jsonText.startsWith('[') && !jsonText.startsWith('{')) {
    const startIndex = Math.min(
      jsonText.indexOf('[') !== -1 ? jsonText.indexOf('[') : Infinity,
      jsonText.indexOf('{') !== -1 ? jsonText.indexOf('{') : Infinity
    );
    if (startIndex !== Infinity) {
      jsonText = jsonText.substring(startIndex);
    }
  }

  try {
    return JSON.parse(jsonText);
  } catch (firstError) {
    console.log("⚠️ Primeiro parse falhou, tentando sanitizar strings...");
    
    const sanitized = jsonText.replace(
      /"([^"\\]*(?:\\.[^"\\]*)*)"/g,
      (match) => match.replace(/[\n\r\t]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return char;
      })
    );
    
    try {
      return JSON.parse(sanitized);
    } catch (secondError) {
      console.error("❌ Erro no JSON.parse após sanitização:", secondError);
      console.log("📄 JSON original (primeiros 500 chars):", jsonText.substring(0, 500));
      throw secondError;
    }
  }
}

// Limites de questões por artigo
function getLimiteQuestoes(): { minimo: number; maximo: number } {
  return { minimo: 10, maximo: 20 };
}

// Função que gera questões para UM ÚNICO artigo em background
// Limite de 10-20 questões com regra anti-repetição
async function gerarQuestoesArtigoBackground(
  content: string,
  numeroArtigo: string,
  area: string
) {
  const limites = getLimiteQuestoes();
  console.log(`🚀 Art. ${numeroArtigo}: Gerando ${limites.minimo}-${limites.maximo} questões DIVERSIFICADAS`);
  
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const prompt = `Você é um professor de Direito especialista em criar questões de múltipla escolha para concursos públicos e OAB.

ÁREA: ${area}
ARTIGO: ${numeroArtigo}

CONTEÚDO DO ARTIGO (LEI SECA):
${content}

=== REGRA SOBRE PARTES VETADAS - CRÍTICO ===
❌ NÃO gere questões sobre incisos, parágrafos ou alíneas marcados como "(VETADO)"
✅ Gere questões APENAS sobre as partes NÃO vetadas do artigo
Se um inciso ou parágrafo contém "(VETADO)", ignore-o completamente e foque nos outros válidos.
Exemplo: Se "V - (VETADO)", não faça nenhuma questão sobre o inciso V.

=== REGRA FUNDAMENTAL ===
TODAS AS QUESTÕES DEVEM SER BASEADAS EXCLUSIVAMENTE NO TEXTO LITERAL DO ARTIGO ACIMA.
NÃO invente informações. NÃO adicione conceitos que não estão no artigo.
Cada questão deve testar o conhecimento do texto exato da lei (excluindo partes vetadas).

=== ⚠️ REGRA ANTI-REPETIÇÃO - CRÍTICO ===
❌ É PROIBIDO criar mais de 1 questão sobre o MESMO CONCEITO
❌ Reformular a mesma pergunta de outro jeito conta como REPETIÇÃO
❌ Criar várias questões que têm A MESMA RESPOSTA CORRETA = REPETIÇÃO

ANTES de criar cada questão, verifique mentalmente:
"O conceito-chave desta questão já foi abordado em alguma anterior?"
- Se SIM → NÃO crie esta questão, passe para outro conceito
- Se NÃO → Pode criar

Exemplos de REPETIÇÃO PROIBIDA:
- Questão 1: "A quem são devidos os honorários de sucumbência?"
- Questão 2: "A empresa X obteve honorários. A quem são devidos?"
→ MESMO CONCEITO = REPETIÇÃO = PROIBIDO

CADA QUESTÃO DEVE TESTAR UM CONCEITO ÚNICO E DIFERENTE DO ARTIGO.

=== LIMITE DE QUESTÕES ===
- MÍNIMO: 10 questões
- MÁXIMO: 20 questões
- Artigo simples (poucos incisos): 10-12 questões
- Artigo complexo (muitos parágrafos): 15-20 questões
- QUALIDADE E DIVERSIDADE > QUANTIDADE

=== INSTRUÇÕES PRINCIPAIS ===
1. Analise o artigo e identifique TODOS os conceitos distintos
2. Crie UMA questão para cada conceito (não duas sobre o mesmo)
3. Cada questão deve ter exatamente 4 alternativas (a, b, c, d)
4. Inclua um EXEMPLO PRÁTICO NARRATIVO para cada questão

=== EXEMPLO PRÁTICO - REGRA CRÍTICA ===
O exemplo_pratico deve ser baseado em um CASO REAL ou JURISPRUDÊNCIA que se encaixa perfeitamente com o artigo.
- ❌ NUNCA faça perguntas no exemplo prático
- ❌ NUNCA use "Qual...", "O que...", "Como..." no exemplo
- ❌ NUNCA invente situações genéricas sem fundamentação
- ✅ BASEIE-SE em casos reais, jurisprudência, ou situações do cotidiano forense
- ✅ Use nomes fictícios mas SITUAÇÕES REAIS (adaptadas de julgados, notícias jurídicas, casos famosos)
- ✅ Mencione o tribunal ou contexto quando aplicável (ex: "Em caso julgado pelo STJ...", "Na prática forense...")
- ✅ Descreva a situação real, como o artigo foi aplicado e qual foi o desfecho
- 6-10 frases narrativas que ILUSTRAM A APLICAÇÃO REAL DO ARTIGO

TIPOS DE EXEMPLOS A USAR (escolha o mais adequado):
1. **Jurisprudência adaptada**: Casos julgados por tribunais superiores (STF, STJ, TST, TRFs)
2. **Casos emblemáticos**: Situações conhecidas no meio jurídico
3. **Cotidiano forense**: Situações que advogados e juízes enfrentam rotineiramente
4. **Notícias jurídicas**: Casos que foram notícia pela aplicação do artigo

Exemplo CORRETO de exemplo_pratico:
"Em caso semelhante julgado pelo STJ, um empresário foi acusado de sonegação fiscal após omitir receitas em sua declaração. O Ministério Público ofereceu denúncia com base no artigo estudado. A defesa alegou que houve apenas erro contábil. O tribunal analisou as provas e concluiu que havia dolo na conduta. O réu foi condenado nos termos do artigo, com pena agravada pela posição de garante. Este caso ilustra como o artigo é aplicado quando há omissão dolosa de informações fiscais."

Exemplo ERRADO (NÃO FAZER - muito genérico):
"João cometeu um crime. Ele foi julgado. O juiz aplicou a pena. Fim."

=== REGRAS DE TAMANHO - CRÍTICO ===

📏 ENUNCIADOS:
- QUESTÕES LITERAIS: Máximo 3 frases curtas
- QUESTÕES DE APLICAÇÃO: Máximo 4 frases no caso prático
- QUESTÕES DECOREBA: Máximo 1-2 frases

📏 ALTERNATIVAS - OBRIGATÓRIO:
- Cada alternativa deve ter NO MÁXIMO 12-18 palavras
- Seja DIRETO e OBJETIVO
- Nunca repita o texto da pergunta na alternativa

❌ EXEMPLO ERRADO (muito longa):
"a": "Constitui crime de tortura submeter alguém, sob sua guarda, poder ou autoridade, com emprego de violência ou grave ameaça, a intenso sofrimento físico ou mental"

✅ EXEMPLO CORRETO (curta):
"a": "Reclusão de 2 a 8 anos"
"a": "Sofrimento físico ou mental intenso"
"a": "Sim, é crime próprio"

=== TIPO DE QUESTÕES - BASEADAS NA LEI SECA ===
TODAS as questões devem ter como fundamento o texto literal do artigo:

1. **QUESTÕES LITERAIS (35%)**: Máximo 3 frases. Reproduz trechos exatos do artigo.
   Exemplos:
   - "Qual a pena prevista no Art. ${numeroArtigo}?"
   - "Conforme o Art. ${numeroArtigo}, é correto afirmar:"
   - "Nos termos do Art. ${numeroArtigo}, assinale a correta:"

2. **QUESTÕES DE APLICAÇÃO (35%)**: Máximo 4 frases no caso prático.
   O caso deve ser CURTO e resolvido pelo texto literal do artigo.

3. **QUESTÕES RÁPIDAS/DECOREBA (30%)**: Máximo 1-2 frases. DIRETAS ao ponto.
   
   Tipos (use todos aplicáveis):
   - 📌 DEFINIÇÕES: "O que é [termo] conforme o artigo?"
   - ⚖️ PENAS: "Qual a pena para [conduta]?"
   - ⏰ PRAZOS: "Qual o prazo para [...]?"
   - 🔢 QUANTITATIVOS: "Quanto é o aumento de pena quando...?"
   - 👤 SUJEITOS: "Quem pode ser sujeito ativo?"
   - 📋 QUALIFICADORAS: "Quais as qualificadoras?"
   - ⚡ AÇÃO PENAL: "É ação penal pública ou privada?"
   - 🔍 CLASSIFICAÇÃO: "Admite tentativa?"

   Exemplos CURTOS:
   - "Qual a pena base do Art. ${numeroArtigo}?"
   - "O aumento para agente público é de quanto?"
   - "Quem pode ser vítima?"

=== DISTRIBUIÇÃO DE DIFICULDADE ===
- 70% FÁCIL ("facil"): Diretas sobre texto literal
- 20% MÉDIO ("medio"): Relacionar partes do artigo
- 10% DIFÍCIL ("dificil"): Exceções, pegadinhas

=== COMO CRIAR QUESTÕES ===
- Cada inciso → 2-3 questões
- Cada parágrafo → 2-4 questões
- Números, prazos, valores → questões específicas
- Exceções → questões sobre elas

=== ALTERNATIVAS ===
- CORRETA: Reflete EXATAMENTE o artigo (máx 18 palavras)
- INCORRETAS: Erros sutis - troca de palavras, números diferentes (máx 18 palavras)
- NÃO crie alternativas sobre temas fora do artigo

=== FORMATO DO COMENTÁRIO ===
"A resposta correta é a alternativa [LETRA].

[Cite o trecho exato do artigo]

---

ALTERNATIVA A: [Certa/Errada porque...]

---

ALTERNATIVA B: [Certa/Errada porque...]

---

ALTERNATIVA C: [Certa/Errada porque...]

---

ALTERNATIVA D: [Certa/Errada porque...]"

=== FORMATO JSON ===
[
  {
    "enunciado": "Pergunta curta sobre o Art. ${numeroArtigo}?",
    "alternativas": {
      "a": "Resposta curta (máx 18 palavras)",
      "b": "Resposta curta",
      "c": "Resposta curta",
      "d": "Resposta curta"
    },
    "resposta_correta": "a",
    "dificuldade": "facil",
    "comentario": "...",
    "exemplo_pratico": "João era servidor público e foi acusado de... Ele consultou seu advogado que explicou que conforme o artigo... O caso foi julgado e..."
  }
]

CRÍTICO: 
- Enunciados CURTOS e DIRETOS
- Alternativas com MÁXIMO 18 palavras cada
- TODAS baseadas no texto literal do Art. ${numeroArtigo}
- Comentários citam trechos do artigo
- Exemplo prático é NARRATIVA SEM PERGUNTAS - conta uma história aplicando o artigo

Retorne APENAS o array JSON válido.`;

  try {
    const text = await chamarGeminiComFallback(prompt);
    const questoes = parseJsonSeguro(text);

    if (!Array.isArray(questoes)) {
      throw new Error("Resposta não é um array de questões");
    }

    console.log(`📦 Art. ${numeroArtigo}: Recebidas ${questoes.length} questões, salvando...`);

    let salvas = 0;
    for (const questao of questoes) {
      try {
        const { error: insertError } = await supabase
          .from("QUESTOES_ARTIGOS_LEI")
          .insert({
            area,
            artigo: numeroArtigo,
            enunciado: questao.enunciado,
            alternativa_a: questao.alternativas.a,
            alternativa_b: questao.alternativas.b,
            alternativa_c: questao.alternativas.c,
            alternativa_d: questao.alternativas.d,
            resposta_correta: questao.resposta_correta,
            comentario: questao.comentario,
            exemplo_pratico: questao.exemplo_pratico,
            dificuldade: questao.dificuldade,
          });

        if (!insertError) {
          salvas++;
        } else {
          console.error(`❌ Erro ao salvar questão:`, insertError);
        }
      } catch (e) {
        console.error(`❌ Erro ao processar questão:`, e);
      }
    }

    console.log(`✅ Art. ${numeroArtigo}: ${salvas}/${questoes.length} questões salvas`);
  } catch (error) {
    console.error(`❌ Art. ${numeroArtigo}: Erro na geração:`, error);
  }
}

// Declaração do tipo EdgeRuntime para Supabase
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

serve(async (req) => {
  console.log(`📍 Function: gerar-questoes-artigo@${REVISION}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { content, numeroArtigo, area } = body;

    if (!area || !content || !numeroArtigo) {
      return new Response(
        JSON.stringify({ error: "area, content e numeroArtigo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar cache
    const { data: cached } = await supabase
      .from("QUESTOES_ARTIGOS_LEI")
      .select('id', { count: 'exact' })
      .eq('area', area)
      .eq('artigo', numeroArtigo);

    if (cached && cached.length > 0) {
      console.log(`✅ Art. ${numeroArtigo}: ${cached.length} questões em cache`);
      return new Response(
        JSON.stringify({
          status: "cached",
          artigo: numeroArtigo,
          count: cached.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limites de questões
    const limites = getLimiteQuestoes();
    console.log(`📏 Art. ${numeroArtigo}: ${content.length} chars → ${limites.minimo}-${limites.maximo} questões diversificadas`);

    // Iniciar geração em background
    EdgeRuntime.waitUntil(gerarQuestoesArtigoBackground(content, numeroArtigo, area));

    // Retornar IMEDIATAMENTE
    return new Response(
      JSON.stringify({
        status: "iniciando",
        minimoEsperado: limites.minimo,
        maximoEsperado: limites.maximo,
        artigo: numeroArtigo,
        message: "Geração iniciada - 10-20 questões diversificadas sem repetição",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        },
      }
    );
  } catch (error) {
    console.error("❌ Erro em gerar-questoes-artigo:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        model: MODEL,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
