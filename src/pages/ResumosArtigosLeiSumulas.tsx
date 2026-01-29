import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookText } from "lucide-react";

const sumulas = [
  { id: "sumulas-stf", title: "Súmulas STF", sigla: "STF", cor: "rgb(59, 130, 246)" },
  { id: "sumulas-vinculantes", title: "Súmulas Vinculantes", sigla: "SV", cor: "rgb(239, 68, 68)" },
  { id: "sumulas-stj", title: "Súmulas STJ", sigla: "STJ", cor: "rgb(34, 197, 94)" },
  { id: "sumulas-tst", title: "Súmulas TST", sigla: "TST", cor: "rgb(245, 158, 11)" },
  { id: "sumulas-tse", title: "Súmulas TSE", sigla: "TSE", cor: "rgb(168, 85, 247)" },
  { id: "sumulas-stm", title: "Súmulas STM", sigla: "STM", cor: "rgb(16, 185, 129)" },
  { id: "enunciados-cnj", title: "Enunciados CNJ", sigla: "CNJ", cor: "rgb(6, 182, 212)" },
  { id: "enunciados-cnmp", title: "Enunciados CNMP", sigla: "CNMP", cor: "rgb(236, 72, 153)" },
];

const ResumosArtigosLeiSumulas = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50">
            <BookText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Súmulas</h1>
            <p className="text-sm text-muted-foreground">
              STF, STJ, TST, TSE e mais
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Súmulas */}
      <div className="grid grid-cols-2 gap-3">
        {sumulas.map((sumula, index) => (
          <Card
            key={sumula.id}
            className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${sumula.id}&cor=${encodeURIComponent(sumula.cor)}`)}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1 opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, ${sumula.cor}, transparent)`,
                boxShadow: `0 0 20px ${sumula.cor}`
              }}
            />
            
            <CardContent className="p-4 flex flex-col items-center text-center min-h-[100px] justify-center">
              <div 
                className="rounded-full px-3 py-1 mb-2 text-white font-bold text-sm"
                style={{ backgroundColor: sumula.cor }}
              >
                {sumula.sigla}
              </div>
              <h3 className="font-medium text-xs">{sumula.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiSumulas;
