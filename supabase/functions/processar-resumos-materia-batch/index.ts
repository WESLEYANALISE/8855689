import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para extrair artigos mencionados no conteúdo base
function extrairArtigosDoConteudo(conteudo: string): string[] {
  const regex = /Art\.?\s*\d+[°ºª]?(\s*,?\s*(§|par[aá]grafo|inciso|al[ií]nea)?\s*[\dIVXivx]+)?/gi;
  const matches = conteudo.match(regex) || [];
  return [...new Set(matches)];
}

// Função para extrair citações de leis do conteúdo
function extrairLeisDoConteudo(conteudo: string): string[] {
  const regexLeis = /(Lei\s*n?[°º]?\s*[\d\.]+\/?\d*|Decreto\s*n?[°º]?\s*[\d\.]+|C[óo]digo\s+(Civil|Penal|Processo|Trabalho|Consumidor|Tributário|El[ae]itoral)|(CF|Constitui[çc][ãa]o\s+Federal)|CLT|CDC|CP|CC|CPC|CPP)/gi;
  const matches = conteudo.match(regexLeis) || [];
  return [...new Set(matches)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, limite = 50, offset = 0 } = await req.json();

    console.log(`🚀 Iniciando processamento em lote: área=${area || 'todas'}, limite=${limite}, offset=${offset}`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar resumos pendentes
    let query = supabase
      .from("RESUMO")
      .select("id, area, tema, subtema, conteudo")
      .is("conteudo_gerado", null)
      .range(offset, offset + limite - 1);

    if (area && area !== "todas") {
      query = query.eq("area", area);
    }

    const { data: pendentes, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar resumos: ${fetchError.message}`);
    }

    if (!pendentes || pendentes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Nenhum resumo pendente encontrado",
          processados: 0,
          erros: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontrados ${pendentes.length} resumos pendentes`);

    // 🔑 Sistema de fallback com múltiplas chaves Gemini
    const GEMINI_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    let keyIndex = 0;
    
    const chamarGemini = async (prompt: string): Promise<string> => {
      let attempts = 0;
      const maxAttempts = GEMINI_KEYS.length * 2;
      
      while (attempts < maxAttempts) {
        const apiKey = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
        
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
              })
            }
          );
          
          if (response.status === 429 || response.status === 503) {
            keyIndex++;
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          if (response.status === 400) {
            keyIndex++;
            attempts++;
            continue;
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText.substring(0, 100)}`);
          }
          
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (err) {
          keyIndex++;
          attempts++;
          if (attempts >= maxAttempts) throw err;
        }
      }
      
      throw new Error('Todas as tentativas falharam');
    };

    const resultados: { id: number; status: 'success' | 'error'; message?: string }[] = [];
    let sucessos = 0;
    let erros = 0;

    for (const resumo of pendentes) {
      try {
        console.log(`📝 Processando resumo ${resumo.id}: ${resumo.area} > ${resumo.tema} > ${resumo.subtema}`);

        // Extrair artigos e leis do conteúdo base
        const artigosPermitidos = extrairArtigosDoConteudo(resumo.conteudo || '');
        const leisPermitidas = extrairLeisDoConteudo(resumo.conteudo || '');
        
        const listaArtigos = artigosPermitidos.length > 0 
          ? `ARTIGOS PERMITIDOS (USE APENAS ESTES): ${artigosPermitidos.join(', ')}`
          : 'NENHUM ARTIGO ESPECÍFICO NO CONTEÚDO - NÃO CITE ARTIGOS DE LEI';
          
        const listaLeis = leisPermitidas.length > 0
          ? `LEIS MENCIONADAS: ${leisPermitidas.join(', ')}`
          : '';

        const promptResumo = `Você é um professor de direito criando material educacional em formato de artigo/blog. Crie um texto COMPLETO e DETALHADO sobre "${resumo.subtema}" dentro do tema "${resumo.tema}" na área de "${resumo.area}".

⚠️ REGRAS ABSOLUTAS - NÃO VIOLAR:
1. NÃO INVENTE artigos de lei que não estejam no conteúdo base
2. NÃO CRIE citações com textos inventados
3. Use APENAS informações do conteúdo base fornecido
4. Se não houver fundamentos legais específicos, foque em conceitos e contexto

CONTEÚDO BASE:
${resumo.conteudo || ''}

${listaArtigos}
${listaLeis}

REGRAS DE FORMATAÇÃO:
- NÃO escreva introduções como "Aqui está o resumo" ou "Com certeza"
- NÃO use saudações ou conclusões
- Vá DIRETO ao conteúdo
- Escreva em formato de BLOG/ARTIGO com parágrafos corridos e fluidos
- Use ## para seções principais
- Use **negrito** APENAS para termos técnicos essenciais (máximo 3-4 por parágrafo)
- Use > (blockquote) para destacar pontos importantes
- APENAS cite artigos de lei que estejam no CONTEÚDO BASE
- Prefira parágrafos narrativos ao invés de listas excessivas
- NÃO use tabelas
- NÃO use linhas horizontais/divisórias`;

        const promptExemplos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes de "## Exemplo 1:".

⚠️ REGRA: NÃO invente artigos de lei. Use apenas conceitos do conteúdo base.

Você é um professor de direito criando 3-4 EXEMPLOS PRÁTICOS detalhados sobre "${resumo.subtema}" no contexto de "${resumo.tema}" e "${resumo.area}".

CONTEÚDO BASE:
${(resumo.conteudo || '').substring(0, 2000)}

${listaArtigos}

FORMATO OBRIGATÓRIO:
## Exemplo 1: [Título Descritivo do Caso]
[Descrição narrativa completa da situação - SEM inventar fundamentos legais]

REGRAS:
- Usar formato narrativo com parágrafos corridos
- Usar **negrito** APENAS para pontos-chave
- NÃO cite artigos que não estejam no conteúdo base
- Evitar listas, prefira texto corrido
- NÃO usar tabelas`;

        const promptTermos = `INSTRUÇÃO CRÍTICA: Sua primeira linha DEVE ser "## Glossário Jurídico". NÃO escreva NADA antes disso.

Você é um professor de direito criando um glossário completo. Analise o tema "${resumo.subtema}" e liste de 10 a 15 TERMOS JURÍDICOS relacionados.

FORMATO EXATO:
## Glossário Jurídico

### **Termo Jurídico 1**
Definição completa e didática do termo em parágrafo corrido.`;

        // Gerar conteúdo em paralelo
        const [resumoGerado, exemplosGerados, termosGerados] = await Promise.all([
          chamarGemini(promptResumo),
          chamarGemini(promptExemplos),
          chamarGemini(promptTermos)
        ]);

        // Salvar no banco
        const { error: updateError } = await supabase
          .from('RESUMO')
          .update({ 
            conteudo_gerado: { 
              markdown: resumoGerado,
              exemplos: exemplosGerados,
              termos: termosGerados,
              gerado_em: new Date().toISOString(),
              versao: 2
            },
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('id', resumo.id);

        if (updateError) {
          throw new Error(`Erro ao salvar: ${updateError.message}`);
        }

        console.log(`✅ Resumo ${resumo.id} gerado com sucesso`);
        resultados.push({ id: resumo.id, status: 'success' });
        sucessos++;

        // Delay de 2 segundos entre gerações
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`❌ Erro no resumo ${resumo.id}:`, errorMessage);
        resultados.push({ id: resumo.id, status: 'error', message: errorMessage });
        erros++;
      }
    }

    console.log(`🏁 Processamento concluído: ${sucessos} sucessos, ${erros} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processados: sucessos,
        erros,
        total: pendentes.length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro em processar-resumos-materia-batch:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
