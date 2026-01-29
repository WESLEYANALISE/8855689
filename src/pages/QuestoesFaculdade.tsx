import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChevronRight, Target, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

interface Questao {
  id: number;
  area: string;
  tema: string;
  enunciado: string;
  taxa_acerto: number;
  vezes_respondida: number;
}

interface AreaStats {
  area: string;
  totalResumos: number;
  totalQuestoes: number;
}

const QuestoesFaculdade = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaStats[]>([]);
  const [areaSelecionada, setAreaSelecionada] = useState("");
  const [temas, setTemas] = useState<string[]>([]);
  const [temaSelecionado, setTemaSelecionado] = useState("");
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState(0);
  const [progressoDetalhado, setProgressoDetalhado] = useState({
    atual: 0,
    total: 0,
    porcentagem: 0
  });
  const [searchArea, setSearchArea] = useState("");
  const [searchTema, setSearchTema] = useState("");

  useEffect(() => {
    carregarAreas();
  }, []);

  useEffect(() => {
    if (areaSelecionada) {
      carregarTemas();
    }
  }, [areaSelecionada]);

  useEffect(() => {
    if (temaSelecionado) {
      carregarQuestoes();
    }
  }, [temaSelecionado]);

  const carregarAreas = async () => {
    try {
      // Buscar áreas de RESUMO
      const { data: resumosData, error: resumosError } = await supabase
        .from('RESUMO')
        .select('area');

      if (resumosError) throw resumosError;

      // Contar resumos por área
      const areaResumoCount = resumosData.reduce((acc: any, r: any) => {
        acc[r.area] = (acc[r.area] || 0) + 1;
        return acc;
      }, {});

      // Buscar questões geradas por área
      const { data: questoesData, error: questoesError } = await supabase
        .from('QUESTOES_GERADAS')
        .select('area')
        .eq('aprovada', true);

      if (questoesError) throw questoesError;

      // Contar questões por área
      const areaQuestoesCount = questoesData.reduce((acc: any, q: any) => {
        acc[q.area] = (acc[q.area] || 0) + 1;
        return acc;
      }, {});

      // Montar array com ambas contagens
      const areasUnicas = Object.keys(areaResumoCount);
      const areasComInfo = areasUnicas.map(area => ({
        area,
        totalResumos: areaResumoCount[area] || 0,
        totalQuestoes: areaQuestoesCount[area] || 0
      })).sort((a, b) => a.area.localeCompare(b.area));

      setAreas(areasComInfo);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar áreas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarTemas = async () => {
    try {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('tema')
        .eq('area', areaSelecionada);

      if (error) throw error;

      const temasUnicos = [...new Set(data.map(item => item.tema))].sort();
      setTemas(temasUnicos);
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
    }
  };

  const carregarQuestoes = async () => {
    try {
      const { data, error } = await supabase
        .from('QUESTOES_GERADAS')
        .select('id, area, tema, enunciado, taxa_acerto, vezes_respondida')
        .eq('area', areaSelecionada)
        .eq('tema', temaSelecionado)
        .eq('aprovada', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQuestoes(data || []);

      // Se não há questões, gerar automaticamente
      if (!data || data.length === 0) {
        await gerarQuestoesParaTema();
      }
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
    }
  };

  const gerarQuestoesParaTema = async () => {
    if (!areaSelecionada || !temaSelecionado) return;

    setGerando(true);
    setProgressoGeracao(0);

    try {
      console.log(`🎯 Iniciando geração de questões para ${areaSelecionada} > ${temaSelecionado}`);

      // 1. Buscar resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from('RESUMO')
        .select('*')
        .eq('area', areaSelecionada)
        .eq('tema', temaSelecionado);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum resumo encontrado para gerar questões",
          variant: "destructive"
        });
        setGerando(false);
        return;
      }

      // Contar subtemas únicos
      const subtemasUnicos = [...new Set(resumos.map((r: any) => r.subtema || r.tema))];
      const totalQuestoesEsperadas = subtemasUnicos.length * 10;

      console.log(`📚 ${resumos.length} resumos encontrados`);
      console.log(`📊 ${subtemasUnicos.length} subtemas únicos encontrados`);
      console.log(`🎯 Serão geradas ${totalQuestoesEsperadas} questões (10 por subtema)`);

      setProgressoDetalhado({
        atual: 0,
        total: totalQuestoesEsperadas,
        porcentagem: 0
      });

      toast({
        title: "Geração Iniciada",
        description: `Gerando ${totalQuestoesEsperadas} questões (${subtemasUnicos.length} subtemas × 10)...`,
      });

      // 2. Chamar edge function para gerar questões (sem aguardar timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutos

      // Iniciar geração
      const invokePromise = supabase.functions.invoke('gerar-questoes-tema', {
        body: {
          area: areaSelecionada,
          tema: temaSelecionado,
          resumos: resumos
        },
        signal: controller.signal
      });

      // 3. Fazer polling para atualizar progresso
      const intervalId = setInterval(async () => {
        try {
          const { count } = await supabase
            .from('QUESTOES_GERADAS')
            .select('id', { count: 'exact', head: true })
            .eq('area', areaSelecionada)
            .eq('tema', temaSelecionado);

          const questoesAtuais = count || 0;
          const porcentagem = Math.floor((questoesAtuais / totalQuestoesEsperadas) * 100);

          setProgressoDetalhado({
            atual: questoesAtuais,
            total: totalQuestoesEsperadas,
            porcentagem
          });

          setProgressoGeracao(porcentagem);

          console.log(`📊 Progresso: ${questoesAtuais}/${totalQuestoesEsperadas} questões (${porcentagem}%)`);

          // Parar quando atingir 100%
          if (questoesAtuais >= totalQuestoesEsperadas) {
            clearInterval(intervalId);
            setProgressoGeracao(100);
            setGerando(false);
            await carregarQuestoes();
            toast({
              title: "Sucesso",
              description: `${questoesAtuais} questões geradas com sucesso!`,
            });
          }
        } catch (pollError) {
          console.error('Erro no polling:', pollError);
        }
      }, 3000); // Verificar a cada 3 segundos

      // Aguardar edge function (com timeout)
      try {
        const { data, error } = await invokePromise;
        clearTimeout(timeoutId);
        clearInterval(intervalId);

        if (error) {
          if (error.name === 'AbortError' || error.message.includes('Failed to send')) {
            toast({
              title: "Geração Iniciada",
              description: "As questões estão sendo criadas em background. Atualizando...",
            });
            
            // Continuar polling por mais tempo
            setTimeout(async () => {
              await carregarQuestoes();
              setGerando(false);
              setProgressoGeracao(100);
            }, 5000);
            
            return;
          }
          throw error;
        }

        console.log('✅ Resposta da edge function:', data);

        setProgressoGeracao(100);
        setProgressoDetalhado({
          atual: data.questoes_geradas || 0,
          total: totalQuestoesEsperadas,
          porcentagem: 100
        });

        if (data.fromCache) {
          toast({
            title: "Sucesso",
            description: `${data.questoes_geradas} questões carregadas do cache!`,
          });
        } else {
          toast({
            title: "Sucesso",
            description: `${data.questoes_geradas} questões geradas com sucesso!`,
          });
        }

        // Recarregar questões
        await carregarQuestoes();
        setGerando(false);

      } catch (invokeError: any) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);

        if (invokeError.name === 'AbortError') {
          toast({
            title: "Geração em Background",
            description: "A geração continua em background. Volte em alguns minutos.",
          });
          setGerando(false);
        } else {
          throw invokeError;
        }
      }

    } catch (error: any) {
      console.error('Erro ao gerar questões:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      setGerando(false);
    }
  };

  const iniciarQuiz = (questaoId?: number) => {
    const params = new URLSearchParams({
      area: areaSelecionada,
      ...(temaSelecionado && { tema: temaSelecionado }),
      ...(questaoId && { questaoId: questaoId.toString() })
    });
    navigate(`/faculdade/questoes/quiz?${params}`);
  };

  const voltarParaAreas = () => {
    setAreaSelecionada("");
    setTemaSelecionado("");
    setQuestoes([]);
    setSearchTema("");
  };

  const voltarParaTemas = () => {
    setTemaSelecionado("");
    setQuestoes([]);
  };

  const areasFiltradas = areas.filter(area =>
    area.area.toLowerCase().includes(searchArea.toLowerCase())
  );

  const temasFiltrados = temas.filter(tema =>
    tema.toLowerCase().includes(searchTema.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Tela de Seleção de Área */}
      {!areaSelecionada && (
        <>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-10 h-10" />
                <h1 className="text-3xl font-bold">Questões por Área</h1>
              </div>
              <p className="text-emerald-100">
                Selecione uma área do direito para praticar
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 space-y-6">
            <Input
              placeholder="Buscar área..."
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="max-w-md"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areasFiltradas.map((area) => (
                <Card
                  key={area.area}
                  className="p-6 transition-all cursor-not-allowed opacity-60 border-2 relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {area.area}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {area.totalQuestoes} questões disponíveis
                      </p>
                      <div className="mt-3 px-3 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold inline-block">
                        Em breve
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tela de Seleção de Tema */}
      {areaSelecionada && !temaSelecionado && (
        <>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <Button
                variant="ghost"
                onClick={voltarParaAreas}
                className="text-white hover:bg-white/10 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para áreas
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-10 h-10" />
                <h1 className="text-3xl font-bold">{areaSelecionada}</h1>
              </div>
              <p className="text-emerald-100">Selecione um tema para praticar</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 space-y-6">
            <Input
              placeholder="Buscar tema..."
              value={searchTema}
              onChange={(e) => setSearchTema(e.target.value)}
              className="max-w-md"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {temasFiltrados.map((tema) => (
                <Card
                  key={tema}
                  className="p-6 transition-all cursor-not-allowed opacity-60 border-2 relative"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-base flex-1 line-clamp-2">
                      {tema}
                    </h3>
                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold whitespace-nowrap">
                      Em breve
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tela de Questões do Tema */}
      {areaSelecionada && temaSelecionado && (
        <>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <Button
                variant="ghost"
                onClick={voltarParaTemas}
                className="text-white hover:bg-white/10 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para temas
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8" />
                <h1 className="text-2xl font-bold">{temaSelecionado}</h1>
              </div>
              <p className="text-emerald-100">{areaSelecionada}</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Botão Iniciar Quiz */}
            {!gerando && questoes.length > 0 && (
              <Button 
                onClick={() => iniciarQuiz()} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <Target className="w-5 h-5 mr-2" />
                Iniciar Quiz ({questoes.length} questões)
              </Button>
            )}

            {/* Lista de Questões */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Questões Disponíveis ({questoes.length})
              </h2>

              {gerando ? (
                <Card className="p-8 text-center space-y-4">
                  <ContentGenerationLoader 
                    message="Gerando questões com IA..."
                    progress={progressoDetalhado.porcentagem}
                  />
                  {progressoDetalhado.total > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium text-foreground">
                        {progressoDetalhado.atual} de {progressoDetalhado.total} questões
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {progressoDetalhado.porcentagem}% concluído
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        As questões são salvas na tabela <span className="font-mono font-semibold">QUESTOES_GERADAS</span>
                      </p>
                    </div>
                  )}
                </Card>
              ) : questoes.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma questão encontrada para este tema.</p>
                </Card>
              ) : (
                questoes.map((questao) => (
                  <Card key={questao.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {questao.tema}
                          </span>
                          {questao.vezes_respondida > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {questao.taxa_acerto}% acerto ({questao.vezes_respondida}x)
                            </span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{questao.enunciado}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => iniciarQuiz(questao.id)}
                        className="flex-shrink-0"
                      >
                        Resolver
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestoesFaculdade;
