import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Users, Calendar, GraduationCap, Briefcase, 
  BookOpen, Lightbulb, ExternalLink, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Curiosidade {
  titulo: string;
  descricao: string;
  categoria: string;
}

interface Membro {
  id: string;
  nome: string;
  nome_completo?: string | null;
  cargo?: string | null;
  foto_url?: string | null;
  biografia?: string | null;
  formacao?: string | null;
  carreira?: string | null;
  data_posse?: string | null;
  indicado_por?: string | null;
  decisoes_importantes?: string[] | null;
  curiosidades?: Curiosidade[] | null;
  links_externos?: { wikipedia?: string } | null;
}

interface Obra {
  id: string;
  titulo: string;
  ano?: number | null;
  editora?: string | null;
  descricao?: string | null;
  capa_url?: string | null;
  link_compra?: string | null;
  tipo_obra?: string | null;
  fonte?: string | null;
}

const SeAprofundeMembro = () => {
  const { instituicao, membroId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [membro, setMembro] = useState<Membro | null>(location.state?.membro || null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [curiosidades, setCuriosidades] = useState<Curiosidade[]>([]);
  const [loading, setLoading] = useState(!location.state?.membro);
  const [loadingObras, setLoadingObras] = useState(true);
  const [loadingCuriosidades, setLoadingCuriosidades] = useState(false);
  const [activeTab, setActiveTab] = useState("biografia");
  const [buscandoObras, setBuscandoObras] = useState(false);
  const [buscandoCuriosidades, setBuscandoCuriosidades] = useState(false);

  useEffect(() => {
    if (!membro && membroId) {
      fetchMembro();
    }
    if (membroId) {
      fetchObras();
    }
  }, [membroId, membro]);

  // Sincronizar curiosidades do membro quando carregado
  useEffect(() => {
    if (membro?.curiosidades && membro.curiosidades.length > 0 && curiosidades.length === 0) {
      setCuriosidades(membro.curiosidades);
    }
  }, [membro?.curiosidades]);

  // Buscar curiosidades quando aba for selecionada (apenas para STF e se não tem no membro)
  useEffect(() => {
    if (activeTab === 'curiosidades' && instituicao === 'stf' && membroId && curiosidades.length === 0 && !buscandoCuriosidades && !membro?.curiosidades?.length) {
      fetchCuriosidades();
    }
  }, [activeTab, instituicao, membroId, membro?.curiosidades]);

  const fetchMembro = async () => {
    try {
      setLoading(true);
      
      if (instituicao === 'stf') {
        const { data, error } = await supabase
          .from("tres_poderes_ministros_stf")
          .select("*")
          .eq("id", membroId)
          .single();

        if (error) throw error;
        
        if (data) {
          const curiosidadesData = Array.isArray(data.curiosidades) ? (data.curiosidades as unknown as Curiosidade[]) : null;
          setMembro({
            id: data.id,
            nome: data.nome,
            nome_completo: data.nome_completo,
            foto_url: data.foto_wikipedia || data.foto_url,
            biografia: data.biografia,
            formacao: data.formacao,
            carreira: data.carreira,
            data_posse: data.data_posse,
            indicado_por: data.indicado_por,
            cargo: 'Ministro do STF',
            decisoes_importantes: data.decisoes_importantes,
            curiosidades: curiosidadesData,
            links_externos: null
          });
          if (curiosidadesData && curiosidadesData.length > 0) {
            setCuriosidades(curiosidadesData);
          }
        }
      } else {
        const { data, error } = await supabase
          .from("aprofundamento_membros")
          .select("*")
          .eq("id", membroId)
          .single();

        if (error) throw error;
        if (data) {
          const linksExternos = data.links_externos as { wikipedia?: string } | null;
          setMembro({
            ...data,
            links_externos: linksExternos
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar membro:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuriosidades = async () => {
    if (!membroId || instituicao !== 'stf') return;
    
    try {
      setBuscandoCuriosidades(true);
      setLoadingCuriosidades(true);
      
      // Primeiro verificar se já tem no banco
      const { data: ministro } = await supabase
        .from("tres_poderes_ministros_stf")
        .select("curiosidades, curiosidades_atualizadas_em")
        .eq("id", membroId)
        .single();

      if (ministro?.curiosidades && Array.isArray(ministro.curiosidades) && ministro.curiosidades.length > 0) {
        setCuriosidades(ministro.curiosidades as unknown as Curiosidade[]);
        setLoadingCuriosidades(false);
        setBuscandoCuriosidades(false);
        return;
      }

      // Buscar via edge function
      console.log('Buscando curiosidades do ministro via edge function...');
      
      const { data: resultado, error: funcError } = await supabase.functions.invoke(
        'buscar-curiosidades-ministro',
        { body: { membro_id: membroId } }
      );

      if (funcError) {
        console.error('Erro ao buscar curiosidades:', funcError);
      } else if (resultado?.curiosidades) {
        setCuriosidades(resultado.curiosidades);
      }
    } catch (error) {
      console.error("Erro ao buscar curiosidades:", error);
    } finally {
      setLoadingCuriosidades(false);
      setBuscandoCuriosidades(false);
    }
  };

  const fetchObras = async () => {
    try {
      setLoadingObras(true);
      
      // Primeiro tenta buscar do banco
      const { data, error } = await supabase
        .from("aprofundamento_obras")
        .select("*")
        .eq("membro_id", membroId)
        .order("ano", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setObras(data);
        setLoadingObras(false);
        return;
      }

      // Se não tem obras, buscar via edge function apropriada
      if (!buscandoObras) {
        setBuscandoObras(true);
        
        if (instituicao === 'stf') {
          // Buscar obras da biblioteca do STF
          console.log('Buscando obras do ministro via edge function...');
          
          const { data: resultado, error: funcError } = await supabase.functions.invoke(
            'buscar-obras-ministro-stf',
            { body: { membro_id: membroId } }
          );

          if (funcError) {
            console.error('Erro ao buscar obras STF:', funcError);
          } else {
            console.log('Resultado da busca STF:', resultado);
          }
        } else if (instituicao === 'camara' || instituicao === 'senado') {
          // Buscar obras do Lattes para deputados e senadores
          console.log(`Buscando obras no Lattes para ${instituicao}...`);
          
          const { data: resultado, error: funcError } = await supabase.functions.invoke(
            'buscar-obras-lattes',
            { 
              body: { 
                nome: membro?.nome || '', 
                tipo: instituicao === 'camara' ? 'deputado' : 'senador',
                membro_id: membroId 
              } 
            }
          );

          if (funcError) {
            console.error('Erro ao buscar obras Lattes:', funcError);
          } else {
            console.log('Resultado da busca Lattes:', resultado);
          }
        }

        // Re-buscar do banco após popular
        const { data: obrasAtualizadas } = await supabase
          .from("aprofundamento_obras")
          .select("*")
          .eq("membro_id", membroId)
          .order("ano", { ascending: false });
        
        setObras(obrasAtualizadas || []);
        setBuscandoObras(false);
      } else {
        setObras([]);
      }
    } catch (error) {
      console.error("Erro ao buscar obras:", error);
    } finally {
      setLoadingObras(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!membro) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Membro não encontrado</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/se-aprofunde/${instituicao}`)}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center text-destructive-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-1 text-foreground">
            {membro.nome}
          </h1>
          <p className="text-xs text-muted-foreground">{membro.cargo}</p>
        </div>
        {membro.links_externos?.wikipedia && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(membro.links_externos?.wikipedia, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-center px-4 py-2 h-auto bg-transparent border-b rounded-none gap-1">
          <TabsTrigger value="biografia" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 rounded-full justify-center">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Biografia
          </TabsTrigger>
          <TabsTrigger value="curiosidades" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 rounded-full justify-center">
            <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
            Curiosidades
          </TabsTrigger>
          <TabsTrigger value="obras" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5 rounded-full justify-center">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Obras
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 h-0">
          <TabsContent value="biografia" className="mt-0 p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header com foto */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {membro.foto_url ? (
                    <img 
                      src={membro.foto_url} 
                      alt={membro.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">
                    {membro.nome_completo || membro.nome}
                  </h2>
                  {membro.cargo && (
                    <Badge variant="secondary" className="mt-1">
                      {membro.cargo}
                    </Badge>
                  )}
                  {membro.indicado_por && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Indicado por: <span className="font-medium">{membro.indicado_por}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Data de posse */}
              {membro.data_posse && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Posse em {formatDate(membro.data_posse)}
                  </span>
                </div>
              )}

              {/* Biografia */}
              {membro.biografia && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Biografia
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {membro.biografia}
                  </p>
                </div>
              )}

              {/* Formação */}
              {membro.formacao && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Formação Acadêmica
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {membro.formacao}
                  </p>
                </div>
              )}

              {/* Carreira */}
              {membro.carreira && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Carreira
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {membro.carreira}
                  </p>
                </div>
              )}

              {/* Decisões importantes */}
              {membro.decisoes_importantes && membro.decisoes_importantes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    Decisões Importantes
                  </h3>
                  <ul className="space-y-2">
                    {membro.decisoes_importantes.map((decisao, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{decisao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="curiosidades" className="mt-0 p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Curiosidades
              </h2>
              
              {loadingCuriosidades ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Buscando curiosidades na Wikipedia...
                  </p>
                </div>
              ) : curiosidades.length > 0 ? (
                <div className="space-y-3">
                  {curiosidades.map((curiosidade, idx) => (
                    <Card key={idx} className="border-border/50 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] flex-shrink-0 ${
                              curiosidade.categoria === 'vida_pessoal' ? 'border-pink-500 text-pink-500' :
                              curiosidade.categoria === 'carreira' ? 'border-blue-500 text-blue-500' :
                              curiosidade.categoria === 'formacao' ? 'border-green-500 text-green-500' :
                              curiosidade.categoria === 'premios' ? 'border-yellow-500 text-yellow-500' :
                              curiosidade.categoria === 'frases' ? 'border-purple-500 text-purple-500' :
                              curiosidade.categoria === 'polemicas' ? 'border-red-500 text-red-500' :
                              'border-muted-foreground'
                            }`}
                          >
                            {curiosidade.categoria?.replace('_', ' ') || 'geral'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mt-2">
                          {curiosidade.titulo}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {curiosidade.descricao}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {instituicao === 'stf' ? 'Clique para buscar curiosidades' : 'Nenhuma curiosidade cadastrada ainda'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {instituicao === 'stf' ? 'Usando Wikipedia e IA' : 'As curiosidades serão adicionadas em breve'}
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="obras" className="mt-0 p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Obras Publicadas
              </h2>

              {loadingObras ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : obras.length > 0 ? (
                <div className="space-y-3">
                  {obras.map((obra) => (
                    <Card 
                      key={obra.id} 
                      className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => obra.link_compra && window.open(obra.link_compra, '_blank')}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {obra.capa_url && (
                            <div className="w-16 h-24 rounded overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={obra.capa_url} 
                                alt={obra.titulo}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                              {obra.titulo}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {obra.ano && (
                                <Badge variant="outline" className="text-xs">
                                  {obra.ano}
                                </Badge>
                              )}
                              {obra.editora && (
                                <Badge variant="secondary" className="text-xs">
                                  {obra.editora}
                                </Badge>
                              )}
                            </div>
                            {obra.descricao && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {obra.descricao}
                              </p>
                            )}
                          </div>
                          {obra.link_compra && (
                            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhuma obra cadastrada ainda
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    As obras publicadas serão adicionadas em breve
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default SeAprofundeMembro;
