import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean);

const supabaseUrl = "https://izspjvegxdfgkgibpyst.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function callGemini(prompt: string): Promise<string> {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
          }),
        }
      );
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch { continue; }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { regenerate } = await req.json().catch(() => ({ regenerate: false }));
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const hoje = new Date().toISOString().split('T')[0];

    // Check cache
    if (!regenerate) {
      const { data: cached } = await supabase
        .from('admin_daily_feedback')
        .select('feedback_text')
        .eq('data', hoje)
        .maybeSingle();
      
      if (cached?.feedback_text) {
        return new Response(JSON.stringify({ feedback: cached.feedback_text, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch metrics
    const inicioHoje = `${hoje}T00:00:00.000Z`;
    const fimHoje = `${hoje}T23:59:59.999Z`;

    const [
      { count: totalUsuarios },
      { count: novosHoje },
      { data: onlineData },
      { data: paginasData },
      { data: premiumHoje },
      { data: totalPremium },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', inicioHoje).lte('created_at', fimHoje),
      supabase.rpc('get_admin_online_count'),
      supabase.rpc('get_admin_paginas_populares', { p_dias: 1 }),
      supabase.from('subscriptions').select('*').eq('status', 'authorized').gte('created_at', inicioHoje),
      supabase.from('subscriptions').select('*').eq('status', 'authorized'),
    ]);

    const paginasTop = (paginasData || []).slice(0, 10).map((p: any) => `${p.page_title || p.page_path}: ${p.total} views`).join('\n');

    // Yesterday comparison
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const { count: novosOntem } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${ontem}T00:00:00.000Z`)
      .lte('created_at', `${ontem}T23:59:59.999Z`);

    const prompt = `Você é um analista de dados de um aplicativo jurídico educacional brasileiro. Gere um feedback diário conciso e direto em português brasileiro (PT-BR) para o administrador.

DADOS DE HOJE (${hoje}):
- Total de usuários cadastrados: ${totalUsuarios || 0}
- Novos cadastros hoje: ${novosHoje || 0}
- Novos cadastros ontem: ${novosOntem || 0}
- Usuários online agora: ${onlineData || 0}
- Novos assinantes premium hoje: ${premiumHoje?.length || 0}
- Total de assinantes premium ativos: ${totalPremium?.length || 0}
- Taxa de conversão premium: ${totalUsuarios ? (((totalPremium?.length || 0) / totalUsuarios) * 100).toFixed(2) : 0}%

PÁGINAS MAIS ACESSADAS HOJE:
${paginasTop || 'Sem dados suficientes'}

INSTRUÇÕES:
1. Comece com um emoji e saudação breve
2. Destaque os números mais importantes com comparações (ontem vs hoje)  
3. Analise tendências de uso (quais áreas estão mais populares)
4. Dê 2-3 recomendações práticas e específicas
5. Use formatação markdown com **negrito**, listas e emojis
6. Seja direto, máximo 300 palavras
7. Inclua porcentagens de crescimento/queda quando relevante`;

    const feedback = await callGemini(prompt);

    // Save/update cache
    if (regenerate) {
      await supabase.from('admin_daily_feedback').delete().eq('data', hoje);
    }
    await supabase.from('admin_daily_feedback').insert({ data: hoje, feedback_text: feedback });

    return new Response(JSON.stringify({ feedback, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin-daily-feedback] Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
