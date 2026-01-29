import { Card } from "@/components/ui/card";
import { Briefcase, Search, CheckCircle } from "lucide-react";

interface AulaExemploPraticoProps {
  exemplo: {
    cenario: string;
    analise: string;
    solucao: string;
  };
}

export const AulaExemploPratico = ({ exemplo }: AulaExemploPraticoProps) => {
  const sections = [
    {
      title: "📋 Cenário",
      icon: Briefcase,
      content: exemplo.cenario,
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/30"
    },
    {
      title: "🔍 Análise Jurídica",
      icon: Search,
      content: exemplo.analise,
      color: "from-purple-500/10 to-purple-500/5 border-purple-500/30"
    },
    {
      title: "✅ Solução",
      icon: CheckCircle,
      content: exemplo.solucao,
      color: "from-green-500/10 to-green-500/5 border-green-500/30"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Caso Prático</h3>
        <p className="text-sm text-muted-foreground">
          Aprenda através de um exemplo real e sua análise detalhada
        </p>
      </div>

      {sections.map((section, index) => (
        <div
          key={index}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Card className={`p-5 border-2 bg-gradient-to-br ${section.color}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-card rounded-lg">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">{section.title}</h4>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {section.content}
            </p>
          </Card>
        </div>
      ))}
    </div>
  );
};
