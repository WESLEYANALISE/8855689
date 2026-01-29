import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alteracao {
  lei: string;
  nomeAmigavel: string;
  novos: number;
  removidos: number;
  alterados: number;
  resumo?: string;
  analise?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { alteracoes } = await req.json() as { alteracoes: Alteracao[] };

    if (!alteracoes || alteracoes.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma alteração para notificar'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📧 Preparando notificação para ${alteracoes.length} leis com alterações`);

    // Buscar emails inscritos para notificações
    const { data: inscritos } = await supabase
      .from('push_notifications')
      .select('email')
      .eq('ativo', true)
      .not('email', 'is', null);

    const emails = inscritos?.map(i => i.email).filter(Boolean) || [];
    console.log(`   ${emails.length} emails inscritos`);

    // Construir conteúdo do email
    const dataHoje = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const totalAlteracoes = alteracoes.reduce((acc, a) => 
      acc + a.novos + a.removidos + a.alterados, 0
    );

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .badge { background: #e94560; padding: 4px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin-top: 10px; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; }
    .lei-card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #e94560; }
    .lei-nome { font-weight: bold; color: #1a1a2e; margin-bottom: 8px; }
    .stats { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; }
    .stat { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; }
    .stat.novo { background: #d4edda; color: #155724; }
    .stat.alterado { background: #fff3cd; color: #856404; }
    .stat.removido { background: #f8d7da; color: #721c24; }
    .resumo { font-size: 14px; color: #666; margin-top: 10px; font-style: italic; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
    .btn { display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚖️ Alerta de Alteração Legislativa</h1>
    <div class="badge">${totalAlteracoes} alterações detectadas</div>
    <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.8;">${dataHoje}</p>
  </div>
  
  <div class="content">
    <p>Foram detectadas alterações nas seguintes legislações:</p>
`;

    for (const alt of alteracoes) {
      htmlContent += `
    <div class="lei-card">
      <div class="lei-nome">📕 ${alt.nomeAmigavel || alt.lei}</div>
      <div class="stats">
        ${alt.novos > 0 ? `<span class="stat novo">+${alt.novos} novos</span>` : ''}
        ${alt.alterados > 0 ? `<span class="stat alterado">~${alt.alterados} alterados</span>` : ''}
        ${alt.removidos > 0 ? `<span class="stat removido">-${alt.removidos} removidos</span>` : ''}
      </div>
      ${alt.resumo ? `<div class="resumo">${alt.resumo}</div>` : ''}
    </div>
`;
    }

    htmlContent += `
    <center>
      <a href="https://direitopratico.lovable.app/alteracoes-legislativas" class="btn">Ver detalhes no app</a>
    </center>
  </div>
  
  <div class="footer">
    <p>Você está recebendo este email por estar inscrito nas notificações do Direito Prático.</p>
    <p><a href="https://direitopratico.lovable.app/configuracoes">Gerenciar notificações</a></p>
  </div>
</body>
</html>
`;

    // Construir texto plano
    let textContent = `⚖️ ALERTA DE ALTERAÇÃO LEGISLATIVA\n${dataHoje}\n\n`;
    textContent += `${totalAlteracoes} alterações detectadas:\n\n`;
    
    for (const alt of alteracoes) {
      textContent += `📕 ${alt.nomeAmigavel || alt.lei}\n`;
      if (alt.novos > 0) textContent += `   +${alt.novos} artigos novos\n`;
      if (alt.alterados > 0) textContent += `   ~${alt.alterados} artigos alterados\n`;
      if (alt.removidos > 0) textContent += `   -${alt.removidos} artigos removidos\n`;
      if (alt.resumo) textContent += `   ${alt.resumo}\n`;
      textContent += '\n';
    }
    
    textContent += `\nVer detalhes: https://direitopratico.lovable.app/alteracoes-legislativas`;

    // Enviar email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailsEnviados = 0;

    if (resendApiKey && emails.length > 0) {
      for (const email of emails.slice(0, 50)) { // Limitar a 50 emails por vez
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Direito Prático <alertas@direitopratico.lovable.app>',
              to: [email],
              subject: `⚖️ ${totalAlteracoes} alterações legislativas detectadas`,
              html: htmlContent,
              text: textContent
            })
          });

          if (response.ok) {
            emailsEnviados++;
          } else {
            console.error(`Erro ao enviar para ${email}:`, await response.text());
          }
        } catch (e) {
          console.error(`Erro ao enviar email para ${email}:`, e);
        }
      }
    }

    console.log(`   ✅ ${emailsEnviados} emails enviados`);

    // Salvar notificação no banco para exibir no app
    await supabase
      .from('notificacoes_sistema')
      .insert({
        tipo: 'alteracao_legislativa',
        titulo: `${totalAlteracoes} alterações legislativas detectadas`,
        conteudo: alteracoes.map(a => a.nomeAmigavel || a.lei).join(', '),
        dados: { alteracoes },
        prioridade: 'alta'
      });

    return new Response(JSON.stringify({
      success: true,
      emailsEnviados,
      totalInscritos: emails.length,
      alteracoesNotificadas: alteracoes.length
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao notificar:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
