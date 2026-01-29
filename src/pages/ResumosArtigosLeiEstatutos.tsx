import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const estatutos = [
  { id: "eca", title: "Estatuto da Criança e do Adolescente", sigla: "ECA", cor: "rgb(59, 130, 246)" },
  { id: "estatuto-idoso", title: "Estatuto do Idoso", sigla: "IDOSO", cor: "rgb(168, 85, 247)" },
  { id: "estatuto-oab", title: "Estatuto da OAB", sigla: "OAB", cor: "rgb(239, 68, 68)" },
  { id: "estatuto-pcd", title: "Estatuto da Pessoa com Deficiência", sigla: "PCD", cor: "rgb(34, 197, 94)" },
  { id: "estatuto-igualdade", title: "Estatuto da Igualdade Racial", sigla: "IGUALD", cor: "rgb(245, 158, 11)" },
  { id: "estatuto-cidade", title: "Estatuto da Cidade", sigla: "CIDADE", cor: "rgb(6, 182, 212)" },
  { id: "estatuto-torcedor", title: "Estatuto do Torcedor", sigla: "TORC", cor: "rgb(16, 185, 129)" },
];

const ResumosArtigosLeiEstatutos = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header com botão voltar */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/resumos-juridicos/artigos-lei')}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Estatutos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um estatuto para ver resumos dos artigos
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Estatutos */}
      <div className="flex flex-col gap-2">
        {estatutos.map((estatuto, index) => (
          <Card
            key={estatuto.id}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative opacity-0"
            style={{
              animation: `fade-in 0.4s ease-out forwards`,
              animationDelay: `${index * 50}ms`
            }}
            onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${estatuto.id}&cor=${encodeURIComponent(estatuto.cor)}`)}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1 opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, ${estatuto.cor}, transparent)`,
                boxShadow: `0 0 20px ${estatuto.cor}`
              }}
            />
            
            <CardContent className="py-5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full p-2.5 shadow-lg"
                  style={{ backgroundColor: estatuto.cor }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{estatuto.sigla}</h3>
                  <p className="text-xs text-muted-foreground">
                    {estatuto.title}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiEstatutos;
