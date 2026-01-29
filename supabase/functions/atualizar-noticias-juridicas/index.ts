import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoticiaSheet {
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
  tipoCategoria: 'direito' | 'concurso';
}

// Função para extrair JSON da resposta do Gemini
function extractJsonFromText(text: string): any {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                    text.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      let jsonStr = jsonMatch[1] || jsonMatch[0];
      jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      jsonStr = jsonStr.replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n');
      return JSON.parse(jsonStr);
    } catch (e) {
      try {
        let jsonStr = jsonMatch[1] || jsonMatch[0];
        jsonStr = jsonStr.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.log('Fallback de parsing falhou:', e2);
      }
    }
  }
  return null;
}

// Converter data brasileira (DD/MM/YYYY HH:MM:SS) para ISO
function parseDataBR(dataStr: string): string {
  if (!dataStr) return new Date().toISOString();
  
  try {
    const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
    if (!match) return new Date().toISOString();
    
    const [, dia, mes, ano, hora = '12', min = '00', seg = '00'] = match;
    const date = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}-03:00`);
    
    if (isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Buscar notícias do Google Sheets
async function buscarNoticiasDoSheets(): Promise<NoticiaSheet[]> {
  const SHEET_ID = '1tqCcr-HgmY5BMHBkLdSFaW2RoldSdFlM44Qx9xYWMLg';
  const GID = '1764139697';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
  
  console.log('📊 Buscando notícias do Google Sheets...');
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar planilha: ${response.status}`);
      return [];
    }
    
    const text = await response.text();
    const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonStr);
    
    const rows = data.table?.rows || [];
    const noticias: NoticiaSheet[] = [];
    
    console.log(`📋 Encontradas ${rows.length} linhas na planilha`);
    
    for (const row of rows) {
      const cells = row.c;
      if (!cells || !cells[0]?.v) continue;
      
      const categoria = cells[0]?.v?.toString()?.trim() || '';
      const portal = cells[1]?.v?.toString()?.trim() || '';
      const titulo = cells[2]?.v?.toString()?.trim() || '';
      const capa = cells[3]?.v?.toString()?.trim() || '';
      const link = cells[4]?.v?.toString()?.trim() || '';
      const dataHoraRaw = cells[5]?.v?.toString()?.trim() || '';
      
      if (!titulo || !link) continue;
      
      // Determinar tipo de categoria
      const categLower = categoria.toLowerCase();
      let tipoCategoria: 'direito' | 'concurso' = 'direito';
      
      if (categLower.includes('concurso')) {
        tipoCategoria = 'concurso';
      }
      
      noticias.push({
        categoria,
        portal,
        titulo,
        capa,
        link,
        dataHora: parseDataBR(dataHoraRaw),
        tipoCategoria
      });
    }
    
    console.log(`✓ ${noticias.length} notícias válidas extraídas da planilha`);
    return noticias;
  } catch (error) {
    console.error('Erro ao processar Google Sheets:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_KEY_1 = Deno.env.get('GEMINI_KEY_1');
    const GEMINI_KEY_2 = Deno.env.get('GEMINI_KEY_2');
    const GEMINI_KEY_3 = Deno.env.get('GEMINI_KEY_3');
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const GEMINI_KEYS = [GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3, DIREITO_PREMIUM_API_KEY].filter(Boolean) as string[];
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    console.log(`🔑 ${GEMINI_KEYS.length} chaves Gemini disponíveis`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('🔍 Iniciando atualização de notícias (TOP 20 mais recentes)...');

    // 1. LIMPEZA: Deletar notícias com mais de 7 dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const { data: deletedJuridicasData } = await supabase
      .from('noticias_juridicas_cache')
      .delete()
      .lt('data_publicacao', seteDiasAtras.toISOString())
      .select('id');
    
    const deletedJuridicas = deletedJuridicasData?.length || 0;
    
    const { data: deletedConcursosData } = await supabase
      .from('noticias_concursos_cache')
      .delete()
      .lt('data_publicacao', seteDiasAtras.toISOString())
      .select('id');
    
    const deletedConcursos = deletedConcursosData?.length || 0;
    
    console.log(`🧹 Limpeza: ${deletedJuridicas || 0} jurídicas + ${deletedConcursos || 0} concursos antigos removidos`);

    // 2. Buscar todas as notícias da planilha
    const todasNoticias = await buscarNoticiasDoSheets();
    
    if (todasNoticias.length === 0) {
      console.log('Nenhuma notícia encontrada na planilha');
      return new Response(
        JSON.stringify({ success: true, noticiasProcessadas: 0, message: 'Nenhuma notícia na planilha' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Ordenar por data (mais recente primeiro) e pegar APENAS as 20 mais recentes
    const noticiasOrdenadas = todasNoticias.sort((a, b) => 
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
    
    const top20 = noticiasOrdenadas.slice(0, 20);
    
    // Separar por tipo
    const top20Direito = top20.filter(n => n.tipoCategoria === 'direito');
    const top20Concurso = top20.filter(n => n.tipoCategoria === 'concurso');
    
    console.log(`📰 TOP 20: ${top20Direito.length} Direito | ${top20Concurso.length} Concurso`);

    let juridicasProcessadas = 0;
    let concursosProcessados = 0;

    // 4. Processar notícias de DIREITO (usar UPSERT)
    for (const noticia of top20Direito) {
      try {
        console.log(`📝 [Direito] Processando: ${noticia.titulo.substring(0, 50)}...`);

        // Gerar análise com IA
        let analiseIA: any = null;
        let conteudoFormatado = '';
        let termosJson: any[] = [];

        try {
          const prompt = `Analise esta notícia jurídica e retorne JSON:
TÍTULO: ${noticia.titulo}
PORTAL: ${noticia.portal}

Retorne APENAS JSON válido:
{
  "conteudo_formatado": "Resumo jornalístico completo da notícia em 4-6 parágrafos. Separe cada parágrafo com \\n\\n (quebra de linha dupla). Seja detalhado.",
  "analise_ia": {
    "resumoExecutivo": "Resumo DETALHADO em 4-5 parágrafos para profissionais do Direito. IMPORTANTE: Separe cada parágrafo com \\n\\n (duas quebras de linha). Cubra: contexto, fatos, argumentos jurídicos, precedentes relevantes e implicações.",
    "resumoFacil": "Explicação simples em 3-4 parágrafos para leigos. Separe parágrafos com \\n\\n. Use linguagem acessível.",
    "pontosPrincipais": ["Ponto 1 detalhado", "Ponto 2 detalhado", "Ponto 3 detalhado", "Ponto 4 detalhado"],
    "impactoJuridico": "Impacto detalhado na prática jurídica em 2-3 parágrafos. Separe com \\n\\n."
  },
  "termos_json": [{"termo": "Termo jurídico", "significado": "Definição clara e didática"}]
}`;

          for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
            const apiKey = GEMINI_KEYS[keyIndex];
            try {
              const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 4000 },
                  }),
                }
              );

              if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const resposta = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (resposta) {
                  const resultado = extractJsonFromText(resposta);
                  if (resultado) {
                    conteudoFormatado = resultado.conteudo_formatado || '';
                    analiseIA = resultado.analise_ia || null;
                    termosJson = Array.isArray(resultado.termos_json) ? resultado.termos_json : [];
                    break;
                  }
                }
              } else if (geminiResponse.status === 429) {
                console.warn(`⚠️ Rate limit na chave ${keyIndex + 1}`);
                continue;
              }
            } catch (keyError) {
              console.error(`Erro com chave ${keyIndex + 1}:`, keyError);
            }
          }
        } catch (analiseError) {
          console.error('Erro na análise IA:', analiseError);
        }

        // Converter imagem para WebP
        let imagemFinal = noticia.capa || null;
        if (imagemFinal && !imagemFinal.includes('.webp') && !imagemFinal.includes('supabase')) {
          try {
            const webpResponse = await fetch(`${SUPABASE_URL}/functions/v1/converter-imagem-webp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ imageUrl: imagemFinal })
            });
            
            if (webpResponse.ok) {
              const webpData = await webpResponse.json();
              if (webpData.success && webpData.url) {
                imagemFinal = webpData.url;
              }
            }
          } catch (webpError) {
            console.warn('Erro ao converter imagem:', webpError);
          }
        }

        // UPSERT - Inserir ou atualizar se existir
        const { error: upsertError } = await supabase
          .from('noticias_juridicas_cache')
          .upsert({
            titulo: noticia.titulo,
            descricao: `${noticia.portal} - ${noticia.categoria}`,
            link: noticia.link,
            imagem: noticia.capa || null,
            imagem_webp: imagemFinal,
            fonte: noticia.portal,
            categoria: 'Direito',
            data_publicacao: noticia.dataHora,
            conteudo_formatado: conteudoFormatado || null,
            analise_ia: analiseIA ? JSON.stringify(analiseIA) : null,
            termos_json: termosJson.length > 0 ? termosJson : null,
            analise_gerada_em: analiseIA ? new Date().toISOString() : null,
          }, { 
            onConflict: 'link'
          });

        if (!upsertError) {
          juridicasProcessadas++;
          console.log(`✅ [Direito] Processada: ${noticia.titulo.substring(0, 40)}...`);
        } else {
          console.error(`❌ Erro ao processar jurídica: ${upsertError.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (noticiaError) {
        console.error('Erro ao processar notícia jurídica:', noticiaError);
      }
    }

    // 5. Processar notícias de CONCURSO (usar UPSERT)
    for (const noticia of top20Concurso) {
      try {
        console.log(`📝 [Concurso] Processando: ${noticia.titulo.substring(0, 50)}...`);

        let analiseIA: any = null;
        let conteudoFormatado = '';
        let termosJson: any[] = [];

        try {
          const prompt = `Analise esta notícia de concurso público e retorne JSON:
TÍTULO: ${noticia.titulo}
PORTAL: ${noticia.portal}

Retorne APENAS JSON válido:
{
  "conteudo_formatado": "RESUMO da notícia em 3-5 parágrafos curtos, com SUAS PRÓPRIAS PALAVRAS. NÃO copie o texto original. Explique os fatos principais de forma objetiva e didática. Separe cada parágrafo com \\n\\n.",
  "analise_ia": {
    "resumoExecutivo": "Análise técnica em 3-4 frases SEM Markdown. Informações do concurso: órgão, vagas, salários, requisitos, datas importantes.",
    "resumoFacil": "Explicação em 2-3 frases BEM SIMPLES, sem Markdown. O que é o concurso? Quem pode participar? Qual o salário?",
    "pontosPrincipais": ["Órgão/instituição responsável", "Número de vagas oferecidas", "Faixa salarial", "Requisitos principais", "Prazo de inscrição"],
    "impactoJuridico": "Relevância para concurseiros: nível de concorrência esperado, dicas de preparação, comparação com concursos similares."
  },
  "termos_json": [{"termo": "Termo técnico de concursos", "significado": "Definição clara e didática"}]
}

IMPORTANTE:
- conteudo_formatado: NÃO copie o texto original - faça um RESUMO próprio com 3-5 parágrafos
- NÃO use asteriscos, hífens ou Markdown nos resumos
- termos_json: inclua 3-5 termos específicos de concursos (edital, nomeação, posse, provimento, etc)`;

          for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
            const apiKey = GEMINI_KEYS[keyIndex];
            try {
              const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 3000 },
                  }),
                }
              );

              if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const resposta = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (resposta) {
                  const resultado = extractJsonFromText(resposta);
                  if (resultado) {
                    conteudoFormatado = resultado.conteudo_formatado || '';
                    analiseIA = resultado.analise_ia || null;
                    termosJson = Array.isArray(resultado.termos_json) ? resultado.termos_json : [];
                    break;
                  }
                }
              } else if (geminiResponse.status === 429) {
                continue;
              }
            } catch (keyError) {
              console.error(`Erro com chave ${keyIndex + 1}:`, keyError);
            }
          }
        } catch (analiseError) {
          console.error('Erro na análise IA:', analiseError);
        }

        // Converter imagem para WebP
        let imagemFinal = noticia.capa || null;
        if (imagemFinal && !imagemFinal.includes('.webp') && !imagemFinal.includes('supabase')) {
          try {
            const webpResponse = await fetch(`${SUPABASE_URL}/functions/v1/converter-imagem-webp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ imageUrl: imagemFinal })
            });
            
            if (webpResponse.ok) {
              const webpData = await webpResponse.json();
              if (webpData.success && webpData.url) {
                imagemFinal = webpData.url;
              }
            }
          } catch (webpError) {
            console.warn('Erro ao converter imagem:', webpError);
          }
        }

        // UPSERT - Inserir ou atualizar se existir
        const { error: upsertError } = await supabase
          .from('noticias_concursos_cache')
          .upsert({
            titulo: noticia.titulo,
            descricao: `${noticia.portal} - ${noticia.categoria}`,
            link: noticia.link,
            imagem: noticia.capa || null,
            imagem_webp: imagemFinal,
            fonte: noticia.portal,
            categoria: 'Concurso',
            data_publicacao: noticia.dataHora,
            conteudo_formatado: conteudoFormatado || null,
            analise_ia: analiseIA ? JSON.stringify(analiseIA) : null,
            termos_json: termosJson.length > 0 ? termosJson : null,
            analise_gerada_em: analiseIA ? new Date().toISOString() : null,
          }, { 
            onConflict: 'link'
          });

        if (!upsertError) {
          concursosProcessados++;
          console.log(`✅ [Concurso] Processada: ${noticia.titulo.substring(0, 40)}...`);
        } else {
          console.error(`❌ Erro ao processar concurso: ${upsertError.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (noticiaError) {
        console.error('Erro ao processar notícia de concurso:', noticiaError);
      }
    }

    console.log(`✨ Concluído: ${juridicasProcessadas} Direito + ${concursosProcessados} Concurso processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        juridicasProcessadas,
        concursosProcessados,
        limpeza: {
          juridicasRemovidas: deletedJuridicas || 0,
          concursosRemovidos: deletedConcursos || 0
        },
        fonte: 'Google Sheets (TOP 20)',
        message: `${juridicasProcessadas} Direito + ${concursosProcessados} Concurso processadas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
