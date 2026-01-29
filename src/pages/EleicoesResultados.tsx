import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { ResultadoEstadoCard } from "@/components/ResultadoEstadoCard";
import { BotaoExplicar } from "@/components/BotaoExplicar";

const EleicoesResultados = () => {
  const [ano, setAno] = useState("2024");
  const [cargo, setCargo] = useState("");
  const [estado, setEstado] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any>(null);
  const { toast } = useToast();

  const anos = ["2024", "2022", "2020", "2018", "2016", "2014"];
  const cargos = [
    { value: "presidente", label: "Presidente" },
    { value: "governador", label: "Governador" },
    { value: "senador", label: "Senador" },
    { value: "deputado-federal", label: "Deputado Federal" },
    { value: "deputado-estadual", label: "Deputado Estadual" },
  ];

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const handleConsultar = async () => {
    if (!cargo) {
      toast({
        title: "Selecione um cargo",
        description: "É necessário escolher o cargo para consultar resultados",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-resultados-eleicoes",
        {
          body: { ano, cargo, estado: estado === "BR" ? "" : estado },
        }
      );

      if (error) throw error;

      setResultados(data);
      toast({
        title: "Resultados carregados",
        description: data.tipo === 'nacional' 
          ? `Resultados de todos os ${data.estados.length} estados`
          : "Dados da eleição foram encontrados",
      });
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível buscar resultados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Resultados de Eleições</h1>
          <p className="text-sm text-muted-foreground">
            Consulte resultados oficiais de eleições anteriores
          </p>
        </div>
        <BotaoExplicar 
          contexto="resultados_eleicao"
          titulo="Como interpretar os resultados?"
        />
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Consultar Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano da Eleição</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Brasil (todos os estados)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">Brasil (Todos os Estados)</SelectItem>
                {estados.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleConsultar} className="w-full" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Consultar Resultados
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Carregando resultados do TSE..." />}

      {resultados && !loading && (
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Estatísticas Gerais</CardTitle>
                <BotaoExplicar 
                  contexto="estatisticas_eleicao"
                  dados={{ estatisticas: resultados }}
                  titulo="Entenda as estatísticas"
                  variant="ghost"
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-accent">{resultados.totalVotos?.toLocaleString('pt-BR') || 0}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total de Votos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-accent">{resultados.comparecimento || 0}%</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Comparecimento</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-accent">{resultados.abstencao || 0}%</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Abstenção</p>
                </div>
                {resultados.candidatos && (
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-accent">{resultados.candidatos}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Candidatos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados Nacionais - Todos os Estados */}
          {resultados.tipo === 'nacional' && resultados.estados && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                Resultados por Estado ({resultados.estados.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resultados.estados.map((estado: any) => (
                  <ResultadoEstadoCard key={estado.uf} estado={estado} />
                ))}
              </div>
            </div>
          )}

          {/* Resultados Estaduais - Gráficos Detalhados */}
          {resultados.tipo === 'estadual' && resultados.votacao && (
            <>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Votação por Candidato</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={resultados.votacao}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nome" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="votos" fill="#00D4A1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Distribuição de Votos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={resultados.distribuicao}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.nome.split(' ')[0]}: ${entry.percentual.toFixed(1)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="votos"
                      >
                        {resultados.distribuicao.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EleicoesResultados;
