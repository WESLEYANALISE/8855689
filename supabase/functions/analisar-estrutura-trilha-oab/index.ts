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
    const { area } = await req.json();
    
    if (!area) {
      return new Response(
        JSON.stringify({ error: 'Área é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY_2') || Deno.env.get('GEMINI_KEY_3');
    
    if (!geminiApiKey) throw new Error('GEMINI_KEY não configurada');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar primeiras 20 páginas do conteúdo extraído
    const { data: paginas, error: fetchError } = await supabase
      .from('oab_trilhas_conteudo')
      .select('pagina, conteudo')
      .eq('area', area)
      .order('pagina')
      .limit(20);

    if (fetchError) throw fetchError;
    if (!paginas || paginas.length === 0) {
      throw new Error('Nenhum conteúdo encontrado para esta área');
    }

    // Concatenar conteúdo para análise
    const conteudoAmostra = paginas
      .map(p => `--- Página ${p.pagina} ---\n${p.conteudo}`)
      .join('\n\n');

    // Enviar para Gemini identificar estrutura
    const prompt = `Analise o sumário/índice deste material de estudo de ${area} para OAB e extraia a estrutura de capítulos/temas.

CONTEÚDO:
${conteudoAmostra}

Retorne um JSON com a estrutura identificada no seguinte formato:
{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Nome do Tema/Capítulo",
      "paginaInicial": 10,
      "paginaFinal": 25,
      "resumo": "Breve descrição do que será estudado"
    }
  ]
}

IMPORTANTE:
- Identifique TODOS os temas/capítulos principais
- Se não encontrar sumário explícito, analise o conteúdo e divida em temas lógicos
- Cada tema deve ter entre 10-30 páginas aproximadamente
- O resumo deve ser curto (1-2 frases)
- Retorne APENAS o JSON, sem markdown ou texto adicional`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini error: ${error}`);
    }

    const result = await response.json();
    let estruturaText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Limpar markdown se presente
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const estrutura = JSON.parse(estruturaText);
    const temas = estrutura.temas || [];

    // Limpar temas anteriores e salvar novos
    await supabase.from('oab_trilhas_temas').delete().eq('area', area);
    
    console.log(`Salvando ${temas.length} temas para ${area}...`);
    
    const temasParaInserir = temas.map((tema: any) => ({
      area,
      ordem: tema.ordem,
      titulo: tema.titulo,
      resumo: tema.resumo,
      pagina_inicial: tema.paginaInicial || null,
      pagina_final: tema.paginaFinal || null,
      status: 'pendente',
    }));
    
    const { error: insertError } = await supabase
      .from('oab_trilhas_temas')
      .insert(temasParaInserir);
    
    if (insertError) {
      console.error('Erro ao inserir temas:', insertError);
      throw new Error(`Erro ao salvar temas: ${insertError.message}`);
    }
    
    console.log(`✅ ${temas.length} temas salvos com sucesso`);

    // Atualizar status e contagem
    await supabase
      .from('oab_trilhas_areas')
      .update({ 
        status: 'formatando', 
        total_temas: temas.length 
      })
      .eq('area', area);

    return new Response(
      JSON.stringify({ 
        success: true, 
        area,
        totalTemas: temas.length,
        temas: temas.map((t: any) => t.titulo),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
