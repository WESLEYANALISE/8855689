import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, BookOpen, Target, HelpCircle, Cog, CheckCircle, Lightbulb, AlertTriangle, RefreshCw, GraduationCap, Building, Calendar, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TCCData {
  id: string;
  titulo: string;
  autor: string | null;
  ano: number | null;
  instituicao: string | null;
  tipo: string | null;
  area_direito: string | null;
  link_acesso: string | null;
  resumo_original: string | null;
  resumo_ia: string | null;
  tema_central: string | null;
  problema_pesquisa: string | null;
  objetivo_geral: string | null;
  metodologia: string | null;
  principais_conclusoes: string | null;
  contribuicoes: string | null;
  sugestoes_abordagem: string[] | null;
  tema_saturado: boolean | null;
  atualizacoes_necessarias: string[] | null;
  fonte: string | null;
  relevancia: string | null;
}

const TCCDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tcc, setTcc] = useState<TCCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analisando, setAnalisando] = useState(false);

  useEffect(() => {
    if (id) {
      carregarTCC();
    }
  }, [id]);

  const carregarTCC = async () => {
    try {
      const { data, error } = await supabase
        .from("tcc_pesquisas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTcc(data);

      // Se não tem análise, gerar automaticamente
      if (!data.resumo_ia) {
        analisarTCC(data);
      }
    } catch (error) {
      console.error("Erro ao carregar TCC:", error);
      toast.error("Erro ao carregar trabalho");
      navigate("/ferramentas/tcc");
    } finally {
      setLoading(false);
    }
  };

  const analisarTCC = async (tccData: TCCData) => {
    setAnalisando(true);
    try {
      const { data, error } = await supabase.functions.invoke("analisar-tcc", {
        body: {
          tccId: tccData.id,
          titulo: tccData.titulo,
          autor: tccData.autor,
          link_acesso: tccData.link_acesso,
          resumo_original: tccData.resumo_original,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Atualizar estado local com a análise
        setTcc((prev) => prev ? {
          ...prev,
          resumo_ia: data.analise.resumo_objetivo,
          tema_central: data.analise.tema_central,
          problema_pesquisa: data.analise.problema_pesquisa,
          objetivo_geral: data.analise.objetivo_geral,
          metodologia: data.analise.metodologia,
          principais_conclusoes: data.analise.principais_conclusoes,
          contribuicoes: data.analise.contribuicoes_academicas,
          sugestoes_abordagem: data.analise.sugestoes_abordagem,
          tema_saturado: data.analise.tema_saturado,
          atualizacoes_necessarias: data.analise.atualizacoes_necessarias,
        } : null);

        toast.success("Análise concluída!");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao analisar TCC:", error);
      toast.error("Erro ao analisar trabalho");
    } finally {
      setAnalisando(false);
    }
  };

  const getTipoLabel = (tipo: string | null) => {
    switch (tipo) {
      case 'tcc': return 'TCC';
      case 'dissertacao': return 'Dissertação';
      case 'tese': return 'Tese';
      default: return tipo || 'Não informado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tcc) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Trabalho não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/tcc")}
            className="shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {tcc.titulo}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {tcc.tipo && (
                <Badge variant="secondary">{getTipoLabel(tcc.tipo)}</Badge>
              )}
              {tcc.area_direito && (
                <Badge variant="outline">{tcc.area_direito}</Badge>
              )}
              {tcc.tema_saturado && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Tema Saturado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tcc.autor && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Autor:</span>
                  <span className="text-foreground font-medium">{tcc.autor}</span>
                </div>
              )}
              {tcc.instituicao && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Instituição:</span>
                  <span className="text-foreground font-medium">{tcc.instituicao}</span>
                </div>
              )}
              {tcc.ano && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ano:</span>
                  <span className="text-foreground font-medium">{tcc.ano}</span>
                </div>
              )}
              {tcc.fonte && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fonte:</span>
                  <span className="text-foreground font-medium uppercase">{tcc.fonte}</span>
                </div>
              )}
            </div>
            
            {tcc.link_acesso && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(tcc.link_acesso!, "_blank")}
                className="mt-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Trabalho Original
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Estado de Análise */}
        {analisando && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Analisando trabalho com IA...
              </h3>
              <p className="text-sm text-muted-foreground">
                Extraindo informações e gerando sugestões para seu TCC
              </p>
            </CardContent>
          </Card>
        )}

        {/* Análise IA */}
        {tcc.resumo_ia && (
          <>
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Resumo Gerado pela IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {tcc.resumo_ia}
                </p>
              </CardContent>
            </Card>

            {/* Análise Estruturada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Análise Estruturada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tcc.tema_central && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Tema Central
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.tema_central}</p>
                  </div>
                )}

                {tcc.problema_pesquisa && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      Problema de Pesquisa
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.problema_pesquisa}</p>
                  </div>
                )}

                {tcc.objetivo_geral && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      Objetivo Geral
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.objetivo_geral}</p>
                  </div>
                )}

                {tcc.metodologia && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <Cog className="h-4 w-4 text-primary" />
                      Metodologia
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.metodologia}</p>
                  </div>
                )}

                {tcc.principais_conclusoes && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Principais Conclusões
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.principais_conclusoes}</p>
                  </div>
                )}

                {tcc.contribuicoes && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-primary" />
                      Contribuições Acadêmicas
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{tcc.contribuicoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sugestões para Seu TCC */}
            {tcc.sugestoes_abordagem && tcc.sugestoes_abordagem.length > 0 && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                    <Lightbulb className="h-5 w-5" />
                    Sugestões para Seu TCC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tcc.sugestoes_abordagem.map((sugestao, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-foreground">{sugestao}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Atualizações Necessárias */}
            {tcc.atualizacoes_necessarias && tcc.atualizacoes_necessarias.length > 0 && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
                    <RefreshCw className="h-5 w-5" />
                    Atualizações Legislativas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tcc.atualizacoes_necessarias.map((atualizacao, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{atualizacao}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Botão Reanalisar */}
        {tcc.resumo_ia && (
          <Button
            variant="outline"
            onClick={() => analisarTCC(tcc)}
            disabled={analisando}
            className="w-full"
          >
            {analisando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reanalisar com IA
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TCCDetalhes;
