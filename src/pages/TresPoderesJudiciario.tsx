import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Users, BookOpen, Building, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PoliticoBiografiaCard } from "@/components/tres-poderes/PoliticoBiografiaCard";
import { TribunalDetailModal } from "@/components/tres-poderes/TribunalDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MinistroSTF {
  id: string;
  nome: string;
  nome_completo: string;
  foto_url: string | null;
  foto_wikipedia: string | null;
  data_posse: string;
  indicado_por: string;
  biografia: string | null;
  ativo: boolean;
  ordem: number;
}

interface TribunalInfo {
  sigla: string;
  nome: string;
  descricao: string;
  wikiTermo: string;
}

interface FuncaoInfo {
  titulo: string;
  descricao: string;
  detalhes: string;
  fundamentoLegal: string;
}

const tribunais: TribunalInfo[] = [
  {
    sigla: 'STJ',
    nome: 'Superior Tribunal de Justiça',
    descricao: 'Responsável por uniformizar a interpretação da lei federal, julgando recursos especiais.',
    wikiTermo: 'Superior Tribunal de Justiça'
  },
  {
    sigla: 'TSE',
    nome: 'Tribunal Superior Eleitoral',
    descricao: 'Órgão máximo da Justiça Eleitoral, responsável por organizar e fiscalizar as eleições.',
    wikiTermo: 'Tribunal Superior Eleitoral'
  },
  {
    sigla: 'TST',
    nome: 'Tribunal Superior do Trabalho',
    descricao: 'Órgão de cúpula da Justiça do Trabalho, julgando recursos em matéria trabalhista.',
    wikiTermo: 'Tribunal Superior do Trabalho'
  },
  {
    sigla: 'STM',
    nome: 'Superior Tribunal Militar',
    descricao: 'Órgão máximo da Justiça Militar, julgando crimes militares.',
    wikiTermo: 'Superior Tribunal Militar'
  },
  {
    sigla: 'CNJ',
    nome: 'Conselho Nacional de Justiça',
    descricao: 'Órgão de controle da atuação administrativa e financeira do Poder Judiciário.',
    wikiTermo: 'Conselho Nacional de Justiça'
  }
];

const funcoes: FuncaoInfo[] = [
  {
    titulo: 'Guarda da Constituição',
    descricao: 'O STF é o guardião da Constituição Federal, julgando ações que questionam a constitucionalidade de leis.',
    detalhes: 'O Supremo Tribunal Federal exerce o controle concentrado de constitucionalidade através de ações como ADI (Ação Direta de Inconstitucionalidade), ADC (Ação Declaratória de Constitucionalidade), ADPF (Arguição de Descumprimento de Preceito Fundamental) e ADO (Ação Direta de Inconstitucionalidade por Omissão). Também realiza controle difuso em casos concretos que chegam via recursos.',
    fundamentoLegal: 'Art. 102 da Constituição Federal: "Compete ao Supremo Tribunal Federal, precipuamente, a guarda da Constituição".'
  },
  {
    titulo: 'Julgamento de Conflitos',
    descricao: 'Resolver conflitos entre cidadãos, empresas e o Estado, aplicando as leis de forma imparcial.',
    detalhes: 'O Poder Judiciário atua como árbitro neutro nos conflitos sociais, garantindo que as disputas sejam resolvidas pacificamente através do processo judicial. Isso inclui conflitos civis (como contratos e responsabilidade), criminais, trabalhistas, eleitorais e administrativos. O princípio da inafastabilidade (art. 5º, XXXV, CF) garante que nenhuma lesão ou ameaça a direito seja excluída da apreciação judicial.',
    fundamentoLegal: 'Art. 5º, XXXV da CF: "A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito".'
  },
  {
    titulo: 'Controle de Constitucionalidade',
    descricao: 'Verificar se leis e atos normativos estão de acordo com a Constituição Federal.',
    detalhes: 'Existem dois sistemas de controle: o concentrado (realizado pelo STF em ações específicas) e o difuso (realizado por qualquer juiz ou tribunal em casos concretos). No controle concentrado, a decisão tem efeito vinculante e eficácia erga omnes. No controle difuso, a decisão vale apenas para o caso julgado, mas pode ser estendida pelo Senado Federal.',
    fundamentoLegal: 'Arts. 102 e 103 da CF tratam do controle concentrado; Art. 97 trata da cláusula de reserva de plenário.'
  },
  {
    titulo: 'Garantia de Direitos',
    descricao: 'Assegurar os direitos fundamentais dos cidadãos, julgando habeas corpus, mandados de segurança e outros remédios constitucionais.',
    detalhes: 'Os remédios constitucionais incluem: Habeas Corpus (proteção à liberdade de locomoção), Mandado de Segurança (proteção a direito líquido e certo), Habeas Data (acesso a informações pessoais), Mandado de Injunção (quando falta norma regulamentadora), Ação Popular (proteção do patrimônio público) e Ação Civil Pública (proteção de interesses difusos e coletivos).',
    fundamentoLegal: 'Art. 5º, incisos LXVIII a LXXIII da Constituição Federal.'
  },
  {
    titulo: 'Uniformização da Jurisprudência',
    descricao: 'Garantir que a interpretação das leis seja uniforme em todo o território nacional.',
    detalhes: 'Os tribunais superiores (STF, STJ, TST, TSE, STM) têm a função de uniformizar a interpretação das normas em suas respectivas áreas. Isso é feito através de súmulas, súmulas vinculantes, recursos repetitivos e incidentes de resolução de demandas repetitivas (IRDR). A uniformização garante segurança jurídica e isonomia na aplicação das leis.',
    fundamentoLegal: 'Art. 926 do CPC: "Os tribunais devem uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente".'
  },
  {
    titulo: 'Foro Privilegiado',
    descricao: 'Julgar autoridades com prerrogativa de foro, como Presidente, parlamentares e ministros de Estado.',
    detalhes: 'O foro por prerrogativa de função garante que certas autoridades sejam julgadas por tribunais superiores, visando proteger o exercício da função pública. O STF julga o Presidente, Vice, parlamentares federais e ministros. O STJ julga governadores e desembargadores. Após decisão do STF em 2018, o foro privilegiado só se aplica a crimes cometidos no exercício do cargo e em razão dele.',
    fundamentoLegal: 'Art. 102, I, "b" e "c" da CF (competência do STF); Art. 105, I, "a" da CF (competência do STJ).'
  }
];

const TresPoderesJudiciario = () => {
  const navigate = useNavigate();
  const [ministros, setMinistros] = useState<MinistroSTF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [selectedTribunal, setSelectedTribunal] = useState<TribunalInfo | null>(null);
  const [expandedFuncoes, setExpandedFuncoes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: minData, error } = await supabase
        .from('tres_poderes_ministros_stf')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setMinistros(minData || []);

      const { data: configData } = await supabase
        .from('tres_poderes_config')
        .select('background_url')
        .eq('page_key', 'judiciario')
        .single();

      if (configData?.background_url) {
        setBackgroundUrl(configData.background_url);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackground = async () => {
    setIsGeneratingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-background-tres-poderes', {
        body: { pageKey: 'judiciario' }
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

  const handleMinistroClick = (ministro: MinistroSTF) => {
    navigate(`/tres-poderes/judiciario/ministro/${encodeURIComponent(ministro.nome)}`, {
      state: { ministro }
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const toggleFuncao = (titulo: string) => {
    setExpandedFuncoes(prev => ({ ...prev, [titulo]: !prev[titulo] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-purple-950/20 to-neutral-950 relative overflow-hidden">
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
          className="absolute -top-40 -right-40 w-60 md:w-80 h-60 md:h-80 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl"
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
          <div className="inline-flex items-center justify-center p-2 md:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 mb-3 md:mb-4">
            <Scale className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            Poder Judiciário
          </h1>
          <p className="text-neutral-400 text-sm md:text-base px-4">
            Responsável por interpretar e aplicar as leis
          </p>
          <div className="h-1 w-24 md:w-32 mx-auto mt-3 md:mt-4 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="stf" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800/50 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="stf" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-xs md:text-sm py-2">
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              STF
            </TabsTrigger>
            <TabsTrigger value="tribunais" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-xs md:text-sm py-2">
              <Building className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Tribunais</span>
              <span className="sm:hidden">Trib.</span>
            </TabsTrigger>
            <TabsTrigger value="funcoes" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-xs md:text-sm py-2">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Funções
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stf">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="mb-3 md:mb-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <h3 className="font-semibold text-purple-300 text-sm md:text-base mb-1 md:mb-2">Supremo Tribunal Federal</h3>
                  <p className="text-neutral-300 text-xs md:text-sm">
                    Órgão máximo do Judiciário, com 11 ministros indicados pelo Presidente.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                  {ministros.map((ministro, index) => (
                    <PoliticoBiografiaCard
                      key={ministro.id}
                      nome={ministro.nome}
                      cargo={`Posse: ${formatDate(ministro.data_posse)}`}
                      partido={`Indicado por: ${ministro.indicado_por}`}
                      fotoUrl={ministro.foto_wikipedia || ministro.foto_url}
                      onClick={() => handleMinistroClick(ministro)}
                      index={index}
                      corTema="purple"
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="tribunais">
            <div className="space-y-4">
              {tribunais.map((tribunal, index) => (
                <motion.div
                  key={tribunal.sigla}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedTribunal(tribunal)}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-purple-500/30 text-purple-200 text-xs font-bold">
                        {tribunal.sigla}
                      </span>
                      <h3 className="font-semibold text-purple-300">{tribunal.nome}</h3>
                    </div>
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-neutral-300 text-sm">{tribunal.descricao}</p>
                  <p className="text-purple-400 text-xs mt-2">Clique para ver detalhes</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funcoes">
            <div className="space-y-3">
              {funcoes.map((funcao, index) => (
                <motion.div
                  key={funcao.titulo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFuncao(funcao.titulo)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-purple-300 mb-1">{funcao.titulo}</h3>
                      <p className="text-neutral-300 text-sm">{funcao.descricao}</p>
                    </div>
                    {expandedFuncoes[funcao.titulo] ? (
                      <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedFuncoes[funcao.titulo] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-3"
                      >
                        <div className="pt-2 border-t border-purple-500/20">
                          <h4 className="text-sm font-medium text-purple-200 mb-2">Explicação Detalhada</h4>
                          <p className="text-neutral-400 text-sm leading-relaxed">{funcao.detalhes}</p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <h4 className="text-xs font-medium text-purple-300 mb-1">Fundamento Legal</h4>
                          <p className="text-neutral-300 text-xs italic">{funcao.fundamentoLegal}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Tribunal */}
      <TribunalDetailModal
        tribunal={selectedTribunal}
        isOpen={!!selectedTribunal}
        onClose={() => setSelectedTribunal(null)}
      />
    </div>
  );
};

export default TresPoderesJudiciario;
