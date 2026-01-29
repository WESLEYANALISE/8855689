import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { acao, userId, email, telefone, motivo, banidoPor } = await req.json();

    if (!acao || !userId) {
      return new Response(
        JSON.stringify({ error: 'Ação e userId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (acao === 'excluir') {
      console.log(`Excluindo usuário: ${userId}`);

      // Deletar perfil primeiro
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao deletar perfil:', profileError);
      }

      // Deletar usuário do auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Erro ao deletar usuário auth:', authError);
        throw new Error(`Falha ao deletar usuário: ${authError.message}`);
      }

      console.log('Usuário excluído com sucesso');

      return new Response(
        JSON.stringify({ success: true, message: 'Usuário excluído com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (acao === 'banir') {
      console.log(`Banindo usuário: ${userId}`);

      // Adicionar à lista de banidos
      const { error: banError } = await supabase
        .from('usuarios_banidos')
        .insert({
          email: email || null,
          telefone: telefone || null,
          motivo: motivo || 'Banido pelo administrador',
          banido_por: banidoPor || 'Admin',
          user_id_original: userId,
        });

      if (banError) {
        console.error('Erro ao registrar banimento:', banError);
        throw new Error(`Falha ao registrar banimento: ${banError.message}`);
      }

      // Deletar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao deletar perfil:', profileError);
      }

      // Deletar usuário do auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Erro ao deletar usuário auth:', authError);
        throw new Error(`Falha ao deletar usuário: ${authError.message}`);
      }

      console.log('Usuário banido com sucesso');

      return new Response(
        JSON.stringify({ success: true, message: 'Usuário banido com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Ação inválida. Use "excluir" ou "banir"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Erro na função admin-gerenciar-usuario:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
