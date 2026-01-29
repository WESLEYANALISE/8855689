import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { diasVerificar = 3, tipos = ['juridica', 'politica'], autoRegenerar = false } = await req.json().catch(() => ({}));

    console.log(`[VERIFICAR] Verificando boletins faltantes dos últimos ${diasVerificar} dias...`);

    // Gerar lista de datas para verificar
    const datasVerificar: string[] = [];
    for (let i = 0; i < diasVerificar; i++) {
      const data = new Date();
      data.setHours(data.getHours() - 3); // Ajuste para horário de Brasília
      data.setDate(data.getDate() - i);
      datasVerificar.push(data.toISOString().split('T')[0]);
    }

    console.log(`[VERIFICAR] Datas a verificar: ${datasVerificar.join(', ')}`);

    // Buscar boletins existentes
    const { data: boletinsExistentes, error: queryError } = await supabase
      .from('resumos_diarios')
      .select('tipo, data, url_audio_abertura')
      .in('data', datasVerificar)
      .in('tipo', tipos);

    if (queryError) throw queryError;

    console.log(`[VERIFICAR] Boletins existentes encontrados: ${boletinsExistentes?.length || 0}`);

    // Mapear boletins existentes
    const existentes = new Set(
      boletinsExistentes?.map(b => `${b.tipo}_${b.data}`) || []
    );

    // Verificar notícias disponíveis para cada data/tipo
    const verificacoes: Array<{
      data: string;
      tipo: string;
      temBoletim: boolean;
      temNoticiasDisponiveis: boolean;
      quantidadeNoticias: number;
      status: 'ok' | 'faltando' | 'sem_noticias';
    }> = [];

    for (const data of datasVerificar) {
      for (const tipo of tipos) {
        const chave = `${tipo}_${data}`;
        const temBoletim = existentes.has(chave);
        
        // Verificar se tem notícias para esse dia
        let quantidadeNoticias = 0;
        const dataInicio = `${data}T00:00:00+00:00`;
        const dataFim = `${data}T23:59:59+00:00`;

        if (tipo === 'politica') {
          const { count } = await supabase
            .from('noticias_politicas_cache')
            .select('*', { count: 'exact', head: true })
            .gte('data_publicacao', dataInicio)
            .lte('data_publicacao', dataFim);
          quantidadeNoticias = count || 0;
        } else if (tipo === 'juridica') {
          const { count } = await supabase
            .from('noticias_juridicas_cache')
            .select('*', { count: 'exact', head: true })
            .eq('categoria', 'Direito')
            .gte('data_publicacao', dataInicio)
            .lte('data_publicacao', dataFim);
          quantidadeNoticias = count || 0;
        } else if (tipo === 'concurso') {
          // Buscar na tabela correta de notícias de concursos
          const { count } = await supabase
            .from('noticias_concursos_cache')
            .select('*', { count: 'exact', head: true })
            .gte('data_publicacao', dataInicio)
            .lte('data_publicacao', dataFim);
          quantidadeNoticias = count || 0;
        }

        const temNoticias = quantidadeNoticias >= 3; // Mínimo de 3 notícias para gerar boletim
        
        let status: 'ok' | 'faltando' | 'sem_noticias';
        if (temBoletim) {
          status = 'ok';
        } else if (temNoticias) {
          status = 'faltando';
        } else {
          status = 'sem_noticias';
        }

        verificacoes.push({
          data,
          tipo,
          temBoletim,
          temNoticiasDisponiveis: temNoticias,
          quantidadeNoticias,
          status
        });
      }
    }

    // Filtrar boletins faltantes que podem ser regenerados
    const faltantes = verificacoes.filter(v => v.status === 'faltando');

    console.log(`[VERIFICAR] Resumo:`);
    console.log(`  - Total verificações: ${verificacoes.length}`);
    console.log(`  - OK: ${verificacoes.filter(v => v.status === 'ok').length}`);
    console.log(`  - Faltantes: ${faltantes.length}`);
    console.log(`  - Sem notícias: ${verificacoes.filter(v => v.status === 'sem_noticias').length}`);

    // Se autoRegenerar = true, disparar geração dos faltantes
    const regenerados: Array<{ tipo: string; data: string; status: string }> = [];
    
    if (autoRegenerar && faltantes.length > 0) {
      console.log(`[VERIFICAR] Iniciando regeneração automática de ${faltantes.length} boletins...`);
      
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y";
      
      for (const f of faltantes) {
        try {
          console.log(`[VERIFICAR] Disparando geração: ${f.tipo} - ${f.data}`);
          
          // Disparar a função de forma assíncrona (fire and forget)
          fetch(`${supabaseUrl}/functions/v1/gerar-resumo-diario`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({
              tipo: f.tipo,
              data: f.data,
              forceRegenerate: true
            })
          }).catch(err => console.error(`Erro ao disparar ${f.tipo}/${f.data}:`, err));
          
          regenerados.push({ tipo: f.tipo, data: f.data, status: 'disparado' });
          
          // Pequeno delay entre disparos para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[VERIFICAR] Erro ao disparar ${f.tipo}/${f.data}:`, error);
          regenerados.push({ tipo: f.tipo, data: f.data, status: 'erro' });
        }
      }
    }

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      diasVerificados: diasVerificar,
      tiposVerificados: tipos,
      resumo: {
        total: verificacoes.length,
        ok: verificacoes.filter(v => v.status === 'ok').length,
        faltantes: faltantes.length,
        semNoticias: verificacoes.filter(v => v.status === 'sem_noticias').length
      },
      verificacoes,
      regenerados: autoRegenerar ? regenerados : undefined
    };

    console.log(`[VERIFICAR] Verificação concluída:`, JSON.stringify(resultado.resumo));

    return new Response(JSON.stringify(resultado, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("[VERIFICAR] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
