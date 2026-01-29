import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini para fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

interface LivroInput {
  livro: string;
  autor: string;
  area: 'esquerda' | 'centro' | 'direita';
  link_drive: string;
}

async function buscarCapaGoogleBooks(titulo: string, autor?: string): Promise<string | null> {
  try {
    const query = autor ? `${titulo}+inauthor:${autor}` : titulo;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    
    if (thumbnail) {
      // Versão maior e HTTPS
      return thumbnail
        .replace('zoom=1', 'zoom=3')
        .replace('http://', 'https://');
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar capa:', error);
    return null;
  }
}

async function gerarConteudoGemini(livro: string, autor: string, area: string): Promise<{ sobre: string; beneficios: string } | null> {
  const orientacaoDescricao = {
    'esquerda': 'pensamento de esquerda, progressista, socialista ou social-democrata',
    'centro': 'pensamento centrista, liberal moderado ou pragmático',
    'direita': 'pensamento de direita, conservador, liberal clássico ou libertário'
  };

  const prompt = `Analise este livro político e retorne um JSON:

LIVRO: ${livro}
AUTOR: ${autor}
ORIENTAÇÃO: ${area} (${orientacaoDescricao[area as keyof typeof orientacaoDescricao] || area})

Retorne APENAS um JSON válido:
{
  "sobre": "Descrição detalhada do livro em 3-5 parágrafos. Inclua: contexto histórico em que foi escrito, principais ideias e teses defendidas, impacto na filosofia política e relevância atual. Seja objetivo e informativo. NÃO use Markdown.",
  "beneficios": "5 benefícios de ler este livro. Cada benefício em uma frase clara e objetiva. Separe cada benefício com \\n\\n. Foque no que o leitor vai aprender e como isso pode ampliar sua visão política."
}

IMPORTANTE:
- Escreva de forma clara e objetiva, sem viés político
- NÃO use asteriscos, hífens ou Markdown
- O conteúdo deve ser educativo e informativo
- Considere que o leitor quer entender diferentes perspectivas políticas`;

  for (const apiKey of GEMINI_KEYS) {
    if (!apiKey) continue;
    
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
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        const status = response.status;
        if (status === 429 || status === 503) {
          console.log(`Chave com erro ${status}, tentando próxima...`);
          continue;
        }
        throw new Error(`Erro ${status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extrair JSON do texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sobre: parsed.sobre || '',
          beneficios: parsed.beneficios || ''
        };
      }
    } catch (error) {
      console.error('Erro com Gemini:', error);
      continue;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { livros } = await req.json() as { livros: LivroInput[] };

    if (!livros || !Array.isArray(livros) || livros.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lista de livros é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultados: any[] = [];

    for (const livroInput of livros) {
      console.log(`Processando: ${livroInput.livro}`);
      
      try {
        // 1. Buscar capa do Google Books
        console.log('Buscando capa...');
        const capaUrl = await buscarCapaGoogleBooks(livroInput.livro, livroInput.autor);
        
        // 2. Gerar conteúdo com Gemini
        console.log('Gerando conteúdo com IA...');
        const conteudo = await gerarConteudoGemini(
          livroInput.livro, 
          livroInput.autor, 
          livroInput.area
        );

        // 3. Verificar se já existe
        const { data: existente } = await supabase
          .from('BIBLIOTECA-POLITICA')
          .select('id')
          .eq('livro', livroInput.livro)
          .single();

        const dadosLivro = {
          livro: livroInput.livro,
          autor: livroInput.autor,
          area: livroInput.area,
          link: livroInput.link_drive, // Link do Drive para leitura vertical
          download: null, // Paginação sem link por enquanto
          imagem: capaUrl || null,
          sobre: conteudo?.sobre || null,
          beneficios: conteudo?.beneficios || null,
        };

        let resultado;
        if (existente) {
          // Atualizar existente
          const { data, error } = await supabase
            .from('BIBLIOTECA-POLITICA')
            .update(dadosLivro)
            .eq('id', existente.id)
            .select()
            .single();
          
          if (error) throw error;
          resultado = { ...data, status: 'atualizado' };
        } else {
          // Inserir novo
          const { data, error } = await supabase
            .from('BIBLIOTECA-POLITICA')
            .insert(dadosLivro)
            .select()
            .single();
          
          if (error) throw error;
          resultado = { ...data, status: 'inserido' };
        }

        resultados.push(resultado);
        console.log(`✓ ${livroInput.livro} - ${resultado.status}`);
        
        // Pequeno delay para não sobrecarregar APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Erro ao processar ${livroInput.livro}:`, error);
        resultados.push({
          livro: livroInput.livro,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return new Response(
      JSON.stringify({
        total: livros.length,
        processados: resultados.filter(r => r.status !== 'erro').length,
        erros: resultados.filter(r => r.status === 'erro').length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
