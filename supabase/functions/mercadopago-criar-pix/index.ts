import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração dos planos - PIX só para anual e vitalício (mensal é só cartão)
const PLANS = {
  anual: { amount: 69.90, days: 365, description: 'Direito Premium - Anual' },
  vitalicio: { amount: 29.90, days: 36500, description: 'Direito Premium - Vitalício' }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, planType } = await req.json();

    console.log('Criando pagamento PIX:', { userId, userEmail, planType });

    // Validações
    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'userId e userEmail são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar plano - PIX não disponível para mensal
    if (planType === 'mensal') {
      return new Response(
        JSON.stringify({ error: 'PIX não disponível para plano mensal. Use cartão de crédito.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      return new Response(
        JSON.stringify({ error: 'planType deve ser anual ou vitalicio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: plan.amount,
      description: plan.description,
      payment_method_id: 'pix',
      payer: {
        email: userEmail
      },
      external_reference: `${userId}|${planType}`
    };

    console.log('Enviando para Mercado Pago:', JSON.stringify(paymentData));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${planType}-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();
    console.log('Resposta Mercado Pago:', JSON.stringify(mpData));

    if (!mpResponse.ok) {
      console.error('Erro ao criar pagamento PIX:', mpData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar pagamento PIX',
          details: mpData.message || mpData.cause?.[0]?.description || 'Erro desconhecido'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados do QR Code
    const transactionData = mpData.point_of_interaction?.transaction_data;
    if (!transactionData?.qr_code_base64 || !transactionData?.qr_code) {
      console.error('Dados do QR Code não retornados:', mpData);
      return new Response(
        JSON.stringify({ error: 'Dados do QR Code não disponíveis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar pagamento pendente no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular data de expiração
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + plan.days);

    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: 'pending',
        plan_type: planType,
        amount: plan.amount,
        mp_payment_id: String(mpData.id),
        mp_payer_email: userEmail,
        payment_method: 'pix',
        expiration_date: expirationDate.toISOString()
      });

    if (insertError) {
      console.error('Erro ao salvar assinatura pendente:', insertError);
      // Continua mesmo com erro no banco - o webhook vai criar se necessário
    }

    console.log('Pagamento PIX criado com sucesso:', mpData.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mpData.id,
        qrCodeBase64: transactionData.qr_code_base64,
        qrCode: transactionData.qr_code,
        ticketUrl: transactionData.ticket_url,
        expiresAt: mpData.date_of_expiration,
        amount: plan.amount,
        planType,
        planDays: plan.days
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
