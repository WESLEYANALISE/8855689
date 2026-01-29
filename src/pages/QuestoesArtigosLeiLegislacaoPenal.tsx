import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Search, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const leisPenais = [
  { codigo: "lep", nome: "Lei de Execução Penal", sigla: "LEP" },
  { codigo: "lmp", nome: "Lei Maria da Penha", sigla: "LMP" },
  { codigo: "ld", nome: "Lei de Drogas", sigla: "LD" },
  { codigo: "loc", nome: "Lei de Organizações Criminosas", sigla: "LOC" },
  { codigo: "lld", nome: "Lei de Lavagem de Dinheiro", sigla: "LLD" },
  { codigo: "lit", nome: "Lei de Interceptação Telefônica", sigla: "LIT" },
  { codigo: "lch", nome: "Lei de Crimes Hediondos", sigla: "LCH" },
  { codigo: "lt", nome: "Lei de Tortura", sigla: "LT" },
  { codigo: "laa", nome: "Lei de Abuso de Autoridade", sigla: "LAA" },
  { codigo: "lje", nome: "Lei dos Juizados Especiais Criminais", sigla: "LJE" },
];

const QuestoesArtigosLeiLegislacaoPenal = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeis = leisPenais.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-3 py-4">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-700 shadow-lg shadow-red-600/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Legislação Penal</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma lei para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-4 shrink-0">
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

      {/* Lista de Leis com Scroll */}
      <ScrollArea className="flex-1 -mx-3 px-3">
        <div className="flex flex-col gap-3 pb-24">
          {filteredLeis.map((item) => (
            <Card
              key={item.codigo}
              className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 border-l-red-500 bg-gradient-to-r from-card to-card/80"
              onClick={() => navigate(`/questoes/artigos-lei/temas?codigo=${item.codigo}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-red-500" />
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
      </ScrollArea>
    </div>
  );
};

export default QuestoesArtigosLeiLegislacaoPenal;
