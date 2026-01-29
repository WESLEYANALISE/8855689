import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NarracaoJob {
  id: string;
  tabela_lei: string;
  artigos_ids: number[];
  artigos_total: number;
  artigos_processados: number;
  artigo_atual: number | null;
  status: string;
  velocidade: number;
}

// Função que processa a narração em background
async function processarNarracaoBackground(jobId: string, supabaseUrl: string, supabaseKey: string) {
  console.log(`[narrar-lote] Iniciando processamento do job ${jobId}`)
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Buscar dados do job
    const { data: job, error: jobError } = await supabase
      .from('narracao_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (jobError || !job) {
      console.error(`[narrar-lote] Job não encontrado: ${jobId}`)
      return
    }
    
    // Atualizar status para processando
    await supabase
      .from('narracao_jobs')
      .update({ status: 'processando' })
      .eq('id', jobId)
    
    const { tabela_lei, artigos_ids, velocidade } = job as NarracaoJob
    
    // Processar cada artigo
    for (let i = job.artigos_processados; i < artigos_ids.length; i++) {
      const artigoId = artigos_ids[i]
      
      // Verificar se job foi cancelado ou pausado
      const { data: jobAtual } = await supabase
        .from('narracao_jobs')
        .select('status')
        .eq('id', jobId)
        .single()
      
      if (jobAtual?.status === 'cancelado') {
        console.log(`[narrar-lote] Job ${jobId} cancelado`)
        return
      }
      
      if (jobAtual?.status === 'pausado') {
        console.log(`[narrar-lote] Job ${jobId} pausado`)
        return
      }
      
      // Atualizar artigo atual
      await supabase
        .from('narracao_jobs')
        .update({ artigo_atual: artigoId })
        .eq('id', jobId)
      
      console.log(`[narrar-lote] Processando artigo ${artigoId} (${i + 1}/${artigos_ids.length})`)
      
      // Buscar dados do artigo
      const { data: artigoData, error: artigoError } = await supabase
        .from(tabela_lei)
        .select('id, "Número do Artigo", Artigo, Narração')
        .eq('id', artigoId)
        .single()
      
      if (artigoError || !artigoData) {
        console.error(`[narrar-lote] Erro ao buscar artigo ${artigoId}:`, artigoError)
        continue
      }
      
      // Pular se já tem narração
      if ((artigoData as any).Narração) {
        console.log(`[narrar-lote] Artigo ${artigoId} já tem narração, pulando`)
        await supabase
          .from('narracao_jobs')
          .update({ artigos_processados: i + 1 })
          .eq('id', jobId)
        continue
      }
      
      // Chamar a função de narração
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/gerar-narracao-vademecum`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            tableName: tabela_lei,
            numeroArtigo: (artigoData as any)["Número do Artigo"],
            textoArtigo: (artigoData as any).Artigo,
            articleId: artigoId,
            speakingRate: velocidade,
          }),
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`[narrar-lote] ✅ Artigo ${artigoId} narrado com sucesso`)
        } else {
          const errorText = await response.text()
          console.error(`[narrar-lote] Erro ao narrar artigo ${artigoId}:`, errorText)
        }
      } catch (narracaoError) {
        console.error(`[narrar-lote] Exceção ao narrar artigo ${artigoId}:`, narracaoError)
      }
      
      // Atualizar progresso
      await supabase
        .from('narracao_jobs')
        .update({ artigos_processados: i + 1 })
        .eq('id', jobId)
      
      // Pequena pausa entre narrações para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Marcar como concluído
    await supabase
      .from('narracao_jobs')
      .update({ 
        status: 'concluido',
        artigo_atual: null 
      })
      .eq('id', jobId)
    
    console.log(`[narrar-lote] ✅ Job ${jobId} concluído com sucesso`)
    
  } catch (error: any) {
    console.error(`[narrar-lote] Erro no job ${jobId}:`, error)
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase
      .from('narracao_jobs')
      .update({ 
        status: 'erro',
        erro_mensagem: error.message 
      })
      .eq('id', jobId)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, jobId, tabelaLei, artigosIds, velocidade } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Ação: Iniciar novo job
    if (action === 'iniciar') {
      if (!tabelaLei || !artigosIds || !Array.isArray(artigosIds) || artigosIds.length === 0) {
        throw new Error('tabelaLei e artigosIds são obrigatórios')
      }
      
      console.log(`[narrar-lote] Criando job para ${artigosIds.length} artigos de ${tabelaLei}`)
      
      // Criar job
      const { data: novoJob, error: insertError } = await supabase
        .from('narracao_jobs')
        .insert({
          tabela_lei: tabelaLei,
          artigos_ids: artigosIds,
          artigos_total: artigosIds.length,
          velocidade: velocidade || 1.0,
          status: 'pendente',
        })
        .select()
        .single()
      
      if (insertError) {
        throw new Error(`Erro ao criar job: ${insertError.message}`)
      }
      
      // Iniciar processamento em background
      EdgeRuntime.waitUntil(
        processarNarracaoBackground(novoJob.id, supabaseUrl, supabaseKey)
      )
      
      return new Response(
        JSON.stringify({ success: true, jobId: novoJob.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ação: Pausar job
    if (action === 'pausar') {
      if (!jobId) throw new Error('jobId é obrigatório')
      
      await supabase
        .from('narracao_jobs')
        .update({ status: 'pausado' })
        .eq('id', jobId)
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ação: Retomar job pausado
    if (action === 'retomar') {
      if (!jobId) throw new Error('jobId é obrigatório')
      
      // Atualizar status e reiniciar processamento
      await supabase
        .from('narracao_jobs')
        .update({ status: 'pendente' })
        .eq('id', jobId)
      
      // Reiniciar processamento em background
      EdgeRuntime.waitUntil(
        processarNarracaoBackground(jobId, supabaseUrl, supabaseKey)
      )
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ação: Cancelar job
    if (action === 'cancelar') {
      if (!jobId) throw new Error('jobId é obrigatório')
      
      await supabase
        .from('narracao_jobs')
        .update({ status: 'cancelado' })
        .eq('id', jobId)
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ação: Buscar status do job
    if (action === 'status') {
      if (!jobId) throw new Error('jobId é obrigatório')
      
      const { data: job, error } = await supabase
        .from('narracao_jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      
      if (error) throw new Error(`Job não encontrado: ${error.message}`)
      
      return new Response(
        JSON.stringify({ success: true, job }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ação: Buscar job ativo para uma lei
    if (action === 'buscar-ativo') {
      if (!tabelaLei) throw new Error('tabelaLei é obrigatório')
      
      const { data: jobs } = await supabase
        .from('narracao_jobs')
        .select('*')
        .eq('tabela_lei', tabelaLei)
        .in('status', ['pendente', 'processando', 'pausado'])
        .order('created_at', { ascending: false })
        .limit(1)
      
      return new Response(
        JSON.stringify({ success: true, job: jobs?.[0] || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    throw new Error('Ação não reconhecida')
    
  } catch (error: any) {
    console.error('[narrar-lote] Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})