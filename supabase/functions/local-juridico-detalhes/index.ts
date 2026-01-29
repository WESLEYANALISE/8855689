import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Review {
  autor: string;
  autorFoto?: string;
  autorUrl?: string;
  rating: number;
  texto: string;
  tempoRelativo: string;
  dataPublicacao: string;
}

interface Foto {
  url: string;
  autor?: string;
}

interface LocalDetalhes {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  horarioFuncionamento?: string[];
  aberto: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  googleMapsUrl: string;
  fotos: Foto[];
  sobre?: string;
  website?: string;
  reviews: Review[];
  precoNivel?: number;
  acessibilidade?: {
    entradaAcessivel?: boolean;
    estacionamentoAcessivel?: boolean;
    banheiroAcessivel?: boolean;
  };
  estacionamento?: {
    pago?: boolean;
    gratuito?: boolean;
    rua?: boolean;
    garagem?: boolean;
    manobrista?: boolean;
  };
  tiposPagamento?: string[];
}

function getPhotoUrl(photo: any, apiKey: string): string | undefined {
  if (!photo?.name) return undefined;
  return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { placeId } = await req.json();

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'placeId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando detalhes do local: ${placeId}`);

    // Buscar detalhes completos do local
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,regularOpeningHours,nationalPhoneNumber,googleMapsUri,photos,editorialSummary,websiteUri,reviews,priceLevel,accessibilityOptions,parkingOptions,paymentOptions'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro da API:', data.error);
      return new Response(
        JSON.stringify({ error: data.error.message || 'Erro ao buscar detalhes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Reviews encontradas: ${data.reviews?.length || 0}`);
    console.log(`Fotos encontradas: ${data.photos?.length || 0}`);

    // Processar fotos (até 10)
    const fotos: Foto[] = (data.photos || []).slice(0, 10).map((photo: any) => ({
      url: getPhotoUrl(photo, GOOGLE_PLACES_API_KEY),
      autor: photo.authorAttributions?.[0]?.displayName
    })).filter((f: Foto) => f.url);

    // Processar reviews
    const reviews: Review[] = (data.reviews || []).map((review: any) => ({
      autor: review.authorAttribution?.displayName || 'Anônimo',
      autorFoto: review.authorAttribution?.photoUri,
      autorUrl: review.authorAttribution?.uri,
      rating: review.rating || 0,
      texto: review.text?.text || '',
      tempoRelativo: review.relativePublishTimeDescription || '',
      dataPublicacao: review.publishTime || ''
    }));

    // Processar acessibilidade
    const acessibilidade = data.accessibilityOptions ? {
      entradaAcessivel: data.accessibilityOptions.wheelchairAccessibleEntrance,
      estacionamentoAcessivel: data.accessibilityOptions.wheelchairAccessibleParking,
      banheiroAcessivel: data.accessibilityOptions.wheelchairAccessibleRestroom
    } : undefined;

    // Processar estacionamento
    const estacionamento = data.parkingOptions ? {
      pago: data.parkingOptions.paidParkingLot,
      gratuito: data.parkingOptions.freeParkingLot,
      rua: data.parkingOptions.streetParking,
      garagem: data.parkingOptions.parkingGarage,
      manobrista: data.parkingOptions.valetParking
    } : undefined;

    // Processar formas de pagamento
    const tiposPagamento: string[] = [];
    if (data.paymentOptions) {
      if (data.paymentOptions.acceptsCreditCards) tiposPagamento.push('Cartão de Crédito');
      if (data.paymentOptions.acceptsDebitCards) tiposPagamento.push('Cartão de Débito');
      if (data.paymentOptions.acceptsCashOnly) tiposPagamento.push('Somente Dinheiro');
      if (data.paymentOptions.acceptsNfc) tiposPagamento.push('Pagamento NFC');
    }

    const localDetalhes: LocalDetalhes = {
      id: data.id,
      nome: data.displayName?.text || 'Sem nome',
      endereco: data.formattedAddress || '',
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
      telefone: data.nationalPhoneNumber,
      horarioFuncionamento: data.regularOpeningHours?.weekdayDescriptions,
      aberto: data.regularOpeningHours?.openNow ?? false,
      avaliacao: data.rating,
      totalAvaliacoes: data.userRatingCount,
      googleMapsUrl: data.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${data.id}`,
      fotos,
      sobre: data.editorialSummary?.text,
      website: data.websiteUri,
      reviews,
      precoNivel: data.priceLevel,
      acessibilidade,
      estacionamento,
      tiposPagamento: tiposPagamento.length > 0 ? tiposPagamento : undefined
    };

    console.log(`Detalhes processados: ${fotos.length} fotos, ${reviews.length} reviews`);

    return new Response(
      JSON.stringify({ local: localDetalhes }),
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
