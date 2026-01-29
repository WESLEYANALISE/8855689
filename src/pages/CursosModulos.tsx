import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
interface Modulo {
  modulo: number;
  capa: string;
  totalAulas: number;
  nome: string;
  descricao: string;
}
const CursosModulos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { goBack } = useHierarchicalNavigation();
  const area = searchParams.get("area");
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModulo, setSelectedModulo] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  useEffect(() => {
    const fetchModulos = async () => {
      if (!area) {
        goBack();
        return;
      }
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from("CURSOS" as any).select("Modulo, Aula, Tema, \"capa-modulo\"").eq("Area", area).order("Modulo", {
        ascending: true
      }).order("Aula", {
        ascending: true
      });
      if (error) {
        console.error("Erro ao buscar módulos:", error);
      } else if (data) {
        // Agrupar por módulo e contar aulas
        const modulosMap = new Map<number, {
          capa: string;
          totalAulas: number;
          nome: string;
          descricao: string;
        }>();
        data.forEach((item: any) => {
          if (item.Modulo) {
            if (!modulosMap.has(item.Modulo)) {
              modulosMap.set(item.Modulo, {
                capa: item["capa-modulo"] || "",
                totalAulas: 0,
                nome: item.Tema || `Módulo ${item.Modulo}`,
                descricao: item.Assunto || ""
              });
            }
            const moduloData = modulosMap.get(item.Modulo)!;
            if (item.Aula) moduloData.totalAulas++;
          }
        });
        const modulosArray = Array.from(modulosMap.entries()).map(([modulo, data]) => ({
          modulo,
          capa: data.capa,
          totalAulas: data.totalAulas,
          nome: data.nome,
          descricao: data.descricao
        }));
        setModulos(modulosArray);
        if (modulosArray.length > 0) {
          setSelectedModulo(modulosArray[0].modulo);
        }
      }
      setLoading(false);
    };
    fetchModulos();
  }, [area, navigate]);
  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      const index = api.selectedScrollSnap();
      setSelectedModulo(modulos[index]?.modulo);
    });
  }, [api, modulos]);
  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>;
  }
  return <div className="min-h-screen bg-background text-foreground">
      {/* Content */}
      <div className="px-4 max-w-6xl mx-auto my-0 py-0">
        {/* Header Info */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{area}</h1>
          <p className="text-muted-foreground">
            <span className="font-bold text-accent">{modulos.length}</span> {modulos.length === 1 ? 'módulo disponível' : 'módulos disponíveis'} • 
            {' '}<span className="font-bold text-accent">{modulos.reduce((sum, m) => sum + m.totalAulas, 0)}</span> aulas totais
          </p>
        </div>

        <Carousel opts={{
        align: "center",
        loop: false,
        skipSnaps: false,
        duration: 15
      }} className="w-full max-w-6xl mx-auto" setApi={setApi}>
          <CarouselContent className="-ml-3 md:-ml-4">
            {modulos.map((modulo, index) => <CarouselItem key={modulo.modulo} className="pl-3 md:pl-4 basis-[300px] md:basis-[340px] py-[23px]">
                <Card className={`h-full cursor-pointer transition-all duration-300 overflow-hidden animate-fade-in bg-gradient-to-br from-card to-card/80 ${selectedModulo === modulo.modulo ? 'scale-105 shadow-2xl shadow-accent/40 border-2 border-accent' : 'scale-95 opacity-70 hover:opacity-90 shadow-xl border-2 border-border/50 hover:border-accent/30'}`} style={{
              animationDelay: `${0.1 + index * 0.1}s`,
              animationFillMode: 'backwards'
            }} onClick={() => {
              setSelectedModulo(modulo.modulo);
              navigate(`/cursos/aulas?area=${encodeURIComponent(area!)}&modulo=${modulo.modulo}`);
            }}>
                  <div className="relative h-[220px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    {modulo.capa ? <img src={modulo.capa} alt={`Módulo ${modulo.modulo}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-16 h-16 text-accent transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                      </div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                  <CardContent className="p-6 flex flex-col min-h-[160px]">
                    <div className="mb-3">
                      <div className="inline-block bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        Módulo {modulo.modulo}
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-base mb-4 line-clamp-2 leading-tight group-hover:text-accent transition-colors duration-300">
                      {modulo.nome}
                    </h3>
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <span className="font-bold text-accent text-sm">{modulo.totalAulas}</span>
                          <span className="text-muted-foreground text-xs">{modulo.totalAulas === 1 ? 'aula' : 'aulas'}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-300" style={{
                      width: '0%'
                    }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>)}
          </CarouselContent>
          <CarouselPrevious className="left-0 md:-left-4" />
          <CarouselNext className="right-0 md:-right-4" />
        </Carousel>

        {/* Descrição do Módulo Selecionado */}
        {selectedModulo !== null && modulos.find(m => m.modulo === selectedModulo) && <div className="mt-8 animate-fade-in">
            <Card className="bg-gradient-to-br from-card to-card/80 border-accent/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Sobre o Módulo {selectedModulo}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {modulos.find(m => m.modulo === selectedModulo)?.descricao || `Este módulo aborda ${modulos.find(m => m.modulo === selectedModulo)?.nome} com ${modulos.find(m => m.modulo === selectedModulo)?.totalAulas} aulas completas.`}
                </p>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
};
export default CursosModulos;