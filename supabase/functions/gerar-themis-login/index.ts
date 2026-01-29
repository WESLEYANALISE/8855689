import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating Themis image for login background...');

    const prompt = `A majestic full-body statue of Themis, the Greek goddess of justice, standing alone in complete darkness. 
    Divine golden light emanating dramatically from below her feet, illuminating her from underneath like a celestial deity. 
    She holds balanced scales of justice in one hand and a sword pointing down in the other. 
    Her blindfold flows elegantly. The dramatic under-lighting creates an ethereal, godlike atmosphere with rays of warm golden light ascending around her silhouette.
    Pure black background with subtle warm golden tones where light touches. 
    Photorealistic, cinematic, dramatic lighting, vertical 9:16 aspect ratio composition.
    Ultra high resolution, dramatic divine atmosphere.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    console.log(`Image generated: ${imageFormat}, size: ${imageBytes.length} bytes`);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `themis-login-${Date.now()}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`;
    const filePath = `backgrounds/${fileName}`;

    // Delete old themis login images
    const { data: existingFiles } = await supabase.storage
      .from('imagens')
      .list('backgrounds', { search: 'themis-login' });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `backgrounds/${f.name}`);
      await supabase.storage.from('imagens').remove(filesToDelete);
      console.log(`Deleted ${filesToDelete.length} old themis images`);
    }

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        fileName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating Themis image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
