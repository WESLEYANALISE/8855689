import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de pastas do bucket para tabelas
const bucketFolderToTable: Record<string, string> = {
  'cp___c_digo_penal': 'CP - Código Penal',
  'cc___c_digo_civil': 'CC - Código Civil',
  'cf___constitui__o_fe': 'CF - Constituição Federal',
  'cpc___c_digo_de_proc': 'CPC – Código de Processo Civil',
  'cpp___c_digo_de_proc': 'CPP – Código de Processo Penal',
  'clt___consolida__o_d': 'CLT - Consolidação das Leis do Trabalho',
  'cdc___c_digo_de_defe': 'CDC – Código de Defesa do Consumidor',
  'ctn___c_digo_tribut': 'CTN – Código Tributário Nacional',
  'ctb___c_digo_de_tr_nsi': 'CTB Código de Trânsito Brasileiro',
  'ce___c_digo_eleitora': 'CE – Código Eleitoral',
};

// Extrai número do artigo do nome do arquivo
// Formato: art_100_p1_1765245500801.mp3 -> "100"
function extractArticleNumber(filename: string): string | null {
  // Remove extensão
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Padrão principal: art_XXX_pX_timestamp
  // Exemplos: art_100_p1_1765245500801, art_121_p2_1765435771928
  const mainPattern = /^art_(\d+)(?:_([a-z]))?_p\d+_\d+$/i;
  const match = nameWithoutExt.match(mainPattern);
  
  if (match) {
    const num = match[1];
    const suffix = match[2] ? `-${match[2].toUpperCase()}` : '';
    return `${num}${suffix}`;
  }
  
  // Padrões alternativos
  const altPatterns = [
    /^art(?:igo)?[_\s-]*(\d+)(?:[_\s-]*([a-z]))?/i,
    /^(\d+)(?:[_\s-]*([a-z]))?$/i,
  ];
  
  for (const pattern of altPatterns) {
    const altMatch = nameWithoutExt.match(pattern);
    if (altMatch) {
      const num = altMatch[1];
      const suffix = altMatch[2] ? `-${altMatch[2].toUpperCase()}` : '';
      return `${num}${suffix}`;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { 
      bucketName = 'audios', 
      folderPath = 'cp___c_digo_penal',
      tableName,
      dryRun = false,
      listFolders = false
    } = body;

    // Modo de debug: listar pastas
    if (listFolders) {
      const searchPath = body.searchPath || '';
      const { data: folders, error } = await supabase
        .storage
        .from(bucketName)
        .list(searchPath, { limit: 100 });
      
      return new Response(JSON.stringify({
        success: true,
        searchPath,
        folders: folders?.map(f => ({ name: f.name, isFolder: f.id === null })) || [],
        error: error?.message
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Determinar tabela
    const targetTable = tableName || bucketFolderToTable[folderPath];
    if (!targetTable) {
      return new Response(JSON.stringify({
        success: false,
        error: `Tabela não encontrada para pasta: ${folderPath}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🎵 Sincronizando áudios de ${bucketName}/${folderPath} para ${targetTable}`);

    // Listar arquivos no bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      throw new Error(`Erro ao listar arquivos: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhum arquivo encontrado na pasta',
        pasta: folderPath
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📁 ${files.length} arquivos encontrados`);

    // Agrupar por número de artigo (pegar o mais recente de cada)
    const audiosPorArtigo: Record<string, { filename: string; createdAt: string }> = {};
    
    for (const file of files) {
      if (!file.name || file.id === null) continue; // Ignorar pastas
      
      const articleNum = extractArticleNumber(file.name);
      if (!articleNum) {
        console.log(`⚠️ Não foi possível extrair número do artigo de: ${file.name}`);
        continue;
      }
      
      const existingAudio = audiosPorArtigo[articleNum];
      const fileCreatedAt = file.created_at || '';
      
      // Se não existe ou o arquivo atual é mais recente, usar este
      if (!existingAudio || fileCreatedAt > existingAudio.createdAt) {
        audiosPorArtigo[articleNum] = {
          filename: file.name,
          createdAt: fileCreatedAt
        };
      }
    }

    console.log(`🔢 ${Object.keys(audiosPorArtigo).length} artigos únicos com áudio`);

    // Buscar artigos da tabela
    const { data: artigos, error: fetchError } = await supabase
      .from(targetTable)
      .select('id, "Número do Artigo", "Narração"');

    if (fetchError) {
      throw new Error(`Erro ao buscar artigos: ${fetchError.message}`);
    }

    // Construir URL pública base
    const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${folderPath}`;

    const resultados = {
      total: artigos?.length || 0,
      audiosEncontrados: Object.keys(audiosPorArtigo).length,
      atualizados: 0,
      jaTemAudio: 0,
      semCorrespondencia: 0,
      erros: 0,
      exemplos: [] as Array<{ artigo: string; audioUrl: string }>
    };

    // Atualizar cada artigo
    for (const artigo of artigos || []) {
      const numeroArtigo = artigo["Número do Artigo"];
      if (!numeroArtigo) continue;

      // Normalizar número do artigo para busca
      const numeroNormalizado = numeroArtigo.toString().trim();
      
      // Tentar encontrar áudio correspondente
      let audioInfo = audiosPorArtigo[numeroNormalizado];
      
      // Tentar variações se não encontrar diretamente
      if (!audioInfo) {
        // Tentar sem sufixos
        const numeroBase = numeroNormalizado.replace(/[^\d]/g, '');
        audioInfo = audiosPorArtigo[numeroBase];
      }

      if (!audioInfo) {
        resultados.semCorrespondencia++;
        continue;
      }

      // Verificar se já tem narração
      if (artigo["Narração"] && artigo["Narração"].trim() !== '') {
        resultados.jaTemAudio++;
        continue;
      }

      const audioUrl = `${publicUrlBase}/${encodeURIComponent(audioInfo.filename)}`;

      if (resultados.exemplos.length < 5) {
        resultados.exemplos.push({
          artigo: numeroArtigo,
          audioUrl
        });
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from(targetTable)
          .update({ Narração: audioUrl })
          .eq('id', artigo.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar Art. ${numeroArtigo}: ${updateError.message}`);
          resultados.erros++;
          continue;
        }
      }

      resultados.atualizados++;
    }

    console.log(`✅ Sincronização concluída!`);
    console.log(`📊 Atualizados: ${resultados.atualizados}`);
    console.log(`📊 Já tinham áudio: ${resultados.jaTemAudio}`);
    console.log(`📊 Sem correspondência: ${resultados.semCorrespondencia}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      tableName: targetTable,
      folderPath,
      resultados
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro geral:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
