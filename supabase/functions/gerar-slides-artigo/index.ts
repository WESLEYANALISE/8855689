import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v2.0.0-oab-trilhas-style";
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

    // Normalizar codigo_tabela (usar apenas sigla)
    const codigoTabelaNorm = codigoTabela.toUpperCase().split(' ')[0].split('-')[0].trim();
    console.log('🔍 Verificando se já existe slides_json para:', codigoTabelaNorm, numeroArtigo);

    // Check if slides already exist
    let existingAula: any = null;
    
    const { data: aulaByNorm } = await supabase
      .from('aulas_artigos')
      .select('id, slides_json, estrutura_completa, visualizacoes')
      .eq('codigo_tabela', codigoTabelaNorm)
      .eq('numero_artigo', numeroArtigo)
      .single();
    
    if (aulaByNorm) {
      existingAula = aulaByNorm;
    } else {
      const { data: aulaByOriginal } = await supabase
        .from('aulas_artigos')
        .select('id, slides_json, estrutura_completa, visualizacoes')
        .eq('codigo_tabela', codigoTabela)
        .eq('numero_artigo', numeroArtigo)
        .single();
      
      if (aulaByOriginal) {
        existingAula = aulaByOriginal;
        console.log('📦 Encontrado com valor original, normalizando...');
        await supabase
          .from('aulas_artigos')
          .update({ codigo_tabela: codigoTabelaNorm })
          .eq('id', aulaByOriginal.id);
      }
    }

    // Se já existe slides_json COM SEÇÕES SUFICIENTES, retorna do cache
    const slidesSecoes = existingAula?.slides_json?.secoes;
    const hasSufficientSlides = slidesSecoes && 
      slidesSecoes.length >= 5 &&
      slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 40;
    
    if (existingAula?.slides_json && hasSufficientSlides) {
      console.log('✅ slides_json completo encontrado no cache, retornando...');
      
      await supabase
        .from('aulas_artigos')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...existingAula.slides_json,
        cached: true,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Gerando slides completos no estilo OAB Trilhas (Tom Didático)...');

    // ═══════════════════════════════════════════════════════════════════
    //                 NOVO PROMPT ESTILO OAB TRILHAS / PROFESSORA
    // ═══════════════════════════════════════════════════════════════════
    const prompt = `Você é uma PROFESSORA DE DIREITO didática e acolhedora, como uma mentora que quer ver o aluno passar na OAB.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café.

═══════════════════════════════════════════════════════════════════
                    📚 ARTIGO A SER EXPLICADO
═══════════════════════════════════════════════════════════════════

CÓDIGO: ${codigoTabela}
NOME DO CÓDIGO: ${codigoNome || codigoTabela}
ARTIGO: ${numeroArtigo}

TEXTO LITERAL DO ARTIGO:
${conteudoArtigo}

═══════════════════════════════════════════════════════════════════
                    🎯 ESTILO DE ESCRITA (OBRIGATÓRIO!)
═══════════════════════════════════════════════════════════════════

✅ FAÇA:
- Escreva como CONVERSA: "Olha só...", "Percebeu?", "Veja bem...", "Sabe quando..."
- Perguntas retóricas para engajar: "E por que isso importa tanto?"
- Analogias com situações do dia a dia
- Explicar TODO termo técnico ou em latim: "O termo 'pacta sunt servanda' (que significa 'os pactos devem ser cumpridos')..."
- Exemplos práticos IMEDIATOS com nomes: João, Maria, Pedro, Ana
- Blockquotes para citações legais: > "Art. X..."
- Cards visuais: ⚠️ ATENÇÃO, 💡 DICA, 📚 EXEMPLO PRÁTICO

❌ NUNCA:
- Começar com "E aí galera!", "Fala, galera", "Beleza?", "Mano,", "Bora lá", "Partiu"
- Texto muito formal ou acadêmico
- Slides curtos (mínimo 150-300 palavras por slide tipo "texto")
- Explicações superficiais

═══════════════════════════════════════════════════════════════════
                    📋 ESTRUTURA OBRIGATÓRIA (6-7 SEÇÕES)
═══════════════════════════════════════════════════════════════════

SEÇÃO 1 - BEM-VINDO À AULA (5-7 slides):
- Slide tipo "introducao": Boas-vindas calorosas ("Olá! Vamos dominar este artigo juntos? Prepare o café ☕")
- Slide tipo "texto": O que você vai aprender nesta aula
- Slide tipo "texto": Por que este artigo é TÃO importante para OAB e concursos
- Slide tipo "termos": 4-6 termos jurídicos que aparecerão
- Slide tipo "dica": Como aproveitar ao máximo esta aula

SEÇÃO 2 - LEITURA DO ARTIGO PALAVRA POR PALAVRA (6-10 slides):
- Slide tipo "texto": Texto LITERAL do artigo em blockquote
- Múltiplos slides tipo "texto": Explicar CADA PARTE do artigo
  - "Olha só, quando a lei diz 'ninguém pode ser punido', ela quer dizer..."
  - "Percebeu essa expressão 'lei posterior'? Vamos destrinchar..."
  - Cada conceito-chave merece um slide próprio!
- Slide tipo "atencao": Palavras-chave que as bancas adoram cobrar

SEÇÃO 3 - APROFUNDAMENTO DOUTRINÁRIO (8-12 slides):
- Slides tipo "texto": Detalhamento de cada elemento do artigo
- Slide tipo "tabela": Comparativo se houver conceitos distintos
- Slides tipo "texto": Doutrina majoritária vs minoritária
- Slide tipo "linha_tempo": Se houver procedimento ou prazos
- Slide tipo "dica": Como os tribunais interpretam

SEÇÃO 4 - CASOS PRÁTICOS (8-10 slides):
- 4-5 slides tipo "caso": Exemplos práticos DIFERENTES
  - "Imagine que João trabalha em uma empresa..."
  - "Maria contratou um advogado para..."
  - Use nomes reais e situações do dia a dia!
- Slide tipo "texto": Como identificar o artigo em casos reais
- Slide tipo "dica": Técnica para responder questões sobre este tema

SEÇÃO 5 - PEGADINHAS DE PROVA OAB (6-8 slides):
- Slide tipo "atencao": "Atenção! As bancas ADORAM cobrar isso..."
- Slide tipo "tabela": Regra vs Exceção (formato tabela)
- Slides tipo "texto": Nuances que derrubam candidatos
- Slide tipo "dica": Como identificar a alternativa correta
- Slide tipo "texto": Jurisprudência recente que pode cair

SEÇÃO 6 - REVISÃO FINAL E MEMORIZAÇÃO (10-12 slides):
- Slide tipo "resumo": 6-8 pontos principais em lista
- 5-6 slides tipo "quickcheck": Perguntas rápidas de verificação
  - "Lembra o que aprendemos sobre...?"
  - 4 opções cada, sendo 1 correta
- Slide tipo "dica": Técnica final de memorização (mnemônico, associação)
- Slide tipo "resumo": Checklist do que lembrar na prova

═══════════════════════════════════════════════════════════════════
                    📝 TIPOS DE SLIDES DISPONÍVEIS
═══════════════════════════════════════════════════════════════════

1. "introducao": Página de abertura acolhedora
   {"tipo": "introducao", "titulo": "...", "conteudo": "Boas-vindas motivadoras..."}

2. "texto": Explicação detalhada (MÍNIMO 150-300 palavras!)
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação extensa com exemplos..."}

3. "termos": Lista de termos jurídicos
   {"tipo": "termos", "titulo": "...", "conteudo": "Intro breve", "termos": [{"termo": "...", "definicao": "..."}]}

4. "linha_tempo": Timeline de procedimento
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Contexto", "etapas": [{"titulo": "...", "descricao": "..."}]}

5. "tabela": Quadro comparativo
   {"tipo": "tabela", "titulo": "...", "conteudo": "Descrição", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

6. "atencao": Ponto de atenção (⚠️)
   {"tipo": "atencao", "titulo": "...", "conteudo": "Ponto importante que CAI NA OAB..."}

7. "dica": Dica de memorização (💡)
   {"tipo": "dica", "titulo": "...", "conteudo": "Macete ou técnica para lembrar..."}

8. "caso": Caso prático narrativo
   {"tipo": "caso", "titulo": "...", "conteudo": "Imagine que João..."}

9. "resumo": Lista de pontos
   {"tipo": "resumo", "titulo": "...", "pontos": ["Ponto 1", "Ponto 2", ...]}

10. "quickcheck": Mini-quiz com 4 opções
    {"tipo": "quickcheck", "titulo": "...", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "Explicação..."}

═══════════════════════════════════════════════════════════════════
                    🎯 REQUISITOS MÍNIMOS OBRIGATÓRIOS
═══════════════════════════════════════════════════════════════════

✅ MÍNIMO 6 SEÇÕES
✅ MÍNIMO 45-60 SLIDES no total
✅ MÍNIMO 10 FLASHCARDS para revisão
✅ MÍNIMO 8 QUESTÕES estilo OAB (4 opções cada)
✅ Slides de texto com MÍNIMO 150 palavras cada
✅ Tom conversacional e acolhedor em TODO conteúdo

═══════════════════════════════════════════════════════════════════
                    📦 ESTRUTURA JSON OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "Art. ${numeroArtigo}",
  "tempoEstimado": "30 min",
  "area": "${codigoNome || codigoTabela}",
  "objetivos": [
    "Entender o texto literal do artigo",
    "Dominar cada conceito-chave",
    "Aplicar em casos práticos",
    "Identificar pegadinhas de prova",
    "Memorizar para a OAB"
  ],
  "secoes": [
    {
      "id": 1,
      "titulo": "Bem-vindo à Aula",
      "slides": [
        {"tipo": "introducao", "titulo": "Olá! Vamos Dominar o Art. ${numeroArtigo}?", "conteudo": "..."},
        {"tipo": "texto", "titulo": "O Que Você Vai Aprender Hoje", "conteudo": "..."},
        ...mais slides
      ]
    },
    {
      "id": 2,
      "titulo": "Leitura do Artigo - Palavra por Palavra",
      "slides": [...6-10 slides]
    },
    {
      "id": 3,
      "titulo": "Aprofundamento Doutrinário",
      "slides": [...8-12 slides]
    },
    {
      "id": 4,
      "titulo": "Casos Práticos",
      "slides": [...8-10 slides]
    },
    {
      "id": 5,
      "titulo": "Pegadinhas de Prova OAB",
      "slides": [...6-8 slides]
    },
    {
      "id": 6,
      "titulo": "Revisão Final",
      "slides": [...10-12 slides com quickchecks]
    }
  ],
  "flashcards": [
    {"frente": "O que estabelece o Art. ${numeroArtigo}?", "verso": "Explicação clara...", "exemplo": "Exemplo prático..."},
    ...mais 9 flashcards (total 10 mínimo)
  ],
  "questoes": [
    {
      "question": "Enunciado estilo OAB sobre o Art. ${numeroArtigo}...",
      "options": ["a) Opção incorreta", "b) Opção correta", "c) Opção incorreta", "d) Opção incorreta"],
      "correctAnswer": 1,
      "explicacao": "A alternativa B está correta porque..."
    },
    ...mais 7 questões (total 8 mínimo)
  ]
}

═══════════════════════════════════════════════════════════════════
LEMBRE-SE: Tom acolhedor, explicação palavra por palavra, exemplos práticos!
Gere 45-60 slides distribuídos em 6 seções no MÍNIMO!
═══════════════════════════════════════════════════════════════════

Retorne APENAS o JSON válido, sem markdown ou texto adicional.`;

    console.log('🚀 Enviando prompt OAB Trilhas Style para Gemini...');

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

    // Limpar formatação markdown indesejada
    if (slidesJson.secoes) {
      for (const secao of slidesJson.secoes) {
        if (secao.slides) {
          for (const slide of secao.slides) {
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

    // Validar estrutura mínima
    const totalSlides = slidesJson.secoes?.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) || 0;
    const totalFlashcards = slidesJson.flashcards?.length || 0;
    const totalQuestoes = slidesJson.questoes?.length || 0;
    
    console.log(`✅ JSON parseado! Seções: ${slidesJson.secoes?.length || 0}, Slides: ${totalSlides}, Flashcards: ${totalFlashcards}, Questões: ${totalQuestoes}`);

    // Salvar ou atualizar no banco
    if (existingAula) {
      console.log('📦 Atualizando registro existente...');
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
      console.log('📦 Criando novo registro...');
      const { data: newAula, error: insertError } = await supabase
        .from('aulas_artigos')
        .insert({
          codigo_tabela: codigoTabelaNorm,
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
        aulaId: newAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
