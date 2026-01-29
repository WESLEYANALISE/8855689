import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, acao, tabela, limite, offset } = await req.json();
    
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

    // AÇÃO: Listar todas as tabelas de leis dinamicamente
    if (acao === 'listar_tabelas') {
      console.log('[exportar-leis-sheets] Listando todas as tabelas de leis...');
      
      // Buscar todas as tabelas do schema public
      const { data: allTables, error: tablesError } = await supabase
        .rpc('get_all_public_tables');
      
      // Se a função RPC não existir, usar fallback com lista conhecida
      let tabelasLeis: string[] = [];
      
      if (tablesError || !allTables) {
        console.log('[exportar-leis-sheets] Usando lista estática de tabelas conhecidas');
        tabelasLeis = [
          // CÓDIGOS (22)
          "CC - Código Civil",
          "CP - Código Penal",
          "CPC – Código de Processo Civil",
          "CPP – Código de Processo Penal",
          "CLT - Consolidação das Leis do Trabalho",
          "CF - Constituição Federal",
          "CDC – Código de Defesa do Consumidor",
          "CTB – Código de Trânsito Brasileiro",
          "CTN – Código Tributário Nacional",
          "CPM – Código Penal Militar",
          "CPPM – Código de Processo Penal Militar",
          "CE – Código Eleitoral",
          "CBA Código Brasileiro de Aeronáutica",
          "CBT Código Brasileiro de Telecomunicações",
          "CA - Código de Águas",
          "CF - Código Florestal",
          "CC - Código de Caça",
          "CP - Código de Pesca",
          "CDM – Código de Minas",
          "CCOM – Código Comercial",
          "CPI - Código de Propriedade Industrial",
          "CDUS - Código de Defesa do Usuário",
          
          // ESTATUTOS (20)
          "ECA – Estatuto da Criança e do Adolescente",
          "EI – Estatuto do Idoso",
          "EOAB – Estatuto da OAB",
          "EPCD – Estatuto da Pessoa com Deficiência",
          "ET – Estatuto do Torcedor",
          "ED – Estatuto do Desarmamento",
          "EIR – Estatuto da Igualdade Racial",
          "ET – Estatuto da Terra",
          "EC – Estatuto da Cidade",
          "Estatuto dos Militares",
          "EI – Estatuto do Índio",
          "ER – Estatuto dos Refugiados",
          "ESTATUTO - ECA",
          "ESTATUTO - IDOSO",
          "ESTATUTO - OAB",
          "ESTATUTO - PCD",
          "ESTATUTO - TORCEDOR",
          "ESTATUTO - DESARMAMENTO",
          "ESTATUTO - IGUALDADE RACIAL",
          "ESTATUTO - MILITARES",
          
          // LEIS PENAIS ESPECIAIS (12)
          "LMP – Lei Maria da Penha",
          "LD – Lei de Drogas",
          "LCH – Lei de Crimes Hediondos",
          "LAA – Lei de Abuso de Autoridade",
          "LT – Lei de Tortura",
          "LCA – Lei de Crimes Ambientais",
          "LR – Lei de Racismo",
          "LOC – Lei de Organizações Criminosas",
          "LIT – Lei de Interceptação Telefônica",
          "LJE – Lei dos Juizados Especiais",
          "LEP – Lei de Execução Penal",
          "LLD – Lei de Lavagem de Dinheiro",
          "Lei 11.340 de 2006 - Maria da Penha",
          "Lei 11.343 de 2006 - Lei de Drogas",
          "Lei 8072 de 1990 - Crimes Hediondos",
          "Lei 13869 de 2019 - Abuso de Autoridade",
          "Lei 9455 de 1997 - Tortura",
          "Lei 9605 de 1998 - Crimes Ambientais",
          "Lei 7716 de 1989 - Racismo",
          "Lei 12850 de 2013 - Organizações Criminosas",
          "Lei 9296 de 1996 - Interceptação Telefônica",
          "Lei 9099 de 1995 - Juizados Especiais",
          "Lei 7210 de 1984 - Execução Penal",
          "Lei 9613 de 1998 - Lavagem de Dinheiro",
          
          // LEIS ORDINÁRIAS (30+)
          "LGPD – Lei Geral de Proteção de Dados",
          "LLIC – Lei de Licitações",
          "LIA – Lei de Improbidade Administrativa",
          "LACP – Lei de Ação Civil Pública",
          "LMS – Lei do Mandado de Segurança",
          "LHD – Lei do Habeas Data",
          "LAP – Lei de Ação Popular",
          "LAG – Lei de Alimentos Gravídicos",
          "LARB – Lei de Arbitragem",
          "LLOC – Lei de Locações",
          "LDIV – Lei do Divórcio",
          "LINQ – Lei do Inquilinato",
          "LPRG – Lei do Pregão",
          "LCP – Lei de Consórcios Públicos",
          "LPPP – Lei de PPP",
          "LCON – Lei de Concessões",
          "LPA – Lei de Processo Administrativo",
          "L8112 – Lei do Servidor Federal",
          "MCI – Marco Civil da Internet",
          "LRF – Lei de Falências",
          "LEI 14133 - LICITACOES",
          "LEI 13709 - LGPD",
          "LEI 8429 - IMPROBIDADE",
          "LEI 7347 - ACAO CIVIL PUBLICA",
          "LEI 12016 - MANDADO SEGURANCA",
          "LEI 9507 - HABEAS DATA",
          "LEI 4717 - ACAO POPULAR",
          "LEI 11804 - ALIMENTOS GRAVIDICOS",
          "LEI 9307 - ARBITRAGEM",
          "LEI 8245 - LOCACOES",
          "LEI 6515 - DIVORCIO",
          "LEI 10520 - PREGAO",
          "LEI 11107 - CONSORCIOS PUBLICOS",
          "LEI 11079 - PPP",
          "LEI 8987 - CONCESSOES",
          "LEI 9784 - PROCESSO ADMINISTRATIVO",
          "LEI 8112 - SERVIDOR FEDERAL",
          "LEI 12965 - MARCO CIVIL INTERNET",
          "LEI 11101 - FALENCIAS",
          
          // LEIS COMPLEMENTARES (2)
          "LC101 – Lei de Responsabilidade Fiscal",
          "LC135 – Lei da Ficha Limpa",
          "LC 101 - RESPONSABILIDADE FISCAL",
          "LC 135 - FICHA LIMPA",
          
          // SÚMULAS (7)
          "SUMULAS_STF",
          "SUMULAS_VINCULANTES",
          "SUMULAS_STJ",
          "SUMULAS_TST",
          "SUMULAS_TSE",
          "SUMULAS_TNU",
          "SUMULAS_CARF",
          "SUMULAS STF",
          "SUMULAS VINCULANTES",
          "SUMULAS STJ",
          "SUMULAS TST",
          "SUMULAS TSE",
          "SUMULAS TNU",
          "SUMULAS CARF",
          
          // ENUNCIADOS (2)
          "ENUNCIADOS CNJ",
          "ENUNCIADOS CNMP",
          "ENUNCIADOS_CNJ",
          "ENUNCIADOS_CNMP",
        ];
      } else {
        // Filtrar apenas tabelas de leis
        const padroes = [
          /^CC\s*-/i, /^CP\s*-/i, /^CPC/i, /^CPP/i, /^CLT/i, /^CF\s*-/i, 
          /^CDC/i, /^CTB/i, /^CTN/i, /^CPM/i, /^CPPM/i, /^CE\s*-/i,
          /^CBA/i, /^CBT/i, /^CA\s*-/i, /^CDM/i, /^CCOM/i, /^CPI/i, /^CDUS/i,
          /^ECA/i, /^EI\s*-/i, /^EOAB/i, /^EPCD/i, /^ET\s*-/i, /^ED\s*-/i,
          /^EIR/i, /^EC\s*-/i, /^ER\s*-/i, /^Estatuto/i,
          /^LMP/i, /^LD\s*-/i, /^LCH/i, /^LAA/i, /^LT\s*-/i, /^LCA/i,
          /^LR\s*-/i, /^LOC/i, /^LIT/i, /^LJE/i, /^LEP/i, /^LLD/i,
          /^LGPD/i, /^LLIC/i, /^LIA/i, /^LACP/i, /^LMS/i, /^LHD/i,
          /^LAP/i, /^LAG/i, /^LARB/i, /^LLOC/i, /^LDIV/i, /^LINQ/i,
          /^LPRG/i, /^LCP/i, /^LPPP/i, /^LCON/i, /^LPA/i, /^L8112/i,
          /^MCI/i, /^LRF/i, /^LC\s*\d/i, /^LC101/i, /^LC135/i,
          /^Lei\s+\d/i, /^LEI\s+\d/i, /^SUMULAS/i, /^ENUNCIADOS/i,
          /^ESTATUTO\s*-/i
        ];
        
        tabelasLeis = (allTables as string[]).filter((tabela: string) => 
          padroes.some(padrao => padrao.test(tabela))
        );
      }
      
      // Remover duplicatas
      const tabelasUnicas = [...new Set(tabelasLeis)].sort();
      
      console.log(`[exportar-leis-sheets] Encontradas ${tabelasUnicas.length} tabelas de leis`);
      
      return new Response(JSON.stringify({
        success: true,
        tabelas: tabelasUnicas,
        total: tabelasUnicas.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AÇÃO: Exportar uma tabela específica
    if (acao === 'exportar' && tabela) {
      console.log(`[exportar-leis-sheets] Exportando tabela: ${tabela}`);
      
      const lim = limite || 5000;
      const off = offset || 0;
      
      try {
        const { data, error, count } = await supabase
          .from(tabela)
          .select('*', { count: 'exact' })
          .order('id', { ascending: true })
          .range(off, off + lim - 1);

        if (error) {
          console.error(`[exportar-leis-sheets] Erro ao buscar ${tabela}:`, error);
          return new Response(JSON.stringify({
            success: false,
            tabela,
            error: error.message,
            dados: [],
            total: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`[exportar-leis-sheets] ${tabela}: ${count} registros encontrados`);

        return new Response(JSON.stringify({
          success: true,
          tabela,
          dados: data || [],
          total: count || 0,
          limite: lim,
          offset: off,
          temMais: (count || 0) > off + lim
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.error(`[exportar-leis-sheets] Exceção ao buscar ${tabela}:`, err);
        return new Response(JSON.stringify({
          success: false,
          tabela,
          error: err.message || 'Tabela não encontrada',
          dados: [],
          total: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // AÇÃO: Obter estatísticas gerais
    if (acao === 'estatisticas') {
      console.log('[exportar-leis-sheets] Gerando estatísticas...');
      
      const categorias = {
        codigos: 0,
        estatutos: 0,
        leis_penais: 0,
        leis_ordinarias: 0,
        leis_complementares: 0,
        sumulas: 0,
        enunciados: 0
      };
      
      // Buscar contagem de algumas tabelas principais
      const tabelasPrincipais = [
        { nome: "CF - Constituição Federal", categoria: "codigos" },
        { nome: "CC - Código Civil", categoria: "codigos" },
        { nome: "CP - Código Penal", categoria: "codigos" },
        { nome: "CLT - Consolidação das Leis do Trabalho", categoria: "codigos" },
      ];
      
      let totalArtigos = 0;
      
      for (const tab of tabelasPrincipais) {
        try {
          const { count } = await supabase
            .from(tab.nome)
            .select('*', { count: 'exact', head: true });
          if (count) totalArtigos += count;
        } catch (e) {
          // Ignorar erros
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        estatisticas: {
          totalArtigos,
          categorias,
          ultimaAtualizacao: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ação padrão: mostrar ajuda
    return new Response(JSON.stringify({
      success: true,
      mensagem: 'Edge Function exportar-leis-sheets',
      acoes_disponiveis: [
        'listar_tabelas - Lista todas as tabelas de leis disponíveis',
        'exportar - Exporta dados de uma tabela específica (requer: tabela)',
        'estatisticas - Retorna estatísticas gerais'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[exportar-leis-sheets] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
