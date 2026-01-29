import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface GeocodeResult {
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep } = await req.json();

    if (!cep) {
      return new Response(
        JSON.stringify({ error: 'CEP é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CEP
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando CEP: ${cepLimpo}`);

    // Buscar endereço no ViaCEP
    const viacepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const viacepData: ViaCepResponse = await viacepResponse.json();

    if (viacepData.erro) {
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Endereço encontrado: ${viacepData.logradouro}, ${viacepData.localidade} - ${viacepData.uf}`);

    // Montar endereço para geocoding
    const enderecoCompleto = [
      viacepData.logradouro,
      viacepData.bairro,
      viacepData.localidade,
      viacepData.uf,
      'Brasil'
    ].filter(Boolean).join(', ');

    // Usar Google Geocoding para obter coordenadas
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoCompleto)}&key=${GOOGLE_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('Erro no geocoding:', geocodeData.status, geocodeData.error_message);
      
      // Fallback: usar coordenadas da capital do estado
      const capitalCoords = getCapitalCoords(viacepData.uf);
      
      const result: GeocodeResult = {
        cep: cepLimpo,
        endereco: enderecoCompleto,
        cidade: viacepData.localidade,
        estado: viacepData.uf,
        latitude: capitalCoords.lat,
        longitude: capitalCoords.lng,
      };

      return new Response(
        JSON.stringify({ ...result, aproximado: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodeData.results[0].geometry.location;

    const result: GeocodeResult = {
      cep: cepLimpo,
      endereco: enderecoCompleto,
      cidade: viacepData.localidade,
      estado: viacepData.uf,
      latitude: location.lat,
      longitude: location.lng,
    };

    console.log(`Coordenadas: ${location.lat}, ${location.lng}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Coordenadas das capitais por UF
function getCapitalCoords(uf: string): { lat: number; lng: number } {
  const capitais: Record<string, { lat: number; lng: number }> = {
    AC: { lat: -9.9754, lng: -67.8249 },
    AL: { lat: -9.6498, lng: -35.7089 },
    AP: { lat: 0.0356, lng: -51.0705 },
    AM: { lat: -3.1190, lng: -60.0217 },
    BA: { lat: -12.9714, lng: -38.5014 },
    CE: { lat: -3.7172, lng: -38.5433 },
    DF: { lat: -15.7801, lng: -47.9292 },
    ES: { lat: -20.3155, lng: -40.3128 },
    GO: { lat: -16.6869, lng: -49.2648 },
    MA: { lat: -2.5391, lng: -44.2829 },
    MT: { lat: -15.5989, lng: -56.0949 },
    MS: { lat: -20.4697, lng: -54.6201 },
    MG: { lat: -19.9167, lng: -43.9345 },
    PA: { lat: -1.4558, lng: -48.4902 },
    PB: { lat: -7.1153, lng: -34.8610 },
    PR: { lat: -25.4290, lng: -49.2710 },
    PE: { lat: -8.0476, lng: -34.8770 },
    PI: { lat: -5.0920, lng: -42.8038 },
    RJ: { lat: -22.9068, lng: -43.1729 },
    RN: { lat: -5.7945, lng: -35.2110 },
    RS: { lat: -30.0346, lng: -51.2177 },
    RO: { lat: -8.7619, lng: -63.9039 },
    RR: { lat: 2.8235, lng: -60.6758 },
    SC: { lat: -27.5954, lng: -48.5480 },
    SP: { lat: -23.5505, lng: -46.6333 },
    SE: { lat: -10.9472, lng: -37.0731 },
    TO: { lat: -10.1689, lng: -48.3317 },
  };

  return capitais[uf] || { lat: -15.7801, lng: -47.9292 }; // Default: Brasília
}
