import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, artigo, codigo, numeroArtigo, tipo } = await req.json();
    const textoParaAnalise = artigo || content;

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    // Importar createClient do Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.75.1');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Mapeamento COMPLETO de códigos - Cache Universal
    const tableMap: { [key: string]: string } = {
      'cp': 'CP - Código Penal',
      'cpp': 'CPP – Código de Processo Penal',
      'cc': 'CC - Código Civil',
      'cf': 'CF - Constituição Federal',
      'cpc': 'CPC – Código de Processo Civil',
      'cppenal': 'CPP – Código de Processo Penal',
      'cdc': 'CDC – Código de Defesa do Consumidor',
      'clt': 'CLT – Consolidação das Leis do Trabalho',
      'ctn': 'CTN – Código Tributário Nacional',
      'ctb': 'CTB Código de Trânsito Brasileiro',
      'ce': 'CE – Código Eleitoral',
      'ca': 'CA - Código de Águas',
      'cba': 'CBA Código Brasileiro de Aeronáutica',
      'ccom': 'CCOM – Código Comercial',
      'cdm': 'CDM – Código de Minas',
      'eca': 'ESTATUTO - ECA',
      'idoso': 'ESTATUTO - IDOSO',
      'oab': 'ESTATUTO - OAB',
      'pcd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
      'racial': 'ESTATUTO - IGUALDADE RACIAL',
      'cidade': 'ESTATUTO - CIDADE',
      'torcedor': 'ESTATUTO - TORCEDOR'
    };

    const tableName = tableMap[codigo];

    // Verificar se já existem questões em cache - UNIVERSAL (apenas para artigos, não para chat)
    if (tableName && numeroArtigo && tipo !== 'chat') {
      const { data: cached } = await supabase
        .from(tableName)
        .select('questoes')
        .eq('Número do Artigo', numeroArtigo)
        .maybeSingle();

      if (cached?.questoes && Array.isArray(cached.questoes) && cached.questoes.length > 0) {
        console.log('✅ Retornando questões do cache - 0 tokens gastos');
        return new Response(
          JSON.stringify({ questions: cached.questoes, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const systemPrompt = `Você é um professor especializado em criar questões de múltipla escolha sobre direito brasileiro.
Crie questões objetivas, claras e educacionais no estilo de concursos públicos e OAB.

Retorne no formato JSON estruturado usando tool calling.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nCrie 5 questões de múltipla escolha sobre este conteúdo jurídico:\n\n${textoParaAnalise}\n\nRetorne APENAS um JSON válido no formato:\n{\n  "questions": [\n    {\n      "question": "enunciado",\n      "options": ["A", "B", "C", "D"],\n      "correctAnswer": 0,\n      "explanation": "explicação"\n    },\n    ...\n  ]\n}`
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro da API de IA: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('📥 Resposta recebida da IA (primeiros 200 chars):', text.substring(0, 200));

    // Função auxiliar: extrair JSON de bloco cercado por crases
    const extractFromFences = (s: string): string | null => {
      const match = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      return match ? match[1].trim() : null;
    };

    // Função auxiliar: extrair JSON balanceando chaves
    const extractBalancedJson = (s: string): string | null => {
      const start = s.indexOf('{');
      if (start === -1) return null;
      let inString = false;
      let escape = false;
      let depth = 0;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (inString) {
          if (escape) {
            escape = false;
          } else if (ch === '\\') {
            escape = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        } else {
          if (ch === '"') {
            inString = true;
            continue;
          }
          if (ch === '{') depth++;
          if (ch === '}') {
            depth--;
            if (depth === 0) {
              return s.slice(start, i + 1).trim();
            }
          }
        }
      }
      return null;
    };

    // Tentar múltiplas estratégias de limpeza/extração
    let jsonText = text.trim();

    // 1) Se houver fences, extrair o conteúdo interno
    const fenced = extractFromFences(jsonText);
    if (fenced) jsonText = fenced;

    // 2) Remover fences remanescentes no início/fim (caso ainda existam)
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // 3) Se ainda contiver texto extra, tentar extrair JSON balanceado
    if (!(jsonText.startsWith('{') && jsonText.endsWith('}'))) {
      const balanced = extractBalancedJson(jsonText);
      if (balanced) jsonText = balanced;
    }

    console.log('🧹 JSON candidato (primeiros 200 chars):', jsonText.substring(0, 200));

    let parsed: any = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('❌ Falha ao parsear JSON na primeira tentativa:', parseErr);
      // Último recurso: tentar remover marcações comuns acidentais
      const cleaned = jsonText
        .replace(/^[^\{]*\{/s, '{') // remover lixo antes da primeira chave
        .replace(/\}[^\}]*$/s, '}') // remover lixo após a última chave
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr2) {
        console.error('❌ Falha ao parsear JSON após limpeza extra:', parseErr2);
        console.error('📄 Conteúdo bruto recebido (primeiros 500 chars):', text.substring(0, 500));
        // Não lançar erro para evitar 500; retornar questões vazias com diagnóstico
        parsed = { questions: [], _raw: text, _error: 'invalid_json' };
      }
    }

    // Compatibilidade: alguns modelos podem retornar o array diretamente
    let questions = Array.isArray(parsed) ? parsed : parsed.questions;

    if (!Array.isArray(questions)) {
      console.warn('⚠️ Estrutura inesperada. Definindo questions como array vazio.');
      questions = [];
    }

    console.log(`✅ ${questions.length} questões parseadas com sucesso`);

    // Salvar questões no banco - UNIVERSAL (apenas para artigos, não para chat)
    if (tableName && numeroArtigo && questions && questions.length > 0 && tipo !== 'chat') {
      try {
        await supabase
          .from(tableName)
          .update({ 
            questoes: questions,
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('Número do Artigo', numeroArtigo);
        console.log(`💾 Questões salvas no banco (${tableName}) - próximos requests usarão cache (0 tokens)`);
      } catch (e) {
        console.error(`❌ Erro ao salvar questões no banco (${tableName}):`, e);
      }
    }

    return new Response(
      JSON.stringify({ questions, cached: false }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro:", error);
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
