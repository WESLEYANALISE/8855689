import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtigoAtual {
  id: number;
  numero: string;
  conteudo: string;
  narracao?: string;
  ordem: number;
}

interface ArtigoNovo {
  numero: string;
  conteudo: string;
  ordem: number;
}

interface MapeamentoAudio {
  numeroArtigo: string;
  acao: 'manter' | 'remover' | 'ignorar';
  urlAudio?: string;
  novaOrdem?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tableName, 
      artigosNovos, 
      mapeamentoAudios,
      deletarAudiosRemovidos = true
    } = await req.json() as {
      tableName: string;
      artigosNovos: ArtigoNovo[];
      mapeamentoAudios: MapeamentoAudio[];
      deletarAudiosRemovidos?: boolean;
    };

    console.log(`[ATUALIZAR-LEI-INTELIGENTE] Iniciando atualização de ${tableName}`);
    console.log(`[ATUALIZAR-LEI-INTELIGENTE] ${artigosNovos.length} artigos novos`);
    console.log(`[ATUALIZAR-LEI-INTELIGENTE] ${mapeamentoAudios.length} mapeamentos de áudio`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Criar mapa de áudios a manter/remover
    const mapaAudios = new Map<string, MapeamentoAudio>();
    for (const m of mapeamentoAudios) {
      mapaAudios.set(m.numeroArtigo, m);
    }

    // Estatísticas
    let audiosMantidos = 0;
    let audiosRemovidos = 0;
    let audiosParaRegravar = 0;
    const urlsParaDeletar: string[] = [];

    // Preparar novos artigos com áudios preservados onde aplicável
    const artigosParaInserir = artigosNovos.map((artigo, index) => {
      const mapeamento = mapaAudios.get(artigo.numero);
      let narracao: string | null = null;

      if (mapeamento) {
        if (mapeamento.acao === 'manter' && mapeamento.urlAudio) {
          // Texto igual - manter áudio
          narracao = mapeamento.urlAudio;
          audiosMantidos++;
        } else if (mapeamento.acao === 'remover' && mapeamento.urlAudio) {
          // Texto mudou OU artigo foi removido - apagar áudio
          urlsParaDeletar.push(mapeamento.urlAudio);
          audiosRemovidos++;
          audiosParaRegravar++;
        }
      }
      // Se não tem mapeamento, é artigo novo - não tem áudio

      // Retornar objeto com id sequencial
      const registro: Record<string, any> = {
        "id": index + 1,
        "Número do Artigo": artigo.numero,
        "Artigo": artigo.conteudo,
        "Narração": narracao
      };
      
      return registro;
    });

    // Coletar URLs de áudios de artigos REMOVIDOS (que não estão mais na nova versão)
    for (const m of mapeamentoAudios) {
      if (m.acao === 'remover' && m.urlAudio) {
        // Verificar se já não está na lista e se o artigo não existe mais
        const artigoAindaExiste = artigosNovos.some(a => a.numero === m.numeroArtigo);
        if (!artigoAindaExiste && !urlsParaDeletar.includes(m.urlAudio)) {
          urlsParaDeletar.push(m.urlAudio);
          audiosRemovidos++;
        }
      }
    }

    console.log(`[ATUALIZAR-LEI-INTELIGENTE] Áudios: ${audiosMantidos} mantidos, ${audiosRemovidos} removidos, ${audiosParaRegravar} para regravar`);
    console.log(`[ATUALIZAR-LEI-INTELIGENTE] URLs para deletar do Storage: ${urlsParaDeletar.length}`);

    // Deletar áudios do Storage (se habilitado)
    if (deletarAudiosRemovidos && urlsParaDeletar.length > 0) {
      const pathsParaDeletar: string[] = [];
      
      for (const url of urlsParaDeletar) {
        // Extrair path do Storage a partir da URL
        // Formato esperado: https://xxx.supabase.co/storage/v1/object/public/audios/path/to/file.mp3
        const match = url.match(/\/storage\/v1\/object\/public\/audios\/(.+)$/);
        if (match) {
          pathsParaDeletar.push(match[1]);
        }
      }

      if (pathsParaDeletar.length > 0) {
        console.log(`[ATUALIZAR-LEI-INTELIGENTE] Deletando ${pathsParaDeletar.length} arquivos do Storage...`);
        
        const { error: storageError } = await supabase.storage
          .from('audios')
          .remove(pathsParaDeletar);
        
        if (storageError) {
          console.error('[ATUALIZAR-LEI-INTELIGENTE] Erro ao deletar áudios:', storageError);
          // Não falha a operação, apenas loga
        } else {
          console.log('[ATUALIZAR-LEI-INTELIGENTE] Áudios deletados com sucesso');
        }
      }
    }

    // Limpar tabela existente
    console.log(`[ATUALIZAR-LEI-INTELIGENTE] Limpando tabela ${tableName}...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) {
      console.error('[ATUALIZAR-LEI-INTELIGENTE] Erro ao limpar tabela:', deleteError);
      throw new Error(`Erro ao limpar tabela: ${deleteError.message}`);
    }

    // Inserir novos artigos em lotes
    console.log(`[ATUALIZAR-LEI-INTELIGENTE] Inserindo ${artigosParaInserir.length} artigos...`);
    const BATCH_SIZE = 100;
    let totalInseridos = 0;

    for (let i = 0; i < artigosParaInserir.length; i += BATCH_SIZE) {
      const lote = artigosParaInserir.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(lote);

      if (insertError) {
        console.error(`[ATUALIZAR-LEI-INTELIGENTE] Erro ao inserir lote ${i}:`, insertError);
        throw new Error(`Erro ao inserir artigos: ${insertError.message}`);
      }

      totalInseridos += lote.length;
      console.log(`[ATUALIZAR-LEI-INTELIGENTE] Inseridos ${totalInseridos}/${artigosParaInserir.length}`);
    }

    // Atualizar cache de raspagem se existir
    try {
      await supabase
        .from('cache_leis_raspadas')
        .upsert({
          nome_tabela: tableName,
          total_artigos: totalInseridos,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'nome_tabela'
        });
    } catch (e) {
      console.log('[ATUALIZAR-LEI-INTELIGENTE] Cache não atualizado (tabela pode não existir)');
    }

    const resultado = {
      success: true,
      tableName,
      totalInseridos,
      audiosMantidos,
      audiosRemovidos,
      audiosParaRegravar,
      urlsDeletadas: urlsParaDeletar.length
    };

    console.log('[ATUALIZAR-LEI-INTELIGENTE] Atualização concluída:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ATUALIZAR-LEI-INTELIGENTE] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
