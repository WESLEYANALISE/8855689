import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Lightbulb, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TemaTimeline } from "@/components/jogos/TemaTimeline";

interface PalavraBase {
  palavra: string;
  dica: string;
}

interface Palavra extends PalavraBase {
  linha: number;
  coluna: number;
  horizontal: boolean;
  numero: number;
}

interface CelulaGrid {
  letra: string | null;
  numero?: number;
  horizontal?: boolean;
  vertical?: boolean;
}

const CruzadasGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [etapa, setEtapa] = useState<'selecao' | 'jogo'>('selecao');
  const [palavras, setPalavras] = useState<Palavra[]>([]);
  const [grid, setGrid] = useState<CelulaGrid[][]>([]);
  const [respostas, setRespostas] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [completo, setCompleto] = useState(false);

  useEffect(() => {
    carregarJogo();
  }, []);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      // Usar jogo pré-definido instantaneamente
      const jogoPredefinido = getJogoPredefinido(area, tema);
      if (jogoPredefinido) {
        // Não processar ainda, aguardar seleção
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'cruzadas',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;
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
        palavras: [
          { palavra: 'SNUC', dica: 'Sistema Nacional de Unidades de Conservação' },
          { palavra: 'PARQUE', dica: 'Unidade de proteção integral para preservação' },
          { palavra: 'LICENCA', dica: 'Autorização ambiental obrigatória' },
          { palavra: 'IBAMA', dica: 'Instituto Brasileiro do Meio Ambiente' },
          { palavra: 'RESERVA', dica: 'Área destinada à proteção da biodiversidade' },
          { palavra: 'ESTACAO', dica: 'Unidade destinada à preservação e pesquisa' },
          { palavra: 'REFUGIO', dica: 'Área de proteção para espécies da flora e fauna' },
          { palavra: 'FLORESTA', dica: 'Unidade de uso sustentável com cobertura florestal' },
          { palavra: 'EXTRATIVISTA', dica: 'Reserva para populações tradicionais' },
          { palavra: 'BIODIVERSIDADE', dica: 'Conjunto de todas as formas de vida' },
          { palavra: 'SUSTENTAVEL', dica: 'Modelo que equilibra conservação e uso' },
          { palavra: 'FISCALIZACAO', dica: 'Monitoramento do cumprimento das normas' }
        ]
      }
    };

    const key = `${area}_${tema}`;
    return jogos[key];
  };

  const iniciarJogo = (palavraIndex: number) => {
    const jogo = getJogoPredefinido(area, tema);
    if (!jogo) return;

    // Pegar palavras até o índice selecionado (progressão)
    const palavrasSelecionadas = jogo.palavras.slice(0, palavraIndex + 1);
    
    // Criar grid automaticamente
    const palavrasComPosicao = criarGridAutomatico(palavrasSelecionadas);
    setPalavras(palavrasComPosicao);
    criarGrid(palavrasComPosicao);
    setEtapa('jogo');
    toast.success(`Começando com ${palavrasComPosicao.length} palavras!`);
  };

  const criarGridAutomatico = (palavrasBase: PalavraBase[]): Palavra[] => {
    const palavrasComPosicao: Palavra[] = [];
    let linha = 0;
    let coluna = 0;

    palavrasBase.forEach((palavraBase, index) => {
      const horizontal = index % 2 === 0;
      
      palavrasComPosicao.push({
        ...palavraBase,
        linha,
        coluna,
        horizontal,
        numero: index + 1
      });

      // Próxima posição
      if (horizontal) {
        linha += 2;
      } else {
        coluna += 2;
        if (coluna > 20) {
          coluna = 0;
          linha += 3;
        }
      }
    });

    return palavrasComPosicao;
  };

  const criarGrid = (palavrasList: Palavra[]) => {
    let maxLinha = 0;
    let maxColuna = 0;
    palavrasList.forEach(p => {
      maxLinha = Math.max(maxLinha, p.linha + (p.horizontal ? 1 : p.palavra.length));
      maxColuna = Math.max(maxColuna, p.coluna + (p.horizontal ? p.palavra.length : 1));
    });

    const novoGrid: CelulaGrid[][] = Array(maxLinha + 2).fill(null).map(() => 
      Array(maxColuna + 2).fill(null).map(() => ({ letra: null }))
    );

    const novasRespostas: string[][] = Array(maxLinha + 2).fill(null).map(() => 
      Array(maxColuna + 2).fill('')
    );

    palavrasList.forEach(palavra => {
      for (let i = 0; i < palavra.palavra.length; i++) {
        const linha = palavra.horizontal ? palavra.linha : palavra.linha + i;
        const coluna = palavra.horizontal ? palavra.coluna + i : palavra.coluna;
        
        novoGrid[linha][coluna] = {
          letra: palavra.palavra[i],
          numero: i === 0 ? palavra.numero : novoGrid[linha][coluna].numero,
          horizontal: palavra.horizontal || novoGrid[linha][coluna].horizontal,
          vertical: !palavra.horizontal || novoGrid[linha][coluna].vertical
        };
      }
    });

    setGrid(novoGrid);
    setRespostas(novasRespostas);
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    const novasRespostas = [...respostas];
    novasRespostas[row][col] = value.toUpperCase().slice(-1);
    setRespostas(novasRespostas);
  };

  const verificarRespostas = () => {
    let todasCorretas = true;
    
    grid.forEach((linha, rowIndex) => {
      linha.forEach((celula, colIndex) => {
        if (celula.letra) {
          if (respostas[rowIndex][colIndex] !== celula.letra.toUpperCase()) {
            todasCorretas = false;
          }
        }
      });
    });

    if (todasCorretas) {
      setCompleto(true);
      toast.success('🏆 Parabéns! Você completou as palavras cruzadas!');
    } else {
      toast.error('Algumas respostas estão incorretas. Continue tentando!');
    }
  };

  const totalPalavras = palavras.length;
  const palavrasCompletas = palavras.filter(p => {
    return p.palavra.split('').every((letra, i) => {
      const linha = p.horizontal ? p.linha : p.linha + i;
      const coluna = p.horizontal ? p.coluna + i : p.coluna;
      return respostas[linha]?.[coluna]?.toUpperCase() === letra.toUpperCase();
    });
  }).length;
  const progresso = totalPalavras > 0 ? (palavrasCompletas / totalPalavras) * 100 : 0;

  const limparTudo = () => {
    const novasRespostas = respostas.map(linha => linha.map(() => ''));
    setRespostas(novasRespostas);
    toast.info('Grade limpa!');
  };

  const darDica = () => {
    for (const palavra of palavras) {
      for (let i = 0; i < palavra.palavra.length; i++) {
        const linha = palavra.horizontal ? palavra.linha : palavra.linha + i;
        const coluna = palavra.horizontal ? palavra.coluna + i : palavra.coluna;
        
        if (respostas[linha]?.[coluna]?.toUpperCase() !== palavra.palavra[i].toUpperCase()) {
          const novasRespostas = [...respostas];
          novasRespostas[linha][coluna] = palavra.palavra[i].toUpperCase();
          setRespostas(novasRespostas);
          toast.success('💡 Dica revelada!');
          return;
        }
      }
    }
    toast.info('Todas as letras já estão corretas!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📝</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (etapa === 'selecao') {
    const jogo = getJogoPredefinido(area, tema);
    const timelineItens = jogo?.palavras.map((p: any, i: number) => ({
      numero: i + 1,
      titulo: `Nível ${i + 1}: ${i + 1} palavra${i > 0 ? 's' : ''}`,
      descricao: `Resolva palavras cruzadas com ${i + 1} palavra${i > 0 ? 's' : ''} sobre ${tema}`,
      icone: i < 3 ? '🟢' : i < 6 ? '🟡' : i < 9 ? '🟠' : '🔴'
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
          <h1 className="text-3xl font-bold mb-2">🧩 Palavras Cruzadas</h1>
          <p className="text-muted-foreground">
            Escolha um nível para começar
          </p>
        </div>

        <TemaTimeline
          itens={timelineItens}
          onSelect={(item) => iniciarJogo(item.numero - 1)}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
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
        <h1 className="text-2xl font-bold mb-2">🧩 Palavras Cruzadas</h1>
        <p className="text-sm text-muted-foreground">
          Preencha as palavras horizontais e verticais
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Progresso:</span>
              <span className="text-muted-foreground">
                {palavrasCompletas}/{totalPalavras} palavras
              </span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button onClick={darDica} variant="outline" size="sm" className="gap-2">
          <Lightbulb className="w-4 h-4" />
          Dica
        </Button>
        <Button onClick={limparTudo} variant="outline" size="sm" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-6">
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid gap-0" style={{ 
                gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 40px)`,
                gridTemplateRows: `repeat(${grid.length}, 40px)`
              }}>
                {grid.map((linha, rowIndex) => 
                  linha.map((celula, colIndex) => {
                    if (!celula.letra) {
                      return (
                        <div 
                          key={`${rowIndex}-${colIndex}`} 
                          className="w-10 h-10 bg-muted/30"
                        />
                      );
                    }
                    
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`} 
                        className="relative w-10 h-10 border border-border bg-card"
                      >
                        {celula.numero && (
                          <span className="absolute top-0 left-0 text-[10px] font-bold text-muted-foreground px-0.5">
                            {celula.numero}
                          </span>
                        )}
                        <input
                          type="text"
                          maxLength={1}
                          value={respostas[rowIndex]?.[colIndex] || ''}
                          onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                          className="w-full h-full text-center uppercase font-bold text-lg bg-transparent border-none outline-none focus:bg-accent/10"
                          disabled={completo}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Dicas</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-blue-600 dark:text-blue-400">
                    → Horizontais
                  </h4>
                  <div className="space-y-2">
                    {palavras
                      .filter(p => p.horizontal)
                      .map((palavra) => {
                        const completa = palavra.palavra.split('').every((letra, i) => {
                          const coluna = palavra.coluna + i;
                          return respostas[palavra.linha]?.[coluna]?.toUpperCase() === letra.toUpperCase();
                        });
                        return (
                          <div
                            key={palavra.numero}
                            className={`text-sm p-2 rounded transition-all ${
                              completa ? 'bg-green-500/20 border border-green-500/50' : 'bg-muted'
                            }`}
                          >
                            <span className="font-bold">{palavra.numero}. </span>
                            {palavra.dica}
                            {completa && <span className="ml-2 text-green-600">✓</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 text-purple-600 dark:text-purple-400">
                    ↓ Verticais
                  </h4>
                  <div className="space-y-2">
                    {palavras
                      .filter(p => !p.horizontal)
                      .map((palavra) => {
                        const completa = palavra.palavra.split('').every((letra, i) => {
                          const linha = palavra.linha + i;
                          return respostas[linha]?.[palavra.coluna]?.toUpperCase() === letra.toUpperCase();
                        });
                        return (
                          <div
                            key={palavra.numero}
                            className={`text-sm p-2 rounded transition-all ${
                              completa ? 'bg-green-500/20 border border-green-500/50' : 'bg-muted'
                            }`}
                          >
                            <span className="font-bold">{palavra.numero}. </span>
                            {palavra.dica}
                            {completa && <span className="ml-2 text-green-600">✓</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!completo ? (
            <Button onClick={verificarRespostas} className="w-full" size="lg">
              <Check className="w-4 h-4 mr-2" />
              Verificar Respostas
            </Button>
          ) : (
            <Button onClick={() => setEtapa('selecao')} variant="outline" className="w-full">
              Jogar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CruzadasGame;
