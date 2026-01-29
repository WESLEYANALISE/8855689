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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[evelyn-calcular-metricas] Iniciando cálculo de métricas...');

    // Data de hoje (início do dia)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = hoje.toISOString();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaISO = amanha.toISOString();

    // 1. Total de mensagens do dia
    const { count: totalMensagens } = await supabase
      .from('evelyn_mensagens')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO);

    // 2. Mensagens por tipo
    const { data: mensagensPorTipo } = await supabase
      .from('evelyn_mensagens')
      .select('tipo')
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO);

    const contadorTipos = {
      texto: 0,
      audio: 0,
      imagem: 0,
      documento: 0
    };

    if (mensagensPorTipo) {
      for (const msg of mensagensPorTipo) {
        const tipo = msg.tipo?.toLowerCase() || 'texto';
        if (tipo in contadorTipos) {
          contadorTipos[tipo as keyof typeof contadorTipos]++;
        }
      }
    }

    // 3. Usuários ativos do dia (que enviaram mensagens)
    const { data: usuariosAtivos } = await supabase
      .from('evelyn_mensagens')
      .select('conversa_id')
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO)
      .eq('remetente', 'usuario');

    const conversasUnicas = new Set(usuariosAtivos?.map(m => m.conversa_id) || []);
    const totalUsuariosAtivos = conversasUnicas.size;

    // 4. Novos usuários do dia
    const { count: novosUsuarios } = await supabase
      .from('evelyn_usuarios')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO);

    // 5. Horários de pico (mensagens por hora)
    const { data: mensagensHora } = await supabase
      .from('evelyn_mensagens')
      .select('created_at')
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO);

    const horariosPico: Record<number, number> = {};
    if (mensagensHora) {
      for (const msg of mensagensHora) {
        const hora = new Date(msg.created_at).getHours();
        horariosPico[hora] = (horariosPico[hora] || 0) + 1;
      }
    }

    // Converter para array ordenado
    const horariosArray = Object.entries(horariosPico)
      .map(([hora, count]) => ({ hora: parseInt(hora), mensagens: count }))
      .sort((a, b) => b.mensagens - a.mensagens);

    // 6. Temas mais consultados (baseado em mensagens do usuário)
    const { data: mensagensUsuario } = await supabase
      .from('evelyn_mensagens')
      .select('conteudo')
      .gte('created_at', hojeISO)
      .lt('created_at', amanhaISO)
      .eq('remetente', 'usuario')
      .limit(500);

    const temasConsultados: Record<string, number> = {};
    const termosBusca = [
      'penal', 'civil', 'constitucional', 'trabalhista', 'tributário', 
      'administrativo', 'processual', 'empresarial', 'ambiental', 'consumidor',
      'família', 'sucessões', 'contratos', 'oab', 'concurso', 'flashcard',
      'quiz', 'video', 'livro', 'artigo', 'lei'
    ];

    if (mensagensUsuario) {
      for (const msg of mensagensUsuario) {
        const conteudo = (msg.conteudo || '').toLowerCase();
        for (const termo of termosBusca) {
          if (conteudo.includes(termo)) {
            temasConsultados[termo] = (temasConsultados[termo] || 0) + 1;
          }
        }
      }
    }

    const temasArray = Object.entries(temasConsultados)
      .map(([tema, count]) => ({ tema, consultas: count }))
      .sort((a, b) => b.consultas - a.consultas)
      .slice(0, 10);

    // 7. Upsert das métricas do dia
    const dataHoje = hoje.toISOString().split('T')[0];

    const { error: upsertError } = await supabase
      .from('evelyn_metricas_diarias')
      .upsert({
        data: dataHoje,
        total_mensagens: totalMensagens || 0,
        total_usuarios_ativos: totalUsuariosAtivos,
        total_novos_usuarios: novosUsuarios || 0,
        mensagens_texto: contadorTipos.texto,
        mensagens_audio: contadorTipos.audio,
        mensagens_imagem: contadorTipos.imagem,
        mensagens_documento: contadorTipos.documento,
        temas_mais_consultados: temasArray,
        horarios_pico: horariosArray.slice(0, 5)
      }, { onConflict: 'data' });

    if (upsertError) {
      console.error('[evelyn-calcular-metricas] Erro ao salvar métricas:', upsertError);
      throw upsertError;
    }

    console.log('[evelyn-calcular-metricas] Métricas calculadas com sucesso:', {
      data: dataHoje,
      totalMensagens,
      totalUsuariosAtivos,
      novosUsuarios,
      tiposMensagem: contadorTipos,
      temasTop: temasArray.slice(0, 3)
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: dataHoje,
        metricas: {
          total_mensagens: totalMensagens || 0,
          usuarios_ativos: totalUsuariosAtivos,
          novos_usuarios: novosUsuarios || 0,
          tipos: contadorTipos,
          temas_top: temasArray.slice(0, 5),
          horarios_pico: horariosArray.slice(0, 3)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-calcular-metricas] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
