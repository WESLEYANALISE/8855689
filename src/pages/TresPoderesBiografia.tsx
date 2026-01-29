import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, User, Calendar, Building, Award, BookOpen, Sparkles, RefreshCw, FileText, Vote, Briefcase, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
type TipoPolitico = 'presidente' | 'deputado' | 'senador' | 'ministro_stf';

const TresPoderesBiografia = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [biografia, setBiografia] = useState<any>(null);
  const [proposicoes, setProposicoes] = useState<any[]>([]);
  const [loadingProposicoes, setLoadingProposicoes] = useState(false);
  const [activeTab, setActiveTab] = useState('biografia');

  // Determinar tipo baseado na URL
  const getTipo = (): TipoPolitico => {
    if (location.pathname.includes('/executivo/presidente')) return 'presidente';
    if (location.pathname.includes('/legislativo/deputado')) return 'deputado';
    if (location.pathname.includes('/legislativo/senador')) return 'senador';
    if (location.pathname.includes('/judiciario/ministro')) return 'ministro_stf';
    return 'presidente';
  };

  const tipo = getTipo();
  const politico = location.state?.presidente || location.state?.deputado || location.state?.senador || location.state?.ministro;

  const corTema = {
    presidente: { bg: 'from-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
    deputado: { bg: 'from-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    senador: { bg: 'from-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    ministro_stf: { bg: 'from-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' }
  };

  const cores = corTema[tipo];

  // Buscar biografia salva do banco de dados
  useEffect(() => {
    const fetchBiografia = async () => {
      setIsLoading(true);
      try {
        const id = params.id || params.nome;
        
        if (tipo === 'deputado' && id) {
          // Buscar biografia salva do deputado
          const { data, error } = await supabase
            .from('tres_poderes_deputados_bio')
            .select('*')
            .eq('deputado_id', parseInt(id))
            .maybeSingle();
          
          if (data) {
            // Parsear biografia se vier como JSON string
            let biografiaText = data.biografia;
            if (biografiaText && biografiaText.startsWith('```json')) {
              try {
                const jsonStr = biografiaText.replace(/```json\n?/, '').replace(/```$/, '');
                const parsed = JSON.parse(jsonStr);
                biografiaText = parsed.biografia;
                setBiografia({
                  ...politico,
                  ...data,
                  biografia: biografiaText,
                  formacao: parsed.formacao || data.formacao,
                  carreira_politica: parsed.carreira_politica || data.carreira_politica,
                  realizacoes: parsed.realizacoes || data.projetos_destaque,
                  legado: parsed.legado
                });
              } catch {
                setBiografia({ ...politico, ...data });
              }
            } else {
              setBiografia({ ...politico, ...data });
            }
          } else if (politico) {
            setBiografia(politico);
          }
        } else if (tipo === 'senador' && id) {
          const { data, error } = await supabase
            .from('tres_poderes_senadores_bio')
            .select('*')
            .eq('senador_codigo', parseInt(id))
            .maybeSingle();
          
          if (data) {
            let biografiaText = data.biografia;
            if (biografiaText && biografiaText.startsWith('```json')) {
              try {
                const jsonStr = biografiaText.replace(/```json\n?/, '').replace(/```$/, '');
                const parsed = JSON.parse(jsonStr);
                biografiaText = parsed.biografia;
                setBiografia({
                  ...politico,
                  ...data,
                  biografia: biografiaText,
                  formacao: parsed.formacao || data.formacao,
                  carreira_politica: parsed.carreira_politica || data.carreira_politica,
                  realizacoes: parsed.realizacoes || data.projetos_destaque,
                  legado: parsed.legado
                });
              } catch {
                setBiografia({ ...politico, ...data });
              }
            } else {
              setBiografia({ ...politico, ...data });
            }
          } else if (politico) {
            setBiografia(politico);
          }
        } else if (politico) {
          setBiografia(politico);
        }
      } catch (error) {
        console.error('Error fetching biography:', error);
        if (politico) {
          setBiografia(politico);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBiografia();
  }, [params.id, params.nome, tipo]);

  const gerarBiografia = async () => {
    if (!politico && !biografia) return;
    
    const dadosPolitico = politico || biografia;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-biografia-politico', {
        body: {
          nome: dadosPolitico.nome || dadosPolitico.nome_completo,
          tipo,
          id: dadosPolitico.id || dadosPolitico.codigo || dadosPolitico.deputado_id || dadosPolitico.senador_codigo || params.id,
          partido: dadosPolitico.partido || dadosPolitico.siglaPartido,
          uf: dadosPolitico.uf || dadosPolitico.siglaUf
        }
      });

      if (error) throw error;

      setBiografia(prev => ({
        ...prev,
        ...data,
        foto_wikipedia: data.foto_wikipedia || prev?.foto_wikipedia
      }));
      
      toast.success('Biografia gerada com sucesso!');
    } catch (error) {
      console.error('Error generating biography:', error);
      toast.error('Erro ao gerar biografia');
    } finally {
      setIsGenerating(false);
    }
  };

  // Buscar proposições do deputado
  const fetchProposicoes = async () => {
    if (tipo !== 'deputado' || !params.id) return;
    
    setLoadingProposicoes(true);
    try {
      // Buscar proposições do deputado na API da Câmara
      const response = await fetch(
        `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${params.id}&ordem=DESC&ordenarPor=id&itens=15`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProposicoes(data.dados || []);
      } else {
        console.error('Erro na API:', response.status);
        // Tentar buscar sem ordenação
        const response2 = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${params.id}&itens=15`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (response2.ok) {
          const data = await response2.json();
          setProposicoes(data.dados || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar proposições:', error);
    } finally {
      setLoadingProposicoes(false);
    }
  };

  // Carregar proposições quando mudar para aba de projetos
  useEffect(() => {
    if (activeTab === 'projetos' && proposicoes.length === 0) {
      fetchProposicoes();
    }
  }, [activeTab]);

  const getNome = () => {
    return biografia?.nome || politico?.nome || politico?.nome_completo || params.nome || params.id || 'Político';
  };

  const getFoto = () => {
    // Para deputados e senadores, priorizar foto da API (urlFoto ou foto)
    // Para presidentes e ministros STF, usar foto do Wikipedia
    if (tipo === 'deputado' || tipo === 'senador') {
      return politico?.urlFoto || politico?.foto || biografia?.foto_url || politico?.foto_url || biografia?.foto_wikipedia || politico?.foto_wikipedia;
    }
    // Para presidentes e ministros STF
    return biografia?.foto_wikipedia || politico?.foto_wikipedia || politico?.foto_url || politico?.urlFoto || politico?.foto;
  };

  const getCargo = () => {
    switch (tipo) {
      case 'presidente': return 'Presidente da República';
      case 'deputado': return 'Deputado Federal';
      case 'senador': return 'Senador da República';
      case 'ministro_stf': return 'Ministro do STF';
      default: return '';
    }
  };

  const getPartido = () => {
    return biografia?.partido || politico?.partido || politico?.siglaPartido;
  };

  const getUf = () => {
    return biografia?.uf || politico?.uf || politico?.siglaUf;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <Loader2 className={`w-8 h-8 ${cores.text} animate-spin`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 relative overflow-hidden`}>
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br ${cores.bg} to-transparent blur-3xl`}
        />
      </div>

      <div className="relative z-10 px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={gerarBiografia}
            disabled={isGenerating}
            className="text-white/70 hover:text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : biografia?.biografia ? (
              <RefreshCw className="w-4 h-4 mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Gerando...' : biografia?.biografia ? 'Atualizar' : 'Gerar Biografia'}
          </Button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border} mb-6`}
        >
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-800">
                {getFoto() ? (
                  <img
                    src={getFoto()}
                    alt={getNome()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-neutral-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {getNome()}
              </h1>
              <p className={`${cores.text} font-medium mb-2`}>{getCargo()}</p>
              
              <div className="flex flex-wrap gap-2">
                {getPartido() && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${cores.badge}`}>
                    {getPartido()}
                  </span>
                )}
                {getUf() && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                    {getUf()}
                  </span>
                )}
                {(politico?.periodo_inicio || politico?.data_posse) && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-500/20 text-neutral-300">
                    {politico.periodo_fim 
                      ? `${politico.periodo_inicio} - ${politico.periodo_fim}`
                      : politico.periodo_inicio || politico.data_posse
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs for Deputies/Senators */}
        {(tipo === 'deputado' || tipo === 'senador') ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-1 mb-4">
              <TabsTrigger 
                value="biografia" 
                className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Biografia
              </TabsTrigger>
              <TabsTrigger 
                value="projetos" 
                className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Projetos
              </TabsTrigger>
              <TabsTrigger 
                value="atividade" 
                className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <Vote className="w-4 h-4 mr-2" />
                Atividade
              </TabsTrigger>
            </TabsList>

            {/* Tab: Biografia */}
            <TabsContent value="biografia" className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className={`w-8 h-8 ${cores.text} animate-spin mb-4`} />
                  <p className="text-neutral-400">Gerando biografia com IA...</p>
                </div>
              ) : (
                <>
                  {biografia?.biografia && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className={`w-5 h-5 ${cores.text}`} />
                        <h2 className="font-semibold text-white">Biografia</h2>
                      </div>
                      <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {biografia.biografia}
                      </p>
                    </motion.div>
                  )}

                  {biografia?.formacao && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Award className={`w-5 h-5 ${cores.text}`} />
                        <h2 className="font-semibold text-white">Formação</h2>
                      </div>
                      <p className="text-neutral-300 text-sm">{biografia.formacao}</p>
                    </motion.div>
                  )}

                  {(biografia?.carreira_politica || biografia?.carreira) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Building className={`w-5 h-5 ${cores.text}`} />
                        <h2 className="font-semibold text-white">Carreira</h2>
                      </div>
                      <div className="text-neutral-300 text-sm whitespace-pre-wrap">
                        {Array.isArray(biografia.carreira_politica) 
                          ? biografia.carreira_politica.map((item: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 mb-1">
                                <span className={`${cores.text}`}>•</span>
                                {item}
                              </div>
                            ))
                          : biografia.carreira_politica || biografia.carreira
                        }
                      </div>
                    </motion.div>
                  )}

                  {biografia?.realizacoes?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <h2 className="font-semibold text-white mb-3">Principais Realizações</h2>
                      <ul className="space-y-2">
                        {biografia.realizacoes.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                            <span className={`${cores.text} mt-1`}>•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {biografia?.legado && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <h2 className="font-semibold text-white mb-3">Legado</h2>
                      <p className="text-neutral-300 text-sm">{biografia.legado}</p>
                    </motion.div>
                  )}

                  {!biografia?.biografia && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <Sparkles className={`w-12 h-12 ${cores.text} mx-auto mb-4 opacity-50`} />
                      <p className="text-neutral-400 mb-4">
                        Clique em "Gerar Biografia" para criar uma biografia completa.
                      </p>
                      <Button
                        onClick={gerarBiografia}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Biografia com IA
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab: Projetos */}
            <TabsContent value="projetos" className="space-y-4">
              {loadingProposicoes ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className={`w-8 h-8 ${cores.text} animate-spin mb-4`} />
                  <p className="text-neutral-400">Carregando projetos...</p>
                </div>
              ) : proposicoes.length > 0 ? (
                <>
                  <div className="text-sm text-neutral-400 mb-2">
                    Últimos {proposicoes.length} projetos apresentados
                  </div>
                  {proposicoes.map((prop, index) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${cores.badge}`}>
                          {prop.siglaTipo} {prop.numero}/{prop.ano}
                        </span>
                        {prop.dataApresentacao && (
                          <span className="text-xs text-neutral-500">
                            {new Date(prop.dataApresentacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3">
                        {prop.ementa}
                      </p>
                      {prop.uri && (
                        <a
                          href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${prop.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs ${cores.text} hover:underline mt-2 inline-block`}
                        >
                          Ver na Câmara →
                        </a>
                      )}
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">Nenhum projeto encontrado</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Atividade */}
            <TabsContent value="atividade" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Vote className={`w-5 h-5 ${cores.text}`} />
                  <h2 className="font-semibold text-white">Votações</h2>
                </div>
                <p className="text-neutral-400 text-sm">
                  Informações sobre votações serão adicionadas em breve.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className={`w-5 h-5 ${cores.text}`} />
                  <h2 className="font-semibold text-white">Comissões</h2>
                </div>
                <p className="text-neutral-400 text-sm">
                  Participação em comissões será adicionada em breve.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Scale className={`w-5 h-5 ${cores.text}`} />
                  <h2 className="font-semibold text-white">Discursos</h2>
                </div>
                <p className="text-neutral-400 text-sm">
                  Discursos e pronunciamentos serão adicionados em breve.
                </p>
              </motion.div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Original content for presidents and STF ministers */
          <>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 ${cores.text} animate-spin mb-4`} />
                <p className="text-neutral-400">Gerando biografia com IA...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {biografia?.biografia && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className={`w-5 h-5 ${cores.text}`} />
                      <h2 className="font-semibold text-white">Biografia</h2>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {biografia.biografia}
                    </p>
                  </motion.div>
                )}

                {biografia?.formacao && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Award className={`w-5 h-5 ${cores.text}`} />
                      <h2 className="font-semibold text-white">Formação</h2>
                    </div>
                    <p className="text-neutral-300 text-sm">{biografia.formacao}</p>
                  </motion.div>
                )}

                {(biografia?.carreira_politica || biografia?.carreira) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Building className={`w-5 h-5 ${cores.text}`} />
                      <h2 className="font-semibold text-white">Carreira</h2>
                    </div>
                    <div className="text-neutral-300 text-sm whitespace-pre-wrap">
                      {Array.isArray(biografia.carreira_politica) 
                        ? biografia.carreira_politica.map((item: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 mb-1">
                              <span className={`${cores.text}`}>•</span>
                              {item}
                            </div>
                          ))
                        : biografia.carreira_politica || biografia.carreira
                      }
                    </div>
                  </motion.div>
                )}

                {biografia?.realizacoes?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                  >
                    <h2 className="font-semibold text-white mb-3">Principais Realizações</h2>
                    <ul className="space-y-2">
                      {biografia.realizacoes.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                          <span className={`${cores.text} mt-1`}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {biografia?.legado && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cores.bg} to-transparent border ${cores.border}`}
                  >
                    <h2 className="font-semibold text-white mb-3">Legado</h2>
                    <p className="text-neutral-300 text-sm">{biografia.legado}</p>
                  </motion.div>
                )}

                {!biografia?.biografia && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Sparkles className={`w-12 h-12 ${cores.text} mx-auto mb-4 opacity-50`} />
                    <p className="text-neutral-400 mb-4">
                      Clique em "Gerar Biografia" para criar uma biografia completa usando IA e dados da Wikipedia.
                    </p>
                    <Button
                      onClick={gerarBiografia}
                      disabled={isGenerating}
                      className={`bg-gradient-to-r ${tipo === 'presidente' ? 'from-amber-500 to-amber-600' : 'from-purple-500 to-purple-600'}`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Biografia com IA
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TresPoderesBiografia;
