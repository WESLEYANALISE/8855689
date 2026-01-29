import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { TemaTimeline } from "@/components/jogos/TemaTimeline";

interface CelulaSelecionada {
  linha: number;
  coluna: number;
}

interface Nivel {
  nivel: number;
  palavras: string[];
  grid?: string[][];
}

const CacaPalavrasGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [etapa, setEtapa] = useState<'selecao' | 'jogo'>('selecao');
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [nivelAtual, setNivelAtual] = useState(1);
  const [palavrasEncontradas, setPalavrasEncontradas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [celulasPath, setCelulasPath] = useState<CelulaSelecionada[]>([]);
  const [celulasHighlight, setCelulasHighlight] = useState<Set<string>>(new Set());

  const nivelData = niveis.find(n => n.nivel === nivelAtual);
  const palavrasNivel = nivelData?.palavras || [];
  const grid = nivelData?.grid || [];
  const totalNiveis = niveis.length;

  useEffect(() => {
    carregarJogo();
  }, []);

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
          tipo: 'caca_palavras',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.niveis) {
        const niveisComGrid = data.dados_jogo.niveis.map((n: Nivel) => ({
          ...n,
          grid: gerarGrid(n.palavras, n.nivel * 2 + 8)
        }));
        setNiveis(niveisComGrid);
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
        niveis: [
          { nivel: 1, palavras: ['SNUC', 'IBAMA', 'LICENCA'] },
          { nivel: 2, palavras: ['PARQUE', 'RESERVA', 'ESTACAO', 'REFUGIO'] },
          { nivel: 3, palavras: ['FLORESTA', 'MONUMENTO', 'EXTRATIVISTA', 'FISCALIZACAO', 'BIODIVERSIDADE'] },
          { nivel: 4, palavras: ['SUSTENTAVEL', 'CONSERVACAO', 'ECOSSISTEMA', 'PRESERVACAO', 'AMBIENTAL', 'PROTECAO'] },
          { nivel: 5, palavras: ['DESENVOLVIMENTO', 'INTEGRAL', 'GERENCIAMENTO', 'SUSTENTABILIDADE', 'LICENCIAMENTO', 'AUTORIZACAO', 'RECUPERACAO', 'FISCALIZACAO'] }
        ]
      }
    };

    const key = `${area}_${tema}`;
    return jogos[key];
  };

  const gerarGrid = (palavras: string[], tamanho: number): string[][] => {
    const grid: string[][] = Array(tamanho).fill(null).map(() => 
      Array(tamanho).fill('')
    );

    palavras.forEach((palavra) => {
      let colocada = false;
      let tentativas = 0;

      while (!colocada && tentativas < 50) {
        const horizontal = Math.random() > 0.5;
        const linha = Math.floor(Math.random() * tamanho);
        const coluna = Math.floor(Math.random() * tamanho);

        if (horizontal && coluna + palavra.length <= tamanho) {
          let espacoLivre = true;
          for (let i = 0; i < palavra.length; i++) {
            if (grid[linha][coluna + i] !== '' && grid[linha][coluna + i] !== palavra[i]) {
              espacoLivre = false;
              break;
            }
          }
          if (espacoLivre) {
            for (let i = 0; i < palavra.length; i++) {
              grid[linha][coluna + i] = palavra[i];
            }
            colocada = true;
          }
        } else if (!horizontal && linha + palavra.length <= tamanho) {
          let espacoLivre = true;
          for (let i = 0; i < palavra.length; i++) {
            if (grid[linha + i][coluna] !== '' && grid[linha + i][coluna] !== palavra[i]) {
              espacoLivre = false;
              break;
            }
          }
          if (espacoLivre) {
            for (let i = 0; i < palavra.length; i++) {
              grid[linha + i][coluna] = palavra[i];
            }
            colocada = true;
          }
        }
        tentativas++;
      }
    });

    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < tamanho; i++) {
      for (let j = 0; j < tamanho; j++) {
        if (grid[i][j] === '') {
          grid[i][j] = letras[Math.floor(Math.random() * letras.length)];
        }
      }
    }

    return grid;
  };

  const iniciarJogo = (nivelSelecionado: number) => {
    const jogo = getJogoPredefinido(area, tema);
    if (!jogo) return;

    const niveisComGrid = jogo.niveis.map((n: Nivel) => ({
      ...n,
      grid: gerarGrid(n.palavras, n.nivel * 2 + 8)
    }));

    setNiveis(niveisComGrid);
    setNivelAtual(nivelSelecionado);
    setPalavrasEncontradas([]);
    setEtapa('jogo');
    toast.success(`Começando nível ${nivelSelecionado}!`);
  };

  const getCelulaKey = (linha: number, coluna: number) => `${linha}-${coluna}`;

  const handleMouseDown = (linha: number, coluna: number) => {
    setIsSelecting(true);
    setCelulasPath([{ linha, coluna }]);
    setCelulasHighlight(new Set([getCelulaKey(linha, coluna)]));
  };

  const handleMouseEnter = (linha: number, coluna: number) => {
    if (!isSelecting) return;
    const key = getCelulaKey(linha, coluna);
    if (!celulasHighlight.has(key)) {
      setCelulasPath(prev => [...prev, { linha, coluna }]);
      setCelulasHighlight(prev => new Set([...prev, key]));
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    const palavraFormada = celulasPath.map(({ linha, coluna }) => grid[linha]?.[coluna]).join('');
    const palavraInvertida = palavraFormada.split('').reverse().join('');
    const palavraEncontrada = palavrasNivel.find(p => !palavrasEncontradas.includes(p) && (p === palavraFormada || p === palavraInvertida));

    if (palavraEncontrada) {
      setPalavrasEncontradas([...palavrasEncontradas, palavraEncontrada]);
      toast.success(`✅ Encontrou: ${palavraEncontrada}`);
      const palavrasDoNivelEncontradas = palavrasEncontradas.filter(p => palavrasNivel.includes(p));
      if (palavrasDoNivelEncontradas.length + 1 === palavrasNivel.length) {
        if (nivelAtual < totalNiveis) {
          setTimeout(() => {
            setNivelAtual(nivelAtual + 1);
            setPalavrasEncontradas([]);
            toast.success(`🎉 Nível ${nivelAtual} completo!`);
          }, 1000);
        } else {
          setTimeout(() => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            toast.success('🏆 Parabéns! Você completou todos os níveis!');
          }, 1000);
        }
      }
    }
    setIsSelecting(false);
    setCelulasPath([]);
    setCelulasHighlight(new Set());
  };

  const progressoNivel = (palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length / palavrasNivel.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔍</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (etapa === 'selecao') {
    const jogo = getJogoPredefinido(area, tema);
    const timelineItens = jogo?.niveis.map((n: Nivel) => ({
      numero: n.nivel,
      titulo: `Nível ${n.nivel}`,
      descricao: `Encontre ${n.palavras.length} termos jurídicos`,
      icone: ['🟢', '🟡', '🟠', '🔴', '🟣'][n.nivel - 1]
    })) || [];

    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">🔍 Caça-Palavras Jurídicas</h1>
          <p className="text-muted-foreground">Escolha um nível para começar</p>
        </div>
        <TemaTimeline itens={timelineItens} onSelect={(item) => iniciarJogo(item.numero)} loading={loading} />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto min-h-screen">
      <Button variant="ghost" size="sm" onClick={() => setEtapa('selecao')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🔍 Caça-Palavras</h1>
        <p className="text-sm text-muted-foreground">Encontre as palavras escondidas</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {niveis.map((nivel) => (
          <Badge key={nivel.nivel} variant={nivel.nivel === nivelAtual ? 'default' : nivel.nivel < nivelAtual ? 'secondary' : 'outline'} className={`flex-shrink-0 px-4 py-2 ${nivel.nivel === nivelAtual ? 'bg-green-500 text-white' : ''}`}>
            {nivel.nivel < nivelAtual && <Trophy className="w-3 h-3 mr-1" />}
            Nível {nivel.nivel}
          </Badge>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Nível {nivelAtual}</h2>
              <p className="text-sm text-muted-foreground">{palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length}/{palavrasNivel.length} encontradas</p>
            </div>
            <div className="text-2xl font-bold">{Math.round(progressoNivel)}%</div>
          </div>
          <Progress value={progressoNivel} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Palavras:</h3>
          <div className="flex flex-wrap gap-2">
            {palavrasNivel.map((palavra, idx) => {
              const encontrada = palavrasEncontradas.includes(palavra);
              return (
                <div key={idx} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${encontrada ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                  {encontrada && '✓ '}{palavra}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-1 select-none" style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 12}, minmax(0, 1fr))` }} onMouseLeave={handleMouseUp}>
            {grid.map((linha, i) =>
              linha.map((letra, j) => {
                const key = getCelulaKey(i, j);
                const isHighlighted = celulasHighlight.has(key);
                return (
                  <button key={key} onMouseDown={() => handleMouseDown(i, j)} onMouseEnter={() => handleMouseEnter(i, j)} onMouseUp={handleMouseUp} onTouchStart={() => handleMouseDown(i, j)} onTouchEnd={handleMouseUp} data-cell={key} className={`aspect-square flex items-center justify-center text-xs font-bold border rounded transition-all ${isHighlighted ? 'bg-primary text-primary-foreground scale-110' : 'bg-card hover:bg-accent'}`}>
                    {letra}
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacaPalavrasGame;
