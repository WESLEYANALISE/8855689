import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const diasSemanaMap: { [key: string]: string } = {
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
  dom: "Domingo",
};

// Função para tentar reparar JSON truncado
function tryRepairJSON(jsonStr: string): any {
  // Primeiro, tenta parsear diretamente
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log("JSON inválido, tentando reparar...");
  }

  // Tenta encontrar o último fechamento válido
  let repaired = jsonStr.trim();
  
  // Remove caracteres após o último } válido
  const lastBrace = repaired.lastIndexOf('}');
  if (lastBrace > 0) {
    repaired = repaired.substring(0, lastBrace + 1);
  }

  // Conta chaves e colchetes abertos
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (const char of repaired) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
  }

  // Adiciona fechamentos faltantes
  while (bracketCount > 0) {
    repaired += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    repaired += '}';
    braceCount--;
  }

  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.error("Falha ao reparar JSON:", e);
    throw new Error("JSON irreparável");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia, horasPorDia, diasSemana, duracaoSemanas, arquivo, tipoArquivo } = await req.json();
    
    console.log("Gerando plano - Matéria:", materia, "Horas:", horasPorDia, "Dias:", diasSemana.length, "Semanas:", duracaoSemanas);

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    const totalHoras = horasPorDia * diasSemana.length * duracaoSemanas;
    const diasFormatados = diasSemana.map((d: string) => diasSemanaMap[d]).join(", ");

    let conteudoArquivo = "";

    // Processar arquivo se houver
    if (arquivo && tipoArquivo) {
      const base64Data = arquivo.split(",")[1];
      const mimeType = arquivo.split(";")[0].split(":")[1];

      console.log("Processando arquivo:", tipoArquivo);

      const visionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: tipoArquivo === "pdf"
                    ? "Extraia os PRINCIPAIS tópicos deste documento (ementa, cronograma). Liste apenas os temas principais, de forma resumida."
                    : "Extraia os PRINCIPAIS tópicos desta imagem de forma resumida."
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2000,
            }
          }),
        }
      );

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        conteudoArquivo = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("Conteúdo extraído do arquivo, tamanho:", conteudoArquivo.length);
      }
    }

    // Limitar semanas para evitar truncamento
    const semanasLimitadas = Math.min(duracaoSemanas, 8);
    const totalHorasLimitado = horasPorDia * diasSemana.length * semanasLimitadas;

    // Prompt simplificado para gerar menos conteúdo
    const prompt = `Você é um especialista em planejamento de estudos para concursos e OAB.

INFORMAÇÕES DO PLANO:
- Matéria: ${materia}
- Horas por dia: ${horasPorDia}h
- Dias: ${diasFormatados}
- Duração: ${semanasLimitadas} semanas
- Carga total: ${totalHorasLimitado}h

${conteudoArquivo ? `CONTEÚDO BASE:\n${conteudoArquivo.substring(0, 1500)}\n` : ""}

GERE um plano de estudos CONCISO no formato JSON abaixo.

REGRAS:
1. Crie EXATAMENTE ${semanasLimitadas} semanas
2. Cada semana tem ${diasSemana.length} dias
3. Cada dia tem 2-3 tópicos (não mais)
4. Descrições curtas (máximo 15 palavras)
5. Seja objetivo e direto

JSON:
{
  "objetivo": "Descrição em 1 frase do objetivo",
  "visaoGeral": {
    "cargaTotal": "${totalHorasLimitado}h",
    "duracao": "${semanasLimitadas} semanas",
    "frequencia": "${diasSemana.length} dias/semana",
    "intensidade": "${horasPorDia}h/dia",
    "descricao": "Metodologia em 1 frase"
  },
  "cronograma": [
    {
      "semana": 1,
      "titulo": "Tema da semana",
      "dias": [
        {
          "dia": "${diasSemanaMap[diasSemana[0]]}",
          "cargaHoraria": "${horasPorDia}h",
          "topicos": [
            { "horario": "08:00-10:00", "titulo": "Tópico", "descricao": "Breve descrição" }
          ]
        }
      ]
    }
  ],
  "materiais": [
    { "tipo": "Livro", "titulo": "Nome", "autor": "Autor", "detalhes": "Info" }
  ],
  "estrategias": [
    { "titulo": "Técnica", "descricao": "Como aplicar" }
  ],
  "checklist": [
    { "semana": 1, "meta": "Meta da semana" }
  ],
  "revisaoFinal": {
    "descricao": "Orientações finais",
    "simulado": { "duracao": "${horasPorDia}h", "formato": "Formato do simulado" }
  }
}`;

    console.log("Gerando plano estruturado JSON com Gemini");

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
            maxOutputTokens: 65536,
            responseMimeType: "application/json",
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar plano:", errorText);
      throw new Error("Falha ao gerar plano de estudos com IA");
    }

    const aiData = await aiResponse.json();
    const planoTexto = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("Resposta recebida, tamanho:", planoTexto.length);

    // Parse do JSON com reparo
    let planoJSON;
    try {
      planoJSON = tryRepairJSON(planoTexto);
      console.log("JSON parseado com sucesso. Semanas:", planoJSON.cronograma?.length || 0);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      console.log("Texto recebido (primeiros 500 chars):", planoTexto.substring(0, 500));
      throw new Error("Falha ao processar resposta da IA");
    }

    return new Response(
      JSON.stringify({
        plano: planoJSON,
        totalHoras: totalHorasLimitado,
        materia,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-plano-estudos:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar plano",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
