import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jurisprudencia, nivel } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log(`Gerando explicação ${nivel} para: ${jurisprudencia.numeroProcesso}`);

    const prompts = {
      tecnico: `Você é um professor de Direito especializado em análise de jurisprudência.

Analise a seguinte decisão judicial e crie uma explicação TÉCNICA E COMPLETA:

**Tribunal:** ${jurisprudencia.tribunal}
**Processo:** ${jurisprudencia.numeroProcesso}
**Órgão Julgador:** ${jurisprudencia.orgaoJulgador}
**Data:** ${jurisprudencia.dataJulgamento}

**EMENTA:**
${jurisprudencia.ementa}

FORMATO OBRIGATÓRIO (ESTILO BLOGGER PROFISSIONAL):

# 📊 Análise Jurisprudencial: ${jurisprudencia.tribunal} - ${jurisprudencia.numeroProcesso}

---

## 📋 Dados do Julgado

**Processo:** ${jurisprudencia.numeroProcesso}  
**Tribunal:** ${jurisprudencia.tribunal}  
**Órgão Julgador:** ${jurisprudencia.orgaoJulgador}  
**Data do Julgamento:** ${jurisprudencia.dataJulgamento}

---

## 📚 Contexto e Relevância

[3-4 parágrafos explicando a importância deste julgado, seu contexto histórico e impacto na jurisprudência]

---

## ⚖️ Questão Jurídica Central

### Problema Jurídico

[2-3 parágrafos identificando claramente qual é o problema jurídico que estava em discussão]

### Controvérsia

[2-3 parágrafos sobre as divergências e posições contrapostas no caso]

---

## 🔍 Análise da Ementa

[Análise DETALHADA da ementa, dividindo em partes lógicas:]

### Primeira Parte

[Análise de 2-3 parágrafos]

### Segunda Parte

[Análise de 2-3 parágrafos]

### Terceira Parte

[Análise de 2-3 parágrafos]

---

## 📖 Fundamentos Legais

### Legislação Aplicável

[2-3 parágrafos sobre as leis e artigos aplicados no caso]

### Princípios Jurídicos

[2-3 parágrafos sobre os princípios que fundamentaram a decisão]

---

## 💡 Tese Jurídica Firmada

> *"[Tese principal extraída da decisão em formato claro]"*

[3-4 parágrafos explicando a tese de forma técnica mas acessível]

---

## 🎯 Impactos Práticos

### Para a Advocacia

[2-3 parágrafos sobre como advogados devem considerar esta decisão]

### Para Casos Futuros

[2-3 parágrafos sobre como isso afeta casos similares]

### Para a Jurisprudência

[2-3 parágrafos sobre o impacto no desenvolvimento da jurisprudência]

---

## 📚 Jurisprudência Relacionada

### Precedentes Importantes

[2-3 parágrafos citando e explicando precedentes relevantes]

### Súmulas Aplicáveis

[1-2 parágrafos sobre súmulas relacionadas, se houver]

---

## 📌 Síntese Final

[3-4 parágrafos fazendo síntese completa do julgado e suas implicações]

---

## 🔗 Para Consultar

- [Link para o processo completo](${jurisprudencia.link})

REGRAS CRÍTICAS:
- Use # para título principal (apenas um)
- Use ## para seções principais
- Use ### para subseções
- Use --- para separar seções elegantemente
- Use > para citações importantes com "aspas" e *itálico*
- Use **negrito** APENAS em termos jurídicos essenciais (máximo 3-4 por parágrafo)
- Parágrafos MUITO bem desenvolvidos (4-6 linhas cada no mínimo)
- Seja COMPLETO, TÉCNICO e DETALHADO
- Análise profunda e fundamentada`,

      simples: `Você é um educador que explica Direito de forma SUPER SIMPLES e DIDÁTICA.

Explique a seguinte decisão judicial de forma CLARA E ACESSÍVEL para quem não é da área:

**Tribunal:** ${jurisprudencia.tribunal}
**Processo:** ${jurisprudencia.numeroProcesso}
**Órgão Julgador:** ${jurisprudencia.orgaoJulgador}
**Data:** ${jurisprudencia.dataJulgamento}

**O QUE A DECISÃO DIZ:**
${jurisprudencia.ementa}

FORMATO OBRIGATÓRIO (ESTILO BLOG EDUCATIVO):

# 🎓 Entendendo a Decisão: ${jurisprudencia.numeroProcesso}

---

## 📋 Informações Básicas

**Quem decidiu:** ${jurisprudencia.tribunal} (${jurisprudencia.orgaoJulgador})  
**Quando:** ${jurisprudencia.dataJulgamento}  
**Processo número:** ${jurisprudencia.numeroProcesso}

---

## 🤔 O Que Aconteceu?

[3-4 parágrafos contando a "história" do caso em linguagem super simples, como se estivesse conversando com um amigo]

**Em poucas palavras:** [Uma frase resumindo o caso]

---

## ❓ Qual Era a Dúvida?

[2-3 parágrafos explicando qual era a questão principal, usando analogias do dia a dia]

**Pense assim:** [Analogia com situação cotidiana]

---

## ✅ O Que o Tribunal Decidiu?

[3-4 parágrafos explicando a decisão em palavras super simples]

### Em resumo:

[Lista com 3-4 pontos principais da decisão em linguagem clara]

---

## 💡 Por Que Isso Importa?

### Para Você

[2-3 parágrafos sobre como isso pode afetar a vida das pessoas comuns]

### Para a Sociedade

[2-3 parágrafos sobre o impacto social desta decisão]

---

## 🌟 Exemplos do Dia a Dia

### Situação 1

[2 parágrafos com exemplo prático e relatable]

### Situação 2

[2 parágrafos com outro exemplo do cotidiano]

---

## 📝 Em Resumo

[3 parágrafos fazendo resumo final super claro e acessível]

**Conclusão em uma frase:** [Síntese ultra-simples]

---

## 🔗 Quer Saber Mais?

- [Veja o processo completo aqui](${jurisprudencia.link})

REGRAS CRÍTICAS:
- ZERO termos técnicos sem explicação
- Use linguagem coloquial e amigável
- Use MUITAS analogias e exemplos do cotidiano
- Parágrafos bem desenvolvidos (3-5 linhas)
- Use emojis estrategicamente
- Seja ultra-acessível e didático`
    };

    const prompt = prompts[nivel as keyof typeof prompts] || prompts.tecnico;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 3000,
          }
        }),
      }
    );

    if (!response.ok || !response.body) {
      throw new Error('Falha ao gerar explicação');
    }

    // Transform Gemini stream to SSE format
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const sseData = JSON.stringify({
                choices: [{ delta: { content } }]
              });
              controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n\n`));
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Erro ao explicar jurisprudência:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
