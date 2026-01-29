import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface LinhaTabela {
  numero: string;
  texto: string;
  alteracao?: 'revogado' | 'incluido' | 'redacao' | 'vetado' | 'renumerado' | 'vigencia' | null;
}

// Detectar tipo de alteração no texto
function detectarAlteracao(texto: string): LinhaTabela['alteracao'] {
  const textoLower = texto.toLowerCase();
  
  // Padrões de detecção baseados no Planalto/normas.leg.br
  if (/\(revogad[oa]\)/i.test(texto) || /\(suprimid[oa]\)/i.test(texto)) {
    return 'revogado';
  }
  if (/\(incluíd[oa]\s*(pel[oa])?\s*lei/i.test(texto) || /\(acrescid[oa]\s*pel[oa]/i.test(texto) || /\(inserid[oa]\s*pel[oa]/i.test(texto)) {
    return 'incluido';
  }
  if (/\(redação\s*dada\s*pel[oa]/i.test(texto) || /\(nova\s*redação\s*dada/i.test(texto) || /\(alterado\s*pel[oa]/i.test(texto)) {
    return 'redacao';
  }
  if (/\(vetad[oa]\)/i.test(texto) || /\(veto\s*mantido\)/i.test(texto)) {
    return 'vetado';
  }
  if (/\(renumerad[oa]\s*pel[oa]/i.test(texto)) {
    return 'renumerado';
  }
  if (/\(vigência\)/i.test(texto) || /\(produção\s*de\s*efeitos\)/i.test(texto)) {
    return 'vigencia';
  }
  
  return null;
}

async function callGemini(prompt: string, texto: string, keyIndex = 0): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam');
  }

  const apiKey = GEMINI_KEYS[keyIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    console.log(`[Gemini] Tentando key ${keyIndex}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${prompt}\n\nTEXTO DA LEI:\n${texto}` }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
        }
      })
    });

    if (response.status === 429 || response.status === 503) {
      console.log(`[Gemini] Key ${keyIndex} rate limited, trying next...`);
      await new Promise(r => setTimeout(r, 1000));
      return callGemini(prompt, texto, keyIndex + 1);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`[Gemini] Error:`, data.error);
      if (keyIndex < GEMINI_KEYS.length - 1) {
        return callGemini(prompt, texto, keyIndex + 1);
      }
      throw new Error(data.error.message);
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`[Gemini] Sucesso! Retornou ${result.length} caracteres`);
    return result;
  } catch (error) {
    console.error(`[Gemini] Error calling:`, error);
    if (keyIndex < GEMINI_KEYS.length - 1) {
      return callGemini(prompt, texto, keyIndex + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  console.log('[Estruturar Tabela] Requisição recebida');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoLei } = await req.json();
    
    if (!textoLei) {
      return new Response(
        JSON.stringify({ error: 'textoLei é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (GEMINI_KEYS.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave Gemini configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    const prompt = `Você é um especialista em estruturação de textos legais brasileiros.

Sua tarefa é transformar o texto de uma lei em um array JSON estruturado.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS um array JSON válido, sem texto adicional ou markdown
2. Cada elemento do array deve ter: { "numero": "identificador", "texto": "conteúdo" }

3. FORMATO DO CAMPO "numero":
   - Para ARTIGOS: APENAS o número ordinal ou cardinal SEM "Art."
     * Artigos 1 a 9: use ordinal → "1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º"
     * Artigos 10 em diante: use cardinal → "10", "11", "12", "13", etc
     * Artigos com letra: "1º-A", "10-A", etc
   - Para cabeçalhos estruturais: "TÍTULO I", "CAPÍTULO I", "SEÇÃO I", "SUBSEÇÃO I", "LIVRO I", "PARTE I", etc
   - Para preâmbulo/ementa: "PREÂMBULO", "EMENTA"
   - Para número da lei: "LEI Nº X.XXX"
   - Para cabeçalho institucional: "CABEÇALHO"

4. FORMATO DO CAMPO "texto":
   - Para ARTIGOS: INCLUA "Art. Xº" no INÍCIO do texto, seguido do conteúdo
     Exemplo: "Art. 1º São atividades privativas de advocacia:..."
   - Para CABEÇALHO institucional: use quebra de linha dupla entre cada parte
     Exemplo: "Presidência da República\\n\\nCasa Civil\\n\\nSubchefia para Assuntos Jurídicos"
   - MANTENHA textos entre parênteses como (Redação dada pela Lei...), (Revogado), (Incluído pela Lei...), etc

5. LIMPEZA OBRIGATÓRIA DO TEXTO:
   - REMOVA todo HTML, tags, scripts, estilos
   - REMOVA linhas com "---", "***", "===", ou separadores estranhos
   - REMOVA textos de teste
   - Se houver TEXTO DUPLICADO (versão antiga/riscada), MANTENHA APENAS O MAIS RECENTE

6. FORMATAÇÃO DENTRO DO TEXTO:
   - Use \\n\\n (quebra dupla) para separar:
     * Parágrafos (§ 1º, § 2º, Parágrafo único)
     * Incisos (I, II, III, IV...)
     * Alíneas (a, b, c, d...)
   - NÃO preserve outras quebras de linha do original

7. ESTRUTURA - CADA UM EM SUA PRÓPRIA LINHA:
   - Cada LIVRO, PARTE, TÍTULO, CAPÍTULO, SEÇÃO, SUBSEÇÃO = linha separada
   - Cada ARTIGO = linha separada com todo seu conteúdo

Exemplo de saída CORRETA:
[
  {"numero": "CABEÇALHO", "texto": "Presidência da República\\n\\nCasa Civil\\n\\nSubchefia para Assuntos Jurídicos"},
  {"numero": "LEI Nº 8.906", "texto": "DE 4 DE JULHO DE 1994"},
  {"numero": "EMENTA", "texto": "Dispõe sobre o Estatuto da Advocacia e a Ordem dos Advogados do Brasil (OAB)."},
  {"numero": "TÍTULO I", "texto": "Da Advocacia"},
  {"numero": "CAPÍTULO I", "texto": "Da Atividade de Advocacia"},
  {"numero": "1º", "texto": "Art. 1º São atividades privativas de advocacia:\\n\\nI – a postulação a qualquer órgão do Poder Judiciário;\\n\\nII – as atividades de consultoria. (Redação dada pela Lei nº 14.365, de 2022)\\n\\n§ 1º Não se inclui na atividade privativa..."},
  {"numero": "2º", "texto": "Art. 2º O advogado é indispensável à administração da justiça."},
  {"numero": "10", "texto": "Art. 10. A advocacia é função essencial à justiça. (Incluído pela Lei nº X)"}
]

IMPORTANTE: Retorne APENAS o JSON, sem \`\`\`json ou qualquer marcação!`;

    console.log(`[Estruturar] Texto com ${textoLei.length} caracteres`);
    
    // Limitar texto se muito grande (Gemini tem limite de tokens)
    const textoLimitado = textoLei.length > 50000 ? textoLei.substring(0, 50000) : textoLei;
    
    const resultado = await callGemini(prompt, textoLimitado);
    
    // Limpar resposta e parsear JSON
    let jsonLimpo = resultado.trim();
    
    // Remover marcações de código se existirem
    if (jsonLimpo.startsWith('```json')) {
      jsonLimpo = jsonLimpo.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonLimpo.startsWith('```')) {
      jsonLimpo = jsonLimpo.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Tentar extrair apenas o array JSON
    const jsonMatch = jsonLimpo.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonLimpo = jsonMatch[0];
    }
    
    // Tentar parsear com tratamento de erros
    let tabela: LinhaTabela[];
    try {
      tabela = JSON.parse(jsonLimpo);
    } catch (parseError) {
      console.error('[Estruturar] Erro ao parsear JSON:', parseError);
      console.log('[Estruturar] Tentando corrigir JSON truncado...');
      
      // Tentar corrigir JSON truncado - encontrar o último objeto completo
      let jsonCorrigido = jsonLimpo;
      
      // Se termina com string incompleta, tentar fechar
      if (!jsonCorrigido.endsWith(']')) {
        // Encontrar último objeto completo (termina com })
        const ultimoObjCompleto = jsonCorrigido.lastIndexOf('},');
        if (ultimoObjCompleto > 0) {
          jsonCorrigido = jsonCorrigido.substring(0, ultimoObjCompleto + 1) + ']';
        } else {
          // Tentar fechar string e objeto
          const ultimaAspa = jsonCorrigido.lastIndexOf('"');
          if (ultimaAspa > 0) {
            const aposAspa = jsonCorrigido.substring(ultimaAspa + 1);
            if (!aposAspa.includes('}')) {
              jsonCorrigido = jsonCorrigido.substring(0, ultimaAspa + 1) + '"}]';
            }
          }
        }
      }
      
      try {
        tabela = JSON.parse(jsonCorrigido);
        console.log('[Estruturar] JSON corrigido com sucesso!');
      } catch (e2) {
        console.error('[Estruturar] Não foi possível corrigir JSON');
        
        // Fallback: criar tabela básica parseando linha a linha
        tabela = [];
        const linhas = textoLimitado.split('\n');
        let artigoAtual = '';
        let textoAtual = '';
        
        for (const linha of linhas) {
          const artigoMatch = linha.match(/^Art\.?\s*(\d+[º°ªo]?(?:-[A-Z])?)/i);
          if (artigoMatch) {
            if (artigoAtual) {
              tabela.push({ numero: artigoAtual, texto: textoAtual.trim() });
            }
            artigoAtual = `Art. ${artigoMatch[1]}`;
            textoAtual = linha;
          } else if (artigoAtual) {
            textoAtual += '\n\n' + linha;
          } else {
            // Cabeçalho ou antes dos artigos
            if (linha.trim()) {
              tabela.push({ numero: 'TEXTO', texto: linha.trim() });
            }
          }
        }
        
        if (artigoAtual) {
          tabela.push({ numero: artigoAtual, texto: textoAtual.trim() });
        }
        
        console.log(`[Estruturar] Fallback: ${tabela.length} linhas via parsing simples`);
      }
    }
    
    // Adicionar campo de alteração a cada linha
    tabela = tabela.map(linha => ({
      ...linha,
      alteracao: detectarAlteracao(linha.texto)
    }));
    
    const tempoTotal = Date.now() - startTime;
    
    console.log(`[Estruturar] Concluído em ${tempoTotal}ms - ${tabela.length} linhas`);

    return new Response(
      JSON.stringify({
        success: true,
        tabela,
        totalLinhas: tabela.length,
        tempoMs: tempoTotal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Estruturar] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
