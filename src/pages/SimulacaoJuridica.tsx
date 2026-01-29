import { useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SimulacaoJuridica = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header com animação */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-2xl shadow-amber-500/50 mb-6">
            <Scale className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Escolha o Modo de Jogo
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Você pode ser advogado e defender clientes, ou juiz e proferir sentenças!
          </p>

          {/* Botão de iniciar no topo */}
          <Button
            size="lg"
            onClick={() => navigate("/simulacao-juridica/modo")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-12 py-6 text-lg font-bold shadow-2xl shadow-amber-500/50 hover:scale-105 transition-all"
          >
            Começar Simulação
            <Scale className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Como funciona */}
        <Card className="bg-gray-800/50 border-amber-500/30 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Como Funciona</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Escolha seu Papel</h3>
                  <p className="text-gray-300">Seja Advogado ou Juiz</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Escolha a Área</h3>
                  <p className="text-gray-300">Criminal, Civil, Trabalhista ou Consumidor</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Selecione um Tema</h3>
                  <p className="text-gray-300">Casos específicos baseados em sua área de interesse</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Jogue a Simulação</h3>
                  <p className="text-gray-300">Tome decisões com múltipla escolha e veja as consequências</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Receba Feedback</h3>
                  <p className="text-gray-300">Aprenda com análise detalhada das suas decisões</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimulacaoJuridica;