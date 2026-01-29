import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedItem {
  id: string | number;
  type: 'curso' | 'videoaula';
  title: string;
  subtitle?: string;
  thumbnail: string;
  link: string;
  metadata?: {
    totalModulos?: number;
    totalAulas?: number;
    categoria?: string;
  };
}

const CACHE_KEY = 'featured_content_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

export const useFeaturedContent = () => {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    try {
      // Verificar cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setFeaturedItems(data);
          setLoading(false);
          return;
        }
      }

      // Buscar novos dados
      const items = await fetchRandomContent();
      
      // Salvar no cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: items,
        timestamp: Date.now()
      }));

      setFeaturedItems(items);
    } catch (error) {
      console.error('Erro ao carregar conteúdo em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomContent = async (): Promise<FeaturedItem[]> => {
    const items: FeaturedItem[] = [];

    // Buscar 1 curso aleatório para a thumbnail
    const { data: cursosData } = await supabase
      .from("CURSOS" as any)
      .select("Area, Modulo, Aula, \"capa-area\"")
      .limit(100);

    if (cursosData) {
      // Agrupar por área
      const areasMap = new Map<string, { capa: string; modulos: Set<number>; totalAulas: number }>();
      cursosData.forEach((item: any) => {
        if (item.Area) {
          if (!areasMap.has(item.Area)) {
            areasMap.set(item.Area, {
              capa: item["capa-area"] || "",
              modulos: new Set(),
              totalAulas: 0
            });
          }
          const areaData = areasMap.get(item.Area)!;
          if (item.Modulo) areaData.modulos.add(item.Modulo);
          if (item.Aula) areaData.totalAulas++;
        }
      });

      // Pegar 1 curso aleatório para thumbnail
      const areasArray = Array.from(areasMap.entries())
        .filter(([_, data]) => data.capa)
        .map(([area, data]) => ({
          area,
          capa: data.capa,
          totalModulos: data.modulos.size,
          totalAulas: data.totalAulas,
        }));

      const randomCurso = areasArray[Math.floor(Math.random() * areasArray.length)];
      
      if (randomCurso) {
        items.push({
          id: 'cursos',
          type: 'curso',
          title: 'DIREITO',
          subtitle: 'Estudos Premium',
          thumbnail: randomCurso.capa,
          link: '/iniciando-direito/todos',
          metadata: {
            totalModulos: randomCurso.totalModulos,
            totalAulas: randomCurso.totalAulas,
          }
        });
      }
    }

    // Buscar 1 videoaula aleatória para thumbnail
    const { data: videosData } = await supabase
      .from('VIDEO AULAS-NOVO' as any)
      .select('*')
      .limit(100);

    if (videosData && videosData.length > 0) {
      const randomVideo: any = videosData[Math.floor(Math.random() * videosData.length)];

      if (randomVideo && randomVideo.link) {
        // Buscar thumbnail da playlist
        let thumbnail = '';
        try {
          const { data: playlistData } = await supabase.functions.invoke(
            'buscar-videos-playlist',
            { body: { playlistLink: randomVideo.link } }
          );
          thumbnail = playlistData?.videos?.[0]?.thumbnail || '';
        } catch (error) {
          console.error('Erro ao buscar thumbnail:', error);
        }

        items.push({
          id: 'videoaulas',
          type: 'videoaula',
          title: 'Videoaulas',
          subtitle: 'Assista videoaulas organizadas por área do direito',
          thumbnail: thumbnail,
          link: '/videoaulas',
          metadata: {
            categoria: randomVideo.categoria || '',
          }
        });
      }
    }

    // Retornar na ordem: Cursos, Videoaulas
    return items;
  };

  return { featuredItems, loading };
};
