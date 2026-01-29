import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookText, Search, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sumulas = [
  { codigo: "sv", nome: "Súmulas Vinculantes", sigla: "SV" },
  { codigo: "sstf", nome: "Súmulas do STF", sigla: "STF" },
  { codigo: "sstj", nome: "Súmulas do STJ", sigla: "STJ" },
  { codigo: "stst", nome: "Súmulas do TST", sigla: "TST" },
  { codigo: "stse", nome: "Súmulas do TSE", sigla: "TSE" },
  { codigo: "ecnj", nome: "Enunciados do CNJ", sigla: "CNJ" },
  { codigo: "ecnmp", nome: "Enunciados do CNMP", sigla: "CNMP" },
];

const QuestoesArtigosLeiSumulas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSumulas = sumulas.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Súmulas</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um tribunal para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar súmula..."
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

      {/* Lista de Súmulas */}
      <div className="flex flex-col gap-3">
        {filteredSumulas.map((item) => (
          <Card
            key={item.codigo}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 border-l-blue-500 bg-gradient-to-r from-card to-card/80"
            onClick={() => navigate(`/questoes/artigos-lei/temas?codigo=${item.codigo}`)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <BookText className="w-5 h-5 text-blue-500" />
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

export default QuestoesArtigosLeiSumulas;
