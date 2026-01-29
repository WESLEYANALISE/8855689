import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, TrendingUp, Calendar } from "lucide-react";
import { BotaoExplicar } from "@/components/BotaoExplicar";

const EleicoesHistorico = () => {
  const eleicoesPrincipais = [
    {
      ano: 2024,
      tipo: "Municipal",
      destaques: "Eleições municipais com renovação de prefeitos e vereadores em todo o Brasil",
      turnos: 2,
    },
    {
      ano: 2022,
      tipo: "Presidencial e Estadual",
      destaques: "Eleição presidencial em 2 turnos, renovação de governadores e assembleias",
      turnos: 2,
    },
    {
      ano: 2020,
      tipo: "Municipal",
      destaques: "Primeira eleição municipal durante pandemia, uso obrigatório de máscara",
      turnos: 2,
    },
    {
      ano: 2018,
      tipo: "Presidencial e Estadual",
      destaques: "Eleição marcada por alta participação nas redes sociais",
      turnos: 2,
    },
  ];

  const marcos = [
    {
      ano: 1945,
      titulo: "Fim do Estado Novo",
      descricao: "Primeira eleição presidencial após o Estado Novo",
    },
    {
      ano: 1985,
      titulo: "Eleições Diretas",
      descricao: "Retorno das eleições diretas para presidente",
    },
    {
      ano: 1996,
      titulo: "Urnas Eletrônicas",
      descricao: "Primeira eleição com urnas eletrônicas em todo o país",
    },
    {
      ano: 2000,
      titulo: "Lei Complementar 100%",
      descricao: "Todas as eleições passam a usar urnas eletrônicas",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Histórico de Eleições</h1>
          <p className="text-sm text-muted-foreground">
            Acesse dados históricos de eleições desde 1945
          </p>
        </div>
        <BotaoExplicar 
          contexto="historico_eleicoes"
          titulo="Entenda o histórico eleitoral"
        />
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eleições Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eleicoesPrincipais.map((eleicao) => (
              <div key={eleicao.ano} className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{eleicao.ano}</h3>
                    <p className="text-sm text-accent">{eleicao.tipo}</p>
                  </div>
                  <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">
                    {eleicao.turnos} {eleicao.turnos === 1 ? "Turno" : "Turnos"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{eleicao.destaques}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Marcos Históricos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marcos.map((marco) => (
              <div key={marco.ano} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="font-bold text-accent">{marco.ano}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{marco.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{marco.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estatísticas Históricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">156M+</p>
              <p className="text-sm text-muted-foreground">Eleitores em 2024</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">30+</p>
              <p className="text-sm text-muted-foreground">Eleições Presidenciais</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">100%</p>
              <p className="text-sm text-muted-foreground">Urnas Eletrônicas</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">5.570</p>
              <p className="text-sm text-muted-foreground">Municípios</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EleicoesHistorico;
