import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, Briefcase, Building2, Calendar, FileSignature, Wrench, BookOpen, ChevronRight, FilePlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvogadoBlogList } from "@/components/advogado/AdvogadoBlogList";
import { Card } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/StandardPageHeader";

const Advogado = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "modelos",
      title: "Modelos de Petições",
      description: "Mais de 30 mil modelos prontos",
      icon: FileText,
      route: "/advogado/modelos",
    },
    {
      id: "criar",
      title: "Criar Petição com IA",
      description: "Crie petições com inteligência artificial",
      icon: Sparkles,
      route: "/advogado/criar",
    },
    {
      id: "contratos",
      title: "Modelos de Contratos",
      description: "Modelos prontos de contratos jurídicos",
      icon: FileSignature,
      route: "/advogado/contratos",
    },
    {
      id: "criar-contrato",
      title: "Criar Contrato",
      description: "Crie contratos com inteligência artificial",
      icon: FilePlus,
      route: "/advogado/criar-contrato",
    },
    {
      id: "cnpj",
      title: "Consultar CNPJ",
      description: "Dados completos de empresas brasileiras",
      icon: Building2,
      route: "/advogado/consulta-cnpj",
    },
    {
      id: "prazos",
      title: "Calculadora de Prazos",
      description: "Prazos processuais em dias úteis",
      icon: Calendar,
      route: "/advogado/prazos",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950 pb-20">
      <StandardPageHeader
        title="Advogado"
        subtitle="Ferramentas para advocacia"
        icon={
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-red-400" />
          </div>
        }
      />

      <div className="px-3 md:px-6">
        <Tabs defaultValue="ferramentas" className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-4 bg-card/50 backdrop-blur-md border border-white/5">
            <TabsTrigger value="ferramentas" className="flex-1 gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <Wrench className="w-4 h-4" />
              Ferramentas
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex-1 gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <BookOpen className="w-4 h-4" />
              Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ferramentas" className="mt-0">
            <div className="grid gap-3">
              {opcoes.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="bg-card/95 backdrop-blur-md border-border/50 hover:bg-card transition-all cursor-pointer group overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex gap-4 items-center">
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                          <Icon className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold group-hover:text-red-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="blog" className="mt-0">
            <AdvogadoBlogList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Advogado;
