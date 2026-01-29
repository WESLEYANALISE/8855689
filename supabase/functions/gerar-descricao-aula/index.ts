import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, conteudo_base, area, aula_link } = await req.json();
    console.log('Gerando descrição para:', { tema, area });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    const prompt = `Você é um assistente educacional especializado em direito brasileiro.

Crie uma descrição envolvente e concisa (máximo 150 caracteres) para a aula de ${area} sobre "${tema}".

A descrição deve:
- Ser atraente e despertar interesse
- Mencionar os principais tópicos da aula
- Usar linguagem clara e acessível
- Ser informativa mas breve

Conteúdo base da aula:
${conteudo_base?.substring(0, 500)}

Retorne APENAS a descrição, sem formatação adicional.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente educacional especializado em direito." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes no Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("Erro na API Lovable AI:", aiResponse.status, errorText);
      throw new Error("Erro ao gerar descrição com IA");
    }

    const aiData = await aiResponse.json();
    const descricao = aiData.choices[0].message.content.trim();
    console.log('Descrição gerada:', descricao);

    // Atualizar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('CURSOS-APP')
      .update({
        'descricao-aula': descricao,
        'descricao_gerada_em': new Date().toISOString()
      })
      .eq('tema', tema)
      .eq('area', area);

    if (updateError) {
      console.error('Erro ao atualizar descrição:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ descricao }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em gerar-descricao-aula:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
