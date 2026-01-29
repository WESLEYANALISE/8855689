import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { DiscursoCard, ComissaoSenadoCard, VotacaoSenadoCard } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { 
  User, ArrowLeft, Mail, Phone, MapPin, Building2, 
  Vote, Mic, Calendar, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

const SenadoSenadorDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [senador, setSenador] = useState<any>(null);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [votacoes, setVotacoes] = useState<any[]>([]);
  const [discursos, setDiscursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (id) fetchSenador();
  }, [id]);

  const fetchSenador = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('detalhes-senador', {
        body: { codigo: id }
      });

      if (error) throw error;
      setSenador(data?.senador);

      // Buscar dados adicionais em paralelo
      const [comissoesRes, votacoesRes, discursosRes] = await Promise.all([
        supabase.functions.invoke('senador-comissoes', { body: { codigo: id } }),
        supabase.functions.invoke('senador-votacoes', { body: { codigo: id } }),
        supabase.functions.invoke('discursos-senador', { body: { codigo: id } }),
      ]);

      setComissoes(comissoesRes.data?.comissoes || []);
      setVotacoes(votacoesRes.data?.votacoes || []);
      setDiscursos(discursosRes.data?.discursos || []);
    } catch (error) {
      console.error('Erro ao buscar senador:', error);
      toast.error('Erro ao carregar dados do senador');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-4">
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!senador) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-4 items-center justify-center">
        <p className="text-muted-foreground">Senador não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header com foto */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {senador.foto ? (
            <img
              src={senador.foto}
              alt={senador.nome}
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="w-10 h-10 text-amber-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{senador.nome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-sm font-medium">
                {senador.partido}
              </span>
              <span className="text-sm text-muted-foreground">{senador.uf}</span>
            </div>
            {senador.nomeCompleto && senador.nomeCompleto !== senador.nome && (
              <p className="text-xs text-muted-foreground mt-1">{senador.nomeCompleto}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
            <TabsTrigger value="votacoes">Votos</TabsTrigger>
            <TabsTrigger value="discursos">Discursos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                {senador.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${senador.email}`} className="text-sm text-amber-400">
                      {senador.email}
                    </a>
                  </div>
                )}
                
                {senador.dataNascimento && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      Nascimento: {new Date(senador.dataNascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                {senador.naturalidade && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {senador.naturalidade} - {senador.ufNaturalidade}
                    </span>
                  </div>
                )}

                {senador.paginaWeb && (
                  <a
                    href={senador.paginaWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-amber-400 hover:text-amber-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">Página oficial</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {senador.profissoes?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2">Profissões</h3>
                  <div className="flex flex-wrap gap-2">
                    {senador.profissoes.map((p: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-muted rounded text-xs">
                        {p.NomeProfissao || p}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comissoes" className="space-y-3 mt-4">
            {comissoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma comissão encontrada
              </p>
            ) : (
              comissoes.map((comissao, index) => (
                <ComissaoSenadoCard key={comissao.codigo || index} comissao={comissao} index={index} />
              ))
            )}
          </TabsContent>

          <TabsContent value="votacoes" className="space-y-3 mt-4">
            {votacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma votação encontrada
              </p>
            ) : (
              votacoes.slice(0, 20).map((votacao, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center gap-2">
                    <Vote className={`w-4 h-4 ${
                      votacao.voto === 'Sim' ? 'text-green-400' : 
                      votacao.voto === 'Não' ? 'text-red-400' : 'text-muted-foreground'
                    }`} />
                    <span className="text-xs font-medium">{votacao.voto}</span>
                    {votacao.materia && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                        {votacao.materia.sigla} {votacao.materia.numero}/{votacao.materia.ano}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {votacao.descricaoVotacao}
                  </p>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="discursos" className="space-y-3 mt-4">
            {discursos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum discurso encontrado
              </p>
            ) : (
              discursos.slice(0, 20).map((discurso, index) => (
                <DiscursoCard key={discurso.codigo || index} discurso={discurso} index={index} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SenadoSenadorDetalhes;
