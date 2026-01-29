import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// ============================================================
// REMOVER LIXO/CÓDIGO DE TRACKING DO TEXTO
// ============================================================
function removerLixo(texto: string): string {
  let textoLimpo = texto;
  
  // PRIMEIRO: Remover "[LINHA EM BRANCO]" que pode vir do texto original
  textoLimpo = textoLimpo.replace(/\[LINHA\s*EM\s*BRANCO\]/gi, '\n');
  textoLimpo = textoLimpo.replace(/\{LINHA\s*EM\s*BRANCO\}/gi, '\n');
  
  const padroesLixo = [
    /F\{f5_p:'[^']*'/g,
    /\{[^}]*function[^}]*\}/g,
    /return\s+str[^;]*;/g,
    /set_latency[^)]*\)/g,
    /wait_perf_data\.[a-z]+/g,
    /chr\+str\.substr[^)]*\)/g,
    /String\.fromCharCode[^)]*\)/g,
    /\(b&\d+\)[^\)]*\)/g,
    /\w+&0x[a-fA-F0-9]+/g,
    /str=f5_cspm\.[^;]+;/g,
    /\.[a-z_]+\s*=\s*function[^}]+\}/gi,
    /[A-Z]{20,}/g,
  ];
  
  for (const padrao of padroesLixo) {
    textoLimpo = textoLimpo.replace(padrao, '');
  }
  
  textoLimpo = textoLimpo.replace(/[{}()\[\]]{3,}/g, '');
  textoLimpo = textoLimpo.replace(/\s{2,}/g, ' ');
  
  return textoLimpo.trim();
}

// ============================================================
// PRÉ-CORREÇÃO PROGRAMÁTICA - ADICIONAR QUEBRAS DUPLAS
// ============================================================
function preCorrigirQuebras(texto: string): string {
  // Normalizar quebras de linha
  let resultado = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // PROTEÇÃO: Garantir que "Jurídicos" e "LEI" fiquem separados ANTES de juntar linhas
  resultado = resultado.replace(/(Jurídicos)\s*\n*\s*(LEI)/gi, '$1\n\n$2');
  
  // Juntar linhas fragmentadas (que terminam no meio de frase)
  // MAS NÃO juntar se a próxima linha começa com maiúscula estrutural
  resultado = resultado.replace(/([a-záéíóúâêôãõç,;])\n+([a-záéíóúâêôãõç])/gi, '$1 $2');
  
  // ADICIONAR quebra dupla ANTES de cada elemento estrutural
  // Art. X
  resultado = resultado.replace(/\s*(Art\.?\s*\d)/gi, '\n\n$1');
  
  // § X ou Parágrafo único - APENAS quando é NOVO PARÁGRAFO, não referência
  // PROTEÇÃO: Marcar referências a § para NÃO quebrar linha
  // Padrões de referência: "do § 2º", "no § 1º", "art. 5º, § 3º", "constantes no § 10", ", § 2º,"
  resultado = resultado.replace(/(d[oae]s?|n[oae]s?|a[os]?)\s+(§\s*\d+[º°]?)/gi, '$1###REFPAR###$2');
  resultado = resultado.replace(/,\s+(§\s*\d+[º°]?)/gi, ',###REFPAR###$1');
  resultado = resultado.replace(/(art\.?\s*\d+[º°]?,?\s*)(§\s*\d+[º°]?)/gi, '$1###REFPAR###$2');
  
  // Agora quebrar apenas § que são NOVOS PARÁGRAFOS (após ponto final e seguido de texto)
  resultado = resultado.replace(/([.;:])\s*(§\s*\d+[º°]?\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n\n$2');
  
  // Restaurar as referências protegidas (com espaço)
  resultado = resultado.replace(/###REFPAR###/g, ' ');
  
  resultado = resultado.replace(/\s*(Parágrafo\s+único)/gi, '\n\n$1');
  
  // Incisos (I -, II -, III -, etc.)
  resultado = resultado.replace(/\s*([IVXLCDM]+\s*[-–—]\s)/gi, '\n\n$1');
  
  // Alíneas (a), b), c), etc.)
  resultado = resultado.replace(/\s*([a-z]\)\s)/gi, '\n\n$1');
  
  // TÍTULO, CAPÍTULO, SEÇÃO, LIVRO, PARTE
  resultado = resultado.replace(/\s*(TÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(CAPÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(SEÇÃO\s+[IVXLCDM]+)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(LIVRO\s+[IVXLCDM]+)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(PARTE\s+[IVXLCDM]+)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(DISPOSIÇÕES\s+(GERAIS|FINAIS|TRANSITÓRIAS|PRELIMINARES))/gi, '\n\n$1');
  
// Data final e assinatura
  resultado = resultado.replace(/\s*(Brasília,?\s+\d)/gi, '\n\n$1');
  resultado = resultado.replace(/\s*(Rio\s+de\s+Janeiro,?\s+\d)/gi, '\n\n$1');
  
  // Separar assinaturas (nomes em caixa alta após a data) - geralmente presidentes e ministros
  resultado = resultado.replace(/(\d{4}\.?)\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,})/g, '$1\n\n$2');
  
  // Normalizar múltiplas quebras para exatamente 2 (linha em branco)
  resultado = resultado.replace(/\n{3,}/g, '\n\n');
  
  // Limpar espaços duplos
  resultado = resultado.replace(/  +/g, ' ');
  
  // Trim cada linha
  resultado = resultado.split('\n').map(l => l.trim()).filter(l => l || true).join('\n');
  
  return resultado.trim();
}

// ============================================================
// FORMATAR ESTRUTURA INICIAL (CABEÇALHO, LEI, EMENTA)
// ============================================================
function formatarEstruturaInicial(texto: string): string {
  let resultado = texto;
  
  // PASSO 1: Garantir separação entre "Jurídicos" e "LEI" - SUPER AGRESSIVO
  resultado = resultado.replace(/(Jurídicos)\s*(LEI)/gi, '$1###SEPARAR###$2');
  resultado = resultado.replace(/(Jurídicos)\s+(LEI)/gi, '$1###SEPARAR###$2');
  resultado = resultado.replace(/JurídicosLEI/gi, 'Jurídicos###SEPARAR###LEI');
  
  resultado = resultado.replace(
    /(para\s+Assuntos\s+Jurídicos)\s*(LEI)/gi,
    '$1###SEPARAR###$2'
  );
  
  resultado = resultado.replace(/###SEPARAR###/g, '\n\n');
  
  // PASSO 2: Separar número da lei da ementa
  resultado = resultado.replace(
    /(LEI\s+(?:Nº|N[°º]?|COMPLEMENTAR)[^\n]*?\d{4}\.?)\s*(Define|Dispõe|Altera|Estabelece|Institui|Regulamenta|Cria|Dá|Acrescenta|Revoga|Autoriza|Aprova)/gi,
    '$1\n\n$2'
  );
  
  // PASSO 3: Separar ementa do preâmbulo
  resultado = resultado.replace(
    /(outras\s+providências\.)\s*(O\s+PRESIDENTE)/gi,
    '$1\n\n$2'
  );
  
  // PASSO 4: Separar preâmbulo do primeiro artigo/título/capítulo
  resultado = resultado.replace(
    /(seguinte\s+Lei:)\s*(Art\.|TÍTULO|CAPÍTULO|LIVRO|PARTE)/gi,
    '$1\n\n$2'
  );
  
  return resultado;
}

// ============================================================
// DIVIDIR EM CHUNKS SE NECESSÁRIO
// Garante que o final da lei (assinatura, data, presidente) não seja perdido
// ============================================================
function dividirEmChunks(texto: string): string[] {
  const MAX_CHUNK = 15000;
  
  if (texto.length <= MAX_CHUNK) {
    return [texto];
  }
  
  // Encontrar o último artigo para separar o corpo da lei do final
  const ultimoArtigoMatch = texto.match(/Art\.?\s*\d+[º°.-]*[^]*$/i);
  const posUltimoArtigo = ultimoArtigoMatch ? texto.lastIndexOf(ultimoArtigoMatch[0].substring(0, 30)) : -1;
  
  // Identificar padrões que indicam final da lei (após último artigo)
  // Ex: "Brasília, 15 de setembro de 1965", "CASTELLO BRANCO", assinaturas
  const padroesFinais = [
    /Brasília,?\s+\d+\s+de\s+\w+\s+de\s+\d{4}/i,
    /Rio\s+de\s+Janeiro,?\s+\d+\s+de\s+\w+\s+de\s+\d{4}/i,
    /Este\s+texto\s+não\s+substitui/i,
    /\*\s*Este\s+texto\s+não\s+substitui/i,
  ];
  
  // Encontrar onde começa o final da lei (assinaturas, datas)
  let posInicioFinal = texto.length;
  for (const padrao of padroesFinais) {
    const match = texto.match(padrao);
    if (match && match.index !== undefined) {
      if (match.index < posInicioFinal && match.index > posUltimoArtigo) {
        posInicioFinal = match.index;
      }
    }
  }
  
  // Dividir: corpo da lei (até posInicioFinal) + final da lei
  const corpoLei = texto.substring(0, posInicioFinal).trim();
  const finalLei = texto.substring(posInicioFinal).trim();
  
  console.log(`[CHUNKS] Corpo: ${corpoLei.length} chars, Final: ${finalLei.length} chars`);
  
  // Dividir o corpo em chunks por artigos
  const chunks: string[] = [];
  const partes = corpoLei.split(/(?=Art\.\s*\d)/gi);
  
  let chunkAtual = '';
  
  for (const parte of partes) {
    if ((chunkAtual + parte).length > MAX_CHUNK && chunkAtual.length > 0) {
      chunks.push(chunkAtual.trim());
      chunkAtual = parte;
    } else {
      chunkAtual += parte;
    }
  }
  
  if (chunkAtual.trim()) {
    chunks.push(chunkAtual.trim());
  }
  
  // Adicionar o final da lei ao último chunk (data, assinaturas, etc.)
  if (finalLei.length > 0 && chunks.length > 0) {
    chunks[chunks.length - 1] = chunks[chunks.length - 1] + '\n\n' + finalLei;
    console.log(`[CHUNKS] Final da lei anexado ao último chunk`);
  } else if (finalLei.length > 0) {
    chunks.push(finalLei);
  }
  
  return chunks.length > 0 ? chunks : [texto];
}

// ============================================================
// PROMPT PARA CORREÇÃO DE UM CHUNK
// ============================================================
const PROMPT_CORRECAO = (texto: string, chunkIndex: number, totalChunks: number) => `TAREFA: Formatar texto legislativo brasileiro.
${totalChunks > 1 ? `(Este é o chunk ${chunkIndex + 1} de ${totalChunks})` : ''}

REGRA 1 - MARCADOR + TEXTO NA MESMA LINHA:
- Art. + texto = MESMA LINHA. Ex: "Art. 12. O plano de desenvolvimento urbano..."
- § + texto = MESMA LINHA. Ex: "§ 1º O plano previsto no caput..."
- Inciso + texto = MESMA LINHA. Ex: "I – as diretrizes para as funções..."
- Alínea + texto = MESMA LINHA. Ex: "a) as funções públicas de interesse comum..."

ERRADO:
Art. 12.
O plano de desenvolvimento...

CORRETO:
Art. 12. O plano de desenvolvimento urbano integrado de região metropolitana...

REGRA 2 - ANOTAÇÕES LEGISLATIVAS NA MESMA LINHA:
Anotações entre parênteses devem ficar NA MESMA LINHA do elemento, APÓS o ponto final:
- "(Incluído pela Lei nº X)" → junto ao texto
- "(Redação dada pela Lei nº X)" → junto ao texto  
- "(Revogado pela Lei nº X)" → junto ao texto
- "(Vide Lei nº X)" → junto ao texto

ERRADO:
Art. 12. O plano de desenvolvimento urbano...
(Incluído pela Lei nº 13.683, de 2018)

CORRETO:
Art. 12. O plano de desenvolvimento urbano... (Incluído pela Lei nº 13.683, de 2018)

REGRA 3 - ARTIGO COMPLETAMENTE REVOGADO:
Quando TODO o texto de um artigo está tachado/riscado, simplificar para:
Art. X. (Revogado pela Lei nº Y)
Ou se não houver indicação: Art. X. (Revogado)

REGRA 4 - DUPLICATAS (USAR SEMPRE O ÚLTIMO):
Se há elementos duplicados com mesma numeração:
- Dois Art. 18 → IGNORAR o primeiro, usar SÓ o segundo (último)
- Duas alíneas "a)" → IGNORAR a primeira, usar SÓ a última
- Três § 2º → IGNORAR os dois primeiros, usar SÓ o terceiro
A versão válida é SEMPRE A ÚLTIMA (mais abaixo no texto).

SEPARAR EM LINHAS DIFERENTES:
- CABEÇALHO INSTITUCIONAL = linha própria
- NÚMERO DA LEI (LEI Nº...) = linha própria
- EMENTA = linha própria
- TÍTULO I, CAPÍTULO I, SEÇÃO I = linha própria

REGRA 5 - ESTRUTURA DE CAPÍTULOS/TÍTULOS/SEÇÕES:
A numeração do elemento deve ficar em uma linha, e o título descritivo na linha seguinte.

ERRADO:
CAPÍTULO II DA INSTITUIÇÃO DE REGIÕES METROPOLITANAS E DE AGLOMERAÇÕES URBANAS

CORRETO:
CAPÍTULO II
DA INSTITUIÇÃO DE REGIÕES METROPOLITANAS E DE AGLOMERAÇÕES URBANAS

TÍTULOS EM CAIXA ALTA - CADA UM EM LINHA PRÓPRIA:
- "LIVRO PRIMEIRO", "SISTEMA TRIBUTÁRIO NACIONAL", "TÍTULO I" = linhas separadas

REGRA 6 - ARTIGOS CITADOS ENTRE ASPAS (INCLUSÕES EM OUTRAS LEIS):
Quando um artigo menciona que "acrescenta os seguintes arts. Xº-A, Xº-B, Xº-C" ou similar,
os artigos seguintes que começam com ASPAS (") são CITAÇÕES/INCLUSÕES que FAZEM PARTE
do artigo anterior e devem ser mantidos JUNTOS a ele, NÃO como artigos separados.

Padrão: Art. 79. A Lei nº X passa a vigorar acrescida dos seguintes arts. 9º-B e 9º-C:
"Art. 9º-B. Texto do artigo..."
§ 1º ...
"Art. 9º-C. Texto do artigo..."

Neste caso, "Art. 9º-B" e "Art. 9º-C" NÃO são artigos 9, são CITAÇÕES dentro do Art. 79.
O número do artigo no sistema deve ser 79, e o conteúdo inclui as citações 9º-B e 9º-C.

ERRADO (extrair como artigos separados):
Art. 79. A Lei nº X passa a vigorar acrescida dos seguintes arts. 9º-B e 9º-C:

Art. 9º-B. A servidão ambiental poderá ser onerosa...   ← ERRADO! Isso virou artigo "9"

CORRETO (manter como parte do Art. 79):
Art. 79. A Lei nº X passa a vigorar acrescida dos seguintes arts. 9º-B e 9º-C:
"Art. 9º-B. A servidão ambiental poderá ser onerosa ou gratuita, temporária ou perpétua.
§ 1º O prazo mínimo da servidão ambiental temporária é de 15 (quinze) anos.
§ 2º A servidão ambiental perpétua equivale..."
"Art. 9º-C. O contrato de alienação, cessão ou transferência da servidão ambiental..."

INDICADORES de que um "Art." é uma CITAÇÃO (não artigo real):
- Começa com aspas: "Art. Xº-A
- Tem sufixo com letra: Art. 9º-A, Art. 9º-B, Art. 9º-C
- Vem logo após artigo que menciona "passa a vigorar acrescida" ou "passa a vigorar com"
- O artigo anterior menciona "os seguintes arts." ou "o seguinte art."

NÃO QUEBRAR:
- Referências em minúsculo como "art. 5º, § 3º, inciso XV"
- Continuação de frase
- Artigos citados entre aspas que fazem parte do artigo anterior

REMOVER:
- Código/lixo técnico (function, return, f5_p)
- Nunca escrever "[LINHA EM BRANCO]"

TEXTO:
${texto}

RETORNE APENAS O TEXTO FORMATADO:`;

// ============================================================
// CHAMAR GEMINI PARA CORREÇÃO DE UM CHUNK
// ============================================================
async function corrigirChunkComGemini(texto: string, chunkIndex: number, totalChunks: number): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    console.warn('[CORRIGIR] Sem chaves Gemini');
    return texto;
  }
  
  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT_CORRECAO(texto, chunkIndex, totalChunks) }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65536,
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const textoCorrigido = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (textoCorrigido && textoCorrigido.length > texto.length * 0.5) {
          // Verificação de completude por artigos
          const artigosOriginais = (texto.match(/Art\.?\s*\d+/gi) || []);
          const artigosCorrigidos = (textoCorrigido.match(/Art\.?\s*\d+/gi) || []);
          
          if (artigosOriginais.length > artigosCorrigidos.length) {
            console.warn(`⚠️ CHUNK ${chunkIndex + 1} INCOMPLETO: ${artigosOriginais.length} artigos no original, ${artigosCorrigidos.length} na resposta`);
            console.warn(`⚠️ Ultimo artigo original: ${artigosOriginais[artigosOriginais.length - 1]}`);
            console.warn(`⚠️ Ultimo artigo corrigido: ${artigosCorrigidos[artigosCorrigidos.length - 1]}`);
          }
          
          console.log(`[CORRIGIR] Chunk ${chunkIndex + 1} corrigido: ${texto.length} → ${textoCorrigido.length} chars, artigos: ${artigosOriginais.length} → ${artigosCorrigidos.length}`);
          return textoCorrigido;
        }
      } else {
        const errorText = await response.text();
        console.error(`[CORRIGIR] Erro ${response.status}: ${errorText.substring(0, 200)}`);
        
        if (response.status === 429 || response.status >= 500) {
          continue;
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[CORRIGIR] Timeout');
      } else {
        console.error('[CORRIGIR] Erro:', error.message);
      }
      continue;
    }
  }
  
  return texto;
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { textoFormatado, chunkIndex, totalChunks, chunk } = body;
    
    // ─────────────────────────────────────────────────────────────
    // MODO 1: Receber texto completo e retornar informações de chunks
    // (quando não há chunkIndex, prepara o texto e retorna chunks)
    // ─────────────────────────────────────────────────────────────
    if (chunkIndex === undefined && textoFormatado) {
      console.log(`[PREPARAR] Recebido texto com ${textoFormatado.length} caracteres`);
      
      // Pré-processamento
      const textoSemLixo = removerLixo(textoFormatado);
      const textoEstruturado = formatarEstruturaInicial(textoSemLixo);
      const textoPreCorrigido = preCorrigirQuebras(textoEstruturado);
      
      // Dividir em chunks
      const chunks = dividirEmChunks(textoPreCorrigido);
      
      console.log(`[PREPARAR] Dividido em ${chunks.length} chunk(s)`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          mode: 'prepare',
          totalChunks: chunks.length,
          chunks: chunks,
          tamanhoOriginal: textoFormatado.length,
          tamanhoPreProcessado: textoPreCorrigido.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ─────────────────────────────────────────────────────────────
    // MODO 2: Processar um chunk específico
    // (quando chunkIndex é fornecido junto com o chunk)
    // ─────────────────────────────────────────────────────────────
    if (chunkIndex !== undefined && chunk) {
      console.log(`[CHUNK ${chunkIndex + 1}/${totalChunks}] Processando ${chunk.length} chars`);
      
      const corrigido = await corrigirChunkComGemini(chunk, chunkIndex, totalChunks);
      
      console.log(`[CHUNK ${chunkIndex + 1}/${totalChunks}] Concluído: ${corrigido.length} chars`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          mode: 'process',
          chunkIndex,
          chunkCorrigido: corrigido,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ─────────────────────────────────────────────────────────────
    // ERRO: Parâmetros inválidos
    // ─────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Parâmetros inválidos. Envie textoFormatado (para preparar) ou chunkIndex + chunk (para processar)' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
