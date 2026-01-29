import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";

interface Aula {
  id: number;
  aula: number;
  tema: string;
  assunto: string;
  capa: string;
}

const CursosAulas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { goBack } = useHierarchicalNavigation();
  const area = searchParams.get("area");
  const modulo = searchParams.get("modulo");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAulas = async () => {
      if (!area || !modulo) {
        goBack();
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("CURSOS" as any)
        .select("id, Aula, Tema, Assunto, capa")
        .eq("Area", area)
        .eq("Modulo", parseInt(modulo))
        .order("Aula", { ascending: true });

      if (error) {
        console.error("Erro ao buscar aulas:", error);
      } else if (data) {
        const aulasFormatted = data.map((item: any) => ({
          id: item.id,
          aula: item.Aula,
          tema: item.Tema || "",
          assunto: item.Assunto || "",
          capa: item.capa || "",
        }));
        setAulas(aulasFormatted);
      }
      setLoading(false);
    };

    fetchAulas();
  }, [area, modulo, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Content */}
      <div className="px-4 max-w-6xl mx-auto py-8 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-3 md:gap-4">
          {aulas.map((aula, index) => (
            <Card
              key={aula.id}
              className="cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-accent/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-border/50 hover:border-accent/50 group animate-fade-in"
              style={{ 
                animationDelay: `${0.1 + index * 0.05}s`,
                animationFillMode: 'backwards'
              }}
              onClick={() => navigate(`/cursos/aula?id=${aula.id}`)}
            >
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {aula.capa ? (
                  <img
                    src={aula.capa}
                    alt={aula.assunto || aula.tema}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5" />
                )}
                
                {/* Badge Aula */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Aula {aula.aula}
                  </div>
                </div>
                
                {/* Gradient Overlay forte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                
                {/* Título DENTRO da capa - GRANDE e DESTACADO */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="bg-black/40 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                    <h3 className="font-extrabold text-white text-lg md:text-xl leading-tight line-clamp-2">
                      {aula.assunto || aula.tema}
                    </h3>
                  </div>
                </div>
                
                {/* Efeito hover - ícone de play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-accent/90 backdrop-blur-sm text-accent-foreground rounded-full p-4 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info compacta abaixo da grid */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {area} • Módulo {modulo} • {aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}
        </div>
      </div>
    </div>
  );
};

export default CursosAulas;
