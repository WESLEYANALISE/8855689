import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, ChevronRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const categories = [
  {
    title: "Códigos Principais",
    icon: "⚖️",
    items: [
      { codigo: "cp", nome: "Código Penal", sigla: "CP" },
      { codigo: "cc", nome: "Código Civil", sigla: "CC" },
      { codigo: "cpc", nome: "Código de Processo Civil", sigla: "CPC" },
      { codigo: "cpp", nome: "Código de Processo Penal", sigla: "CPP" },
      { codigo: "clt", nome: "Consolidação das Leis do Trabalho", sigla: "CLT" },
    ],
  },
  {
    title: "Códigos Especializados",
    icon: "📚",
    items: [
      { codigo: "cdc", nome: "Código de Defesa do Consumidor", sigla: "CDC" },
      { codigo: "ctn", nome: "Código Tributário Nacional", sigla: "CTN" },
      { codigo: "ctb", nome: "Código de Trânsito Brasileiro", sigla: "CTB" },
      { codigo: "ce", nome: "Código Eleitoral", sigla: "CE" },
    ],
  },
  {
    title: "Códigos Militares",
    icon: "🎖️",
    items: [
      { codigo: "cpm", nome: "Código Penal Militar", sigla: "CPM" },
      { codigo: "cppm", nome: "Código de Processo Penal Militar", sigla: "CPPM" },
    ],
  },
  {
    title: "Outros Códigos",
    icon: "📖",
    items: [
      { codigo: "ccom", nome: "Código Comercial", sigla: "CCOM" },
      { codigo: "cdm", nome: "Código de Minas", sigla: "CDM" },
      { codigo: "ca", nome: "Código de Águas", sigla: "CA" },
      { codigo: "cba", nome: "Código Brasileiro de Aeronáutica", sigla: "CBA" },
      { codigo: "cbt", nome: "Código Brasileiro de Telecomunicações", sigla: "CBT" },
    ],
  },
];

const QuestoesArtigosLeiCodigos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Códigos e Leis</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um código para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar código..."
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

      {/* Lista de Códigos */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.title}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.title}
            </h2>
            <div className="flex flex-col gap-3">
              {category.items.map((item) => (
                <Card
                  key={item.codigo}
                  className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 border-l-red-500 bg-gradient-to-r from-card to-card/80"
                  onClick={() => navigate(`/questoes/artigos-lei/temas?codigo=${item.codigo}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5 text-red-500" />
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
        ))}
      </div>
    </div>
  );
};

export default QuestoesArtigosLeiCodigos;
