import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Limite de caracteres de SAÍDA por parte (Gemini Flash tem limite de ~65k tokens de output)
// Estimamos ~4 chars por token, então ~200k chars de saída máxima
// Usamos 150k como limite seguro por parte de saída
const LIMITE_SAIDA_PARTE = 150000;

// Calcula quantas partes de SAÍDA serão necessárias baseado no tamanho do texto
// Textos legais geralmente mantêm tamanho similar após formatação
function calcularNumeroPartes(texto: string): number {
  const tamanho = texto.length;
  
  // Texto pequeno: cabe em uma única resposta
  if (tamanho <= LIMITE_SAIDA_PARTE) {
    return 1;
  }
  
  // Calcula partes necessárias baseado no tamanho esperado de saída
  const partes = Math.ceil(tamanho / LIMITE_SAIDA_PARTE);
  
  // Limita a um máximo de 8 partes
  return Math.min(partes, 8);
}

// Prompt base - regras de manterTextos serão adicionadas dinamicamente
// Se promptCustomizado for fornecido, usa ele em vez do padrão
function gerarPromptFormatacao(
  manterTextos: string[] = ['(VETADO)', '(Revogado)', '(revogado)', 'Vetado', 'Revogado'], 
  partInfo?: { atual: number; total: number }
): string {
  const textosParaManter = manterTextos.join(', ');
  const parteSufixo = partInfo ? `\n\n## CONTEXTO: Esta é a PARTE ${partInfo.atual} de ${partInfo.total} do texto completo. Formate APENAS esta parte, mantendo a numeração original dos artigos.` : '';
  
  return `Você é um especialista em formatação de textos legais brasileiros.

## TAREFA PRINCIPAL - REMOVER QUEBRAS DE LINHA ERRADAS:
O texto bruto vem do site do Planalto com QUEBRAS DE LINHA NO MEIO DAS FRASES. 
Sua tarefa é JUNTAR essas linhas fragmentadas em frases completas.

### PROBLEMA A RESOLVER:
O texto original tem quebras assim (ERRADO):
"execução da Reforma Agrária e promoção da Política
Agrícola.
§ 1º Considera-se
Reforma Agrária o conjunto de medidas que visem a
promover melhor distribuição da
terra, mediante modificações no regime de sua posse e
uso, a fim de atender aos
princípios de justiça social"

### COMO DEVE FICAR (CORRETO):
"execução da Reforma Agrária e promoção da Política Agrícola.
§ 1º Considera-se Reforma Agrária o conjunto de medidas que visem a promover melhor distribuição da terra, mediante modificações no regime de sua posse e uso, a fim de atender aos princípios de justiça social"

### REGRA SIMPLES:
1. Se uma linha NÃO começa com: Art., §, I -, II -, a), b), TÍTULO, CAPÍTULO, SEÇÃO, LIVRO
2. ENTÃO ela é continuação da linha anterior e deve ser JUNTA na mesma linha

## ONDE MANTER QUEBRAS DE LINHA (apenas nesses casos):
- ANTES de "Art." (novo artigo)
- ANTES de "§" ou "Parágrafo" (parágrafo)
- ANTES de numeração romana seguida de hífen (I -, II -, III -, etc.)
- ANTES de alíneas (a), b), c), etc.)
- ANTES de estruturas: TÍTULO, CAPÍTULO, SEÇÃO, LIVRO, PARTE

## ONDE NUNCA PODE TER QUEBRA:
- No meio de qualquer frase
- Entre palavras de uma mesma oração
- Depois de vírgula ou antes de ponto final

### 3. PROIBIDO MARKDOWN:
- NUNCA use ** ou # ou * ou _
- Retorne TEXTO PURO

### 4. LIMPEZA:
- Remover links, URLs
- REMOVER markdown existente
- PRESERVAR TODOS os textos entre parênteses, incluindo:
  - (Incluído pela Lei nº X)
  - (Redação dada pela Lei nº X)
  - (Vide Lei nº X)
  - (VETADO), (Revogado), (Vigência)
  - Qualquer anotação legislativa entre parênteses
- Textos específicos a manter: ${textosParaManter}

### 5. REGRA CRÍTICA - TEXTO RISCADO/TACHADO (DUPLICATAS):
No site do Planalto, texto antigo aparece RISCADO (tachado) seguido da versão nova.
Você DEVE identificar e IGNORAR COMPLETAMENTE qualquer texto que:
- Apareça duplicado (mesma numeração aparecendo 2+ vezes)
- Seja a PRIMEIRA versão quando houver duplicatas (versões antigas são sempre as primeiras)
- Esteja marcado visualmente como riscado/tachado no HTML original

REGRA SIMPLES: Se há 2 elementos com mesma numeração (ex: dois "§ 2º"), use APENAS O ÚLTIMO (de baixo).
Se há 3 elementos iguais, use APENAS O TERCEIRO. A versão válida é SEMPRE A ÚLTIMA.

Exemplos:
- Dois "Art. 2º" no texto → IGNORE o primeiro, use SÓ o segundo
- Três "§ 2º" no mesmo artigo → IGNORE os dois primeiros, use SÓ o terceiro
- Dois "II -" no mesmo artigo → IGNORE o primeiro, use SÓ o segundo
- Duas alíneas "a)" → IGNORE a primeira, use SÓ a segunda

### 6. CONTEÚDO REVOGADO/VETADO - REGRA CRÍTICA:
IMPORTANTE: Você DEVE incluir TODOS os elementos que foram revogados ou vetados!

- Quando encontrar texto TACHADO (strikethrough) no HTML, isso indica conteúdo revogado
- Artigos, parágrafos, incisos ou alíneas com texto tachado DEVEM ser incluídos
- Para elementos revogados/vetados, inclua o texto COMPLETO seguido de "(Revogado)" ou "(VETADO)"
- Se aparecer "(Revogado pela Lei nº X)" ou "(Revogada pela Lei nº X)", mantenha essa informação

EXEMPLOS:
- Parágrafo com texto tachado e "(Revogado pela Lei nº 14.195, de 2021)" → Incluir: "Parágrafo único. [texto completo] (Revogado pela Lei nº 14.195, de 2021)"
- Art. 18 vetado → "Art. 18. (VETADO)"
- § 2º revogado → "§ 2º [texto se houver] (Revogado)"

NUNCA ignore/omita parágrafos, incisos ou alíneas só porque estão tachados/revogados!

### 7. REGRA CRÍTICA - EXPANDIR ARTIGOS REVOGADOS EM INTERVALO:
Quando encontrar intervalos de artigos revogados como "Arts. 1° a 15. (Revogados pela Lei...)", você DEVE:
- EXPANDIR cada artigo individualmente, do primeiro ao último do intervalo
- Cada artigo deve aparecer em sua própria linha como revogado

EXEMPLO - Se encontrar: "Arts. 1° a 15. (Revogados pela Lei nº 9.394, de 1996)"
Você DEVE gerar:
Art. 1º (Revogado)
Art. 2º (Revogado)
Art. 3º (Revogado)
Art. 4º (Revogado)
Art. 5º (Revogado)
Art. 6º (Revogado)
Art. 7º (Revogado)
Art. 8º (Revogado)
Art. 9º (Revogado)
Art. 10. (Revogado)
Art. 11. (Revogado)
Art. 12. (Revogado)
Art. 13. (Revogado)
Art. 14. (Revogado)
Art. 15. (Revogado)

Isso vale para QUALQUER intervalo de artigos revogados: "Arts. 5º a 10.", "Arts. 20 a 25 (Revogados)", etc.

### 8. PRESERVAR TODOS OS ARTIGOS:
- NUNCA pule artigos, mesmo que tenham conteúdo curto ou "(VETADO)"
- Artigos vetados devem aparecer como: "Art. 18. (VETADO)"
- Preserve a sequência completa de numeração (Art. 1º, 2º, 3º... até o último)

## EXEMPLO DE SAÍDA CORRETA:

Art. 1º Os índios e as comunidades indígenas ainda não integrados à comunhão nacional ficam sujeitos ao regime tutelar estabelecido nesta Lei.
§ 1º Ao regime tutelar estabelecido nesta Lei aplicam-se no que couber, os princípios e normas da tutela de direito comum.
Art. 2º Cumpre à União, aos Estados e aos Municípios, bem como aos órgãos das respectivas administrações indiretas, nos limites de sua competência, para a proteção das comunidades indígenas e a preservação dos seus direitos:
I - estender aos índios os benefícios da legislação comum, sempre que possível a sua aplicação;
II - prestar assistência aos índios e às comunidades indígenas ainda não integrados à comunhão nacional;
III - respeitar, ao proporcionar aos índios meios para o seu desenvolvimento, as peculiaridades inerentes à sua condição;
Art. 18. (VETADO)
Art. 19. (VETADO)

LEMBRE-SE: 
1. Cada artigo, parágrafo, inciso e alínea deve ter seu texto COMPLETO em uma única linha. NUNCA quebre no meio de frases!
2. NÃO siga a formatação de quebra de linha do texto original do Planalto! Ignore as quebras de linha duplas do HTML original.
3. Use APENAS as nossas regras de quebra: uma quebra antes de Art., §, incisos (I -, II -), alíneas (a), b)), e estruturas (TÍTULO, CAPÍTULO, etc).
4. Todo o conteúdo de um artigo/parágrafo/inciso deve ficar em UMA ÚNICA linha contínua.
2. Quando houver duplicatas, USE APENAS O ÚLTIMO elemento com aquela numeração!
3. Preserve TODOS os artigos na sequência, mesmo os vetados!

Retorne APENAS o texto formatado.${parteSufixo}`
}

// Função para dividir texto em partes inteligentemente (por artigos ou estruturas)
function dividirTextoEmPartes(texto: string, numPartes: number): string[] {
  const linhas = texto.split('\n');
  const totalLinhas = linhas.length;
  const linhasPorParte = Math.ceil(totalLinhas / numPartes);
  
  const partes: string[] = [];
  
  for (let i = 0; i < numPartes; i++) {
    const inicio = i * linhasPorParte;
    let fim = Math.min((i + 1) * linhasPorParte, totalLinhas);
    
    // Tentar encontrar um ponto de corte melhor (início de artigo ou estrutura)
    if (i < numPartes - 1 && fim < totalLinhas) {
      // Procurar por início de artigo ou estrutura nas próximas 50 linhas
      for (let j = fim; j < Math.min(fim + 50, totalLinhas); j++) {
        const linha = linhas[j];
        if (linha.match(/^Art\.?\s*\d+/i) || 
            linha.match(/^(TÍTULO|CAPÍTULO|LIVRO|SEÇÃO|PARTE)\s+[IVXLCDM0-9]+/i)) {
          fim = j;
          break;
        }
      }
    }
    
    const parteLinhas = linhas.slice(inicio, fim);
    if (parteLinhas.length > 0) {
      partes.push(parteLinhas.join('\n'));
    }
  }
  
  return partes.filter(p => p.trim().length > 0);
}

// Helper para verificar se o controller ainda está ativo
function safeEnqueue(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: string): boolean {
  try {
    controller.enqueue(encoder.encode(data));
    return true;
  } catch {
    // Controller já foi fechado, ignorar
    return false;
  }
}

function safeClose(controller: ReadableStreamDefaultController): boolean {
  try {
    controller.close();
    return true;
  } catch {
    // Controller já foi fechado, ignorar
    return false;
  }
}

// Função para chamar Gemini com uma parte do texto
async function processarParte(
  apiKey: string, 
  textoParte: string, 
  manterTextos: string[],
  parteAtual: number,
  totalPartes: number,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  abortSignal?: AbortSignal
): Promise<string> {
  // Usando gemini-2.5-flash - modelo mais potente para formatação precisa
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortSignal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: gerarPromptFormatacao(manterTextos, { atual: parteAtual, total: totalPartes }) },
              { text: `\n\n## TEXTO BRUTO PARA FORMATAR (PARTE ${parteAtual}/${totalPartes}):\n\n${textoParte}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Stream não disponível');

  const decoder = new TextDecoder();
  let buffer = '';
  let textoCompleto = '';

  try {
    while (true) {
      // Verificar se foi abortado
      if (abortSignal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith(':')) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const jsonStr = trimmedLine.slice(6);
          
          if (jsonStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(jsonStr);
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              textoCompleto += text;
              
              // Enviar chunk via SSE com indicador de parte
              const event = `data: ${JSON.stringify({ 
                type: 'chunk', 
                texto: text,
                parte: parteAtual,
                totalPartes: totalPartes
              })}\n\n`;
              
              // Se não conseguir enviar, o cliente desconectou
              if (!safeEnqueue(controller, encoder, event)) {
                reader.cancel();
                throw new Error('Client disconnected');
              }
            }
          } catch (e) {
            // JSON incompleto ou erro de envio
            if (e instanceof Error && e.message === 'Client disconnected') {
              throw e;
            }
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignorar erro se já liberado
    }
  }

  return textoCompleto;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoBruto, tableName, manterTextos } = await req.json();

    if (!textoBruto || textoBruto.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto bruto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🤖 FORMATAÇÃO COM GEMINI 2.5 FLASH (STREAMING)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Tabela: ${tableName}`);
    console.log(`📊 Texto bruto: ${textoBruto.length} caracteres`);
    console.log(`🔑 Chaves disponíveis: ${GEMINI_KEYS.length}`);

    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    // Calcular dinamicamente quantas partes são necessárias
    const numPartes = calcularNumeroPartes(textoBruto);
    const precisaDividir = numPartes > 1;
    
    console.log(`📦 Partes de saída calculadas: ${numPartes} (texto: ${textoBruto.length} chars, limite saída/parte: ${LIMITE_SAIDA_PARTE})`);

    const partes = precisaDividir 
      ? dividirTextoEmPartes(textoBruto, numPartes)
      : [textoBruto];

    console.log(`📦 Partes criadas: ${partes.length}`);
    partes.forEach((p, i) => console.log(`   Parte ${i + 1}: ${p.length} caracteres`));

    // Tentar com cada chave até funcionar
    let lastError: Error | null = null;
    
    for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
      const apiKey = GEMINI_KEYS[keyIndex];
      console.log(`🔄 Tentando com GEMINI_KEY_${keyIndex + 1}...`);
      
      try {
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
          async start(controller) {
            let clientDisconnected = false;
            
            try {
              let textoCompleto = '';

              // Enviar evento de início
              const startEvent = `data: ${JSON.stringify({ 
                type: 'start', 
                totalPartes: partes.length 
              })}\n\n`;
              if (!safeEnqueue(controller, encoder, startEvent)) {
                clientDisconnected = true;
                return;
              }

              // Processar cada parte
              for (let i = 0; i < partes.length; i++) {
                if (clientDisconnected) break;
                
                const parteAtual = i + 1;
                console.log(`📝 Processando parte ${parteAtual}/${partes.length}...`);

                // Enviar evento de início de parte
                const parteStartEvent = `data: ${JSON.stringify({ 
                  type: 'parte_start', 
                  parte: parteAtual,
                  totalPartes: partes.length 
                })}\n\n`;
                if (!safeEnqueue(controller, encoder, parteStartEvent)) {
                  clientDisconnected = true;
                  break;
                }

                try {
                  const textoParte = await processarParte(
                    apiKey,
                    partes[i],
                    manterTextos || ['(VETADO)', '(Revogado)', '(revogado)', 'Vetado', 'Revogado'],
                    parteAtual,
                    partes.length,
                    encoder,
                    controller,
                    undefined
                  );
                  
                  textoCompleto += (i > 0 ? '\n\n' : '') + textoParte;

                  // Enviar evento de fim de parte
                  const parteEndEvent = `data: ${JSON.stringify({ 
                    type: 'parte_end', 
                    parte: parteAtual,
                    totalPartes: partes.length,
                    caracteresProcessados: textoParte.length
                  })}\n\n`;
                  if (!safeEnqueue(controller, encoder, parteEndEvent)) {
                    clientDisconnected = true;
                    break;
                  }

                  console.log(`✅ Parte ${parteAtual} concluída: ${textoParte.length} caracteres`);
                } catch (parteError) {
                  if (parteError instanceof Error && parteError.message === 'Client disconnected') {
                    clientDisconnected = true;
                    console.log('📡 Cliente desconectou durante processamento');
                    break;
                  }
                  console.error(`❌ Erro na parte ${parteAtual}:`, parteError);
                  throw parteError;
                }
              }

              if (!clientDisconnected) {
                console.log(`✅ Todas as partes processadas. Total: ${textoCompleto.length} caracteres`);
                
                // Enviar evento final com texto completo
                const finalEvent = `data: ${JSON.stringify({ 
                  type: 'complete', 
                  texto: textoCompleto,
                  partesProcessadas: partes.length
                })}\n\n`;
                safeEnqueue(controller, encoder, finalEvent);
              }
              
              safeClose(controller);

            } catch (streamError) {
              console.error('Stream error:', streamError);
              const errorEvent = `data: ${JSON.stringify({ 
                type: 'error', 
                error: streamError instanceof Error ? streamError.message : 'Stream error' 
              })}\n\n`;
              safeEnqueue(controller, encoder, errorEvent);
              safeClose(controller);
            }
          }
        });

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });

      } catch (keyError) {
        console.error(`❌ Falha com chave ${keyIndex + 1}:`, keyError);
        lastError = keyError instanceof Error ? keyError : new Error('Erro desconhecido');
        
        // Se for rate limit, tentar próxima chave
        if (keyError instanceof Error && (keyError.message.includes('429') || keyError.message.includes('403'))) {
          continue;
        }
        throw keyError;
      }
    }

    // Todas as chaves falharam
    throw lastError || new Error('Todas as chaves Gemini falharam');

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
