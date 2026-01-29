import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function gerarExplicacaoLei(lei: any): Promise<string> {
  const prompt = `Explique de forma clara e didática a seguinte lei brasileira:

**${lei.numero_lei}**
${lei.ementa || ''}

Artigos:
${lei.artigos?.map((a: any) => `${a.numero}: ${a.texto}`).join('\n\n') || 'Sem artigos'}

Responda em português brasileiro, explicando:
1. O que esta lei faz/altera
2. Quem é afetado por ela
3. Principais mudanças práticas
4. Quando entra em vigor

Seja objetivo e use linguagem acessível.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Você é um especialista em direito brasileiro que explica leis de forma clara e acessível.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao gerar explicação: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function gerarExplicacaoArtigo(lei: any, artigo: any): Promise<string> {
  const prompt = `Explique de forma clara e didática o seguinte artigo de lei:

**${artigo.numero}**
${artigo.texto}

Lei: ${lei.numero_lei}
${lei.ementa || ''}

Explique em português brasileiro:
- O que este artigo determina
- Como afeta na prática
- Termos técnicos usados

Seja objetivo e use linguagem acessível.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Você é um especialista em direito brasileiro que explica artigos de lei de forma clara e acessível.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao gerar explicação do artigo: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verificar se foi passado lei_id específico
    let leiId: string | null = null;
    try {
      const body = await req.json();
      leiId = body.lei_id || null;
    } catch {
      // Sem body = modo batch
    }

    let leisPendentes: any[] = [];
    
    if (leiId) {
      // Modo específico: buscar lei pelo numero_lei
      console.log(`🎯 Processando lei específica: ${leiId}`);
      const { data, error } = await supabase
        .from('resenha_diaria')
        .select('*')
        .eq('numero_lei', leiId)
        .maybeSingle();
      
      if (error) throw error;
      if (data) leisPendentes = [data];
    } else {
      // Modo batch: buscar leis sem explicação
      const { data, error: erroBusca } = await supabase
        .from('resenha_diaria')
        .select('*')
        .eq('status', 'ativo')
        .is('explicacao_lei', null)
        .order('data_publicacao', { ascending: false })
        .limit(5);

      if (erroBusca) throw erroBusca;
      leisPendentes = data || [];
    }

    console.log(`Encontradas ${leisPendentes.length} leis para processar`);

    let processadas = 0;
    const resultados: any[] = [];

    for (const lei of leisPendentes || []) {
      try {
        console.log(`Processando lei: ${lei.numero_lei}`);

        // Gerar explicação da lei
        const explicacaoLei = await gerarExplicacaoLei(lei);

        // Gerar explicações dos artigos
        const explicacoesArtigos: Record<string, string> = {};
        if (lei.artigos && lei.artigos.length > 0) {
          for (let i = 0; i < lei.artigos.length && i < 10; i++) { // Limitar a 10 artigos por vez
            const artigo = lei.artigos[i];
            try {
              const explicacaoArtigo = await gerarExplicacaoArtigo(lei, artigo);
              explicacoesArtigos[i.toString()] = explicacaoArtigo;
              console.log(`  - Artigo ${artigo.numero} explicado`);
            } catch (erroArtigo) {
              console.error(`  - Erro no artigo ${artigo.numero}:`, erroArtigo);
            }
            // Pequena pausa entre requisições para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Atualizar no banco
        const { error: erroUpdate } = await supabase
          .from('resenha_diaria')
          .update({
            explicacao_lei: explicacaoLei,
            explicacoes_artigos: explicacoesArtigos,
            updated_at: new Date().toISOString()
          })
          .eq('id', lei.id);

        if (erroUpdate) throw erroUpdate;

        processadas++;
        resultados.push({
          id: lei.id,
          numero_lei: lei.numero_lei,
          artigos_explicados: Object.keys(explicacoesArtigos).length,
          status: 'sucesso'
        });

        console.log(`Lei ${lei.numero_lei} processada com sucesso`);

        // Pausa entre leis
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (erroLei) {
        console.error(`Erro ao processar lei ${lei.numero_lei}:`, erroLei);
        resultados.push({
          id: lei.id,
          numero_lei: lei.numero_lei,
          status: 'erro',
          erro: erroLei instanceof Error ? erroLei.message : 'Erro desconhecido'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processadas,
      total_pendentes: leisPendentes?.length || 0,
      resultados
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
