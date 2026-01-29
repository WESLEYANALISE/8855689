import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleMapsToken = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!googleMapsToken) {
      console.error('GOOGLE_PLACES_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'API Key do Google Maps não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token do Google Maps recuperado com sucesso');

    return new Response(
      JSON.stringify({ token: googleMapsToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao obter token do Google Maps' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
