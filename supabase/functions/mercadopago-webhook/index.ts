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
    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body));

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração dos planos para calcular expiração
    const PLAN_DAYS: Record<string, number> = {
      mensal: 30,
      trimestral: 90,
      anual: 365,
      vitalicio: 36500
    };

    // Processar pagamento único (PIX, Checkout Pro)
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log('ID do pagamento não encontrado');
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Buscando detalhes do pagamento:', paymentId);
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      const paymentData = await paymentResponse.json();
      console.log('Dados do pagamento:', JSON.stringify(paymentData));

      if (!paymentResponse.ok) {
        console.error('Erro ao buscar pagamento:', paymentData);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar pagamento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Processar apenas pagamentos aprovados
      if (paymentData.status === 'approved') {
        // external_reference formato: "userId|planType" ou "whatsapp|telefone|planType"
        const externalRef = paymentData.external_reference;
        
        if (externalRef && externalRef.startsWith('whatsapp|')) {
          // Pagamento via WhatsApp (Evelyn)
          const [, telefone, planType] = externalRef.split('|');
          console.log('Processando pagamento PIX via WhatsApp para:', telefone, 'plano:', planType);

          // Calcular data de expiração baseada no plano
          const days = PLAN_DAYS[planType] || 30;
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + days);
          console.log('Data de expiração calculada:', expirationDate.toISOString(), `(${days} dias)`);

          // Atualizar assinatura existente (pendente) ou criar nova
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('id, user_id')
            .eq('mp_payment_id', String(paymentId))
            .maybeSingle();

          if (existingSubscription) {
            // Atualizar assinatura pendente
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'authorized',
                last_payment_date: new Date().toISOString(),
                expiration_date: expirationDate.toISOString(),
                payment_method: 'pix',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id);

            if (updateError) {
              console.error('Erro ao atualizar assinatura WhatsApp:', updateError);
            } else {
              console.log('Assinatura WhatsApp atualizada para authorized:', existingSubscription.id);
            }
          }

          // Atualizar evelyn_usuarios - marcar como autorizado/premium
          await supabase
            .from('evelyn_usuarios')
            .update({ 
              autorizado: true,
              periodo_teste_expirado: false,
              aviso_teste_enviado: false
            })
            .eq('telefone', telefone);

          // Enviar confirmação via WhatsApp
          try {
            const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
            const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
            const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

            if (evolutionUrl && evolutionKey) {
              const mensagemConfirmacao = `🎉 *Pagamento Confirmado!*

Sua assinatura *Direito Premium* foi ativada com sucesso!

📅 Válida até: ${expirationDate.toLocaleDateString('pt-BR')}

Agora você tem acesso ilimitado a todas as funcionalidades da Evelyn! 💜

*Como posso te ajudar?*`;

              await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionKey,
                },
                body: JSON.stringify({
                  number: `${telefone}@s.whatsapp.net`,
                  text: mensagemConfirmacao
                }),
              });
              console.log('Confirmação WhatsApp enviada para:', telefone);
            }
          } catch (whatsappErr) {
            console.error('Erro ao enviar confirmação WhatsApp:', whatsappErr);
          }

        } else if (externalRef && externalRef.includes('|')) {
          // Pagamento via App (formato original: userId|planType)
          const [userId, planType] = externalRef.split('|');
          console.log('Processando pagamento PIX aprovado para usuário:', userId, 'plano:', planType);

          // Calcular data de expiração baseada no plano
          const days = PLAN_DAYS[planType] || 30;
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + days);
          console.log('Data de expiração calculada:', expirationDate.toISOString(), `(${days} dias)`);

          // Detectar se é pagamento PIX
          const isPix = paymentData.payment_method_id === 'pix';
          console.log('Método de pagamento:', paymentData.payment_method_id, 'isPix:', isPix);

          // Atualizar assinatura existente (pendente) ou criar nova
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingSubscription) {
            // Atualizar assinatura pendente
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'authorized',
                mp_payment_id: String(paymentId),
                mp_payer_email: paymentData.payer?.email,
                last_payment_date: new Date().toISOString(),
                expiration_date: expirationDate.toISOString(),
                payment_method: isPix ? 'pix' : 'card',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id);

            if (updateError) {
              console.error('Erro ao atualizar assinatura:', updateError);
            } else {
              console.log('Assinatura atualizada para authorized:', existingSubscription.id);
              
              // Notificar usuário via Evelyn WhatsApp
              try {
                await supabase.functions.invoke('evelyn-notificar-pagamento', {
                  body: {
                    userId,
                    planType,
                    amount: paymentData.transaction_amount,
                    paymentMethod: isPix ? 'pix' : 'card',
                    expirationDate: expirationDate.toISOString()
                  }
                });
                console.log('Notificação Evelyn enviada');
              } catch (notifyErr) {
                console.error('Erro ao notificar Evelyn:', notifyErr);
              }
            }
          } else {
            // Criar nova assinatura
            const { error: insertError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                status: 'authorized',
                plan_type: planType,
                amount: paymentData.transaction_amount || 0,
                mp_payment_id: String(paymentId),
                mp_payer_email: paymentData.payer?.email,
                last_payment_date: new Date().toISOString(),
                expiration_date: expirationDate.toISOString(),
                payment_method: isPix ? 'pix' : 'card'
              });

            if (insertError) {
              console.error('Erro ao inserir assinatura:', insertError);
            } else {
              console.log('Nova assinatura criada para usuário:', userId);
              
              // Notificar usuário via Evelyn WhatsApp
              try {
                await supabase.functions.invoke('evelyn-notificar-pagamento', {
                  body: {
                    userId,
                    planType,
                    amount: paymentData.transaction_amount,
                    paymentMethod: isPix ? 'pix' : 'card',
                    expirationDate: expirationDate.toISOString()
                  }
                });
                console.log('Notificação Evelyn enviada');
              } catch (notifyErr) {
                console.error('Erro ao notificar Evelyn:', notifyErr);
              }
            }
          }

          // Notificar admin via WhatsApp sobre novo premium
          try {
            // Buscar dados do perfil para enviar nome e email
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome, email, created_at')
              .eq('id', userId)
              .single();

            if (profileData) {
              const createdAt = new Date(profileData.created_at);
              const now = new Date();
              const diffMs = now.getTime() - createdAt.getTime();
              
              // Calcular tempo até conversão em formato legível
              const diffMinutes = Math.floor(diffMs / (1000 * 60));
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              let tempoConversao = '';
              if (diffDays > 0) {
                tempoConversao = `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
                const horasRestantes = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                if (horasRestantes > 0) {
                  tempoConversao += ` e ${horasRestantes}h`;
                }
              } else if (diffHours > 0) {
                tempoConversao = `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
                const minutosRestantes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                if (minutosRestantes > 0) {
                  tempoConversao += ` e ${minutosRestantes}min`;
                }
              } else {
                tempoConversao = `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
              }

              await supabase.functions.invoke('notificar-admin-whatsapp', {
                body: {
                  tipo: 'novo_premium',
                  dados: {
                    nome: profileData.nome,
                    email: profileData.email,
                    plano: planType,
                    valor: paymentData.transaction_amount,
                    tempo_ate_conversao: tempoConversao,
                    created_at: profileData.created_at
                  }
                }
              });
              console.log('Notificação admin novo premium enviada');
            }
          } catch (adminNotifyErr) {
            console.error('Erro ao notificar admin sobre novo premium:', adminNotifyErr);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar pagamento de assinatura recorrente (subscription_authorized_payment)
    // IMPORTANTE: O ID neste evento é do authorized_payment, usar API /authorized_payments/
    if (body.type === 'subscription_authorized_payment') {
      const authorizedPaymentId = body.data?.id;
      if (!authorizedPaymentId) {
        console.error('ID do authorized_payment não encontrado');
        return new Response(
          JSON.stringify({ error: 'ID não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Buscando detalhes do authorized_payment:', authorizedPaymentId);
      
      // CORREÇÃO: Usar /authorized_payments em vez de /v1/payments
      const authorizedPaymentResponse = await fetch(
        `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
        { headers: { 'Authorization': `Bearer ${mpAccessToken}` } }
      );

      const authorizedPaymentData = await authorizedPaymentResponse.json();
      console.log('Dados do authorized_payment:', JSON.stringify(authorizedPaymentData));

      if (!authorizedPaymentResponse.ok) {
        console.error('Erro ao buscar authorized_payment:', authorizedPaymentData);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar authorized_payment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extrair preapproval_id do authorized_payment
      const preapprovalId = authorizedPaymentData.preapproval_id;
      const paymentStatus = authorizedPaymentData.payment?.status || authorizedPaymentData.status;
      
      console.log('Preapproval ID:', preapprovalId);
      console.log('Payment Status:', paymentStatus);

      // Atualizar assinatura se pagamento aprovado
      if (paymentStatus === 'approved' || paymentStatus === 'processed') {
        if (preapprovalId) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'authorized',
              last_payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('mp_preapproval_id', preapprovalId);

          if (updateError) {
            console.error('Erro ao atualizar assinatura:', updateError);
          } else {
            console.log('Assinatura atualizada para authorized via preapproval_id:', preapprovalId);
          }
        } else {
          // Fallback: buscar assinatura pendente mais recente pelo external_reference
          const externalRef = authorizedPaymentData.external_reference;
          if (externalRef && externalRef.includes('|')) {
            const [userId] = externalRef.split('|');
            console.log('Fallback: atualizando assinatura pendente do usuario:', userId);
            
            const { error: fallbackError } = await supabase
              .from('subscriptions')
              .update({
                status: 'authorized',
                last_payment_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('status', 'pending');

            if (fallbackError) {
              console.error('Erro no fallback de atualização:', fallbackError);
            } else {
              console.log('Assinatura atualizada via fallback (external_reference)');
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar criação/atualização de assinaturas recorrentes (subscription_preapproval)
    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body.data?.id;
      if (!preapprovalId) {
        console.error('ID da assinatura não encontrado');
        return new Response(
          JSON.stringify({ error: 'ID não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Buscando detalhes da assinatura (preapproval):', preapprovalId);
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      const mpData = await mpResponse.json();
      console.log('Dados da assinatura:', JSON.stringify(mpData));

      if (!mpResponse.ok) {
        console.error('Erro ao buscar assinatura:', mpData);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar assinatura' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mapear status do Mercado Pago para nosso sistema
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'authorized': 'authorized',
        'paused': 'paused',
        'cancelled': 'cancelled',
        'expired': 'expired'
      };

      const newStatus = statusMap[mpData.status] || mpData.status;

      const updateData: Record<string, any> = {
        status: newStatus,
        mp_payer_id: mpData.payer_id,
        updated_at: new Date().toISOString()
      };

      if (mpData.next_payment_date) {
        updateData.next_payment_date = mpData.next_payment_date;
      }
      if (mpData.last_modified) {
        updateData.last_payment_date = mpData.last_modified;
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('mp_preapproval_id', preapprovalId);

      if (updateError) {
        console.error('Erro ao atualizar assinatura no banco:', updateError);
        // Tentar inserir se não existir
        if (mpData.external_reference) {
          const [userId] = mpData.external_reference.split('|');
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              mp_preapproval_id: preapprovalId,
              mp_payer_id: mpData.payer_id,
              mp_payer_email: mpData.payer_email,
              status: newStatus,
              plan_type: mpData.auto_recurring?.frequency === 1 ? 'mensal' : 'anual',
              amount: mpData.auto_recurring?.transaction_amount || 0,
              next_payment_date: mpData.next_payment_date,
              last_payment_date: mpData.last_modified
            });
          
          if (insertError) {
            console.error('Erro ao inserir assinatura:', insertError);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tipos não processados
    console.log('Tipo de notificação ignorado:', body.type, body.action);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Erro no webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
