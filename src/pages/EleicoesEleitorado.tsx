import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

const EleicoesEleitorado = () => {
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const { toast } = useToast();

  const estados = [
    { value: "BR", label: "Brasil (Total)" },
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleConsultar = async () => {
    if (!estado) {
      toast({
        title: "Selecione uma região",
        description: "É necessário escolher um estado ou Brasil",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-dados-eleitorado",
        {
          body: { estado },
        }
      );

      if (error) throw error;

      setDados(data);
      toast({
        title: "Dados carregados",
        description: "Estatísticas do eleitorado foram encontradas",
      });
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível buscar dados do eleitorado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Dados do Eleitorado</h1>
        <p className="text-sm text-muted-foreground">
          Estatísticas de eleitores por região e perfil
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Consultar Eleitorado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Estado / Região</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleConsultar} className="w-full" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Consultar Dados
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Carregando dados do TSE..." />}

      {dados && !loading && (
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estatísticas Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-accent">{dados.totalEleitores?.toLocaleString() || 0}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Total de Eleitores</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-accent">{dados.aptos?.toLocaleString() || 0}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Aptos a Votar</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-accent">{dados.biometria || 0}%</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Com Biometria</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-accent">{dados.zonas || 0}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Zonas Eleitorais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {dados.porGenero && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Distribuição por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dados.porGenero}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.genero}: ${entry.percentual?.toFixed(1) || 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {dados.porGenero.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {dados.porFaixaEtaria && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Distribuição por Faixa Etária</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dados.porFaixaEtaria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="quantidade" fill="#00D4A1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {dados.porEscolaridade && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Distribuição por Escolaridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dados.porEscolaridade} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="nivel" type="category" width={120} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="quantidade" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EleicoesEleitorado;
