import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

const SimulacaoAvatar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const casoId = searchParams.get('casoId');
  const [avatarSelecionado, setAvatarSelecionado] = useState<string | null>(null);

  const avatares = [
    {
      id: "advogado",
      nome: "Advogado",
      descricao: "Profissional experiente",
      emoji: "👨‍💼"
    },
    {
      id: "advogada",
      nome: "Advogada",
      descricao: "Especialista dedicada",
      emoji: "👩‍💼"
    }
  ];

  const handleContinuar = () => {
    if (!avatarSelecionado || !casoId) return;
    navigate(`/simulacao-juridica/caso/${casoId}?avatar=${avatarSelecionado}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Escolha seu Avatar
          </h1>
          <p className="text-gray-300">
            Quem você será nesta jornada jurídica?
          </p>
        </div>

        {/* Grid de avatares */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-3xl mx-auto">
          {avatares.map((avatar) => (
            <Card
              key={avatar.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-2 ${
                avatarSelecionado === avatar.id
                  ? 'border-amber-500 shadow-2xl shadow-amber-500/50 scale-105'
                  : 'border-amber-500/30 hover:border-amber-500/60'
              }`}
              onClick={() => setAvatarSelecionado(avatar.id)}
            >
              <CardContent className="p-8 md:p-12 text-center relative">
                {avatarSelecionado === avatar.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center animate-scale-in">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className="text-8xl md:text-9xl mb-6 animate-fade-in">{avatar.emoji}</div>
                
                <h3 className="text-xl md:text-2xl font-bold text-amber-500 mb-2">
                  {avatar.nome}
                </h3>
                
                <p className="text-base text-gray-300">
                  {avatar.descricao}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão continuar */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinuar}
            disabled={!avatarSelecionado}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-12 py-6 text-lg font-bold shadow-2xl shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulacaoAvatar;