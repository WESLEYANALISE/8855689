import { useState, useEffect } from "react";
import { ArrowLeft, Calculator, Calendar, AlertCircle, Check, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isWeekend, isBefore, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Feriados nacionais 2024/2025
const FERIADOS_NACIONAIS = [
  "2024-01-01", "2024-02-12", "2024-02-13", "2024-03-29", "2024-04-21",
  "2024-05-01", "2024-05-30", "2024-09-07", "2024-10-12", "2024-11-02",
  "2024-11-15", "2024-11-20", "2024-12-25",
  "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
  "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
  "2025-11-15", "2025-11-20", "2025-12-25"
];

const TIPOS_PRAZO = [
  { value: "cpc", label: "CPC - Processo Civil", diasUteis: true },
  { value: "clt", label: "CLT - Processo Trabalhista", diasUteis: true },
  { value: "cpp", label: "CPP - Processo Penal", diasUteis: false },
  { value: "jec", label: "JEC - Juizado Especial", diasUteis: true },
  { value: "corridos", label: "Dias Corridos", diasUteis: false },
];

const PRAZOS_COMUNS = [
  { nome: "Contestação (CPC)", dias: 15, tipo: "cpc" },
  { nome: "Apelação (CPC)", dias: 15, tipo: "cpc" },
  { nome: "Agravo de Instrumento", dias: 15, tipo: "cpc" },
  { nome: "Embargos de Declaração", dias: 5, tipo: "cpc" },
  { nome: "Recurso Ordinário (CLT)", dias: 8, tipo: "clt" },
  { nome: "Recurso Inominado (JEC)", dias: 10, tipo: "jec" },
  { nome: "Apelação Criminal (CPP)", dias: 5, tipo: "cpp" },
];

const AdvogadoPrazos = () => {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState("");
  const [diasPrazo, setDiasPrazo] = useState("");
  const [tipoPrazo, setTipoPrazo] = useState("cpc");
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [diasUteisSelecionado, setDiasUteisSelecionado] = useState(true);
  const [detalhesCalculo, setDetalhesCalculo] = useState<string[]>([]);

  const isFeriado = (data: Date): boolean => {
    const dataStr = format(data, "yyyy-MM-dd");
    return FERIADOS_NACIONAIS.includes(dataStr);
  };

  const isDataUtil = (data: Date): boolean => {
    return !isWeekend(data) && !isFeriado(data);
  };

  const calcularPrazo = () => {
    if (!dataInicio || !diasPrazo) {
      toast.error("Preencha a data de início e o número de dias");
      return;
    }

    const dias = parseInt(diasPrazo);
    if (isNaN(dias) || dias <= 0) {
      toast.error("Digite um número de dias válido");
      return;
    }

    const tipoSelecionado = TIPOS_PRAZO.find(t => t.value === tipoPrazo);
    const usarDiasUteis = tipoSelecionado?.diasUteis ?? diasUteisSelecionado;
    
    let dataAtual = parseISO(dataInicio);
    let diasContados = 0;
    const detalhes: string[] = [];

    // Primeiro dia após a intimação (não conta o dia da intimação)
    dataAtual = addDays(dataAtual, 1);
    detalhes.push(`Data inicial: ${format(parseISO(dataInicio), "dd/MM/yyyy", { locale: ptBR })}`);

    if (usarDiasUteis) {
      // Pular para o primeiro dia útil se necessário
      while (!isDataUtil(dataAtual)) {
        dataAtual = addDays(dataAtual, 1);
      }
      detalhes.push(`Início da contagem (1º dia útil): ${format(dataAtual, "dd/MM/yyyy", { locale: ptBR })}`);

      while (diasContados < dias) {
        if (isDataUtil(dataAtual)) {
          diasContados++;
        }
        if (diasContados < dias) {
          dataAtual = addDays(dataAtual, 1);
        }
      }

      // Se cair em dia não útil, prorroga para o próximo dia útil
      while (!isDataUtil(dataAtual)) {
        dataAtual = addDays(dataAtual, 1);
        detalhes.push(`Prorrogado para dia útil: ${format(dataAtual, "dd/MM/yyyy", { locale: ptBR })}`);
      }
    } else {
      // Dias corridos
      dataAtual = addDays(dataAtual, dias - 1);
      detalhes.push(`Contagem em dias corridos`);
    }

    detalhes.push(`Prazo final: ${format(dataAtual, "dd/MM/yyyy (EEEE)", { locale: ptBR })}`);
    
    setDataFinal(dataAtual);
    setDetalhesCalculo(detalhes);
  };

  const aplicarPrazoComum = (prazo: typeof PRAZOS_COMUNS[0]) => {
    setDiasPrazo(prazo.dias.toString());
    setTipoPrazo(prazo.tipo);
    toast.success(`Prazo de ${prazo.nome} aplicado`);
  };

  useEffect(() => {
    const tipo = TIPOS_PRAZO.find(t => t.value === tipoPrazo);
    if (tipo) {
      setDiasUteisSelecionado(tipo.diasUteis);
    }
  }, [tipoPrazo]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-4 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Calculadora de Prazos</h1>
            <p className="text-sm text-muted-foreground">Calcule prazos processuais em dias úteis</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Calcular Prazo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data de Início (Intimação/Publicação)</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Prazo</Label>
                <Select value={tipoPrazo} onValueChange={setTipoPrazo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PRAZO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade de Dias</Label>
                <Input
                  type="number"
                  value={diasPrazo}
                  onChange={(e) => setDiasPrazo(e.target.value)}
                  placeholder="Ex: 15"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {diasUteisSelecionado 
                    ? "Contagem em dias úteis (exclui sábados, domingos e feriados)"
                    : "Contagem em dias corridos"
                  }
                </span>
              </div>

              <Button onClick={calcularPrazo} className="w-full gap-2">
                <Calculator className="w-4 h-4" />
                Calcular Prazo
              </Button>
            </CardContent>
          </Card>

          {/* Resultado */}
          <div className="space-y-4">
            {dataFinal && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Check className="w-5 h-5" />
                    Prazo Calculado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-primary">
                      {format(dataFinal, "dd/MM/yyyy")}
                    </p>
                    <p className="text-lg text-muted-foreground mt-1">
                      {format(dataFinal, "EEEE", { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-1">
                    {detalhesCalculo.map((detalhe, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {detalhe}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prazos Comuns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prazos Comuns</CardTitle>
                <CardDescription>Clique para aplicar automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRAZOS_COMUNS.map((prazo, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => aplicarPrazoComum(prazo)}
                      className="text-xs"
                    >
                      {prazo.nome} ({prazo.dias}d)
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Avisos */}
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500">Atenção</p>
                    <p className="text-muted-foreground mt-1">
                      Esta ferramenta é auxiliar. Sempre confirme os prazos com o calendário oficial do tribunal e verifique feriados locais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvogadoPrazos;
