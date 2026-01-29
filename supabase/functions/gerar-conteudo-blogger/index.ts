import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const apiKey of API_KEYS) {
    try {
      console.log('Tentando gerar conteúdo com chave Gemini...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API Gemini:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!conteudo) {
        throw new Error('Conteúdo não gerado pela IA');
      }

      console.log('✅ Conteúdo gerado com sucesso');
      return conteudo;
    } catch (error) {
      console.error('Erro com chave API:', error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria, ordem, titulo, topicos } = await req.json();

    if (!categoria || !ordem || !titulo) {
      return new Response(
        JSON.stringify({ error: 'Categoria, ordem e título são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    // Prompt específico para cada categoria
    const promptsCategoria: Record<string, string> = {
      advogado: 'advocacia, profissão de advogado, carreira jurídica, OAB',
      prf: 'Polícia Rodoviária Federal, carreira PRF, concurso PRF',
      pf: 'Polícia Federal, carreira PF, concurso Polícia Federal',
      juiz: 'magistratura, carreira de juiz, concurso magistratura',
      delegado: 'delegado de polícia, carreira policial, concurso delegado',
      civilizacoes: 'história do direito, sistemas jurídicos antigos, evolução do direito nas civilizações'
    };

    const contextoCategoria = promptsCategoria[categoria] || 'carreiras jurídicas';

    const prompt = `Você é um especialista em ${contextoCategoria} no Brasil. Escreva um artigo educacional completo e detalhado sobre o tema: "${titulo}".

TÓPICOS QUE DEVEM SER ABORDADOS:
${topicos ? topicos.map((t: string) => `- ${t}`).join('\n') : 'Aborde os principais aspectos do tema.'}

INSTRUÇÕES:
1. Escreva um artigo completo com pelo menos 1500 palavras
2. Use linguagem clara e acessível para iniciantes
3. Inclua informações práticas e atualizadas
4. Organize com subtítulos usando markdown (##, ###)
5. Adicione exemplos práticos quando relevante
6. Inclua dicas úteis e conselhos práticos
7. Cite fontes confiáveis quando mencionar dados ou estatísticas
8. Termine com uma conclusão motivadora

FORMATO:
- Use markdown para formatação
- Inclua listas quando apropriado
- Destaque pontos importantes em **negrito**
- Use citações para informações oficiais

Escreva o artigo completo agora:`;

    console.log('Gerando conteúdo para:', titulo);

    const conteudo = await chamarGeminiComFallback(prompt);

    // Salvar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('BLOGGER_JURIDICO')
      .update({
        conteudo_gerado: conteudo,
        gerado_em: new Date().toISOString(),
        cache_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('categoria', categoria)
      .eq('ordem', ordem);

    if (updateError) {
      console.error('Erro ao salvar conteúdo:', updateError);
    }

    console.log('Conteúdo gerado com sucesso:', titulo);

    return new Response(
      JSON.stringify({ conteudo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função gerar-conteudo-blogger:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
