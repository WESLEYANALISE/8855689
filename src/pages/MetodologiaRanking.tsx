import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, DollarSign, Calendar, FileText, Users, AlertTriangle, Award, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const MetodologiaRanking = () => {
  const navigate = useNavigate();

  const criterios = [
    {
      id: 'gastos',
      nome: 'Economia de Recursos',
      peso: 25,
      icon: DollarSign,
      cor: 'green',
      descricao: 'Quanto menos o parlamentar gasta da cota parlamentar, maior sua nota neste critério. Avaliamos o uso responsável do dinheiro público.',
      calculo: 'Nota = 10 - ((Gasto - Menor Gasto) / (Maior Gasto - Menor Gasto)) × 10',
      fonte: 'API da Câmara dos Deputados e Senado Federal'
    },
    {
      id: 'presenca',
      nome: 'Presença e Participação',
      peso: 20,
      icon: Calendar,
      cor: 'blue',
      descricao: 'Mede a assiduidade do parlamentar em sessões plenárias, votações e eventos da casa legislativa.',
      calculo: 'Nota = ((Participações - Menor) / (Maior - Menor)) × 10',
      fonte: 'Registros oficiais de presença'
    },
    {
      id: 'proposicoes',
      nome: 'Produtividade Legislativa',
      peso: 20,
      icon: FileText,
      cor: 'purple',
      descricao: 'Quantidade de projetos de lei, requerimentos e outras proposições apresentadas pelo parlamentar.',
      calculo: 'Nota = ((Proposições - Menor) / (Maior - Menor)) × 10',
      fonte: 'Sistema de proposições legislativas'
    },
    {
      id: 'votacoes',
      nome: 'Votações',
      peso: 25,
      icon: Scale,
      cor: 'amber',
      descricao: 'Análise de como o parlamentar vota em proposições importantes. (Em desenvolvimento - atualmente usa nota média)',
      calculo: 'Baseado em critérios objetivos de interesse público',
      fonte: 'Registros de votações nominais'
    },
    {
      id: 'comissoes',
      nome: 'Atuação em Comissões',
      peso: 10,
      icon: Users,
      cor: 'cyan',
      descricao: 'Participação ativa em comissões parlamentares, incluindo titularidade e suplência.',
      calculo: 'Nota = ((Comissões - Menor) / (Maior - Menor)) × 10',
      fonte: 'Composição das comissões parlamentares'
    }
  ];

  const getCorClass = (cor: string) => {
    const cores: Record<string, { bg: string; text: string; border: string }> = {
      green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' },
      red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' }
    };
    return cores[cor] || cores.blue;
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Metodologia do Ranking</h1>
            <p className="text-xs text-muted-foreground">
              Como calculamos a nota dos parlamentares
            </p>
          </div>
        </div>
      </motion.div>

      {/* Introdução */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="font-semibold">Avaliação Objetiva e Transparente</h2>
              <p className="text-sm text-muted-foreground">
                Nosso ranking utiliza dados públicos oficiais para avaliar o desempenho dos parlamentares 
                de forma objetiva. A nota final (0 a 10) é calculada a partir de múltiplos critérios 
                ponderados, refletindo diferentes aspectos da atuação parlamentar.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Fórmula principal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Fórmula de Cálculo
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm text-center">
            <p className="text-muted-foreground mb-2">Nota Final =</p>
            <p className="text-primary font-semibold">
              (Votações × 0.25) + (Gastos × 0.25) + (Presença × 0.20) + (Produtividade × 0.20) + (Comissões × 0.10)
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Cada critério gera uma nota de 0 a 10, que é então multiplicada pelo seu peso percentual.
          </p>
        </Card>
      </motion.div>

      {/* Critérios detalhados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 mb-6"
      >
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Critérios de Avaliação
        </h3>
        
        {criterios.map((criterio, idx) => {
          const Icon = criterio.icon;
          const cores = getCorClass(criterio.cor);
          
          return (
            <motion.div
              key={criterio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <Card className={`p-4 border ${cores.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cores.bg}`}>
                    <Icon className={`w-5 h-5 ${cores.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{criterio.nome}</h4>
                      <span className={`text-sm font-bold ${cores.text}`}>
                        {criterio.peso}%
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <Progress value={criterio.peso} className="h-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {criterio.descricao}
                    </p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-muted-foreground min-w-[60px]">Cálculo:</span>
                        <code className="bg-muted px-2 py-0.5 rounded text-[10px]">
                          {criterio.calculo}
                        </code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-muted-foreground min-w-[60px]">Fonte:</span>
                        <span className="text-muted-foreground">{criterio.fonte}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Processos Judiciais */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Processos Judiciais</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Parlamentares com processos judiciais em andamento ou condenações sofrem 
                penalidades na nota final. O impacto varia de acordo com a gravidade:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Investigação: -0.5 a -1.0 pontos</li>
                <li>• Denúncia aceita: -1.0 a -2.0 pontos</li>
                <li>• Condenação: -2.0 a -5.0 pontos</li>
              </ul>
              <p className="text-xs text-amber-500 mt-2">
                * Este critério está em fase de implementação
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Fontes de dados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Fontes de Dados</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Câmara dos Deputados:</strong> dados.camara.leg.br</p>
            <p>• <strong>Senado Federal:</strong> legis.senado.leg.br</p>
            <p>• <strong>TSE:</strong> Tribunal Superior Eleitoral</p>
            <p>• <strong>Portal da Transparência:</strong> portaltransparencia.gov.br</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Última atualização: Dados atualizados periodicamente de forma automática.
          </p>
        </Card>
      </motion.div>

      {/* Botão voltar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6"
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/politica/rankings/unificado')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Ranking
        </Button>
      </motion.div>
    </div>
  );
};

export default MetodologiaRanking;
