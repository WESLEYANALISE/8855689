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
    const { instanceName, telefone, mensagem, conversaId } = await req.json();

    if (!instanceName || !telefone || !mensagem) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: instanceName, telefone, mensagem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    // Formatar número
    let numero = telefone.replace(/\D/g, '');
    if (!numero.endsWith('@s.whatsapp.net')) {
      numero = `${numero}@s.whatsapp.net`;
    }

    // Enviar via Evolution API
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        text: mensagem,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar mensagem');
    }

    // Salvar mensagem no banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('evelyn_mensagens').insert({
      conversa_id: conversaId,
      direcao: 'saida',
      tipo: 'texto',
      conteudo: mensagem,
      status: 'sent',
      metadata: { messageId: result.key?.id }
    });

    // Atualizar última mensagem da conversa
    await supabase.from('evelyn_conversas').update({
      ultima_mensagem: mensagem,
      ultima_interacao: new Date().toISOString()
    }).eq('id', conversaId);

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
