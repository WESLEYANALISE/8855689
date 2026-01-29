import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { HandCoins } from "lucide-react";

const leis = [
  { id: "lei-beneficios", title: "Lei de Benefícios", sigla: "8213", cor: "rgb(16, 185, 129)" },
  { id: "lei-custeio", title: "Lei de Custeio", sigla: "8212", cor: "rgb(20, 184, 166)" },
];

const ResumosArtigosLeiPrevidenciario = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
            <HandCoins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Direito Previdenciário</h1>
            <p className="text-sm text-muted-foreground">
              Custeio e Benefícios
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Leis */}
      <div className="grid grid-cols-2 gap-3">
        {leis.map((lei, index) => (
          <Card
            key={lei.id}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${lei.id}&cor=${encodeURIComponent(lei.cor)}`)}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1 opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, ${lei.cor}, transparent)`,
                boxShadow: `0 0 20px ${lei.cor}`
              }}
            />
            
            <CardContent className="p-4 flex flex-col items-center text-center min-h-[100px] justify-center">
              <div 
                className="rounded-full px-3 py-1 mb-2 text-white font-bold text-sm"
                style={{ backgroundColor: lei.cor }}
              >
                {lei.sigla}
              </div>
              <h3 className="font-medium text-xs">{lei.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiPrevidenciario;
