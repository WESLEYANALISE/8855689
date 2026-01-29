import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v2.0.0";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  console.log(`🔑 ${API_KEYS.length} chaves API disponíveis`);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}: ${errorText.substring(0, 200)}`);
      continue;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Exceção em ${name}: ${msg}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-base-legal@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flashcard_id, pergunta, resposta, tabela, area } = await req.json();

    if (!flashcard_id || !pergunta || !resposta) {
      throw new Error('flashcard_id, pergunta e resposta são obrigatórios');
    }

    const tabelaDestino = tabela === 'artigos-lei' ? 'FLASHCARDS - ARTIGOS LEI' : 'FLASHCARDS_GERADOS';

    console.log(`[gerar-base-legal] Gerando base legal para flashcard ${flashcard_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe base legal
    const { data: flashcard } = await supabase
      .from(tabelaDestino)
      .select('base_legal')
      .eq('id', flashcard_id)
      .single();

    if (flashcard?.base_legal) {
      console.log(`[gerar-base-legal] Base legal já existe, retornando cache`);
      return new Response(
        JSON.stringify({ base_legal: flashcard.base_legal, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 1: Buscar nos resumos se há citação de base legal relacionada
    console.log(`[gerar-base-legal] Buscando base legal nos resumos...`);
    
    const textoCompleto = `${pergunta} ${resposta}`.toLowerCase();
    const palavrasChave = textoCompleto
      .replace(/[?.,;:!]/g, '')
      .split(' ')
      .filter((p: string) => p.length > 4 && !['sobre', 'quais', 'quando', 'porque', 'como', 'onde', 'qual'].includes(p))
      .slice(0, 8);
    
    let baseLegalDoResumo: string | null = null;
    
    if (palavrasChave.length > 0 && area) {
      const { data: resumos } = await supabase
        .from('RESUMO')
        .select('conteudo, tema')
        .eq('area', area)
        .limit(20);
      
      if (resumos && resumos.length > 0) {
        const regexBaseLegal = /(?:Art\.?\s*\d+[º°]?(?:\s*,?\s*(?:§|parágrafo)\s*\d+[º°]?)?(?:\s*,?\s*(?:inciso|inc\.?)\s*[IVXLCDM]+)?(?:\s*(?:da|do|dos|das)\s+(?:Lei|CF|CC|CP|CPC|CPP|CLT|CDC|CTN|Constituição|Código)[^.;,]*)?|Lei\s*(?:n[º°]?\s*)?\d+[\d.\/]*(?:\s*\/\s*\d+)?|Súmula\s*(?:n[º°]?\s*)?\d+\s*(?:do\s+)?(?:STF|STJ|TST)?)/gi;
        
        let melhorMatch: { trecho: string; citacao: string; relevancia: number } | null = null;
        
        for (const resumo of resumos) {
          if (!resumo.conteudo) continue;
          
          const conteudoLower = resumo.conteudo.toLowerCase();
          const relevancia = palavrasChave.filter((palavra: string) => conteudoLower.includes(palavra)).length;
          
          if (relevancia >= 2) {
            const sentencas = resumo.conteudo.split(/(?<=[.!?])\s+/);
            
            for (const sentenca of sentencas) {
              const matches = sentenca.match(regexBaseLegal);
              if (matches && matches.length > 0) {
                const sentencaLower = sentenca.toLowerCase();
                const relevanciaSentenca = palavrasChave.filter((p: string) => sentencaLower.includes(p)).length;
                
                if (relevanciaSentenca > 0 && (!melhorMatch || relevanciaSentenca > melhorMatch.relevancia)) {
                  let trecho = sentenca.trim();
                  if (trecho.length > 200) {
                    trecho = trecho.substring(0, 200) + '...';
                  }
                  
                  melhorMatch = {
                    trecho,
                    citacao: matches[0],
                    relevancia: relevanciaSentenca
                  };
                }
              }
            }
          }
        }
        
        if (melhorMatch) {
          baseLegalDoResumo = `${melhorMatch.trecho}\n\n📚 Fundamento: ${melhorMatch.citacao}`;
          console.log(`[gerar-base-legal] Base legal encontrada no resumo com contexto`);
        }
      }
    }

    // Se encontrou base legal no resumo, usar ela
    if (baseLegalDoResumo) {
      console.log(`[gerar-base-legal] Usando base legal elaborada do resumo`);
      
      const { error: updateError } = await supabase
        .from(tabelaDestino)
        .update({ base_legal: baseLegalDoResumo })
        .eq('id', flashcard_id);

      if (updateError) {
        console.error(`[gerar-base-legal] Erro ao salvar:`, updateError);
      }

      return new Response(
        JSON.stringify({ base_legal: baseLegalDoResumo, cached: false, source: 'resumo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 2: Se não encontrou no resumo, gerar com Gemini
    console.log(`[gerar-base-legal] Não encontrou no resumo, gerando com Gemini...`);

    const prompt = `Você é um especialista em Direito brasileiro. Analise a seguinte pergunta e resposta de um flashcard jurídico e forneça a BASE LEGAL correspondente.

PERGUNTA: ${pergunta}

RESPOSTA: ${resposta}

Sua tarefa:
1. Identifique os artigos de lei, códigos, constituição ou súmulas que fundamentam essa resposta
2. Cite apenas as fontes mais relevantes e diretas
3. Seja conciso e preciso

Responda APENAS com a base legal, no formato:
"Art. X da Lei Y" ou "Art. X do Código Z" ou "Súmula X do STF/STJ"

Se houver múltiplas bases, separe por ponto e vírgula.

Se não for possível identificar uma base legal específica, responda com o ramo do direito e princípio aplicável, como: "Princípio X do Direito Y".`;

    const baseLegal = await chamarGeminiComFallback(prompt);

    if (!baseLegal) {
      throw new Error('Nenhuma base legal gerada');
    }

    console.log(`[gerar-base-legal] Base legal gerada: ${baseLegal.substring(0, 100)}...`);

    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update({ base_legal: baseLegal })
      .eq('id', flashcard_id);

    if (updateError) {
      console.error(`[gerar-base-legal] Erro ao salvar:`, updateError);
    } else {
      console.log(`[gerar-base-legal] Base legal salva no banco`);
    }

    return new Response(
      JSON.stringify({ base_legal: baseLegal, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[gerar-base-legal] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
