import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converter URL do Google Drive para formato de download direto
function converterUrlDrive(url: string): string {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  
  return url;
}

// Extrair texto com Mistral OCR
async function extrairTextoComMistral(pdfUrl: string): Promise<Array<{ index: number; markdown: string }>> {
  const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
  
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY não configurada');
  }

  const urlConvertida = converterUrlDrive(pdfUrl);
  console.log("Enviando URL para Mistral OCR:", urlConvertida);
  
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: urlConvertida
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro Mistral OCR:", response.status, errorText);
    throw new Error(`Mistral OCR falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`Mistral OCR extraiu ${data.pages?.length || 0} páginas`);
  
  return data.pages || [];
}

// Identificar índice e estrutura do livro usando Gemini
async function identificarEstruturaDoIndice(
  paginasIniciais: Array<{ index: number; markdown: string }>,
  totalPaginas: number
): Promise<{ temas: any[] }> {
  const geminiKeys = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3')
  ].filter(Boolean) as string[];

  if (!geminiKeys.length) {
    throw new Error("Nenhuma chave Gemini configurada");
  }

  // Montar conteúdo das primeiras páginas (índice geralmente está nas primeiras 10-15 páginas)
  const conteudoIndice = paginasIniciais
    .slice(0, 15)
    .map(p => `--- PÁGINA ${p.index + 1} ---\n${p.markdown}`)
    .join('\n\n');

  const prompt = `Você é um especialista em análise de livros jurídicos. Analise o ÍNDICE/SUMÁRIO deste livro e identifique TODOS os temas/capítulos principais.

CONTEÚDO DAS PRIMEIRAS PÁGINAS (procure o ÍNDICE/SUMÁRIO):
${conteudoIndice}

TOTAL DE PÁGINAS DO LIVRO: ${totalPaginas}

REGRAS CRÍTICAS:
1. IDENTIFIQUE O ÍNDICE/SUMÁRIO do livro e extraia EXATAMENTE os temas listados
2. AGRUPE sequências numeradas em UM ÚNICO TEMA:
   - "Perfil Histórico I", "Perfil Histórico II", "Perfil Histórico III" → APENAS "Perfil Histórico"
   - "Capítulo 1.1", "Capítulo 1.2", "Capítulo 1.3" → APENAS "Capítulo 1"
   - "Parte I", "Parte II", "Parte III" → APENAS o nome sem numeração
3. Para cada tema, liste os SUBTÓPICOS originais que foram agrupados
4. Identifique as páginas EXATAS de cada tema (inicial e final)
5. Os temas devem cobrir TODO o livro de forma contínua
6. Não crie temas que não existem no índice original

RESPONDA APENAS COM JSON válido:
{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Nome do Tema Principal (sem numeração I, II, III)",
      "subtopicos": ["Subtópico I - página X", "Subtópico II - página Y"],
      "resumo": "Breve descrição do conteúdo",
      "pagina_inicial": 1,
      "pagina_final": 30
    }
  ]
}`;

  let geminiResponse: Response | null = null;
  let lastError = "";

  for (const geminiKey of geminiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192
            }
          })
        }
      );

      if (response.ok) {
        geminiResponse = response;
        console.log("✅ Gemini identificou estrutura do índice");
        break;
      } else {
        lastError = await response.text();
        console.error(`Erro Gemini (${response.status}):`, lastError.substring(0, 200));
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error("Erro de conexão Gemini:", lastError);
    }
  }

  if (!geminiResponse) {
    throw new Error(`Gemini falhou: ${lastError.substring(0, 100)}`);
  }

  const geminiData = await geminiResponse.json();
  let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Limpar JSON
  textResponse = textResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  console.log("Estrutura identificada:", textResponse.substring(0, 500));

  const parsed = JSON.parse(textResponse);
  return parsed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trilha, pdfUrl } = await req.json();
    
    if (!trilha || !pdfUrl) {
      throw new Error("Parâmetros 'trilha' e 'pdfUrl' são obrigatórios");
    }

    console.log(`Processando PDF para trilha conceitos: ${trilha}`);
    console.log(`URL do PDF: ${pdfUrl}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Salvar URL do PDF na trilha
    await supabase.from('conceitos_trilhas')
      .update({ status: 'extraindo', pdf_url: pdfUrl })
      .eq('codigo', trilha);

    // Extrair com Mistral OCR
    console.log("Extraindo texto com Mistral OCR via URL...");
    const paginas = await extrairTextoComMistral(pdfUrl);

    if (paginas.length === 0) {
      throw new Error("Nenhuma página extraída do PDF");
    }

    console.log(`Total de páginas extraídas: ${paginas.length}`);

    // Limpar conteúdo anterior
    await supabase.from('conceitos_livro_paginas')
      .delete()
      .eq('trilha', trilha);

    // Salvar cada página em batches
    console.log(`Salvando ${paginas.length} páginas...`);
    let paginasComConteudo = 0;
    const batchSize = 20;
    
    for (let i = 0; i < paginas.length; i += batchSize) {
      const batch = paginas.slice(i, i + batchSize);
      const inserts = batch
        .filter(p => (p.markdown?.trim() || '').length > 50)
        .map(p => ({
          trilha,
          pagina: p.index + 1,
          conteudo: p.markdown?.trim() || ''
        }));
      
      if (inserts.length > 0) {
        const { error } = await supabase.from('conceitos_livro_paginas')
          .upsert(inserts, { onConflict: 'trilha,pagina' });
        
        if (error) {
          console.error(`Erro ao salvar batch ${i}:`, error);
        } else {
          paginasComConteudo += inserts.length;
        }
      }
    }

    // Identificar estrutura do índice com Gemini
    console.log("Identificando estrutura do índice com Gemini...");
    const estrutura = await identificarEstruturaDoIndice(paginas, paginas.length);
    const temas = estrutura.temas || [];

    if (!temas.length) {
      throw new Error("Nenhum tema identificado no índice");
    }

    console.log(`${temas.length} temas identificados no índice`);

    // Limpar temas antigos
    await supabase.from('conceitos_livro_temas')
      .delete()
      .eq('trilha', trilha);

    // Inserir novos temas com subtópicos
    const temasParaInserir = temas.map((t: any) => ({
      trilha,
      titulo: t.titulo,
      resumo: t.resumo,
      ordem: t.ordem,
      pagina_inicial: t.pagina_inicial,
      pagina_final: t.pagina_final,
      subtopicos: t.subtopicos || [],
      status: 'pendente'
    }));

    const { error: insertError } = await supabase
      .from('conceitos_livro_temas')
      .insert(temasParaInserir);

    if (insertError) {
      console.error("Erro ao inserir temas:", insertError);
      throw insertError;
    }

    // Atualizar status da trilha
    await supabase.from('conceitos_trilhas')
      .update({ 
        status: 'pronto',
        total_paginas: paginas.length,
        total_temas: temas.length
      })
      .eq('codigo', trilha);

    console.log(`✅ Processamento concluído: ${paginasComConteudo} páginas, ${temas.length} temas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPaginas: paginas.length,
        paginasComConteudo,
        totalTemas: temas.length,
        temas: temas.map((t: any) => ({
          titulo: t.titulo,
          subtopicos: t.subtopicos?.length || 0,
          paginas: `${t.pagina_inicial}-${t.pagina_final}`
        })),
        message: `${paginasComConteudo} páginas extraídas, ${temas.length} temas identificados`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro no processamento:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
