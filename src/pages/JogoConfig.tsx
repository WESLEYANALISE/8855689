import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaCard } from "@/components/jogos/AreaCard";
interface TemasAgrupados {
  [area: string]: string[];
}
type Etapa = 'area' | 'selecao-tema';
const JogoConfig = () => {
  const navigate = useNavigate();
  const {
    tipo
  } = useParams<{
    tipo: string;
  }>();
  const [etapa, setEtapa] = useState<Etapa>('area');
  const [dificuldade, setDificuldade] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [temasAgrupados, setTemasAgrupados] = useState<TemasAgrupados>({});
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingFontes, setLoadingFontes] = useState(false);
  const nomeJogos: Record<string, string> = {
    forca: 'Jogo da Forca',
    cruzadas: 'Palavras Cruzadas',
    caca_palavras: 'Caça-Palavras',
    stop: 'Stop Jurídico'
  };
  useEffect(() => {
    carregarAreas();
  }, []);
  const carregarAreas = async () => {
    setLoadingFontes(true);
    try {
      const {
        data,
        error
      } = await supabase.from('BIBLIOTECA-ESTUDOS').select('Área, Tema').order('Área');
      if (error) throw error;
      const agrupados = data?.reduce((acc, item) => {
        const area = item['Área'] || '';
        const tema = item['Tema'] || '';
        if (!acc[area]) {
          acc[area] = [];
        }
        if (!acc[area].includes(tema)) {
          acc[area].push(tema);
        }
        return acc;
      }, {} as TemasAgrupados) || {};
      setTemasAgrupados(agrupados);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      toast.error('Erro ao carregar opções');
    } finally {
      setLoadingFontes(false);
    }
  };
  const selecionarArea = (area: string) => {
    setSelectedArea(area);
    setEtapa('selecao-tema');
  };
  const selecionarTema = (tema: string) => {
    setSelectedTema(tema);
    iniciarJogoComTema(tema);
  };

  const iniciarJogoComTema = (tema: string) => {
    if (!selectedArea || !tipo) {
      toast.error('Erro ao iniciar jogo');
      return;
    }
    
    const conteudo = `Tema: ${tema} - Área: ${selectedArea}`;
    navigate(`/jogos-juridicos/${tipo}/jogar`, {
      state: {
        area: selectedArea,
        tema: tema,
        dificuldade,
        conteudo,
        tipo
      }
    });
  };
  const voltarEtapa = () => {
    if (etapa === 'selecao-tema') {
      setEtapa('area');
      setSelectedArea('');
      setSelectedTema('');
    } else if (etapa === 'area') {
      navigate('/jogos-juridicos');
    }
  };
  const iniciarJogo = () => {
    if (!selectedTema) {
      toast.error('Selecione um tema para o jogo');
      return;
    }
    iniciarJogoComTema(selectedTema);
  };
  return <div className="px-3 py-4 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={voltarEtapa} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">{nomeJogos[tipo || ''] || 'Jogo'}</h1>
        <p className="text-sm text-muted-foreground">
          {etapa === 'area' && 'Escolha a área do direito'}
          {etapa === 'selecao-tema' && 'Selecione o tema e dificuldade'}
        </p>
      </div>

      {/* Etapa 1: Escolher Área - Timeline Vertical */}
      {etapa === 'area' && <div>
          <h2 className="text-lg font-semibold mb-6">📚 Áreas do Direito</h2>
          {loadingFontes ? <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div> : <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {Object.entries(temasAgrupados).map(([area, temas], idx) => {
                  // Todas as áreas em roxo
                  const colors = { bg: 'bg-purple-500/70', border: 'border-l-purple-500/70', shadow: 'shadow-purple-500/30' };
                  
                  return (
                    <div
                      key={area}
                      className="relative flex gap-4 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Marcador numerado */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-base shadow-lg ${colors.shadow}`}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Card */}
                      <Card
                        className={`flex-1 cursor-pointer transition-all border-l-4 ${colors.border} hover:shadow-lg hover:scale-[1.02]`}
                        onClick={() => selecionarArea(area)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-base mb-1">{area}</h3>
                              <p className="text-xs text-muted-foreground">
                                {temas.length} {temas.length === 1 ? 'tema' : 'temas'} disponíveis
                              </p>
                            </div>
                            <div className="text-2xl">💀</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>}
        </div>}

      {/* Etapa 2: Selecionar Tema + Dificuldade */}
      {etapa === 'selecao-tema' && <div className="space-y-6">
          {/* Dificuldade */}
          <div>
            <h2 className="text-lg font-semibold mb-3">⚡ Dificuldade</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['facil', 'medio', 'dificil'] as const).map(nivel => <Card key={nivel} className={`cursor-pointer transition-all ${dificuldade === nivel ? 'border-2 border-primary shadow-lg' : 'border-2 border-transparent hover:border-accent/50'}`} onClick={() => setDificuldade(nivel)}>
                  <CardContent className="p-3 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center bg-muted/20">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="font-semibold capitalize">{nivel}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Temas - Timeline Vertical */}
          <div>
            <h2 className="text-lg font-semibold mb-6">📖 Selecione o Tema</h2>
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {temasAgrupados[selectedArea]?.map((tema, idx) => {
                  const getColorByDifficulty = () => {
                    if (dificuldade === 'facil') return { bg: 'bg-green-500/70', border: 'border-l-green-500/70', shadow: 'shadow-green-500/30' };
                    if (dificuldade === 'medio') return { bg: 'bg-yellow-500/70', border: 'border-l-yellow-500/70', shadow: 'shadow-yellow-500/30' };
                    return { bg: 'bg-red-500/70', border: 'border-l-red-500/70', shadow: 'shadow-red-500/30' };
                  };
                  
                  const colors = getColorByDifficulty();
                  
                  return (
                    <div
                      key={tema}
                      className="relative flex gap-4 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Marcador numerado */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-base shadow-lg ${colors.shadow}`}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Card */}
                      <Card
                        className={`flex-1 cursor-pointer transition-all border-l-4 ${colors.border} hover:shadow-lg hover:scale-[1.02] ${selectedTema === tema ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selecionarTema(tema)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium flex-1">{tema}</p>
                            <div className="text-xl">💀</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>}

      {/* Botão Iniciar - aparece apenas quando tema está selecionado */}
      {selectedTema && etapa === 'selecao-tema' && <div className="mt-6 sticky bottom-4">
          <Button onClick={iniciarJogo} disabled={loading} className="w-full py-6 text-lg font-semibold" size="lg">
            {loading ? 'Carregando...' : '🎮 Começar Jogo'}
          </Button>
        </div>}
    </div>;
};
export default JogoConfig;