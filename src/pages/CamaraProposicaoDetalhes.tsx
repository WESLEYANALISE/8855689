import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { DeputadoCard } from "@/components/DeputadoCard";
import ExplicacaoSimpleModal from "@/components/ExplicacaoSimpleModal";
import { ArrowLeft, FileText, Calendar, Tag, ExternalLink, BookOpen, Lightbulb, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
interface Autor {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  uri: string;
  tipo: string;
  ordemAssinatura: number;
  urlFoto?: string;
}
interface Votacao {
  id: string;
  descricao: string;
  data?: string;
  dataHoraRegistro?: string;
  aprovacao: number;
  siglaOrgao: string;
  stats?: {
    sim: number;
    nao: number;
    abstencao: number;
    obstrucao: number;
    total: number;
  };
}

interface Proposicao {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
  dataApresentacao: string;
  statusProposicao?: {
    descricaoTramitacao: string;
    descricaoSituacao: string;
    despacho: string;
    siglaOrgao: string;
    regime: string;
  };
  keywords?: string;
  tema?: string;
  uriAutores?: string;
  urlInteiroTeor?: string;
}
export default function CamaraProposicaoDetalhes() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proposicao, setProposicao] = useState<Proposicao | null>(null);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [explicacao, setExplicacao] = useState("");
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [showExplicacao, setShowExplicacao] = useState(false);
  useEffect(() => {
    if (id) {
      buscarDetalhes();
    }
  }, [id]);
  const buscarDetalhes = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('detalhes-proposicao', {
        body: {
          idProposicao: id
        }
      });
      if (error) throw error;
      setProposicao(data.proposicao);
      setVotacoes(data.votacoes || []);

      // Buscar fotos dos autores
      const autoresComFotos = await Promise.all((data.autores || []).map(async (autor: Autor) => {
        try {
          const deputadoId = autor.uri.split('/').pop();
          const response = await fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${deputadoId}`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const deputadoData = await response.json();
            return {
              ...autor,
              urlFoto: deputadoData.dados?.urlFoto
            };
          }
        } catch (err) {
          console.error('Erro ao buscar foto do autor:', err);
        }
        return autor;
      }));
      setAutores(autoresComFotos);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast.error('Erro ao carregar detalhes da proposição');
    } finally {
      setLoading(false);
    }
  };
  const gerarExplicacao = async () => {
    if (!proposicao) return;
    try {
      setLoadingExplicacao(true);
      const prompt = `Explique de forma clara e educativa esta proposição legislativa:

Tipo: ${proposicao.siglaTipo} ${proposicao.numero}/${proposicao.ano}
Ementa: ${proposicao.ementa}
${proposicao.tema ? `Tema: ${proposicao.tema}` : ''}
${proposicao.statusProposicao?.descricaoSituacao ? `Situação: ${proposicao.statusProposicao.descricaoSituacao}` : ''}

Por favor, explique:
1. O que esta proposição pretende fazer em linguagem simples
2. Qual é o contexto e a importância
3. Possíveis impactos práticos se for aprovada
4. Por que este tema é relevante`;
      
      const {
        data,
        error
      } = await supabase.functions.invoke('explicar-com-gemini', {
        body: {
          contexto: 'proposicao',
          dados: { pergunta: prompt }
        }
      });
      
      if (error) throw error;
      setExplicacao(data.explicacao);
      setShowExplicacao(true);
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      toast.error('Erro ao gerar explicação');
    } finally {
      setLoadingExplicacao(false);
    }
  };
  if (loading) {
    return <div className="container mx-auto px-4 py-6 pb-20">
        <ContentGenerationLoader message="Carregando detalhes da proposição..." />
      </div>;
  }
  if (!proposicao) {
    return <div className="container mx-auto px-4 py-6 pb-20">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Proposição não encontrada</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>;
  }
  const autorPrincipal = autores.find(a => a.tipo === "Autor") || autores[0];

  return <div className="container mx-auto px-4 py-6 pb-20">
      {/* Cabeçalho */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Informações Principais */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-blue-500/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {proposicao.siglaTipo} {proposicao.numero}/{proposicao.ano}
              </Badge>
              {proposicao.statusProposicao?.descricaoSituacao && <Badge variant="secondary">
                  {proposicao.statusProposicao.descricaoSituacao}
                </Badge>}
            </div>
            {/* Autor principal de forma discreta */}
            {autorPrincipal && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-8 h-8">
                  {autorPrincipal.urlFoto ? <AvatarImage src={autorPrincipal.urlFoto} alt={autorPrincipal.nome} /> : <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>}
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  <span>Autor: </span>
                  <span className="font-semibold text-foreground">{autorPrincipal.nome}</span>
                  <span className="ml-2">{autorPrincipal.siglaPartido}-{autorPrincipal.siglaUf}</span>
                </div>
              </div>
            )}
          </div>
          <Button onClick={gerarExplicacao} disabled={loadingExplicacao}>
            <Lightbulb className="mr-2 h-4 w-4" />
            {loadingExplicacao ? "Gerando..." : "Explicar com IA"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Ementa</h1>
        <p className="text-lg mb-6 leading-relaxed">{proposicao.ementa}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-blue-400 mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">Data de Apresentação</p>
              <p className="font-semibold">
                {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {proposicao.tema && <div className="flex items-start gap-2">
              <Tag className="h-5 w-5 text-blue-400 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Tema</p>
                <p className="font-semibold">{proposicao.tema}</p>
              </div>
            </div>}
        </div>

        {proposicao.keywords && <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Palavras-chave:</p>
            <div className="flex flex-wrap gap-2">
              {proposicao.keywords.split(',').map((keyword, idx) => <Badge key={idx} variant="secondary">
                  {keyword.trim()}
                </Badge>)}
            </div>
          </div>}

        {proposicao.urlInteiroTeor && <div className="mt-4">
            <Button variant="outline" className="w-full md:w-auto" onClick={() => window.open(proposicao.urlInteiroTeor, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Inteiro Teor
            </Button>
          </div>}
      </Card>

      {/* Status e Tramitação */}
      {proposicao.statusProposicao && <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Situação e Tramitação
          </h2>

          <div className="space-y-4">
            {proposicao.statusProposicao.descricaoTramitacao && <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição da Tramitação</p>
                <p className="font-semibold">{proposicao.statusProposicao.descricaoTramitacao}</p>
              </div>}

            {proposicao.statusProposicao.despacho && <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Último Despacho</p>
                <p className="text-sm">{proposicao.statusProposicao.despacho}</p>
              </div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposicao.statusProposicao.siglaOrgao && <div>
                  <p className="text-sm text-muted-foreground">Órgão</p>
                  <p className="font-semibold">{proposicao.statusProposicao.siglaOrgao}</p>
                </div>}

              {proposicao.statusProposicao.regime && <div>
                  <p className="text-sm text-muted-foreground">Regime de Tramitação</p>
                  <p className="font-semibold">{proposicao.statusProposicao.regime}</p>
                </div>}
            </div>
          </div>
        </Card>}

      {/* Votações */}
      {votacoes.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Votações ({votacoes.length})
          </h2>

          <div className="space-y-4">
            {votacoes.map((votacao) => {
              const aprovado = votacao.aprovacao === 1;
              const dataVotacao = votacao.data || votacao.dataHoraRegistro;
              const stats = votacao.stats || { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, total: 0 };

              return (
                <Card
                  key={votacao.id}
                  className="p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/camara-deputados/votacao/${votacao.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant={aprovado ? "default" : "destructive"}
                      className="text-sm px-3 py-1"
                    >
                      {aprovado ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovado
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {votacao.aprovacao === 0 ? 'Rejeitado' : 'Aprovado o Requerimento'}
                        </>
                      )}
                    </Badge>
                    {votacao.siglaOrgao && (
                      <Badge variant="outline" className="text-xs">
                        {votacao.siglaOrgao}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm mb-3 leading-relaxed">{votacao.descricao}</p>

                  {dataVotacao && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(dataVotacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}

                  {/* Estatísticas da votação */}
                  {stats.total > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/30">
                        <p className="text-xl font-bold text-green-500">{stats.sim}</p>
                        <p className="text-xs text-muted-foreground">Sim</p>
                        <p className="text-xs text-green-400">{Math.round(stats.sim / stats.total * 100)}%</p>
                      </div>
                      <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/30">
                        <p className="text-xl font-bold text-red-500">{stats.nao}</p>
                        <p className="text-xs text-muted-foreground">Não</p>
                        <p className="text-xs text-red-400">{Math.round(stats.nao / stats.total * 100)}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-500/10 rounded border border-gray-500/30">
                        <p className="text-xl font-bold text-gray-400">{stats.abstencao}</p>
                        <p className="text-xs text-muted-foreground">Abst.</p>
                        <p className="text-xs text-gray-400">{Math.round(stats.abstencao / stats.total * 100)}%</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                        <p className="text-xl font-bold text-yellow-500">{stats.obstrucao}</p>
                        <p className="text-xs text-muted-foreground">Obstr.</p>
                        <p className="text-xs text-yellow-400">{Math.round(stats.obstrucao / stats.total * 100)}%</p>
                      </div>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-3" size="sm">
                    Ver detalhes da votação →
                  </Button>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Autores */}
      {autores.length > 0 && <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Autores ({autores.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autores.map((autor, index) => <Card key={`autor-${autor.id || index}-${autor.uri || autor.nome}`} className="p-4 hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => {
          const deputadoId = autor.uri.split('/').pop();
          navigate(`/camara-deputados/deputado/${deputadoId}`);
        }}>
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-16 h-16">
                    {autor.urlFoto ? <AvatarImage src={autor.urlFoto} alt={autor.nome} /> : <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>}
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant={autor.tipo === "Autor" ? "default" : "secondary"}>
                        {autor.tipo}
                      </Badge>
                      {autor.ordemAssinatura && <span className="text-xs text-muted-foreground">
                          #{autor.ordemAssinatura}
                        </span>}
                    </div>
                    
                    <h3 className="font-bold text-sm mb-1">{autor.nome}</h3>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">{autor.siglaPartido}</Badge>
                      <span className="text-muted-foreground">{autor.siglaUf}</span>
                    </div>
                  </div>
                </div>
              </Card>)}
          </div>
        </Card>}

      {/* Modal de Explicação */}
      <ExplicacaoSimpleModal isOpen={showExplicacao} onClose={() => setShowExplicacao(false)} titulo={`Explicação: ${proposicao.siglaTipo} ${proposicao.numero}/${proposicao.ano}`} conteudo={explicacao} />
    </div>;
}