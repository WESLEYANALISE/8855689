import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string, maxRetries = 3): Promise<string> {
  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1, // Bem determinístico para preservar texto
                maxOutputTokens: 100000,
              }
            })
          }
        );

        if (response.status === 429) {
          console.log(`Rate limit na key ${keyIndex + 1}, tentativa ${attempt + 1}`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro Gemini key ${keyIndex + 1}:`, errorText);
          break;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          return text;
        }
      } catch (error) {
        console.error(`Erro na key ${keyIndex + 1}, tentativa ${attempt + 1}:`, error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam');
}

// Divide páginas em lotes de 5
function dividirEmLotes(paginas: Array<{ conteudo: string }>, tamanhLote: number): Array<Array<{ conteudo: string }>> {
  const lotes: Array<Array<{ conteudo: string }>> = [];
  for (let i = 0; i < paginas.length; i += tamanhLote) {
    lotes.push(paginas.slice(i, i + tamanhLote));
  }
  return lotes;
}

// Concatenar páginas de um lote
function concatenarLote(paginas: Array<{ conteudo: string }>): string {
  return paginas
    .map(p => (p.conteudo || '').trim())
    .filter(c => c.length > 0)
    .join('\n\n--- PRÓXIMA PÁGINA ---\n\n');
}

// Limpeza mínima de OCR (só corrige hifenização, não remove nada)
function limparOCRMinimo(texto: string): string {
  return texto
    // Corrige palavras quebradas por hifenização de OCR
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Normaliza espaços múltiplos
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Dividir texto formatado em páginas virtuais para o app
function dividirEmPaginasVirtuais(textoFormatado: string, tamanhoAlvo = 1800): string[] {
  const paginas: string[] = [];
  let posicaoAtual = 0;
  const texto = textoFormatado.trim();
  
  while (posicaoAtual < texto.length) {
    if (posicaoAtual + tamanhoAlvo >= texto.length) {
      const pagina = texto.substring(posicaoAtual).trim();
      if (pagina.length > 0) {
        paginas.push(pagina);
      }
      break;
    }
    
    const inicioJanela = Math.max(0, tamanhoAlvo - 1000);
    const fimJanela = tamanhoAlvo + 800;
    const trecho = texto.substring(posicaoAtual, posicaoAtual + fimJanela + 200);
    
    let melhorPosicao = -1;
    
    // Prioridade 1: Fim de parágrafo (\n\n)
    const quebrasParagrafo = [...trecho.matchAll(/\n\n/g)];
    for (const match of quebrasParagrafo) {
      if (match.index !== undefined && match.index >= inicioJanela && match.index <= fimJanela) {
        melhorPosicao = match.index + 2;
      }
    }
    
    // Prioridade 2: Fim de frase
    if (melhorPosicao === -1) {
      const quebrasFrase = [...trecho.matchAll(/[.!?]["']?\s+/g)];
      for (const match of quebrasFrase) {
        if (match.index !== undefined && match.index >= inicioJanela && match.index <= fimJanela) {
          melhorPosicao = match.index + match[0].length;
        }
      }
    }
    
    // Prioridade 3: Quebra de linha simples
    if (melhorPosicao === -1) {
      const quebrasLinha = [...trecho.matchAll(/\n/g)];
      for (const match of quebrasLinha) {
        if (match.index !== undefined && match.index >= inicioJanela && match.index <= fimJanela) {
          melhorPosicao = match.index + 1;
        }
      }
    }
    
    if (melhorPosicao === -1) {
      melhorPosicao = tamanhoAlvo;
    }
    
    const pagina = texto.substring(posicaoAtual, posicaoAtual + melhorPosicao).trim();
    if (pagina.length > 0) {
      paginas.push(pagina);
    }
    
    posicaoAtual = posicaoAtual + melhorPosicao;
  }
  
  return paginas;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroTitulo, numeroCapitulo, tituloCapitulo, paginasDoCapitulo } = await req.json();

    if (!livroTitulo || numeroCapitulo === undefined || !paginasDoCapitulo || !Array.isArray(paginasDoCapitulo)) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: livroTitulo, numeroCapitulo, paginasDoCapitulo (array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FASE 1] Formatando capítulo ${numeroCapitulo} de "${livroTitulo}" (${paginasDoCapitulo.length} páginas)`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Deletar páginas antigas deste capítulo
    const capituloTituloNormalizado = tituloCapitulo || `Capítulo ${numeroCapitulo}`;
    await supabase
      .from('leitura_paginas_formatadas')
      .delete()
      .eq('livro_titulo', livroTitulo)
      .eq('numero_capitulo', numeroCapitulo);

    console.log(`Páginas antigas do capítulo ${numeroCapitulo} deletadas`);

    // ===== FASE 1: FORMATAÇÃO EM LOTES DE 5 PÁGINAS SEM REMOVER LIXO =====
    const TAMANHO_LOTE = 5;
    const lotes = dividirEmLotes(paginasDoCapitulo, TAMANHO_LOTE);
    let textoFormatadoCompleto = '';

    console.log(`[FASE 1] Dividido em ${lotes.length} lotes de ${TAMANHO_LOTE} páginas`);

    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      const textoLote = concatenarLote(lote);
      const textoLimpo = limparOCRMinimo(textoLote);

      if (textoLimpo.length < 50) {
        console.log(`[FASE 1] Lote ${i + 1}/${lotes.length} muito curto, pulando`);
        continue;
      }

      console.log(`[FASE 1] Processando lote ${i + 1}/${lotes.length} (${textoLimpo.length} chars)`);

      // Prompt que PRESERVA TUDO, sem filtrar lixo
      const promptLote = `Você é um formatador de textos para leitura mobile.

TAREFA: Formate este texto para leitura em dispositivos móveis.

⚠️ REGRA ABSOLUTA: PRESERVE 100% DO TEXTO ORIGINAL
- NÃO resuma NADA
- NÃO omita NENHUMA palavra, frase ou parágrafo
- NÃO filtre NADA - mantenha TODO o conteúdo exatamente como está
- O texto de saída DEVE ter o mesmo tamanho do texto de entrada

FORMATAÇÃO SIMPLES:
1. Use parágrafos curtos (3-4 frases)
2. Citações longas: use > blockquote
3. Diálogos em linhas separadas
4. Remova apenas marcadores como "--- PRÓXIMA PÁGINA ---"

TEXTO ORIGINAL (${textoLimpo.length} caracteres - PRESERVE 100%):
${textoLimpo}

TEXTO FORMATADO (EXATAMENTE O MESMO CONTEÚDO):`;

      try {
        const resultado = await callGeminiWithFallback(promptLote);
        textoFormatadoCompleto += resultado + '\n\n';
        console.log(`[FASE 1] Lote ${i + 1}/${lotes.length} formatado: ${resultado.length} chars`);
      } catch (error) {
        console.error(`[FASE 1] Erro no lote ${i + 1}:`, error);
        // Em caso de erro, usar texto original
        textoFormatadoCompleto += textoLimpo.replace(/--- PRÓXIMA PÁGINA ---/g, '\n\n') + '\n\n';
      }

      // Pausa entre lotes para evitar rate limit
      if (i < lotes.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    textoFormatadoCompleto = textoFormatadoCompleto.trim();

    if (textoFormatadoCompleto.length < 100) {
      console.log(`Capítulo ${numeroCapitulo} sem conteúdo após formatação`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          paginasGeradas: 0,
          mensagem: 'Capítulo sem conteúdo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dividir em páginas virtuais
    const paginasVirtuais = dividirEmPaginasVirtuais(textoFormatadoCompleto);
    console.log(`[FASE 1] Capítulo ${numeroCapitulo}: ${paginasVirtuais.length} páginas virtuais geradas`);

    // Calcular número base da página
    const { count: paginasExistentes } = await supabase
      .from('leitura_paginas_formatadas')
      .select('*', { count: 'exact', head: true })
      .eq('livro_titulo', livroTitulo);

    const paginaBase = (paginasExistentes || 0) + 1;

    // Inserir páginas virtuais
    const paginasParaInserir = paginasVirtuais.map((conteudo, index) => ({
      livro_titulo: livroTitulo,
      numero_pagina: paginaBase + index,
      html_formatado: conteudo,
      capitulo_titulo: capituloTituloNormalizado,
      is_chapter_start: index === 0,
      numero_capitulo: numeroCapitulo
    }));

    const { error: insertError } = await supabase
      .from('leitura_paginas_formatadas')
      .insert(paginasParaInserir);

    if (insertError) {
      console.error('Erro ao salvar páginas:', insertError);
      throw new Error(`Erro ao salvar páginas: ${insertError.message}`);
    }

    console.log(`[FASE 1] Capítulo ${numeroCapitulo} salvo: ${paginasVirtuais.length} páginas`);

    return new Response(
      JSON.stringify({
        success: true,
        paginasGeradas: paginasVirtuais.length,
        paginaInicial: paginaBase,
        paginaFinal: paginaBase + paginasVirtuais.length - 1,
        capitulo: numeroCapitulo,
        tituloCapitulo: capituloTituloNormalizado,
        fase: 'formatacao_bruta'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao formatar capítulo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});