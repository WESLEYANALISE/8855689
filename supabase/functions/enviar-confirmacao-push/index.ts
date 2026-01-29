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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = 'https://vademecum.lovable.app';

    const { email, nome } = await req.json();

    if (!email) {
      throw new Error('Email não fornecido');
    }

    // Buscar inscrito
    const { data: inscrito, error: buscaError } = await supabase
      .from('push_legislacao_inscritos')
      .select('*')
      .eq('email', email)
      .single();

    if (buscaError || !inscrito) {
      throw new Error('Inscrito não encontrado');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 40px 24px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 16px;">🎉</div>
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
              Bem-vindo ao Push de Legislação!
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Olá${nome ? ` <strong>${nome}</strong>` : ''}! 👋
            </p>
            
            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">
              Sua inscrição no Push de Legislação foi confirmada com sucesso! A partir de agora, você receberá atualizações diárias sobre novas leis publicadas no Diário Oficial da União.
            </p>
            
            <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 14px;">
                📬 O que você vai receber:
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
                <li>Resumo das novas leis publicadas</li>
                <li>Explicações simplificadas com IA</li>
                <li>Principais artigos destacados</li>
                <li>Links diretos para o Planalto</li>
              </ul>
            </div>
            
            ${inscrito.areas_interesse?.length ? `
              <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #6d28d9; font-size: 14px;">
                  🎯 Suas áreas de interesse:
                </h3>
                <p style="margin: 0; color: #7c3aed; font-size: 14px;">
                  ${inscrito.areas_interesse.join(' • ')}
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${baseUrl}/resenha-diaria" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
                Ver Resenha Diária
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Vade Mecum Elite
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vade Mecum Elite <noreply@resend.dev>',
        to: [email],
        subject: '🎉 Bem-vindo ao Push de Legislação!',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Falha ao enviar email: ${errorData}`);
    }

    // Marcar como confirmado
    await supabase
      .from('push_legislacao_inscritos')
      .update({ confirmado: true })
      .eq('id', inscrito.id);

    console.log(`Email de confirmação enviado para ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de confirmação enviado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
