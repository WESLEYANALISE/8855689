import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// Extrair handle ou channel ID do URL do canal
function extrairInfoDoUrl(url: string): { tipo: 'handle' | 'channel' | 'user' | 'c', valor: string } | null {
  if (!url) return null;
  
  try {
    // Padrões possíveis de URL do YouTube:
    // https://www.youtube.com/@STF_oficial
    // https://www.youtube.com/channel/UCxxxxxx
    // https://www.youtube.com/user/username
    // https://www.youtube.com/c/channelname
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Handle (@nome)
    if (pathname.startsWith('/@')) {
      return { tipo: 'handle', valor: pathname.substring(2) };
    }
    
    // Channel ID direto
    if (pathname.startsWith('/channel/')) {
      return { tipo: 'channel', valor: pathname.replace('/channel/', '') };
    }
    
    // User
    if (pathname.startsWith('/user/')) {
      return { tipo: 'user', valor: pathname.replace('/user/', '') };
    }
    
    // Custom URL /c/
    if (pathname.startsWith('/c/')) {
      return { tipo: 'c', valor: pathname.replace('/c/', '') };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair info do URL:', error);
    return null;
  }
}

// Resolver Channel ID a partir do URL do canal
async function resolverChannelIdDoUrl(urlCanal: string, apiKey: string): Promise<string | null> {
  const info = extrairInfoDoUrl(urlCanal);
  
  if (!info) {
    console.log(`Não foi possível extrair informações do URL: ${urlCanal}`);
    return null;
  }
  
  console.log(`Tipo: ${info.tipo}, Valor: ${info.valor}`);
  
  // Se já é um channel ID direto
  if (info.tipo === 'channel') {
    return info.valor;
  }
  
  // Resolver via API
  let apiUrl: string;
  
  if (info.tipo === 'handle') {
    // Usar forHandle para resolver @handles
    apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${info.valor}&key=${apiKey}`;
  } else if (info.tipo === 'user') {
    // Usar forUsername para resolver /user/
    apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${info.valor}&key=${apiKey}`;
  } else {
    // Para /c/, precisamos usar search
    apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(info.valor)}&maxResults=1&key=${apiKey}`;
  }
  
  console.log(`API URL: ${apiUrl.replace(apiKey, '***')}`);
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro na API: ${response.status} - ${errorText}`);
    return null;
  }
  
  const data = await response.json();
  
  if (info.tipo === 'c') {
    // Resultado da Search API
    if (data.items && data.items.length > 0) {
      return data.items[0].id.channelId;
    }
  } else {
    // Resultado da Channels API
    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }
  }
  
  console.log(`Nenhum canal encontrado para: ${urlCanal}`);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canalId, maxResults = 15 } = await req.json();

    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY não configurada');
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar canal específico ou todos os canais ativos
    let query = supabase.from('canais_audiencias').select('*').eq('ativo', true);
    if (canalId) {
      query = query.eq('id', canalId);
    }
    
    const { data: canais, error: canaisError } = await query;

    if (canaisError) throw canaisError;
    if (!canais || canais.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum canal ativo encontrado', videos: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando vídeos de ${canais.length} canal(is)`);

    const todosVideos: any[] = [];
    const erros: string[] = [];

    for (const canal of canais) {
      console.log(`\n=== Processando canal: ${canal.nome} ===`);
      console.log(`URL do canal: ${canal.url_canal}`);
      console.log(`Channel ID armazenado: ${canal.channel_id}`);

      let channelId = canal.channel_id;

      // Se tem url_canal, resolver o channel_id a partir dele
      if (canal.url_canal) {
        console.log(`Resolvendo Channel ID do URL: ${canal.url_canal}`);
        const channelIdResolvido = await resolverChannelIdDoUrl(canal.url_canal, YOUTUBE_API_KEY);
        
        if (channelIdResolvido) {
          console.log(`Channel ID resolvido: ${channelIdResolvido}`);
          
          // Atualizar se diferente do armazenado
          if (channelIdResolvido !== canal.channel_id) {
            console.log(`Atualizando channel_id de ${canal.channel_id} para ${channelIdResolvido}`);
            await supabase
              .from('canais_audiencias')
              .update({ channel_id: channelIdResolvido })
              .eq('id', canal.id);
          }
          
          channelId = channelIdResolvido;
        } else {
          console.log(`Não foi possível resolver channel_id do URL`);
          erros.push(`${canal.nome}: Não foi possível resolver o URL do canal`);
          continue;
        }
      }

      if (!channelId) {
        console.log(`Canal ${canal.nome} sem channel_id válido`);
        erros.push(`${canal.nome}: Sem channel_id válido`);
        continue;
      }

      // Buscar uploads playlist do canal
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
      console.log(`Buscando dados do canal...`);
      
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) {
        console.log(`Canal não encontrado: ${channelId}`);
        erros.push(`${canal.nome}: Canal não encontrado no YouTube`);
        continue;
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      console.log(`Playlist de uploads: ${uploadsPlaylistId}`);

      // Buscar vídeos recentes
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${maxResults}&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}`;
      const playlistResponse = await fetch(playlistUrl);

      if (!playlistResponse.ok) {
        const errorText = await playlistResponse.text();
        console.error(`Erro ao buscar playlist: ${playlistResponse.status} - ${errorText}`);
        erros.push(`${canal.nome}: Erro ao buscar vídeos`);
        continue;
      }

      const videosData = await playlistResponse.json();
      console.log(`Encontrados ${videosData.items?.length || 0} vídeos`);

      // Processar vídeos encontrados
      let videosInseridos = 0;
      for (const item of videosData.items || []) {
        const videoId = item.contentDetails.videoId;
        const titulo = item.snippet.title;

        // Filtrar vídeos relevantes (sessões, audiências, julgamentos)
        const titulosRelevantes = [
          'sessão', 'plenário', 'julgamento', 'turma', 'audiência', 
          'votação', 'recurso', 'ação', 'habeas', 'ao vivo', 'live',
          'sustentação', 'pauta', 'deliberação', 'extraordinária', 
          'ordinária', 'tribunal', 'stf', 'stj', 'tst', 'tse', 'cnj'
        ];
        
        const tituloLower = titulo.toLowerCase();
        const isRelevante = titulosRelevantes.some(termo => tituloLower.includes(termo));

        if (!isRelevante) {
          console.log(`Vídeo ignorado (não parece ser audiência): ${titulo.substring(0, 50)}...`);
          continue;
        }

        // Verificar se já existe no banco
        const { data: existente } = await supabase
          .from('audiencias_videos')
          .select('id')
          .eq('video_id', videoId)
          .single();

        if (existente) {
          console.log(`Vídeo já existe: ${videoId}`);
          continue;
        }

        // Inserir novo vídeo
        const { error: insertError } = await supabase
          .from('audiencias_videos')
          .insert({
            canal_id: canal.id,
            video_id: videoId,
            titulo: titulo,
            descricao: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            publicado_em: item.snippet.publishedAt,
            status: 'pendente'
          });

        if (insertError) {
          console.error(`Erro ao inserir vídeo ${videoId}:`, insertError);
        } else {
          videosInseridos++;
          console.log(`✓ Novo vídeo inserido: ${titulo.substring(0, 50)}...`);
          todosVideos.push({
            videoId,
            titulo,
            tribunal: canal.tribunal,
            publicadoEm: item.snippet.publishedAt
          });
        }
      }

      console.log(`${videosInseridos} novos vídeos inseridos para ${canal.nome}`);

      // Atualizar data de última verificação do canal
      await supabase
        .from('canais_audiencias')
        .update({ ultima_verificacao: new Date().toISOString() })
        .eq('id', canal.id);
    }

    console.log(`\n=== RESUMO ===`);
    console.log(`Total de ${todosVideos.length} novos vídeos encontrados`);
    if (erros.length > 0) {
      console.log(`Erros: ${erros.join(', ')}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        novosVideos: todosVideos.length,
        videos: todosVideos,
        erros: erros.length > 0 ? erros : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função buscar-videos-canais-tribunais:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
