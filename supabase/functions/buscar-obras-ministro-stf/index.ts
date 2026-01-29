import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { membro_id } = await req.json();
    
    if (!membro_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'membro_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando obras para ministro:', membro_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar ministro e seu slug da biblioteca
    const { data: ministro, error: ministroError } = await supabase
      .from('tres_poderes_ministros_stf')
      .select('id, nome, nome_completo, biblioteca_slug, foto_url')
      .eq('id', membro_id)
      .single();

    if (ministroError || !ministro) {
      console.error('Ministro não encontrado:', ministroError);
      return new Response(
        JSON.stringify({ success: false, error: 'Ministro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ministro.biblioteca_slug) {
      console.error('Ministro sem biblioteca_slug:', ministro.nome);
      return new Response(
        JSON.stringify({ success: false, error: 'Slug da biblioteca não configurado para este ministro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Garantir que o ministro existe na tabela aprofundamento_membros (para foreign key das obras)
    console.log('Verificando se ministro existe em aprofundamento_membros:', membro_id);
    const { data: membroExistente, error: membroCheckError } = await supabase
      .from('aprofundamento_membros')
      .select('id')
      .eq('id', membro_id)
      .single();

    console.log('Resultado da verificação:', { membroExistente, membroCheckError: membroCheckError?.message });

    if (!membroExistente) {
      console.log('Membro não existe, criando entrada em aprofundamento_membros para:', ministro.nome);
      const { data: novoMembro, error: insertMembroError } = await supabase
        .from('aprofundamento_membros')
        .insert({
          id: ministro.id,
          nome: ministro.nome,
          nome_completo: ministro.nome_completo,
          instituicao: 'stf',
          cargo: 'Ministro do STF',
          foto_url: ministro.foto_url,
          ativo: true
        })
        .select()
        .single();

      if (insertMembroError) {
        console.error('ERRO CRÍTICO ao criar membro em aprofundamento_membros:', insertMembroError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Falha ao sincronizar ministro com aprofundamento_membros',
            details: insertMembroError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Membro criado com sucesso em aprofundamento_membros:', novoMembro?.id);
    } else {
      console.log('Membro já existe em aprofundamento_membros:', membroExistente.id);
    }

    // Montar URL da biblioteca do STF
    const url = `https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=${ministro.biblioteca_slug}Livros`;
    console.log('URL da biblioteca:', url);

    // Raspar página com Firecrawl
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Erro ao raspar página:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao acessar biblioteca do STF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdownContent = scrapeData.data?.markdown || '';
    console.log('Conteúdo raspado, tamanho:', markdownContent.length);

    if (!markdownContent || markdownContent.length < 100) {
      console.log('Conteúdo muito curto ou vazio');
      return new Response(
        JSON.stringify({ success: true, obras_encontradas: 0, message: 'Página sem obras listadas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar com Gemini para extrair obras estruturadas
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Analise o seguinte conteúdo da biblioteca do STF e extraia uma lista de obras/livros publicados pelo ministro ou sobre ele.

Para cada obra, extraia:
- titulo: string (título completo da obra)
- ano: number (ano de publicação, extrair do texto. Se não encontrar, deixe null)
- editora: string (editora, se disponível)
- tipo: string ('autoria' para obras de autoria do ministro, 'participacao' para participações, 'sobre' para obras sobre o ministro)
- descricao: string (breve descrição se disponível, máximo 150 caracteres)

IMPORTANTE:
- Retorne APENAS um array JSON válido, sem markdown ou explicações
- Não inclua entradas duplicadas
- Limite a 50 obras mais relevantes
- Se não encontrar obras, retorne []

Conteúdo da biblioteca:
${markdownContent.substring(0, 15000)}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um extrator de dados especializado em bibliotecas jurídicas. Retorne APENAS JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('Resposta da IA:', aiContent.substring(0, 500));

    // Limpar e parsear JSON
    let obras: Array<{ titulo?: string; ano?: number; editora?: string; tipo?: string; descricao?: string }> = [];
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      obras = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da IA:', parseError);
      // Tentar extrair array do conteúdo
      const match = aiContent.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          obras = JSON.parse(match[0]);
        } catch {
          console.error('Falha na segunda tentativa de parse');
        }
      }
    }

    if (!Array.isArray(obras)) {
      obras = [];
    }

    console.log(`Encontradas ${obras.length} obras`);

    // Salvar obras no banco
    let obrasSalvas = 0;
    for (const obra of obras) {
      if (!obra.titulo) continue;

      const obraData = {
        membro_id: membro_id,
        titulo: obra.titulo.substring(0, 500),
        ano: obra.ano || null,
        editora: obra.editora?.substring(0, 200) || null,
        descricao: obra.descricao?.substring(0, 500) || null,
        tipo_obra: obra.tipo || 'autoria',
        fonte: 'biblioteca_stf'
      };

      // Tentar upsert primeiro
      const { error: upsertError } = await supabase
        .from('aprofundamento_obras')
        .upsert(obraData, {
          onConflict: 'membro_id,titulo',
          ignoreDuplicates: true
        });

      if (!upsertError) {
        obrasSalvas++;
      } else {
        console.log('Upsert falhou, tentando insert:', upsertError.message);
        // Fallback: tentar insert simples (ignora se já existe)
        const { error: insertError } = await supabase
          .from('aprofundamento_obras')
          .insert(obraData);
        
        if (!insertError) {
          obrasSalvas++;
        } else if (!insertError.message?.includes('duplicate')) {
          console.error('Erro ao salvar obra:', insertError);
        }
      }
    }

    console.log(`${obrasSalvas} obras salvas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        obras_encontradas: obras.length,
        obras_salvas: obrasSalvas,
        ministro: ministro.nome
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
