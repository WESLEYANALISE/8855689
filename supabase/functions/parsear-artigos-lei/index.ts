import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtigoParsed {
  numero: string;
  conteudo: string;
  ordem: number;
}

// Regex patterns para identificar artigos
const ARTICLE_PATTERNS = [
  // Art. 1º, Art. 1o, Art. 1
  /Art\.\s*(\d+[º°ªo]?(?:-[A-Z])?)\s*[-–.]?\s*/gi,
  // Artigo 1º, Artigo 1
  /Artigo\s*(\d+[º°ªo]?(?:-[A-Z])?)\s*[-–.]?\s*/gi,
];

// Padrões para limpar o número do artigo
function normalizarNumeroArtigo(numero: string): string {
  return numero
    .replace(/[º°ªo]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

// Extrair artigos usando regex - versão melhorada para leis grandes
function extrairArtigosRegex(texto: string): ArtigoParsed[] {
  const artigos: ArtigoParsed[] = [];
  
  // Regex para encontrar início de artigos - mais abrangente
  const artigoPattern = /(?:^|\n)\s*(Art\.?\s*(\d+[º°ªo]?(?:-[A-Z])?)[.\s\-–]*)/gi;
  
  // Encontrar todas as posições de artigos
  const matches: { index: number; numero: string; match: string }[] = [];
  let match;
  
  while ((match = artigoPattern.exec(texto)) !== null) {
    matches.push({
      index: match.index,
      numero: normalizarNumeroArtigo(match[2]),
      match: match[1]
    });
  }
  
  console.log(`   Encontrados ${matches.length} inícios de artigos`);
  
  // Extrair conteúdo entre artigos
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const inicio = current.index;
    const fim = next ? next.index : texto.length;
    
    let conteudo = texto.substring(inicio, fim).trim();
    
    // Limpar conteúdo
    conteudo = conteudo
      // Remover quebras de linha excessivas
      .replace(/\n{3,}/g, '\n\n')
      // Remover espaços excessivos
      .replace(/[ \t]+/g, ' ')
      // Remover linhas vazias no início
      .replace(/^\s*\n/, '')
      .trim();
    
    // Só adicionar se tem conteúdo significativo
    if (conteudo.length > 20 && current.numero) {
      artigos.push({
        numero: current.numero,
        conteudo,
        ordem: i + 1
      });
    }
  }
  
  return artigos;
}

// Usar Gemini para extrair artigos de textos complexos
async function extrairArtigosGemini(texto: string, tableName: string): Promise<ArtigoParsed[]> {
  const geminiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY_2');
  
  if (!geminiKey) {
    console.log('Gemini não disponível, usando apenas regex');
    return [];
  }

  try {
    // Limitar texto para não exceder tokens
    const textoLimitado = texto.substring(0, 50000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extraia todos os artigos do seguinte texto legal (${tableName}).

Para cada artigo, retorne um JSON com:
- numero: número do artigo (ex: "1", "2-A", "121")
- conteudo: texto completo do artigo incluindo parágrafos, incisos e alíneas

IMPORTANTE:
- Mantenha a formatação original do texto
- Inclua todos os parágrafos (§1º, §2º) e incisos (I, II, III)
- NÃO inclua cabeçalhos de capítulos ou títulos

Retorne APENAS um array JSON válido, sem explicações.

TEXTO:
${textoLimitado}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 30000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extrair JSON da resposta
    const jsonMatch = textoResposta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const artigos = JSON.parse(jsonMatch[0]);
    
    return artigos.map((a: any, index: number) => ({
      numero: normalizarNumeroArtigo(String(a.numero || '')),
      conteudo: a.conteudo || '',
      ordem: index + 1
    }));

  } catch (error) {
    console.error('Erro ao usar Gemini:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conteudo, tableName, usarGemini = false } = await req.json();

    if (!conteudo) {
      throw new Error('Conteúdo não fornecido');
    }

    console.log(`📝 Parseando artigos para: ${tableName || 'lei'}`);
    console.log(`   Tamanho do conteúdo: ${conteudo.length} caracteres`);

    // Primeiro, tentar com regex
    let artigos = extrairArtigosRegex(conteudo);
    console.log(`   Regex encontrou: ${artigos.length} artigos`);

    // Se poucos artigos ou usarGemini solicitado, usar IA
    if ((artigos.length < 10 || usarGemini) && conteudo.length > 1000) {
      console.log('   Usando Gemini para extração avançada...');
      const artigosGemini = await extrairArtigosGemini(conteudo, tableName);
      
      if (artigosGemini.length > artigos.length) {
        console.log(`   Gemini encontrou: ${artigosGemini.length} artigos`);
        artigos = artigosGemini;
      }
    }

    // Limpar e deduplicar artigos
    const artigosUnicos = new Map<string, ArtigoParsed>();
    for (const artigo of artigos) {
      if (artigo.numero && artigo.conteudo.length > 10) {
        // Se já existe, manter o mais completo
        const existente = artigosUnicos.get(artigo.numero);
        if (!existente || artigo.conteudo.length > existente.conteudo.length) {
          artigosUnicos.set(artigo.numero, artigo);
        }
      }
    }

    const artigosFinal = Array.from(artigosUnicos.values())
      .sort((a, b) => {
        // Ordenar numericamente
        const numA = parseInt(a.numero.replace(/[^\d]/g, '')) || 0;
        const numB = parseInt(b.numero.replace(/[^\d]/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.numero.localeCompare(b.numero);
      })
      .map((a, index) => ({ ...a, ordem: index + 1 }));

    console.log(`   Total final: ${artigosFinal.length} artigos únicos`);

    return new Response(JSON.stringify({
      success: true,
      artigos: artigosFinal,
      total: artigosFinal.length,
      metodo: artigos === artigosFinal ? 'regex' : 'gemini'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao parsear artigos:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      artigos: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
