import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilSistemas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const sistemas = [
    {
      pais: "Estados Unidos",
      bandeira: "🇺🇸",
      sistema: "Common Law",
      descricao: "Sistema baseado em precedentes judiciais",
      caracteristicas: ["Júri popular", "Precedentes vinculantes", "Adversarial"]
    },
    {
      pais: "Reino Unido",
      bandeira: "🇬🇧",
      sistema: "Common Law",
      descricao: "Berço do sistema Common Law",
      caracteristicas: ["Direito consuetudinário", "Case law", "Parlamento soberano"]
    },
    {
      pais: "França",
      bandeira: "🇫🇷",
      sistema: "Civil Law",
      descricao: "Sistema romano-germânico codificado",
      caracteristicas: ["Código Napoleônico", "Inquisitorial", "Direito codificado"]
    },
    {
      pais: "Alemanha",
      bandeira: "🇩🇪",
      sistema: "Civil Law",
      descricao: "Sistema jurídico germânico",
      caracteristicas: ["BGB (Código Civil)", "Tribunal Constitucional", "Federalismo"]
    },
    {
      pais: "Portugal",
      bandeira: "🇵🇹",
      sistema: "Civil Law",
      descricao: "Influência direta no direito brasileiro",
      caracteristicas: ["Ordenações", "Código Civil português", "Tradição ibérica"]
    },
    {
      pais: "Espanha",
      bandeira: "🇪🇸",
      sistema: "Civil Law",
      descricao: "Sistema romano-germânico ibérico",
      caracteristicas: ["Código Civil espanhol", "Direito autonômico", "Tradição romana"]
    },
    {
      pais: "Argentina",
      bandeira: "🇦🇷",
      sistema: "Civil Law",
      descricao: "Sistema similar ao brasileiro",
      caracteristicas: ["Código Civil e Comercial", "Federalismo", "Influência francesa"]
    },
    {
      pais: "China",
      bandeira: "🇨🇳",
      sistema: "Socialista",
      descricao: "Sistema socialista com características próprias",
      caracteristicas: ["Partido único", "Socialismo de mercado", "Código Civil de 2020"]
    },
    {
      pais: "Japão",
      bandeira: "🇯🇵",
      sistema: "Civil Law (híbrido)",
      descricao: "Mistura de tradições ocidentais e orientais",
      caracteristicas: ["Influência alemã", "Constituição pacifista", "Mediação"]
    }
  ];

  const filteredSistemas = sistemas.filter(s =>
    s.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sistema.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Globe className="w-6 h-6" />
          Sistemas Jurídicos
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare o direito brasileiro com outros países
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar país ou sistema..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de países */}
      <div className="grid grid-cols-2 gap-3">
        {filteredSistemas.map((item) => (
          <button
            key={item.pais}
            onClick={() => navigate(`/meu-brasil/sistema/${encodeURIComponent(`Direito de ${item.pais}`)}`)}
            className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-4xl">{item.bandeira}</span>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{item.pais}</h3>
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                  {item.sistema}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {item.descricao}
            </p>

            <div className="space-y-1">
              {item.caracteristicas.slice(0, 2).map((carac, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-accent">•</span>
                  <span className="line-clamp-1">{carac}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {filteredSistemas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum país encontrado</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilSistemas;
