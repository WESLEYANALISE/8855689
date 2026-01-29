import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SimulacaoAreas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modo = searchParams.get('modo') || 'advogado';

  // Apenas 4 áreas conforme solicitado
  const areas = [
    {
      id: "criminal",
      nome: "Direito Criminal",
      descricao: "Defesa criminal, crimes e investigações",
      cor: "from-red-500 to-red-700",
      bordaCor: "border-red-500/30",
      glowColor: "rgb(239, 68, 68)"
    },
    {
      id: "civil",
      nome: "Direito Civil",
      descricao: "Contratos, indenizações e responsabilidade civil",
      cor: "from-blue-500 to-blue-700",
      bordaCor: "border-blue-500/30",
      glowColor: "rgb(59, 130, 246)"
    },
    {
      id: "trabalhista",
      nome: "Direito Trabalhista",
      descricao: "Relações de trabalho e direitos trabalhistas",
      cor: "from-green-500 to-green-700",
      bordaCor: "border-green-500/30",
      glowColor: "rgb(34, 197, 94)"
    },
    {
      id: "consumidor",
      nome: "Direito do Consumidor",
      descricao: "Defesa do consumidor e relações de consumo",
      cor: "from-yellow-500 to-yellow-700",
      bordaCor: "border-yellow-500/30",
      glowColor: "rgb(234, 179, 8)"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/simulacao-juridica/modo")}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Escolha a Área de Atuação
          </h1>
          <p className="text-gray-300">
            {modo === 'juiz' ? 'Selecione a área em que irá atuar como juiz' : 'Selecione a área em que irá atuar como advogado'}
          </p>
        </div>

        {/* Grid de áreas */}
        <div className="grid md:grid-cols-2 gap-6">
          {areas.map((area) => (
            <Card
              key={area.id}
              className={`h-full cursor-pointer hover:scale-105 transition-all bg-gray-800/50 ${area.bordaCor} border-2 group relative overflow-hidden`}
              onClick={() => navigate(`/simulacao-juridica/escolha-estudo/${area.id}?modo=${modo}`)}
            >
              {/* Brilho no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${area.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${area.glowColor}`
                }}
              />

              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${area.cor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Scale className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {area.nome}
                </h3>
                
                <p className="text-gray-300 text-sm">
                  {area.descricao}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulacaoAreas;