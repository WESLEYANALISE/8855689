import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ClipboardList, Scale, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Simulado {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  icon: React.ElementType;
  route: string;
  tabela: string;
  cor: string;
}

const simulados: Simulado[] = [
  {
    id: "tjsp",
    titulo: "TJSP 2025",
    subtitulo: "Escrevente Técnico Judiciário",
    descricao: "Tribunal de Justiça de São Paulo - Prova aplicada em 2025",
    icon: Scale,
    route: "/simulados/tjsp",
    tabela: "SIMULADO-TJSP",
    cor: "#3b82f6"
  },
  {
    id: "escrevente",
    titulo: "Escrevente Técnico Judiciário",
    subtitulo: "Provas por Ano",
    descricao: "Simulados organizados por ano - TJ-SP",
    icon: Building2,
    route: "/ferramentas/simulados/escrevente",
    tabela: "SIMULADO-ESCREVENTE",
    cor: "#8b5cf6"
  },
];

const SimuladosHub = () => {
  const navigate = useNavigate();

  // Buscar contagem de questões de cada simulado
  const { data: contagemQuestoes } = useQuery({
    queryKey: ["simulados-contagem"],
    queryFn: async () => {
      const contagens: Record<string, number> = {};
      
      for (const simulado of simulados) {
        try {
          const { count } = await supabase
            .from(simulado.tabela as any)
            .select("*", { count: "exact", head: true });
          contagens[simulado.id] = count || 0;
        } catch {
          contagens[simulado.id] = 0;
        }
      }
      
      return contagens;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Header */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-blue-500/30">
            <ClipboardList className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Simulados</h1>
            <p className="text-muted-foreground text-sm">Provas de concursos públicos</p>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-muted-foreground text-sm leading-relaxed animate-fade-in">
          Pratique com questões reais de concursos públicos. 
          Cada simulado contém questões da prova oficial com gabarito comentado.
        </p>

        {/* Lista de simulados */}
        <div className="space-y-3">
          {simulados.map((simulado) => {
            const Icon = simulado.icon;
            const totalQuestoes = contagemQuestoes?.[simulado.id] || 0;

            return (
              <div key={simulado.id} className="animate-fade-in">
                <Card 
                  className="overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border-l-4"
                  style={{ borderLeftColor: simulado.cor }}
                  onClick={() => navigate(simulado.route)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      {/* Ícone */}
                      <div 
                        className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center rounded-l-lg"
                        style={{ backgroundColor: `${simulado.cor}20` }}
                      >
                        <Icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: simulado.cor }} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 py-3 pr-4">
                        <h3 className="font-bold text-base md:text-lg text-foreground">
                          {simulado.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {simulado.subtitulo}
                        </p>
                        {totalQuestoes > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {totalQuestoes} questões disponíveis
                          </p>
                        )}
                      </div>

                      {/* Ícone de seta */}
                      <div className="pr-4">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Info card */}
        <div className="animate-fade-in">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Dica:</span> Faça os simulados em condições similares às da prova real. 
                Cronometre seu tempo e evite consultar materiais durante a resolução.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimuladosHub;
