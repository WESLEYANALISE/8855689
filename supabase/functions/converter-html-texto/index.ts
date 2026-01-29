import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ETAPA 2: Converter HTML/Markdown → Texto Limpo
 * 
 * VERSÃO 2.0: Parser determinístico com regex
 * SEM IA - 100% previsível e confiável
 */

const REVISION = '2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🔄 ETAPA 2: CONVERTER HTML/MARKDOWN → TEXTO (v${REVISION})`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📌 MÉTODO: Parser determinístico (SEM IA)');

  try {
    const { htmlBruto, textoBruto } = await req.json();

    if (!htmlBruto && !textoBruto) {
      return new Response(
        JSON.stringify({ success: false, error: 'HTML ou texto bruto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar o que tiver: prioridade para textoBruto (markdown do Firecrawl)
    const conteudo = textoBruto || htmlBruto;
    console.log(`📊 Conteúdo recebido: ${conteudo.length.toLocaleString()} caracteres`);
    console.log(`📊 Fonte: ${textoBruto ? 'Markdown (textoBruto)' : 'HTML (htmlBruto)'}`);

    // Aplicar limpeza determinística
    const textoLimpo = converterParaTextoLimpo(conteudo);

    console.log(`✅ Conversão concluída: ${textoLimpo.length.toLocaleString()} caracteres`);

    // Estatísticas básicas
    const artigosDetectados = (textoLimpo.match(/\bArt\.?\s*\d+/gi) || []).length;
    const paragrafosDetectados = (textoLimpo.match(/§\s*\d+/g) || []).length;
    const revogados = (textoLimpo.match(/\(Revogad[oa]/gi) || []).length;
    const vetados = (textoLimpo.match(/\(VETADO/gi) || []).length;

    console.log(`📊 Artigos: ${artigosDetectados}, Parágrafos: ${paragrafosDetectados}`);
    console.log(`📊 Revogados: ${revogados}, Vetados: ${vetados}`);

    return new Response(
      JSON.stringify({
        success: true,
        textoLimpo,
        estatisticas: {
          caracteres: textoLimpo.length,
          artigosDetectados,
          paragrafosDetectados,
          revogados,
          vetados,
          metodo: 'parser-deterministico',
          versao: REVISION,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Converte HTML/Markdown para texto limpo usando regex
 * 100% determinístico - mesmo input = mesmo output
 */
function converterParaTextoLimpo(conteudo: string): string {
  console.log('🔧 Iniciando limpeza determinística...');
  
  let texto = conteudo;

  // 1. Remover links markdown [texto](url) → texto
  texto = texto.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  console.log('  ✓ Links markdown removidos');

  // 2. Remover imagens markdown ![alt](url)
  texto = texto.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  console.log('  ✓ Imagens removidas');

  // 3. Remover tabelas markdown (linhas com |)
  texto = texto.replace(/^\|.*\|$/gm, '');
  texto = texto.replace(/^\s*[-|:]+\s*$/gm, '');
  console.log('  ✓ Tabelas removidas');

  // 4. Remover formatação markdown de texto
  texto = texto.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // ***bold italic***
  texto = texto.replace(/\*\*([^*]+)\*\*/g, '$1');     // **bold**
  texto = texto.replace(/\*([^*]+)\*/g, '$1');          // *italic*
  texto = texto.replace(/__([^_]+)__/g, '$1');          // __bold__
  texto = texto.replace(/_([^_]+)_/g, '$1');            // _italic_
  texto = texto.replace(/~~([^~]+)~~/g, '$1');          // ~~strikethrough~~
  console.log('  ✓ Formatação bold/italic removida');

  // 5. Remover headers markdown (# ## ### etc)
  texto = texto.replace(/^#{1,6}\s+/gm, '');
  console.log('  ✓ Headers markdown removidos');

  // 6. Remover código inline e blocos de código
  texto = texto.replace(/```[\s\S]*?```/g, '');
  texto = texto.replace(/`([^`]+)`/g, '$1');
  console.log('  ✓ Blocos de código removidos');

  // 7. Remover blockquotes markdown
  texto = texto.replace(/^>\s*/gm, '');
  console.log('  ✓ Blockquotes removidos');

  // 8. Remover listas markdown (- * + e numeradas)
  // Mantém o conteúdo, só remove o marcador
  texto = texto.replace(/^[\s]*[-*+]\s+/gm, '');
  texto = texto.replace(/^[\s]*\d+\.\s+/gm, '');
  console.log('  ✓ Marcadores de lista removidos');

  // 9. Remover linhas horizontais markdown
  texto = texto.replace(/^[-*_]{3,}$/gm, '');
  console.log('  ✓ Linhas horizontais removidas');

  // 10. Remover tags HTML residuais
  texto = texto.replace(/<script[\s\S]*?<\/script>/gi, '');
  texto = texto.replace(/<style[\s\S]*?<\/style>/gi, '');
  texto = texto.replace(/<[^>]+>/g, '');
  console.log('  ✓ Tags HTML removidas');

  // 11. Decodificar entidades HTML comuns
  texto = texto.replace(/&nbsp;/g, ' ');
  texto = texto.replace(/&amp;/g, '&');
  texto = texto.replace(/&lt;/g, '<');
  texto = texto.replace(/&gt;/g, '>');
  texto = texto.replace(/&quot;/g, '"');
  texto = texto.replace(/&#39;/g, "'");
  texto = texto.replace(/&ordm;/g, 'º');
  texto = texto.replace(/&ordf;/g, 'ª');
  texto = texto.replace(/&#\d+;/g, ''); // Remover outras entidades numéricas
  console.log('  ✓ Entidades HTML decodificadas');

  // 12. Limpar espaços extras (mas preservar quebras de linha)
  texto = texto.replace(/[ \t]+/g, ' ');           // Múltiplos espaços → um espaço
  texto = texto.replace(/^ +| +$/gm, '');          // Espaços no início/fim de linhas
  console.log('  ✓ Espaços extras removidos');

  // 13. Limpar quebras de linha excessivas (máximo 2 consecutivas)
  texto = texto.replace(/\n{3,}/g, '\n\n');
  console.log('  ✓ Quebras de linha normalizadas');

  // 14. Remover linhas vazias no início e fim
  texto = texto.trim();
  console.log('  ✓ Espaços no início/fim removidos');

  console.log('🔧 Limpeza determinística concluída!');
  
  return texto;
}
