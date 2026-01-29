import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Flame, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResumoEmAlta {
  id: number;
  area: string;
  tema: string;
  subtema: string | null;
  url_imagem_resumo: string;
  url_audio_resumo: string;
  acessos: number;
}

const CACHE_KEY = 'resumos-em-alta-cache-v1';
const REVALIDATE_INTERVAL = 1000 * 60 * 60; // 1 hora

export const ResumosEmAltaCarousel = () => {
  const navigate = useNavigate();
  
  // Estado inicializado do cache instantaneamente
  const [resumosEmAlta, setResumosEmAlta] = useState<ResumoEmAlta[] | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (e) {
      console.error('Erro ao ler cache de resumos em alta:', e);
    }
    return null;
  });

  const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const fetchResumosEmAlta = useCallback(async (): Promise<ResumoEmAlta[]> => {
    // Buscar acessos dos últimos 7 dias agrupados por resumo_id
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const { data: acessos, error: acessosError } = await supabase
      .from("resumos_acessos")
      .select("resumo_id")
      .gte("created_at", seteDiasAtras.toISOString());

    if (acessosError) throw acessosError;

    // Contar acessos por resumo_id
    const contagem: Record<number, number> = {};
    acessos?.forEach((a) => {
      contagem[a.resumo_id] = (contagem[a.resumo_id] || 0) + 1;
    });

    // Pegar os top 20 resumo_ids mais acessados
    const topIds = Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => Number(id));

    if (topIds.length === 0) {
      // Se não houver acessos, buscar resumos recentes com capa E áudio
      const { data: recentes, error: recentesError } = await supabase
        .from("RESUMO")
        .select("id, area, tema, subtema, url_imagem_resumo, url_audio_resumo")
        .not("url_imagem_resumo", "is", null)
        .not("url_audio_resumo", "is", null)
        .order("id", { ascending: false })
        .limit(10);

      if (recentesError) throw recentesError;
      return (recentes || []).map((r: any) => ({ ...r, acessos: 0 })) as ResumoEmAlta[];
    }

    // Buscar dados dos resumos mais acessados que têm capa E áudio
    const { data: resumos, error: resumosError } = await supabase
      .from("RESUMO")
      .select("id, area, tema, subtema, url_imagem_resumo, url_audio_resumo")
      .in("id", topIds)
      .not("url_imagem_resumo", "is", null)
      .not("url_audio_resumo", "is", null);

    if (resumosError) throw resumosError;

    // Ordenar por quantidade de acessos e adicionar contagem
    const resultado = (resumos || [])
      .map((r: any) => ({ ...r, acessos: contagem[r.id] || 0 }))
      .sort((a, b) => b.acessos - a.acessos)
      .slice(0, 10) as ResumoEmAlta[];

    return resultado;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const shouldRevalidate = !lastFetchTime || (Date.now() - lastFetchTime > REVALIDATE_INTERVAL);
      
      if (!resumosEmAlta) {
        // Sem cache - carrega normalmente
        try {
          const data = await fetchResumosEmAlta();
          setResumosEmAlta(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro ao carregar resumos em alta:', error);
        }
      } else if (shouldRevalidate) {
        // Com cache - revalida em background sem mostrar loading
        try {
          const data = await fetchResumosEmAlta();
          setResumosEmAlta(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro na revalidação em background:', error);
        }
      }
    };

    loadData();
  }, [resumosEmAlta, fetchResumosEmAlta, lastFetchTime]);

  // Só mostra skeleton se não tem cache
  if (!resumosEmAlta) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-base">Resumos em Alta</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[200px] h-[180px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (resumosEmAlta.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="font-bold text-base">Resumos em Alta</h2>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {resumosEmAlta.map((resumo) => (
            <div
              key={resumo.id}
              className="flex-shrink-0 w-[200px] cursor-pointer group"
              onClick={() =>
                navigate(
                  `/resumos-juridicos/prontos/${encodeURIComponent(resumo.area)}/${encodeURIComponent(resumo.tema)}`
                )
              }
            >
              <div className="bg-secondary/30 rounded-xl overflow-hidden transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                {/* Imagem de capa */}
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  <img
                    src={resumo.url_imagem_resumo}
                    alt={resumo.subtema || resumo.tema}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-1 text-white/90">
                      <BookOpen className="w-3 h-3" />
                      <span className="text-[10px] font-medium truncate">{resumo.area}</span>
                    </div>
                  </div>
                </div>

                {/* Informações - altura fixa para uniformidade */}
                <div className="p-3 h-[72px] flex flex-col justify-start">
                  <h3 className="font-semibold text-sm line-clamp-2 whitespace-normal leading-tight">
                    {resumo.subtema || resumo.tema}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {resumo.tema}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
