import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Calendar, Building2, FileQuestion, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Concurso {
  id: string;
  nome: string;
  banca: string;
  cargo: string;
  icon: React.ElementType;
  gradient: string;
  path: string;
}

const SimuladosConcurso = () => {
  const navigate = useNavigate();

  const concursos: Concurso[] = [
    {
      id: "escrevente",
      nome: "Escrevente Técnico Judiciário",
      banca: "VUNESP",
      cargo: "TJ-SP - Escrevente",
      icon: Scale,
      gradient: "from-blue-500 to-indigo-600",
      path: "/ferramentas/simulados/escrevente"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Simulados de Concurso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Provas completas de concursos públicos
            </p>
          </div>
        </div>

        {/* Lista de Concursos */}
        <div className="grid gap-4">
          {concursos.map((concurso) => {
            const Icon = concurso.icon;
            return (
              <Card
                key={concurso.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(concurso.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${concurso.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground">
                        {concurso.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {concurso.cargo}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {concurso.banca}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              📝 Novos simulados serão adicionados em breve. Pratique com provas 
              reais de concursos públicos e acompanhe seu desempenho.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimuladosConcurso;
