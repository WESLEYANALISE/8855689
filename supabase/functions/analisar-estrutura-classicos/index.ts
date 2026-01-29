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
    const { livroId } = await req.json();
    
    if (!livroId) {
      throw new Error("Parâmetro 'livroId' é obrigatório");
    }

    console.log(`Analisando estrutura para livro clássico: ${livroId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar informações do livro
    const { data: livro, error: livroError } = await supabase
      .from('BIBLIOTECA-CLASSICOS')
      .select('livro, autor')
      .eq('id', livroId)
      .single();

    if (livroError) {
      console.error("Erro ao buscar livro:", livroError);
    }

    const tituloLivro = livro?.livro || 'Livro Clássico';
    const autorLivro = livro?.autor || '';

    // Buscar TODAS as páginas para análise completa
    const { data: paginas, error: paginasError } = await supabase
      .from('biblioteca_classicos_paginas')
      .select('pagina, conteudo')
      .eq('livro_id', livroId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise");
    }

    const totalPaginas = paginas.length;
    const ultimaPagina = paginas[paginas.length - 1].pagina;
    console.log(`Total de páginas encontradas: ${totalPaginas} (última: ${ultimaPagina})`);

    // Montar amostra do conteúdo com mais texto por página
    const conteudoAmostra = paginas
      .map(p => `--- PÁGINA ${p.pagina} ---\n${p.conteudo.substring(0, 3500)}`)
      .join('\n\n');

    console.log(`Tamanho total da amostra: ${conteudoAmostra.length} caracteres`);

    const prompt = `Você é um especialista em análise de estrutura de livros. 
Analise o livro "${tituloLivro}"${autorLivro ? ` de ${autorLivro}` : ''}.

CONTEÚDO COMPLETO (${totalPaginas} páginas, da 1 até ${ultimaPagina}):
${conteudoAmostra}

=== INSTRUÇÕES RIGOROSAS ===

**ETAPA 1 - LOCALIZAR E EXTRAIR SUMÁRIO:**
1. Procure nas páginas 1-15 por "SUMÁRIO", "ÍNDICE", "CONTEÚDO" ou "CONTENTS"
2. Esta seção contém a lista OFICIAL de capítulos do livro
3. Extraia TODOS os títulos listados, NA ORDEM que aparecem
4. CONTE quantos itens o sumário tem - este é o número EXATO de temas a retornar

**ETAPA 2 - MAPEAR PÁGINAS DOS CAPÍTULOS:**
Para cada título do sumário, encontre onde ele aparece como cabeçalho no corpo do livro.
Use indicadores: # ou ## do Markdown, texto em CAIXA ALTA, numeração (Capítulo I, 1, etc.)

**ETAPA 3 - DETERMINAR PÁGINA FINAL DO LIVRO:**
O livro TERMINA quando acabam os capítulos do sumário.
IGNORE páginas após o último capítulo que contenham:
- Propagandas de outros livros da mesma coleção
- "O QUE É..." seguido de outros temas não relacionados
- ISBN, informações editoriais, catálogos
- Biografias de outros autores

=== REGRAS ABSOLUTAS ===
1. RETORNE EXATAMENTE o número de capítulos que está no SUMÁRIO
2. Se o sumário tem 6 capítulos, retorne EXATAMENTE 6 temas
3. NÃO adicione seções extras como "Indicações para leitura", "Sobre o autor", propagandas
4. O último tema termina ANTES de qualquer material promocional/editorial
5. Páginas devem ser sequenciais e não sobrepor
6. Use títulos EXATAMENTE como escritos no sumário

=== FORMATO DE RESPOSTA ===
RESPONDA APENAS COM JSON válido:
{
  "sumario_encontrado": true,
  "pagina_sumario": 3,
  "total_capitulos_sumario": 6,
  "temas": [
    {
      "ordem": 1,
      "titulo": "Título EXATO do sumário",
      "resumo": "Breve descrição do conteúdo (1-2 linhas)",
      "pagina_inicial": 1,
      "pagina_final": 10
    }
  ]
}

ATENÇÃO: Se o sumário mostra 6 capítulos, o array "temas" DEVE ter EXATAMENTE 6 itens.
NÃO inclua material após o conteúdo do livro (propagandas, catálogos, etc).`;

    // Obter chaves Gemini (múltiplas para fallback)
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3')
    ].filter(Boolean) as string[];

    if (!geminiKeys.length) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    // Tentar com cada chave até uma funcionar
    let geminiResponse: Response | null = null;
    let lastError = "";
    
    for (const geminiKey of geminiKeys) {
      console.log("Tentando chave Gemini...");
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096
              }
            })
          }
        );

        if (response.ok) {
          geminiResponse = response;
          console.log("✅ Gemini respondeu com sucesso");
          break;
        } else {
          lastError = await response.text();
          console.error(`Erro com chave (${response.status}):`, lastError.substring(0, 200));
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Erro de conexão:", lastError);
      }
    }

    if (!geminiResponse) {
      throw new Error(`Todas as chaves Gemini falharam. Último erro: ${lastError.substring(0, 100)}`);
    }

    const geminiData = await geminiResponse.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Limpar JSON
    textResponse = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Resposta Gemini:", textResponse.substring(0, 500));

    const parsed = JSON.parse(textResponse);
    let temas = parsed.temas || [];
    const totalCapitulosSumario = parsed.total_capitulos_sumario;

    if (!temas.length) {
      throw new Error("Nenhum tema identificado pelo Gemini");
    }

    // Validação: usar apenas o número de capítulos do sumário
    if (totalCapitulosSumario && temas.length > totalCapitulosSumario) {
      console.log(`⚠️ Gemini retornou ${temas.length} temas, mas sumário tem ${totalCapitulosSumario}. Truncando...`);
      temas = temas.slice(0, totalCapitulosSumario);
    }

    console.log(`📚 Temas finais: ${temas.length} (sumário indicava: ${totalCapitulosSumario || 'N/A'})`)

    // Limpar temas antigos
    await supabase.from('biblioteca_classicos_temas')
      .delete()
      .eq('livro_id', livroId);

    // Inserir novos temas
    const temasParaInserir = temas.map((t: any) => ({
      livro_id: livroId,
      titulo: t.titulo,
      resumo: t.resumo,
      ordem: t.ordem,
      pagina_inicial: t.pagina_inicial,
      pagina_final: t.pagina_final,
      status: 'pendente'
    }));

    const { error: insertError } = await supabase
      .from('biblioteca_classicos_temas')
      .insert(temasParaInserir);

    if (insertError) {
      console.error("Erro ao inserir temas:", insertError);
      throw insertError;
    }

    // Atualizar status da trilha
    await supabase.from('BIBLIOTECA-CLASSICOS')
      .update({ 
        analise_status: 'pronto',
        total_temas: temas.length
      })
      .eq('id', livroId);

    console.log(`✅ ${temas.length} temas identificados e salvos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalTemas: temas.length,
        temas: temas.map((t: any) => t.titulo)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro na análise:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
