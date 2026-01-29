import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

interface Cena {
  ordem: number;
  titulo: string;
  texto_narrado: string;
  url_audio?: string;
  imagem_url: string;
  imagem_descricao: string;
  duracao?: number;
}

interface ImagemDisponivel {
  url: string;
  descricao: string;
  fonte: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { ministro_nome, forcar_regenerar = false } = await req.json();

    if (!ministro_nome) {
      return new Response(
        JSON.stringify({ error: 'Nome do ministro é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📽️ Gerando documentário para: ${ministro_nome}`);

    // Verificar se já existe no cache
    if (!forcar_regenerar) {
      const { data: cached } = await supabase
        .from('documentarios_ministros')
        .select('*')
        .eq('ministro_nome', ministro_nome)
        .eq('status', 'pronto')
        .single();

      if (cached && cached.cenas && Array.isArray(cached.cenas) && cached.cenas.length > 0) {
        console.log('✅ Documentário encontrado no cache');
        return new Response(
          JSON.stringify({ success: true, documentario: cached }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Marcar como gerando
    await supabase.from('documentarios_ministros').upsert({
      ministro_nome,
      status: 'gerando',
      updated_at: new Date().toISOString()
    });

    // 1. BUSCAR WIKIPEDIA - Biografia completa
    console.log('📖 Buscando biografia na Wikipedia...');
    const wikiData = await buscarWikipedia(ministro_nome);
    
    if (!wikiData.conteudo) {
      throw new Error('Não foi possível encontrar informações sobre o ministro');
    }

    // 2. BUSCAR IMAGENS - Wikipedia + Wikimedia Commons
    console.log('🖼️ Buscando imagens...');
    const imagensDisponiveis = await buscarImagens(ministro_nome, wikiData.imagens || []);
    console.log(`Encontradas ${imagensDisponiveis.length} imagens`);

    // 3. SEGMENTAR COM IA - Dividir em cenas narrativas
    console.log('🤖 Segmentando biografia em cenas...');
    const cenas = await segmentarComIA(ministro_nome, wikiData.conteudo, imagensDisponiveis);
    console.log(`Criadas ${cenas.length} cenas`);

    // 4. GERAR ÁUDIOS - Para cada cena
    console.log('🎙️ Gerando áudios para cada cena...');
    const cenasComAudio = await gerarAudiosParaCenas(cenas, supabaseUrl, supabaseKey);

    // 5. SALVAR NO BANCO
    const duracaoTotal = cenasComAudio.reduce((acc, c) => acc + (c.duracao || 30), 0);
    
    await supabase.from('documentarios_ministros').upsert({
      ministro_nome,
      texto_completo: wikiData.conteudo,
      cenas: cenasComAudio,
      imagens_disponiveis: imagensDisponiveis,
      duracao_total: duracaoTotal,
      status: 'pronto',
      updated_at: new Date().toISOString()
    });

    console.log('✅ Documentário gerado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        documentario: {
          ministro_nome,
          cenas: cenasComAudio,
          duracao_total: duracaoTotal,
          imagens_disponiveis: imagensDisponiveis
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao gerar documentário:', error);
    
    // Atualizar status para erro
    try {
      const { ministro_nome } = await req.json().catch(() => ({}));
      if (ministro_nome) {
        await supabase.from('documentarios_ministros').upsert({
          ministro_nome,
          status: 'erro',
          erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {}
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar documentário' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Buscar biografia completa da Wikipedia
async function buscarWikipedia(nome: string): Promise<{ conteudo: string; imagens: string[] }> {
  // Buscar artigo
  const articleUrl = `https://pt.wikipedia.org/w/api.php?` +
    `action=query&titles=${encodeURIComponent(nome)}` +
    `&prop=extracts|pageimages|images` +
    `&format=json&utf8=1` +
    `&explaintext=1` +
    `&piprop=original&pithumbsize=800` +
    `&imlimit=20&redirects=1`;

  const response = await fetch(articleUrl);
  const data = await response.json();
  
  const pages = data.query?.pages;
  const pageId = Object.keys(pages || {})[0];
  
  if (!pageId || pageId === '-1') {
    // Tentar buscar
    const searchUrl = `https://pt.wikipedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(nome + ' ministro STF')}` +
      `&format=json&utf8=1&srlimit=1`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.query?.search?.[0]) {
      const titulo = searchData.query.search[0].title;
      return buscarWikipedia(titulo);
    }
    
    throw new Error('Artigo não encontrado na Wikipedia');
  }

  const page = pages[pageId];
  const imagens: string[] = [];
  
  // Imagem principal
  if (page.original?.source) {
    imagens.push(page.original.source);
  }
  
  // Buscar URLs das outras imagens
  if (page.images) {
    for (const img of page.images.slice(0, 15)) {
      if (img.title && !img.title.includes('Commons-logo') && !img.title.includes('Symbol') && !img.title.includes('Icon')) {
        try {
          const imgUrl = `https://pt.wikipedia.org/w/api.php?` +
            `action=query&titles=${encodeURIComponent(img.title)}` +
            `&prop=imageinfo&iiprop=url&format=json`;
          
          const imgRes = await fetch(imgUrl);
          const imgData = await imgRes.json();
          const imgPage = Object.values(imgData.query?.pages || {})[0] as any;
          
          if (imgPage?.imageinfo?.[0]?.url) {
            const url = imgPage.imageinfo[0].url;
            // Filtrar apenas fotos (não SVGs, logos, etc)
            if (url.match(/\.(jpg|jpeg|png|webp)$/i) && !url.includes('logo') && !url.includes('symbol')) {
              imagens.push(url);
            }
          }
        } catch (e) {}
      }
    }
  }

  return {
    conteudo: page.extract || '',
    imagens
  };
}

// Buscar imagens no Wikimedia Commons
async function buscarImagens(nome: string, imagensWikipedia: string[]): Promise<ImagemDisponivel[]> {
  const imagens: ImagemDisponivel[] = [];
  
  // Adicionar imagens da Wikipedia
  for (const url of imagensWikipedia) {
    imagens.push({
      url,
      descricao: `Imagem de ${nome}`,
      fonte: 'wikipedia'
    });
  }
  
  // Buscar no Wikimedia Commons
  const keywords = [nome, `${nome} STF`, `${nome} ministro`, 'Supremo Tribunal Federal'];
  
  for (const keyword of keywords.slice(0, 2)) {
    try {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(keyword)}` +
        `&srnamespace=6&format=json&utf8=1&srlimit=10`;
      
      const res = await fetch(commonsUrl);
      const data = await res.json();
      
      for (const result of data.query?.search || []) {
        const title = result.title;
        
        // Buscar URL da imagem
        const infoUrl = `https://commons.wikimedia.org/w/api.php?` +
          `action=query&titles=${encodeURIComponent(title)}` +
          `&prop=imageinfo&iiprop=url|extmetadata&format=json`;
        
        try {
          const infoRes = await fetch(infoUrl);
          const infoData = await infoRes.json();
          const infoPage = Object.values(infoData.query?.pages || {})[0] as any;
          
          if (infoPage?.imageinfo?.[0]?.url) {
            const url = infoPage.imageinfo[0].url;
            const meta = infoPage.imageinfo[0].extmetadata;
            const desc = meta?.ImageDescription?.value || title.replace('File:', '');
            
            // Filtrar apenas fotos reais
            if (url.match(/\.(jpg|jpeg|png|webp)$/i)) {
              imagens.push({
                url,
                descricao: desc.replace(/<[^>]*>/g, '').substring(0, 100),
                fonte: 'wikimedia'
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Erro buscando Commons:', e);
    }
  }
  
  // Remover duplicatas
  const seen = new Set<string>();
  return imagens.filter(img => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  }).slice(0, 20);
}

// Segmentar biografia em cenas usando Gemini
async function segmentarComIA(nome: string, biografia: string, imagens: ImagemDisponivel[]): Promise<Cena[]> {
  const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
  
  const prompt = `Você é um editor de documentários. Analise esta biografia e crie um roteiro narrativo dividido em 6-8 cenas.

BIOGRAFIA DE ${nome}:
${biografia.substring(0, 8000)}

IMAGENS DISPONÍVEIS:
${imagens.map((img, i) => `${i + 1}. ${img.descricao} (${img.fonte})`).join('\n')}

INSTRUÇÕES:
1. Divida a biografia em 6-8 cenas temáticas (cada uma ~25-35 segundos de narração)
2. Cada cena deve ter um título curto e marcante
3. O texto narrado deve ser envolvente, como um documentário profissional
4. Para cada cena, indique qual imagem (pelo número) melhor representa o momento
5. Comece pela origem/formação e termine com legado/atualidade
6. Use tom respeitoso mas interessante, como Netflix Docs

RETORNE APENAS JSON VÁLIDO no formato:
{
  "cenas": [
    {
      "ordem": 1,
      "titulo": "Origens",
      "texto_narrado": "Texto de ~100 palavras para narrar...",
      "imagem_index": 1
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extrair JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Mapear cenas com imagens
  return parsed.cenas.map((cena: any) => {
    const imgIndex = (cena.imagem_index || 1) - 1;
    const imagem = imagens[imgIndex] || imagens[0] || { url: '', descricao: '' };
    
    return {
      ordem: cena.ordem,
      titulo: cena.titulo,
      texto_narrado: cena.texto_narrado,
      imagem_url: imagem.url,
      imagem_descricao: imagem.descricao
    };
  });
}

// Gerar áudios para cada cena usando Gemini TTS
async function gerarAudiosParaCenas(cenas: Cena[], supabaseUrl: string, supabaseKey: string): Promise<Cena[]> {
  const cenasComAudio: Cena[] = [];
  
  for (const cena of cenas) {
    try {
      console.log(`🎙️ Gerando áudio para cena ${cena.ordem}: ${cena.titulo}`);
      
      // Chamar função gerar-audio-professora
      const response = await fetch(`${supabaseUrl}/functions/v1/gerar-audio-professora`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cena.texto_narrado })
      });
      
      if (response.ok) {
        const audioData = await response.json();
        
        // Estimar duração baseado no texto (~150 palavras/minuto)
        const palavras = cena.texto_narrado.split(/\s+/).length;
        const duracao = Math.ceil((palavras / 150) * 60);
        
        cenasComAudio.push({
          ...cena,
          url_audio: audioData.audioBase64 ? `data:audio/wav;base64,${audioData.audioBase64}` : undefined,
          duracao
        });
      } else {
        console.error(`Erro ao gerar áudio para cena ${cena.ordem}:`, await response.text());
        cenasComAudio.push({
          ...cena,
          duracao: 30 // Fallback
        });
      }
      
      // Pequeno delay entre requisições
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.error(`Erro ao gerar áudio para cena ${cena.ordem}:`, error);
      cenasComAudio.push({
        ...cena,
        duracao: 30
      });
    }
  }
  
  return cenasComAudio;
}
