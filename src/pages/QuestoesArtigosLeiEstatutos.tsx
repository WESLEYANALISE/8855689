import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, Search, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const estatutos = [
  { codigo: "eca", nome: "Estatuto da Criança e do Adolescente", sigla: "ECA" },
  { codigo: "eab", nome: "Estatuto da Advocacia e da OAB", sigla: "EAOAB" },
  { codigo: "ei", nome: "Estatuto do Idoso", sigla: "EI" },
  { codigo: "ec", nome: "Estatuto da Cidade", sigla: "EC" },
  { codigo: "epd", nome: "Estatuto da Pessoa com Deficiência", sigla: "EPD" },
  { codigo: "ede", nome: "Estatuto do Desarmamento", sigla: "ED" },
  { codigo: "et", nome: "Estatuto da Terra", sigla: "ET" },
  { codigo: "eir", nome: "Estatuto da Igualdade Racial", sigla: "EIR" },
  { codigo: "em", nome: "Estatuto dos Militares", sigla: "EM" },
  { codigo: "ee", nome: "Estatuto do Estrangeiro", sigla: "EE" },
  { codigo: "etv", nome: "Estatuto do Torcedor e Desporto", sigla: "ETD" },
  { codigo: "erf", nome: "Estatuto dos Refugiados", sigla: "ER" },
];

const QuestoesArtigosLeiEstatutos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEstatutos = estatutos.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Estatutos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um estatuto para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar estatuto..."
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

      {/* Lista de Estatutos */}
      <div className="flex flex-col gap-3">
        {filteredEstatutos.map((item) => (
          <Card
            key={item.codigo}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 border-l-purple-500 bg-gradient-to-r from-card to-card/80"
            onClick={() => navigate(`/questoes/artigos-lei/temas?codigo=${item.codigo}`)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Gavel className="w-5 h-5 text-purple-500" />
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

export default QuestoesArtigosLeiEstatutos;
