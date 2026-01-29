import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  latitude: number;
  longitude: number;
  tipo: 'tribunal' | 'cartorio' | 'oab' | 'advocacia' | 'museu' | 'todos';
  raio?: number;
  cidade?: string;
}

interface LocalJuridico {
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
  distancia: number;
  tipo: string;
  googleMapsUrl: string;
  fotoUrl?: string;
  sobre?: string;
  website?: string;
}

const tipoKeywords: Record<string, string[]> = {
  tribunal: ['tribunal de justiça', 'fórum', 'juizado especial', 'vara judicial', 'comarca'],
  cartorio: ['cartório', 'registro de imóveis', 'tabelionato', 'registro civil'],
  oab: ['OAB', 'ordem dos advogados'],
  advocacia: ['escritório de advocacia', 'advogados associados'],
  museu: ['museu', 'memorial da justiça', 'museu do judiciário', 'centro cultural'],
};

// Gerar cache key baseado em tipo, coordenadas arredondadas e raio normalizado
function gerarCacheKey(tipo: string, lat: number, lng: number, raio: number): string {
  const latRound = Math.round(lat * 100) / 100;
  const lngRound = Math.round(lng * 100) / 100;
  const raioNorm = Math.ceil(raio / 50000) * 50000; // Normalizar em blocos de 50km
  return `${tipo}_${latRound}_${lngRound}_${raioNorm}`;
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function buscarLocaisTextSearch(
  apiKey: string,
  latitude: number,
  longitude: number,
  keyword: string,
  raio: number,
  cidade?: string
): Promise<any[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  const textQuery = cidade 
    ? `${keyword} em ${cidade}` 
    : `${keyword}`;
  
  console.log(`Buscando: "${textQuery}" próximo a (${latitude}, ${longitude})`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.nationalPhoneNumber,places.googleMapsUri,places.photos,places.editorialSummary,places.websiteUri,places.primaryType'
      },
      body: JSON.stringify({
        textQuery,
        locationBias: {
          circle: {
            center: { latitude, longitude },
            radius: raio
          }
        },
        languageCode: 'pt-BR',
        maxResultCount: 60 // Aumentado para trazer mais resultados
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`Erro na busca: ${data.error.message}`);
      return [];
    }
    
    console.log(`Encontrados ${data.places?.length || 0} resultados para "${keyword}"`);
    return data.places || [];
  } catch (error) {
    console.error(`Erro ao buscar ${keyword}:`, error);
    return [];
  }
}

function getPhotoUrl(photo: any, apiKey: string): string | undefined {
  if (!photo?.name) return undefined;
  return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`;
}

function formatarLocal(local: any, latitude: number, longitude: number, apiKey: string): LocalJuridico | null {
  const lat = local.location?.latitude;
  const lng = local.location?.longitude;
  
  if (!lat || !lng) return null;

  const distancia = calcularDistancia(latitude, longitude, lat, lng);

  // Determinar tipo baseado no nome
  let tipoLocal = 'outros';
  const nomeLower = (local.displayName?.text || '').toLowerCase();
  
  if (nomeLower.includes('tribunal') || nomeLower.includes('fórum') || nomeLower.includes('forum') || nomeLower.includes('juizado') || nomeLower.includes('vara') || nomeLower.includes('comarca')) {
    tipoLocal = 'tribunal';
  } else if (nomeLower.includes('cartório') || nomeLower.includes('cartorio') || nomeLower.includes('tabelionato') || nomeLower.includes('registro')) {
    tipoLocal = 'cartorio';
  } else if (nomeLower.includes('oab') || nomeLower.includes('ordem dos advogados')) {
    tipoLocal = 'oab';
  } else if (nomeLower.includes('advocacia') || nomeLower.includes('advogado')) {
    tipoLocal = 'advocacia';
  } else if (nomeLower.includes('museu') || nomeLower.includes('memorial') || nomeLower.includes('centro cultural')) {
    tipoLocal = 'museu';
  }

  let fotoUrl: string | undefined;
  if (local.photos && local.photos.length > 0) {
    fotoUrl = getPhotoUrl(local.photos[0], apiKey);
  }

  return {
    id: local.id,
    nome: local.displayName?.text || 'Sem nome',
    endereco: local.formattedAddress || '',
    latitude: lat,
    longitude: lng,
    telefone: local.nationalPhoneNumber,
    horarioFuncionamento: local.regularOpeningHours?.weekdayDescriptions,
    aberto: local.regularOpeningHours?.openNow ?? false,
    avaliacao: local.rating,
    totalAvaliacoes: local.userRatingCount,
    distancia: Math.round(distancia * 10) / 10,
    tipo: tipoLocal,
    googleMapsUrl: local.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${local.id}`,
    fotoUrl,
    sobre: local.editorialSummary?.text,
    website: local.websiteUri,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body: RequestBody = await req.json();
    const { latitude, longitude, tipo, raio = 10000, cidade } = body;

    console.log(`Busca: tipo=${tipo}, lat=${latitude}, lng=${longitude}, raio=${raio}m, cidade=${cidade || 'não especificada'}`);

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude e longitude são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar cache key
    const cacheKey = gerarCacheKey(tipo, latitude, longitude, raio);
    console.log(`Cache key: ${cacheKey}`);

    // Verificar cache
    const { data: cacheData } = await supabase
      .from('locais_juridicos_cache')
      .select('dados, expira_em')
      .eq('cache_key', cacheKey)
      .single();

    if (cacheData && new Date(cacheData.expira_em) > new Date()) {
      console.log(`Cache hit! Retornando ${cacheData.dados?.length || 0} locais do cache`);
      
      // Recalcular distâncias com posição atual e ordenar
      const locaisCache = (cacheData.dados as LocalJuridico[]).map(local => ({
        ...local,
        distancia: Math.round(calcularDistancia(latitude, longitude, local.latitude, local.longitude) * 10) / 10
      }));
      locaisCache.sort((a, b) => a.distancia - b.distancia);
      
      return new Response(
        JSON.stringify({ locais: locaisCache, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cache miss ou expirado, buscando na API...');

    // Determinar keywords para busca
    let keywords: string[] = [];
    if (tipo === 'todos') {
      keywords = Object.values(tipoKeywords).flat();
    } else if (tipoKeywords[tipo]) {
      keywords = tipoKeywords[tipo];
    } else {
      keywords = [tipo];
    }

    // Buscar locais para cada keyword
    const todosResultados: any[] = [];
    const idsVistos = new Set<string>();

    for (const keyword of keywords.slice(0, 5)) { // Aumentado para 5 keywords
      const resultados = await buscarLocaisTextSearch(
        GOOGLE_PLACES_API_KEY, 
        latitude, 
        longitude, 
        keyword, 
        raio,
        cidade
      );
      
      for (const local of resultados) {
        if (!idsVistos.has(local.id)) {
          idsVistos.add(local.id);
          todosResultados.push(local);
        }
      }
    }

    console.log(`Total de locais únicos encontrados: ${todosResultados.length}`);

    // Formatar resultados (sem limite)
    const locaisFormatados: LocalJuridico[] = [];

    for (const local of todosResultados) {
      const formatted = formatarLocal(local, latitude, longitude, GOOGLE_PLACES_API_KEY);
      if (formatted) {
        locaisFormatados.push(formatted);
      }
    }

    // Ordenar por distância
    locaisFormatados.sort((a, b) => a.distancia - b.distancia);

    console.log(`Formatados ${locaisFormatados.length} locais`);

    // Salvar no cache (com dados base, sem distância específica)
    const locaisParaCache = locaisFormatados.map(local => ({
      ...local,
      distancia: 0 // Distância será recalculada na leitura
    }));

    await supabase
      .from('locais_juridicos_cache')
      .upsert({
        cache_key: cacheKey,
        tipo,
        latitude: Math.round(latitude * 100) / 100,
        longitude: Math.round(longitude * 100) / 100,
        raio,
        cidade,
        dados: locaisParaCache,
        total_resultados: locaisFormatados.length,
        updated_at: new Date().toISOString(),
        expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'cache_key' });

    console.log(`Cache salvo com ${locaisFormatados.length} locais`);

    return new Response(
      JSON.stringify({ locais: locaisFormatados, fromCache: false }),
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
