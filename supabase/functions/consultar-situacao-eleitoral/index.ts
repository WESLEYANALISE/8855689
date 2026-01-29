import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { cpf, dataNascimento } = await req.json();
    
    console.log('Consultando situação eleitoral para CPF:', cpf?.substring(0, 3) + '***');

    // Simulação de consulta ao TSE
    // Em produção, usar API real do TSE quando disponível
    const situacaoMock = {
      situacao: "regular",
      mensagem: "Título de eleitor regular e apto para votar",
      titulo: "1234 5678 9012",
      zona: "123",
      secao: "0456",
      municipio: "São Paulo/SP",
      localVotacao: "Escola Municipal João Silva - Rua das Flores, 123",
      biometria: true,
    };

    return new Response(
      JSON.stringify(situacaoMock),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao consultar situação eleitoral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao consultar situação eleitoral',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
