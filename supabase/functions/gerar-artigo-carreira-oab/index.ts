import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function gerarConteudoGemini(textoOcr: string, titulo: string): Promise<string> {
  const prompt = `Você é um professor de Direito especializado em orientar advogados recém-formados que acabaram de passar na OAB.

Baseado no seguinte conteúdo extraído de um PDF educacional sobre "${titulo}", gere uma AULA EXPLICATIVA COMPLETA E DETALHADA para advogados iniciantes.

CONTEÚDO DO PDF (extraído via OCR):
${textoOcr.substring(0, 50000)}

INSTRUÇÕES:
1. Crie um artigo didático e completo explicando TODO o conteúdo do PDF
2. Use linguagem acessível mas profissional, como um mentor experiente falando com um colega iniciante
3. Inclua exemplos práticos da advocacia real
4. Organize com títulos e subtítulos claros usando markdown (## e ###)
5. Adicione dicas práticas para o dia a dia do advogado
6. Se houver modelos ou formulários, explique como usá-los corretamente
7. Inclua alertas sobre erros comuns a evitar
8. O artigo deve ter no mínimo 2000 palavras para ser completo
9. Use emojis moderadamente para tornar a leitura mais agradável (📋 ⚖️ 💡 ⚠️ ✅)

Gere o artigo completo agora:`;

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 16000,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Key ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        console.error(`Erro Gemini key ${i + 1}:`, await response.text());
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (content) {
        return content;
      }
    } catch (error) {
      console.error(`Erro na key ${i + 1}:`, error);
    }
  }

  throw new Error('Todas as chaves Gemini falharam');
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar artigo pelo ordem
    const { data: artigo, error: fetchError } = await supabase
      .from('oab_carreira_blog')
      .select('*')
      .eq('ordem', ordem)
      .single();

    if (fetchError || !artigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já tem conteúdo gerado (cache válido por 30 dias)
    if (artigo.conteudo_gerado && artigo.cache_validade) {
      const cacheValidade = new Date(artigo.cache_validade);
      if (cacheValidade > new Date()) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            conteudo: artigo.conteudo_gerado,
            fromCache: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar se tem texto OCR
    if (!artigo.texto_ocr) {
      return new Response(
        JSON.stringify({ error: 'PDF ainda não foi processado via OCR. Processe primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando artigo para: ${artigo.titulo}`);

    // Gerar conteúdo com Gemini
    const conteudoGerado = await gerarConteudoGemini(artigo.texto_ocr, artigo.titulo);

    // Extrair tópicos do conteúdo
    const topicos = conteudoGerado
      .split('\n')
      .filter(line => line.startsWith('## ') || line.startsWith('### '))
      .map(line => line.replace(/^#+ /, '').trim())
      .slice(0, 10);

    // Gerar descrição curta
    const descricaoCurta = conteudoGerado
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .slice(0, 2)
      .join(' ')
      .substring(0, 200) + '...';

    // Salvar no banco
    const cacheValidade = new Date();
    cacheValidade.setDate(cacheValidade.getDate() + 30);

    const { error: updateError } = await supabase
      .from('oab_carreira_blog')
      .update({
        conteudo_gerado: conteudoGerado,
        descricao_curta: descricaoCurta,
        topicos: topicos,
        gerado_em: new Date().toISOString(),
        cache_validade: cacheValidade.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('ordem', ordem);

    if (updateError) {
      console.error('Erro ao salvar:', updateError);
      throw updateError;
    }

    console.log(`Artigo gerado com sucesso: ${artigo.titulo}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conteudo: conteudoGerado,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro gerar-artigo-carreira-oab:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
