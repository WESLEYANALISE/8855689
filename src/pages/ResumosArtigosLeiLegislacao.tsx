import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const leis = [
  { id: "lep", title: "Lei de Execução Penal", sigla: "LEP", cor: "rgb(239, 68, 68)" },
  { id: "lcp", title: "Lei das Contravenções Penais", sigla: "LCP", cor: "rgb(168, 85, 247)" },
  { id: "drogas", title: "Lei de Drogas", sigla: "DROGAS", cor: "rgb(34, 197, 94)" },
  { id: "maria-da-penha", title: "Lei Maria da Penha", sigla: "MARIA", cor: "rgb(236, 72, 153)" },
  { id: "crimes-hediondos", title: "Crimes Hediondos", sigla: "HED", cor: "rgb(220, 38, 38)" },
  { id: "tortura", title: "Lei de Tortura", sigla: "TORT", cor: "rgb(249, 115, 22)" },
  { id: "organizacoes-criminosas", title: "Organizações Criminosas", sigla: "ORCRIM", cor: "rgb(99, 102, 241)" },
  { id: "lavagem-dinheiro", title: "Lavagem de Dinheiro", sigla: "LAV", cor: "rgb(16, 185, 129)" },
  { id: "interceptacao-telefonica", title: "Interceptação Telefônica", sigla: "INTER", cor: "rgb(6, 182, 212)" },
  { id: "abuso-autoridade", title: "Abuso de Autoridade", sigla: "ABUSO", cor: "rgb(245, 158, 11)" },
  { id: "juizados-especiais-criminais", title: "Juizados Especiais", sigla: "JECRIM", cor: "rgb(59, 130, 246)" },
  { id: "estatuto-desarmamento", title: "Estatuto do Desarmamento", sigla: "ARMAS", cor: "rgb(107, 114, 128)" },
];

const ResumosArtigosLeiLegislacao = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeis = useMemo(() => {
    if (!searchTerm.trim()) return leis;
    const query = searchTerm.toLowerCase();
    return leis.filter(lei => 
      lei.title.toLowerCase().includes(query) || 
      lei.sigla.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-600/50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Legislação Penal</h1>
            <p className="text-sm text-muted-foreground">
              Leis Penais Especiais
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar lei..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leis */}
      <div className="flex flex-col gap-3">
        {filteredLeis.map((lei) => (
          <Card
            key={lei.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
            style={{ borderLeftColor: lei.cor }}
            onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${lei.id}&cor=${encodeURIComponent(lei.cor)}`)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${lei.cor}20` }}
              >
                <Shield className="w-5 h-5" style={{ color: lei.cor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{lei.sigla}</h3>
                <p className="text-sm text-muted-foreground truncate">{lei.title}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiLegislacao;
