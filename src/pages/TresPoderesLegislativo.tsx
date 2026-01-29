import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Users, BookOpen, Building, Loader2, RefreshCw, Search, CheckCircle, PlayCircle, TrendingUp, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PoliticoBiografiaCard } from "@/components/tres-poderes/PoliticoBiografiaCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Deputado {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  temBiografia?: boolean;
}

interface Senador {
  codigo: number;
  nome: string;
  partido: string;
  uf: string;
  foto?: string;
  temBiografia?: boolean;
}

// Deputados em ascensão (mais populares/midiáticos)
const DEPUTADOS_EM_ASCENSAO = [
  'Nikolas Ferreira',
  'Guilherme Boulos',
  'Kim Kataguiri',
  'Erika Hilton',
  'Marcel Van Hattem',
  'Tabata Amaral',
  'Eduardo Bolsonaro',
  'Sâmia Bomfim',
  'Carla Zambelli',
  'André Janones'
];

const TresPoderesLegislativo = () => {
  const navigate = useNavigate();
  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [senadores, setSenadores] = useState<Senador[]>([]);
  const [isLoadingDeputados, setIsLoadingDeputados] = useState(false);
  const [isLoadingSenadores, setIsLoadingSenadores] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("camara");
  const [deputadosComBio, setDeputadosComBio] = useState<Set<number>>(new Set());
  const [senadoresComBio, setSenadoresComBio] = useState<Set<number>>(new Set());
  const [isGeneratingLote, setIsGeneratingLote] = useState(false);
  const [camaraSubTab, setCamaraSubTab] = useState<"todos" | "ascensao">("todos");

  useEffect(() => {
    loadBackground();
  }, []);

  useEffect(() => {
    if (activeTab === "camara" && deputados.length === 0) {
      loadDeputados();
    } else if (activeTab === "senado" && senadores.length === 0) {
      loadSenadores();
    }
  }, [activeTab]);

  const loadBackground = async () => {
    try {
      const { data } = await supabase
        .from('tres_poderes_config')
        .select('background_url')
        .eq('page_key', 'legislativo')
        .single();

      if (data?.background_url) {
        setBackgroundUrl(data.background_url);
      }
    } catch (error) {
      console.log('No background found');
    }
  };

  const loadDeputados = async () => {
    setIsLoadingDeputados(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-deputados', {
        body: {}
      });

      if (error) throw error;
      setDeputados(data?.deputados || []);
      
      // Buscar quais deputados já têm biografia
      loadDeputadosComBio();
    } catch (error) {
      console.error('Error loading deputados:', error);
      toast.error('Erro ao carregar deputados');
    } finally {
      setIsLoadingDeputados(false);
    }
  };

  const loadDeputadosComBio = async () => {
    try {
      const { data } = await supabase
        .from('tres_poderes_deputados_bio')
        .select('deputado_id');
      
      if (data) {
        setDeputadosComBio(new Set(data.map(d => d.deputado_id)));
      }
    } catch (error) {
      console.error('Error loading deputados com bio:', error);
    }
  };

  const loadSenadoresComBio = async () => {
    try {
      const { data } = await supabase
        .from('tres_poderes_senadores_bio')
        .select('senador_codigo');
      
      if (data) {
        setSenadoresComBio(new Set(data.map(s => s.senador_codigo)));
      }
    } catch (error) {
      console.error('Error loading senadores com bio:', error);
    }
  };

  const loadSenadores = async () => {
    setIsLoadingSenadores(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-senadores', {
        body: {}
      });

      if (error) throw error;
      setSenadores(data?.senadores || []);
      loadSenadoresComBio();
    } catch (error) {
      console.error('Error loading senadores:', error);
      toast.error('Erro ao carregar senadores');
    } finally {
      setIsLoadingSenadores(false);
    }
  };

  // Iniciar geração em lote de biografias
  const iniciarGeracaoLote = async (deputadoInicial: Deputado) => {
    const indiceInicial = deputados.findIndex(d => d.id === deputadoInicial.id);
    const deputadosParaProcessar = deputados.slice(indiceInicial);
    
    setIsGeneratingLote(true);
    try {
      const { error } = await supabase.functions.invoke('gerar-biografias-lote', {
        body: {
          deputadoInicial,
          deputados: deputadosParaProcessar,
          tipo: 'deputado'
        }
      });

      if (error) throw error;
      
      toast.success(`Geração em lote iniciada! ${deputadosParaProcessar.length} deputados serão processados em background.`);
    } catch (error) {
      console.error('Erro ao iniciar geração em lote:', error);
      toast.error('Erro ao iniciar geração em lote');
    } finally {
      setIsGeneratingLote(false);
    }
  };

  const generateBackground = async () => {
    setIsGeneratingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-background-tres-poderes', {
        body: { pageKey: 'legislativo' }
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setBackgroundUrl(data.imageUrl);
        toast.success('Imagem gerada!');
      }
    } catch (error) {
      toast.error('Erro ao gerar imagem');
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const filteredDeputados = deputados.filter(d => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.siglaPartido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.siglaUf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Deputados em ascensão (filtrados da lista principal)
  const deputadosEmAscensao = deputados.filter(d => 
    DEPUTADOS_EM_ASCENSAO.some(nome => 
      d.nome.toLowerCase().includes(nome.toLowerCase()) ||
      nome.toLowerCase().includes(d.nome.split(' ')[0].toLowerCase())
    )
  );

  const filteredSenadores = senadores.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.partido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.uf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-emerald-950/20 to-neutral-950 relative overflow-hidden">
      {/* Background */}
      {backgroundUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          className="absolute inset-0 z-0"
        >
          <img src={backgroundUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/50 to-neutral-950" />
        </motion.div>
      )}

      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-60 md:w-80 h-60 md:h-80 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 px-3 md:px-4 py-4 md:py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 md:mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tres-poderes')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={generateBackground}
            disabled={isGeneratingBg}
            className="text-white/70 hover:text-white text-xs md:text-sm"
          >
            {isGeneratingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center justify-center p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 mb-3 md:mb-4">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            Poder Legislativo
          </h1>
          <p className="text-neutral-400 text-sm md:text-base px-4">
            Responsável por criar e aprovar as leis
          </p>
          <div className="h-1 w-24 md:w-32 mx-auto mt-3 md:mt-4 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800/50 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="camara" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs md:text-sm py-2">
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Câmara
            </TabsTrigger>
            <TabsTrigger value="senado" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs md:text-sm py-2">
              <Building className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Senado
            </TabsTrigger>
            <TabsTrigger value="funcoes" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs md:text-sm py-2">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Funções
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          {(activeTab === "camara" || activeTab === "senado") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative mb-3 md:mb-4"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar nome, partido ou UF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800/50 border-emerald-500/20 text-white placeholder:text-neutral-500 text-sm"
              />
            </motion.div>
          )}

          <TabsContent value="camara">
            {isLoadingDeputados ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Sub-tabs: Deputados / Em Ascensão */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={camaraSubTab === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCamaraSubTab("todos")}
                    className={camaraSubTab === "todos" 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                    }
                  >
                    <List className="w-4 h-4 mr-1.5" />
                    Deputados
                  </Button>
                  <Button
                    variant={camaraSubTab === "ascensao" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCamaraSubTab("ascensao")}
                    className={camaraSubTab === "ascensao" 
                      ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white" 
                      : "border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
                    }
                  >
                    <TrendingUp className="w-4 h-4 mr-1.5" />
                    Em Ascensão
                  </Button>
                </div>

                {camaraSubTab === "ascensao" ? (
                  <>
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <p className="text-neutral-400 text-xs md:text-sm">
                        <span className="text-orange-400 font-medium">{deputadosEmAscensao.length} deputados em alta</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {deputadosEmAscensao.map((deputado, index) => (
                        <div key={deputado.id} className="relative">
                          <PoliticoBiografiaCard
                            nome={deputado.nome}
                            cargo="Deputado Federal"
                            partido={deputado.siglaPartido}
                            uf={deputado.siglaUf}
                            fotoUrl={deputado.urlFoto}
                            onClick={() => navigate(`/tres-poderes/legislativo/deputado/${deputado.id}`, { state: { deputado } })}
                            index={index}
                            corTema="emerald"
                          />
                          {deputadosComBio.has(deputado.id) && (
                            <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {deputadosEmAscensao.length === 0 && (
                      <p className="text-center text-neutral-400 py-8 text-sm">
                        Carregue os deputados para ver os mais populares
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <p className="text-neutral-400 text-xs md:text-sm">
                        {filteredDeputados.length} deputados
                        {deputadosComBio.size > 0 && (
                          <span className="ml-2 text-emerald-400">
                            ({deputadosComBio.size} com biografia)
                          </span>
                        )}
                      </p>
                      {isGeneratingLote && (
                        <span className="flex items-center gap-2 text-xs text-emerald-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Gerando em lote...
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {filteredDeputados.map((deputado, index) => (
                        <div key={deputado.id} className="relative">
                          <PoliticoBiografiaCard
                            nome={deputado.nome}
                            cargo="Deputado Federal"
                            partido={deputado.siglaPartido}
                            uf={deputado.siglaUf}
                            fotoUrl={deputado.urlFoto}
                            onClick={() => navigate(`/tres-poderes/legislativo/deputado/${deputado.id}`, { state: { deputado } })}
                            index={index < 20 ? index : 0}
                            corTema="emerald"
                          />
                          {/* Checkmark para quem tem biografia */}
                          {deputadosComBio.has(deputado.id) && (
                            <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {/* Botão para iniciar geração em lote */}
                          {!deputadosComBio.has(deputado.id) && !isGeneratingLote && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                iniciarGeracaoLote(deputado);
                              }}
                              className="absolute top-2 right-2 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-full p-1 transition-colors"
                              title="Gerar biografia deste e dos seguintes"
                            >
                              <PlayCircle className="w-4 h-4 text-emerald-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="senado">
            {isLoadingSenadores ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-neutral-400 text-sm mb-4">
                  {filteredSenadores.length} senadores encontrados
                  {senadoresComBio.size > 0 && (
                    <span className="ml-2 text-emerald-400">
                      ({senadoresComBio.size} com biografia)
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSenadores.map((senador, index) => (
                    <div key={senador.codigo} className="relative">
                      <PoliticoBiografiaCard
                        nome={senador.nome}
                        cargo="Senador da República"
                        partido={senador.partido}
                        uf={senador.uf}
                        fotoUrl={senador.foto}
                        onClick={() => navigate(`/tres-poderes/legislativo/senador/${senador.codigo}`, { state: { senador } })}
                        index={index}
                        corTema="emerald"
                      />
                      {senadoresComBio.has(senador.codigo) && (
                        <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="funcoes">
            <div className="space-y-4">
              {[
                {
                  titulo: 'Elaboração de Leis',
                  descricao: 'Criar, discutir, votar e aprovar leis que regulam a vida em sociedade, desde a Constituição até leis ordinárias.'
                },
                {
                  titulo: 'Fiscalização',
                  descricao: 'Fiscalizar as ações do Poder Executivo, controlando a aplicação dos recursos públicos e a execução das políticas.'
                },
                {
                  titulo: 'CPIs',
                  descricao: 'Instalar Comissões Parlamentares de Inquérito para investigar fatos determinados de interesse público.'
                },
                {
                  titulo: 'Aprovação de Orçamento',
                  descricao: 'Analisar e aprovar a proposta orçamentária enviada pelo Executivo, definindo as prioridades de gastos.'
                },
                {
                  titulo: 'Autorização para Tratados',
                  descricao: 'Autorizar o Presidente a ratificar tratados e acordos internacionais que envolvam compromissos do país.'
                },
                {
                  titulo: 'Processo de Impeachment',
                  descricao: 'Processar e julgar o Presidente da República, Vice-Presidente e Ministros por crimes de responsabilidade.'
                }
              ].map((funcao, index) => (
                <motion.div
                  key={funcao.titulo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20"
                >
                  <h3 className="font-semibold text-emerald-300 mb-2">{funcao.titulo}</h3>
                  <p className="text-neutral-300 text-sm">{funcao.descricao}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TresPoderesLegislativo;
