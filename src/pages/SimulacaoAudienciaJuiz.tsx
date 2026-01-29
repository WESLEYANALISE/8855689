import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gavel, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TypingIndicator } from "@/components/simulacao/TypingIndicator";
import { PontuacaoBar } from "@/components/simulacao/PontuacaoBar";
import MultiplaEscolhaCard from "@/components/simulacao/MultiplaEscolhaCard";

const SimulacaoAudienciaJuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faseAtual, setFaseAtual] = useState(0);
  const [mensagemAtual, setMensagemAtual] = useState("");
  const [typing, setTyping] = useState(false);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  
  // Métricas do juiz
  const [notaJustica, setNotaJustica] = useState(50);
  const [notaCeleridade, setNotaCeleridade] = useState(100);
  const [notaOrdem, setNotaOrdem] = useState(100);
  const [decisoesTomadas, setDecisoesTomadas] = useState<any[]>([]);

  useEffect(() => {
    carregarCaso();
  }, [id]);

  const carregarCaso = async () => {
    try {
      const { data, error } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('id', Number(id))
        .eq('modo', 'juiz')
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Caso não encontrado');
        navigate('/simulacao-juridica');
        return;
      }

      setCaso(data);
      iniciarAudiencia(data);
    } catch (error: any) {
      console.error('Erro ao carregar caso:', error);
      toast.error('Erro ao carregar caso');
      navigate('/simulacao-juridica');
    } finally {
      setLoading(false);
    }
  };

  const iniciarAudiencia = (casoData: any) => {
    simularFala(
      `Bom dia. Sou a juíza ${casoData.nome_juiza}. Vamos iniciar a audiência do processo que envolve ${casoData.nome_cliente} e ${casoData.nome_reu}.\n\nAdvogados, por favor, se apresentem.`
    );
  };

  const simularFala = (texto: string, callback?: () => void) => {
    setTyping(true);
    setMensagemAtual("");
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < texto.length) {
        setMensagemAtual(prev => prev + texto[index]);
        index++;
      } else {
        clearInterval(interval);
        setTyping(false);
        if (callback) callback();
      }
    }, 30);
  };

  const handleEscolha = (opcaoId: string) => {
    setOpcaoSelecionada(opcaoId);
  };

  const confirmarEscolha = () => {
    if (!opcaoSelecionada) return;

    // Processar decisão do juiz
    const questaoAtual = caso.questoes_alternativas[faseAtual];
    const opcaoEscolhida = questaoAtual.opcoes.find((o: any) => o.id === opcaoSelecionada);

    // Atualizar notas
    if (opcaoEscolhida.correta) {
      setNotaJustica(prev => Math.min(100, prev + 10));
      toast.success('Decisão correta!');
    } else {
      setNotaJustica(prev => Math.max(0, prev - 10));
      toast.error('Decisão incorreta');
    }

    // Registrar decisão
    setDecisoesTomadas(prev => [...prev, {
      fase: faseAtual,
      opcao: opcaoEscolhida,
      correta: opcaoEscolhida.correta
    }]);

    setOpcaoSelecionada(null);

    // Avançar para próxima fase
    if (faseAtual < caso.questoes_alternativas.length - 1) {
      setFaseAtual(prev => prev + 1);
    } else {
      finalizarAudiencia();
    }
  };

  const finalizarAudiencia = () => {
    // Salvar partida do juiz e redirecionar para feedback
    toast.success('Audiência finalizada!');
    navigate(`/simulacao-juridica/feedback-juiz/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Barra de notas do juiz */}
        <div className="mb-6 space-y-4">
          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-green-500 mb-2">Justiça</h3>
              <PontuacaoBar pontuacao={notaJustica} pontuacaoMaxima={100} />
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-blue-500/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-blue-500 mb-2">Celeridade</h3>
              <PontuacaoBar pontuacao={notaCeleridade} pontuacaoMaxima={100} />
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-purple-500 mb-2">Ordem</h3>
              <PontuacaoBar pontuacao={notaOrdem} pontuacaoMaxima={100} />
            </CardContent>
          </Card>
        </div>

        {/* Card da mensagem */}
        <Card className="bg-gray-800/50 border-purple-500/30 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-500 mb-2">Juíza {caso?.nome_juiza}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{mensagemAtual}</p>
                {typing && <TypingIndicator />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questão atual - placeholder para implementação completa */}
        {!typing && caso?.questoes_alternativas && (
          <div className="mb-6">
            <MultiplaEscolhaCard
              opcoes={[
                { id: '1', texto: 'Opção A', letra: 'A' },
                { id: '2', texto: 'Opção B', letra: 'B' },
                { id: '3', texto: 'Opção C', letra: 'C' }
              ]}
              opcaoSelecionada={opcaoSelecionada}
              onSelecionar={handleEscolha}
            />
          </div>
        )}

        {/* Botão de confirmar */}
        {opcaoSelecionada && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={confirmarEscolha}
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-12 py-6 text-lg font-bold"
            >
              Confirmar Decisão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulacaoAudienciaJuiz;
