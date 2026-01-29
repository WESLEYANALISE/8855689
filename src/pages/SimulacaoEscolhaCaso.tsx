import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Scale, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SimulacaoEscolhaCaso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get('area');
  const tema = searchParams.get('tema');
  const [casos, setCasos] = useState<any[]>([]);
  const [casoAtual, setCasoAtual] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (area && tema) {
      carregarCasos();
    }
  }, [area, tema]);

  const carregarCasos = async () => {
    try {
      console.log('🔍 Buscando casos:', { area, tema });
      
      const { data, error } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('area', area)
        .eq('tema', tema)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('❌ Erro ao buscar casos:', error);
        throw error;
      }

      console.log('✅ Casos encontrados:', data?.length || 0);

      if (!data || data.length === 0) {
        toast.error('Nenhum caso foi gerado ainda. Aguarde ou tente novamente.');
        setTimeout(() => navigate(-1), 2000);
        return;
      }

      setCasos(data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar casos:', error);
      toast.error('Erro ao carregar casos: ' + (error.message || 'Erro desconhecido'));
      setTimeout(() => navigate(-1), 2000);
    } finally {
      setLoading(false);
    }
  };

  const proximoCaso = () => {
    setCasoAtual((prev) => (prev + 1) % casos.length);
  };

  const casoAnterior = () => {
    setCasoAtual((prev) => (prev - 1 + casos.length) % casos.length);
  };

  const escolherCaso = () => {
    const caso = casos[casoAtual];
    navigate(`/simulacao-juridica/avatar?casoId=${caso.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-2">Carregando casos...</p>
          <p className="text-gray-500 text-sm">Buscando {tema} em {area}</p>
        </div>
      </div>
    );
  }

  if (!casos || casos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <Card className="bg-gray-800/90 border-amber-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Casos ainda não gerados</h2>
            <p className="text-gray-400 mb-6">
              Os casos para <span className="text-amber-500">{tema}</span> em <span className="text-amber-500">{area}</span> ainda não foram gerados.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const caso = casos[casoAtual];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Escolha seu Caso
          </h1>
          <p className="text-gray-300">
            Selecione um dos {casos.length} casos disponíveis para {tema}
          </p>
        </div>

        {/* Indicador de casos - Caso 1, Caso 2, Caso 3 com cores por dificuldade */}
        <div className="flex justify-center gap-3 mb-8">
          {casos.map((caso, index) => {
            const dificuldadeCores = {
              'Fácil': 'bg-green-500 border-green-400 shadow-green-500/50',
              'Médio': 'bg-orange-500 border-orange-400 shadow-orange-500/50',
              'Difícil': 'bg-red-400 border-red-300 shadow-red-400/50'
            };
            const corAtiva = dificuldadeCores[caso.nivel_dificuldade as keyof typeof dificuldadeCores] || 'bg-amber-500 border-amber-400 shadow-amber-500/50';
            const corInativa = 'bg-gray-700 text-gray-300 hover:bg-gray-600';
            
            return (
              <button
                key={index}
                onClick={() => setCasoAtual(index)}
                className={`px-4 py-2 rounded-lg font-bold transition-all border-2 ${
                  index === casoAtual
                    ? `${corAtiva} text-white shadow-lg scale-105`
                    : corInativa
                }`}
              >
                <div className="text-center">
                  <div className="text-sm md:text-base">Caso {index + 1}</div>
                  {index === casoAtual && (
                    <div className="text-xs opacity-90">{caso.nivel_dificuldade}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Card do caso */}
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-2 border-amber-500/30 mb-8 animate-fade-in">
          <CardContent className="p-8 md:p-12">
            {/* Título e Dificuldade */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-500 mb-3">
                  {caso.titulo_caso}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    {caso.area}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 font-semibold">
                    {caso.nivel_dificuldade}
                  </span>
                </div>
              </div>
            </div>

            {/* Contexto */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">📋 Contexto do Caso</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                {caso.contexto_inicial}
              </p>
            </div>

            {/* Partes */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-amber-500 mb-2">👤 Cliente</h4>
                <p className="text-white font-semibold">{caso.nome_cliente}</p>
                <p className="text-sm text-gray-400 mt-1">{caso.perfil_cliente}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-400 mb-2">⚖️ Parte Contrária</h4>
                <p className="text-white font-semibold">{caso.nome_reu}</p>
                <p className="text-sm text-gray-400 mt-1">{caso.perfil_reu}</p>
              </div>
            </div>

            {/* Provas Disponíveis */}
            <div className="mb-8 max-h-80 overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-3">📁 Provas Disponíveis</h3>
              <div className="grid gap-3">
                {caso.provas?.map((prova: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-lg">📄</span>
                      <span className="font-semibold text-white break-words">{prova.tipo}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        prova.forca === 'forte' ? 'bg-green-500/20 text-green-400' :
                        prova.forca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {prova.forca}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap break-words">{prova.descricao}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fases do Caso */}
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-2">🎯 Fases da Audiência</h3>
              <div className="flex gap-2 flex-wrap">
                {caso.fases?.map((fase: any, index: number) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400"
                  >
                    {fase.nome}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão único centralizado */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={escolherCaso}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-16 py-6 text-lg font-bold shadow-2xl shadow-amber-500/50 hover:scale-105 transition-all"
          >
            Escolher Este Caso
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulacaoEscolhaCaso;
