import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Artigo {
  numero: string;
  texto: string;
  audioUrl?: string | null;
}

// Função para salvar cache como concluído
async function salvarCacheConcluido(supabase: any, tabela: string, totalArtigos: number) {
  try {
    const { error } = await supabase
      .from('cache_leis_raspadas')
      .upsert({
        nome_tabela: tabela,
        total_artigos: totalArtigos,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'nome_tabela'
      });

    if (error) {
      console.error('Erro ao salvar cache_leis_raspadas:', error);
    } else {
      console.log(`Cache salvo para tabela "${tabela}" com ${totalArtigos} artigos`);
    }
  } catch (e) {
    console.error('Erro ao salvar cache:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tabela, artigos, textoCompleto } = await req.json();

    if (!tabela) {
      return new Response(
        JSON.stringify({ error: 'Nome da tabela não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!artigos || artigos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum artigo fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inserindo ${artigos.length} artigos na tabela "${tabela}"...`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica se a tabela existe tentando uma query simples
    const { error: checkError } = await supabase
      .from(tabela)
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar tabela:', checkError);
      return new Response(
        JSON.stringify({ error: `Tabela "${tabela}" não encontrada ou inacessível: ${checkError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepara os registros para inserção SEM o ID (deixa o banco gerar automaticamente)
    const registros = artigos.map((artigo: Artigo, index: number) => {
      const registro: Record<string, any> = {
        "Número do Artigo": `Art. ${artigo.numero}`,
        "Artigo": artigo.texto,
        "ordem_artigo": index + 1,
        "ultima_atualizacao": new Date().toISOString()
      };
      
      // Se tiver áudio, adiciona ao registro
      if (artigo.audioUrl) {
        registro["Narração"] = artigo.audioUrl;
      }
      
      return registro;
    });
    
    console.log(`Preparados ${registros.length} registros (ID será auto-gerado)`);

    // Insere os artigos
    const { data, error: insertError } = await supabase
      .from(tabela)
      .insert(registros)
      .select('id');

    if (insertError) {
      console.error('Erro ao inserir:', insertError);
      
      // Tenta inserção alternativa sem campos opcionais
      console.log('Tentando inserção simplificada...');
      
      const registrosSimples = artigos.map((artigo: Artigo, index: number) => {
        const registro: Record<string, any> = {
          "Número do Artigo": `Art. ${artigo.numero}`,
          "Artigo": artigo.texto
        };
        
        if (artigo.audioUrl) {
          registro["Narração"] = artigo.audioUrl;
        }
        
        return registro;
      });

      const { data: dataSimples, error: errorSimples } = await supabase
        .from(tabela)
        .insert(registrosSimples)
        .select('id');

      if (errorSimples) {
        return new Response(
          JSON.stringify({ error: `Erro ao inserir: ${errorSimples.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const artigosComAudio = artigos.filter((a: Artigo) => a.audioUrl).length;
      console.log(`Inseridos ${dataSimples?.length || 0} artigos (modo simplificado), ${artigosComAudio} com áudio`);
      
      // Salva na cache_leis_raspadas como concluído
      const totalInseridos = dataSimples?.length || 0;
      await salvarCacheConcluido(supabase, tabela, totalInseridos);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          inseridos: totalInseridos,
          comAudio: artigosComAudio,
          tabela,
          modo: 'simplificado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artigosComAudio = artigos.filter((a: Artigo) => a.audioUrl).length;
    const totalInseridos = data?.length || 0;
    console.log(`Inseridos ${totalInseridos} artigos com sucesso, ${artigosComAudio} com áudio`);

    // Salva na cache_leis_raspadas como concluído
    await salvarCacheConcluido(supabase, tabela, totalInseridos);

    return new Response(
      JSON.stringify({ 
        success: true,
        inseridos: totalInseridos,
        comAudio: artigosComAudio,
        tabela,
        modo: 'completo'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao popular tabela:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
