import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração dos planos - apenas vitalício
const PLANS = {
  vitalicio: { amount: 89.90, days: 36500, description: 'Direito Premium - Vitalício' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telefone, planType, nome } = await req.json();

    console.log('[evelyn-gerar-pix] Gerando PIX para WhatsApp:', { telefone, planType, nome });

    // Validações
    if (!telefone) {
      return new Response(
        JSON.stringify({ error: 'telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      return new Response(
        JSON.stringify({ error: 'planType deve ser mensal ou vitalicio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      console.error('[evelyn-gerar-pix] MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar email fictício baseado no telefone para o Mercado Pago
    const emailPayer = `whatsapp_${telefone}@direitopremium.com.br`;

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: plan.amount,
      description: plan.description,
      payment_method_id: 'pix',
      payer: {
        email: emailPayer,
        first_name: nome || 'Usuário WhatsApp'
      },
      external_reference: `whatsapp|${telefone}|${planType}`
    };

    console.log('[evelyn-gerar-pix] Enviando para Mercado Pago:', JSON.stringify(paymentData));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `whatsapp-${telefone}-${planType}-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();
    console.log('[evelyn-gerar-pix] Resposta Mercado Pago:', JSON.stringify(mpData));

    if (!mpResponse.ok) {
      console.error('[evelyn-gerar-pix] Erro ao criar pagamento PIX:', mpData);
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
      console.error('[evelyn-gerar-pix] Dados do QR Code não retornados:', mpData);
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

    // Buscar se existe um user_id vinculado a este telefone
    const { data: evelynUser } = await supabase
      .from('evelyn_usuarios')
      .select('user_id')
      .eq('telefone', telefone)
      .single();

    // Inserir assinatura pendente
    const subscriptionData: Record<string, unknown> = {
      status: 'pending',
      plan_type: planType,
      amount: plan.amount,
      mp_payment_id: String(mpData.id),
      mp_payer_email: emailPayer,
      payment_method: 'pix',
      expiration_date: expirationDate.toISOString(),
      whatsapp_telefone: telefone
    };

    // Se tiver user_id vinculado, usar
    if (evelynUser?.user_id) {
      subscriptionData.user_id = evelynUser.user_id;
    }

    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData);

    if (insertError) {
      console.error('[evelyn-gerar-pix] Erro ao salvar assinatura pendente:', insertError);
      // Continua mesmo com erro no banco - o webhook vai criar se necessário
    }

    console.log('[evelyn-gerar-pix] Pagamento PIX criado com sucesso:', mpData.id);

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
        planDays: plan.days,
        planDescription: plan.description
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-gerar-pix] Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
