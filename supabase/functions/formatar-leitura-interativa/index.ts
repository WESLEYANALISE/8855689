import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

// Limpar texto de problemas de OCR e HTML
function limparTextoOCR(texto: string): string {
  if (!texto) return '';
  
  let limpo = texto
    .replace(/<p[^>]*class="indent"[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '\n> ')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<h[1-6][^>]*>/gi, '\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s{3,}/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/([a-záéíóúãõâêîôûç])-\s*\n\s*([a-záéíóúãõâêîôûç])/gi, '$1$2')
    .trim();
  
  return limpo;
}

// Chamar Gemini com fallback entre chaves
async function chamarGemini(prompt: string, keyIndex = 0): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam');
  }
  
  const currentKey = GEMINI_KEYS[keyIndex];
  console.log(`[Gemini] Tentando key ${keyIndex + 1}...`);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 8000 
          }
        })
      }
    );
    
    if (response.status === 429 || response.status === 503) {
      console.log(`[Gemini] Key ${keyIndex + 1} com quota excedida, tentando próxima...`);
      return chamarGemini(prompt, keyIndex + 1);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini] Erro (key ${keyIndex + 1}):`, response.status, errorText);
      return chamarGemini(prompt, keyIndex + 1);
    }
    
    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`[Gemini] Sucesso com key ${keyIndex + 1}, resposta: ${result.length} chars`);
    return result;
  } catch (error) {
    console.error(`[Gemini] Exceção com key ${keyIndex + 1}:`, error);
    return chamarGemini(prompt, keyIndex + 1);
  }
}

// Formatar texto para Markdown PREMIUM - com estilo e formatação rica
async function formatarParaMarkdown(
  texto: string, 
  capituloTitulo?: string,
  conteudoProximaPagina?: string
): Promise<{ conteudo: string; isChapterStart: boolean; capituloDetectado?: string; textoRemovidoInicio?: string }> {
  const textoLimpo = limparTextoOCR(texto);
  const proximaPaginaLimpa = conteudoProximaPagina ? limparTextoOCR(conteudoProximaPagina) : '';
  
  // Se página muito curta, verificar se é metadata
  if (textoLimpo.length < 50) {
    return { conteudo: '', isChapterStart: false };
  }
  
  const prompt = `Você é um EDITOR PREMIUM de livros digitais para LEITURA MOBILE. Sua tarefa é TRANSFORMAR o texto bruto em uma experiência de leitura ELEGANTE e IMERSIVA, preservando TODO o conteúdo do texto original.

TEXTO DA PÁGINA ATUAL:
"""
${textoLimpo.substring(0, 6000)}
"""

${proximaPaginaLimpa ? `
INÍCIO DA PRÓXIMA PÁGINA (para completar parágrafos cortados):
"""
${proximaPaginaLimpa.substring(0, 2000)}
"""
` : ''}

=== REGRA MAIS IMPORTANTE ===
VOCÊ DEVE RETORNAR TODO O TEXTO DA PÁGINA FORMATADO. NUNCA retorne apenas um título sem o conteúdo!
Cada página deve ter o texto completo, não apenas "Apresentação de Fulano" sem o texto.

=== INSTRUÇÕES CRÍTICAS ===

1. **REMOVA COMPLETAMENTE**:
   - Metadados de PDF: "Landmarks", "Bookmarks", "Navigation", "Contents"
   - Estrutura de índice: "Capa", "Folha de Rosto", "Sumário", numerações soltas
   - Informações editoriais: ISBN, editora, copyright, ficha catalográfica
   - Cabeçalhos/rodapés repetitivos e números de página

2. **SE PÁGINA VAZIA**: Se for apenas metadados/índice/copyright, retorne: [PAGINA_SEM_CONTEUDO]

3. **COMPLETAR PARÁGRAFOS CORTADOS**:
   - Se o último parágrafo está incompleto (cortado), busque a continuação na próxima página
   - NUNCA deixe parágrafos terminando sem pontuação final

=== TÍTULOS DE CAPÍTULO (REGRA ESPECIAL) ===

4. **USE ## CAPÍTULO: APENAS SE**:
   - A página contém CLARAMENTE um título de capítulo/seção como "APRESENTAÇÃO", "PREFÁCIO", "CAPÍTULO I", "INTRODUÇÃO", etc.
   - E este é o INÍCIO REAL do capítulo (não continuação)
   - Formato: ## CAPÍTULO: Nome do Capítulo
   - NUNCA use "(continuação)" nos títulos
   - Se a página é continuação de texto anterior sem novo título, NÃO adicione ## CAPÍTULO

5. **APÓS O TÍTULO, INCLUA TODO O TEXTO**:
   - Mesmo que a página comece com um título de capítulo, INCLUA TODO o texto que vem depois
   - Exemplo CORRETO:
     ## CAPÍTULO: APRESENTAÇÃO DE CÉLIO EGÍDIO
     
     Mergulhar no universo de Fuller é uma experiência fascinante...
   
   - Exemplo ERRADO (NÃO FAÇA ISSO):
     ## CAPÍTULO: APRESENTAÇÃO DE CÉLIO EGÍDIO
     (sem texto depois)

=== FORMATAÇÃO PREMIUM ===

6. **ESTRUTURA ELEGANTE**:
   - Subtítulos/seções: ### Título da Seção
   - Use --- para separar seções temáticas importantes

7. **CITAÇÕES E DIÁLOGOS** (usar blockquote >):
   - Citações filosóficas ou literárias importantes
   - Diálogos relevantes entre personagens
   - Trechos que merecem destaque especial
   - Exemplo: > "A sabedoria começa na reflexão." — Sócrates

8. **ÊNFASES INTELIGENTES**:
   - **Negrito** para conceitos-chave e termos importantes
   - *Itálico* para palavras estrangeiras, títulos de obras, nomes de personagens na primeira menção
   - Use com moderação - apenas o que realmente merece destaque

9. **LISTAS** (quando o texto tiver enumerações):
   - Converter sequências numeradas ou com bullets em listas formatadas
   - Use - para itens de lista

10. **PARÁGRAFOS PARA MOBILE**:
    - Máximo 3-4 frases por parágrafo
    - Quebrar parágrafos longos em menores
    - Uma linha em branco entre parágrafos
    - SEM indentação

${capituloTitulo ? `Contexto atual: "${capituloTitulo}"` : ''}

=== FORMATO DE RESPOSTA (JSON) ===
{
  "conteudo": "## CAPÍTULO: Título (SE FOR INÍCIO) seguido do TEXTO COMPLETO DA PÁGINA formatado com markdown",
  "textoUsadoDaProximaPagina": "texto puxado da próxima página (ou vazio)"
}

LEMBRE-SE: O campo "conteudo" DEVE conter TODO o texto da página, não apenas o título!

RESPONDA APENAS com o JSON, sem markdown code blocks.`;

  try {
    const resultado = await chamarGemini(prompt);
    
    // Tentar parsear JSON com múltiplas estratégias
    let formatado = '';
    let textoRemovidoInicio = '';
    
    // Limpar possíveis markdown code blocks
    let jsonLimpo = resultado
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    // Estratégia 1: Tentar parsear JSON direto
    try {
      const parsed = JSON.parse(jsonLimpo);
      formatado = parsed.conteudo || parsed.texto || '';
      textoRemovidoInicio = parsed.textoUsadoDaProximaPagina || '';
      console.log('[Formatar] JSON parseado com sucesso');
    } catch {
      // Estratégia 2: Extrair conteúdo entre aspas de "conteudo"
      const conteudoMatch = jsonLimpo.match(/"conteudo"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"textoUsadoDaProximaPagina"|"\s*})/);
      if (conteudoMatch) {
        formatado = conteudoMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        console.log('[Formatar] Conteúdo extraído via regex');
      } else {
        // Estratégia 3: Se começar com { "conteudo", remover envelope JSON
        if (jsonLimpo.startsWith('{') && jsonLimpo.includes('"conteudo"')) {
          // Remover envelope JSON manualmente
          formatado = jsonLimpo
            .replace(/^\{\s*"conteudo"\s*:\s*"/i, '')
            .replace(/",?\s*"textoUsadoDaProximaPagina"[\s\S]*$/i, '')
            .replace(/"\s*}$/i, '')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          console.log('[Formatar] Envelope JSON removido manualmente');
        } else {
          // Usar como texto direto
          formatado = jsonLimpo
            .replace(/^```markdown\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/i, '')
            .trim();
          console.log('[Formatar] Usando texto direto sem parsing JSON');
        }
      }
    }
    
    // Se Gemini identificou página sem conteúdo
    if (formatado.includes('[PAGINA_SEM_CONTEUDO]') || formatado.length < 30) {
      console.log('[Formatar] Página identificada como sem conteúdo relevante');
      return { conteudo: '*Esta página contém apenas informações editoriais.*', isChapterStart: false };
    }
    
    const capituloMatch = formatado.match(/^## CAPÍTULO:\s*(.+)$/m);
    const isChapterStart = !!capituloMatch;
    const capituloDetectado = capituloMatch ? capituloMatch[1].trim() : undefined;
    
    console.log(`[Formatar] Texto da próxima página usado: ${textoRemovidoInicio ? textoRemovidoInicio.length + ' chars' : 'nenhum'}`);
    
    return { 
      conteudo: formatado, 
      isChapterStart,
      capituloDetectado,
      textoRemovidoInicio
    };
  } catch (error: any) {
    console.log('[Formatar] Retornando texto limpo sem formatação IA:', error.message);
    return { conteudo: textoLimpo, isChapterStart: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroTitulo, numeroPagina, conteudoBruto, capituloTitulo, conteudoProximaPagina } = await req.json();
    
    console.log(`[Formatar] Iniciando - Livro: ${livroTitulo}, Página: ${numeroPagina}, Tem próxima: ${!!conteudoProximaPagina}`);
    
    if (!livroTitulo || !numeroPagina || !conteudoBruto) {
      throw new Error('livroTitulo, numeroPagina e conteudoBruto são obrigatórios');
    }
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache
    const { data: existente } = await supabase
      .from('leitura_paginas_formatadas')
      .select('html_formatado, capitulo_titulo, is_chapter_start')
      .eq('livro_titulo', livroTitulo)
      .eq('numero_pagina', numeroPagina)
      .single();

    if (existente?.html_formatado) {
      console.log(`[Formatar] Cache hit para página ${numeroPagina}`);
      return new Response(JSON.stringify({
        success: true,
        conteudoFormatado: existente.html_formatado,
        capituloTitulo: existente.capitulo_titulo,
        isChapterStart: existente.is_chapter_start,
        fromCache: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Formatar com Gemini (passando conteúdo da próxima página para completar parágrafos)
    console.log(`[Formatar] Formatando página ${numeroPagina} com Gemini 2.0 Flash...`);
    const { conteudo, isChapterStart, capituloDetectado, textoRemovidoInicio } = await formatarParaMarkdown(
      conteudoBruto, 
      capituloTitulo,
      conteudoProximaPagina
    );
    
    // Salvar no cache
    const { error: saveError } = await supabase
      .from('leitura_paginas_formatadas')
      .upsert({
        livro_titulo: livroTitulo,
        numero_pagina: numeroPagina,
        html_formatado: conteudo,
        capitulo_titulo: capituloDetectado || capituloTitulo,
        is_chapter_start: isChapterStart
      }, { 
        onConflict: 'livro_titulo,numero_pagina'
      });

    if (saveError) {
      console.error('[Formatar] Erro ao salvar cache:', saveError);
    } else {
      console.log(`[Formatar] Página ${numeroPagina} salva no cache`);
    }

    return new Response(JSON.stringify({
      success: true,
      conteudoFormatado: conteudo,
      capituloTitulo: capituloDetectado || capituloTitulo,
      isChapterStart,
      textoRemovidoInicio,
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Formatar] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
