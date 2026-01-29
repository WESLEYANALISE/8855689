import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Building2, Tag, MapPin, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DiarioOficialHub = () => {
  const navigate = useNavigate();

  const funcionalidades = [
    {
      id: "busca",
      title: "Busca em Diários",
      description: "Pesquise por município, palavra-chave e período",
      icon: Search,
      route: "/diario-oficial/busca",
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      id: "cnpj",
      title: "Consulta CNPJ",
      description: "Dados cadastrais, sócios e menções em diários",
      icon: Building2,
      route: "/diario-oficial/cnpj",
      color: "bg-emerald-500/20 text-emerald-500",
    },
    {
      id: "temas",
      title: "Busca por Tema",
      description: "Licitações, nomeações, educação, saúde e mais",
      icon: Tag,
      route: "/diario-oficial/temas",
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      id: "cidades",
      title: "Explorar Cidades",
      description: "Veja a cobertura de diários por município",
      icon: MapPin,
      route: "/diario-oficial/cidades",
      color: "bg-orange-500/20 text-orange-500",
    },
    {
      id: "dashboard",
      title: "Dashboard Nacional",
      description: "Estatísticas de cobertura por estado",
      icon: BarChart3,
      route: "/diario-oficial/dashboard",
      color: "bg-cyan-500/20 text-cyan-500",
    },
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Diário Oficial
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dados de diários oficiais de mais de 4.000 municípios
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">
            <strong>Querido Diário</strong> é um projeto da Open Knowledge Brasil que 
            disponibiliza dados de diários oficiais municipais. Aqui você pode pesquisar 
            publicações, consultar empresas e acompanhar temas específicos.
          </p>
        </div>

        {/* Lista de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funcionalidades.map((func) => {
            const Icon = func.icon;
            return (
              <button
                key={func.id}
                onClick={() => navigate(func.route)}
                className="bg-card border border-border rounded-xl p-4 text-left transition-all hover:bg-muted/50 hover:scale-[1.02] flex items-start gap-4 shadow-lg"
              >
                <div className={`p-3 rounded-lg ${func.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{func.title}</h3>
                  <p className="text-sm text-muted-foreground">{func.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          Dados fornecidos pela API do{" "}
          <a 
            href="https://queridodiario.ok.org.br/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Querido Diário
          </a>
          {" "}• Open Knowledge Brasil
        </div>
      </div>
    </div>
  );
};

export default DiarioOficialHub;
