import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { VotoDeputadoCard } from "@/components/VotoDeputadoCard";
import { GraficoVotacao } from "@/components/GraficoVotacao";
import { AnalisePartidoVotacao } from "@/components/AnalisePartidoVotacao";
import { AnaliseEstadoVotacao } from "@/components/AnaliseEstadoVotacao";
import ExplicacaoSimpleModal from "@/components/ExplicacaoSimpleModal";
import { ArrowLeft, Search, CheckCircle, XCircle, MinusCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Voto {
  deputado_: {
    id: string;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto: string;
  };
  tipoVoto: string;
}

interface Votacao {
  id: string;
  descricao: string;
  dataHoraRegistro: string;
  aprovacao: number;
  siglaOrgao: string;
  proposicaoObjeto?: {
    id: number;
    siglaTipo: string;
    numero: number;
    ementa: string;
  };
}

export default function CamaraVotacaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [votacao, setVotacao] = useState<Votacao | null>(null);
  const [votos, setVotos] = useState<Voto[]>([]);
  const [filteredVotos, setFilteredVotos] = useState<Voto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroVoto, setFiltroVoto] = useState<string>("todos");
  const [explicacao, setExplicacao] = useState("");
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [showExplicacao, setShowExplicacao] = useState(false);

  useEffect(() => {
    if (id) {
      buscarDetalhes();
    }
  }, [id]);

  useEffect(() => {
    filtrarVotos();
  }, [votos, searchTerm, filtroVoto]);

  const buscarDetalhes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('detalhes-votacao', {
        body: { idVotacao: id }
      });

      if (error) throw error;

      setVotacao(data.votacao);
      setVotos(data.votos || []);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast.error('Erro ao carregar detalhes da votação');
    } finally {
      setLoading(false);
    }
  };

  const filtrarVotos = () => {
    let resultado = votos;

    if (filtroVoto !== "todos") {
      resultado = resultado.filter(v => v.tipoVoto === filtroVoto);
    }

    if (searchTerm) {
      resultado = resultado.filter(v =>
        v.deputado_?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.deputado_?.siglaPartido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVotos(resultado);
  };

  const gerarExplicacao = async () => {
    if (!votacao) return;

    try {
      setLoadingExplicacao(true);
      const { data, error } = await supabase.functions.invoke('explicar-votacao', {
        body: { votacao }
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

  const contarVotos = () => {
    const sim = votos.filter(v => v.tipoVoto === "Sim").length;
    const nao = votos.filter(v => v.tipoVoto === "Não").length;
    const abstencao = votos.filter(v => v.tipoVoto === "Abstenção").length;
    const obstrucao = votos.filter(v => v.tipoVoto === "Obstrução").length;
    return { sim, nao, abstencao, obstrucao };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <ContentGenerationLoader message="Carregando detalhes da votação..." />
      </div>
    );
  }

  if (!votacao) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Votação não encontrada</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const stats = contarVotos();
  const aprovado = votacao.aprovacao === 1;

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      {/* Cabeçalho */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Status e Informações Principais */}
      <Card className="p-4 md:p-6 mb-6 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-blue-500/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <Badge
            variant={aprovado ? "default" : "destructive"}
            className="text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap"
          >
            {aprovado ? (
              <><CheckCircle className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> APROVADO</>
            ) : (
              <><XCircle className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> REJEITADO</>
            )}
          </Badge>
          <Button 
            onClick={gerarExplicacao} 
            disabled={loadingExplicacao}
            className="w-full sm:w-auto"
            size="sm"
          >
            {loadingExplicacao ? "Gerando..." : "Explicar com IA"}
          </Button>
        </div>

        <h1 className="text-lg md:text-2xl font-bold mb-3 leading-tight">{votacao.descricao}</h1>
        
        {/* Estatísticas inline para mobile */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm md:text-base font-semibold">
            <span className="text-green-400">Sim: {stats.sim}</span>
            <span className="mx-2">•</span>
            <span className="text-red-400">Não: {stats.nao}</span>
            <span className="mx-2">•</span>
            <span className="text-gray-400">Total: {votos.length}</span>
          </p>
        </div>

        <div className="space-y-2 text-sm md:text-base">
          <div>
            <span className="text-muted-foreground">Data:</span>
            <p className="font-semibold">
              {new Date(votacao.dataHoraRegistro).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Órgão:</span>
            <p className="font-semibold">{votacao.siglaOrgao}</p>
          </div>
        </div>

        {votacao.proposicaoObjeto && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Proposição relacionada:</p>
            <Link
              to={`/camara-deputados/proposicao/${votacao.proposicaoObjeto.id}`}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              {votacao.proposicaoObjeto.siglaTipo} {votacao.proposicaoObjeto.numero}
            </Link>
            <p className="text-sm mt-2">{votacao.proposicaoObjeto.ementa}</p>
          </div>
        )}
      </Card>

      {/* Estatísticas e Gráfico */}
      <Card className="p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">Resultado da Votação</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="text-center p-3 md:p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2 text-green-500" />
            <p className="text-2xl md:text-3xl font-bold text-green-500">{stats.sim}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Sim</p>
            <p className="text-xs text-green-400 mt-1">{Math.round(stats.sim / votos.length * 100)}%</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <XCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2 text-red-500" />
            <p className="text-2xl md:text-3xl font-bold text-red-500">{stats.nao}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Não</p>
            <p className="text-xs text-red-400 mt-1">{Math.round(stats.nao / votos.length * 100)}%</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-gray-500/10 rounded-lg border border-gray-500/30">
            <MinusCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2 text-gray-400" />
            <p className="text-2xl md:text-3xl font-bold text-gray-400">{stats.abstencao}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Abstenção</p>
            <p className="text-xs text-gray-400 mt-1">{Math.round(stats.abstencao / votos.length * 100)}%</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1 md:mb-2 text-yellow-500" />
            <p className="text-2xl md:text-3xl font-bold text-yellow-500">{stats.obstrucao}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Obstrução</p>
            <p className="text-xs text-yellow-400 mt-1">{Math.round(stats.obstrucao / votos.length * 100)}%</p>
          </div>
        </div>

        <GraficoVotacao
          sim={stats.sim}
          nao={stats.nao}
          abstencao={stats.abstencao}
          obstrucao={stats.obstrucao}
        />
      </Card>

      {/* Análises por Partido e Estado */}
      {votos.length > 0 && (
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          <AnalisePartidoVotacao votos={votos} />
          <AnaliseEstadoVotacao votos={votos} />
        </div>
      )}

      {/* Lista de Votos */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">
          Votos dos Deputados ({filteredVotos.length})
        </h2>

        {/* Filtros */}
        <div className="flex flex-col gap-3 md:gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar deputado ou partido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroVoto === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroVoto("todos")}
            >
              Todos
            </Button>
            <Button
              variant={filtroVoto === "Sim" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroVoto("Sim")}
            >
              Sim ({stats.sim})
            </Button>
            <Button
              variant={filtroVoto === "Não" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroVoto("Não")}
            >
              Não ({stats.nao})
            </Button>
            <Button
              variant={filtroVoto === "Abstenção" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroVoto("Abstenção")}
            >
              Abstenção ({stats.abstencao})
            </Button>
            {stats.obstrucao > 0 && (
              <Button
                variant={filtroVoto === "Obstrução" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroVoto("Obstrução")}
              >
                Obstrução ({stats.obstrucao})
              </Button>
            )}
          </div>
        </div>

        {/* Grid de Votos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVotos.map((voto, index) => (
            <VotoDeputadoCard key={index} voto={voto} />
          ))}
        </div>

        {filteredVotos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum voto encontrado com os filtros aplicados
          </p>
        )}
      </Card>

      {/* Modal de Explicação */}
      <ExplicacaoSimpleModal
        isOpen={showExplicacao}
        onClose={() => setShowExplicacao(false)}
        titulo="Explicação da Votação"
        conteudo={explicacao}
      />
    </div>
  );
}
