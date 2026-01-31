import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para chamar Gemini com fallback de chaves
async function chamarGemini(prompt: string, apiKeys: string[]): Promise<string> {
  const modelo = 'gemini-2.5-flash';
  
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`[gerar-resumo-obra] Tentando GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 16000
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-resumo-obra] Erro na API Gemini: ${response.status}`, errorText.substring(0, 200));
        
        if (response.status === 429 || response.status === 503) {
          continue;
        }
        throw new Error(`GEMINI_ERROR_${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Resposta vazia do Gemini');
      }
      
      console.log(`[gerar-resumo-obra] ✅ Sucesso com GEMINI_KEY_${i + 1}`);
      return text;
    } catch (error) {
      console.log(`[gerar-resumo-obra] ❌ GEMINI_KEY_${i + 1} falhou:`, error);
      if (i === apiKeys.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Todas as chaves falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filosofo, obra, ano, tituloOriginal } = await req.json();

    if (!filosofo || !obra) {
      return new Response(
        JSON.stringify({ error: 'Filósofo e obra são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe resumo no cache
    console.log(`[gerar-resumo-obra] Verificando cache para: "${obra}" de ${filosofo}`);
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('obras_filosofos_resumos')
      .select('resumo')
      .eq('filosofo', filosofo)
      .eq('titulo_obra', obra)
      .maybeSingle();

    if (cacheData?.resumo) {
      console.log(`[gerar-resumo-obra] ✅ Resumo encontrado no cache para "${obra}"`);
      return new Response(
        JSON.stringify({ resumo: cacheData.resumo, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar chaves disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    console.log(`[gerar-resumo-obra] Gerando resumo para: "${obra}" de ${filosofo}`);

    const prompt = `Você é um professor de Filosofia do Direito, especialista em ${filosofo}.

Crie um RESUMO ACADÊMICO DETALHADO e ELABORADO da obra "${obra}" ${ano ? `(${ano})` : ''} de ${filosofo}.

O resumo deve ser voltado para estudantes de Direito e incluir:

## Estrutura obrigatória:

### 1. Contexto Histórico e Filosófico
- Período em que a obra foi escrita
- Influências que ${filosofo} recebeu
- Problemas filosóficos que a obra busca resolver

### 2. Tese Central da Obra
- A ideia principal defendida
- Os argumentos fundamentais
- A estrutura argumentativa

### 3. Conceitos-Chave
- Defina os principais conceitos introduzidos ou desenvolvidos na obra
- Explique cada conceito com clareza

### 4. Impacto no Pensamento Jurídico
- Como essa obra influenciou o Direito
- Aplicações práticas no ordenamento jurídico moderno
- Conexões com a Constituição Federal de 1988 e o sistema jurídico brasileiro

### 5. Citações Relevantes
> Inclua 2-3 citações famosas da obra (ou atribuídas ao autor sobre os temas da obra)

### 6. Críticas e Debates
- Principais críticas à obra
- Filósofos que dialogaram com essas ideias
- Debates contemporâneos relacionados

### 7. Relevância Atual
- Por que essa obra ainda é estudada?
- Aplicações contemporâneas das ideias

## Diretrizes de formatação:
- Use **negrito** para termos importantes
- Use *itálico* para termos em latim ou estrangeiros
- Use > para citações
- Use listas quando apropriado
- Escreva em português brasileiro claro e acadêmico
- Seja DETALHADO e PROFUNDO na análise
- Mínimo de 1500 palavras`;

    const resumo = await chamarGemini(prompt, apiKeys);

    // Salvar no cache
    console.log(`[gerar-resumo-obra] Salvando resumo no cache...`);
    
    const { error: insertError } = await supabase
      .from('obras_filosofos_resumos')
      .upsert({
        filosofo,
        titulo_obra: obra,
        titulo_original: tituloOriginal || obra,
        ano: ano || null,
        resumo
      }, { onConflict: 'filosofo,titulo_obra' });

    if (insertError) {
      console.error('[gerar-resumo-obra] Erro ao salvar cache:', insertError);
    } else {
      console.log(`[gerar-resumo-obra] ✅ Resumo salvo no cache`);
    }

    console.log(`[gerar-resumo-obra] ✅ Resumo gerado para "${obra}"`);

    return new Response(
      JSON.stringify({ resumo, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-resumo-obra] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
