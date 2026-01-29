import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TemaTimeline } from "@/components/jogos/TemaTimeline";

interface Categoria {
  nome: string;
  exemplos: string[];
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TEMPO_JOGO = 60;

const StopGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [etapa, setEtapa] = useState<'selecao' | 'jogo'>('selecao');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [letraSorteada, setLetraSorteada] = useState('');
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [tempo, setTempo] = useState(TEMPO_JOGO);
  const [jogando, setJogando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarJogo();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jogando && tempo > 0) {
      interval = setInterval(() => {
        setTempo(t => {
          if (t <= 1) {
            finalizarJogo();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jogando, tempo]);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      const jogoPredefinido = getJogoPredefinido(area, tema);
      if (jogoPredefinido) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'stop',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.categorias) {
        setCategorias(data.dados_jogo.categorias);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  const getJogoPredefinido = (area: string, tema: string) => {
    const jogos: Record<string, any> = {
      'Direito Ambiental_Unidades de Conservação': {
        categorias: [
          { nome: 'Unidades de Conservação', exemplos: ['PARQUE', 'RESERVA', 'ESTACAO'] },
          { nome: 'Órgãos Ambientais', exemplos: ['IBAMA', 'ICMBIO', 'CONAMA'] },
          { nome: 'Crimes Ambientais', exemplos: ['POLUICAO', 'DESMATAMENTO', 'CAÇA'] },
          { nome: 'Princípios', exemplos: ['PRECAUCAO', 'PREVENCAO', 'SUSTENTABILIDADE'] },
          { nome: 'Leis', exemplos: ['SNUC', 'PNMA', 'SISNAMA'] },
          { nome: 'Conceitos', exemplos: ['BIODIVERSIDADE', 'ECOSSISTEMA', 'FAUNA'] }
        ]
      }
    };

    const key = `${area}_${tema}`;
    return jogos[key];
  };

  const iniciarSelecao = () => {
    const jogo = getJogoPredefinido(area, tema);
    if (!jogo) return;

    setCategorias(jogo.categorias);
    setEtapa('jogo');
    toast.success('Jogo carregado! Clique em Iniciar para começar.');
  };

  const iniciarJogo = () => {
    const letra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    setLetraSorteada(letra);
    setJogando(true);
    setTempo(TEMPO_JOGO);
    setRespostas({});
    setFinalizado(false);
    toast.info(`Letra sorteada: ${letra}!`);
  };

  const finalizarJogo = () => {
    setJogando(false);
    setFinalizado(true);
    toast.success('⏱️ Tempo esgotado! Veja suas respostas');
  };

  const validarRespostas = () => {
    let pontuacao = 0;
    categorias.forEach((categoria, index) => {
      const resposta = (respostas[`cat-${index}`] || '').toUpperCase().trim();
      if (resposta && resposta.startsWith(letraSorteada)) {
        pontuacao += 10;
      }
    });
    toast.success(`Pontuação: ${pontuacao} pontos!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏱️</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (etapa === 'selecao') {
    const jogo = getJogoPredefinido(area, tema);
    const timelineItens = jogo?.categorias.map((cat: Categoria, i: number) => ({
      numero: i + 1,
      titulo: cat.nome,
      descricao: `Exemplos: ${cat.exemplos.slice(0, 2).join(', ')}...`,
      icone: '📝'
    })) || [];

    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/jogos-juridicos')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">⏱️ Stop Jurídico</h1>
          <p className="text-muted-foreground">
            Veja as categorias antes de começar
          </p>
        </div>

        <TemaTimeline
          itens={timelineItens}
          onSelect={iniciarSelecao}
          loading={loading}
        />

        <div className="mt-6 text-center">
          <Button onClick={iniciarSelecao} size="lg" className="gap-2">
            <Play className="w-5 h-5" />
            Iniciar Jogo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEtapa('selecao')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">⏱️ Stop Jurídico</h1>
        <p className="text-sm text-muted-foreground">
          Preencha as categorias com palavras que começam com a letra sorteada
        </p>
      </div>

      {!jogando && !finalizado && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-4">Pronto para começar?</p>
            <Button onClick={iniciarJogo} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Iniciar Jogo
            </Button>
          </CardContent>
        </Card>
      )}

      {jogando && (
        <>
          <Card className="mb-6 border-2 border-orange-500/50">
            <CardContent className="p-8 text-center">
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - tempo / TEMPO_JOGO)}
                    className="text-orange-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <div className="text-3xl font-bold">{tempo}s</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Letra:</p>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-500 text-white text-5xl font-bold shadow-lg">
                  {letraSorteada}
                </div>
              </div>

              <Button onClick={finalizarJogo} variant="outline" size="sm" className="gap-2">
                <Square className="w-4 h-4" />
                Parar Jogo
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {categorias.map((categoria, index) => {
              const resposta = (respostas[`cat-${index}`] || '').toUpperCase().trim();
              const valida = resposta && resposta.startsWith(letraSorteada);
              
              return (
                <Card
                  key={index}
                  className={`transition-all ${
                    valida ? 'border-l-4 border-l-green-500' : resposta ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold">
                        {categoria.nome}
                      </label>
                      {valida && <span className="text-green-500 text-sm font-bold">✓</span>}
                      {resposta && !valida && <span className="text-red-500 text-sm font-bold">✗</span>}
                    </div>
                    <Input
                      placeholder={`Ex: ${categoria.exemplos[0]}`}
                      value={respostas[`cat-${index}`] || ''}
                      onChange={(e) => setRespostas({ ...respostas, [`cat-${index}`]: e.target.value })}
                      className={`uppercase ${valida ? 'border-green-500' : ''}`}
                      maxLength={50}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {finalizado && (
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Suas Respostas</h2>
              <div className="space-y-3">
                {categorias.map((categoria, index) => {
                  const resposta = respostas[`cat-${index}`] || '-';
                  const valida = resposta.toUpperCase().startsWith(letraSorteada);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-semibold">{categoria.nome}</p>
                        <p className="text-lg">{resposta}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${valida ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {valida ? '✓ +10' : '✗ 0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={validarRespostas} className="w-full" size="lg">
              Ver Pontuação
            </Button>
            <Button onClick={() => setEtapa('selecao')} variant="outline" className="w-full">
              Jogar Novamente
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StopGame;
