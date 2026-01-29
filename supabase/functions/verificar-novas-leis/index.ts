import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando verificação de novas leis...');

    // Verificar se já enviamos hoje
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data: ultimoEnvio } = await supabase
      .from('push_legislacao_inscritos')
      .select('ultimo_envio')
      .order('ultimo_envio', { ascending: false })
      .limit(1)
      .single();

    if (ultimoEnvio?.ultimo_envio) {
      const dataUltimoEnvio = ultimoEnvio.ultimo_envio.split('T')[0];
      if (dataUltimoEnvio === hoje) {
        console.log('Já foi enviado push hoje');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Push já enviado hoje',
            ultimo_envio: ultimoEnvio.ultimo_envio
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar se há leis novas
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const { data: leisNovas, error: leisError } = await supabase
      .from('resenha_diaria')
      .select('id, numero_lei')
      .eq('status', 'ativo')
      .gte('data_publicacao', ontem.toISOString().split('T')[0]);

    if (leisError) {
      throw leisError;
    }

    if (!leisNovas || leisNovas.length === 0) {
      console.log('Nenhuma lei nova para enviar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma lei nova encontrada',
          leis_encontradas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${leisNovas.length} leis novas. Disparando envio...`);

    // Chamar a função de envio
    const response = await fetch(`${supabaseUrl}/functions/v1/enviar-push-legislacao`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const resultado = await response.json();

    console.log('Resultado do envio:', resultado);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push disparado com sucesso',
        leis_encontradas: leisNovas.length,
        resultado_envio: resultado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
