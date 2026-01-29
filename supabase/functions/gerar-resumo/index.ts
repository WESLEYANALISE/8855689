import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v2.5.2";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🔑 USANDO AS MESMAS CHAVES DA PROFESSORA COM FALLBACK
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function chamarGemini(messages: any[], config: any): Promise<any> {
  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma chave GEMINI_KEY_1/2/3 configurada');
  }

  let lastError: Error | null = null;
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`📝 Tentando chave GEMINI_KEY_${i + 1}...`);
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages,
          generationConfig: config
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ${response.status} com GEMINI_KEY_${i + 1}:`, errorText.substring(0, 200));
        lastError = new Error(`Erro na API Gemini: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Resposta recebida com GEMINI_KEY_${i + 1}`);
      return data;
    } catch (error) {
      console.error(`❌ Falha com GEMINI_KEY_${i + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves API falharam');
}

// 📄 Extrair texto do PDF usando unpdf (biblioteca robusta para serverless)
async function extrairTextoPDF(base64Data: string): Promise<string> {
  console.log("📄 [UNPDF] Iniciando extração com unpdf...");
  
  try {
    // Importar dinamicamente para evitar erros de tipo
    const { extractText, getDocumentProxy } = await import('https://esm.sh/unpdf@0.11.0');
    
    // Converter base64 para Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Extrair texto de todas as páginas
    const result = await extractText(bytes, { mergePages: true });
    
    console.log(`✅ [UNPDF] Extração completa: ${result.text.length} caracteres de ${result.totalPages} páginas`);
    
    return result.text;
  } catch (error) {
    console.error("❌ [UNPDF] Erro na extração:", error);
    throw new Error(`Falha ao extrair texto do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

serve(async (req) => {
  console.log(`📍 Function: gerar-resumo@${REVISION} | Model: ${MODEL} | PDF: pdf-parse`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, conteudo, arquivo, nomeArquivo, acao, nivel } = await req.json();
    
    console.log("📝 [GERAR-RESUMO] Iniciando - Tipo:", tipo, "Nome arquivo:", nomeArquivo, "Ação:", acao, "Nível:", nivel);

    let textoParaResumir = "";
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    // Processar conforme o tipo de input
    if (tipo === "texto") {
      textoParaResumir = conteudo;
    } else if (tipo === "pdf") {
      // 📄 PDF: Usar pdf-parse para extração robusta
      if (!arquivo) {
        throw new Error("Arquivo PDF não fornecido");
      }

      base64Data = arquivo.split(",")[1];
      if (!base64Data) {
        throw new Error("Dados base64 do PDF não encontrados");
      }
      console.log("📄 [PDF] Tamanho base64:", base64Data.length);

      textoParaResumir = await extrairTextoPDF(base64Data);
      
      if (!textoParaResumir || textoParaResumir.trim().length < 50) {
        throw new Error("Não foi possível extrair texto suficiente do PDF");
      }
      
    } else if (tipo === "imagem") {
      // 🖼️ Imagem: Usar Gemini Vision
      if (!arquivo) {
        throw new Error("Arquivo de imagem não fornecido");
      }

      base64Data = arquivo.split(",")[1];
      mimeType = arquivo.split(";")[0].split(":")[1];

      console.log("🖼️ [IMAGEM] Processando imagem. MimeType:", mimeType, "Tamanho base64:", base64Data?.length || 0);

      const extractionMessages = [{
        role: "user" as const,
        parts: [
          { text: "Extraia TODO o texto visível nesta imagem. Seja preciso e detalhado. Retorne apenas o texto extraído." },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } }
        ]
      }];

      let extractionAttempts = 0;
      const maxAttempts = 3;
      
      while (extractionAttempts < maxAttempts) {
        try {
          extractionAttempts++;
          console.log(`🔄 [EXTRAÇÃO] Tentativa ${extractionAttempts}/${maxAttempts} de extração de texto da imagem`);
          
          const visionData = await chamarGemini(extractionMessages, {
            temperature: 0.1,
            maxOutputTokens: 3000,
          });

          textoParaResumir = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!textoParaResumir) {
            console.error("Resposta da API sem conteúdo:", JSON.stringify(visionData));
            throw new Error("A API não retornou conteúdo extraído");
          }
          
          console.log(`✅ [SUCESSO] Texto extraído da imagem (tentativa ${extractionAttempts}) - ${textoParaResumir.length} caracteres`);
          break;
          
        } catch (error) {
          console.error(`Tentativa ${extractionAttempts} falhou:`, error);
          if (extractionAttempts >= maxAttempts) {
            throw new Error(`Falha na extração após ${maxAttempts} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (acao === "extrair") {
      return new Response(
        JSON.stringify({
          extraido: textoParaResumir,
          chars: textoParaResumir?.length || 0,
          tipo,
          nomeArquivo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((!textoParaResumir || textoParaResumir.trim().length === 0) && !(tipo === "imagem" && arquivo)) {
      throw new Error("Não foi possível extrair conteúdo suficiente do arquivo");
    }

    // Preparar prompt e mensagens para o resumo (com níveis)
    const nivelEscolhido = (nivel === "resumido" || nivel === "super_resumido") ? nivel : "detalhado";

    let promptTexto = "";
    
    if (nivelEscolhido === "super_resumido") {
      promptTexto = `Você é um especialista em criar resumos jurídicos SUPER RESUMIDOS.

NÍVEL: SUPER RESUMIDO - MÁXIMA CONCISÃO

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie APENAS 4-6 bullets com os pontos MAIS IMPORTANTES
- Cada bullet deve ter NO MÁXIMO 10-15 palavras
- Use linguagem direta e objetiva
- Inclua emojis relevantes em cada bullet
- NÃO crie parágrafos, APENAS bullets
- Cite artigos/leis APENAS quando essencial

FORMATO EXATO:
# 📄 Resumo Jurídico

• [Emoji] [Ponto principal 1 em 10-15 palavras]
• [Emoji] [Ponto principal 2 em 10-15 palavras]
• [Emoji] [Ponto principal 3 em 10-15 palavras]
• [Emoji] [Ponto principal 4 em 10-15 palavras]`;

    } else if (nivelEscolhido === "resumido") {
      promptTexto = `Você é um especialista em criar resumos jurídicos RESUMIDOS.

NÍVEL: RESUMIDO - EQUILÍBRIO ENTRE CONCISÃO E INFORMAÇÃO

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie 1 parágrafo por tópico principal (máximo 4-5 tópicos)
- Cada parágrafo deve ter 2-3 linhas (40-60 palavras)
- Use negrito (**texto**) para destacar termos-chave
- Inclua emojis profissionais nos cabeçalhos
- Cite artigos/leis quando relevante
- Seja objetivo e direto

ESTRUTURA OBRIGATÓRIA:
# 📄 Resumo Jurídico

## 🎯 Visão Geral
[1 parágrafo de 2-3 linhas]

## 📋 Pontos Principais
[1 parágrafo de 2-3 linhas]

## ⚖️ Fundamentos Legais
[1 parágrafo de 2-3 linhas]

## 📌 Conclusão
[1 parágrafo de 2-3 linhas]`;

    } else {
      promptTexto = `Você é um especialista em criar resumos jurídicos DETALHADOS e COMPLETOS.

NÍVEL: DETALHADO - ANÁLISE APROFUNDADA

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie 2-3 parágrafos COMPLETOS por tópico principal
- Cada parágrafo deve ter 3-5 linhas (60-100 palavras)
- Desenvolva cada conceito com profundidade
- Use negrito (**texto**), listas e citações quando apropriado
- Inclua emojis profissionais nos cabeçalhos
- Cite artigos/leis com contexto e explicação
- Explique termos técnicos quando necessário

ESTRUTURA OBRIGATÓRIA:
# 📄 Resumo Jurídico Detalhado

## 🎯 Visão Geral
[2-3 parágrafos de 3-5 linhas cada, apresentando o contexto geral]

## 📋 Pontos Principais
[2-3 parágrafos de 3-5 linhas cada, desenvolvendo os pontos essenciais]

## ⚖️ Fundamentos Legais
[2-3 parágrafos de 3-5 linhas cada, explicando a base legal]

## 🔍 Conceitos-Chave
[2-3 parágrafos de 3-5 linhas cada, detalhando conceitos importantes]

## 📌 Conclusão
[2-3 parágrafos de 3-5 linhas cada, sintetizando e concluindo]`;
    }

    let messages: any[] = [];
    if (tipo === "imagem" && ((textoParaResumir?.trim().length || 0) < 50) && arquivo && base64Data && mimeType) {
      messages = [{
        role: "user",
        parts: [
          { text: `Analise a imagem a seguir e gere um resumo jurídico no nível: ${nivelEscolhido}. Quando houver texto, considere-o; caso contrário, descreva de forma objetiva o conteúdo visual e sua relevância jurídica quando aplicável.` },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
        ]
      }];
    } else {
      messages = [{ role: "user", parts: [{ text: promptTexto }] }];
    }

    console.log("🤖 [GEMINI] Gerando resumo estruturado | Nível:", nivelEscolhido, "| Caracteres:", textoParaResumir.length);

    const aiData = await chamarGemini(messages, {
      temperature: 0.2,
      maxOutputTokens: 2500,
    });

    const resumo = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("✨ [SUCESSO] Resumo gerado! Tamanho:", resumo.length, "| Tokens usados:", aiData.usage?.total_tokens || 0);

    return new Response(
      JSON.stringify({
        resumo,
        tokens_usados: aiData.usage?.total_tokens || 0,
        tempo_processamento: Date.now(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-resumo:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar resumo",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
