import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v2.4.0";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de nome da tabela para nome da área nos resumos
const getAreaName = (tableName: string): string => {
  const mapping: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
    "CA - Código de Águas": "Código de Águas",
    "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CCOM – Código Comercial": "Código Comercial",
    "CDM – Código de Minas": "Código de Minas",
    "ESTATUTO - ECA": "ECA",
    "ESTATUTO - IDOSO": "Estatuto do Idoso",
    "ESTATUTO - OAB": "Estatuto da OAB",
    "ESTATUTO - PESSOA COM DEFICIÊNCIA": "Estatuto da Pessoa com Deficiência",
    "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
    "ESTATUTO - CIDADE": "Estatuto da Cidade",
    "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
    "Lei 7.210 de 1984 - Lei de Execução Penal": "Lei de Execução Penal",
    "LCP - Lei das Contravenções Penais": "Lei das Contravenções Penais",
    "Lei 11.343 de 2006 - Lei de Drogas": "Lei de Drogas",
    "Lei 11.340 de 2006 - Maria da Penha": "Lei Maria da Penha",
    "Lei 8.072 de 1990 - Crimes Hediondos": "Crimes Hediondos",
    "Lei 9.455 de 1997 - Tortura": "Lei de Tortura",
    "Lei 12.850 de 2013 - Organizações Criminosas": "Organizações Criminosas",
    "LLD - Lei de Lavagem de Dinheiro": "Lavagem de Dinheiro",
    "Lei 9.296 de 1996 - Interceptação Telefônica": "Interceptação Telefônica",
    "Lei 13.869 de 2019 - Abuso de Autoridade": "Abuso de Autoridade",
    "Lei 9.099 de 1995 - Juizados Especiais": "Juizados Especiais",
    "ESTATUTO - DESARMAMENTO": "Estatuto do Desarmamento",
    "LEI 8213 - Benefícios": "Lei de Benefícios",
    "LEI 8212 - Custeio": "Lei de Custeio",
    "SÚMULAS STF": "Súmulas STF",
    "SÚMULAS VINCULANTES": "Súmulas Vinculantes",
    "SÚMULAS STJ": "Súmulas STJ",
    "SÚMULAS TST": "Súmulas TST",
    "SÚMULAS TSE": "Súmulas TSE",
    "SÚMULAS STM": "Súmulas STM",
    "ENUNCIADOS CNJ": "Enunciados CNJ",
    "ENUNCIADOS CNMP": "Enunciados CNMP",
  };
  return mapping[tableName] || tableName;
};

// 🔑 USANDO FALLBACK DE CHAVES GEMINI
const GEMINI_KEYS = ['GEMINI_KEY_1', 'GEMINI_KEY_2', 'GEMINI_KEY_3', 'DIREITO_PREMIUM_API_KEY'];

async function chamarGemini(prompt: string, promptType: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const keyName of GEMINI_KEYS) {
    const API_KEY = Deno.env.get(keyName);
    
    if (!API_KEY) {
      console.log(`⚠️ Chave ${keyName} não configurada, tentando próxima...`);
      continue;
    }

    console.log(`📝 Chamando Gemini para ${promptType} com chave ${keyName}...`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
        }),
      });
      
      if (response.status === 429 || response.status === 503) {
        console.log(`⚠️ Chave ${keyName} rate limited (${response.status}), tentando próxima...`);
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ${response.status} com chave ${keyName}:`, errorText.substring(0, 200));
        lastError = new Error(`Erro na API Gemini: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`✅ ${promptType} gerado com sucesso usando ${keyName} (${result.length} chars)`);
      return result;
    } catch (err) {
      console.error(`❌ Erro com chave ${keyName}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }
  
  throw lastError || new Error('Nenhuma chave Gemini disponível');
}

serve(async (req) => {
  console.log(`📍 Function: gerar-resumo-artigo-lei@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, artigo } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const areaName = getAreaName(tableName);

    console.log(`🚀 Gerando resumo para ${areaName} - Art. ${artigo}`);

    // Verificar se já existe resumo para este artigo
    const { data: existing } = await supabase
      .from("RESUMOS_ARTIGOS_LEI")
      .select("id, resumo_markdown, exemplos, termos, url_imagem_resumo, url_audio_resumo")
      .eq("area", areaName)
      .eq("tema", artigo)
      .limit(1);

    if (existing && existing.length > 0 && existing[0].resumo_markdown) {
      console.log(`✅ Resumo já existe para ${areaName} Art. ${artigo}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          cached: true, 
          artigo,
          resumo: existing[0].resumo_markdown,
          exemplos: existing[0].exemplos,
          termos: existing[0].termos,
          url_imagem_resumo: existing[0].url_imagem_resumo,
          url_audio_resumo: existing[0].url_audio_resumo
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conteúdo do artigo
    const { data: artigosData, error: artigoError } = await supabase
      .from(tableName)
      .select('"Artigo", "Número do Artigo", id')
      .eq('"Número do Artigo"', artigo);

    if (artigoError || !artigosData || artigosData.length === 0) {
      console.error(`❌ Artigo não encontrado: ${artigo}`, artigoError);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo não encontrado", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combinar conteúdo de todos os artigos com mesmo número
    const contents = artigosData
      .filter((a: any) => a.Artigo)
      .map((a: any) => a.Artigo);
    
    if (contents.length === 0) {
      console.error(`❌ Artigo sem conteúdo: ${artigo}`);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo sem conteúdo", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = contents.length === 1 
      ? contents[0] 
      : contents.map((c: string, i: number) => `[Versão ${i + 1}]\n${c}`).join('\n\n');
    
    console.log(`📄 Encontrado(s) ${artigosData.length} registro(s) para Art. ${artigo}`);

    // Prompts para geração
    const promptResumo = `Você é um professor de direito criando material educacional em formato de artigo/blog. Crie um texto COMPLETO e DETALHADO sobre o seguinte artigo de lei:

${content}

REGRAS CRÍTICAS:
- NÃO escreva introduções como "Aqui está o resumo" ou "Com certeza"
- NÃO use saudações ou conclusões
- Vá DIRETO ao conteúdo
- Escreva em formato de BLOG/ARTIGO com parágrafos corridos e fluidos
- Use ## para seções principais (ex: ## Conceito e Fundamentos, ## Aspectos Relevantes)
- Use ### apenas quando necessário para subdivisões importantes
- Use **negrito** APENAS para termos técnicos essenciais (máximo 3-4 por parágrafo)
- Use > (blockquote) para destacar pontos importantes, citações legais e artigos de lei
- Prefira parágrafos narrativos ao invés de listas excessivas
- Use listas SOMENTE quando realmente necessário (máximo 3-4 itens por lista)
- NÃO use tabelas, converta TODAS as tabelas em texto corrido
- NÃO use linhas horizontais/divisórias (--- ou ***)
- Escreva de forma didática, clara e profissional
- IMPORTANTE: Use DUPLA QUEBRA DE LINHA entre parágrafos e seções para melhor legibilidade`;

    const promptExemplos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes de "## Exemplo 1:".

Você é um professor de direito criando 3 EXEMPLOS PRÁTICOS detalhados sobre o seguinte artigo de lei:

${content}

FORMATO OBRIGATÓRIO:

## Exemplo 1: [Título Descritivo do Caso]

João, empresário do ramo... [descrição narrativa completa da situação]. O conflito surgiu quando... A questão jurídica central envolvia o **conceito técnico**...

> Conforme jurisprudência do STJ: "citação relevante se houver"

Ao analisar o caso, verificou-se que... A solução encontrada foi... Este exemplo demonstra como...

## Exemplo 2: [Título Descritivo do Caso]

Maria, advogada... [outra situação prática detalhada].

## Exemplo 3: [Título Descritivo do Caso]

A empresa XYZ... [terceiro exemplo prático].

REGRAS:
- Usar formato narrativo com parágrafos corridos
- Use DUPLA QUEBRA DE LINHA entre parágrafos para melhor legibilidade
- Usar **negrito** APENAS para pontos-chave (máximo 2-3 por exemplo)
- Usar > para citações de jurisprudência quando aplicável
- Evitar listas, prefira texto corrido
- NÃO usar tabelas
- NÃO usar linhas horizontais/divisórias (--- ou ***)`;

    const promptTermos = `INSTRUÇÃO CRÍTICA: Sua primeira linha DEVE ser "## Glossário Jurídico". NÃO escreva NADA antes disso.

Você é um professor de direito criando um glossário completo. Analise o seguinte artigo de lei e liste de 10 a 15 TERMOS JURÍDICOS, EXPRESSÕES TÉCNICAS e CONCEITOS FUNDAMENTAIS relacionados:

${content}

Para CADA termo, forneça:
1. Nome do termo em **negrito** dentro de ###
2. Definição completa em parágrafo corrido (2-4 frases)
3. Contexto de aplicação prática quando relevante
4. Relação com outros conceitos se aplicável

PROIBIDO:
❌ "Aqui estão os termos"
❌ "Com certeza"
❌ Qualquer introdução
❌ Numerar os termos
❌ Agrupar em categorias
❌ Usar listas com marcadores
❌ Usar tabelas
❌ Usar linhas horizontais (---)

OBRIGATÓRIO:
✅ Primeira linha: "## Glossário Jurídico"
✅ Usar ### **Nome do Termo** para cada termo
✅ Escrever 10-15 termos
✅ Explicações em parágrafo corrido
✅ Definições completas e didáticas
✅ Ordem lógica de complexidade (do mais básico ao mais complexo)
✅ DUPLA QUEBRA DE LINHA entre cada termo`;

    console.log('Chamando Gemini API...');
    
    // Gerar resumo, exemplos e termos em paralelo
    const [resumoGerado, exemplosGerados, termosGerados] = await Promise.all([
      chamarGemini(promptResumo, 'resumo'),
      chamarGemini(promptExemplos, 'exemplos'),
      chamarGemini(promptTermos, 'termos')
    ]);
    console.log('✅ Conteúdo gerado com sucesso');

    // Salvar no banco primeiro
    const resumoData: any = {
      area: areaName,
      tema: artigo,
      conteudo_original: content,
      resumo_markdown: resumoGerado,
      exemplos: exemplosGerados,
      termos: termosGerados,
    };

    let resumoId: number | null = null;

    // Verificar se já existe registro e atualizar ou inserir
    if (existing && existing.length > 0) {
      const { error: updateError } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .update(resumoData)
        .eq("id", existing[0].id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar resumo:`, updateError);
      }
      resumoId = existing[0].id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .insert(resumoData)
        .select("id")
        .single();

      if (insertError) {
        console.error(`❌ Erro ao salvar resumo:`, insertError);
      } else {
        resumoId = inserted?.id;
      }
    }

    console.log(`✅ Resumo salvo para ${areaName} Art. ${artigo}, ID: ${resumoId}`);

    // 🔇 GERAÇÃO DE MÍDIA DESATIVADA TEMPORARIAMENTE
    // As imagens e áudios não serão gerados automaticamente
    // Para reativar, descomente a linha abaixo:
    // if (resumoId) {
    //   generateMediaInBackground(supabase, resumoId, resumoGerado, exemplosGerados, termosGerados, areaName, artigo);
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cached: false, 
        artigo,
        resumo: resumoGerado,
        exemplos: exemplosGerados,
        termos: termosGerados
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em gerar-resumo-artigo-lei:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
