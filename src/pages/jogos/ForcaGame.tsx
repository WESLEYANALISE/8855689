import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Heart, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ForcaVisual } from "@/components/jogos/ForcaVisual";
import { supabase } from "@/integrations/supabase/client";
import useSound from "use-sound";
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_ERROS = 6;

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
interface PalavraOpcao {
  palavra: string;
  dica: string;
  exemplo: string;
  categoria: string;
}
const ForcaGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    area,
    tema,
    dificuldade,
    conteudo
  } = location.state || {};
  const [opcoesPalavras, setOpcoesPalavras] = useState<PalavraOpcao[]>([]);
  const [palavraAtual, setPalavraAtual] = useState<PalavraOpcao | null>(null);
  const [letrasEscolhidas, setLetrasEscolhidas] = useState<string[]>([]);
  const [erros, setErros] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [vitoria, setVitoria] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mostrarExemplo, setMostrarExemplo] = useState(false);
  const [etapa, setEtapa] = useState<'selecao' | 'jogo'>('selecao');

  // Sons
  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });
  useEffect(() => {
    carregarJogo();
  }, []);
  useEffect(() => {
    if (palavraAtual && !gameOver && etapa === 'jogo') {
      const palavraNormalizada = normalize(palavraAtual.palavra);
      const letrasNaPalavra = palavraNormalizada.split('');
      const acertou = letrasNaPalavra.every(letra => letrasEscolhidas.includes(letra));
      if (acertou) {
        setVitoria(true);
        setGameOver(true);
        toast.success('🎉 Parabéns! Você venceu!');
      }
    }
    if (erros >= MAX_ERROS) {
      setGameOver(true);
      toast.error(`💀 Você perdeu! A palavra era: ${palavraAtual?.palavra}`);
    }
  }, [letrasEscolhidas, erros, palavraAtual, gameOver, etapa]);
  const carregarJogo = async () => {
    setLoading(true);
    try {
      // Usar jogo pré-definido instantaneamente como fallback
      const jogoPredefinido = getJogoPredefinido(area, tema);
      if (jogoPredefinido) {
        setOpcoesPalavras(jogoPredefinido.opcoes);
        setLoading(false);
        return;
      }

      // Tentar buscar da API
      const {
        data,
        error
      } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'forca',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });
      if (error) throw error;
      if (data?.dados_jogo?.opcoes) {
        setOpcoesPalavras(data.dados_jogo.opcoes);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  // Jogos pré-definidos para carregamento instantâneo
  const getJogoPredefinido = (area: string, tema: string) => {
    const jogos: Record<string, any> = {
      'Direito Ambiental_Unidades de Conservação': {
        opcoes: [
          {
            palavra: 'PARQUE',
            dica: 'Unidade de proteção integral destinada à preservação de ecossistemas naturais',
            exemplo: 'O Parque Nacional do Iguaçu é uma importante área de conservação',
            categoria: 'Proteção Integral'
          },
          {
            palavra: 'RESERVA',
            dica: 'Área destinada à proteção da biodiversidade',
            exemplo: 'A Reserva Biológica do Taim protege espécies ameaçadas',
            categoria: 'Unidades de Conservação'
          },
          {
            palavra: 'ESTACAO',
            dica: 'Unidade destinada à preservação e pesquisa científica',
            exemplo: 'A Estação Ecológica permite apenas pesquisas autorizadas',
            categoria: 'Proteção Integral'
          },
          {
            palavra: 'REFUGIO',
            dica: 'Área destinada à proteção de ambientes naturais para espécies da flora e fauna',
            exemplo: 'O Refúgio de Vida Silvestre protege espécies migratórias',
            categoria: 'Proteção Integral'
          },
          {
            palavra: 'FLORESTA',
            dica: 'Unidade de uso sustentável com cobertura florestal',
            exemplo: 'A Floresta Nacional permite exploração sustentável de recursos',
            categoria: 'Uso Sustentável'
          },
          {
            palavra: 'EXTRATIVISTA',
            dica: 'Reserva destinada a populações tradicionais que vivem do extrativismo',
            exemplo: 'A Reserva Extrativista garante o modo de vida de comunidades tradicionais',
            categoria: 'Uso Sustentável'
          },
          {
            palavra: 'DESENVOLVIMENTO',
            dica: 'Reserva que permite o desenvolvimento sustentável da região',
            exemplo: 'A Reserva de Desenvolvimento Sustentável concilia conservação e desenvolvimento',
            categoria: 'Uso Sustentável'
          },
          {
            palavra: 'MONUMENTO',
            dica: 'Unidade que preserva sítios naturais raros ou de beleza cênica',
            exemplo: 'O Monumento Natural dos Costões Rochosos protege formações geológicas',
            categoria: 'Proteção Integral'
          },
          {
            palavra: 'BIODIVERSIDADE',
            dica: 'Conjunto de todas as formas de vida protegidas pelas unidades',
            exemplo: 'A biodiversidade brasileira é protegida pelo SNUC',
            categoria: 'Conceito Fundamental'
          },
          {
            palavra: 'SUSTENTAVEL',
            dica: 'Modelo de desenvolvimento que equilibra conservação e uso de recursos',
            exemplo: 'O uso sustentável é permitido em algumas categorias de unidades',
            categoria: 'Princípio Ambiental'
          }
        ]
      }
    };

    const key = `${area}_${tema}`;
    return jogos[key];
  };
  const selecionarPalavra = (opcao: PalavraOpcao) => {
    setPalavraAtual(opcao);
    setEtapa('jogo');
    setLetrasEscolhidas([]);
    setErros(0);
    setGameOver(false);
    setVitoria(false);
    setMostrarExemplo(false);
  };
  const voltarParaSelecao = () => {
    setEtapa('selecao');
    setPalavraAtual(null);
    setLetrasEscolhidas([]);
    setErros(0);
    setGameOver(false);
    setVitoria(false);
    setMostrarExemplo(false);
  };
  const escolherLetra = (letra: string) => {
    if (gameOver || letrasEscolhidas.includes(letra) || !palavraAtual) return;
    
    setLetrasEscolhidas([...letrasEscolhidas, letra]);
    const palavraNormalizada = normalize(palavraAtual.palavra);
    
    if (!palavraNormalizada.includes(letra)) {
      setErros(erros + 1);
      playError(); // Som de erro
    } else {
      playCorrect(); // Som de acerto
    }
  };
  const renderPalavra = () => {
    if (!palavraAtual) return null;
    return palavraAtual.palavra.split('').map((letra, idx) => {
      const letraNormalizada = normalize(letra);
      const foiEscolhida = letrasEscolhidas.includes(letraNormalizada);
      return (
        <div 
          key={idx} 
          className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-bold mx-1 ${foiEscolhida ? 'border-primary text-primary' : 'border-muted'}`}
        >
          {foiEscolhida ? letra : ''}
        </div>
      );
    });
  };
  const pedirDica = () => {
    if (mostrarExemplo) {
      toast.info('Você já usou a dica!');
      return;
    }
    setMostrarExemplo(true);
    toast.success('💡 Dica revelada!');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎯</div>
          <p>Carregando jogo...</p>
        </div>
      </div>;
  }

  // Tela de Seleção de Palavras - Timeline Vertical
  if (etapa === 'selecao') {
    const getColorByIndex = (idx: number) => {
      if (idx < 3) return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-l-green-500' };
      if (idx < 7) return { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-l-yellow-500' };
      return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-l-red-500' };
    };

    return <div className="px-3 py-4 max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">🎯 Escolha uma Palavra</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma das 10 palavras para jogar • Dificuldade: <span className="font-semibold capitalize">{dificuldade}</span>
          </p>
        </div>

        {/* Timeline Vertical */}
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {opcoesPalavras.map((opcao, idx) => {
              const colors = getColorByIndex(idx);
              return (
                <div
                  key={idx}
                  className="relative flex gap-4 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Número com marcador */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Card */}
                  <Card
                    className={`flex-1 cursor-pointer transition-all border-l-4 ${colors.border} hover:shadow-lg hover:scale-[1.02]`}
                    onClick={() => selecionarPalavra(opcao)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Tracinhos da palavra */}
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {opcao.palavra.split('').map((_, i) => (
                                <div key={i} className="w-2.5 h-3 border-b-2 border-muted-foreground/50" />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {opcao.palavra.length} letras
                            </span>
                          </div>

                          {/* Dica */}
                          <div className="flex items-start gap-2">
                            <span className="text-base">💡</span>
                            <p className="text-sm flex-1">{opcao.dica}</p>
                          </div>

                          {/* Categoria */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📚</span>
                            <p className="text-xs text-muted-foreground">{opcao.categoria}</p>
                          </div>
                        </div>

                        {/* Botão Play */}
                        <Button size="lg" className="flex-shrink-0">
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>;
  }

  // Tela de Jogo - Melhorada
  return <div className="px-3 py-4 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={voltarParaSelecao} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Escolher Outra Palavra
      </Button>

      {/* Status - Vidas em Destaque */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Vidas:</span>
              <div className="flex gap-1">
                {Array.from({ length: MAX_ERROS }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-7 h-7 transition-all ${
                      idx < MAX_ERROS - erros
                        ? 'fill-red-500 text-red-500 animate-pulse'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-lg font-bold">
              {MAX_ERROS - erros}/{MAX_ERROS}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forca Visual - Design Clean */}
      <Card className="mb-6 border-2">
        <CardContent className="p-8 flex justify-center bg-muted/30">
          <ForcaVisual erros={erros} />
        </CardContent>
      </Card>

      {/* Dica e Categoria */}
      {palavraAtual && (
        <Card className="mb-6 border-l-4 border-l-purple-500">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Dica:</p>
                <p className="text-base font-semibold">{palavraAtual.dica}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <p className="text-xs text-muted-foreground">{palavraAtual.categoria}</p>
            </div>
            
            {/* Botão de Dica Extra */}
            {!mostrarExemplo && !gameOver && (
              <Button
                onClick={pedirDica}
                variant="secondary"
                size="sm"
                className="w-full gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Revelar Exemplo
              </Button>
            )}

            {/* Exemplo Revelado */}
            {mostrarExemplo && (
              <div className="mt-3 p-3 bg-yellow-500 rounded-lg border border-yellow-600">
                <p className="text-sm text-white font-medium">
                  {palavraAtual.exemplo}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Palavra */}
      <div className="flex justify-center mb-8 flex-wrap gap-2">
        {renderPalavra()}
      </div>

      {/* Teclado - Melhorado */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {LETRAS.map(letra => {
          const usado = letrasEscolhidas.includes(letra);
          const acertou = usado && palavraAtual && normalize(palavraAtual.palavra).includes(letra);
          return (
            <Button
              key={letra}
              onClick={() => escolherLetra(letra)}
              disabled={usado || gameOver}
              variant={usado ? (acertou ? 'default' : 'destructive') : 'outline'}
              className="aspect-square text-lg font-bold hover:scale-110 transition-transform"
            >
              {letra}
            </Button>
          );
        })}
      </div>

      {/* Game Over */}
      {gameOver && <div className="text-center space-y-4">
          {vitoria ? <>
              <p className="text-2xl font-bold text-green-500">🎉 Vitória!</p>
              <p>Você acertou a palavra!</p>
            </> : <>
              <p className="text-2xl font-bold text-red-500">💀 Game Over</p>
              <p>A palavra era: <span className="font-bold">{palavraAtual?.palavra}</span></p>
            </>}
          <div className="space-y-2">
            <Button onClick={voltarParaSelecao} className="w-full">
              Escolher Outra Palavra
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Gerar Novas Palavras
            </Button>
          </div>
        </div>}
    </div>;
};
export default ForcaGame;