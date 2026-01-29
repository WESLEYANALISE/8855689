import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo } = await req.json();
    
    if (!codigo) {
      throw new Error('Código do senador é obrigatório');
    }

    console.log('Buscando detalhes do senador:', codigo);

    // API do Senado Federal - Detalhes do parlamentar
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${codigo}.json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const parlamentar = data.DetalheParlamentar?.Parlamentar;
    
    if (!parlamentar) {
      throw new Error('Senador não encontrado');
    }

    // Formatar dados
    const senador = {
      codigo: parlamentar.IdentificacaoParlamentar?.CodigoParlamentar,
      nome: parlamentar.IdentificacaoParlamentar?.NomeParlamentar,
      nomeCompleto: parlamentar.IdentificacaoParlamentar?.NomeCompletoParlamentar,
      foto: parlamentar.IdentificacaoParlamentar?.UrlFotoParlamentar,
      partido: parlamentar.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
      uf: parlamentar.IdentificacaoParlamentar?.UfParlamentar,
      email: parlamentar.IdentificacaoParlamentar?.EmailParlamentar,
      sexo: parlamentar.IdentificacaoParlamentar?.SexoParlamentar,
      paginaWeb: parlamentar.IdentificacaoParlamentar?.UrlPaginaParlamentar,
      dataNascimento: parlamentar.DadosBasicosParlamentar?.DataNascimento,
      naturalidade: parlamentar.DadosBasicosParlamentar?.Naturalidade,
      ufNaturalidade: parlamentar.DadosBasicosParlamentar?.UfNaturalidade,
      telefones: parlamentar.Telefones?.Telefone || [],
      endereco: parlamentar.EnderecosParlamentar?.Endereco,
      mandatos: parlamentar.MandatoAtual || parlamentar.Mandatos?.Mandato || [],
      filiacaoPartidaria: parlamentar.FiliacaoAtual || parlamentar.FiliacoesPartidarias?.Filiacao || [],
      profissoes: parlamentar.Profissoes?.Profissao || [],
    };

    console.log('Detalhes do senador carregados:', senador.nome);

    return new Response(
      JSON.stringify({ senador }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar detalhes do senador:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
