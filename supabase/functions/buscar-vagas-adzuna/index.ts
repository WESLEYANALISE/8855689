import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdzunaResponse {
  results: Array<{
    id: string;
    title: string;
    company: {
      display_name: string;
    };
    location: {
      display_name: string;
      area?: string[];
    };
    description: string;
    salary_min?: number;
    salary_max?: number;
    contract_type?: string;
    redirect_url: string;
    created: string;
    category?: {
      label: string;
    };
  }>;
  count: number;
  mean?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      keywords, 
      location, 
      latitude,
      longitude,
      page = 1, 
      resultsPerPage = 20 
    } = await req.json();

    const appId = Deno.env.get('ADZUNA_APP_ID');
    const appKey = Deno.env.get('ADZUNA_APP_KEY');

    if (!appId || !appKey) {
      throw new Error('Adzuna API credentials not configured');
    }

    // Construir URL da API Adzuna
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/br/search/${page}`;
    
    // Parâmetros básicos (obrigatórios)
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: resultsPerPage.toString(),
      sort_by: 'date',
      'content-type': 'application/json'
    });

    // Adicionar keywords se fornecidas
    if (keywords) {
      params.append('what', keywords);
    }

    // Adicionar localização se fornecida
    if (location) {
      params.append('where', location);
    }

    // Adicionar coordenadas se fornecidas
    if (latitude && longitude) {
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
      params.append('distance', '50'); // 50km de raio
    }

    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log('Fetching from Adzuna:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Adzuna API error:', response.status, errorText);
      console.error('Request URL:', fullUrl);
      throw new Error(`Adzuna API returned error ${response.status}. Please check API credentials.`);
    }

    const data: AdzunaResponse = await response.json();

    // Mapear resposta para formato da aplicação
    const vagas = data.results.map(result => {
      // Formatar salário
      let remuneracao = '';
      if (result.salary_min && result.salary_max) {
        const min = new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(result.salary_min);
        const max = new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(result.salary_max);
        remuneracao = `${min} - ${max}`;
      } else if (result.salary_min) {
        const min = new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(result.salary_min);
        remuneracao = `A partir de ${min}`;
      }

      return {
        id: result.id,
        titulo: result.title,
        empresa: result.company.display_name,
        local: result.location.display_name,
        estado: result.location.area?.[0] || '',
        descricao: result.description,
        salario_min: result.salary_min,
        salario_max: result.salary_max,
        remuneracao, // Campo formatado
        tipo_contrato: result.contract_type,
        link_externo: result.redirect_url,
        data_publicacao: result.created,
        categoria: result.category?.label || 'Jurídico',
        origem: 'adzuna',
        tipo_vaga: result.title.toLowerCase().includes('estágio') || result.title.toLowerCase().includes('estagio') 
          ? 'Estágio' 
          : result.title.toLowerCase().includes('júnior') || result.title.toLowerCase().includes('junior')
          ? 'Júnior'
          : 'Advogado'
      };
    });

    return new Response(
      JSON.stringify({
        vagas,
        total: data.count,
        pagina_atual: page,
        total_paginas: Math.ceil(data.count / resultsPerPage),
        salario_medio: data.mean
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in buscar-vagas-adzuna:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        vagas: [],
        total: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
