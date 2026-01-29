import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { busca, ano, tipo } = await req.json();
    
    console.log('Buscando prestação de contas:', { busca, ano, tipo });

    const anoConsulta = ano || '2024';

    // Primeiro, buscar o candidato para obter o sqCandidato
    if (!busca) {
      throw new Error('Nome do candidato é obrigatório');
    }

    // Buscar candidato (assumindo busca por SP como exemplo, pode ser ajustado)
    const buscaCandidatoUrl = `${BASE_URL}/candidatura/buscar/${anoConsulta}/SP/candidatos/${encodeURIComponent(busca)}`;
    
    console.log('Buscando candidato:', buscaCandidatoUrl);

    const candidatoResponse = await fetch(buscaCandidatoUrl, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'DireitoPremiumApp/1.0'
      }
    });

    if (!candidatoResponse.ok) {
      console.error('Erro ao buscar candidato:', candidatoResponse.status);
      throw new Error('Candidato não encontrado');
    }

    const candidatoData = await candidatoResponse.json();
    
    if (!candidatoData.candidatos || candidatoData.candidatos.length === 0) {
      throw new Error('Candidato não encontrado');
    }

    const candidato = candidatoData.candidatos[0];
    const sqCandidato = candidato.id;
    const uf = candidato.uf || 'SP';

    console.log('Candidato encontrado:', sqCandidato, uf);

    // Buscar receitas
    const receitasUrl = `${BASE_URL}/prestador/consulta/receitas/${anoConsulta}/${sqCandidato}`;
    console.log('Buscando receitas:', receitasUrl);

    let totalReceitas = 0;
    let principaisDoadores: any[] = [];

    try {
      const receitasResponse = await fetch(receitasUrl, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'DireitoPremiumApp/1.0'
        }
      });

      if (receitasResponse.ok) {
        const receitasData = await receitasResponse.json();
        
        if (receitasData && Array.isArray(receitasData)) {
          totalReceitas = receitasData.reduce((sum: number, r: any) => 
            sum + (parseFloat(r.valorReceita) || 0), 0
          );

          // Agrupar por doador
          const doadoresMap = new Map();
          receitasData.forEach((r: any) => {
            const nome = r.nomeDoador || r.nomeFornecedor || 'Doador não identificado';
            const tipo = r.tipoDoador || r.fonte || 'Não especificado';
            const valor = parseFloat(r.valorReceita) || 0;
            
            if (doadoresMap.has(nome)) {
              doadoresMap.get(nome).valor += valor;
            } else {
              doadoresMap.set(nome, { nome, tipo, valor });
            }
          });

          principaisDoadores = Array.from(doadoresMap.values())
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 4);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    }

    // Buscar despesas
    const despesasUrl = `${BASE_URL}/prestador/consulta/despesas/${anoConsulta}/${sqCandidato}`;
    console.log('Buscando despesas:', despesasUrl);

    let totalDespesas = 0;
    let principaisDespesas: any[] = [];

    try {
      const despesasResponse = await fetch(despesasUrl, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'DireitoPremiumApp/1.0'
        }
      });

      if (despesasResponse.ok) {
        const despesasData = await despesasResponse.json();
        
        if (despesasData && Array.isArray(despesasData)) {
          totalDespesas = despesasData.reduce((sum: number, d: any) => 
            sum + (parseFloat(d.valorDespesa) || 0), 0
          );

          // Agrupar por categoria
          const categoriasMap = new Map();
          despesasData.forEach((d: any) => {
            const categoria = d.especieDespesa || d.tipoDespesa || 'Não especificado';
            const fornecedor = d.nomeFornecedor || 'Não identificado';
            const valor = parseFloat(d.valorDespesa) || 0;
            
            if (categoriasMap.has(categoria)) {
              categoriasMap.get(categoria).valor += valor;
            } else {
              categoriasMap.set(categoria, { categoria, fornecedor, valor });
            }
          });

          principaisDespesas = Array.from(categoriasMap.values())
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 7);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
    }

    // Se não conseguiu buscar dados reais, retornar mensagem informativa
    if (totalReceitas === 0 && totalDespesas === 0) {
      return new Response(
        JSON.stringify({
          receitas: 0,
          despesas: 0,
          principaisDoadores: [],
          principaisDespesas: [],
          mensagem: 'Dados de prestação de contas ainda não disponíveis para este candidato/ano',
          candidato: candidato.nomeUrna || candidato.nomeCompleto
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const contas = {
      receitas: totalReceitas,
      despesas: totalDespesas,
      principaisDoadores,
      principaisDespesas,
      candidato: candidato.nomeUrna || candidato.nomeCompleto
    };

    return new Response(
      JSON.stringify(contas),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar prestação de contas:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar prestação de contas',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
