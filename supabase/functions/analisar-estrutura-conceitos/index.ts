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
    const { trilha } = await req.json();
    
    if (!trilha) {
      throw new Error("Parâmetro 'trilha' é obrigatório");
    }

    console.log(`Analisando estrutura para trilha: ${trilha}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar TODAS as páginas para análise completa
    const { data: paginas, error: paginasError } = await supabase
      .from('conceitos_livro_paginas')
      .select('pagina, conteudo')
      .eq('trilha', trilha)
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

    const prompt = `Você é um especialista em análise de ÍNDICES de livros jurídicos. Sua tarefa é identificar APENAS os CAPÍTULOS PRINCIPAIS (numerados) do livro.

CONTEÚDO DO LIVRO (${totalPaginas} páginas, da página 1 até ${ultimaPagina}):
${conteudoAmostra}

⚠️ REGRA CRÍTICA - DIFERENCIE CAPÍTULOS DE SUBTÓPICOS:
- CAPÍTULOS PRINCIPAIS: São os itens numerados no índice (1. SURGIMENTO DO DIREITO, 2. DIREITO NA GRÉCIA, 3. DIREITO ROMANO, etc.)
- SUBTÓPICOS: São os itens subordinados dentro de cada capítulo (ex: "Ponto de Vista Formal", "Hábitos e Costumes" são SUBTÓPICOS do capítulo "Surgimento do Direito")

❌ NÃO EXTRAIA SUBTÓPICOS COMO TEMAS!
✅ EXTRAIA APENAS OS CAPÍTULOS PRINCIPAIS NUMERADOS!

EXEMPLO DO QUE NÃO FAZER (ERRADO):
- Tema 1: Surgimento do Direito
- Tema 2: Ponto de Vista Formal e Material ← ERRADO! Isso é subtópico!
- Tema 3: Hábitos e Costumes ← ERRADO! Isso é subtópico!

EXEMPLO DO QUE FAZER (CORRETO):
- Tema 1: Surgimento do Direito (páginas 1-6) ← inclui todos os subtópicos internos
- Tema 2: Direito na Grécia (páginas 7-9)
- Tema 3: Direito Romano (páginas 10-12)

REGRAS:
1. Identifique entre 5 e 15 CAPÍTULOS PRINCIPAIS
2. Os temas devem estar em ORDEM SEQUENCIAL de páginas
3. O primeiro tema começa na página 1 e o último termina na página ${ultimaPagina}
4. Cada capítulo AGRUPA seus subtópicos internamente

RESPONDA APENAS COM JSON válido:
{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Nome do Capítulo Principal",
      "resumo": "Descrição breve do capítulo",
      "pagina_inicial": 1,
      "pagina_final": 6
    }
  ]
}`;

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
        // Usando gemini-2.5-flash (atualizado do 2.0-flash)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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
    const temas = parsed.temas || [];

    if (!temas.length) {
      throw new Error("Nenhum tema identificado pelo Gemini");
    }

    // Limpar temas antigos
    await supabase.from('conceitos_livro_temas')
      .delete()
      .eq('trilha', trilha);

    // Inserir novos temas
    const temasParaInserir = temas.map((t: any) => ({
      trilha,
      titulo: t.titulo,
      resumo: t.resumo,
      ordem: t.ordem,
      pagina_inicial: t.pagina_inicial,
      pagina_final: t.pagina_final,
      status: 'pendente'
    }));

    const { error: insertError } = await supabase
      .from('conceitos_livro_temas')
      .insert(temasParaInserir);

    if (insertError) {
      console.error("Erro ao inserir temas:", insertError);
      throw insertError;
    }

    // Atualizar status da trilha
    await supabase.from('conceitos_trilhas')
      .update({ 
        status: 'pronto',
        total_temas: temas.length
      })
      .eq('codigo', trilha);

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
