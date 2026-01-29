import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de nomes de abas para nomes de tabelas no Supabase
const TABELAS_LEIS: Record<string, string> = {
  // Códigos
  "CC - Código Civil": "CC - Código Civil",
  "CP - Código Penal": "CP - Código Penal",
  "CPC - Código de Processo Civil": "CPC – Código de Processo Civil",
  "CPP - Código de Processo Penal": "CPP – Código de Processo Penal",
  "CLT": "CLT - Consolidação das Leis do Trabalho",
  "CF - Constituição Federal": "CF - Constituição Federal",
  "CDC": "CDC – Código de Defesa do Consumidor",
  "CTB": "CTB – Código de Trânsito Brasileiro",
  "CTN": "CTN – Código Tributário Nacional",
  "CPM - Código Penal Militar": "CPM – Código Penal Militar",
  "CPPM": "CPPM – Código de Processo Penal Militar",
  "CE - Código Eleitoral": "CE – Código Eleitoral",
  "CBA": "CBA Código Brasileiro de Aeronáutica",
  "CBT": "CBT Código Brasileiro de Telecomunicações",
  "CA - Código de Águas": "CA - Código de Águas",
  "CF - Código Florestal": "CF - Código Florestal",
  "CC - Código de Caça": "CC - Código de Caça",
  "CP - Código de Pesca": "CP - Código de Pesca",
  "CDM - Código de Minas": "CDM – Código de Minas",
  "CCOM - Código Comercial": "CCOM – Código Comercial",
  "CPI": "CPI - Código de Propriedade Industrial",
  "CDUS": "CDUS - Código de Defesa do Usuário",
  // Estatutos
  "ECA": "ECA – Estatuto da Criança e do Adolescente",
  "Estatuto do Idoso": "EI – Estatuto do Idoso",
  "Estatuto OAB": "EOAB – Estatuto da OAB",
  "Estatuto PCD": "EPCD – Estatuto da Pessoa com Deficiência",
  "Estatuto Torcedor": "ET – Estatuto do Torcedor",
  "Estatuto Desarmamento": "ED – Estatuto do Desarmamento",
  "Estatuto Igualdade Racial": "EIR – Estatuto da Igualdade Racial",
  "Estatuto Terra": "ET – Estatuto da Terra",
  "Estatuto Cidade": "EC – Estatuto da Cidade",
  "Estatuto Militar": "Estatuto dos Militares",
  "Estatuto Indio": "EI – Estatuto do Índio",
  "Estatuto Refugiados": "ER – Estatuto dos Refugiados",
  // Leis Penais Especiais
  "Lei Maria da Penha": "LMP – Lei Maria da Penha",
  "Lei de Drogas": "LD – Lei de Drogas",
  "Lei Crimes Hediondos": "LCH – Lei de Crimes Hediondos",
  "Lei Abuso Autoridade": "LAA – Lei de Abuso de Autoridade",
  "Lei Tortura": "LT – Lei de Tortura",
  "Lei Crimes Ambientais": "LCA – Lei de Crimes Ambientais",
  "Lei Racismo": "LR – Lei de Racismo",
  "Lei Organizações Criminosas": "LOC – Lei de Organizações Criminosas",
  "Lei Interceptação Telefônica": "LIT – Lei de Interceptação Telefônica",
  "Lei Juizados Especiais": "LJE – Lei dos Juizados Especiais",
  "Lei Execução Penal": "LEP – Lei de Execução Penal",
  "Lei Lavagem Dinheiro": "LLD – Lei de Lavagem de Dinheiro",
  // Leis Ordinárias
  "LGPD": "LGPD – Lei Geral de Proteção de Dados",
  "Lei Licitações": "LLIC – Lei de Licitações",
  "Lei Improbidade": "LIA – Lei de Improbidade Administrativa",
  "Lei Ação Civil Pública": "LACP – Lei de Ação Civil Pública",
  "Lei Mandado Segurança": "LMS – Lei do Mandado de Segurança",
  "Lei Habeas Data": "LHD – Lei do Habeas Data",
  "Lei Ação Popular": "LAP – Lei de Ação Popular",
  "Lei Alimentos Gravídicos": "LAG – Lei de Alimentos Gravídicos",
  "Lei Arbitragem": "LARB – Lei de Arbitragem",
  "Lei Locações": "LLOC – Lei de Locações",
  "Lei Divórcio": "LDIV – Lei do Divórcio",
  "Lei Inquilinato": "LINQ – Lei do Inquilinato",
  "Lei Pregão": "LPRG – Lei do Pregão",
  "Lei Consórcios Públicos": "LCP – Lei de Consórcios Públicos",
  "Lei PPP": "LPPP – Lei de PPP",
  "Lei Concessões": "LCON – Lei de Concessões",
  "Lei Processo Administrativo": "LPA – Lei de Processo Administrativo",
  "Lei Servidor Federal": "L8112 – Lei do Servidor Federal",
  "Marco Civil Internet": "MCI – Marco Civil da Internet",
  "Lei Falências": "LRF – Lei de Falências",
  // Leis Complementares
  "LC 101 - LRF": "LC101 – Lei de Responsabilidade Fiscal",
  "LC 135 - Ficha Limpa": "LC135 – Lei da Ficha Limpa",
  // Súmulas
  "Súmulas STF": "SUMULAS_STF",
  "Súmulas Vinculantes": "SUMULAS_VINCULANTES",
  "Súmulas STJ": "SUMULAS_STJ",
  "Súmulas TST": "SUMULAS_TST",
  "Súmulas TSE": "SUMULAS_TSE",
  "Súmulas TNU": "SUMULAS_TNU",
  "Súmulas CARF": "SUMULAS_CARF",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, operacao, tabela, dados, registro } = await req.json();
    
    // Validar API key
    const expectedKey = Deno.env.get('SHEETS_SYNC_API_KEY') || Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (apiKey !== expectedKey) {
      console.error('[sync-leis-sheets] API Key inválida');
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

    // Encontrar o nome correto da tabela no Supabase
    const nomeTabela = TABELAS_LEIS[tabela] || tabela;
    
    console.log(`[sync-leis-sheets] Operação: ${operacao}, Tabela: ${nomeTabela}`);

    if (operacao === 'atualizar') {
      // Atualizar um registro específico
      if (!registro || !registro.id) {
        throw new Error('Registro com ID é obrigatório para atualização');
      }

      const { id, ...camposAtualizar } = registro;
      
      // Remover campos vazios
      const camposLimpos: Record<string, any> = {};
      for (const [key, value] of Object.entries(camposAtualizar)) {
        if (value !== undefined && value !== '') {
          camposLimpos[key] = value;
        }
      }

      const { data, error } = await supabase
        .from(nomeTabela)
        .update(camposLimpos)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[sync-leis-sheets] Erro ao atualizar:', error);
        throw error;
      }

      console.log(`[sync-leis-sheets] Registro ${id} atualizado com sucesso`);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Registro ${id} atualizado na tabela ${nomeTabela}`,
        data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (operacao === 'inserir') {
      // Inserir novo registro
      if (!registro) {
        throw new Error('Registro é obrigatório para inserção');
      }

      const { data, error } = await supabase
        .from(nomeTabela)
        .insert(registro)
        .select();

      if (error) {
        console.error('[sync-leis-sheets] Erro ao inserir:', error);
        throw error;
      }

      console.log(`[sync-leis-sheets] Novo registro inserido`);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Novo registro inserido na tabela ${nomeTabela}`,
        data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (operacao === 'deletar') {
      // Deletar registro
      if (!registro || !registro.id) {
        throw new Error('ID é obrigatório para deleção');
      }

      const { error } = await supabase
        .from(nomeTabela)
        .delete()
        .eq('id', registro.id);

      if (error) {
        console.error('[sync-leis-sheets] Erro ao deletar:', error);
        throw error;
      }

      console.log(`[sync-leis-sheets] Registro ${registro.id} deletado`);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Registro ${registro.id} deletado da tabela ${nomeTabela}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (operacao === 'lote') {
      // Atualização em lote
      if (!dados || !Array.isArray(dados)) {
        throw new Error('Array de dados é obrigatório para operação em lote');
      }

      let atualizados = 0;
      let erros = 0;

      for (const item of dados) {
        if (!item.id) continue;
        
        const { id, ...camposAtualizar } = item;
        const { error } = await supabase
          .from(nomeTabela)
          .update(camposAtualizar)
          .eq('id', id);

        if (error) {
          console.error(`[sync-leis-sheets] Erro ao atualizar ${id}:`, error);
          erros++;
        } else {
          atualizados++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Lote processado: ${atualizados} atualizados, ${erros} erros`,
        estatisticas: { atualizados, erros }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Operação não reconhecida. Use: atualizar, inserir, deletar ou lote'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[sync-leis-sheets] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
