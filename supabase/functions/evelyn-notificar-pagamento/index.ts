import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  vitalicio: 'Vitalício'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, planType, amount, paymentMethod, expirationDate } = await req.json();
    
    console.log(`Notificando pagamento - User: ${userId}, Plano: ${planType}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar dados do usuário no auth
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;
    
    // Buscar telefone e nome diretamente na tabela profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('telefone, nome, phone')
      .eq('id', userId)
      .maybeSingle();
    
    let telefone = profile?.telefone || profile?.phone;
    let nome = profile?.nome;

    // Fallback: user_metadata do Auth
    if (!nome && userData?.user?.user_metadata?.nome) {
      nome = userData.user.user_metadata.nome;
    }

    // Validar formato do telefone brasileiro
    if (telefone) {
      const numeros = telefone.replace(/\D/g, '');
      // Telefone brasileiro válido: 55 + DDD(2) + número(8-9) = 12-13 dígitos
      if (numeros.length < 12 || numeros.length > 13) {
        console.log(`Telefone com formato inválido (${numeros.length} dígitos): ${telefone}`);
        telefone = null;
      } else {
        console.log(`Telefone válido encontrado: ${numeros}`);
      }
    }

    // Formatar data de expiração
    const expDate = new Date(expirationDate);
    const dataFormatada = expDate.toLocaleDateString('pt-BR');
    const planLabel = PLAN_LABELS[planType] || planType;
    const paymentLabel = paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito';
    const amountFormatted = Number(amount).toFixed(2).replace('.', ',');
    const displayName = nome || 'estudante';

    // ========== ENVIAR EMAIL VIA GMAIL SMTP ==========
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
    let emailSent = false;

    if (userEmail && gmailUser && gmailPassword) {
      try {
        const expirationInfo = planType !== 'vitalicio' 
          ? `<div class="detail-item"><strong>Próxima renovação:</strong> ${dataFormatada}</div>`
          : `<div class="detail-item"><strong>Tipo:</strong> Acesso vitalício 🏆</div>`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .crown { font-size: 56px; margin-bottom: 8px; }
    .title { color: #f59e0b; font-size: 28px; font-weight: bold; margin: 16px 0 8px; }
    .subtitle { color: #374151; font-size: 16px; margin: 0; }
    .details { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; margin: 24px 0; }
    .detail-item { padding: 10px 0; border-bottom: 1px solid rgba(245,158,11,0.3); color: #92400e; font-size: 15px; }
    .detail-item:last-child { border-bottom: none; }
    .detail-item strong { color: #78350f; }
    .benefits { margin: 24px 0; }
    .benefits h3 { color: #374151; font-size: 18px; margin-bottom: 16px; }
    .benefit { padding: 10px 0; color: #059669; font-size: 15px; display: flex; align-items: center; gap: 8px; }
    .benefit::before { content: "✅"; font-size: 16px; }
    .cta { text-align: center; margin: 32px 0 16px; }
    .button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(245,158,11,0.4); }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="crown">👑</div>
      <h1 class="title">Parabéns, ${displayName}!</h1>
      <p class="subtitle">Você agora é <strong>Direito Premium</strong>!</p>
    </div>
    
    <div class="details">
      <div class="detail-item"><strong>Plano:</strong> ${planLabel}</div>
      <div class="detail-item"><strong>Valor:</strong> R$ ${amountFormatted}</div>
      <div class="detail-item"><strong>Forma de pagamento:</strong> ${paymentLabel}</div>
      ${expirationInfo}
    </div>
    
    <div class="benefits">
      <h3>🎁 Seus benefícios:</h3>
      <div class="benefit">Vade Mecum Completo</div>
      <div class="benefit">Videoaulas e Audioaulas</div>
      <div class="benefit">Flashcards com IA</div>
      <div class="benefit">Professora IA 24h (Evelyn)</div>
      <div class="benefit">Simulados OAB</div>
      <div class="benefit">Plano de Estudos Personalizado</div>
    </div>
    
    <div class="cta">
      <a href="https://direitopratico.lovable.app" class="button">🚀 Acessar Agora</a>
    </div>
    
    <div class="footer">
      <div class="logo">⚖️ Direito Premium</div>
      <p>Esse é um email automático. Caso tenha dúvidas, fale com a Evelyn no WhatsApp!</p>
      <p>© ${new Date().getFullYear()} Direito Prático. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

        // Criar cliente SMTP para Gmail
        const client = new SMTPClient({
          connection: {
            hostname: "smtp.gmail.com",
            port: 465,
            tls: true,
            auth: {
              username: gmailUser,
              password: gmailPassword,
            },
          },
        });

        await client.send({
          from: `Direito Premium <${gmailUser}>`,
          to: userEmail,
          subject: '👑 Parabéns! Você é Direito Premium!',
          content: "Você agora é Direito Premium!",
          html: emailHtml,
        });

        await client.close();

        console.log('Email enviado com sucesso via Gmail SMTP');
        emailSent = true;
      } catch (emailError) {
        console.error('Erro ao enviar email via Gmail:', emailError);
      }
    } else {
      console.log('Email não enviado - sem email do usuário ou GMAIL_USER/GMAIL_APP_PASSWORD não configurados');
    }

    // ========== ENVIAR WHATSAPP VIA EVOLUTION API ==========
    let whatsappSent = false;

    if (!telefone) {
      console.log('Usuário não tem telefone cadastrado');
    } else {
      // Montar mensagem personalizada
      const mensagem = `🎉 *Parabéns, ${displayName}!*

Você acaba de se tornar *Direito Premium*! ⭐

📋 *Detalhes do pagamento:*
• Plano: ${planLabel}
• Valor: R$ ${amountFormatted}
• Forma: ${paymentLabel}
${planType !== 'vitalicio' ? `• Próxima renovação: ${dataFormatada}` : '• Acesso vitalício! 🏆'}

Agora você tem acesso a *todas* as funcionalidades:
✅ Vade Mecum Completo
✅ Videoaulas e Audioaulas
✅ Flashcards com IA
✅ Professora IA 24h
✅ Simulados OAB
✅ E muito mais!

Como posso te ajudar hoje? 💬`;

      // Enviar via Evolution API
      const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

      if (!evolutionUrl || !evolutionKey) {
        console.error('Evolution API não configurada');
      } else {
        // Formatar número para WhatsApp
        const numeroLimpo = telefone.replace(/\D/g, '');
        const numero = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
        
        console.log(`Enviando mensagem WhatsApp para: ${numero}`);

        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';
        const evolutionResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: `${numero}@s.whatsapp.net`,
            text: mensagem,
          }),
        });

        const evolutionResult = await evolutionResponse.json();
        console.log('Resposta Evolution:', JSON.stringify(evolutionResult));

        if (evolutionResponse.ok) {
          whatsappSent = true;

          // Registrar mensagem na tabela evelyn_mensagens
          await supabase.from('evelyn_mensagens').insert({
            conversa_id: null,
            remetente: 'bot',
            conteudo: mensagem,
            tipo: 'text'
          });
        } else {
          console.error('Erro ao enviar mensagem WhatsApp:', evolutionResult);
        }
      }
    }

    console.log(`Notificação concluída - Email: ${emailSent}, WhatsApp: ${whatsappSent}`);

    // ========== NOTIFICAR ADMINISTRADOR ==========
    const ADMIN_PHONE = '5511991897603';
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    let adminNotified = false;

    if (evolutionUrl && evolutionKey) {
      try {
        // Buscar total de assinantes ativos
        const { count: totalAssinantes } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const adminMensagem = `📊 *Nova Assinatura — Direito Premium*

👤 *Novo assinante:*
• Nome: ${displayName}
• Email: ${userEmail || 'Não informado'}
• Telefone: ${telefone || 'Não informado'}

💰 *Detalhes do pagamento:*
• Plano: ${planLabel}
• Valor: R$ ${amountFormatted}
• Método: ${paymentLabel}
${planType !== 'vitalicio' ? `• Expira em: ${dataFormatada}` : '• Acesso vitalício 🏆'}

📈 *Total de assinantes ativos:* ${totalAssinantes || 0}`;

        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';
        const adminResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: `${ADMIN_PHONE}@s.whatsapp.net`,
            text: adminMensagem,
          }),
        });

        if (adminResponse.ok) {
          adminNotified = true;
          console.log('Admin notificado com sucesso sobre nova assinatura');
        } else {
          const adminError = await adminResponse.json();
          console.error('Erro ao notificar admin:', adminError);
        }
      } catch (adminError) {
        console.error('Erro ao notificar admin:', adminError);
      }
    }

    return new Response(
      JSON.stringify({ 
        sent: emailSent || whatsappSent, 
        emailSent, 
        whatsappSent,
        adminNotified,
        to: userEmail 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao notificar pagamento:', error);
    return new Response(
      JSON.stringify({ sent: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
