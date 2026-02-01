import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v1.0.2-slides-artigo-fallback";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool de chaves Gemini com fallback
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const keyPremium = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (keyPremium) keys.push(keyPremium);
  
  return keys;
}

async function callGeminiWithFallback(prompt: string, keys: string[]): Promise<any> {
  for (let i = 0; i < keys.length; i++) {
    try {
      console.log(`🔑 Tentando chave Gemini ${i + 1}/${keys.length}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${keys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 40000,
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`⚠️ Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        if (errorText.includes('API_KEY_INVALID') || errorText.includes('expired')) {
          console.log(`⚠️ Chave ${i + 1} expirada/inválida, tentando próxima...`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro na chave ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`✅ Sucesso com chave ${i + 1}`);
        return { text, keyIndex: i + 1 };
      } else {
        console.log(`⚠️ Resposta vazia da chave ${i + 1}`);
        continue;
      }
    } catch (error) {
      console.error(`❌ Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam ou estão expiradas');
}

serve(async (req) => {
  console.log(`📍 Function: gerar-slides-artigo@${REVISION}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela, numeroArtigo, conteudoArtigo, codigoNome } = await req.json();
    
    if (!codigoTabela || !numeroArtigo || !conteudoArtigo) {
      throw new Error('Código da tabela, número do artigo e conteúdo são obrigatórios');
    }

    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }
    console.log(`🔑 ${geminiKeys.length} chaves Gemini disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando se já existe slides_json para:', codigoTabela, numeroArtigo);

    // Check if slides already exist
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_artigos')
      .select('id, slides_json, estrutura_completa')
      .eq('codigo_tabela', codigoTabela)
      .eq('numero_artigo', numeroArtigo)
      .single();

    // Se já existe slides_json, retorna do cache
    if (existingAula?.slides_json && !fetchError) {
      console.log('✅ slides_json encontrado no cache, retornando...');
      
      await supabase
        .from('aulas_artigos')
        .update({ visualizacoes: (existingAula as any).visualizacoes || 0 + 1 })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...existingAula.slides_json,
        cached: true,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Gerando slides no formato ConceitosSlidesViewer...');

    const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO. Sua missão é criar SLIDES INTERATIVOS sobre este artigo de lei no formato específico para o componente de slides.

CÓDIGO: ${codigoTabela}
NOME DO CÓDIGO: ${codigoNome || codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO COMPLETO DO ARTIGO:
${conteudoArtigo}

═══════════════════════════════════════════════════════════════════
                    FORMATO DOS SLIDES (IMPORTANTE!)
═══════════════════════════════════════════════════════════════════

Gere slides no formato ConceitoSlide com os tipos:
- introducao: Página de abertura com título e objetivos
- texto: Texto explicativo simples
- termos: Lista de termos jurídicos e definições
- explicacao: Explicação detalhada
- linha_tempo: Timeline/etapas de procedimento
- tabela: Quadro comparativo
- atencao: Ponto de atenção importante
- dica: Dica de memorização
- caso: Caso prático/exemplo
- resumo: Resumo com pontos principais
- quickcheck: Mini-quiz rápido

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════

{
  "versao": 1,
  "titulo": "Art. ${numeroArtigo} - [Título descritivo curto]",
  "tempoEstimado": "[X] min",
  "area": "${codigoNome || codigoTabela}",
  "objetivos": [
    "Compreender o texto do artigo",
    "Aplicar na prática",
    "Identificar exceções e pegadinhas"
  ],
  "secoes": [
    {
      "id": 1,
      "titulo": "[Nome da Seção]",
      "slides": [
        {
          "tipo": "introducao",
          "titulo": "Art. ${numeroArtigo}",
          "conteudo": "[Breve introdução ao que o artigo trata, 2-3 linhas]"
        },
        {
          "tipo": "texto",
          "titulo": "O Que Diz a Lei",
          "conteudo": "[Texto exato do artigo com formatação markdown - use **negrito** para palavras-chave]"
        },
        {
          "tipo": "termos",
          "titulo": "Vocabulário Jurídico",
          "conteudo": "",
          "termos": [
            {"termo": "TERMO 1", "definicao": "Definição clara e didática"},
            {"termo": "TERMO 2", "definicao": "Definição clara e didática"},
            {"termo": "TERMO 3", "definicao": "Definição clara e didática"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo o Artigo",
          "conteudo": "[Explicação didática e detalhada do artigo, usando markdown com tópicos e subtópicos. Mínimo 3 parágrafos explicando cada elemento.]"
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Veja as diferenças:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B"],
            "linhas": [
              ["Característica 1", "Valor A", "Valor B"],
              ["Característica 2", "Valor A", "Valor B"]
            ]
          }
        },
        {
          "tipo": "caso",
          "titulo": "Exemplo Prático",
          "conteudo": "[Situação do dia-a-dia que ilustra o artigo. Use nomes, contexto e narrativa envolvente. Mínimo 2 parágrafos.]"
        },
        {
          "tipo": "atencao",
          "titulo": "Cuidado!",
          "conteudo": "[Pegadinhas comuns em provas, exceções importantes, erros frequentes. Seja específico!]"
        },
        {
          "tipo": "dica",
          "titulo": "Como Memorizar",
          "conteudo": "[Técnica de memorização: mnemônico, associação visual, etc.]"
        },
        {
          "tipo": "resumo",
          "titulo": "Pontos Principais",
          "conteudo": "",
          "pontos": [
            "Ponto 1 - frase clara",
            "Ponto 2 - frase clara",
            "Ponto 3 - frase clara",
            "Ponto 4 - frase clara"
          ]
        },
        {
          "tipo": "quickcheck",
          "titulo": "Verificação Rápida",
          "conteudo": "",
          "pergunta": "[Pergunta estilo concurso sobre o artigo]",
          "opcoes": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
          "resposta": 0,
          "feedback": "[Explicação de por que a resposta correta está certa e as outras erradas]"
        }
      ]
    }
  ],
  "flashcards": [
    {"frente": "Pergunta 1", "verso": "Resposta 1", "exemplo": "Exemplo prático"},
    {"frente": "Pergunta 2", "verso": "Resposta 2", "exemplo": "Exemplo prático"},
    {"frente": "Pergunta 3", "verso": "Resposta 3", "exemplo": "Exemplo prático"},
    {"frente": "Pergunta 4", "verso": "Resposta 4", "exemplo": "Exemplo prático"},
    {"frente": "Pergunta 5", "verso": "Resposta 5", "exemplo": "Exemplo prático"},
    {"frente": "Pergunta 6", "verso": "Resposta 6", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {
      "question": "[Questão estilo OAB/concurso sobre o artigo]",
      "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
      "correctAnswer": 0,
      "explicacao": "[Explicação completa]"
    },
    {
      "question": "[Questão 2]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt"],
      "correctAnswer": 1,
      "explicacao": "[Explicação]"
    },
    {
      "question": "[Questão 3]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt"],
      "correctAnswer": 2,
      "explicacao": "[Explicação]"
    },
    {
      "question": "[Questão 4]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt"],
      "correctAnswer": 0,
      "explicacao": "[Explicação]"
    },
    {
      "question": "[Questão 5]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt"],
      "correctAnswer": 3,
      "explicacao": "[Explicação]"
    }
  ]
}

═══════════════════════════════════════════════════════════════════
                    REGRAS CRÍTICAS
═══════════════════════════════════════════════════════════════════

1. Gere entre 8-15 slides por seção
2. Use 1-3 seções dependendo da complexidade do artigo
3. NUNCA invente jurisprudência ou súmulas específicas
4. Slides quickcheck devem ter exatamente 4 opções
5. Campo "resposta" é o índice (0-3) da opção correta
6. Tabela só quando houver REALMENTE comparação a fazer
7. Flashcards devem ter 6 itens
8. Questões devem ter 5 itens
9. Use linguagem didática e acessível
10. Retorne APENAS o JSON, sem markdown ou código`;

    console.log('🚀 Enviando prompt para Gemini com fallback...');

    const { text: slidesText, keyIndex } = await callGeminiWithFallback(prompt, geminiKeys);
    
    console.log(`📝 Resposta recebida da chave ${keyIndex}, processando JSON...`);
    
    let cleanedText = slidesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let slidesJson;
    try {
      slidesJson = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON, tentando limpeza:', parseError.message);
      
      const startIndex = cleanedText.indexOf('{');
      const endIndex = cleanedText.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedText = cleanedText.substring(startIndex, endIndex + 1);
        slidesJson = JSON.parse(cleanedText);
      } else {
        throw parseError;
      }
    }

    console.log('✅ JSON parseado com sucesso!');
    console.log(`📊 Seções: ${slidesJson.secoes?.length || 0}, Total slides: ${slidesJson.secoes?.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) || 0}`);

    // Salvar ou atualizar no banco
    if (existingAula) {
      console.log('📦 Atualizando registro existente com slides_json...');
      await supabase
        .from('aulas_artigos')
        .update({ 
          slides_json: slidesJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...slidesJson,
        cached: false,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('📦 Criando novo registro com slides_json...');
      const { data: newAula, error: insertError } = await supabase
        .from('aulas_artigos')
        .insert({
          codigo_tabela: codigoTabela,
          numero_artigo: numeroArtigo,
          conteudo_artigo: conteudoArtigo,
          slides_json: slidesJson,
          estrutura_completa: slidesJson, // Backwards compatibility
          visualizacoes: 1
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao salvar:', insertError);
        throw insertError;
      }

      return new Response(JSON.stringify({
        ...slidesJson,
        cached: false,
        aulaId: newAula?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Erro na função:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});