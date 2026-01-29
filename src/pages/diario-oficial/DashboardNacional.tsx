import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Loader2, MapPin, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { agregadosEstado, StateAggregates, ESTADOS_BRASIL } from "@/lib/api/queridoDiarioApi";

interface EstadoData extends StateAggregates {
  nome: string;
  cobertura: number;
}

const DashboardNacional = () => {
  const navigate = useNavigate();
  
  const [estados, setEstados] = useState<EstadoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalCidades: 0,
    cidadesCobertas: 0,
    totalDiarios: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const estadosData: EstadoData[] = [];

    // Carregar dados de alguns estados principais (API pode limitar)
    const estadosPrincipais = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'PE', 'CE', 'GO', 'DF'];
    
    try {
      const promises = estadosPrincipais.map(async (codigo) => {
        try {
          const data = await agregadosEstado(codigo);
          const estado = ESTADOS_BRASIL.find(e => e.codigo === codigo);
          return {
            ...data,
            nome: estado?.nome || codigo,
            cobertura: data.total_cities > 0 
              ? Math.round((data.cities_with_gazettes / data.total_cities) * 100)
              : 0
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((r): r is EstadoData => r !== null);
      
      // Ordenar por cobertura
      validResults.sort((a, b) => b.cobertura - a.cobertura);
      setEstados(validResults);

      // Calcular totais
      const totais = validResults.reduce((acc, estado) => ({
        totalCidades: acc.totalCidades + (estado.total_cities || 0),
        cidadesCobertas: acc.cidadesCobertas + (estado.cities_with_gazettes || 0),
        totalDiarios: acc.totalDiarios + (estado.total_gazettes || 0),
      }), { totalCidades: 0, cidadesCobertas: 0, totalDiarios: 0 });
      
      setTotalStats(totais);
      
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const getBarColor = (cobertura: number) => {
    if (cobertura >= 80) return "hsl(142, 76%, 36%)"; // green
    if (cobertura >= 50) return "hsl(45, 93%, 47%)"; // yellow
    return "hsl(0, 84%, 60%)"; // red
  };

  const coberturaGeral = totalStats.totalCidades > 0
    ? Math.round((totalStats.cidadesCobertas / totalStats.totalCidades) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/diario-oficial")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dashboard Nacional
            </h1>
            <p className="text-sm text-muted-foreground">
              Estatísticas de cobertura por estado
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando estatísticas...</span>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{totalStats.cidadesCobertas.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Cidades Cobertas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{totalStats.totalDiarios.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total de Diários</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{coberturaGeral}%</p>
                  <p className="text-xs text-muted-foreground">Cobertura Geral</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-2xl font-bold">{estados.length}</p>
                  <p className="text-xs text-muted-foreground">Estados Analisados</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cobertura por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={estados}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="state_code" width={40} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, 'Cobertura']}
                        labelFormatter={(label) => {
                          const estado = estados.find(e => e.state_code === label);
                          return estado?.nome || label;
                        }}
                      />
                      <Bar dataKey="cobertura" radius={[0, 4, 4, 0]}>
                        {estados.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.cobertura)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {estados.map((estado) => (
                      <div key={estado.state_code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{estado.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {estado.cities_with_gazettes} de {estado.total_cities} municípios
                              {" • "}{estado.total_gazettes.toLocaleString()} diários
                            </p>
                          </div>
                          <span className={`text-lg font-bold ${
                            estado.cobertura >= 80 ? 'text-green-500' :
                            estado.cobertura >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {estado.cobertura}%
                          </span>
                        </div>
                        <Progress value={estado.cobertura} className="h-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-muted-foreground">≥ 80% cobertura</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-muted-foreground">50-79%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-muted-foreground">&lt; 50%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardNacional;
