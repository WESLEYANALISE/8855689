import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RatingRequest {
  userIp: string;
  action: 'check' | 'rated' | 'postpone';
  deviceType?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { userIp, action, deviceType }: RatingRequest = await req.json();

    console.log(`Gerenciar Rating - IP: ${userIp}, Action: ${action}, Device: ${deviceType}`);

    if (!userIp || !action) {
      return new Response(
        JSON.stringify({ error: 'userIp e action são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: CHECK - Verificar se deve mostrar o modal
    if (action === 'check') {
      const { data: existingRecord, error: fetchError } = await supabaseClient
        .from('app_rating_tracking')
        .select('*')
        .eq('user_ip', userIp)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar registro:', fetchError);
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Usuário nunca viu o modal - criar registro e mostrar
      if (!existingRecord) {
        const { error: insertError } = await supabaseClient
          .from('app_rating_tracking')
          .insert({
            user_ip: userIp,
            last_shown_date: new Date().toISOString().split('T')[0],
            device_type: deviceType,
            user_rated: false,
          });

        if (insertError) {
          console.error('Erro ao inserir registro:', insertError);
        }

        return new Response(
          JSON.stringify({ shouldShow: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Usuário já avaliou - nunca mais mostrar
      if (existingRecord.user_rated) {
        return new Response(
          JSON.stringify({ shouldShow: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se já mostrou hoje
      const today = new Date().toISOString().split('T')[0];
      const lastShown = existingRecord.last_shown_date;

      if (lastShown === today) {
        // Já mostrou hoje - não mostrar
        return new Response(
          JSON.stringify({ shouldShow: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Última exibição foi em outro dia - atualizar e mostrar
      const { error: updateError } = await supabaseClient
        .from('app_rating_tracking')
        .update({
          last_shown_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_ip', userIp);

      if (updateError) {
        console.error('Erro ao atualizar registro:', updateError);
      }

      return new Response(
        JSON.stringify({ shouldShow: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: RATED - Marcar como avaliado (nunca mais mostrar)
    if (action === 'rated') {
      const { error: updateError } = await supabaseClient
        .from('app_rating_tracking')
        .update({
          user_rated: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_ip', userIp);

      if (updateError) {
        console.error('Erro ao marcar como avaliado:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Marcado como avaliado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: POSTPONE - Apenas registrar que viu hoje (mostrar amanhã)
    if (action === 'postpone') {
      const today = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabaseClient
        .from('app_rating_tracking')
        .update({
          last_shown_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_ip', userIp);

      if (updateError) {
        console.error('Erro ao adiar:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Adiado para amanhã' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
