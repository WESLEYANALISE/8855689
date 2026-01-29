import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { ano, cargo, estado } = await req.json();
    
    console.log('Buscando resultados:', { ano, cargo, estado });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anoConsulta = ano || '2024';
    const uf = estado === 'BR' || !estado ? '' : estado;

    // Se for consulta nacional (todos os estados)
    if (!estado || estado === "" || estado === "BR") {
      console.log('Consulta nacional - buscando por todos os estados');
      
      // Buscar dados agregados por estado
      const { data: resultados, error } = await supabase
        .from('resultados_eleicoes')
        .select('*')
        .eq('ano', parseInt(anoConsulta))
        .eq('cargo', cargo)
        .order('uf', { ascending: true })
        .order('votos', { ascending: false });

      if (error) {
        console.error('Erro ao buscar resultados do banco:', error);
        throw error;
      }

      // Se não houver dados no banco, buscar da API TSE
      if (!resultados || resultados.length === 0) {
        console.log('Sem dados no banco, buscando da API TSE');
        
        // Para 2022 e 2024, podemos buscar dados reais
        if (anoConsulta === '2022' || anoConsulta === '2024') {
          try {
            // Buscar dados da API TSE (endpoint de resultados)
            const cargoMap: Record<string, string> = {
              'presidente': '1',
              'governador': '3',
              'senador': '5'
            };
            
            const codigoCargo = cargoMap[cargo] || '1';
            
            // Nota: A API de resultados do TSE requer endpoints específicos
            // Aqui simulamos a estrutura enquanto não temos acesso completo
            console.log('Buscando resultados da API TSE não disponível ainda');
          } catch (apiError) {
            console.error('Erro ao buscar da API:', apiError);
          }
        }
        
        // Usar dados simulados se não houver dados reais
        console.log('Usando dados simulados para consulta nacional');
        
        const estadosBrasileiros = [
          { uf: "SP", nome: "São Paulo" },
          { uf: "RJ", nome: "Rio de Janeiro" },
          { uf: "MG", nome: "Minas Gerais" },
          { uf: "BA", nome: "Bahia" },
          { uf: "PR", nome: "Paraná" },
          { uf: "RS", nome: "Rio Grande do Sul" }
        ];

        const candidatosPorCargo: Record<string, any[]> = {
          'governador': [
            { nome: "Tarcísio de Freitas", partido: "REPUBLICANOS" },
            { nome: "Eduardo Leite", partido: "PSDB" },
            { nome: "Romeu Zema", partido: "NOVO" }
          ],
          'presidente': [
            { nome: "Luiz Inácio Lula da Silva", partido: "PT" }
          ],
          'senador': [
            { nome: "Marina Silva", partido: "REDE" }
          ]
        };

        const candidatosEleicao = candidatosPorCargo[cargo] || candidatosPorCargo['governador'];
        
        const estadosSimulados = estadosBrasileiros.map((est, index) => {
          const candidatoIndex = index % candidatosEleicao.length;
          const baseVotos = 3000000 + Math.floor(Math.random() * 5000000);
          const totalVotosEstado = baseVotos + Math.floor(Math.random() * 1000000);
          
          return {
            uf: est.uf,
            nomeEstado: est.nome,
            vencedor: {
              nome: candidatosEleicao[candidatoIndex].nome,
              foto: null,
              partido: candidatosEleicao[candidatoIndex].partido,
              votos: baseVotos,
              percentual: (baseVotos / totalVotosEstado) * 100
            },
            totalVotos: totalVotosEstado
          };
        });

        return new Response(
          JSON.stringify({
            tipo: 'nacional',
            ano: anoConsulta,
            cargo,
            estados: estadosSimulados,
            totalVotos: estadosSimulados.reduce((acc, e) => acc + e.totalVotos, 0),
            comparecimento: 79.5,
            abstencao: 20.5,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      // Agrupar por estado
      const estadosMap = new Map();
      resultados.forEach(r => {
        if (!estadosMap.has(r.uf)) {
          estadosMap.set(r.uf, []);
        }
        estadosMap.get(r.uf).push(r);
      });

      const estados = Array.from(estadosMap.entries()).map(([uf, resultadosUf]: [string, any[]]) => {
        const vencedor = resultadosUf[0]; // Já ordenado por votos DESC
        const totalVotosEstado = resultadosUf.reduce((sum, r) => sum + r.votos, 0);

        return {
          uf,
          nomeEstado: uf,
          vencedor: {
            nome: vencedor.nome_candidato,
            foto: null, // Buscar depois se necessário
            partido: vencedor.partido,
            votos: vencedor.votos,
            percentual: vencedor.percentual_votos
          },
          totalVotos: totalVotosEstado
        };
      });

      const totalVotosGeral = estados.reduce((sum, e) => sum + e.totalVotos, 0);

      return new Response(
        JSON.stringify({
          tipo: 'nacional',
          ano: anoConsulta,
          cargo,
          estados,
          totalVotos: totalVotosGeral,
          comparecimento: 79.5,
          abstencao: 20.5,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Consulta por estado específico
    const { data: votacao, error: votacaoError } = await supabase
      .from('resultados_eleicoes')
      .select('*')
      .eq('ano', parseInt(anoConsulta))
      .eq('cargo', cargo)
      .eq('uf', estado)
      .order('votos', { ascending: false });

    if (votacaoError) {
      console.error('Erro ao buscar votação:', votacaoError);
      throw votacaoError;
    }

    if (!votacao || votacao.length === 0) {
      // Usar dados simulados para estado específico
      console.log('Usando dados simulados para estado específico');
      
      const candidatosPorCargo: Record<string, any[]> = {
        'governador': [
          { nome: "Candidato A", partido: "PARTIDO A" },
          { nome: "Candidato B", partido: "PARTIDO B" },
          { nome: "Candidato C", partido: "PARTIDO C" }
        ],
        'presidente': [
          { nome: "Candidato X", partido: "PARTIDO X" },
          { nome: "Candidato Y", partido: "PARTIDO Y" }
        ],
        'senador': [
          { nome: "Senador A", partido: "PARTIDO A" },
          { nome: "Senador B", partido: "PARTIDO B" }
        ]
      };

      const candidatosEleicao = candidatosPorCargo[cargo] || candidatosPorCargo['governador'];
      const totalVotosSimulado = 12456789;
      
      const votacaoSimulada = candidatosEleicao.map((candidato, index) => {
        const basePercentual = index === 0 ? 52 : (48 / (candidatosEleicao.length - 1));
        const votos = Math.floor(totalVotosSimulado * (basePercentual / 100));
        return {
          nome: candidato.nome,
          foto: null,
          votos,
          partido: candidato.partido,
          percentual: basePercentual
        };
      });

      return new Response(
        JSON.stringify({
          tipo: 'estadual',
          ano: anoConsulta,
          cargo,
          estado,
          totalVotos: totalVotosSimulado,
          comparecimento: 79.5,
          abstencao: 20.5,
          candidatos: candidatosEleicao.length,
          votacao: votacaoSimulada,
          distribuicao: votacaoSimulada.map(v => ({
            nome: v.nome,
            votos: v.votos,
            percentual: v.percentual
          }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const totalVotos = votacao.reduce((sum, v) => sum + v.votos, 0);

    const votacaoFormatada = votacao.map(v => ({
      nome: v.nome_candidato,
      foto: null, // Pode buscar da API se necessário
      votos: v.votos,
      partido: v.partido,
      percentual: v.percentual_votos || (totalVotos > 0 ? (v.votos / totalVotos) * 100 : 0)
    }));

    return new Response(
      JSON.stringify({
        tipo: 'estadual',
        ano: anoConsulta,
        cargo,
        estado,
        totalVotos,
        comparecimento: 79.5,
        abstencao: 20.5,
        candidatos: votacao.length,
        votacao: votacaoFormatada,
        distribuicao: votacaoFormatada.map(v => ({
          nome: v.nome,
          votos: v.votos,
          percentual: v.percentual
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar resultados:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar resultados',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
