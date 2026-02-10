import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { amount: number; days: number; description: string }> = {
  mensal: { amount: 17.99, days: 30, description: 'Direito Premium - Mensal' },
  anual: { amount: 69.90, days: 365, description: 'Direito Premium - Anual' },
  vitalicio: { amount: 89.90, days: 36500, description: 'Direito Premium - Vitalício' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, userId, userEmail, planType, installments, paymentMethodId, identificationType, identificationNumber } = await req.json();

    console.log(`Processando pagamento cartão - Plano: ${planType}, User: ${userId}`);

    if (!token || !userId || !userEmail || !planType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = PLANS[planType];
    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Plano inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de pagamento ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar pagamento com token do cartão
    const paymentData = {
      transaction_amount: plan.amount,
      token: token,
      description: plan.description,
      installments: installments || 1,
      payment_method_id: paymentMethodId || 'visa',
      payer: {
        email: userEmail,
        identification: identificationType && identificationNumber ? {
          type: identificationType,
          number: identificationNumber
        } : undefined
      },
      external_reference: `${userId}|${planType}`,
      statement_descriptor: 'DIREITO PREMIUM'
    };

    console.log('Enviando pagamento para Mercado Pago...');
    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${planType}-card-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();
    console.log('Resposta completa MP:', JSON.stringify(mpData, null, 2));
    console.log(`HTTP Status: ${mpResponse.status}, Payment Status: ${mpData.status}, Detail: ${mpData.status_detail}`);

    if (mpData.status === 'approved') {
      // Salvar assinatura no Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + plan.days);

      const { error: insertError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'authorized',
        plan_type: planType,
        amount: plan.amount,
        mp_payment_id: String(mpData.id),
        mp_payer_email: userEmail,
        payment_method: 'credit_card',
        expiration_date: expirationDate.toISOString(),
        last_payment_date: new Date().toISOString()
      });

      if (insertError) {
        console.error('Erro ao salvar assinatura:', insertError);
      } else {
        console.log('Assinatura salva com sucesso');
        
        // Notificar usuário via Evelyn WhatsApp
        try {
          await supabase.functions.invoke('evelyn-notificar-pagamento', {
            body: {
              userId,
              planType,
              amount: plan.amount,
              paymentMethod: 'card',
              expirationDate: expirationDate.toISOString()
            }
          });
          console.log('Notificação Evelyn enviada');
        } catch (notifyErr) {
          console.error('Erro ao notificar Evelyn:', notifyErr);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentId: mpData.id,
          status: 'approved',
          message: 'Pagamento aprovado com sucesso!'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pagamento em análise - tratar como pendente (não erro)
    if (mpData.status === 'in_process' || mpData.status === 'pending') {
      // Salvar assinatura como pendente
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + plan.days);

      await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'pending',
        plan_type: planType,
        amount: plan.amount,
        mp_payment_id: String(mpData.id),
        mp_payer_email: userEmail,
        payment_method: 'credit_card',
        expiration_date: expirationDate.toISOString(),
        last_payment_date: new Date().toISOString()
      });

      console.log('Pagamento pendente salvo, aguardando aprovação');

      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentId: mpData.id,
          status: 'pending',
          message: 'Pagamento em análise. Você será notificado quando for aprovado!'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pagamento não aprovado - mapear erros
    const errorMessages: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão',
      'cc_rejected_bad_filled_card_number': 'Número do cartão incorreto',
      'cc_rejected_bad_filled_date': 'Data de validade incorreta',
      'cc_rejected_bad_filled_security_code': 'Código de segurança incorreto',
      'cc_rejected_high_risk': 'Pagamento recusado por segurança',
      'cc_rejected_blacklist': 'Cartão não permitido',
      'cc_rejected_card_disabled': 'Cartão desativado',
      'cc_rejected_max_attempts': 'Limite de tentativas excedido',
      'cc_rejected_call_for_authorize': 'Autorização necessária junto ao banco',
      'pending_contingency': 'Processando pagamento...',
      'pending_review_manual': 'Pagamento em análise'
    };

    const userMessage = errorMessages[mpData.status_detail] || 'Pagamento não aprovado. Tente outro cartão.';

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage,
        status: mpData.status,
        status_detail: mpData.status_detail
      }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao processar pagamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
