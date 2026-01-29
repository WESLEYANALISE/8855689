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

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      // Tentar pegar do body
      const body = await req.json().catch(() => ({}));
      if (!body.token) {
        throw new Error('Token não fornecido');
      }
    }

    const tokenFinal = token || (await req.json().catch(() => ({}))).token;

    console.log('Processando cancelamento para token:', tokenFinal);

    // Buscar inscrito pelo token
    const { data: inscrito, error: buscaError } = await supabase
      .from('push_legislacao_inscritos')
      .select('id, email, nome, ativo')
      .eq('token_confirmacao', tokenFinal)
      .single();

    if (buscaError || !inscrito) {
      console.error('Inscrito não encontrado:', buscaError);
      throw new Error('Inscrição não encontrada');
    }

    if (!inscrito.ativo) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Esta inscrição já estava cancelada',
          email: inscrito.email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Desativar inscrição
    const { error: updateError } = await supabase
      .from('push_legislacao_inscritos')
      .update({ 
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', inscrito.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Inscrição cancelada para ${inscrito.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Inscrição cancelada com sucesso',
        email: inscrito.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
