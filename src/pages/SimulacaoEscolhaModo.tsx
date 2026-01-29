import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Gavel, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SimulacaoEscolhaModo = () => {
  const navigate = useNavigate();

  const modos = [
    {
      id: "advogado",
      titulo: "Ser Advogado",
      descricao: "Defenda seu cliente, escolha provas e argumente na audiência",
      icone: Scale,
      cor: "from-amber-500 to-amber-700",
      bordaCor: "border-amber-500/30",
      glowColor: "rgb(245, 158, 11)",
      detalhes: [
        "Escolha entre 3 alternativas em cada decisão",
        "Apresente provas e argumente",
        "Refute os argumentos da parte contrária",
        "Receba feedback detalhado ao final"
      ]
    },
    {
      id: "juiz",
      titulo: "Ser Juiz",
      descricao: "Analise os argumentos de ambas as partes e profira a sentença",
      icone: Gavel,
      cor: "from-purple-500 to-purple-700",
      bordaCor: "border-purple-500/30",
      glowColor: "rgb(168, 85, 247)",
      detalhes: [
        "Ouça argumentos de ambos os advogados",
        "Defira ou indefira pedidos e provas",
        "Avalie objeções processuais",
        "Profira a sentença final com fundamentação"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/simulacao-juridica")}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Escolha seu Papel
          </h1>
          <p className="text-gray-300">
            Você quer ser advogado ou juiz nesta simulação?
          </p>
        </div>

        {/* Grid de modos */}
        <div className="grid md:grid-cols-2 gap-8">
          {modos.map((modo) => (
            <Card
              key={modo.id}
              className={`cursor-pointer hover:scale-105 transition-all duration-300 bg-gray-800/50 ${modo.bordaCor} border-2 group relative overflow-hidden animate-fade-in`}
              onClick={() => navigate(`/simulacao-juridica/areas?modo=${modo.id}`)}
            >
              {/* Brilho no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${modo.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${modo.glowColor}`
                }}
              />

              <CardContent className="p-8 md:p-10">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${modo.cor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl mx-auto`}>
                  <modo.icone className="w-12 h-12 text-white" />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
                  {modo.titulo}
                </h3>
                
                <p className="text-gray-300 text-center mb-6">
                  {modo.descricao}
                </p>

                {/* Lista de detalhes */}
                <div className="space-y-2">
                  {modo.detalhes.map((detalhe, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">✓</span>
                      <span className="text-sm text-gray-400">{detalhe}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulacaoEscolhaModo;
