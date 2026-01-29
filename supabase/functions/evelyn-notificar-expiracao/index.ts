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
    console.log('[evelyn-notificar-expiracao] Iniciando verificação de assinaturas prestes a expirar...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calcular data de 3 dias a partir de agora
    const hoje = new Date();
    const tresDiasDepois = new Date(hoje);
    tresDiasDepois.setDate(tresDiasDepois.getDate() + 3);
    
    // Formato para comparação: início e fim do dia de 3 dias depois
    const inicioDia = new Date(tresDiasDepois);
    inicioDia.setHours(0, 0, 0, 0);
    
    const fimDia = new Date(tresDiasDepois);
    fimDia.setHours(23, 59, 59, 999);

    console.log(`[evelyn-notificar-expiracao] Buscando assinaturas que expiram entre ${inicioDia.toISOString()} e ${fimDia.toISOString()}`);

    // Buscar assinaturas ativas que expiram em exatamente 3 dias e que ainda não foram notificadas
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, expires_at, plan_type, notificado_expiracao')
      .eq('status', 'authorized')
      .gte('expires_at', inicioDia.toISOString())
      .lte('expires_at', fimDia.toISOString())
      .or('notificado_expiracao.is.null,notificado_expiracao.eq.false');

    if (subError) {
      console.error('[evelyn-notificar-expiracao] Erro ao buscar assinaturas:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[evelyn-notificar-expiracao] Nenhuma assinatura expirando em 3 dias');
      return new Response(
        JSON.stringify({ success: true, notificados: 0, message: 'Nenhuma assinatura para notificar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[evelyn-notificar-expiracao] Encontradas ${subscriptions.length} assinaturas para notificar`);

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

    if (!evolutionUrl || !evolutionKey) {
      console.error('[evelyn-notificar-expiracao] Evolution API não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let notificados = 0;
    const erros: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Buscar telefone e nome do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('telefone, nome, phone')
          .eq('id', sub.user_id)
          .maybeSingle();

        const telefone = profile?.telefone || profile?.phone;
        const nome = profile?.nome || 'estudante';

        if (!telefone) {
          console.log(`[evelyn-notificar-expiracao] Usuário ${sub.user_id} sem telefone cadastrado`);
          continue;
        }

        const numeros = telefone.replace(/\D/g, '');
        
        // Validar formato brasileiro
        if (numeros.length < 12 || numeros.length > 13) {
          console.log(`[evelyn-notificar-expiracao] Telefone inválido para usuário ${sub.user_id}: ${numeros}`);
          continue;
        }

        const numero = numeros.startsWith('55') ? numeros : `55${numeros}`;
        const dataExpiracao = new Date(sub.expires_at).toLocaleDateString('pt-BR');

        const mensagem = `⏰ *Lembrete Importante!*

Olá, ${nome}! Sua assinatura *Direito Premium* expira em *3 dias* (${dataExpiracao}).

💎 Para continuar aproveitando todos os benefícios sem interrupção, renove agora:

• 1️⃣ Mensal: R$ 21,90/mês
• 2️⃣ Trimestral: R$ 49,90 _(economize 24%)_
• 3️⃣ Vitalício: R$ 179,90 _(acesso eterno)_

📲 Digite *assinar* para renovar pelo WhatsApp ou acesse: direitopremium.com.br/assinatura

Estou aqui se precisar! 💜
*Evelyn*`;

        console.log(`[evelyn-notificar-expiracao] Enviando notificação para ${numero}`);

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

        if (evolutionResponse.ok) {
          // Marcar como notificado
          await supabase
            .from('subscriptions')
            .update({ notificado_expiracao: true })
            .eq('id', sub.id);

          notificados++;
          console.log(`[evelyn-notificar-expiracao] Notificação enviada com sucesso para ${numero}`);
        } else {
          const errorData = await evolutionResponse.json();
          console.error(`[evelyn-notificar-expiracao] Erro ao enviar para ${numero}:`, errorData);
          erros.push(`${sub.user_id}: ${JSON.stringify(errorData)}`);
        }

      } catch (userError) {
        console.error(`[evelyn-notificar-expiracao] Erro ao processar usuário ${sub.user_id}:`, userError);
        erros.push(`${sub.user_id}: ${String(userError)}`);
      }
    }

    console.log(`[evelyn-notificar-expiracao] Concluído - ${notificados} notificações enviadas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificados, 
        total: subscriptions.length,
        erros: erros.length > 0 ? erros : undefined 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[evelyn-notificar-expiracao] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
