import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroId, totalPaginas, livroTitulo } = await req.json();
    
    if (!livroId) {
      throw new Error('livroId é obrigatório');
    }

    const GEMINI_KEY = Deno.env.get('GEMINI_KEY_1');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!GEMINI_KEY) {
      throw new Error('GEMINI_KEY_1 não configurada');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Processando estrutura do livro: ${livroTitulo} (${totalPaginas} páginas)`);

    // Buscar amostra de páginas para identificar estrutura
    const paginasAmostra = [1, 5, 10, 20, 30, 50, 100, 150, 200, 300, 400, 500, 600];
    const textos: string[] = [];

    for (const pagina of paginasAmostra) {
      if (pagina <= totalPaginas) {
        const { data } = await supabase
          .from('AULAS INTERATIVAS')
          .select('Livro')
          .eq('Paginas', `Página ${pagina}`)
          .maybeSingle();
        
        if (data?.Livro) {
          textos.push(`--- PÁGINA ${pagina} ---\n${data.Livro.substring(0, 500)}`);
        }
      }
    }

    const prompt = `Analise estas amostras de páginas do livro "${livroTitulo}" e identifique a estrutura de capítulos.

AMOSTRAS:
${textos.join('\n\n')}

Baseado nestas amostras, gere a estrutura estimada do livro.

RETORNE JSON:
{
  "capitulos": [
    {
      "numero": 1,
      "titulo": "Título do Capítulo",
      "parte": "LIVRO PRIMEIRO" ou null,
      "pagina_inicio_estimada": 5,
      "tema": "Breve descrição do tema",
      "cor_tema": "#3B82F6",
      "icone": "book"
    }
  ]
}

REGRAS:
- Estime com base nos padrões encontrados
- Use cores harmoniosas (azul #3B82F6, verde #10B981, roxo #8B5CF6, âmbar #F59E0B, vermelho #EF4444, rosa #EC4899)
- Ícones disponíveis: book, scale, crown, sword, scroll, feather, landmark, users, heart, shield
- JSON PURO`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 16000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao processar estrutura');
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Resposta vazia da IA');
    }
    
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const estrutura = JSON.parse(resultText);

    // Salvar estrutura no banco
    const { error: updateError } = await supabase
      .from('leitura_interativa')
      .update({ 
        estrutura_capitulos: estrutura,
        updated_at: new Date().toISOString()
      })
      .eq('biblioteca_classicos_id', livroId);

    if (updateError) {
      console.error('Erro ao salvar estrutura:', updateError);
      throw new Error('Erro ao salvar estrutura');
    }

    console.log(`Estrutura salva: ${estrutura.capitulos?.length || 0} capítulos`);

    return new Response(JSON.stringify(estrutura), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em processar-estrutura-livro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
