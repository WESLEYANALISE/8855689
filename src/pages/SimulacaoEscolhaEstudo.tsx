import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, Scale, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SimulacaoEscolhaEstudo = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const [searchParams] = useSearchParams();
  const modo = searchParams.get('modo') || 'advogado';

  const opcoes = [
    {
      id: "temas",
      titulo: "Por Temas",
      descricao: "Estude casos práticos organizados por assunto",
      icone: Gavel,
      cor: "from-amber-500 to-amber-700",
      bordaCor: "border-amber-500/30",
      glowColor: "rgb(245, 158, 11)"
    },
    {
      id: "artigos",
      titulo: "Por Artigos",
      descricao: "Estude artigos específicos do Vade Mecum",
      icone: Scale,
      cor: "from-purple-500 to-purple-700",
      bordaCor: "border-purple-500/30",
      glowColor: "rgb(168, 85, 247)"
    }
  ];

  const handleEscolha = (opcao: string) => {
    if (opcao === "temas") {
      navigate(`/simulacao-juridica/temas/${area}?modo=${modo}`);
    } else {
      navigate(`/simulacao-juridica/artigos/${area}?modo=${modo}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/simulacao-juridica/areas?modo=${modo}`)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Como você quer estudar?
          </h1>
          <p className="text-gray-300">
            Escolha o método de estudo que preferir
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {opcoes.map((opcao) => (
            <Card
              key={opcao.id}
              className={`h-full cursor-pointer hover:scale-105 transition-all bg-gray-800/50 ${opcao.bordaCor} border-2 group relative overflow-hidden`}
              onClick={() => handleEscolha(opcao.id)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${opcao.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${opcao.glowColor}`
                }}
              />

              <CardContent className="p-8">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${opcao.cor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg mx-auto`}>
                  <opcao.icone className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                  {opcao.titulo}
                </h3>
                
                <p className="text-gray-300 text-center">
                  {opcao.descricao}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulacaoEscolhaEstudo;