import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração do Mercado Pago ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar assinatura ativa do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'authorized')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !subscription) {
      console.log('Nenhuma assinatura ativa encontrada');
      return new Response(
        JSON.stringify({ error: 'Nenhuma assinatura ativa encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é assinatura recorrente ou pagamento único
    if (subscription.mp_preapproval_id) {
      // Assinatura recorrente - cancelar no Mercado Pago
      console.log('Cancelando assinatura recorrente no Mercado Pago:', subscription.mp_preapproval_id);
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.mp_preapproval_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpAccessToken}`
          },
          body: JSON.stringify({ status: 'cancelled' })
        }
      );

      const mpData = await mpResponse.json();
      console.log('Resposta do Mercado Pago:', JSON.stringify(mpData));

      if (!mpResponse.ok) {
        console.error('Erro do Mercado Pago:', mpData);
        return new Response(
          JSON.stringify({ error: 'Erro ao cancelar assinatura no Mercado Pago', details: mpData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Pagamento único (PIX/Cartão) - não há assinatura recorrente no MP
      console.log('Pagamento único detectado (PIX/Cartão) - cancelando apenas no banco local');
      console.log('mp_payment_id:', subscription.mp_payment_id);
    }

    // Atualizar status no banco (para ambos os casos)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Erro ao atualizar status no banco:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status no banco', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==== ENVIAR NOTIFICAÇÃO WHATSAPP DE CANCELAMENTO ====
    try {
      // Buscar telefone do usuário na tabela profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('telefone, nome, phone')
        .eq('id', userId)
        .maybeSingle();
      
      let telefone = profile?.telefone || profile?.phone;
      const nome = profile?.nome || 'estudante';
      
      if (telefone) {
        const numeros = telefone.replace(/\D/g, '');
        // Validar formato brasileiro (12-13 dígitos)
        if (numeros.length >= 12 && numeros.length <= 13) {
          const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
          const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
          const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';
          
          if (evolutionUrl && evolutionKey) {
            const numero = numeros.startsWith('55') ? numeros : `55${numeros}`;
            
            // Calcular data de expiração (para planos com período definido)
            const dataExpiracao = subscription.expires_at 
              ? new Date(subscription.expires_at).toLocaleDateString('pt-BR')
              : null;
            
            const mensagemCancelamento = `📋 *Assinatura Cancelada*

Olá, ${nome}! Sua assinatura foi cancelada com sucesso.

${dataExpiracao ? `✅ Você ainda tem acesso Premium até *${dataExpiracao}*.` : ''}

Esperamos te ver em breve! Se mudar de ideia, digite *assinar* a qualquer momento.

Atenciosamente,
*Evelyn* 💜`;
            
            console.log(`Enviando notificação de cancelamento para: ${numero}`);
            
            await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
              },
              body: JSON.stringify({
                number: `${numero}@s.whatsapp.net`,
                text: mensagemCancelamento,
              }),
            });
            
            console.log('Notificação de cancelamento enviada via WhatsApp');
          }
        }
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificação de cancelamento:', notifError);
      // Não falhar a operação por erro de notificação
    }

    const tipoAssinatura = subscription.mp_preapproval_id ? 'recorrente' : 'pagamento único';
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Assinatura (${tipoAssinatura}) cancelada com sucesso`,
        tipo: tipoAssinatura
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
