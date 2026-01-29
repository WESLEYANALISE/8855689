import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  for (const apiKey of API_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            }
          })
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error) {
      console.error('Erro com API key:', error);
      continue;
    }
  }
  throw new Error('Todas as API keys falharam');
}

async function buscarConteudoOriginal(url: string): Promise<string> {
  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.log('FIRECRAWL_API_KEY não configurada');
      return '';
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.log('Erro ao buscar conteúdo:', response.status);
      return '';
    }

    const data = await response.json();
    return data?.data?.markdown || '';
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem } = await req.json();

    if (!ordem) {
      return new Response(
        JSON.stringify({ error: 'Ordem do artigo é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar artigo
    const { data: artigo, error: artigoError } = await supabase
      .from('advogado_blog')
      .select('*')
      .eq('ordem', ordem)
      .single();

    if (artigoError || !artigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se já tem conteúdo válido, retornar
    if (artigo.conteudo_gerado && artigo.cache_validade) {
      const cacheValido = new Date(artigo.cache_validade) > new Date();
      if (cacheValido) {
        console.log('Retornando conteúdo do cache');
        return new Response(
          JSON.stringify({ 
            conteudo: artigo.conteudo_gerado,
            titulo: artigo.titulo,
            fromCache: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar conteúdo original do site
    let conteudoOriginal = '';
    if (artigo.fonte_url) {
      console.log('Buscando conteúdo de:', artigo.fonte_url);
      conteudoOriginal = await buscarConteudoOriginal(artigo.fonte_url);
    }

    // Gerar artigo com Gemini
    const prompt = `Você é um especialista em advocacia e gestão jurídica. Escreva um artigo educativo e prático sobre o tema: "${artigo.titulo}".

${conteudoOriginal ? `Use o seguinte conteúdo como base e referência, mas reescreva completamente com suas próprias palavras:\n\n${conteudoOriginal.slice(0, 8000)}\n\n` : ''}

${artigo.descricao_curta ? `Descrição do tema: ${artigo.descricao_curta}` : ''}

INSTRUÇÕES:
1. Escreva um artigo completo e educativo (1500-2500 palavras)
2. Use linguagem profissional mas acessível
3. Inclua exemplos práticos e dicas aplicáveis
4. Estruture com subtítulos claros (use ## para títulos)
5. Adicione listas quando apropriado
6. Foque em conteúdo prático para advogados
7. NÃO mencione produtos ou ferramentas comerciais
8. NÃO inclua links externos
9. Use formatação Markdown

Escreva o artigo completo:`;

    console.log('Gerando artigo com Gemini...');
    const conteudoGerado = await chamarGeminiComFallback(prompt);

    // Salvar no banco
    const cacheValidade = new Date();
    cacheValidade.setDate(cacheValidade.getDate() + 30);

    await supabase
      .from('advogado_blog')
      .update({
        conteudo_gerado: conteudoGerado,
        gerado_em: new Date().toISOString(),
        cache_validade: cacheValidade.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', artigo.id);

    console.log('Artigo gerado e salvo com sucesso');

    return new Response(
      JSON.stringify({ 
        conteudo: conteudoGerado,
        titulo: artigo.titulo,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
