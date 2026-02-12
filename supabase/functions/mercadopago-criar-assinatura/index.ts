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
    const { planType, userEmail, userId } = await req.json();

    if (!planType || !userEmail || !userId) {
      return new Response(
        JSON.stringify({ error: 'planType, userEmail e userId são obrigatórios' }),
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

    const baseUrl = 'https://direito-premium.lovable.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // PLANO ESSENCIAL: R$ 14,99/mês - Preapproval (Assinatura recorrente)
    if (planType === 'essencial') {
      console.log('Criando assinatura recorrente (Preapproval) para plano essencial...');
      console.log('Email do pagador:', userEmail);
      
      const preapprovalBody = {
        reason: 'Direito Premium - Plano Essencial',
        external_reference: `${userId}|essencial`,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 14.99,
          currency_id: 'BRL'
        },
        back_url: `${baseUrl}/assinatura/callback`,
        status: 'pending'
      };

      console.log('Preapproval body:', JSON.stringify(preapprovalBody));

      const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}`
        },
        body: JSON.stringify(preapprovalBody)
      });

      const mpData = await mpResponse.json();
      console.log('Resposta do Mercado Pago (Preapproval Essencial):', JSON.stringify(mpData));

      if (!mpResponse.ok) {
        console.error('Erro do Mercado Pago:', mpData);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar assinatura no Mercado Pago', details: mpData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_preapproval_id: mpData.id,
          mp_payer_email: userEmail,
          status: 'pending',
          plan_type: 'essencial',
          amount: 14.99
        });

      if (dbError) {
        console.error('Erro ao salvar assinatura no banco:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          init_point: mpData.init_point,
          preapproval_id: mpData.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PLANO MENSAL (legacy): R$ 21,90/mês
    if (planType === 'mensal') {
      console.log('Criando assinatura recorrente (Preapproval) para plano mensal...');
      
      const preapprovalBody = {
        reason: 'Direito Premium - Plano Mensal',
        external_reference: `${userId}|mensal`,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 21.90,
          currency_id: 'BRL'
        },
        back_url: `${baseUrl}/assinatura/callback`,
        status: 'pending'
      };

      const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}`
        },
        body: JSON.stringify(preapprovalBody)
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Erro ao criar assinatura no Mercado Pago', details: mpData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_preapproval_id: mpData.id,
          mp_payer_email: userEmail,
          status: 'pending',
          plan_type: 'mensal',
          amount: 21.90
        });

      if (dbError) {
        console.error('Erro ao salvar assinatura no banco:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          init_point: mpData.init_point,
          preapproval_id: mpData.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PLANO ANUAL (legacy)
    if (planType === 'anual') {
      console.log('Criando pagamento parcelado (Checkout Pro) para plano anual...');
      
      const preferenceBody = {
        items: [{
          title: 'Direito Premium - Plano Anual',
          quantity: 1,
          unit_price: 179.90,
          currency_id: 'BRL',
          description: 'Acesso premium anual - 12x R$ 14,99'
        }],
        payer: { email: userEmail },
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "debit_card" },
            { id: "bank_transfer" }
          ],
          default_installments: 12,
          installments: 12
        },
        back_urls: {
          success: `${baseUrl}/assinatura/callback`,
          failure: `${baseUrl}/assinatura/callback`,
          pending: `${baseUrl}/assinatura/callback`
        },
        auto_return: 'approved',
        external_reference: `${userId}|anual`,
        statement_descriptor: 'DIREITO PREMIUM'
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}`
        },
        body: JSON.stringify(preferenceBody)
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Erro ao criar pagamento no Mercado Pago', details: mpData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_preapproval_id: mpData.id,
          mp_payer_email: userEmail,
          status: 'pending',
          plan_type: 'anual',
          amount: 179.90
        });

      if (dbError) {
        console.error('Erro ao salvar assinatura no banco:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          init_point: mpData.init_point,
          preapproval_id: mpData.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PLANO PRO: R$ 19,90/mês - Preapproval (Assinatura recorrente com Evelyn)
    if (planType === 'pro') {
      console.log('Criando assinatura recorrente (Preapproval) para plano pro...');
      console.log('Email do pagador:', userEmail);
      
      const preapprovalBody = {
        reason: 'Direito Premium - Plano Pro',
        external_reference: `${userId}|pro`,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 19.90,
          currency_id: 'BRL'
        },
        back_url: `${baseUrl}/assinatura/callback`,
        status: 'pending'
      };

      console.log('Preapproval body:', JSON.stringify(preapprovalBody));

      const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}`
        },
        body: JSON.stringify(preapprovalBody)
      });

      const mpData = await mpResponse.json();
      console.log('Resposta do Mercado Pago (Preapproval Pro):', JSON.stringify(mpData));

      if (!mpResponse.ok) {
        console.error('Erro do Mercado Pago:', mpData);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar assinatura no Mercado Pago', details: mpData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          mp_preapproval_id: mpData.id,
          mp_payer_email: userEmail,
          status: 'pending',
          plan_type: 'pro',
          amount: 19.90
        });

      if (dbError) {
        console.error('Erro ao salvar assinatura no banco:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          init_point: mpData.init_point,
          preapproval_id: mpData.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Tipo de plano inválido. Use "essencial", "pro", "mensal" ou "anual".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
