import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v3.0.0-20-flashcards";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração: máximo de subtemas por chamada para evitar timeout
const MAX_SUBTEMAS_POR_CHAMADA = 5;

// Sistema de fallback com 4 chaves API
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'GEMINI_KEY_3', key: Deno.env.get('GEMINI_KEY_3') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma API key configurada');
  }

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 12000 }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}`);
      continue;
    } catch (error) {
      console.error(`❌ Exceção em ${name}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards-tema@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, resumos } = await req.json();

    if (!area || !tema || !resumos || resumos.length === 0) {
      throw new Error('área, tema e resumos são obrigatórios');
    }

    console.log(`\n📚 [Flashcards] Iniciando geração progressiva para ${area} > ${tema}`);
    console.log(`📝 ${resumos.length} resumos recebidos`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Agrupar resumos por subtema
    const resumosPorSubtema = resumos.reduce((acc: any, resumo: any) => {
      const subtema = resumo.subtema || resumo.tema;
      if (!acc[subtema]) {
        acc[subtema] = [];
      }
      acc[subtema].push(resumo);
      return acc;
    }, {});

    const todosSubtemas = Object.keys(resumosPorSubtema);
    const totalSubtemas = todosSubtemas.length;
    
    console.log(`📊 Total de subtemas no tema: ${totalSubtemas}`);

    // 1. Verificar quais subtemas JÁ têm flashcards gerados
    const { data: subtemasExistentes } = await supabase
      .from('FLASHCARDS_GERADOS')
      .select('subtema')
      .eq('area', area)
      .eq('tema', tema);

    const subtemasJaProcessados = new Set(
      (subtemasExistentes || []).map((r: any) => r.subtema)
    );
    
    console.log(`✅ Subtemas já processados: ${subtemasJaProcessados.size}/${totalSubtemas}`);

    // 2. Filtrar subtemas que ainda faltam processar
    const subtemasPendentes = todosSubtemas.filter(
      subtema => !subtemasJaProcessados.has(subtema)
    );
    
    console.log(`⏳ Subtemas pendentes: ${subtemasPendentes.length}`);

    // 3. Buscar flashcards já existentes
    const { data: flashcardsExistentes } = await supabase
      .from('FLASHCARDS_GERADOS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema);

    const flashcardsAtuais = flashcardsExistentes || [];

    // 4. Se TODOS os subtemas já foram processados, retornar do cache
    if (subtemasPendentes.length === 0) {
      console.log(`🎉 Todos os ${totalSubtemas} subtemas já processados! Retornando cache.`);
      
      return new Response(
        JSON.stringify({ 
          flashcards: flashcardsAtuais,
          flashcards_gerados: flashcardsAtuais.length,
          total_subtemas: totalSubtemas,
          subtemas_processados: totalSubtemas,
          geracao_completa: true,
          subtemas_faltantes: 0,
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Limitar a MAX_SUBTEMAS_POR_CHAMADA para evitar timeout
    const subtemasParaProcessar = subtemasPendentes.slice(0, MAX_SUBTEMAS_POR_CHAMADA);
    
    console.log(`\n🎯 Processando ${subtemasParaProcessar.length} subtemas nesta chamada:`);
    subtemasParaProcessar.forEach((s, i) => console.log(`   ${i+1}. ${s}`));

    const flashcardsGeradosNestaChamada: any[] = [];

    // 6. Processar cada subtema E SALVAR IMEDIATAMENTE
    for (let i = 0; i < subtemasParaProcessar.length; i++) {
      const subtema = subtemasParaProcessar[i];
      const resumosDoSubtema = resumosPorSubtema[subtema];
      
      console.log(`\n🔄 [${i+1}/${subtemasParaProcessar.length}] Processando: "${subtema}"`);

      const conteudoCombinado = resumosDoSubtema
        .map((r: any) => r.conteudo)
        .join('\n\n---\n\n');

      const prompt = `Você é um professor experiente de Direito criando flashcards de memorização para estudantes.

📚 CONTEXTO DO CONTEÚDO:
Área: ${area}
Tema: ${tema}
Subtema: ${subtema}

📖 MATERIAL BASE PARA OS FLASHCARDS:
${conteudoCombinado}

🎯 TAREFA: Criar EXATAMENTE 20 flashcards de memorização sobre o subtema "${subtema}" baseados EXCLUSIVAMENTE no conteúdo acima.

✅ REGRAS OBRIGATÓRIAS:
1. SEMPRE gerar EXATAMENTE 20 flashcards (nem mais, nem menos!)
2. Cada flashcard TEM QUE TER: pergunta, resposta e exemplo_pratico
3. Pergunta: clara, objetiva, máximo 150 caracteres
4. Resposta: concisa mas completa, ideal 2-4 frases
5. Exemplo prático OBRIGATÓRIO: história curta ilustrando o conceito (mínimo 2 frases)
6. Baseado APENAS no conteúdo fornecido

📊 DISTRIBUIÇÃO DOS 20 FLASHCARDS:
- 6 flashcards sobre conceitos e definições
- 5 flashcards sobre requisitos e elementos
- 4 flashcards sobre procedimentos e prazos
- 3 flashcards sobre jurisprudência e súmulas
- 2 flashcards sobre casos práticos e exceções

❌ NÃO RETORNE NADA ALÉM DO JSON!

✅ RETORNE APENAS ESTE FORMATO JSON:
{
  "flashcards": [
    {
      "pergunta": "Pergunta clara e objetiva?",
      "resposta": "Resposta concisa e completa com conceitos-chave.",
      "exemplo_pratico": "História curta ilustrando o conceito..."
    }
  ]
}`;

      try {
        const textoResposta = await chamarGeminiComFallback(prompt);
        
        const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`❌ Resposta inválida para subtema "${subtema}"`);
          continue;
        }

        const flashcardsData = JSON.parse(jsonMatch[0]);
        const flashcards = flashcardsData.flashcards || [];
        
        console.log(`   ✅ ${flashcards.length} flashcards gerados`);

        // Preparar flashcards com metadados
        const flashcardsComMetadados = flashcards.map((f: any) => ({
          area,
          tema,
          subtema,
          pergunta: f.pergunta,
          resposta: f.resposta,
          exemplo: f.exemplo_pratico || f.exemplo || null,
          url_imagem_exemplo: null
        }));

        // ⚡ SALVAR IMEDIATAMENTE após cada subtema
        if (flashcardsComMetadados.length > 0) {
          console.log(`   💾 Salvando ${flashcardsComMetadados.length} flashcards...`);
          
          const { error: insertError } = await supabase
            .from('FLASHCARDS_GERADOS')
            .insert(flashcardsComMetadados);

          if (insertError) {
            console.error(`   ❌ Erro ao salvar: ${insertError.message}`);
          } else {
            console.log(`   ✅ Flashcards salvos com sucesso!`);
            flashcardsGeradosNestaChamada.push(...flashcardsComMetadados);
          }
        }

        // Delay entre subtemas
        if (i + 1 < subtemasParaProcessar.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
        continue;
      }
    }

    // 7. Calcular status final
    const subtemasProcessadosAgora = subtemasJaProcessados.size + subtemasParaProcessar.length;
    const subtemasFaltantes = totalSubtemas - subtemasProcessadosAgora;
    const geracaoCompleta = subtemasFaltantes <= 0;

    // 8. Buscar TODOS os flashcards atualizados
    const { data: todosFlashcards } = await supabase
      .from('FLASHCARDS_GERADOS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema);

    const flashcardsFinais = todosFlashcards || [];

    console.log(`\n📊 RESUMO DA CHAMADA:`);
    console.log(`   - Flashcards gerados nesta chamada: ${flashcardsGeradosNestaChamada.length}`);
    console.log(`   - Total de flashcards disponíveis: ${flashcardsFinais.length}`);
    console.log(`   - Subtemas processados: ${subtemasProcessadosAgora}/${totalSubtemas}`);
    console.log(`   - Geração completa: ${geracaoCompleta ? 'SIM ✅' : 'NÃO ⏳'}`);

    return new Response(
      JSON.stringify({ 
        flashcards: flashcardsFinais,
        flashcards_gerados: flashcardsGeradosNestaChamada.length,
        total_flashcards: flashcardsFinais.length,
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosAgora,
        subtemas_faltantes: subtemasFaltantes,
        geracao_completa: geracaoCompleta,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-flashcards-tema:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
