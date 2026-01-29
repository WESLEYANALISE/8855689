import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, tipo } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    console.log('Query recebida:', query);
    
    // Usar Gemini para interpretar a busca e extrair termos relevantes
    let termosBusca = '';
    let areasSugeridas: string[] = [];
    
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analise esta busca do usuário: "${query}"

O usuário está buscando materiais jurídicos (livros ou vídeos).

Retorne um JSON com:
- "termos": array com 2-4 termos de busca relevantes para encontrar o material (ex: ["direito penal", "crimes", "penas"])
- "areas": array com 1-3 áreas do direito relacionadas (ex: ["Direito Penal", "Direito Processual Penal"])

Se o usuário pedir apenas "vídeo" ou "livro" sem especificar tema, sugira áreas gerais populares do direito.

Responda APENAS com o JSON, sem explicações.`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 200
            }
          })
        }
      );
      
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          termosBusca = parsed.termos?.[0] || query;
          areasSugeridas = parsed.areas || [];
          console.log('Termos extraídos pelo Gemini:', parsed.termos);
          console.log('Áreas sugeridas:', areasSugeridas);
        }
      }
    } catch (e) {
      console.error('Erro ao usar Gemini:', e);
      // Fallback para busca simples
      termosBusca = query.toLowerCase()
        .replace(/busque?|buscar|recomende|material|sobre|vídeos?|livros?/gi, '')
        .trim() || 'direito';
    }
    
    console.log('Buscando materiais com termos:', termosBusca);
    
    // Função para normalizar texto (remover acentuação)
    const normalizar = (texto: string) => {
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };
    
    const termosNormalizados = normalizar(termosBusca);
    console.log('Termos normalizados:', termosNormalizados);
    
    const resultado: any = {
      livros: [],
      videos: [],
      query: termosBusca
    };
    
    // Buscar livros se solicitado
    if (tipo === 'livros' || tipo === 'todos') {
      let livrosEstudos: any[] = [];
      let livrosOAB: any[] = [];
      
      // Buscar com termos normalizados (ignorando acentuação)
      // Primeiro tenta com áreas sugeridas
      if (areasSugeridas.length > 0) {
        // Buscar por áreas com e sem acentuação
        let estudosConditions: string[] = [];
        let oabConditions: string[] = [];
        
        areasSugeridas.forEach(area => {
          const areaNormalizada = normalizar(area);
          estudosConditions.push(`Área.ilike.%${area}%`);
          estudosConditions.push(`Área.ilike.%${areaNormalizada}%`);
          oabConditions.push(`Área.ilike.%${area}%`);
          oabConditions.push(`Área.ilike.%${areaNormalizada}%`);
        });
        
        const { data: estudosData } = await supabase
          .from('BIBLIOTECA-ESTUDOS')
          .select('*')
          .or(estudosConditions.join(','))
          .limit(20);
        
        const { data: oabData } = await supabase
          .from('BIBILIOTECA-OAB')
          .select('*')
          .or(oabConditions.join(','))
          .limit(20);
        
        livrosEstudos = estudosData || [];
        livrosOAB = oabData || [];
      }
      
      // Se não encontrou nada, buscar por termos com e sem acentuação
      if (livrosEstudos.length === 0 && livrosOAB.length === 0) {
        const { data: estudosData } = await supabase
          .from('BIBLIOTECA-ESTUDOS')
          .select('*')
          .or(`Tema.ilike.%${termosBusca}%,Área.ilike.%${termosBusca}%,Tema.ilike.%${termosNormalizados}%,Área.ilike.%${termosNormalizados}%`)
          .limit(20);
        
        const { data: oabData } = await supabase
          .from('BIBILIOTECA-OAB')
          .select('*')
          .or(`Tema.ilike.%${termosBusca}%,Área.ilike.%${termosBusca}%,Tema.ilike.%${termosNormalizados}%,Área.ilike.%${termosNormalizados}%`)
          .limit(20);
        
        livrosEstudos = estudosData || [];
        livrosOAB = oabData || [];
      }
      
      // Mapear livros da Biblioteca de Estudos
      if (livrosEstudos && livrosEstudos.length > 0) {
        resultado.livros.push(...livrosEstudos.map((livro: any) => ({
          id: livro.id,
          titulo: livro.Tema || 'Sem título',
          autor: livro.Autor || 'Não informado',
          area: livro['Área'] || 'Geral',
          capa: livro['Capa-livro'],
          biblioteca: 'estudos'
        })));
      }
      
      // Mapear livros da Biblioteca OAB
      if (livrosOAB && livrosOAB.length > 0) {
        resultado.livros.push(...livrosOAB.map((livro: any) => ({
          id: livro.id,
          titulo: livro.Tema || 'Sem título',
          autor: livro.Autor || 'Não informado',
          area: livro['Área'] || 'Geral',
          capa: livro['Capa-livro'],
          biblioteca: 'oab'
        })));
      }
    }
    
    // Buscar vídeos se solicitado
    if (tipo === 'videos' || tipo === 'todos') {
      let videos: any[] = [];
      
      // Buscar com termos normalizados (ignorando acentuação)
      if (areasSugeridas.length > 0) {
        let videoConditions: string[] = [];
        
        areasSugeridas.forEach(area => {
          const areaNormalizada = normalizar(area);
          videoConditions.push(`area.ilike.%${area}%`);
          videoConditions.push(`area.ilike.%${areaNormalizada}%`);
        });
        
        const { data: videosData } = await supabase
          .from('VIDEO AULAS-NOVO' as any)
          .select('*')
          .or(videoConditions.join(','))
          .limit(20);
        
        videos = videosData || [];
      }
      
      // Se não encontrou nada, buscar por termos com e sem acentuação
      if (videos.length === 0) {
        const { data: videosData } = await supabase
          .from('VIDEO AULAS-NOVO' as any)
          .select('*')
          .or(`titulo.ilike.%${termosBusca}%,area.ilike.%${termosBusca}%,titulo.ilike.%${termosNormalizados}%,area.ilike.%${termosNormalizados}%`)
          .limit(20);
        
        videos = videosData || [];
      }
      
      if (videos && videos.length > 0) {
        resultado.videos = videos.map((video: any) => {
          // Extrair ID do vídeo do YouTube
          const videoId = video.link?.match(/[?&]v=([^&]+)/)?.[1] || 
                         video.link?.match(/youtu\.be\/([^?&]+)/)?.[1];
          
          return {
            id: video.id,
            titulo: video.titulo || 'Sem título',
            area: video.area || 'Geral',
            link: video.link,
            videoId: videoId,
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null,
            tempo: video.tempo,
            data: video.data
          };
        });
      }
    }
    
    console.log(`Encontrados: ${resultado.livros.length} livros, ${resultado.videos.length} vídeos`);
    
    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        livros: [],
        videos: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
