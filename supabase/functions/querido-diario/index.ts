import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://queridodiario.ok.org.br/api';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`📰 Querido Diário API - Ação: ${action}`, params);

    let url: string;
    let response: Response;

    switch (action) {
      // ========== BUSCA EM DIÁRIOS ==========
      case 'buscar_gazettes': {
        const queryParams = new URLSearchParams();
        if (params.territory_ids) {
          params.territory_ids.forEach((id: string) => queryParams.append('territory_ids', id));
        }
        if (params.querystring) queryParams.set('querystring', params.querystring);
        if (params.published_since) queryParams.set('published_since', params.published_since);
        if (params.published_until) queryParams.set('published_until', params.published_until);
        if (params.scraped_since) queryParams.set('scraped_since', params.scraped_since);
        if (params.scraped_until) queryParams.set('scraped_until', params.scraped_until);
        if (params.size) queryParams.set('size', params.size.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());
        if (params.sort_by) queryParams.set('sort_by', params.sort_by);

        url = `${BASE_URL}/gazettes?${queryParams.toString()}`;
        console.log(`🔍 Buscando diários: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== BUSCA POR TEMA ==========
      case 'buscar_por_tema': {
        const theme = params.theme || 'licitacao';
        const queryParams = new URLSearchParams();
        if (params.territory_ids) {
          params.territory_ids.forEach((id: string) => queryParams.append('territory_ids', id));
        }
        if (params.subthemes) {
          params.subthemes.forEach((sub: string) => queryParams.append('subthemes', sub));
        }
        if (params.entities) {
          params.entities.forEach((ent: string) => queryParams.append('entities', ent));
        }
        if (params.published_since) queryParams.set('published_since', params.published_since);
        if (params.published_until) queryParams.set('published_until', params.published_until);
        if (params.size) queryParams.set('size', params.size.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());

        url = `${BASE_URL}/gazettes/by_theme/${theme}?${queryParams.toString()}`;
        console.log(`🏷️ Buscando por tema: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== LISTAR TEMAS ==========
      case 'listar_temas': {
        url = `${BASE_URL}/gazettes/by_theme/themes/`;
        console.log(`📋 Listando temas: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== BUSCAR CIDADES ==========
      case 'buscar_cidades': {
        const queryParams = new URLSearchParams();
        if (params.city_name) queryParams.set('city_name', params.city_name);
        
        url = `${BASE_URL}/cities?${queryParams.toString()}`;
        console.log(`🏙️ Buscando cidades: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== DETALHES DA CIDADE ==========
      case 'detalhes_cidade': {
        const territoryId = params.territory_id;
        if (!territoryId) {
          throw new Error('territory_id é obrigatório');
        }
        
        url = `${BASE_URL}/cities/${territoryId}`;
        console.log(`🏛️ Detalhes da cidade: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== CONSULTA CNPJ ==========
      case 'consultar_cnpj': {
        const cnpj = params.cnpj?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
          throw new Error('CNPJ inválido - deve ter 14 dígitos');
        }
        
        url = `${BASE_URL}/company/info/${cnpj}`;
        console.log(`🏢 Consultando CNPJ: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== SÓCIOS DA EMPRESA ==========
      case 'buscar_socios': {
        const cnpj = params.cnpj?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
          throw new Error('CNPJ inválido - deve ter 14 dígitos');
        }
        
        url = `${BASE_URL}/company/partners/${cnpj}`;
        console.log(`👥 Buscando sócios: ${url}`);
        response = await fetch(url);
        break;
      }

      // ========== AGREGADOS POR ESTADO ==========
      case 'agregados_estado': {
        const stateCode = params.state_code?.toUpperCase();
        if (!stateCode || stateCode.length !== 2) {
          throw new Error('state_code inválido - deve ter 2 letras (ex: SP, RJ)');
        }
        
        url = `${BASE_URL}/aggregates/${stateCode}`;
        console.log(`📊 Agregados do estado: ${url}`);
        response = await fetch(url);
        break;
      }

      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

    // Verificar content-type antes de parsear
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API: ${response.status} - ${errorText.substring(0, 200)}`);
      
      // Tratamento especial para 404 (não encontrado)
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: null, 
            message: 'Registro não encontrado' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    // Se não for JSON, retornar erro apropriado
    if (!isJson) {
      const textResponse = await response.text();
      console.error(`❌ Resposta não é JSON. Content-Type: ${contentType}`);
      console.error(`Primeiros 200 chars: ${textResponse.substring(0, 200)}`);
      
      throw new Error('API retornou resposta inválida (não JSON). O serviço pode estar temporariamente indisponível.');
    }

    const data = await response.json();
    console.log(`✅ Sucesso - ${action}:`, typeof data === 'object' ? 'dados recebidos' : data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
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
