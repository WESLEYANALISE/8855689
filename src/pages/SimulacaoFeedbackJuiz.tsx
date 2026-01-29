import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gavel, TrendingUp, TrendingDown, CheckCircle, XCircle, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SimulacaoFeedbackJuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState<any>(null);
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      // Carregar caso
      const { data: casoData, error: casError } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (casError) throw casError;
      setCaso(casoData);

      // Carregar partida do juiz (última partida do usuário para este caso)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: partidaData, error: partError } = await supabase
        .from('SIMULACAO_PARTIDAS_JUIZ')
        .select('*')
        .eq('caso_id', Number(id))
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (partError && partError.code !== 'PGRST116') throw partError;
      setPartida(partidaData);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar feedback');
    } finally {
      setLoading(false);
    }
  };

  const getNotaFinal = () => {
    if (!partida) return 0;
    return Math.round((partida.nota_justica + partida.nota_celeridade + partida.nota_ordem_processual) / 3);
  };

  const getMensagemFinal = () => {
    const nota = getNotaFinal();
    if (nota >= 80) return "Excelente desempenho! Você demonstrou grande capacidade para a magistratura.";
    if (nota >= 60) return "Bom desempenho! Continue estudando para aprimorar suas decisões.";
    if (nota >= 40) return "Desempenho regular. É importante revisar conceitos fundamentais.";
    return "Você precisa estudar mais para se tornar um bom juiz. Continue praticando!";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando feedback...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-purple-500 flex items-center justify-center mb-4">
            <Gavel className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Feedback da Magistratura
          </h1>
          <p className="text-gray-300">{caso?.titulo_caso}</p>
        </div>

        {/* Nota Final */}
        <Card className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-purple-500/30 mb-6">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold text-white mb-2">{getNotaFinal()}%</div>
            <p className="text-xl text-purple-300 mb-4">Nota Final</p>
            <p className="text-gray-300">{getMensagemFinal()}</p>
          </CardContent>
        </Card>

        {/* Notas por Dimensão */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-6 text-center">
              <h3 className="text-green-500 font-bold mb-2">Justiça</h3>
              <div className="text-3xl font-bold text-white mb-2">{partida?.nota_justica || 0}%</div>
              <p className="text-xs text-gray-400">Correção das decisões</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-blue-500/30">
            <CardContent className="p-6 text-center">
              <h3 className="text-blue-500 font-bold mb-2">Celeridade</h3>
              <div className="text-3xl font-bold text-white mb-2">{partida?.nota_celeridade || 0}%</div>
              <p className="text-xs text-gray-400">Rapidez nas decisões</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-6 text-center">
              <h3 className="text-purple-500 font-bold mb-2">Ordem</h3>
              <div className="text-3xl font-bold text-white mb-2">{partida?.nota_ordem_processual || 0}%</div>
              <p className="text-xs text-gray-400">Procedimento correto</p>
            </CardContent>
          </Card>
        </div>

        {/* Análise da Sentença */}
        <Card className="bg-gray-800/50 border-purple-500/30 mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {partida?.sentenca_correta ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
              Análise da Sentença
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-purple-400 mb-2">Sua Decisão:</h4>
                <p className="text-gray-300">{partida?.decisao_merito || 'Não registrada'}</p>
              </div>

              <div>
                <h4 className="font-bold text-green-400 mb-2">Sentença Esperada:</h4>
                <p className="text-gray-300">{caso?.sentenca_esperada_merito}</p>
              </div>

              {!partida?.sentenca_correta && caso?.feedback_negativo && (
                <div>
                  <h4 className="font-bold text-red-400 mb-2">O que faltou:</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {caso.feedback_negativo.map((fb: string, i: number) => (
                      <li key={i}>{fb}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acertos e Erros */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Acertos */}
          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-green-500 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pontos Positivos
              </h3>
              <ul className="space-y-2">
                {partida?.acertos?.length > 0 ? (
                  partida.acertos.map((acerto: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{acerto}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">Nenhum ponto positivo registrado</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Erros */}
          <Card className="bg-gray-800/50 border-red-500/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Pontos a Melhorar
              </h3>
              <ul className="space-y-2">
                {partida?.erros?.length > 0 ? (
                  partida.erros.map((erro: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{erro}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">Nenhum erro registrado</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/simulacao-juridica')}
            className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-8 py-6"
          >
            <Home className="mr-2 w-5 h-5" />
            Voltar ao Menu
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/simulacao-juridica/modo')}
            className="border-purple-500 text-purple-500 hover:bg-purple-500/10 px-8 py-6"
          >
            Nova Simulação
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulacaoFeedbackJuiz;
