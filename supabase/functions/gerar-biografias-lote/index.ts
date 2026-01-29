import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declarar EdgeRuntime para Deno
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deputadoInicial, deputados, tipo = 'deputado' } = await req.json();
    
    console.log(`Iniciando geração em lote a partir do deputado ${deputadoInicial?.id || 'início'}`);
    console.log(`Total de deputados para processar: ${deputados?.length || 0}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Registrar tarefa de background
    const { data: tarefa, error: tarefaError } = await supabase
      .from('tres_poderes_tarefas_background')
      .insert({
        tipo: 'gerar_biografias_lote',
        status: 'em_andamento',
        total: deputados?.length || 0,
        processados: 0,
        deputado_inicial_id: deputadoInicial?.id
      })
      .select()
      .single();

    if (tarefaError) {
      console.error('Erro ao criar tarefa:', tarefaError);
    }

    const tarefaId = tarefa?.id;

    // Processar em background
    EdgeRuntime.waitUntil((async () => {
      let processados = 0;
      
      for (const deputado of deputados || []) {
        try {
          // Verificar se já existe biografia
          const { data: existente } = await supabase
            .from('tres_poderes_deputados_bio')
            .select('id')
            .eq('deputado_id', deputado.id)
            .maybeSingle();

          if (existente) {
            console.log(`Deputado ${deputado.nome} já tem biografia, pulando...`);
            processados++;
            continue;
          }

          console.log(`Gerando biografia para: ${deputado.nome}`);

          // Chamar função de gerar biografia
          const response = await fetch(`${supabaseUrl}/functions/v1/gerar-biografia-politico`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nome: deputado.nome,
              tipo: 'deputado',
              id: deputado.id,
              partido: deputado.siglaPartido,
              uf: deputado.siglaUf
            })
          });

          if (response.ok) {
            console.log(`Biografia gerada com sucesso para: ${deputado.nome}`);
          } else {
            console.error(`Erro ao gerar biografia para ${deputado.nome}:`, await response.text());
          }

          processados++;

          // Atualizar progresso
          if (tarefaId) {
            await supabase
              .from('tres_poderes_tarefas_background')
              .update({ 
                processados,
                ultimo_processado: deputado.nome
              })
              .eq('id', tarefaId);
          }

          // Delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`Erro processando ${deputado.nome}:`, error);
        }
      }

      // Marcar como concluído
      if (tarefaId) {
        await supabase
          .from('tres_poderes_tarefas_background')
          .update({ 
            status: 'concluido',
            processados,
            concluido_em: new Date().toISOString()
          })
          .eq('id', tarefaId);
      }

      console.log(`Processamento em lote concluído. ${processados} deputados processados.`);
    })());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processamento iniciado em background',
        tarefaId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
