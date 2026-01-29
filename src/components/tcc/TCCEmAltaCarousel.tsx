import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, GraduationCap, Calendar, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface TCCEmAlta {
  id: string;
  tcc_id: string;
  motivo: string;
  tcc: {
    id: string;
    titulo: string;
    autor: string | null;
    ano: number | null;
    instituicao: string | null;
    area_direito: string | null;
  };
}

const TCCEmAltaCarousel = () => {
  const navigate = useNavigate();
  const [tccsEmAlta, setTccsEmAlta] = useState<TCCEmAlta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTCCsEmAlta();
  }, []);

  const carregarTCCsEmAlta = async () => {
    try {
      // Buscar TCCs em alta da tabela
      const { data: emAltaData, error: emAltaError } = await supabase
        .from("tcc_em_alta")
        .select(`
          id,
          tcc_id,
          motivo,
          tcc:tcc_pesquisas(id, titulo, autor, ano, instituicao, area_direito)
        `)
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .limit(10);

      if (emAltaError) throw emAltaError;

      // Se não há TCCs em alta, buscar os mais recentes
      if (!emAltaData || emAltaData.length === 0) {
        const { data: recentData, error: recentError } = await supabase
          .from("tcc_pesquisas")
          .select("id, titulo, autor, ano, instituicao, area_direito")
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        const formattedData = (recentData || []).map((tcc, index) => ({
          id: `recent-${index}`,
          tcc_id: tcc.id,
          motivo: "destaque",
          tcc: tcc,
        }));

        setTccsEmAlta(formattedData as TCCEmAlta[]);
      } else {
        setTccsEmAlta(emAltaData as unknown as TCCEmAlta[]);
      }
    } catch (error) {
      console.error("Erro ao carregar TCCs em alta:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMotivoLabel = (motivo: string) => {
    switch (motivo) {
      case "tema_atual":
        return "Tema Atual";
      case "muito_acessado":
        return "Popular";
      case "sugestao_ia":
        return "Recomendado";
      case "destaque":
        return "Destaque";
      default:
        return "Em Alta";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-foreground">Em Alta</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] w-[280px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (tccsEmAlta.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-foreground">Em Alta</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: true,
          }) as any,
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {tccsEmAlta.map((item) => (
            <CarouselItem key={item.id} className="pl-2 basis-[85%] md:basis-1/3">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm h-full"
                onClick={() => navigate(`/ferramentas/tcc/${item.tcc.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {getMotivoLabel(item.motivo)}
                    </Badge>
                    {item.tcc.area_direito && (
                      <Badge variant="outline" className="text-xs">
                        {item.tcc.area_direito}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-medium text-sm text-foreground line-clamp-3 leading-snug">
                    {item.tcc.titulo}
                  </h3>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {item.tcc.autor && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span className="truncate">{item.tcc.autor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {item.tcc.instituicao && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          <span className="truncate">{item.tcc.instituicao}</span>
                        </div>
                      )}
                      {item.tcc.ano && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.tcc.ano}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TCCEmAltaCarousel;
