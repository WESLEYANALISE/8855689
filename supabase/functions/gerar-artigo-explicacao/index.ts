import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chaves Gemini para fallback
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  for (const key of API_KEYS) {
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

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } catch (error) {
      console.log(`Erro com chave Gemini, tentando próxima:`, error);
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem, modo = "tecnico" } = await req.json();

    if (!ordem) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'ordem' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar artigo pela ordem
    const { data: artigo, error: fetchError } = await supabase
      .from("lei_seca_explicacoes")
      .select("*")
      .eq("ordem", ordem)
      .single();

    if (fetchError || !artigo) {
      return new Response(
        JSON.stringify({ error: "Artigo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Campo a verificar/atualizar baseado no modo
    const campoConteudo = modo === "descomplicado" ? "conteudo_descomplicado" : "conteudo_gerado";
    const campoCache = modo === "descomplicado" ? "cache_descomplicado" : "cache_validade";

    // Verificar cache válido (30 dias)
    const conteudoExistente = artigo[campoConteudo];
    const cacheValidade = artigo[campoCache];
    
    if (conteudoExistente && cacheValidade) {
      const cacheValido = new Date(cacheValidade) > new Date();
      if (cacheValido) {
        return new Response(
          JSON.stringify({
            conteudo: conteudoExistente,
            titulo: artigo.titulo,
            fromCache: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Gerar prompt baseado no modo
    let prompt: string;
    
    if (modo === "descomplicado") {
      prompt = `Você é uma professora super simpática e descontraída que explica Direito de um jeito que até uma criança ou adolescente entende!

Tema a explicar: "${artigo.titulo}"
${artigo.descricao_curta ? `Contexto: ${artigo.descricao_curta}` : ""}

## ⛔ REGRAS ABSOLUTAS (PROIBIÇÕES SEVERAS):

1. **PROIBIDO QUALQUER FRASE INTRODUTÓRIA**: NÃO comece com:
   - "Aqui está o artigo sobre..."
   - "Segue o artigo sobre..."
   - "Vou explicar sobre..."
   - "Este artigo trata de..."
   - QUALQUER frase que pareça uma introdução meta (falando SOBRE o artigo em vez de ser O artigo)

2. **NÃO CRIE TÍTULOS NUMERADOS**: PROIBIDO usar "1. Introdução", "2. Conceito", etc. Use apenas subtítulos descritivos quando necessário, mas NUNCA numerados.

3. **PROIBIDO A PALAVRA "TIPO"**: Esta palavra está BANIDA. ZERO uso. Substitua sempre por:
   - "como se fosse", "por exemplo", "imagine que", "funciona assim", "pensa assim", "é como", "seria como", "igual quando"

## COMO VOCÊ DEVE ESCREVER:

1. **COMECE DIRETO NO ASSUNTO**: A primeira frase deve ser sobre o tema, não sobre o artigo.
   ✅ CORRETO: "Ei, você já parou pra pensar que vivemos cercados de leis?"
   ❌ ERRADO: "Aqui está o artigo sobre leis..."

2. **Tom de conversa**: Escreva como se estivesse conversando com um amigo jovem. Use "você", "a gente", expressões naturais.

3. **Analogias do dia a dia**: Compare com coisas que jovens conhecem:
   - Jogos, redes sociais, escola, família
   - Exemplos: "É como as regras de um grupo de WhatsApp..."
   - "Imagina que o Brasil fosse um videogame..."

4. **Emojis ocasionais**: Use 2-3 emojis por seção para deixar mais leve 📚✨

5. **Perguntas retóricas**: "Já pensou o que aconteceria se...?", "Sacou a diferença?"

6. **CITAÇÕES DE LEI**: Sempre que mencionar um artigo de lei, use o formato de citação Markdown:
   > 📜 **Art. X da Constituição Federal**: "Texto do artigo aqui..."

7. **Evite juridiquês**: 
   - Em vez de "pessoa jurídica", diga "empresa ou organização"
   - Em vez de "dispositivo legal", diga "artigo da lei"
   - Sempre explique termos difíceis entre parênteses

## ESTRUTURA (SEM NÚMEROS):

### Parágrafo inicial (DIRETO no assunto)
- Comece com uma pergunta ou situação do cotidiano
- "Ei, você já parou pra pensar que..."
- Explique por que esse assunto é importante pra vida real

### O que é isso na prática? (3-4 parágrafos)
- Explique o conceito usando exemplos simples
- Use comparações com a vida real
- Dê a definição de um jeito que todo mundo entende

### Por que isso importa pra você? (2-3 parágrafos)
- Conecte com a vida do jovem/adolescente
- Mostre situações do dia a dia onde isso aparece

### As características principais (bullet points)
- Liste 4-6 pontos importantes
- Explique cada um com linguagem simples

### Exemplos Práticos (TRÊS exemplos distintos)
Crie EXATAMENTE 3 exemplos práticos diferentes:

**📌 Exemplo 1: [Título descritivo]**
[Descrição detalhada do exemplo, com personagens e situação completa - mínimo 100 palavras]

**📌 Exemplo 2: [Título descritivo]**  
[Descrição detalhada do exemplo, com personagens e situação completa - mínimo 100 palavras]

**📌 Exemplo 3: [Título descritivo]**
[Descrição detalhada do exemplo, com personagens e situação completa - mínimo 100 palavras]

### Diferenças importantes (se aplicável)
- Compare com coisas parecidas mas diferentes
- "Não confunda X com Y, viu?"

### Resumão final (bullet points)
- 5-7 pontos-chave pra lembrar
- > 💡 **Dica de ouro**: [uma dica especial]

## REGRAS FINAIS:
- COMECE DIRETO COM O CONTEÚDO (nada de "Aqui está..." ou "Segue...")
- NÃO numere as seções (nada de "1.", "2.", etc.)
- NÃO use a palavra "tipo" (ZERO vezes)
- Use Markdown para formatação
- Use citações em blockquote (>) para artigos de lei
- **Tamanho: 800-1200 palavras**

IMPORTANTE: Sua primeira palavra deve ser o início do conteúdo real, NUNCA uma frase meta sobre o artigo.`;
    } else {
      prompt = `Você é uma professora de Direito especializada em ensinar conceitos jurídicos de forma didática e acessível.

Crie um artigo educativo COMPLETO e DETALHADO sobre o tema: "${artigo.titulo}"

${artigo.descricao_curta ? `Contexto: ${artigo.descricao_curta}` : ""}

## ⛔ REGRAS ABSOLUTAS (PROIBIÇÕES SEVERAS):

1. **PROIBIDO QUALQUER FRASE INTRODUTÓRIA META**: NÃO comece com:
   - "Aqui está o artigo sobre..."
   - "Segue o artigo sobre..."
   - "Vou explicar sobre..."
   - "Este artigo trata de..."
   - "Abaixo você encontrará..."
   - QUALQUER frase que fale SOBRE o artigo em vez de SER o artigo

2. **NÃO USE TÍTULOS NUMERADOS**: PROIBIDO usar "1. Introdução", "2. Conceito", etc. 
   Use subtítulos descritivos com ## ou ###, MAS NUNCA numerados.

## ESTRUTURA OBRIGATÓRIA:

### Introdução (2-3 parágrafos - SEM o título "Introdução")
- Comece DIRETAMENTE explicando o tema
- Sua primeira frase deve ser sobre o CONTEÚDO, não sobre o artigo
- ✅ CORRETO: "No estudo do Direito, os incisos representam..."
- ❌ ERRADO: "Aqui está o artigo sobre Incisos..."
- Explique POR QUE esse conhecimento é importante
- Relacione com o cotidiano do estudante de Direito

### Conceito e Definição (3-4 parágrafos)
- Definição técnica precisa
- Definição didática/simplificada
- Origem histórica ou etimológica (se aplicável)
- Fundamento legal (artigos da CF, LINDB, etc.)

### Características Principais (use bullet points)
- Liste 4-6 características essenciais
- Explique cada uma brevemente

### Exemplos Práticos (2-3 exemplos)
- Situações do dia a dia
- Casos reais simplificados
- "Por exemplo..." ou "Imagine que..."

### Diferenciação (se aplicável)
- Compare com conceitos similares
- Destaque diferenças importantes
- Use tabelas comparativas se útil

### Aplicação Prática (2-3 parágrafos)
- Como isso aparece em provas/concursos
- Onde encontrar na legislação
- Dicas de estudo

### Resumo Final (bullet points)
- 5-7 pontos-chave para memorizar
- Linguagem objetiva e direta

## REGRAS IMPORTANTES:
- COMECE DIRETO no conteúdo (nada de frases meta sobre o artigo)
- NÃO numere as seções (nada de "1.", "2.", etc.)
- NÃO USE títulos criativos como "O Fascinante Mundo de...", "Desvendando...", "Explorando..." etc
- Use Markdown para formatação
- Seja didático mas NUNCA superficial
- Cite artigos de lei quando relevante (ex: "Art. 1º da LINDB...")
- Use negrito (**) para termos importantes
- Crie subtítulos claros com ## e ###
- Inclua pelo menos uma citação ou aforismo jurídico relevante
- Tamanho: 800-1200 palavras

IMPORTANTE: Sua primeira palavra deve ser o início do conteúdo real, NUNCA uma frase meta tipo "Aqui está..." ou "Segue...".`;
    }

    const conteudo = await chamarGeminiComFallback(prompt);

    if (!conteudo || conteudo.length < 300) {
      throw new Error("Conteúdo gerado muito curto ou vazio");
    }

    // Salvar no banco com cache de 30 dias
    const cacheValidadeNovo = new Date();
    cacheValidadeNovo.setDate(cacheValidadeNovo.getDate() + 30);

    const updateData: Record<string, any> = {
      [campoConteudo]: conteudo,
      [campoCache]: cacheValidadeNovo.toISOString(),
    };
    
    if (modo === "tecnico") {
      updateData.gerado_em = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("lei_seca_explicacoes")
      .update(updateData)
      .eq("id", artigo.id);

    if (updateError) {
      console.error("Erro ao salvar conteúdo:", updateError);
    }

    return new Response(
      JSON.stringify({
        conteudo,
        titulo: artigo.titulo,
        fromCache: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
