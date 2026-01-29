import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, Play, Pause, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LivroSemCapa {
  id: number;
  Tema: string;
  Área: string;
}

interface ResultadoGeracao {
  livroId: number;
  tema: string;
  success: boolean;
  capaUrl?: string;
  error?: string;
}

export default function AdminCapasBiblioteca() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [livrosSemCapa, setLivrosSemCapa] = useState<LivroSemCapa[]>([]);
  const [totalLivros, setTotalLivros] = useState(0);
  const [comCapa, setComCapa] = useState(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultados, setResultados] = useState<ResultadoGeracao[]>([]);
  const [currentLivro, setCurrentLivro] = useState<LivroSemCapa | null>(null);

  // Carregar estatísticas
  const carregarEstatisticas = useCallback(async () => {
    setIsLoading(true);
    try {
      // Total de livros
      const { count: total } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('*', { count: 'exact', head: true });

      // Livros com capa
      const { count: capas } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('*', { count: 'exact', head: true })
        .or('url_capa_gerada.not.is.null,Capa-livro.not.is.null');

      // Livros sem capa (lista)
      const { data: semCapa } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Tema, "Área"')
        .is('url_capa_gerada', null)
        .is('Capa-livro', null)
        .order('id');

      setTotalLivros(total || 0);
      setComCapa(capas || 0);
      setLivrosSemCapa((semCapa as any as LivroSemCapa[]) || []);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  // Gerar capa para um livro
  const gerarCapaLivro = async (livro: LivroSemCapa): Promise<ResultadoGeracao> => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-biblioteca', {
        body: {
          livroId: livro.id,
          titulo: livro.Tema,
          area: livro.Área
        }
      });

      if (error) throw error;

      if (data?.url_capa) {
        return {
          livroId: livro.id,
          tema: livro.Tema,
          success: true,
          capaUrl: data.url_capa
        };
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      return {
        livroId: livro.id,
        tema: livro.Tema,
        success: false,
        error: error.message || 'Erro ao gerar'
      };
    }
  };

  // Iniciar geração em lote
  const iniciarGeracao = async () => {
    if (livrosSemCapa.length === 0) {
      toast.info('Todos os livros já têm capa!');
      return;
    }

    setIsGenerating(true);
    setIsPaused(false);
    setResultados([]);
    setCurrentIndex(0);

    for (let i = 0; i < livrosSemCapa.length; i++) {
      // Verificar se foi pausado
      if (isPaused) {
        setCurrentIndex(i);
        break;
      }

      const livro = livrosSemCapa[i];
      setCurrentLivro(livro);
      setCurrentIndex(i);

      toast.info(`Gerando capa ${i + 1}/${livrosSemCapa.length}: ${livro.Tema.substring(0, 30)}...`);

      const resultado = await gerarCapaLivro(livro);
      setResultados(prev => [...prev, resultado]);

      if (resultado.success) {
        toast.success(`✓ Capa gerada: ${livro.Tema.substring(0, 30)}`);
      } else {
        toast.error(`✗ Erro: ${livro.Tema.substring(0, 30)}`);
      }

      // Delay entre gerações para evitar rate limit
      if (i < livrosSemCapa.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setIsGenerating(false);
    setCurrentLivro(null);
    
    // Recarregar estatísticas
    await carregarEstatisticas();
    
    const sucessos = resultados.filter(r => r.success).length;
    toast.success(`Geração concluída! ${sucessos} capas geradas.`);
  };

  // Pausar geração
  const pausarGeracao = () => {
    setIsPaused(true);
    setIsGenerating(false);
    toast.info('Geração pausada');
  };

  const progresso = totalLivros > 0 ? (comCapa / totalLivros) * 100 : 0;
  const sucessos = resultados.filter(r => r.success).length;
  const erros = resultados.filter(r => !r.success).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Gerador de Capas</h1>
          <p className="text-sm text-muted-foreground">Biblioteca de Estudos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Total de livros:</span>
              <span className="font-bold">{totalLivros}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Com capa:</span>
              <span className="font-bold text-green-500">{comCapa}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sem capa:</span>
              <span className="font-bold text-orange-500">{livrosSemCapa.length}</span>
            </div>
            <Progress value={progresso} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">
              {progresso.toFixed(1)}% completo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {!isGenerating ? (
              <Button 
                onClick={iniciarGeracao} 
                className="flex-1"
                disabled={livrosSemCapa.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Gerar {livrosSemCapa.length} Capas
              </Button>
            ) : (
              <Button 
                onClick={pausarGeracao} 
                variant="destructive"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={carregarEstatisticas}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status atual */}
      {isGenerating && currentLivro && (
        <Card className="mb-6 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">Gerando capa...</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentLivro.Tema}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1}/{livrosSemCapa.length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Resultados ({sucessos} ✓ / {erros} ✗)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    resultado.success 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {resultado.success ? (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">
                    {resultado.tema}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de livros sem capa */}
      {!isGenerating && livrosSemCapa.length > 0 && resultados.length === 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Livros sem capa ({livrosSemCapa.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {livrosSemCapa.slice(0, 20).map((livro) => (
                <div 
                  key={livro.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1">{livro.Tema}</span>
                  <span className="text-xs text-muted-foreground">{livro.Área}</span>
                </div>
              ))}
              {livrosSemCapa.length > 20 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  + {livrosSemCapa.length - 20} mais...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
