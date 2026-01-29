import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disciplinaId, tema, area, sobre } = await req.json();
    
    console.log("[gerar-conteudo-dominando] Recebido:", { disciplinaId, tema, area });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe conteúdo
    const { data: existente } = await supabase
      .from("dominando_conteudo")
      .select("id")
      .eq("disciplina_id", disciplinaId)
      .maybeSingle();

    if (existente) {
      console.log("[gerar-conteudo-dominando] Conteúdo já existe, regenerando...");
    }

    // Chamar API do Google Gemini
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    const prompt = `Você é um professor de Direito especialista em ${area}. Crie um conteúdo de estudo aprofundado sobre "${tema}" para estudantes que desejam dominar esta disciplina jurídica.

${sobre ? `Contexto adicional: ${sobre}` : ''}

Gere o conteúdo no seguinte formato JSON:

{
  "introducao": "Uma introdução envolvente de 2-3 parágrafos explicando a importância de ${tema} no contexto do ${area} e do ordenamento jurídico brasileiro.",
  
  "conteudo_markdown": "# ${tema}\\n\\n[Conteúdo completo em Markdown com pelo menos 4 seções, incluindo:\\n- Fundamentos teóricos\\n- Principais conceitos\\n- Aplicação prática\\n- Jurisprudência relevante\\n\\nUse formatação rica com títulos, listas e destaques.]",
  
  "termos": [
    {"termo": "Termo jurídico 1", "definicao": "Definição clara e objetiva"},
    {"termo": "Termo jurídico 2", "definicao": "Definição clara e objetiva"},
    {"termo": "Termo jurídico 3", "definicao": "Definição clara e objetiva"},
    {"termo": "Termo jurídico 4", "definicao": "Definição clara e objetiva"},
    {"termo": "Termo jurídico 5", "definicao": "Definição clara e objetiva"}
  ],
  
  "flashcards": [
    {"frente": "Pergunta sobre conceito 1", "verso": "Resposta detalhada"},
    {"frente": "Pergunta sobre conceito 2", "verso": "Resposta detalhada"},
    {"frente": "Pergunta sobre conceito 3", "verso": "Resposta detalhada"},
    {"frente": "Pergunta sobre conceito 4", "verso": "Resposta detalhada"},
    {"frente": "Pergunta sobre conceito 5", "verso": "Resposta detalhada"}
  ],
  
  "questoes": [
    {
      "pergunta": "Questão 1 sobre ${tema}?",
      "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correta": 0
    },
    {
      "pergunta": "Questão 2 sobre ${tema}?",
      "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correta": 1
    },
    {
      "pergunta": "Questão 3 sobre ${tema}?",
      "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correta": 2
    }
  ]
}

IMPORTANTE: 
- Retorne APENAS o JSON válido, sem texto antes ou depois
- O conteúdo deve ser denso e educativo, apropriado para estudantes de Direito
- Use terminologia jurídica precisa
- Inclua referências à legislação brasileira quando aplicável
- O índice "correta" nas questões é 0-indexed (0=A, 1=B, 2=C, 3=D)`;

    console.log("[gerar-conteudo-dominando] Chamando Gemini...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[gerar-conteudo-dominando] Erro Gemini:", errorText);
      throw new Error(`Erro Gemini: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Resposta vazia do Gemini");
    }

    console.log("[gerar-conteudo-dominando] Resposta recebida, parseando JSON...");

    // Extrair JSON da resposta
    let conteudo;
    try {
      // Tentar extrair JSON de blocos de código
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        textResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        conteudo = JSON.parse(jsonMatch[1]);
      } else {
        // Tentar parsear diretamente
        conteudo = JSON.parse(textResponse);
      }
    } catch (parseError) {
      console.error("[gerar-conteudo-dominando] Erro ao parsear JSON:", parseError);
      console.log("[gerar-conteudo-dominando] Texto recebido:", textResponse.substring(0, 500));
      throw new Error("Erro ao processar resposta da IA");
    }

    // Salvar no banco
    const dadosConteudo = {
      disciplina_id: disciplinaId,
      area: area,
      tema: tema,
      introducao: conteudo.introducao,
      conteudo_markdown: conteudo.conteudo_markdown,
      termos: conteudo.termos,
      flashcards: conteudo.flashcards,
      questoes: conteudo.questoes,
      updated_at: new Date().toISOString()
    };

    if (existente) {
      await supabase
        .from("dominando_conteudo")
        .update(dadosConteudo)
        .eq("disciplina_id", disciplinaId);
    } else {
      await supabase
        .from("dominando_conteudo")
        .insert(dadosConteudo);
    }

    console.log("[gerar-conteudo-dominando] Conteúdo salvo com sucesso!");

    return new Response(JSON.stringify({ success: true, conteudo: dadosConteudo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[gerar-conteudo-dominando] Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
