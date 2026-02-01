import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v1.1.0-slides-artigo-full";
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
              maxOutputTokens: 65536,
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

    // Se já existe slides_json COM SEÇÕES SUFICIENTES, retorna do cache
    const slidesSecoes = existingAula?.slides_json?.secoes;
    const hasSufficientSlides = slidesSecoes && 
      slidesSecoes.length >= 4 &&
      slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 30;
    
    if (existingAula?.slides_json && hasSufficientSlides && !fetchError) {
      console.log('✅ slides_json completo encontrado no cache, retornando...');
      
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

    console.log('📝 Gerando slides completos no formato ConceitosSlidesViewer...');

    const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO. Sua missão é criar uma AULA COMPLETA E EXTENSA sobre este artigo de lei no formato específico para o componente de slides interativos.

CÓDIGO: ${codigoTabela}
NOME DO CÓDIGO: ${codigoNome || codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO COMPLETO DO ARTIGO:
${conteudoArtigo}

═══════════════════════════════════════════════════════════════════
                    ⚠️ REQUISITO CRÍTICO: GERE MUITO CONTEÚDO! ⚠️
═══════════════════════════════════════════════════════════════════

Você DEVE gerar:
- MÍNIMO 5-7 SEÇÕES diferentes
- MÍNIMO 6-10 SLIDES por seção
- TOTAL: 40-60 SLIDES no total

Isso é essencial para uma aula completa como preparatório OAB!

═══════════════════════════════════════════════════════════════════
                    SEÇÕES OBRIGATÓRIAS (5-7 seções)
═══════════════════════════════════════════════════════════════════

SEÇÃO 1 - INTRODUÇÃO (6-8 slides):
- Slide introducao: Apresentação do artigo
- Slide texto: Texto LITERAL da lei
- Slide termos: 4-6 termos jurídicos importantes
- Slide explicacao: O que o artigo significa na prática
- Slide dica: Por que esse artigo é importante
- Slides adicionais explicando o contexto

SEÇÃO 2 - ANÁLISE APROFUNDADA (8-12 slides):
- Múltiplos slides de explicacao detalhando cada elemento
- Slide tabela: Comparativo se houver conceitos distintos
- Slides de texto aprofundando cada parte do artigo
- Slide atencao: Palavras-chave que caem em prova

SEÇÃO 3 - APLICAÇÃO PRÁTICA (8-10 slides):
- Múltiplos slides de caso: 3-4 exemplos práticos diferentes
- Slide linha_tempo: Se houver procedimento/prazos
- Slides de explicacao sobre jurisprudência
- Slide dica: Como identificar em casos reais

SEÇÃO 4 - EXCEÇÕES E PEGADINHAS (6-8 slides):
- Slide atencao: Exceções importantes
- Slide tabela: Regra vs Exceção
- Slides de explicacao sobre nuances
- Slide dica: Como as bancas tentam confundir

SEÇÃO 5 - CONEXÕES E RELAÇÕES (6-8 slides):
- Slides de texto: Relação com outros artigos
- Slide explicacao: Onde este artigo se encaixa no sistema
- Slide termos: Termos relacionados a outros temas

SEÇÃO 6 - REVISÃO FINAL (8-10 slides):
- Slide resumo: 6-8 pontos principais
- Múltiplos slides quickcheck: 4-5 perguntas de verificação
- Slide dica: Técnica final de memorização
- Slide resumo: Checklist do que lembrar na prova

═══════════════════════════════════════════════════════════════════
                    TIPOS DE SLIDES DISPONÍVEIS
═══════════════════════════════════════════════════════════════════

- introducao: Página de abertura com título e objetivos
- texto: Texto explicativo (use markdown com **negrito** para destaques)
- termos: Lista de termos jurídicos com campo "termos": [{"termo": "", "definicao": ""}]
- explicacao: Explicação detalhada em parágrafos
- linha_tempo: Timeline com campo "etapas": [{"titulo": "", "descricao": ""}]
- tabela: Quadro comparativo com "tabela": {"cabecalhos": [], "linhas": [[]]}
- atencao: Ponto de atenção importante (⚠️)
- dica: Dica de memorização (💡)
- caso: Caso prático com narrativa envolvente
- resumo: Lista de pontos com "pontos": []
- quickcheck: Mini-quiz com "pergunta", "opcoes"[], "resposta"(0-3), "feedback"

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════

{
  "versao": 1,
  "titulo": "Art. ${numeroArtigo} - [Título descritivo curto]",
  "tempoEstimado": "25 min",
  "area": "${codigoNome || codigoTabela}",
  "objetivos": [
    "Compreender o texto do artigo",
    "Identificar conceitos-chave",
    "Aplicar na prática jurídica",
    "Reconhecer exceções e pegadinhas",
    "Dominar para provas OAB e concursos"
  ],
  "secoes": [
    {
      "id": 1,
      "titulo": "Introdução",
      "slides": [
        {"tipo": "introducao", "titulo": "Art. ${numeroArtigo}", "conteudo": "..."},
        {"tipo": "texto", "titulo": "O Que Diz a Lei", "conteudo": "Texto literal do artigo..."},
        ...mais 4-6 slides
      ]
    },
    {
      "id": 2,
      "titulo": "Análise Aprofundada", 
      "slides": [...8-12 slides]
    },
    {
      "id": 3,
      "titulo": "Aplicação Prática",
      "slides": [...8-10 slides]
    },
    {
      "id": 4,
      "titulo": "Exceções e Pegadinhas",
      "slides": [...6-8 slides]
    },
    {
      "id": 5,
      "titulo": "Conexões",
      "slides": [...6-8 slides]
    },
    {
      "id": 6,
      "titulo": "Revisão Final",
      "slides": [...8-10 slides com múltiplos quickcheck]
    }
  ],
  "flashcards": [
    {"frente": "O que estabelece o Art. ${numeroArtigo}?", "verso": "...", "exemplo": "..."},
    ...mais 9 flashcards (total 10)
  ],
  "questoes": [
    {"question": "[Questão estilo OAB]", "options": ["a)...", "b)...", "c)...", "d)..."], "correctAnswer": 0, "explicacao": "..."},
    ...mais 7 questões (total 8)
  ]
}

═══════════════════════════════════════════════════════════════════
                    REGRAS DE FORMATAÇÃO
═══════════════════════════════════════════════════════════════════

1. NÃO use ** para negrito no meio do texto - escreva normalmente
2. Parágrafos claros e bem separados
3. Linguagem didática e acessível
4. Exemplos com nomes reais (João, Maria, etc)
5. Conteúdo denso mas fácil de ler
6. Cada slide deve ter conteúdo suficiente (não muito curto!)
7. QuickCheck deve ter EXATAMENTE 4 opções
8. Campo "resposta" é índice 0-3 da opção correta

═══════════════════════════════════════════════════════════════════
LEMBRE-SE: Gere 40-60 slides distribuídos em 5-7 seções!
═══════════════════════════════════════════════════════════════════

Retorne APENAS o JSON válido, sem markdown ou código.`;

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

    // Limpar formatação markdown indesejada de todos os slides
    if (slidesJson.secoes) {
      for (const secao of slidesJson.secoes) {
        if (secao.slides) {
          for (const slide of secao.slides) {
            // Limpar ** do conteúdo
            if (slide.conteudo) {
              slide.conteudo = slide.conteudo.replace(/\*\*/g, '');
            }
            if (slide.titulo) {
              slide.titulo = slide.titulo.replace(/\*\*/g, '');
            }
            if (slide.pontos) {
              slide.pontos = slide.pontos.map((p: string) => p.replace(/\*\*/g, ''));
            }
            if (slide.termos) {
              slide.termos = slide.termos.map((t: any) => ({
                ...t,
                termo: t.termo?.replace(/\*\*/g, ''),
                definicao: t.definicao?.replace(/\*\*/g, '')
              }));
            }
            if (slide.feedback) {
              slide.feedback = slide.feedback.replace(/\*\*/g, '');
            }
            if (slide.opcoes) {
              slide.opcoes = slide.opcoes.map((o: string) => o.replace(/\*\*/g, ''));
            }
          }
        }
      }
    }

    // Limpar flashcards
    if (slidesJson.flashcards) {
      slidesJson.flashcards = slidesJson.flashcards.map((f: any) => ({
        ...f,
        frente: f.frente?.replace(/\*\*/g, ''),
        verso: f.verso?.replace(/\*\*/g, ''),
        exemplo: f.exemplo?.replace(/\*\*/g, '')
      }));
    }

    // Limpar questões
    if (slidesJson.questoes) {
      slidesJson.questoes = slidesJson.questoes.map((q: any) => ({
        ...q,
        question: q.question?.replace(/\*\*/g, ''),
        explicacao: q.explicacao?.replace(/\*\*/g, ''),
        options: q.options?.map((o: string) => o.replace(/\*\*/g, ''))
      }));
    }

    console.log('✅ JSON parseado e limpo com sucesso!');
    const totalSlides = slidesJson.secoes?.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) || 0;
    console.log(`📊 Seções: ${slidesJson.secoes?.length || 0}, Total slides: ${totalSlides}`);

    // Salvar ou atualizar no banco
    if (existingAula) {
      console.log('📦 Atualizando registro existente com slides_json completo...');
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
      console.log('📦 Criando novo registro com slides_json completo...');
      const { data: newAula, error: insertError } = await supabase
        .from('aulas_artigos')
        .insert({
          codigo_tabela: codigoTabela,
          numero_artigo: numeroArtigo,
          conteudo_artigo: conteudoArtigo,
          slides_json: slidesJson,
          estrutura_completa: slidesJson,
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
