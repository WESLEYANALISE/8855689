import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnriquecerRequest {
  tipo: 'jurista' | 'instituicao' | 'caso' | 'sistema' | 'historia';
  nome: string;
  conteudo_original: any;
  contexto?: string; // contexto adicional (categoria, período, etc)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tipo, nome, conteudo_original, contexto } = await req.json() as EnriquecerRequest;

    console.log(`Enriquecendo conteúdo: ${tipo} - ${nome}`);

    // Prompt especializado para cada tipo
    const prompts = {
      jurista: `Você é um professor de Direito brasileiro especializado em história jurídica e didática.

Adapte o seguinte conteúdo sobre o jurista brasileiro "${nome}" para estudantes de direito:

${JSON.stringify(conteudo_original, null, 2)}

### Seção Principal com Hierarquia Clara

No campo "resumo_executivo", você DEVE usar Markdown com a seguinte estrutura obrigatória:

- **### (H3)** para títulos principais: ### Visão Geral, ### Contexto Histórico, ### Marcos Importantes, ### Legado
- **#### (H4)** para subtítulos dentro das seções  
- **Negrito (**texto**)** para destacar termos-chave e datas importantes
- **Listas (- item)** para enumerar eventos, características ou pontos importantes
- **Parágrafos curtos** (2-4 linhas) para facilitar a leitura

EXEMPLO DE ESTRUTURA (siga exatamente esse padrão):

"### Visão Geral\\n\\nBreve introdução sobre o período histórico em 2-3 linhas, destacando **principais características**.\\n\\n### Contexto Histórico\\n\\n#### Antecedentes\\nDescrição dos eventos que levaram a este período, com **datas importantes** em negrito.\\n\\n#### Principais Mudanças\\n- **Mudança 1**: descrição breve\\n- **Mudança 2**: descrição breve\\n- **Mudança 3**: descrição breve\\n\\n### Marcos Jurídicos Importantes\\n\\n- **Data - Evento**: impacto e relevância\\n- **Data - Evento**: impacto e relevância\\n\\n### Legado\\n\\nParágrafo sobre o impacto atual deste período na história jurídica brasileira."

Contexto adicional: ${contexto || 'N/A'}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "resumo_executivo": "ESTRUTURA MARKDOWN HIERÁRQUICA conforme exemplo acima - obrigatoriamente com ### para títulos, #### para subtítulos, **negrito** para termos importantes, e listas",
  "introducao_didatica": "Explicação clara e acessível sobre quem foi este jurista e sua importância",
  "relevancia_juridica": "Por que este jurista é importante para o direito brasileiro (2-3 parágrafos)",
  "principais_contribuicoes": ["Contribuição 1", "Contribuição 2", "Contribuição 3"],
  "obras_principais": ["Obra 1 com breve descrição", "Obra 2 com breve descrição"],
  "casos_famosos": ["Caso 1 que participou", "Caso 2 que participou"],
  "frases_celebres": ["Frase 1", "Frase 2"],
  "legado": "Descrição do legado deixado para o direito brasileiro",
  "conexoes_legais": ["Artigo/Lei relacionada 1", "Artigo/Lei relacionada 2"],
  "curiosidades": ["Fato interessante 1", "Fato interessante 2"],
  "para_aprofundar": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`,

      instituicao: `Você é um professor de Direito brasileiro especializado em instituições jurídicas.

Adapte o seguinte conteúdo sobre a instituição "${nome}" para estudantes de direito:

${JSON.stringify(conteudo_original, null, 2)}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "resumo_executivo": "Descrição geral da instituição e sua função",
  "introducao_didatica": "Explicação clara sobre o papel desta instituição no sistema jurídico brasileiro",
  "relevancia_juridica": "Por que esta instituição é importante",
  "estrutura": "Como a instituição está organizada",
  "competencias": ["Competência 1", "Competência 2", "Competência 3"],
  "casos_emblematicos": ["Caso importante 1", "Caso importante 2"],
  "conexoes_legais": ["Lei/Artigo que regula 1", "Lei/Artigo que regula 2"],
  "curiosidades": ["Fato interessante 1", "Fato interessante 2"],
  "para_aprofundar": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`,

      caso: `Você é um professor de Direito brasileiro especializado em casos jurídicos famosos.

Adapte o seguinte conteúdo sobre o caso jurídico "${nome}" para estudantes de direito:

${JSON.stringify(conteudo_original, null, 2)}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "resumo_executivo": "Resumo do caso em 3-4 parágrafos",
  "introducao_didatica": "Contexto histórico e social do caso",
  "relevancia_juridica": "Por que este caso é importante para o direito brasileiro",
  "fatos_principais": ["Fato 1", "Fato 2", "Fato 3"],
  "questoes_juridicas": ["Questão jurídica debatida 1", "Questão 2"],
  "decisao": "Como foi decidido o caso",
  "impacto": "Impacto do caso na legislação ou jurisprudência brasileira",
  "conexoes_legais": ["Artigo/Lei aplicada 1", "Artigo/Lei aplicada 2"],
  "curiosidades": ["Fato interessante 1", "Fato interessante 2"],
  "para_aprofundar": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`,

      sistema: `Você é um professor de Direito Comparado especializado em sistemas jurídicos.

Adapte o seguinte conteúdo sobre o sistema jurídico de "${nome}" para estudantes de direito brasileiro:

${JSON.stringify(conteudo_original, null, 2)}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "resumo_executivo": "Visão geral do sistema jurídico",
  "introducao_didatica": "Explicação clara sobre o tipo de sistema jurídico",
  "relevancia_juridica": "Como este sistema influenciou ou difere do brasileiro",
  "caracteristicas_principais": ["Característica 1", "Característica 2", "Característica 3"],
  "comparacao_brasil": {
    "semelhancas": ["Semelhança 1", "Semelhança 2"],
    "diferencas": ["Diferença 1", "Diferença 2"]
  },
  "fontes_direito": ["Fonte 1", "Fonte 2", "Fonte 3"],
  "estrutura_judiciaria": "Breve descrição da estrutura judicial",
  "curiosidades": ["Fato interessante 1", "Fato interessante 2"],
  "para_aprofundar": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`,

      historia: `Você é um professor de História do Direito brasileiro.

Adapte o seguinte conteúdo sobre o período "${nome}" da história jurídica brasileira para estudantes de direito:

${JSON.stringify(conteudo_original, null, 2)}

Contexto: ${contexto || 'N/A'}

IMPORTANTE: O campo "resumo_executivo" deve ser estruturado usando Markdown com hierarquia clara:
- Use ### para títulos principais (ex: ### Contexto Histórico, ### Marcos Jurídicos)
- Use #### para subtítulos (ex: #### Legislação Principal)
- Use **negrito** para destacar datas, nomes de leis e eventos importantes
- Use listas (- item) para enumerar eventos, marcos e características
- Organize em seções lógicas: Visão Geral, Contexto Histórico, Marcos Jurídicos, Legislação, Legado

EXEMPLO DE ESTRUTURA:
"### Visão Geral\\n\\nBreve introdução de 2-3 linhas sobre o período **${nome}**, destacando suas **principais características** jurídicas.\\n\\n### Contexto Histórico\\n\\n#### Antecedentes Políticos\\nDescrição do contexto político que levou a este período.\\n\\n#### Mudanças Sociais\\n- **Mudança 1**: impacto\\n- **Mudança 2**: impacto\\n\\n### Marcos Jurídicos Importantes\\n\\n- **Ano - Lei/Código**: descrição e impacto\\n- **Ano - Evento**: relevância jurídica\\n\\n### Legislação Principal\\n\\nParágrafo sobre as principais leis e códigos criados neste período.\\n\\n### Legado\\n\\nComo este período influencia o direito brasileiro atual."

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com esta estrutura:
{
  "resumo_executivo": "ESTRUTURA MARKDOWN HIERÁRQUICA conforme exemplo - obrigatoriamente com ###, ####, **negrito** e listas",
  "introducao_didatica": "Contexto histórico e político do período",
  "relevancia_juridica": "Principais mudanças jurídicas do período",
  "marcos_principais": ["Marco 1", "Marco 2", "Marco 3"],
  "legislacao_importante": ["Lei/Código importante 1", "Lei/Código importante 2"],
  "juristas_destaque": ["Jurista importante 1", "Jurista importante 2"],
  "impacto_atual": "Como este período influencia o direito brasileiro atual",
  "curiosidades": ["Fato interessante 1", "Fato interessante 2"],
  "para_aprofundar": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`
    };

    const prompt = prompts[tipo];

    // Chamar API direta do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro API Gemini:', response.status, errorText);
      throw new Error(`Erro ao enriquecer conteúdo: ${response.status}`);
    }

    const data = await response.json();
    const conteudoMelhorado = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Tentar fazer parse do JSON
    let conteudoJson;
    try {
      // Remover possíveis markdown wrappers
      const cleanContent = conteudoMelhorado
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      conteudoJson = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Erro ao fazer parse do JSON:', e);
      console.log('Conteúdo recebido:', conteudoMelhorado);
      
      // Fallback: retornar o conteúdo original se não conseguir fazer parse
      conteudoJson = {
        resumo_executivo: conteudoMelhorado,
        erro_parse: true
      };
    }

    console.log('Conteúdo enriquecido com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        conteudo_melhorado: conteudoJson 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
