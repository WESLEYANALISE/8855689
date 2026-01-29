import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Users, Building, BookOpen, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PoliticoBiografiaCard } from "@/components/tres-poderes/PoliticoBiografiaCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Presidente {
  id: string;
  nome: string;
  nome_completo: string;
  periodo_inicio: number;
  periodo_fim: number | null;
  partido: string;
  foto_url: string | null;
  foto_wikipedia: string | null;
  biografia: string | null;
  ordem: number;
}

interface FuncaoInfo {
  titulo: string;
  descricao: string;
  detalhes: string;
  fundamentoLegal: string;
}

const funcoes: FuncaoInfo[] = [
  {
    titulo: 'Chefe de Estado e de Governo',
    descricao: 'O Presidente é simultaneamente Chefe de Estado e Chefe de Governo.',
    detalhes: 'Como Chefe de Estado, o Presidente representa o Brasil nas relações internacionais, recebe chefes de Estado estrangeiros e mantém relações diplomáticas. Como Chefe de Governo, dirige a administração federal, define políticas públicas e coordena os ministérios. Essa dupla função é característica do sistema presidencialista, diferente do parlamentarismo onde as funções são separadas.',
    fundamentoLegal: 'Art. 84 da Constituição Federal estabelece as competências privativas do Presidente da República.'
  },
  {
    titulo: 'Execução das Leis',
    descricao: 'Cumprir as leis elaboradas pelo Legislativo através de decretos.',
    detalhes: 'O Poder Executivo é responsável por regulamentar e executar as leis aprovadas pelo Congresso Nacional. Isso é feito através de decretos, portarias e outros atos normativos. O Presidente pode expedir decretos autônomos para organização da administração federal (art. 84, VI) e decretos regulamentares para fiel execução das leis (art. 84, IV). Também pode editar Medidas Provisórias com força de lei em casos de urgência.',
    fundamentoLegal: 'Art. 84, IV e VI da CF: competência para sancionar, promulgar, publicar leis e expedir decretos.'
  },
  {
    titulo: 'Políticas Públicas',
    descricao: 'Implementar políticas nas áreas de saúde, educação, segurança e economia.',
    detalhes: 'O Executivo formula e implementa políticas públicas através dos ministérios e órgãos federais. Isso inclui programas de transferência de renda, políticas educacionais, sistema único de saúde (SUS), segurança pública, infraestrutura e desenvolvimento econômico. A implementação ocorre diretamente ou em cooperação com Estados e Municípios, através de convênios e repasses de recursos.',
    fundamentoLegal: 'Arts. 6º, 194, 196, 205 e 217 da CF tratam dos direitos sociais e políticas públicas correlatas.'
  },
  {
    titulo: 'Administração Pública',
    descricao: 'Gerenciar ministérios, autarquias e empresas estatais.',
    detalhes: 'A Administração Pública Federal é composta por ministérios, autarquias (como INSS, IBAMA), fundações públicas (como IBGE, Fiocruz), empresas públicas (como Correios, Caixa) e sociedades de economia mista (como Petrobras, Banco do Brasil). O Presidente nomeia e exonera ministros de Estado e dirige toda a administração federal, seguindo os princípios da legalidade, impessoalidade, moralidade, publicidade e eficiência.',
    fundamentoLegal: 'Art. 37 da CF: princípios da administração pública; Art. 84, I e II: competência para nomear e exonerar.'
  },
  {
    titulo: 'Relações Internacionais',
    descricao: 'Manter relações diplomáticas e celebrar tratados internacionais.',
    detalhes: 'O Presidente representa o Brasil perante outros países e organismos internacionais. Compete a ele celebrar tratados e acordos internacionais, que posteriormente devem ser aprovados pelo Congresso Nacional. O Presidente também nomeia embaixadores e recebe representantes diplomáticos estrangeiros. A política externa brasileira é conduzida pelo Ministério das Relações Exteriores (Itamaraty).',
    fundamentoLegal: 'Art. 84, VII e VIII da CF: competência para manter relações e celebrar tratados; Art. 49, I: competência do Congresso para aprovar tratados.'
  },
  {
    titulo: 'Orçamento',
    descricao: 'Elaborar a proposta orçamentária anual e o plano plurianual.',
    detalhes: 'O Executivo é responsável por elaborar e enviar ao Congresso: o Plano Plurianual (PPA) - planejamento de 4 anos; a Lei de Diretrizes Orçamentárias (LDO) - metas e prioridades anuais; e a Lei Orçamentária Anual (LOA) - receitas e despesas do ano seguinte. Após aprovação pelo Congresso, cabe ao Executivo executar o orçamento, podendo contingenciar recursos em caso de frustração de receitas.',
    fundamentoLegal: 'Art. 165 da CF: compete ao Poder Executivo elaborar o PPA, LDO e LOA.'
  }
];

const TresPoderesExecutivo = () => {
  const navigate = useNavigate();
  const [presidentes, setPresidentes] = useState<Presidente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [expandedFuncoes, setExpandedFuncoes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: presData, error } = await supabase
        .from('tres_poderes_presidentes')
        .select('*')
        .order('ordem', { ascending: false });

      if (error) throw error;
      setPresidentes(presData || []);

      const { data: configData } = await supabase
        .from('tres_poderes_config')
        .select('background_url')
        .eq('page_key', 'executivo')
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
        body: { pageKey: 'executivo' }
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

  const handlePresidenteClick = (presidente: Presidente) => {
    navigate(`/tres-poderes/executivo/presidente/${encodeURIComponent(presidente.nome)}`, {
      state: { presidente }
    });
  };

  const toggleFuncao = (titulo: string) => {
    setExpandedFuncoes(prev => ({ ...prev, [titulo]: !prev[titulo] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/20 to-neutral-950 relative overflow-hidden">
      {/* Background */}
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 opacity-25 animate-fade-in">
          <img src={backgroundUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/50 to-neutral-950" />
        </div>
      )}

      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-60 md:w-80 h-60 md:h-80 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="relative z-10 px-3 md:px-4 py-4 md:py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 animate-fade-in">
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
        </div>

        {/* Title */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 md:p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 mb-3 md:mb-4">
            <Crown className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            Poder Executivo
          </h1>
          <p className="text-neutral-400 text-sm md:text-base px-4">
            Responsável por governar e administrar o país
          </p>
          <div className="h-1 w-24 md:w-32 mx-auto mt-3 md:mt-4 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="presidentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800/50 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="presidentes" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs md:text-sm py-2">
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Presidentes</span>
              <span className="sm:hidden">Pres.</span>
            </TabsTrigger>
            <TabsTrigger value="funcoes" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs md:text-sm py-2">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Funções
            </TabsTrigger>
            <TabsTrigger value="estrutura" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs md:text-sm py-2">
              <Building className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Estrutura</span>
              <span className="sm:hidden">Estr.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presidentes">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {presidentes.map((presidente, index) => (
                  <PoliticoBiografiaCard
                    key={presidente.id}
                    nome={presidente.nome}
                    cargo={presidente.nome_completo}
                    partido={presidente.partido}
                    fotoUrl={presidente.foto_wikipedia || presidente.foto_url}
                    periodo={presidente.periodo_fim 
                      ? `${presidente.periodo_inicio} - ${presidente.periodo_fim}`
                      : `${presidente.periodo_inicio} - Atual`
                    }
                    onClick={() => handlePresidenteClick(presidente)}
                    index={index}
                    corTema="amber"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="funcoes">
            <div className="space-y-3">
              {funcoes.map((funcao, index) => (
                <div
                  key={funcao.titulo}
                  className="rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <button
                    onClick={() => toggleFuncao(funcao.titulo)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-500/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-amber-300 text-sm md:text-base mb-1">{funcao.titulo}</h3>
                      <p className="text-neutral-300 text-xs md:text-sm">{funcao.descricao}</p>
                    </div>
                    {expandedFuncoes[funcao.titulo] ? (
                      <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-amber-400 flex-shrink-0 ml-2" />
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
                        <div className="pt-2 border-t border-amber-500/20">
                          <h4 className="text-sm font-medium text-amber-200 mb-2">Explicação Detalhada</h4>
                          <p className="text-neutral-400 text-sm leading-relaxed">{funcao.detalhes}</p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <h4 className="text-xs font-medium text-amber-300 mb-1">Fundamento Legal</h4>
                          <p className="text-neutral-300 text-xs italic">{funcao.fundamentoLegal}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estrutura">
            <div className="space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 animate-fade-in">
                <h3 className="font-semibold text-amber-300 text-sm md:text-base mb-2 md:mb-3">Presidência da República</h3>
                <p className="text-neutral-300 text-xs md:text-sm mb-3 md:mb-4">
                  Órgão máximo do Poder Executivo federal.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-xs md:text-sm font-medium text-white">Principais Ministérios:</h4>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {[
                      'Casa Civil', 'Fazenda', 'Justiça', 'Defesa', 'Relações Exteriores',
                      'Saúde', 'Educação', 'Trabalho'
                    ].map((min) => (
                      <span key={min} className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-amber-500/20 text-amber-200 text-[10px] md:text-xs">
                        {min}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div 
                className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                <h3 className="font-semibold text-amber-300 text-sm md:text-base mb-1 md:mb-2">Vice-Presidência</h3>
                <p className="text-neutral-300 text-xs md:text-sm">
                  Auxilia o Presidente e assume em casos de impedimento.
                </p>
              </div>

              <div 
                className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                <h3 className="font-semibold text-amber-300 text-sm md:text-base mb-1 md:mb-2">Advocacia-Geral da União</h3>
                <p className="text-neutral-300 text-xs md:text-sm">
                  Representa a União e presta consultoria jurídica.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TresPoderesExecutivo;
