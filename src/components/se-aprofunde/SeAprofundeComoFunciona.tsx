import { motion } from "framer-motion";
import { Info, Scale, Landmark, Building2, Crown, Gavel, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SeAprofundeComoFuncionaProps {
  instituicao: string;
  config: {
    nome: string;
    sigla: string;
    cor: string;
    corBg: string;
  };
}

const instituicoesInfo: Record<string, {
  descricaoCompleta: string;
  funcoes: string[];
  composicao: string;
  curiosidade: string;
}> = {
  stf: {
    descricaoCompleta: "O Supremo Tribunal Federal (STF) é o órgão de cúpula do Poder Judiciário brasileiro. Sua principal função é a guarda da Constituição Federal, atuando como última instância para questões constitucionais.",
    funcoes: [
      "Julgar ações de inconstitucionalidade (ADIs)",
      "Processar e julgar crimes comuns do Presidente da República",
      "Julgar recursos extraordinários",
      "Processar e julgar ministros de Estado",
      "Dirimir conflitos entre União e Estados"
    ],
    composicao: "11 Ministros, nomeados pelo Presidente da República após aprovação do Senado Federal. Devem ter mais de 35 e menos de 70 anos, notável saber jurídico e reputação ilibada.",
    curiosidade: "O STF foi criado em 1890, inspirado na Suprema Corte dos Estados Unidos."
  },
  stj: {
    descricaoCompleta: "O Superior Tribunal de Justiça (STJ) é responsável por uniformizar a interpretação da lei federal em todo o Brasil. É considerado o Tribunal da Cidadania.",
    funcoes: [
      "Julgar recursos especiais",
      "Uniformizar a interpretação da lei federal",
      "Processar e julgar governadores",
      "Julgar conflitos entre tribunais",
      "Conceder habeas corpus em certas situações"
    ],
    composicao: "33 Ministros, nomeados pelo Presidente da República após aprovação do Senado. Um terço entre juízes dos Tribunais Regionais Federais, um terço entre desembargadores e um terço entre advogados e membros do MP.",
    curiosidade: "O STJ foi criado pela Constituição de 1988 para desafogar o STF."
  },
  camara: {
    descricaoCompleta: "A Câmara dos Deputados é a casa legislativa que representa o povo brasileiro. É composta por deputados federais eleitos pelo sistema proporcional.",
    funcoes: [
      "Elaborar, discutir e votar leis",
      "Autorizar a instauração de processo contra o Presidente",
      "Fiscalizar o Poder Executivo",
      "Aprovar o orçamento da União",
      "Iniciar o processo de impeachment"
    ],
    composicao: "513 Deputados Federais, eleitos proporcionalmente por cada estado e pelo Distrito Federal. O mandato é de 4 anos.",
    curiosidade: "A Câmara é chamada de 'Casa do Povo' por representar diretamente a população."
  },
  senado: {
    descricaoCompleta: "O Senado Federal representa os estados e o Distrito Federal. É composto por senadores eleitos pelo sistema majoritário.",
    funcoes: [
      "Elaborar e votar leis",
      "Aprovar nomeações de ministros do STF e STJ",
      "Autorizar operações financeiras dos entes federados",
      "Processar e julgar o Presidente em crimes de responsabilidade",
      "Suspender leis declaradas inconstitucionais pelo STF"
    ],
    composicao: "81 Senadores, sendo 3 por estado e 3 pelo DF. O mandato é de 8 anos, com renovação alternada de 1/3 e 2/3 a cada 4 anos.",
    curiosidade: "O Senado é chamado de 'Casa da Federação' por representar os estados."
  },
  presidencia: {
    descricaoCompleta: "A Presidência da República é o órgão supremo do Poder Executivo federal. O Presidente é o Chefe de Estado e de Governo.",
    funcoes: [
      "Sancionar, promulgar e fazer publicar leis",
      "Expedir decretos e regulamentos",
      "Vetar projetos de lei",
      "Dirigir a administração federal",
      "Manter relações com Estados estrangeiros"
    ],
    composicao: "Presidente da República, eleito pelo voto direto e secreto para mandato de 4 anos, com possibilidade de uma reeleição. Vice-Presidente e Ministros de Estado.",
    curiosidade: "O Brasil já teve 39 presidentes desde a Proclamação da República em 1889."
  }
};

const SeAprofundeComoFunciona = ({ instituicao, config }: SeAprofundeComoFuncionaProps) => {
  const info = instituicoesInfo[instituicao];

  if (!info) {
    return (
      <div className="text-center py-12">
        <Info className={`w-12 h-12 mx-auto mb-4 ${config.cor} opacity-50`} />
        <p className="text-muted-foreground">
          Informações não disponíveis para esta instituição
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Descrição Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className={`${config.corBg} rounded-lg p-3 mb-3`}>
              <h2 className={`font-bold ${config.cor}`}>O que é o {config.sigla}?</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.descricaoCompleta}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Funções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Principais Funções</h3>
            <ul className="space-y-2">
              {info.funcoes.map((funcao, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className={`w-4 h-4 mt-0.5 ${config.cor} flex-shrink-0`} />
                  <span className="text-sm text-muted-foreground">{funcao}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Composição */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Composição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.composicao}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Curiosidade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className={`border-border/50 ${config.corBg}`}>
          <CardContent className="p-4">
            <h3 className={`font-semibold ${config.cor} mb-2`}>💡 Você sabia?</h3>
            <p className="text-sm text-foreground/80">
              {info.curiosidade}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SeAprofundeComoFunciona;
