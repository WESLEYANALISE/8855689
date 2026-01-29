import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG error: ${shrinkResponse.status}`);
  }

  const result = await shrinkResponse.json();
  const outputUrl = result.output?.url;
  if (!outputUrl) throw new Error('TinyPNG não retornou URL');

  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } }),
  });

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(outputUrl);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] WebP: ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Contexto visual específico por área de direito - O QUE ILUSTRAR
const contextoVisualPorArea: Record<string, string> = {
  'Direito Penal': 'prisão, grades, algemas, cela, criminosos, polícia, delegacia, crime, violência urbana, investigação criminal, armas, drogas, assaltos, sangue, escuridão, perigo',
  'Direito Civil': 'família feliz, casamento, casa, lar, filhos, propriedade, herança, testamento, contratos, acordos comerciais, imóveis, compra e venda, vizinhos, vida cotidiana',
  'Direito Constitucional': 'bandeira do Brasil, Congresso Nacional, Brasília, política, votação, democracia, direitos fundamentais, liberdade, igualdade, cidadania, povo brasileiro',
  'Direito Tributário': 'dinheiro, moedas, impostos, notas fiscais, calculadora, contador, cofre, banco, economia, tributos, arrecadação, receita federal, leão',
  'Direito do Trabalho': 'trabalhadores, operários, fábrica, escritório, empregados, patrão, carteira de trabalho, salário, férias, sindicato, greve, uniforme de trabalho',
  'Direito Trabalhista': 'trabalhadores, operários, fábrica, escritório, empregados, patrão, carteira de trabalho, salário, férias, sindicato, greve, uniforme de trabalho',
  'Direito Administrativo': 'prédios públicos, governo, servidores públicos, burocracia, documentos oficiais, carimbos, prefeitura, repartição pública, funcionários públicos',
  'Direito Empresarial': 'empresários, executivos, corporações, escritório moderno, reuniões, negócios, startups, investimentos, bolsa de valores, contratos comerciais',
  'Direito Processual Civil': 'tribunal, audiência, processo judicial, advogados debatendo, petições, recursos, sentenças, documentos judiciais',
  'Direito Processual Penal': 'tribunal do júri, réu, acusado, promotor, defesa criminal, julgamento, prisão preventiva, audiência criminal',
  'Direito Ambiental': 'natureza, floresta, rios, animais, preservação ambiental, desmatamento, poluição, reciclagem, sustentabilidade, Amazônia, fauna e flora',
  'Direito Internacional': 'bandeiras de países, ONU, diplomacia, tratados internacionais, globalização, fronteiras, passaporte, embaixadas, acordos internacionais',
  'Direito Eleitoral': 'urna eletrônica, voto, eleições, candidatos, campanha política, comício, propaganda eleitoral, partidos políticos, democracia',
  'Direito Previdenciário': 'idosos, aposentados, avós, terceira idade, cadeira de rodas, hospital, INSS, benefícios, pensão, invalidez, morte, doença',
  'Direito Digital': 'computadores, internet, hackers, cybersecurity, dados digitais, privacidade online, redes sociais, tecnologia, inteligência artificial',
  'Filosofia do Direito': 'pensadores, filósofos gregos, estátuas clássicas, livros antigos, reflexão, sabedoria, justiça abstrata, ética, moralidade',
  'Ética': 'balança moral, decisões difíceis, dilemas éticos, consciência, honestidade, integridade, valores humanos',
  'default': 'livros jurídicos, biblioteca, estudo, conhecimento, educação, aprendizado'
};

// Paleta de cores por área de direito
const paletasPorArea: Record<string, { descricao: string }> = {
  'Direito Penal': { descricao: 'deep crimson red, dark shadows, golden accents' },
  'Direito Civil': { descricao: 'navy blue, clean white, silver tones' },
  'Direito Constitucional': { descricao: 'deep green, golden yellow, patriotic blue' },
  'Direito Tributário': { descricao: 'forest green, gold, bronze money tones' },
  'Direito do Trabalho': { descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Trabalhista': { descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Administrativo': { descricao: 'royal purple, institutional gray, white' },
  'Direito Empresarial': { descricao: 'corporate blue, gold, charcoal' },
  'Direito Processual Civil': { descricao: 'steel blue, white, silver' },
  'Direito Processual Penal': { descricao: 'burgundy red, dark gray, black' },
  'Direito Ambiental': { descricao: 'forest green, earth brown, sky blue, natural tones' },
  'Direito Internacional': { descricao: 'royal blue, white, gold diplomatic' },
  'Direito Eleitoral': { descricao: 'patriotic blue, red, white' },
  'Direito Previdenciário': { descricao: 'warm orange, cream, brown' },
  'Direito Digital': { descricao: 'electric cyan, deep purple, neon blue' },
  'Filosofia do Direito': { descricao: 'deep indigo, gold, cream' },
  'Ética': { descricao: 'deep purple, gold, white' },
  'Outros': { descricao: 'navy blue, gold, white' },
  'default': { descricao: 'navy blue, gold, white' }
};

// Função para obter todas as chaves Gemini disponíveis
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const premiumKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (premiumKey) keys.push(premiumKey);
  
  return keys;
}

// Chamar Gemini com fallback entre múltiplas chaves
async function chamarGeminiComFallback(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Gemini] Tentando chave ${i + 1}/${keys.length}...`);
      
      const contents = systemPrompt 
        ? [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }
          ]
        : [
            { role: 'user', parts: [{ text: prompt }] }
          ];
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini] Erro na chave ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[Gemini] Sucesso com chave ${i + 1}`);
        return text;
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini] Erro na chave ${i + 1}:`, lastError.message);
    }
  }
  
  throw lastError || new Error('Todas as chaves Gemini falharam');
}

// Gerar imagem com Gemini usando fallback entre chaves
async function gerarImagemComGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Gemini Imagem] Tentando chave ${i + 1}/${keys.length}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: prompt }] 
            }],
            generationConfig: {
              responseModalities: ['image', 'text'],
              responseMimeType: 'text/plain'
            }
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini Imagem] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Imagem] Erro na chave ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      
      // Procurar pela parte com imagem inline
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[Gemini Imagem] Sucesso com chave ${i + 1}`);
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      console.log(`[Gemini Imagem] Chave ${i + 1} não retornou imagem, tentando próxima...`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini Imagem] Erro na chave ${i + 1}:`, lastError.message);
    }
  }
  
  throw lastError || new Error('Todas as chaves Gemini falharam para geração de imagem');
}

/**
 * ETAPA 1: Usa Gemini texto para analisar o livro e gerar uma descrição visual detalhada
 */
async function gerarDescricaoVisualComIA(
  tema: string, 
  area: string, 
  sobre: string
): Promise<string> {
  const paleta = paletasPorArea[area] || paletasPorArea['default'];
  const contextoArea = contextoVisualPorArea[area] || contextoVisualPorArea['default'];
  
  const systemPrompt = `Você é um fotógrafo e diretor de arte especialista em criar capas de livros com IMAGENS REALISTAS e IMPACTANTES.

Sua tarefa: Criar uma DESCRIÇÃO VISUAL REALISTA para a capa de um livro jurídico.

CONTEXTO DA ÁREA "${area}":
Elementos visuais típicos desta área: ${contextoArea}

REGRAS FUNDAMENTAIS:
1. A imagem deve ser REALISTA (fotografia ou ilustração hiper-realista)
2. Deve representar o TÍTULO DO LIVRO de forma visual e literal
3. Use elementos visuais concretos que representem o tema
4. Se não puder representar literalmente, use ELEMENTOS SIMBÓLICOS REALISTAS
5. NUNCA inclua texto, letras, palavras ou números na descrição

EXEMPLOS DE DESCRIÇÕES REALISTAS:
- "Aposentadoria" → Casal idoso sorridente sentado em sofá aconchegante, luz natural da janela, ambiente doméstico acolhedor
- "Crimes contra a Vida" → Fita amarela de cena de crime, luzes vermelhas e azuis de viatura policial ao fundo, atmosfera noturna
- "Contratos" → Duas mãos apertando em acordo, foco nas mãos com fundo desfocado de escritório moderno
- "Férias" → Trabalhador com uniforme removido, cenário de praia ao pôr do sol, sensação de liberdade
- "Proteção Ambiental" → Floresta tropical exuberante com raios de sol atravessando as árvores, rio cristalino

PALETA DE CORES: ${paleta.descricao}

Responda APENAS com a descrição visual em inglês, máximo 150 palavras. Seja ESPECÍFICO, VISUAL e REALISTA.`;

  const userPrompt = `ÁREA DE DIREITO: ${area}
TÍTULO DO LIVRO: "${tema}"
DESCRIÇÃO DO LIVRO: ${sobre || 'Livro educacional sobre este tema jurídico'}

Crie uma descrição visual REALISTA que:
1. Ilustre o título "${tema}" com elementos visuais concretos e realistas
2. Use elementos típicos de ${area} (${contextoArea.split(',').slice(0, 3).join(', ')})
3. Se não for possível representar literalmente, use símbolos ou elementos que remetem ao tema
4. NUNCA mencione texto, letras ou palavras na imagem`;

  console.log(`[IA Texto] Gerando descrição visual realista para: ${tema} (${area})`);

  const descricao = await chamarGeminiComFallback(userPrompt, systemPrompt);

  console.log(`[IA Texto] Descrição gerada: ${descricao.substring(0, 100)}...`);
  return descricao;
}

/**
 * ETAPA 2: Usa a descrição visual gerada para criar o prompt final de imagem
 */
function criarPromptImagemFinal(descricaoVisual: string, area: string, tema: string): string {
  const paleta = paletasPorArea[area] || paletasPorArea['default'];
  const contextoArea = contextoVisualPorArea[area] || contextoVisualPorArea['default'];
  
  return `CRITICAL: NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO TYPOGRAPHY IN THE IMAGE. THIS IS A STRICT REQUIREMENT.

Create a REALISTIC, high-quality photograph or photorealistic illustration for a book cover about "${tema}" in the context of "${area}".

AREA CONTEXT (use these elements): ${contextoArea}

ART STYLE - MUST FOLLOW:
- REALISTIC photography or photorealistic digital art
- Professional stock photo quality
- Natural lighting and authentic atmosphere
- High detail and sharp focus on main subject
- Cinematic composition with depth of field
- Emotional and impactful imagery

VISUAL DESCRIPTION:
${descricaoVisual}

COLOR PALETTE: ${paleta.descricao}

TECHNICAL REQUIREMENTS:
- Vertical 9:16 aspect ratio (book cover format)
- Ultra high resolution quality
- Professional editorial photography style
- Rich colors and excellent contrast

ABSOLUTELY FORBIDDEN:
- Any text, letters, numbers, or typography
- Watermarks or logos
- Generic courthouse or gavel imagery (unless specifically about courts)
- Cartoonish or illustrated style (must be realistic)
- Artificial or stock-looking poses

The image must be a REALISTIC representation of "${tema}" - either a direct photographic representation or symbolic elements that clearly evoke the theme.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroId, area } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se recebeu livroId, gerar apenas para esse livro
    if (livroId) {
      const { data: livro, error: fetchError } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Tema, "Área", Sobre, "Capa-livro", url_capa_gerada')
        .eq('id', livroId)
        .single();

      if (fetchError || !livro) {
        throw new Error(`Livro não encontrado: ${livroId}`);
      }

      // Se já tem capa, retornar sucesso sem gerar
      if (livro['Capa-livro'] || livro.url_capa_gerada) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Capa já existe',
            livroId: livro.id,
            capaUrl: livro.url_capa_gerada || livro['Capa-livro']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Gerando capa para: ${livro.Tema} (ID: ${livro.id})`);

      // ETAPA 1: Gerar descrição visual
      const descricaoVisual = await gerarDescricaoVisualComIA(
        livro.Tema || 'Direito',
        livro['Área'] || 'Outros',
        livro.Sobre || ''
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      // ETAPA 2: Gerar imagem usando Gemini direto com fallback
      const promptImagem = criarPromptImagemFinal(descricaoVisual, livro['Área'] || 'Outros', livro.Tema || 'Direito');

      const imageBase64 = await gerarImagemComGemini(promptImagem);

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const originalBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Comprimir e converter para WebP
      let finalBuffer: Uint8Array = originalBuffer;
      if (TINYPNG_API_KEY) {
        try {
          finalBuffer = await comprimirParaWebP(originalBuffer, TINYPNG_API_KEY);
        } catch {
          finalBuffer = originalBuffer;
        }
      }

      // Upload como WebP
      const fileName = `biblioteca-estudos/${livro.id}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('CAPAS')
        .upload(fileName, finalBuffer, { contentType: 'image/webp', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('CAPAS').getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;

      // Atualizar registro
      await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .update({ 'Capa-livro': publicUrl, 'url_capa_gerada': publicUrl })
        .eq('id', livro.id);

      console.log(`✅ Capa gerada: ${livro.Tema}`);

      return new Response(
        JSON.stringify({
          success: true,
          livroId: livro.id,
          tema: livro.Tema,
          capaUrl: publicUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se recebeu área, retornar lista de livros sem capa nessa área
    if (area) {
      const { data: livros, error } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Tema, "Área", "Capa-livro", url_capa_gerada')
        .eq('Área', area)
        .order('Ordem', { ascending: true });

      if (error) throw error;

      const semCapa = livros?.filter(l => !l['Capa-livro'] && !l.url_capa_gerada) || [];
      const total = livros?.length || 0;

      return new Response(
        JSON.stringify({
          area,
          total,
          semCapa: semCapa.length,
          livrosSemCapa: semCapa.map(l => ({ id: l.id, tema: l.Tema }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Parâmetro livroId ou area é obrigatório');

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
