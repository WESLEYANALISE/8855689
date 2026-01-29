import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building, Users, Gavel, Scale, BookOpen, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface TribunalInfo {
  sigla: string;
  nome: string;
  descricao: string;
  wikiTermo: string;
}

interface TribunalDetailModalProps {
  tribunal: TribunalInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TribunalData {
  imagem: string;
  resumo: string;
  composicao: string;
  competencias: string[];
  historia: string;
  curiosidades: string[];
  link_wikipedia: string;
}

const tribunaisData: Record<string, { composicao: string; competencias: string[]; historia: string; wikiUrl: string }> = {
  STJ: {
    composicao: "O STJ é composto por no mínimo 33 ministros, nomeados pelo Presidente da República após aprovação do Senado Federal. Um terço dos ministros é escolhido entre juízes dos Tribunais Regionais Federais, um terço entre desembargadores dos Tribunais de Justiça e um terço entre advogados e membros do Ministério Público.",
    competencias: [
      "Julgar recursos especiais contra decisões dos tribunais estaduais e federais",
      "Uniformizar a interpretação da legislação federal",
      "Julgar conflitos de competência entre tribunais",
      "Processar e julgar crimes comuns de governadores",
      "Julgar habeas corpus quando o coator for tribunal sujeito à sua jurisdição"
    ],
    historia: "O STJ foi criado pela Constituição Federal de 1988, instalado em 7 de abril de 1989. Assumiu parte das competências do antigo Tribunal Federal de Recursos (TFR), sendo responsável pela uniformização da interpretação da lei federal em todo o Brasil.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Superior_Tribunal_de_Justiça"
  },
  TSE: {
    composicao: "O TSE é composto por 7 ministros: 3 juízes dentre os ministros do STF, 2 juízes dentre os ministros do STJ e 2 juízes nomeados pelo Presidente da República dentre advogados de notável saber jurídico e idoneidade moral.",
    competencias: [
      "Organizar e fiscalizar as eleições em todo o território nacional",
      "Julgar recursos contra decisões dos Tribunais Regionais Eleitorais",
      "Registrar e cassar candidaturas e partidos políticos",
      "Responder consultas sobre matéria eleitoral",
      "Expedir instruções para a execução da legislação eleitoral"
    ],
    historia: "O TSE foi criado em 1932 como parte da Justiça Eleitoral, uma inovação do Código Eleitoral daquele ano. Foi extinto durante o Estado Novo (1937-1945) e restabelecido em 1945. É responsável pela realização das eleições mais informatizadas do mundo.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Tribunal_Superior_Eleitoral"
  },
  TST: {
    composicao: "O TST é composto por 27 ministros, escolhidos dentre brasileiros com mais de 35 e menos de 70 anos, nomeados pelo Presidente da República após aprovação do Senado. Um quinto das vagas é destinado a advogados e membros do Ministério Público do Trabalho.",
    competencias: [
      "Julgar recursos de revista contra decisões dos Tribunais Regionais do Trabalho",
      "Uniformizar a jurisprudência trabalhista",
      "Julgar dissídios coletivos de âmbito nacional",
      "Processar e julgar mandados de segurança contra seus atos",
      "Homologar acordos em dissídios coletivos"
    ],
    historia: "O TST foi criado em 1946 como órgão de cúpula da Justiça do Trabalho. Anteriormente, a Justiça do Trabalho era vinculada ao Poder Executivo através do Ministério do Trabalho. Com a Constituição de 1946, passou a integrar o Poder Judiciário.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Tribunal_Superior_do_Trabalho"
  },
  STM: {
    composicao: "O STM é composto por 15 ministros vitalícios: 10 militares (3 da Marinha, 4 do Exército e 3 da Aeronáutica) e 5 civis. Os civis são escolhidos pelo Presidente da República, sendo 3 advogados, 1 juiz auditor e 1 membro do Ministério Público Militar.",
    competencias: [
      "Julgar crimes militares definidos em lei",
      "Processar e julgar oficiais-generais",
      "Julgar recursos contra decisões dos Conselhos de Justiça Militar",
      "Decidir sobre perda de posto e patente de oficiais",
      "Julgar habeas corpus em matéria militar"
    ],
    historia: "O STM é o mais antigo tribunal superior do Brasil, criado em 1808 por D. João VI como Conselho Supremo Militar e de Justiça. É o único tribunal superior que existia antes da Independência do Brasil.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Superior_Tribunal_Militar"
  },
  CNJ: {
    composicao: "O CNJ é composto por 15 membros com mandato de 2 anos, admitida uma recondução. Inclui o Presidente do STF (que o preside), um ministro do STJ, um ministro do TST, juízes de diversos tribunais, membros do Ministério Público, advogados e cidadãos indicados pelo Congresso.",
    competencias: [
      "Controlar a atuação administrativa e financeira do Poder Judiciário",
      "Fiscalizar o cumprimento dos deveres funcionais dos juízes",
      "Receber reclamações contra membros ou órgãos do Judiciário",
      "Elaborar relatório anual sobre o Judiciário",
      "Expedir atos regulamentares e recomendações"
    ],
    historia: "O CNJ foi criado pela Emenda Constitucional nº 45 de 2004, conhecida como Reforma do Judiciário, e instalado em 14 de junho de 2005. Foi uma resposta à necessidade de controle externo do Poder Judiciário, promovendo transparência e eficiência.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Conselho_Nacional_de_Justiça"
  }
};

export const TribunalDetailModal = ({ tribunal, isOpen, onClose }: TribunalDetailModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [wikiData, setWikiData] = useState<{ imagem: string; resumo: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    composicao: true,
    competencias: false,
    historia: false
  });

  useEffect(() => {
    if (tribunal && isOpen) {
      fetchWikipediaData(tribunal.wikiTermo);
    }
  }, [tribunal, isOpen]);

  const fetchWikipediaData = async (termo: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`,
        { headers: { 'User-Agent': 'VadeMecumBrasil/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        setWikiData({
          imagem: data.thumbnail?.source || data.originalimage?.source || '',
          resumo: data.extract || ''
        });
      }
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!tribunal) return null;

  const tribunalInfo = tribunaisData[tribunal.sigla];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Building className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="text-purple-400 font-bold">{tribunal.sigla}</span>
              <span className="mx-2">-</span>
              {tribunal.nome}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Imagem e Resumo */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : (
            <>
              {wikiData?.imagem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-48 rounded-xl overflow-hidden"
                >
                  <img
                    src={wikiData.imagem}
                    alt={tribunal.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                </motion.div>
              )}

              {wikiData?.resumo && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neutral-300 text-sm leading-relaxed"
                >
                  {wikiData.resumo}
                </motion.p>
              )}
            </>
          )}

          {/* Composição */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('composicao')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-purple-300">Composição</h3>
              </div>
              {expandedSections.composicao ? (
                <ChevronUp className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.composicao && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <p className="text-neutral-300 text-sm">{tribunalInfo?.composicao}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Competências */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('competencias')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-purple-300">Competências</h3>
              </div>
              {expandedSections.competencias ? (
                <ChevronUp className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.competencias && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <ul className="space-y-2">
                    {tribunalInfo?.competencias.map((comp, i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                        <Scale className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        {comp}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* História */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('historia')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-purple-300">História</h3>
              </div>
              {expandedSections.historia ? (
                <ChevronUp className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.historia && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <p className="text-neutral-300 text-sm">{tribunalInfo?.historia}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Link Wikipedia */}
          {tribunalInfo?.wikiUrl && (
            <motion.a
              href={tribunalInfo.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Ver mais na Wikipedia</span>
            </motion.a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
