import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usar as mesmas chaves da professora
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

interface BiografiaRequest {
  nome: string;
  tipo: 'presidente' | 'deputado' | 'senador' | 'ministro_stf';
  id?: number | string;
  partido?: string;
  uf?: string;
}

// Mapeamento de nomes populares para nomes completos do Wikipedia
const nomesWikipedia: Record<string, string> = {
  'lula': 'Luiz Inácio Lula da Silva',
  'bolsonaro': 'Jair Bolsonaro',
  'temer': 'Michel Temer',
  'dilma': 'Dilma Rousseff',
  'fhc': 'Fernando Henrique Cardoso',
  'itamar': 'Itamar Franco',
  'collor': 'Fernando Collor de Mello',
  'sarney': 'José Sarney',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { nome, tipo, id, partido, uf }: BiografiaRequest = await req.json();
    
    console.log(`Generating biography for ${nome} (${tipo})`);

    // Buscar na Wikipedia - melhorar busca para nomes populares
    const nomeLower = nome.toLowerCase().trim();
    const nomeWiki = nomesWikipedia[nomeLower] || nome;
    
    let wikiContent = '';
    let wikiImage = '';
    
    // Tentar buscar na Wikipedia com diferentes estratégias
    const searchTerms = [
      nomeWiki,
      `${nomeWiki} (político)`,
      `${nomeWiki} político brasileiro`,
    ];

    for (const searchTerm of searchTerms) {
      if (wikiContent) break;
      
      try {
        const wikiSearchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
        console.log(`Trying Wikipedia search: ${searchTerm}`);
        
        const wikiResponse = await fetch(wikiSearchUrl, {
          headers: { 'User-Agent': 'VadeMecumBrasil/1.0' }
        });
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData.extract && wikiData.extract.length > 50) {
            wikiContent = wikiData.extract;
            wikiImage = wikiData.thumbnail?.source || wikiData.originalimage?.source || '';
            console.log(`Wikipedia data found with term: ${searchTerm}`);
            console.log(`Wikipedia image: ${wikiImage || 'not found'}`);
          }
        }
      } catch (wikiError) {
        console.log(`Wikipedia search failed for ${searchTerm}:`, wikiError);
      }
    }

    // Se ainda não encontrou, tentar busca alternativa com cargo
    if (!wikiContent) {
      const searchTermsWithCargo = {
        'presidente': `${nomeWiki} presidente Brasil`,
        'deputado': `${nomeWiki} deputado federal ${uf || ''}`.trim(),
        'senador': `${nomeWiki} senador ${uf || ''}`.trim(),
        'ministro_stf': `${nomeWiki} ministro STF`
      };
      
      try {
        const altSearchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTermsWithCargo[tipo])}`;
        const altResponse = await fetch(altSearchUrl, {
          headers: { 'User-Agent': 'VadeMecumBrasil/1.0' }
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (altData.extract && altData.extract.length > 50) {
            wikiContent = altData.extract;
            wikiImage = altData.thumbnail?.source || altData.originalimage?.source || '';
          }
        }
      } catch (e) {
        console.log('Alternative Wikipedia search failed');
      }
    }

    // Gerar biografia formatada com Gemini
    const cargoDescricao = {
      'presidente': 'Presidente da República Federativa do Brasil',
      'deputado': `Deputado(a) Federal pelo ${uf || 'Brasil'}`,
      'senador': `Senador(a) da República pelo ${uf || 'Brasil'}`,
      'ministro_stf': 'Ministro(a) do Supremo Tribunal Federal'
    };

    const prompt = `Você é um historiador e cientista político especializado em política brasileira.
    
Com base nas informações disponíveis sobre ${nomeWiki}, ${cargoDescricao[tipo]}${partido ? ` do partido ${partido}` : ''}, gere uma biografia completa e bem estruturada.

${wikiContent ? `Informações da Wikipedia:\n${wikiContent}` : 'Não há informações disponíveis na Wikipedia. Use seu conhecimento para criar uma biografia factualmente precisa.'}

Gere a resposta em formato JSON com a seguinte estrutura:
{
  "biografia": "Biografia completa em 3-4 parágrafos, focando na trajetória política e realizações",
  "formacao": "Formação acadêmica e profissional",
  "carreira_politica": "Resumo da carreira política em ordem cronológica",
  "realizacoes": ["Realização 1", "Realização 2", "Realização 3"],
  "curiosidades": ["Curiosidade 1", "Curiosidade 2"],
  "legado": "O legado e importância histórica desta figura"
}

IMPORTANTE:
- Seja factualmente preciso
- Use linguagem formal e objetiva
- Foque nos aspectos mais relevantes da carreira política
- Inclua datas importantes quando souber`;

    // Tentar com cada chave API
    let lastError: Error | null = null;
    let content = '';
    
    for (const apiKey of API_KEYS) {
      try {
        console.log('Trying Gemini API...');
        
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('Gemini API error:', aiResponse.status, errorText);
          throw new Error(`Gemini API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (content) {
          console.log('✅ Biography generated successfully');
          break;
        }
      } catch (error) {
        console.error('Error with API key:', error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    if (!content) {
      throw lastError || new Error('Todas as chaves API falharam');
    }

    // Parse JSON from response
    let biografiaData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        biografiaData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      biografiaData = {
        biografia: content,
        formacao: '',
        carreira_politica: '',
        realizacoes: [],
        curiosidades: [],
        legado: ''
      };
    }

    // Salvar no banco de dados conforme o tipo
    const tableName = {
      'presidente': 'tres_poderes_presidentes',
      'deputado': 'tres_poderes_deputados_bio',
      'senador': 'tres_poderes_senadores_bio',
      'ministro_stf': 'tres_poderes_ministros_stf'
    };

    // Para deputados e senadores, NÃO usar foto do Wikipedia (usar foto da API própria)
    const shouldUseWikiPhoto = tipo === 'presidente' || tipo === 'ministro_stf';

    const updateData: Record<string, unknown> = {
      biografia: biografiaData.biografia,
      updated_at: new Date().toISOString()
    };

    // Apenas adicionar foto_wikipedia para presidentes e ministros STF
    if (shouldUseWikiPhoto && wikiImage) {
      updateData.foto_wikipedia = wikiImage;
    }

    if (tipo === 'presidente') {
      updateData.realizacoes = biografiaData.realizacoes || [];
      updateData.curiosidades = biografiaData.curiosidades || [];
      updateData.legado = biografiaData.legado || '';
      
      const { error: updateError } = await supabase
        .from(tableName[tipo])
        .update(updateData)
        .eq('nome', nome);
        
      if (updateError) {
        console.error('Error saving president biography:', updateError);
      }
        
    } else if (tipo === 'deputado' && id) {
      updateData.formacao = biografiaData.formacao || '';
      updateData.carreira_politica = biografiaData.carreira_politica || '';
      updateData.projetos_destaque = biografiaData.realizacoes || [];
      
      const { error: upsertError } = await supabase
        .from(tableName[tipo])
        .upsert({
          deputado_id: id,
          nome,
          partido,
          uf,
          ...updateData
        }, { onConflict: 'deputado_id' });
        
      if (upsertError) {
        console.error('Error saving deputy biography:', upsertError);
      }
        
    } else if (tipo === 'senador' && id) {
      updateData.formacao = biografiaData.formacao || '';
      updateData.carreira_politica = biografiaData.carreira_politica || '';
      updateData.projetos_destaque = biografiaData.realizacoes || [];
      
      const { error: upsertError } = await supabase
        .from(tableName[tipo])
        .upsert({
          senador_codigo: id,
          nome,
          partido,
          uf,
          ...updateData
        }, { onConflict: 'senador_codigo' });
        
      if (upsertError) {
        console.error('Error saving senator biography:', upsertError);
      }
        
    } else if (tipo === 'ministro_stf') {
      updateData.formacao = biografiaData.formacao || '';
      updateData.carreira = biografiaData.carreira_politica || '';
      updateData.decisoes_importantes = biografiaData.realizacoes || [];
      
      const { error: updateError } = await supabase
        .from(tableName[tipo])
        .update(updateData)
        .eq('nome', nome);
        
      if (updateError) {
        console.error('Error saving minister biography:', updateError);
      }
    }

    console.log(`Biography saved for ${nome}`);

    return new Response(JSON.stringify({ 
      success: true,
      nome,
      tipo,
      foto_wikipedia: wikiImage,
      ...biografiaData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating biography:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
