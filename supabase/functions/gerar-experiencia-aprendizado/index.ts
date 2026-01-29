import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean);

async function chamarGemini(prompt: string, keyIndex = 0): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam');
  }

  const apiKey = GEMINI_KEYS[keyIndex];
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (response.status === 429 || response.status === 503) {
      console.log(`Chave ${keyIndex + 1} com rate limit, tentando próxima...`);
      return chamarGemini(prompt, keyIndex + 1);
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`Erro na chave ${keyIndex + 1}:`, error);
      return chamarGemini(prompt, keyIndex + 1);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error(`Erro na chave ${keyIndex + 1}:`, error);
    return chamarGemini(prompt, keyIndex + 1);
  }
}

// Gerar texto imersivo com imagens conceituais
async function gerarTextoImersivo(conteudo: string, nivel: string, titulo: string): Promise<any> {
  const promptNivel = {
    'iniciante': 'linguagem simples, exemplos do dia a dia, analogias fáceis',
    'intermediario': 'linguagem clara, exemplos práticos, terminologia jurídica explicada',
    'avancado': 'linguagem técnica, referências doutrinárias, análise crítica',
    'concurseiro': 'foco em memorização, macetes, questões frequentes, pegadinhas'
  };

  const prompt = `Você é um professor jurídico criando uma aula imersiva.

CONTEÚDO ORIGINAL:
${conteudo}

NÍVEL DO ALUNO: ${nivel} (${promptNivel[nivel as keyof typeof promptNivel] || promptNivel.intermediario})

TÍTULO: ${titulo}

Crie um texto imersivo em JSON com a seguinte estrutura:
{
  "titulo": "Título atrativo",
  "introducao": "Parágrafo de contexto que conecta com a realidade",
  "secoes": [
    {
      "titulo": "Nome da seção",
      "conteudo": "Texto explicativo detalhado",
      "imagemConceito": "Descrição de imagem ilustrativa para esta seção (ex: 'balança da justiça equilibrando direitos fundamentais')",
      "destaque": "Frase importante para destacar",
      "perguntaReflexao": "Pergunta para o leitor refletir"
    }
  ],
  "conclusao": "Síntese final conectando tudo",
  "curiosidade": "Fato interessante relacionado"
}

Crie 3-5 seções, cada uma com conteúdo rico e envolvente.
Retorne APENAS o JSON válido, sem markdown.`;

  const resposta = await chamarGemini(prompt);
  try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

// Gerar quizzes por seção
async function gerarQuizzes(conteudo: string, nivel: string): Promise<any> {
  const prompt = `Crie um quiz jurídico baseado neste conteúdo:

${conteudo}

NÍVEL: ${nivel}

Retorne JSON com esta estrutura:
{
  "questoes": [
    {
      "id": 1,
      "tipo": "multipla_escolha",
      "pergunta": "Pergunta clara e objetiva",
      "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"],
      "respostaCorreta": 0,
      "explicacao": "Por que esta é a resposta correta",
      "dificuldade": "facil|medio|dificil",
      "secaoRelacionada": "Nome da seção do conteúdo"
    }
  ],
  "totalQuestoes": 8,
  "tempoEstimado": "10 min"
}

Crie 8 questões variadas cobrindo todo o conteúdo.
Para nível concurseiro, inclua pegadinhas comuns de provas.
Retorne APENAS o JSON válido.`;

  const resposta = await chamarGemini(prompt);
  try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

// Gerar slides narrados
async function gerarSlidesNarrados(conteudo: string, titulo: string, nivel: string): Promise<any> {
  const prompt = `Crie uma apresentação de slides educacional:

CONTEÚDO:
${conteudo}

TÍTULO: ${titulo}
NÍVEL: ${nivel}

Retorne JSON:
{
  "slides": [
    {
      "numero": 1,
      "tipo": "titulo",
      "titulo": "Título principal",
      "subtitulo": "Subtítulo ou contexto",
      "narracao": "Texto para narração em áudio (2-3 frases)"
    },
    {
      "numero": 2,
      "tipo": "conceito",
      "titulo": "Conceito chave",
      "pontos": ["Ponto 1", "Ponto 2", "Ponto 3"],
      "icone": "nome-do-icone-lucide",
      "narracao": "Explicação detalhada para narração"
    },
    {
      "numero": 3,
      "tipo": "exemplo",
      "titulo": "Exemplo prático",
      "caso": "Descrição de caso ou situação",
      "analise": "Como aplicar o conceito",
      "narracao": "Narração explicando o exemplo"
    },
    {
      "numero": 4,
      "tipo": "comparativo",
      "titulo": "Comparação",
      "itens": [
        {"conceito": "A", "caracteristicas": ["x", "y"]},
        {"conceito": "B", "caracteristicas": ["z", "w"]}
      ],
      "narracao": "Explicação das diferenças"
    },
    {
      "numero": 5,
      "tipo": "resumo",
      "titulo": "Resumindo",
      "pontosChave": ["Ponto 1", "Ponto 2", "Ponto 3"],
      "narracao": "Recapitulação final"
    }
  ],
  "totalSlides": 5,
  "tempoEstimado": "8 min"
}

Crie 8-12 slides variados que cubram todo o conteúdo de forma visual.
Retorne APENAS o JSON válido.`;

  const resposta = await chamarGemini(prompt);
  try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

// Gerar áudio conversacional (diálogo professor/aluno)
async function gerarAudioConversacional(conteudo: string, titulo: string, nivel: string): Promise<any> {
  const prompt = `Crie um diálogo didático entre um Professor e um Aluno explicando este tema:

CONTEÚDO:
${conteudo}

TÍTULO: ${titulo}
NÍVEL: ${nivel}

O diálogo deve ser natural, com o aluno fazendo perguntas reais que estudantes fariam.
O professor deve explicar de forma clara, usando exemplos.

Retorne JSON:
{
  "titulo": "Título da conversa",
  "participantes": {
    "professor": {"nome": "Prof. Carlos", "genero": "masculino"},
    "aluno": {"nome": "Marina", "genero": "feminino"}
  },
  "dialogo": [
    {
      "falante": "professor",
      "texto": "Fala do professor...",
      "emocao": "acolhedor|explicativo|empolgado"
    },
    {
      "falante": "aluno",
      "texto": "Pergunta ou comentário do aluno...",
      "emocao": "curioso|confuso|surpreso|entendendo"
    }
  ],
  "duracaoEstimada": "12 min",
  "resumoTopicos": ["Tópico 1", "Tópico 2", "Tópico 3"]
}

Crie um diálogo rico com 15-25 trocas que explique completamente o tema.
O aluno deve fazer perguntas que ajudem a esclarecer dúvidas comuns.
Retorne APENAS o JSON válido.`;

  const resposta = await chamarGemini(prompt);
  try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

// Gerar mapa mental
async function gerarMapaMental(conteudo: string, titulo: string): Promise<any> {
  const prompt = `Crie um mapa mental hierárquico para este conteúdo jurídico:

CONTEÚDO:
${conteudo}

TÍTULO: ${titulo}

Retorne JSON:
{
  "raiz": {
    "texto": "Conceito central",
    "cor": "#3B82F6",
    "filhos": [
      {
        "texto": "Ramo principal 1",
        "cor": "#10B981",
        "filhos": [
          {"texto": "Sub-conceito 1.1", "cor": "#6EE7B7"},
          {"texto": "Sub-conceito 1.2", "cor": "#6EE7B7"}
        ]
      },
      {
        "texto": "Ramo principal 2",
        "cor": "#F59E0B",
        "filhos": [
          {"texto": "Sub-conceito 2.1", "cor": "#FCD34D"},
          {"texto": "Sub-conceito 2.2", "cor": "#FCD34D"}
        ]
      }
    ]
  },
  "conexoes": [
    {"de": "Sub-conceito 1.1", "para": "Sub-conceito 2.2", "tipo": "relaciona"}
  ],
  "legendas": {
    "#3B82F6": "Conceito central",
    "#10B981": "Definições",
    "#F59E0B": "Aplicações"
  }
}

Crie um mapa mental completo com 3-5 ramos principais e 2-4 sub-conceitos cada.
Use cores que façam sentido semântico.
Retorne APENAS o JSON válido.`;

  const resposta = await chamarGemini(prompt);
  try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experienciaId, conteudo, titulo, nivel, formatos } = await req.json();

    console.log('Gerando experiência de aprendizado:', { titulo, nivel, formatos });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para "gerando"
    await supabase
      .from('experiencias_aprendizado')
      .update({ status: 'gerando' })
      .eq('id', experienciaId);

    const formatosParaGerar = formatos || ['texto', 'quiz', 'slides', 'audio', 'mapa'];
    const resultados: Record<string, any> = {};
    const formatosGerados: string[] = [];

    // Gerar formatos em paralelo
    const tarefas = [];

    if (formatosParaGerar.includes('texto')) {
      tarefas.push(
        gerarTextoImersivo(conteudo, nivel, titulo)
          .then(r => { if (r) { resultados.texto_imersivo = r; formatosGerados.push('texto'); } })
          .catch(e => console.error('Erro texto imersivo:', e))
      );
    }

    if (formatosParaGerar.includes('quiz')) {
      tarefas.push(
        gerarQuizzes(conteudo, nivel)
          .then(r => { if (r) { resultados.quizzes = r; formatosGerados.push('quiz'); } })
          .catch(e => console.error('Erro quizzes:', e))
      );
    }

    if (formatosParaGerar.includes('slides')) {
      tarefas.push(
        gerarSlidesNarrados(conteudo, titulo, nivel)
          .then(r => { if (r) { resultados.slides_narrados = r; formatosGerados.push('slides'); } })
          .catch(e => console.error('Erro slides:', e))
      );
    }

    if (formatosParaGerar.includes('audio')) {
      tarefas.push(
        gerarAudioConversacional(conteudo, titulo, nivel)
          .then(r => { if (r) { resultados.audio_conversacional = r; formatosGerados.push('audio'); } })
          .catch(e => console.error('Erro áudio:', e))
      );
    }

    if (formatosParaGerar.includes('mapa')) {
      tarefas.push(
        gerarMapaMental(conteudo, titulo)
          .then(r => { if (r) { resultados.mapa_mental = r; formatosGerados.push('mapa'); } })
          .catch(e => console.error('Erro mapa mental:', e))
      );
    }

    await Promise.all(tarefas);

    // Atualizar no banco
    const updateData: Record<string, any> = {
      status: formatosGerados.length > 0 ? 'concluido' : 'erro',
      formatos_gerados: formatosGerados,
      updated_at: new Date().toISOString()
    };

    if (resultados.texto_imersivo) updateData.texto_imersivo = resultados.texto_imersivo;
    if (resultados.quizzes) updateData.quizzes = resultados.quizzes;
    if (resultados.slides_narrados) updateData.slides_narrados = resultados.slides_narrados;
    if (resultados.audio_conversacional) updateData.audio_conversacional = resultados.audio_conversacional;
    if (resultados.mapa_mental) updateData.mapa_mental = resultados.mapa_mental;

    if (formatosGerados.length === 0) {
      updateData.erro_mensagem = 'Não foi possível gerar nenhum formato';
    }

    await supabase
      .from('experiencias_aprendizado')
      .update(updateData)
      .eq('id', experienciaId);

    console.log('Experiência gerada com sucesso:', formatosGerados);

    return new Response(JSON.stringify({
      success: true,
      experienciaId,
      formatosGerados,
      resultados
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao gerar experiência:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
