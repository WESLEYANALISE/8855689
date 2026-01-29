import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumoJuridico {
  id: number;
  area: string;
  tema: string;
  subtema: string | null;
  conteudo: string;
}

interface QuestaoGerada {
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areas, questoesPorTema = 3, loteId } = await req.json();

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Buscar resumos das áreas selecionadas
    const { data: resumos, error: resumosError } = await supabase
      .from('RESUMO')
      .select('id, area, tema, subtema, conteudo')
      .in('area', areas)
      .order('area', { ascending: true })
      .order('tema', { ascending: true });

    if (resumosError) {
      throw new Error(`Erro ao buscar resumos: ${resumosError.message}`);
    }

    if (!resumos || resumos.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Nenhum resumo encontrado para as áreas selecionadas",
          processados: 0,
          geradas: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`📚 ${resumos.length} resumos encontrados para processar`);

    let processados = 0;
    let geradas = 0;
    const erros: any[] = [];
    const BATCH_SIZE = 3;
    const DELAY_MS = 1500;

    // Processar em batches para não estourar rate limit
    for (let i = 0; i < resumos.length; i += BATCH_SIZE) {
      const batch = resumos.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (resumo: ResumoJuridico) => {
          try {
            console.log(`🔄 Processando: ${resumo.area} - ${resumo.tema}`);

            const systemPrompt = `Você é um professor especialista em Direito criando questões para concursos públicos e OAB.

INSTRUÇÕES CRÍTICAS:
1. Crie questões OBJETIVAS no estilo OAB/concursos
2. Enunciado claro com situação prática ou conceitual
3. 4 alternativas plausíveis (A, B, C, D)
4. Apenas UMA alternativa correta
5. Comentário explicativo de 3-4 linhas justificando a resposta correta
6. Use linguagem técnica mas acessível
7. Evite pegadinhas excessivas
8. Base-se RIGOROSAMENTE no conteúdo fornecido

FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido no formato:
{
  "questoes": [
    {
      "enunciado": "Texto da questão (cenário + pergunta)",
      "alternativa_a": "Primeira opção",
      "alternativa_b": "Segunda opção",
      "alternativa_c": "Terceira opção",
      "alternativa_d": "Quarta opção",
      "resposta_correta": "A",
      "comentario": "Explicação detalhada de por que a alternativa está correta."
    }
  ]
}`;

            const userPrompt = `ÁREA: ${resumo.area}
TEMA: ${resumo.tema}
${resumo.subtema ? `SUBTEMA: ${resumo.subtema}` : ''}

CONTEÚDO BASE:
${resumo.conteudo}

Crie exatamente ${questoesPorTema} questões de múltipla escolha sobre este conteúdo.`;

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                  }],
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 3000,
                  }
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`Erro da API Gemini: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Limpar e extrair JSON
            let jsonText = text.trim();
            const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (fenceMatch) {
              jsonText = fenceMatch[1].trim();
            }

            let parsed: any;
            try {
              parsed = JSON.parse(jsonText);
            } catch (parseErr) {
              // Tentar extrair JSON balanceado
              const start = jsonText.indexOf('{');
              if (start !== -1) {
                let depth = 0;
                let inString = false;
                let escape = false;
                for (let j = start; j < jsonText.length; j++) {
                  const ch = jsonText[j];
                  if (inString) {
                    if (escape) {
                      escape = false;
                    } else if (ch === '\\') {
                      escape = true;
                    } else if (ch === '"') {
                      inString = false;
                    }
                  } else {
                    if (ch === '"') inString = true;
                    if (ch === '{') depth++;
                    if (ch === '}') {
                      depth--;
                      if (depth === 0) {
                        jsonText = jsonText.slice(start, j + 1);
                        break;
                      }
                    }
                  }
                }
              }
              parsed = JSON.parse(jsonText);
            }

            const questoes: QuestaoGerada[] = Array.isArray(parsed) ? parsed : parsed.questoes;

            if (!Array.isArray(questoes) || questoes.length === 0) {
              throw new Error('Nenhuma questão gerada');
            }

            // Salvar questões no banco
            for (const q of questoes) {
              const { error: insertError } = await supabase
                .from('QUESTOES_GERADAS')
                .insert({
                  area: resumo.area,
                  tema: resumo.tema,
                  subtema: resumo.subtema,
                  enunciado: q.enunciado,
                  alternativa_a: q.alternativa_a,
                  alternativa_b: q.alternativa_b,
                  alternativa_c: q.alternativa_c,
                  alternativa_d: q.alternativa_d,
                  resposta_correta: q.resposta_correta,
                  comentario: q.comentario
                });

              if (insertError) {
                console.error('Erro ao inserir questão:', insertError);
              } else {
                geradas++;
              }
            }

            processados++;
            console.log(`✅ ${resumo.area} - ${resumo.tema}: ${questoes.length} questões geradas`);

          } catch (error) {
            console.error(`❌ Erro ao processar ${resumo.area} - ${resumo.tema}:`, error);
            erros.push({
              area: resumo.area,
              tema: resumo.tema,
              erro: error instanceof Error ? error.message : 'Erro desconhecido'
            });
          }
        })
      );

      // Atualizar progresso no lote
      if (loteId) {
        await supabase
          .from('QUESTOES_LOTE')
          .update({
            total_resumos_processados: processados,
            total_questoes_geradas: geradas,
            progresso_percentual: (processados / resumos.length) * 100,
            log_erros: erros
          })
          .eq('id', loteId);
      }

      // Delay entre batches
      if (i + BATCH_SIZE < resumos.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Finalizar lote
    if (loteId) {
      await supabase
        .from('QUESTOES_LOTE')
        .update({
          status: 'concluido',
          concluido_em: new Date().toISOString(),
        })
        .eq('id', loteId);
    }

    console.log(`🎉 Geração concluída: ${processados}/${resumos.length} resumos, ${geradas} questões`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processados, 
        geradas, 
        erros: erros.length,
        detalhes_erros: erros
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
