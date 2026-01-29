import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tabelas organizadas por categoria com nomes amigáveis
const TABELAS_POR_CATEGORIA = {
  "Códigos": {
    "CC - Código Civil": "Código Civil",
    "CP - Código Penal": "Código Penal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CF - Constituição Federal": "Constituição Federal",
    "CDC – Código de Defesa do Consumidor": "CDC",
    "CTB – Código de Trânsito Brasileiro": "CTB",
    "CTN – Código Tributário Nacional": "CTN",
    "CPM – Código Penal Militar": "CPM",
    "CPPM – Código de Processo Penal Militar": "CPPM",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CBA Código Brasileiro de Aeronáutica": "CBA",
    "CBT Código Brasileiro de Telecomunicações": "CBT",
    "CA - Código de Águas": "Código de Águas",
    "CF - Código Florestal": "Código Florestal",
    "CC - Código de Caça": "Código de Caça",
    "CP - Código de Pesca": "Código de Pesca",
    "CDM – Código de Minas": "Código de Minas",
    "CCOM – Código Comercial": "Código Comercial",
    "CPI - Código de Propriedade Industrial": "CPI",
    "CDUS - Código de Defesa do Usuário": "CDUS",
  },
  "Estatutos": {
    "ECA – Estatuto da Criança e do Adolescente": "ECA",
    "EI – Estatuto do Idoso": "Estatuto do Idoso",
    "EOAB – Estatuto da OAB": "Estatuto OAB",
    "EPCD – Estatuto da Pessoa com Deficiência": "Estatuto PCD",
    "ET – Estatuto do Torcedor": "Estatuto Torcedor",
    "ED – Estatuto do Desarmamento": "Desarmamento",
    "EIR – Estatuto da Igualdade Racial": "Igualdade Racial",
    "ET – Estatuto da Terra": "Estatuto da Terra",
    "EC – Estatuto da Cidade": "Estatuto da Cidade",
    "Estatuto dos Militares": "Estatuto Militares",
    "EI – Estatuto do Índio": "Estatuto do Índio",
    "ER – Estatuto dos Refugiados": "Estatuto Refugiados",
  },
  "Leis Penais Especiais": {
    "LMP – Lei Maria da Penha": "Maria da Penha",
    "LD – Lei de Drogas": "Lei de Drogas",
    "LCH – Lei de Crimes Hediondos": "Crimes Hediondos",
    "LAA – Lei de Abuso de Autoridade": "Abuso de Autoridade",
    "LT – Lei de Tortura": "Lei de Tortura",
    "LCA – Lei de Crimes Ambientais": "Crimes Ambientais",
    "LR – Lei de Racismo": "Lei de Racismo",
    "LOC – Lei de Organizações Criminosas": "Org. Criminosas",
    "LIT – Lei de Interceptação Telefônica": "Interceptação",
    "LJE – Lei dos Juizados Especiais": "Juizados Especiais",
    "LEP – Lei de Execução Penal": "Execução Penal",
    "LLD – Lei de Lavagem de Dinheiro": "Lavagem Dinheiro",
  },
  "Leis Ordinárias": {
    "LGPD – Lei Geral de Proteção de Dados": "LGPD",
    "LLIC – Lei de Licitações": "Licitações",
    "LIA – Lei de Improbidade Administrativa": "Improbidade",
    "LACP – Lei de Ação Civil Pública": "ACP",
    "LMS – Lei do Mandado de Segurança": "Mandado Segurança",
    "LHD – Lei do Habeas Data": "Habeas Data",
    "LAP – Lei de Ação Popular": "Ação Popular",
    "LAG – Lei de Alimentos Gravídicos": "Alimentos Gravídicos",
    "LARB – Lei de Arbitragem": "Arbitragem",
    "LLOC – Lei de Locações": "Locações",
    "LDIV – Lei do Divórcio": "Divórcio",
    "LINQ – Lei do Inquilinato": "Inquilinato",
    "LPRG – Lei do Pregão": "Pregão",
    "LCP – Lei de Consórcios Públicos": "Consórcios Públicos",
    "LPPP – Lei de PPP": "PPP",
    "LCON – Lei de Concessões": "Concessões",
    "LPA – Lei de Processo Administrativo": "Processo Admin.",
    "L8112 – Lei do Servidor Federal": "Lei 8.112",
    "MCI – Marco Civil da Internet": "Marco Civil",
    "LRF – Lei de Falências": "Falências",
  },
  "Leis Complementares": {
    "LC101 – Lei de Responsabilidade Fiscal": "LRF",
    "LC135 – Lei da Ficha Limpa": "Ficha Limpa",
  },
  "Súmulas": {
    "SUMULAS_STF": "Súmulas STF",
    "SUMULAS_VINCULANTES": "Súmulas Vinculantes",
    "SUMULAS_STJ": "Súmulas STJ",
    "SUMULAS_TST": "Súmulas TST",
    "SUMULAS_TSE": "Súmulas TSE",
    "SUMULAS_TNU": "Súmulas TNU",
    "SUMULAS_CARF": "Súmulas CARF",
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey } = await req.json();
    
    // Validar API key
    const expectedKey = Deno.env.get('SHEETS_SYNC_API_KEY') || Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (apiKey !== expectedKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API Key inválida' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[stats-leis-dashboard] Coletando estatísticas...');

    const estatisticas: Record<string, any> = {
      categorias: {},
      totais: {
        totalCategorias: Object.keys(TABELAS_POR_CATEGORIA).length,
        totalTabelas: 0,
        totalArtigos: 0,
      },
      detalhes: [],
      ultimaAtualizacao: new Date().toISOString(),
    };

    for (const [categoria, tabelas] of Object.entries(TABELAS_POR_CATEGORIA)) {
      const statsCategoria = {
        nome: categoria,
        totalTabelas: Object.keys(tabelas).length,
        totalArtigos: 0,
        tabelas: [] as any[],
      };

      for (const [nomeTabela, nomeAmigavel] of Object.entries(tabelas)) {
        try {
          const { count } = await supabase
            .from(nomeTabela)
            .select('*', { count: 'exact', head: true });

          const totalArtigos = count || 0;
          
          statsCategoria.tabelas.push({
            tabela: nomeTabela,
            nomeAmigavel,
            totalArtigos,
          });
          
          statsCategoria.totalArtigos += totalArtigos;
          estatisticas.totais.totalArtigos += totalArtigos;
          estatisticas.totais.totalTabelas++;

          estatisticas.detalhes.push({
            categoria,
            tabela: nomeTabela,
            nomeAmigavel,
            totalArtigos,
          });
        } catch (err) {
          console.error(`[stats-leis-dashboard] Erro ao contar ${nomeTabela}:`, err);
          statsCategoria.tabelas.push({
            tabela: nomeTabela,
            nomeAmigavel,
            totalArtigos: 0,
            erro: true,
          });
        }
      }

      estatisticas.categorias[categoria] = statsCategoria;
    }

    // Ordenar detalhes por número de artigos (decrescente)
    estatisticas.detalhes.sort((a: any, b: any) => b.totalArtigos - a.totalArtigos);

    console.log(`[stats-leis-dashboard] Estatísticas coletadas: ${estatisticas.totais.totalTabelas} tabelas, ${estatisticas.totais.totalArtigos} artigos`);

    return new Response(JSON.stringify({
      success: true,
      ...estatisticas
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[stats-leis-dashboard] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
