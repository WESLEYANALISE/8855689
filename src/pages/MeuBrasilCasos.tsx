import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilCasos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const casos = [
    {
      nome: "Operação Lava Jato",
      ano: "2014-Presente",
      area: "Corrupção",
      importancia: "Maior investigação de corrupção do Brasil"
    },
    {
      nome: "Mensalão",
      ano: "2005-2012",
      area: "Corrupção Política",
      importancia: "Compra de votos no Congresso Nacional"
    },
    {
      nome: "Caso Nardoni",
      ano: "2008",
      area: "Criminal",
      importancia: "Morte de Isabella Nardoni"
    },
    {
      nome: "Impeachment de Dilma Rousseff",
      ano: "2016",
      area: "Constitucional",
      importancia: "Processo de impedimento presidencial"
    },
    {
      nome: "Impeachment de Fernando Collor",
      ano: "1992",
      area: "Constitucional",
      importancia: "Primeiro impeachment da história"
    },
    {
      nome: "Caso Eliza Samudio",
      ano: "2010",
      area: "Criminal",
      importancia: "Desaparecimento e homicídio"
    },
    {
      nome: "Caso Richthofen",
      ano: "2002",
      area: "Criminal",
      importancia: "Parricídio planejado"
    },
    {
      nome: "Caso Escola Base",
      ano: "1994",
      area: "Erro Judiciário",
      importancia: "Acusação falsa e erro midiático"
    },
    {
      nome: "Chacina da Candelária",
      ano: "1993",
      area: "Direitos Humanos",
      importancia: "Massacre de crianças e adolescentes"
    },
    {
      nome: "Massacre do Carandiru",
      ano: "1992",
      area: "Direitos Humanos",
      importancia: "111 presos mortos pela PM"
    },
    {
      nome: "Caso Dorothy Stang",
      ano: "2005",
      area: "Direitos Humanos",
      importancia: "Assassinato de missionária defensora da Amazônia"
    },
    {
      nome: "Caso Césio 137",
      ano: "1987",
      area: "Ambiental/Saúde",
      importancia: "Acidente radioativo em Goiânia"
    },
    {
      nome: "Tragédia de Mariana",
      ano: "2015",
      area: "Ambiental",
      importancia: "Rompimento de barragem da Samarco"
    },
    {
      nome: "Tragédia de Brumadinho",
      ano: "2019",
      area: "Ambiental",
      importancia: "Rompimento de barragem da Vale"
    },
    {
      nome: "Caso PC Farias",
      ano: "1992-1996",
      area: "Corrupção",
      importancia: "Tesoureiro de Collor"
    },
    {
      nome: "Caso Celso Daniel",
      ano: "2002",
      area: "Criminal/Político",
      importancia: "Morte de prefeito de Santo André"
    },
    {
      nome: "Caso Evandro",
      ano: "1992",
      area: "Criminal",
      importancia: "Crianças de Castelo Branco (PR)"
    },
    {
      nome: "Caso Daniella Perez",
      ano: "1992",
      area: "Criminal",
      importancia: "Homicídio de atriz"
    },
    {
      nome: "Caso Luiz Gama",
      ano: "Século XIX",
      area: "Direitos Humanos",
      importancia: "Advogado que libertou escravos"
    }
  ];

  const filteredCasos = casos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/meu-brasil")}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Casos Famosos
        </h1>
        <p className="text-sm text-muted-foreground">
          Casos históricos e marcantes do direito brasileiro
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar caso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de casos - estilo livro */}
      <div className="grid grid-cols-2 gap-3">
        {filteredCasos.map((caso) => (
          <button
            key={caso.nome}
            onClick={() => navigate(`/meu-brasil/caso/${encodeURIComponent(caso.nome)}`)}
            className="bg-card border border-border rounded-lg overflow-hidden text-left hover:border-primary hover:shadow-lg transition-all group"
          >
            {/* Capa/Imagem do caso */}
            <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
              
              {/* Badge de ano sobreposto */}
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {caso.ano}
              </div>
            </div>
            
            {/* Informações do caso */}
            <div className="p-3">
              <h3 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {caso.nome}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {caso.importancia}
              </p>
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                {caso.area}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredCasos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum caso encontrado</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilCasos;
