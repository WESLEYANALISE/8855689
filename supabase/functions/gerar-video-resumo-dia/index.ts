import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gerar assinatura SHA-1 para Cloudinary
async function generateSignature(paramsToSign: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
  const fullString = stringToSign + apiSecret;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(fullString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Converter string para base64 URL-safe
function toBase64UrlSafe(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Upload de arquivo para Cloudinary
async function uploadToCloudinary(
  fileUrl: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  resourceType: 'image' | 'video' | 'raw',
  publicId: string,
  extraParams: Record<string, string> = {}
): Promise<{ secure_url: string; public_id: string; duration?: number }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const paramsToSign: Record<string, string> = {
    public_id: publicId,
    timestamp: timestamp,
    ...extraParams,
  };
  
  const signature = await generateSignature(paramsToSign, apiSecret);
  
  const formData = new FormData();
  formData.append('file', fileUrl);
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  
  for (const [key, value] of Object.entries(extraParams)) {
    formData.append(key, value);
  }
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
  
  return response.json();
}

// Verificar se URL é vídeo válido
async function isValidVideo(url: string): Promise<{ valid: boolean; contentType: string; size: number }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    const size = parseInt(response.headers.get('content-length') || '0');
    
    const valid = response.ok && (contentType.includes('video') || size > 100000);
    
    return { valid, contentType, size };
  } catch (e) {
    console.error('Erro ao verificar vídeo:', e);
    return { valid: false, contentType: '', size: 0 };
  }
}

// Criar slideshow usando a API oficial do Cloudinary com polling
async function createCloudinarySlideshow(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  slides: Array<{ publicId: string; duration: number }>,
  outputPublicId: string
): Promise<{ secure_url: string; public_id: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);
  
  // Construir manifest_json para slideshow
  const manifestData = {
    w: 1080,
    h: 1920,
    du: totalDuration,
    fps: 30,
    vars: {
      sdur: 8000,
      transition_s: "fade",
      transition_du: 500
    },
    slides: slides.map(s => ({
      media: `i:${s.publicId}`,
      sdur: s.duration * 1000
    }))
  };
  
  const manifestJson = JSON.stringify(manifestData);
  console.log('Manifest JSON:', manifestJson);
  
  const paramsToSign: Record<string, string> = {
    manifest_json: manifestJson,
    public_id: outputPublicId,
    timestamp: timestamp,
  };
  
  const signature = await generateSignature(paramsToSign, apiSecret);
  
  const formData = new FormData();
  formData.append('manifest_json', manifestJson);
  formData.append('public_id', outputPublicId);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  
  console.log(`Chamando create_slideshow API...`);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/create_slideshow`,
    { method: 'POST', body: formData }
  );
  
  const responseText = await response.text();
  console.log('Resposta create_slideshow:', responseText);
  
  if (!response.ok) {
    throw new Error(`Cloudinary create_slideshow failed: ${responseText}`);
  }
  
  const result = JSON.parse(responseText);
  
  // Se retornou status processing, fazer polling até concluir
  if (result.status === 'processing' || result.batch_id) {
    console.log('Slideshow em processamento, aguardando...');
    
    const batchId = result.batch_id;
    const maxAttempts = 12; // 12 x 10s = 2 minutos
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Polling tentativa ${attempt + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
      
      // Verificar se o vídeo já existe
      const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${result.public_id}.mp4`;
      const checkResp = await fetch(videoUrl, { method: 'HEAD' });
      
      if (checkResp.ok) {
        const contentType = checkResp.headers.get('content-type') || '';
        const size = parseInt(checkResp.headers.get('content-length') || '0');
        
        console.log(`Vídeo encontrado: ${contentType}, ${size} bytes`);
        
        if (contentType.includes('video') && size > 50000) {
          return {
            secure_url: videoUrl,
            public_id: result.public_id
          };
        }
      }
    }
    
    throw new Error('Timeout aguardando processamento do slideshow');
  }
  
  return result;
}

// Gerar vídeo real usando Cloudinary create_slideshow
async function generateRealVideo(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  area: string,
  dataHoje: string,
  slides: any[]
): Promise<{ url_video: string; thumbnail_url: string; duracao_segundos: number }> {
  
  console.log(`Gerando vídeo real para ${area} - ${dataHoje} com ${slides.length} slides`);
  
  const uploadedSlides: Array<{ publicId: string; secureUrl: string; duration: number }> = [];
  const DEFAULT_SLIDE_DURATION = 8;
  const MAX_SLIDES = 10;
  
  // 1. Upload de cada slide para Cloudinary (como imagem)
  for (let i = 0; i < Math.min(slides.length, MAX_SLIDES); i++) {
    const slide = slides[i];
    const imagemUrl = slide.imagem_url || slide.imagem || slide.url_imagem || slide.url;
    
    if (!imagemUrl) {
      console.warn(`Slide ${i} sem imagem, pulando...`);
      continue;
    }
    
    const imagePublicId = `resumo-dia/${area}/${dataHoje}/slide-${i + 1}`;
    console.log(`Uploading slide ${i + 1}/${slides.length}: ${imagemUrl.substring(0, 80)}...`);
    
    try {
      const result = await uploadToCloudinary(
        imagemUrl,
        cloudName,
        apiKey,
        apiSecret,
        'image',
        imagePublicId,
        { overwrite: 'true' }
      );
      
      uploadedSlides.push({
        publicId: result.public_id,
        secureUrl: result.secure_url,
        duration: DEFAULT_SLIDE_DURATION
      });
      
      console.log(`Slide ${i + 1} uploaded: ${result.public_id}`);
    } catch (err) {
      console.error(`Erro no upload do slide ${i + 1}:`, err);
    }
  }
  
  if (uploadedSlides.length === 0) {
    throw new Error('Nenhum slide válido para gerar vídeo');
  }
  
  console.log(`${uploadedSlides.length} slides uploaded, criando slideshow...`);
  
  const duracaoTotal = uploadedSlides.reduce((acc, s) => acc + s.duration, 0);
  const outputPublicId = `resumo-dia-videos/${area}/${dataHoje}/video`;
  
  // 2. Criar slideshow usando a API oficial com polling
  const slideshowResult = await createCloudinarySlideshow(
    cloudName,
    apiKey,
    apiSecret,
    uploadedSlides,
    outputPublicId
  );
  
  console.log('Slideshow criado:', slideshowResult);
  
  const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_540,h_960,so_0/${outputPublicId}.jpg`;
  
  console.log(`✅ URL final do vídeo: ${slideshowResult.secure_url}`);
  
  return {
    url_video: slideshowResult.secure_url,
    thumbnail_url: thumbnailUrl,
    duracao_segundos: duracaoTotal,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, data: dataParam, forcar } = await req.json();
    
    if (!area || !['direito', 'politica', 'concurso'].includes(area)) {
      throw new Error('Área inválida. Use: direito, politica ou concurso');
    }
    
    const dataHoje = dataParam || new Date().toISOString().split('T')[0];
    
    console.log(`=== Gerando vídeo para ${area} - ${dataHoje} ===`);
    
    // Configurações
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Credenciais do Cloudinary não configuradas');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar se já existe vídeo válido para esta data/área
    if (!forcar) {
      const { data: existente } = await supabase
        .from('videos_resumo_dia')
        .select('id, url_video')
        .eq('data', dataHoje)
        .eq('area', area)
        .eq('status', 'gerado')
        .maybeSingle();
      
      if (existente?.url_video) {
        const videoCheck = await isValidVideo(existente.url_video);
        
        if (videoCheck.valid) {
          console.log(`Vídeo válido já existe: ${existente.url_video} (${videoCheck.size} bytes)`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Vídeo válido já existe',
              url_video: existente.url_video,
              cached: true,
              size: videoCheck.size
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log(`Vídeo existente inválido (${videoCheck.contentType}, ${videoCheck.size} bytes), regenerando...`);
        }
      }
    }
    
    // Buscar boletim do dia
    const tipoBoletim = area === 'politica' ? 'politica' : 'juridica';
    const { data: resumo, error: resumoError } = await supabase
      .from('resumos_diarios')
      .select('*')
      .eq('data', dataHoje)
      .eq('tipo', tipoBoletim)
      .maybeSingle();
    
    if (resumoError || !resumo) {
      // Tentar tipo alternativo
      const { data: resumoAlt } = await supabase
        .from('resumos_diarios')
        .select('*')
        .eq('data', dataHoje)
        .ilike('tipo', `%${area}%`)
        .maybeSingle();
      
      if (!resumoAlt) {
        throw new Error(`Boletim não encontrado para ${dataHoje} - ${area} (tipo: ${tipoBoletim})`);
      }
    }
    
    const boletim = resumo || (await supabase.from('resumos_diarios').select('*').eq('data', dataHoje).limit(1).single()).data;
    
    if (!boletim) {
      throw new Error(`Nenhum boletim disponível para ${dataHoje}`);
    }
    
    // Marcar como gerando
    await supabase
      .from('videos_resumo_dia')
      .upsert({
        data: dataHoje,
        area,
        url_video: null,
        status: 'gerando',
        erro_mensagem: null,
      }, { onConflict: 'data,area' });
    
    // Preparar slides do boletim
    const slides = boletim.slides || [];
    
    if (slides.length === 0) {
      throw new Error('Boletim não possui slides');
    }
    
    console.log(`Boletim encontrado com ${slides.length} slides`);
    
    // Gerar vídeo real usando Cloudinary create_slideshow
    const result = await generateRealVideo(
      cloudName,
      apiKey,
      apiSecret,
      area,
      dataHoje,
      slides
    );
    
    // Atualizar registro com URL do vídeo real
    await supabase
      .from('videos_resumo_dia')
      .update({
        url_video: result.url_video,
        thumbnail_url: result.thumbnail_url,
        status: 'gerado',
        noticias_resumidas: slides.length,
        duracao_segundos: result.duracao_segundos,
        erro_mensagem: null,
      })
      .eq('data', dataHoje)
      .eq('area', area);
    
    console.log(`✅ Vídeo real gerado para ${area} - ${dataHoje}: ${result.url_video}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vídeo gerado com sucesso',
        url_video: result.url_video,
        thumbnail_url: result.thumbnail_url,
        duracao_segundos: result.duracao_segundos,
        area,
        data: dataHoje,
        slides_count: slides.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Erro ao gerar vídeo:', error);
    
    // Salvar erro no banco se possível
    try {
      const { area, data: dataParam } = await req.clone().json().catch(() => ({}));
      if (area) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('videos_resumo_dia')
          .update({
            status: 'erro',
            erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          })
          .eq('data', dataParam || new Date().toISOString().split('T')[0])
          .eq('area', area);
      }
    } catch (e) {
      // Ignorar erros ao salvar erro
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
