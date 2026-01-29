import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";

const jogos = [{
  id: "forca",
  nome: "Jogo da Forca",
  descricao: "Descubra termos jurídicos letra por letra",
  icone: "🎯",
  cor: "from-purple-500 to-purple-700",
  iconBg: "bg-purple-600",
  glowColor: "rgb(147, 51, 234)",
  disponivel: true
}, {
  id: "cruzadas",
  nome: "Palavras Cruzadas",
  descricao: "Complete o grid com conceitos do direito",
  icone: "📝",
  cor: "from-green-500 to-green-700",
  iconBg: "bg-green-600",
  glowColor: "rgb(34, 197, 94)",
  disponivel: false
}, {
  id: "caca_palavras",
  nome: "Caça-Palavras",
  descricao: "Encontre termos escondidos no grid",
  icone: "🔍",
  cor: "from-blue-500 to-blue-700",
  iconBg: "bg-blue-600",
  glowColor: "rgb(59, 130, 246)",
  disponivel: false
}, {
  id: "stop",
  nome: "Stop Jurídico",
  descricao: "Preencha as categorias antes do tempo",
  icone: "⏱️",
  cor: "from-orange-500 to-orange-700",
  iconBg: "bg-orange-600",
  glowColor: "rgb(249, 115, 22)",
  disponivel: false
}];

const JogosJuridicos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-pink-950/20 to-neutral-950 pb-20">
      <PageHero
        title="Jogos Jurídicos"
        subtitle="Aprenda brincando com jogos educativos"
        icon={Gamepad2}
        iconGradient="from-pink-500/20 to-purple-600/10"
        iconColor="text-pink-400"
        lineColor="via-pink-500"
        pageKey="jogos"
        showGenerateButton={true}
      />

      {/* Grid de Jogos */}
      <div className="px-3 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          {jogos.map(jogo => (
            <Card 
              key={jogo.id} 
              className={`${jogo.disponivel ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1' : 'cursor-not-allowed opacity-60'} transition-all border-2 border-transparent ${jogo.disponivel ? 'hover:border-pink-500/50' : ''} bg-card/50 backdrop-blur-sm group shadow-xl overflow-hidden relative animate-fade-in`}
              onClick={() => jogo.disponivel && navigate(`/jogos-juridicos/${jogo.id}/config`)}
            >
              {/* Brilho colorido no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80" 
                style={{
                  background: `linear-gradient(90deg, transparent, ${jogo.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${jogo.glowColor}`
                }} 
              />
              
              <CardContent className="p-4 md:p-6 flex flex-col items-center text-center min-h-[180px] md:min-h-[200px] justify-center">
                <div className={`text-4xl md:text-5xl mb-3 md:mb-4 ${jogo.disponivel ? 'group-hover:scale-110' : ''} transition-transform ${!jogo.disponivel ? 'grayscale' : ''}`}>
                  {jogo.icone}
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2 leading-tight text-white">{jogo.nome}</h3>
                <p className="text-xs md:text-sm text-neutral-400 leading-snug">{jogo.descricao}</p>
                {!jogo.disponivel && (
                  <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">
                    Em breve
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JogosJuridicos;
