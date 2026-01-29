import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { HandCoins, Search, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const leisPrevidenciarias = [
  { codigo: "lpb", nome: "Lei de Benefícios da Previdência Social", sigla: "Lei 8.213/91" },
  { codigo: "lcp", nome: "Lei de Custeio da Previdência Social", sigla: "Lei 8.212/91" },
];

const QuestoesArtigosLeiPrevidenciario = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeis = leisPrevidenciarias.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Previdenciário</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma lei para praticar
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
        {filteredLeis.map((item) => (
          <Card
            key={item.codigo}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 border-l-emerald-500 bg-gradient-to-r from-card to-card/80"
            onClick={() => navigate(`/questoes/artigos-lei/temas?codigo=${item.codigo}`)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{item.sigla}</h3>
                <p className="text-sm text-muted-foreground truncate">{item.nome}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestoesArtigosLeiPrevidenciario;
