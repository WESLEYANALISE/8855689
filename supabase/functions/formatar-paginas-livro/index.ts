import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com rotação
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

let currentKeyIndex = 0;

async function callGeminiWithFallback(prompt: string, maxRetries = 3): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    
    for (let keyAttempt = 0; keyAttempt < GEMINI_KEYS.length; keyAttempt++) {
      const keyIndex = (currentKeyIndex + keyAttempt) % GEMINI_KEYS.length;
      const apiKey = GEMINI_KEYS[keyIndex];
      
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          console.log(`[GEMINI] Tentando modelo ${model}, chave ${keyIndex + 1}, tentativa ${retry + 1}`);
          
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 200000,
                }
              }),
            }
          );

          if (response.status === 429 || response.status === 503) {
            console.log(`[GEMINI] Rate limit/indisponível, tentando próxima chave...`);
            await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
            break;
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GEMINI] Erro ${response.status}: ${errorText}`);
            continue;
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (text) {
            currentKeyIndex = keyIndex;
            return text;
          }
        } catch (error) {
          console.error(`[GEMINI] Erro na chamada:`, error);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }
  
  throw new Error('Todas as tentativas de API Gemini falharam');
}

// Mapeamento de temas visuais para títulos de capítulos jurídicos
function gerarPromptCapaTemático(capituloTitulo: string, livroTitulo: string): string {
  const tituloLower = capituloTitulo.toLowerCase();
  
  let temaVisual = '';
  let atmosfera = 'dramatic courtroom with classical architecture';
  
  if (tituloLower.includes('apresentação') || tituloLower.includes('introdução') || tituloLower.includes('prefácio')) {
    temaVisual = 'An ancient leather-bound book opening with golden light emanating from its pages, scales of justice visible in the warm glow, dusty law library atmosphere';
    atmosfera = 'warm golden light, scholarly atmosphere';
  } else if (tituloLower.includes('fatos') || tituloLower.includes('caso')) {
    temaVisual = 'Dark cave entrance with faint light from rescue lamps, silhouettes of rescuers approaching, dramatic shadows on rocky walls';
    atmosfera = 'suspenseful, dark with highlights of hope';
  } else if (tituloLower.includes('julgamento') || tituloLower.includes('tribunal') || tituloLower.includes('suprema corte')) {
    temaVisual = 'Majestic supreme court interior with marble columns, judges in robes seated at elevated bench, dramatic overhead lighting through dome';
    atmosfera = 'solemn, powerful, institutional grandeur';
  } else if (tituloLower.includes('voto') && tituloLower.includes('truepenny')) {
    temaVisual = 'Distinguished elderly judge at ornate wooden bench, quill pen in hand, heavy law books surrounding him, expression of measured wisdom';
    atmosfera = 'traditional, authoritative, contemplative';
  } else if (tituloLower.includes('voto') && tituloLower.includes('foster')) {
    temaVisual = 'Dynamic courtroom scene with passionate advocate gesturing emphatically, jury watching intently, scales of justice prominent';
    atmosfera = 'energetic, persuasive, enlightened';
  } else if (tituloLower.includes('voto') && tituloLower.includes('tatting')) {
    temaVisual = 'Judge in chamber wrestling with documents, conflicted expression, window showing stormy sky, classical statues of justice in background';
    atmosfera = 'internal conflict, philosophical struggle, moody';
  } else if (tituloLower.includes('voto') && tituloLower.includes('keen')) {
    temaVisual = 'Strict judge holding ancient law codex firmly, stern expression, stark lighting emphasizing rigid posture, legal texts surrounding';
    atmosfera = 'rigid, principled, uncompromising';
  } else if (tituloLower.includes('voto') && tituloLower.includes('handy')) {
    temaVisual = 'Modern-thinking judge looking through window at common people outside courthouse, human connection emphasized, softer lighting';
    atmosfera = 'pragmatic, humanistic, accessible';
  } else if (tituloLower.includes('conclusão') || tituloLower.includes('decisão') || tituloLower.includes('sentença')) {
    temaVisual = 'Gavel striking sound block with dramatic motion blur, scales of justice perfectly balanced, spotlight on the moment of decision';
    atmosfera = 'climactic, definitive, consequential';
  } else if (tituloLower.includes('pós-escrito') || tituloLower.includes('epílogo') || tituloLower.includes('posfácio')) {
    temaVisual = 'Empty courtroom at dusk, sunlight streaming through tall windows, dust motes floating, sense of aftermath and reflection';
    atmosfera = 'reflective, peaceful, contemplative';
  } else {
    temaVisual = `Scene representing "${capituloTitulo}" - classical legal setting with dramatic lighting, books of law, scales of justice`;
    atmosfera = 'professional, scholarly, legal atmosphere';
  }

  return `Create a photorealistic 16:9 cinematic image for the chapter "${capituloTitulo}" from the legal classic "${livroTitulo}".

SCENE DESCRIPTION:
${temaVisual}

ATMOSPHERE: ${atmosfera}

CRITICAL TECHNICAL REQUIREMENTS:
- Fill the ENTIRE 16:9 frame edge-to-edge with the scene
- ABSOLUTELY NO letterboxing, black bars, white bars, or borders of ANY kind
- The image must extend fully to ALL four edges
- NO text, NO titles, NO watermarks, NO captions
- Ultra high resolution, photorealistic quality
- Dramatic chiaroscuro lighting with rich shadows
- Professional cinematographic composition (rule of thirds)
- Depth of field with sharp focus on subject

The image should evoke the emotional and thematic essence of this chapter.`;
}

// Gerar capa de capítulo com Gemini 2.5 Flash Preview Image
async function gerarCapaCapitulo(capituloTitulo: string, livroTitulo: string, supabase: any): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[CAPA] LOVABLE_API_KEY não configurada, pulando geração de capa');
    return null;
  }

  try {
    const prompt = gerarPromptCapaTemático(capituloTitulo, livroTitulo);

    console.log(`[CAPA] Gerando capa para capítulo: ${capituloTitulo}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CAPA] Erro na API: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData || !imageData.startsWith('data:image')) {
      console.warn('[CAPA] Resposta sem imagem válida');
      return null;
    }

    // Converter base64 para Uint8Array e upload para Storage
    const base64Data = imageData.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `capa-${livroTitulo.replace(/[^a-zA-Z0-9]/g, '-')}-cap-${capituloTitulo.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('leitura-imagens')
      .upload(fileName, imageBytes, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[CAPA] Erro no upload:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('leitura-imagens')
      .getPublicUrl(fileName);

    console.log(`[CAPA] Capa gerada com sucesso: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[CAPA] Erro ao gerar capa:', error);
    return null;
  }
}

// Limpa texto OCR básico
function limparTextoOCR(texto: string): string {
  return texto
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\d+\s*$/gm, '')
    .replace(/\(N\.?\s*do\s*A\.?\)/gi, '')
    .replace(/\(N\.?\s*do\s*T\.?\)/gi, '')
    .replace(/ISBN[:\s]?[\d\-Xx\s]+/gi, '')
    .replace(/copyright.*?\n/gi, '')
    .replace(/©\s*\d{4}/g, '')
    .replace(/todos os direitos reservados/gi, '')
    .replace(/ficha catalográfica/gi, '')
    .replace(/catalogação na fonte/gi, '')
    .replace(/dados internacionais de catalogação/gi, '')
    .trim();
}

interface Capitulo {
  numero: number;
  titulo: string;
  paginaInicio: number;
  paginaFim: number;
  conteudo: string;
}

interface CapituloIndice {
  numero: number;
  titulo: string;
  pagina_inicio: number;
}

// Normaliza índice para corresponder às páginas OCR reais
function normalizarIndicePaginas(
  indiceCapitulos: CapituloIndice[],
  paginasOCR: Array<{ pagina: number }>
): CapituloIndice[] {
  if (indiceCapitulos.length === 0 || paginasOCR.length === 0) return indiceCapitulos;

  const primeiraOCR = Math.min(...paginasOCR.map(p => p.pagina));
  const menorPaginaIndice = Math.min(...indiceCapitulos.map(c => c.pagina_inicio));
  
  // Se o índice começa em 1 mas o OCR começa em 6, offset = 5
  const offset = primeiraOCR - menorPaginaIndice;
  
  if (offset === 0) {
    console.log('[NORMALIZAR] Índice já alinhado com páginas OCR');
    return indiceCapitulos;
  }
  
  console.log(`[NORMALIZAR] Aplicando offset de ${offset} páginas (OCR começa em ${primeiraOCR}, índice em ${menorPaginaIndice})`);
  
  return indiceCapitulos.map(cap => ({
    ...cap,
    pagina_inicio: cap.pagina_inicio + offset
  }));
}

function segmentarPorCapitulos(
  paginasOCR: Array<{ pagina: number; conteudo: string }>,
  indiceCapitulos: CapituloIndice[]
): Capitulo[] {
  const paginasOrdenadas = [...paginasOCR].sort((a, b) => a.pagina - b.pagina);
  
  // Normalizar índice antes de usar
  const indiceNormalizado = normalizarIndicePaginas(indiceCapitulos, paginasOrdenadas);
  const capitulosOrdenados = [...indiceNormalizado].sort((a, b) => a.pagina_inicio - b.pagina_inicio);
  
  console.log(`[SEGMENTAR] ${paginasOrdenadas.length} páginas, ${capitulosOrdenados.length} capítulos no índice`);
  
  if (capitulosOrdenados.length === 0) {
    const textoCompleto = paginasOrdenadas.map(p => p.conteudo).join('\n\n');
    return [{
      numero: 1,
      titulo: 'Conteúdo',
      paginaInicio: paginasOrdenadas[0]?.pagina || 1,
      paginaFim: paginasOrdenadas[paginasOrdenadas.length - 1]?.pagina || 1,
      conteudo: limparTextoOCR(textoCompleto)
    }];
  }
  
  const capitulos: Capitulo[] = [];
  
  for (let i = 0; i < capitulosOrdenados.length; i++) {
    const capAtual = capitulosOrdenados[i];
    const proxCap = capitulosOrdenados[i + 1];
    
    const paginaInicio = capAtual.pagina_inicio;
    const paginaFim = proxCap ? proxCap.pagina_inicio - 1 : paginasOrdenadas[paginasOrdenadas.length - 1].pagina;
    
    const paginasDoCapitulo = paginasOrdenadas.filter(
      p => p.pagina >= paginaInicio && p.pagina <= paginaFim
    );
    
    if (paginasDoCapitulo.length === 0) {
      console.log(`[SEGMENTAR] Cap ${capAtual.numero} sem páginas (${paginaInicio}-${paginaFim}), pulando...`);
      continue;
    }
    
    const conteudoCapitulo = paginasDoCapitulo.map(p => p.conteudo).join('\n\n');
    
    capitulos.push({
      numero: capAtual.numero,
      titulo: capAtual.titulo,
      paginaInicio,
      paginaFim,
      conteudo: limparTextoOCR(conteudoCapitulo)
    });
    
    console.log(`[SEGMENTAR] Cap ${capAtual.numero}: "${capAtual.titulo}" - págs ${paginaInicio}-${paginaFim} (${conteudoCapitulo.length} chars)`);
  }
  
  return capitulos;
}

function isTituloOuSubtitulo(linha: string): boolean {
  const linhaLimpa = linha.trim();
  if (!linhaLimpa) return false;
  
  if (/^#{1,4}\s+/.test(linhaLimpa)) return true;
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{10,}$/.test(linhaLimpa) && linhaLimpa.length < 100) return true;
  
  const padroesTitulo = [
    /^(capítulo|parte|seção|voto\s+de|conclusão|introdução|prefácio|apresentação|epílogo)/i,
    /^(o\s+julgamento|os\s+fatos|a\s+decisão|o\s+caso|a\s+sentença)/i,
    /^[IVXLC]+\s*[-–—.]\s*/,
    /^\d+\s*[-–—.]\s+[A-ZÁÉÍÓÚ]/,
  ];
  
  return padroesTitulo.some(p => p.test(linhaLimpa));
}

function dividirEmPaginasVirtuais(texto: string, charsPerPage = 2000): string[] {
  const paginas: string[] = [];
  let textoRestante = texto.trim();
  
  while (textoRestante.length > 0) {
    if (textoRestante.length <= charsPerPage) {
      paginas.push(textoRestante);
      break;
    }
    
    let corte = textoRestante.lastIndexOf('\n\n', charsPerPage);
    
    if (corte < charsPerPage * 0.5) {
      const pontos = [
        textoRestante.lastIndexOf('. ', charsPerPage),
        textoRestante.lastIndexOf('! ', charsPerPage),
        textoRestante.lastIndexOf('? ', charsPerPage),
      ];
      corte = Math.max(...pontos);
    }
    
    if (corte < charsPerPage * 0.5) {
      corte = textoRestante.lastIndexOf(' ', charsPerPage);
    }
    
    if (corte <= 0) corte = charsPerPage;
    
    let paginaAtual = textoRestante.substring(0, corte + 1).trim();
    const linhasDaPagina = paginaAtual.split('\n');
    
    const ultimasLinhas = linhasDaPagina.filter(l => l.trim()).slice(-3);
    
    for (let i = ultimasLinhas.length - 1; i >= 0; i--) {
      const linha = ultimasLinhas[i];
      if (isTituloOuSubtitulo(linha)) {
        const indiceTitulo = paginaAtual.lastIndexOf(linha);
        if (indiceTitulo > charsPerPage * 0.4) {
          let novoCorte = indiceTitulo;
          while (novoCorte > 0 && paginaAtual[novoCorte - 1] !== '\n') {
            novoCorte--;
          }
          if (novoCorte > 2 && paginaAtual.substring(novoCorte - 2, novoCorte) === '\n\n') {
            novoCorte -= 2;
          } else if (novoCorte > 1 && paginaAtual[novoCorte - 1] === '\n') {
            novoCorte -= 1;
          }
          
          if (novoCorte > charsPerPage * 0.4) {
            corte = novoCorte;
            paginaAtual = textoRestante.substring(0, corte).trim();
            console.log(`[PAGINAÇÃO] Movendo título órfão para próxima página: "${linha.substring(0, 50)}..."`);
          }
        }
        break;
      }
    }
    
    paginas.push(paginaAtual);
    textoRestante = textoRestante.substring(corte).trim();
  }
  
  return paginas;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const livroTitulo = body.livroTitulo || body.tituloLivro;
    
    if (!livroTitulo) {
      return new Response(
        JSON.stringify({ error: 'livroTitulo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`\n========================================`);
    console.log(`[FORMATAÇÃO] Iniciando para: ${livroTitulo}`);
    console.log(`[MODO] Salvando CAPÍTULO A CAPÍTULO com geração de capas`);
    console.log(`========================================\n`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // =============================================
    // FASE 1: VERIFICAR CAPÍTULOS JÁ FORMATADOS
    // =============================================
    console.log(`[FASE 1] Verificando capítulos já formatados...`);
    
    const { data: capitulosExistentes } = await supabase
      .from('leitura_paginas_formatadas')
      .select('numero_capitulo')
      .ilike('livro_titulo', `%${livroTitulo}%`)
      .not('numero_capitulo', 'is', null)
      .order('numero_capitulo', { ascending: true });
    
    const capitulosJaFormatados = new Set(
      capitulosExistentes?.map(c => c.numero_capitulo).filter(Boolean) || []
    );
    
    console.log(`[FASE 1] Capítulos já formatados: ${Array.from(capitulosJaFormatados).join(', ') || 'nenhum'}`);

    // =============================================
    // FASE 2: BUSCAR TODO O TEXTO OCR DO LIVRO
    // =============================================
    console.log(`[FASE 2] Buscando páginas OCR...`);
    
    const { data: paginasOCR, error: errorOCR } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('*')
      .ilike('Titulo da Obra', `%${livroTitulo}%`)
      .order('Pagina', { ascending: true });

    if (errorOCR || !paginasOCR?.length) {
      console.error(`[ERRO] Sem páginas OCR:`, errorOCR);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhuma página OCR encontrada. Faça o upload do PDF primeiro.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANTE: Incluir TODAS as páginas sem filtro de caracteres
    // Páginas editoriais/vazias serão tratadas na exibição
    const paginasFormatadas = paginasOCR.map((p: Record<string, unknown>) => ({
      pagina: (p['Pagina'] as number) || 0,
      conteudo: (p['Conteúdo'] as string) || ''
    })).filter(p => p.conteudo.trim().length > 0); // Incluir todas as páginas com qualquer conteúdo

    const totalCharsOCR = paginasFormatadas.reduce((sum, p) => sum + p.conteudo.length, 0);
    console.log(`[FASE 2] ${paginasFormatadas.length} páginas OCR (${totalCharsOCR} chars)`);

    // =============================================
    // FASE 3: BUSCAR ÍNDICE DE CAPÍTULOS
    // =============================================
    console.log(`[FASE 3] Buscando índice de capítulos...`);
    
    const { data: indiceData } = await supabase
      .from('leitura_livros_indice')
      .select('indice_capitulos')
      .ilike('livro_titulo', `%${livroTitulo}%`)
      .single();

    let indiceCapitulos: CapituloIndice[] = [];
    
    if (indiceData?.indice_capitulos && Array.isArray(indiceData.indice_capitulos)) {
      indiceCapitulos = (indiceData.indice_capitulos as Array<{ numero: number; titulo: string; pagina_inicio: number }>)
        .filter(c => c.pagina_inicio && c.pagina_inicio > 0)
        .map(c => ({
          numero: c.numero || 1,
          titulo: c.titulo || `Capítulo ${c.numero}`,
          pagina_inicio: c.pagina_inicio
        }));
    }

    console.log(`[FASE 3] ${indiceCapitulos.length} capítulos no índice`);

    // =============================================
    // FASE 4: SEGMENTAR TEXTO POR CAPÍTULOS
    // =============================================
    console.log(`[FASE 4] Segmentando texto por capítulos...`);
    
    const capitulos = segmentarPorCapitulos(paginasFormatadas, indiceCapitulos);
    const totalCapitulos = capitulos.length;

    console.log(`[FASE 4] ${totalCapitulos} capítulos a processar`);

    // Filtrar capítulos pendentes
    const capitulosPendentes = capitulos.filter(c => !capitulosJaFormatados.has(c.numero));
    
    if (capitulosPendentes.length === 0 && capitulosJaFormatados.size > 0) {
      console.log(`[FASE 4] Todos os ${totalCapitulos} capítulos já formatados!`);
      
      const { count } = await supabase
        .from('leitura_paginas_formatadas')
        .select('*', { count: 'exact', head: true })
        .ilike('livro_titulo', `%${livroTitulo}%`);
      
      return new Response(
        JSON.stringify({
          success: true,
          totalPaginas: count || 0,
          totalCapitulos,
          message: 'Livro já formatado anteriormente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FASE 4] ${capitulosPendentes.length} capítulos pendentes de formatação`);

    // =============================================
    // FASE 5: FORMATAR E SALVAR CAPÍTULO A CAPÍTULO
    // =============================================
    console.log(`\n[FASE 5] Formatando capítulos e salvando individualmente...`);
    
    // Buscar maior página já existente para continuar numeração
    const { data: ultimaPagina } = await supabase
      .from('leitura_paginas_formatadas')
      .select('numero_pagina')
      .ilike('livro_titulo', `%${livroTitulo}%`)
      .order('numero_pagina', { ascending: false })
      .limit(1);
    
    let paginaGlobal = (ultimaPagina?.[0]?.numero_pagina || 0) + 1;
    let totalCharsFormatados = 0;
    let capitulosProcessados = 0;

    for (const capitulo of capitulosPendentes) {
      console.log(`\n------------------------------------------`);
      console.log(`[FORMATANDO] Capítulo ${capitulo.numero}/${totalCapitulos}: ${capitulo.titulo}`);
      console.log(`[FORMATANDO] Tamanho entrada: ${capitulo.conteudo.length} chars`);
      
      const promptCapitulo = `FORMATE ESTE CAPÍTULO COMPLETO PARA LEITURA EM DISPOSITIVO MÓVEL.

CAPÍTULO ${capitulo.numero}: ${capitulo.titulo}

⚠️ REGRAS ABSOLUTAS:

1. NÃO RESUMA - mantenha 100% do conteúdo original
2. NÃO CORTE - o texto de saída DEVE ter tamanho IGUAL ou MAIOR que a entrada
3. NÃO OMITA nenhum parágrafo, frase ou argumento
4. A SAÍDA DEVE TER APROXIMADAMENTE ${capitulo.conteudo.length} CARACTERES

FORMATAÇÃO OBRIGATÓRIA (Markdown PURO, sem misturar):
- Para seções/subtítulos importantes: ## Nome da Seção (SEM negrito ao redor!)
- Para sub-seções menores: ### Nome da Sub-seção (SEM negrito ao redor!)
- NUNCA misture ## com ** (ERRADO: **## Título**, CORRETO: ## Título)
- Use > para citações diretas, diálogos e transcrições legais
- Use **nome** APENAS para destacar nomes próprios de pessoas
- Use *termo* (itálico) para expressões latinas e termos técnicos
- Corrija palavras quebradas/hifenizadas por OCR

REMOVA COMPLETAMENTE:
- ISBN, copyright, ficha catalográfica
- Créditos de editora, tradutor, revisor
- Notas "(N. do A.)", "(N. do T.)"

NÃO INCLUA NO INÍCIO:
- O título do capítulo (será adicionado automaticamente)
- Números de página
- Marcadores [INICIO_CAPITULO] ou similares

TEXTO DO CAPÍTULO PARA FORMATAR:

${capitulo.conteudo}

TEXTO FORMATADO COMPLETO (sem prefixos, só o conteúdo formatado):`;

      let textoFinal: string;
      
      try {
        const textoFormatado = await callGeminiWithFallback(promptCapitulo);
        
        // Limpeza agressiva de problemas comuns de formatação
        let textoLimpo = textoFormatado
          .replace(/^```[\s\S]*?\n/gm, '')
          .replace(/```$/gm, '')
          .replace(/^TEXTO FORMATADO.*?:/gim, '')
          // FIX: Corrigir **## e **### que não devem existir
          .replace(/\*\*\s*(#{2,3})\s*/g, '$1 ')
          .replace(/(#{2,3})\s*\*\*/g, '$1 ')
          // FIX: Remover ** extras ao redor de headings
          .replace(/\*\*(#{2,3}[^*\n]+)\*\*/g, '$1')
          // Normalizar headings mal formatados
          .replace(/^##\s+\*\*([^*]+)\*\*$/gm, '## $1')
          .replace(/^###\s+\*\*([^*]+)\*\*$/gm, '### $1')
          .trim();
        
        const tamanhoOriginal = capitulo.conteudo.length;
        const tamanhoFormatado = textoLimpo.length;
        const percentual = (tamanhoFormatado / tamanhoOriginal) * 100;
        
        console.log(`[VERIFICAÇÃO] Original: ${tamanhoOriginal} | Formatado: ${tamanhoFormatado} | ${percentual.toFixed(1)}%`);
        
        if (percentual < 85) {
          console.warn(`[ALERTA] Perda de conteúdo! Usando texto original limpo.`);
          textoFinal = capitulo.conteudo;
        } else {
          console.log(`[OK] Conteúdo preservado adequadamente`);
          textoFinal = textoLimpo;
        }
      } catch (error) {
        console.error(`[ERRO] Falha na formatação:`, error);
        textoFinal = capitulo.conteudo;
      }

      // Dividir em páginas virtuais
      const paginasVirtuais = dividirEmPaginasVirtuais(textoFinal, 2000);
      
      console.log(`[OK] Capítulo dividido em ${paginasVirtuais.length} páginas virtuais`);

      // Gerar capa do capítulo ANTES de salvar
      console.log(`[CAPA] Gerando capa para capítulo ${capitulo.numero}...`);
      const urlCapa = await gerarCapaCapitulo(capitulo.titulo, livroTitulo, supabase);
      
      if (urlCapa) {
        console.log(`[CAPA] ✓ Capa gerada com sucesso`);
      } else {
        console.log(`[CAPA] ⚠ Não foi possível gerar capa`);
      }

      // Preparar páginas para inserção
      const paginasParaInserir = paginasVirtuais.map((conteudo, idx) => ({
        livro_titulo: livroTitulo,
        numero_pagina: paginaGlobal + idx,
        html_formatado: conteudo,
        is_chapter_start: idx === 0,
        capitulo_titulo: idx === 0 ? capitulo.titulo : null,
        numero_capitulo: idx === 0 ? capitulo.numero : null,
        url_capa_capitulo: idx === 0 ? urlCapa : null
      }));

      // SALVAR IMEDIATAMENTE NO BANCO
      const { error: insertError } = await supabase
        .from('leitura_paginas_formatadas')
        .insert(paginasParaInserir);
      
      if (insertError) {
        console.error(`[ERRO] Falha ao salvar capítulo ${capitulo.numero}:`, insertError);
      } else {
        console.log(`[SALVO] Capítulo ${capitulo.numero} salvo: ${paginasParaInserir.length} páginas (págs ${paginaGlobal}-${paginaGlobal + paginasVirtuais.length - 1})`);
        capitulosProcessados++;
        totalCharsFormatados += textoFinal.length;
      }

      paginaGlobal += paginasVirtuais.length;

      // Pequena pausa entre capítulos
      await new Promise(r => setTimeout(r, 500));
    }

    // =============================================
    // FASE 6: REVISÃO FINAL
    // =============================================
    console.log(`\n[FASE 6] Revisão final...`);
    
    const { count: totalPaginasFinal } = await supabase
      .from('leitura_paginas_formatadas')
      .select('*', { count: 'exact', head: true })
      .ilike('livro_titulo', `%${livroTitulo}%`);

    const { count: totalCapitulosFinal } = await supabase
      .from('leitura_paginas_formatadas')
      .select('*', { count: 'exact', head: true })
      .ilike('livro_titulo', `%${livroTitulo}%`)
      .eq('is_chapter_start', true);

    const taxaPreservacao = totalCharsOCR > 0 
      ? ((totalCharsFormatados / totalCharsOCR) * 100).toFixed(1)
      : '100';
    
    console.log(`\n========================================`);
    console.log(`[CONCLUÍDO] Formatação finalizada para "${livroTitulo}"`);
    console.log(`  - ${capitulosProcessados} capítulos processados nesta execução`);
    console.log(`  - ${totalCapitulosFinal} capítulos total no livro`);
    console.log(`  - ${totalPaginasFinal} páginas criadas`);
    console.log(`  - ${totalCharsOCR} chars entrada → ${totalCharsFormatados} chars saída`);
    console.log(`  - Taxa de preservação: ${taxaPreservacao}%`);
    console.log(`========================================\n`);

    return new Response(
      JSON.stringify({
        success: true,
        totalPaginas: totalPaginasFinal || 0,
        totalCapitulos: totalCapitulosFinal || 0,
        capitulosProcessadosAgora: capitulosProcessados,
        charsEntrada: totalCharsOCR,
        charsSaida: totalCharsFormatados,
        taxaPreservacao: taxaPreservacao + '%'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ERRO GERAL]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
