import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle } from "lucide-react";

const EleicoesCalendario = () => {
  const calendario2024 = [
    {
      mes: "Março",
      eventos: [
        { dia: "05", titulo: "Convenções Partidárias", descricao: "Início do período para realização de convenções" },
      ],
    },
    {
      mes: "Agosto",
      eventos: [
        { dia: "15", titulo: "Registro de Candidaturas", descricao: "Prazo final para registro de candidatos" },
        { dia: "16", titulo: "Início da Campanha", descricao: "Início oficial da campanha eleitoral" },
      ],
    },
    {
      mes: "Setembro",
      eventos: [
        { dia: "30", titulo: "Debates Eleitorais", descricao: "Período de debates nas emissoras" },
      ],
    },
    {
      mes: "Outubro",
      eventos: [
        { dia: "06", titulo: "1º Turno", descricao: "Dia da votação do primeiro turno", destaque: true },
        { dia: "27", titulo: "2º Turno", descricao: "Dia da votação do segundo turno (se necessário)", destaque: true },
      ],
    },
    {
      mes: "Dezembro",
      eventos: [
        { dia: "19", titulo: "Diplomação", descricao: "Cerimônia de diplomação dos eleitos" },
      ],
    },
  ];

  const prazos = [
    {
      categoria: "Candidaturas",
      items: [
        "Convenções partidárias: 20 de julho a 5 de agosto",
        "Registro de candidaturas: até 15 de agosto",
        "Pedido de registro: até 15 dias antes do pleito",
      ],
    },
    {
      categoria: "Campanha Eleitoral",
      items: [
        "Propaganda eleitoral: 16 de agosto a 5 de outubro",
        "Propaganda na internet: liberada durante todo o período",
        "Horário eleitoral gratuito: 30 de agosto a 5 de outubro",
      ],
    },
    {
      categoria: "Prestação de Contas",
      items: [
        "Candidatos eleitos: até 30 dias após a diplomação",
        "Candidatos não eleitos: até 30 dias após a eleição",
        "Partidos políticos: até 31 de dezembro",
      ],
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Calendário Eleitoral</h1>
        <p className="text-sm text-muted-foreground">
          Datas importantes e prazos das eleições
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendário 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {calendario2024.map((item, index) => (
              <div key={index}>
                <h3 className="font-bold text-accent mb-3">{item.mes}</h3>
                <div className="space-y-3">
                  {item.eventos.map((evento, eIndex) => (
                    <div
                      key={eIndex}
                      className={`p-4 rounded-lg ${
                        evento.destaque
                          ? 'bg-accent/20 border-2 border-accent'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          evento.destaque ? 'bg-accent text-background' : 'bg-accent/20 text-accent'
                        }`}>
                          <span className="font-bold">{evento.dia}</span>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{evento.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Prazos Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {prazos.map((prazo, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  <h3 className="font-bold">{prazo.categoria}</h3>
                </div>
                <ul className="space-y-2 ml-6">
                  {prazo.items.map((item, iIndex) => (
                    <li key={iIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EleicoesCalendario;
