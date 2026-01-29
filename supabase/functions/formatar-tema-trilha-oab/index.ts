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
    const { temaId, area, paginaInicial, paginaFinal } = await req.json();
    
    if (!temaId || !area) {
      return new Response(
        JSON.stringify({ error: 'temaId e area são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY_2') || Deno.env.get('GEMINI_KEY_3');
    
    if (!geminiApiKey) throw new Error('GEMINI_KEY não configurada');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tema
    const { data: tema, error: temaError } = await supabase
      .from('oab_trilhas_temas')
      .select('*')
      .eq('id', temaId)
      .maybeSingle();

    if (temaError) throw temaError;
    if (!tema) throw new Error(`Tema não encontrado: ${temaId}`);

    // Buscar conteúdo das páginas
    let query = supabase
      .from('oab_trilhas_conteudo')
      .select('pagina, conteudo')
      .eq('area', area)
      .order('pagina');

    if (paginaInicial && paginaFinal) {
      query = query.gte('pagina', paginaInicial).lte('pagina', paginaFinal);
    } else {
      query = query.limit(30);
    }

    const { data: paginas, error: paginasError } = await query;
    if (paginasError) throw paginasError;

    const conteudoBruto = paginas?.map(p => p.conteudo).join('\n\n') || '';

    // Prompt para formatar conteúdo com regras anti-alucinação
    const promptFormatacao = `Você é um professor especialista em ${area}. 
Formate este conteúdo sobre "${tema.titulo}" de forma didática e organizada.

⛔ PROIBIÇÕES ABSOLUTAS:
1. NÃO INVENTE artigos de lei que não estejam no conteúdo bruto abaixo
2. NÃO CRIE citações de doutrinadores com textos inventados
3. NÃO FABRIQUE jurisprudência ou números de processos
4. Use APENAS informações do CONTEÚDO BRUTO fornecido

CONTEÚDO BRUTO:
${conteudoBruto.substring(0, 15000)}

INSTRUÇÕES DE FORMATAÇÃO:
1. Use Markdown com títulos (##, ###), listas, negrito e itálico
2. Organize em seções claras: Conceito, Características, Aplicação Prática
3. Destaque artigos de lei com citações em bloco (>) - SOMENTE os que estão no conteúdo
4. Adicione exemplos práticos baseados no conteúdo
5. Mantenha linguagem clara e objetiva
6. Se não houver jurisprudência no conteúdo, NÃO adicione seção de jurisprudência

Retorne APENAS o conteúdo formatado em Markdown, sem explicações adicionais.`;

    const formatResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptFormatacao }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
      }
    );

    const formatResult = await formatResponse.json();
    const conteudoFormatado = formatResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Prompt para gerar flashcards com regras anti-alucinação
    const promptFlashcards = `Com base neste conteúdo sobre "${tema.titulo}" de ${area}, gere 8 flashcards para estudo.

⛔ PROIBIÇÃO: NÃO invente artigos de lei ou citações que não estejam no conteúdo abaixo.

CONTEÚDO:
${conteudoFormatado.substring(0, 5000)}

Retorne um JSON com flashcards no formato:
{
  "flashcards": [
    { "frente": "Pergunta ou conceito", "verso": "Resposta ou explicação" }
  ]
}

IMPORTANTE:
- Use APENAS conceitos presentes no conteúdo acima
- NÃO cite artigos de lei que não estejam no conteúdo
- Frente deve ser uma pergunta ou termo
- Verso deve ser a resposta/definição
- Retorne APENAS o JSON, sem markdown`;

    const flashResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptFlashcards }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
      }
    );

    const flashResult = await flashResponse.json();
    let flashText = flashResult.candidates?.[0]?.content?.parts?.[0]?.text || '{"flashcards":[]}';
    flashText = flashText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcards = JSON.parse(flashText).flashcards || [];

    // Prompt para gerar questões com regras anti-alucinação
    const promptQuestoes = `Com base neste conteúdo sobre "${tema.titulo}" de ${area}, gere 5 questões de múltipla escolha.

⛔ PROIBIÇÃO: NÃO invente fundamentos legais ou jurisprudência nas explicações.

CONTEÚDO:
${conteudoFormatado.substring(0, 5000)}

Retorne um JSON com questões no formato:
{
  "questoes": [
    {
      "enunciado": "Texto da questão",
      "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"],
      "correta": 0,
      "explicacao": "Por que a alternativa está correta - baseado no conteúdo"
    }
  ]
}

IMPORTANTE:
- Use APENAS conceitos presentes no conteúdo acima
- NÃO cite artigos de lei que não estejam no conteúdo
- 4 alternativas por questão
- "correta" é o índice da alternativa correta (0-3)
- Explicação baseada no conteúdo fornecido
- Retorne APENAS o JSON, sem markdown`;

    const questResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptQuestoes }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
        }),
      }
    );

    const questResult = await questResponse.json();
    let questText = questResult.candidates?.[0]?.content?.parts?.[0]?.text || '{"questoes":[]}';
    questText = questText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questoes = JSON.parse(questText).questoes || [];

    // Atualizar tema com conteúdo formatado
    await supabase
      .from('oab_trilhas_temas')
      .update({
        conteudo_formatado: conteudoFormatado,
        flashcards,
        questoes,
        status: 'concluido',
      })
      .eq('id', temaId);

    // Verificar se todos os temas estão concluídos
    const { data: temasArea } = await supabase
      .from('oab_trilhas_temas')
      .select('status')
      .eq('area', area);

    const todosConcluidos = temasArea?.every(t => t.status === 'concluido');

    if (todosConcluidos) {
      await supabase
        .from('oab_trilhas_areas')
        .update({ status: 'concluido' })
        .eq('area', area);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        temaId,
        flashcardsGerados: flashcards.length,
        questoesGeradas: questoes.length,
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
