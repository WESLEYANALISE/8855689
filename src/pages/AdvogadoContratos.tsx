import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  PenTool, 
  Calculator, 
  Scale, 
  Shield, 
  Clock,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Users,
  Building2,
  Home,
  Car,
  Briefcase,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeviceType } from "@/hooks/use-device-type";

const AdvogadoContratos = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  const funcionalidades = [
    {
      id: "modelos",
      title: "Modelos de Contratos",
      description: "Mais de 500 modelos prontos para usar",
      icon: FileText,
      route: "/advogado/contratos/modelos",
      color: "from-blue-500 to-blue-600",
      badge: "500+",
    },
    {
      id: "criar",
      title: "Criar Contrato com IA",
      description: "Gere contratos personalizados com inteligência artificial",
      icon: Sparkles,
      route: "/advogado/contratos/criar",
      color: "from-purple-500 to-purple-600",
      badge: "IA",
    },
    {
      id: "analisar",
      title: "Analisar Contrato",
      description: "Analise riscos e cláusulas abusivas",
      icon: Search,
      route: "/advogado/contratos/analisar",
      color: "from-amber-500 to-amber-600",
      badge: "Novo",
    },
    {
      id: "clausulas",
      title: "Banco de Cláusulas",
      description: "Cláusulas prontas por categoria",
      icon: BookOpen,
      route: "/advogado/contratos/clausulas",
      color: "from-green-500 to-green-600",
    },
    {
      id: "calculadora",
      title: "Calculadora de Multas",
      description: "Calcule multas contratuais e correção",
      icon: Calculator,
      route: "/advogado/contratos/calculadora",
      color: "from-red-500 to-red-600",
    },
    {
      id: "checklist",
      title: "Checklist de Revisão",
      description: "Não esqueça nenhum item importante",
      icon: CheckCircle2,
      route: "/advogado/contratos/checklist",
      color: "from-teal-500 to-teal-600",
    },
    {
      id: "validar",
      title: "Validar Assinaturas",
      description: "Verifique certificados digitais",
      icon: Shield,
      route: "/advogado/contratos/validar",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      id: "prazos",
      title: "Gestão de Prazos",
      description: "Acompanhe vencimentos e renovações",
      icon: Clock,
      route: "/advogado/contratos/prazos-gestao",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const categoriasContratos = [
    { id: "imobiliario", nome: "Imobiliário", icon: Home, exemplos: ["Compra e Venda", "Locação", "Permuta", "Comodato"] },
    { id: "empresarial", nome: "Empresarial", icon: Building2, exemplos: ["Sociedade", "Franquia", "Representação", "Distribuição"] },
    { id: "trabalho", nome: "Trabalho", icon: Briefcase, exemplos: ["CLT", "PJ", "Estágio", "Terceirização"] },
    { id: "consumidor", nome: "Consumidor", icon: Users, exemplos: ["Prestação de Serviço", "Compra e Venda", "Adesão"] },
    { id: "familia", nome: "Família", icon: Heart, exemplos: ["Casamento", "União Estável", "Divórcio", "Alimentos"] },
    { id: "veiculos", nome: "Veículos", icon: Car, exemplos: ["Compra e Venda", "Financiamento", "Consórcio"] },
  ];

  const alertasRecentes = [
    { tipo: "warning", texto: "Cláusula de foro de eleição pode ser considerada abusiva em contratos de consumo" },
    { tipo: "info", texto: "Nova súmula do STJ sobre multa moratória em contratos de locação" },
    { tipo: "success", texto: "Modelo de distrato atualizado conforme Lei 13.786/2018" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Contratos</h1>
            <p className="text-sm text-muted-foreground">Gerencie e crie contratos jurídicos</p>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <Scale className="w-3 h-3 mr-1" />
            Advogado
          </Badge>
        </div>

        {/* Alertas */}
        <div className="space-y-2">
          {alertasRecentes.map((alerta, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alerta.tipo === "warning" ? "bg-amber-500/10 border-amber-500/20" :
                alerta.tipo === "info" ? "bg-blue-500/10 border-blue-500/20" :
                "bg-green-500/10 border-green-500/20"
              }`}
            >
              <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                alerta.tipo === "warning" ? "text-amber-500" :
                alerta.tipo === "info" ? "text-blue-500" :
                "text-green-500"
              }`} />
              <p className="text-xs text-foreground/80">{alerta.texto}</p>
            </div>
          ))}
        </div>

        {/* Grid de funcionalidades */}
        <div className={`grid gap-3 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {funcionalidades.map((func) => {
            const Icon = func.icon;
            return (
              <button
                key={func.id}
                onClick={() => navigate(func.route)}
                className="group relative bg-card hover:bg-card/80 rounded-xl p-4 text-left transition-all border border-border hover:border-primary/30 hover:shadow-lg overflow-hidden"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${func.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {func.badge && (
                  <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
                    {func.badge}
                  </Badge>
                )}
                
                <div className={`bg-gradient-to-br ${func.color} rounded-lg p-2 w-fit mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {func.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {func.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Categorias de contratos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Contratos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-3 ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {categoriasContratos.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoriaAtiva === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaAtiva(isActive ? null : cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {cat.nome}
                      </span>
                    </div>
                    
                    {isActive && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cat.exemplos.map((ex, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/advogado/contratos/modelos?categoria=${cat.id}&tipo=${encodeURIComponent(ex)}`);
                            }}
                          >
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Atalhos rápidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Contratos mais usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Contrato de Locação Residencial",
                "Contrato de Prestação de Serviços",
                "Contrato de Compra e Venda de Imóvel",
                "Distrato",
                "Contrato de Honorários",
                "Termo de Confidencialidade (NDA)",
                "Contrato Social",
                "Procuração",
              ].map((contrato, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate(`/advogado/contratos/modelos?busca=${encodeURIComponent(contrato)}`)}
                >
                  {contrato}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvogadoContratos;
