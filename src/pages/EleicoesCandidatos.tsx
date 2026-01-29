import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, DollarSign, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

const EleicoesCandidatos = () => {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("2024");
  const [cargo, setCargo] = useState("");
  const [estado, setEstado] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const { toast } = useToast();

  const anos = ["2024", "2022", "2020", "2018", "2016"];
  const cargos = [
    { value: "presidente", label: "Presidente" },
    { value: "governador", label: "Governador" },
    { value: "senador", label: "Senador" },
    { value: "deputado-federal", label: "Deputado Federal" },
    { value: "deputado-estadual", label: "Deputado Estadual" },
    { value: "prefeito", label: "Prefeito" },
    { value: "vereador", label: "Vereador" },
  ];

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const handleBuscar = async () => {
    if (!busca && !cargo) {
      toast({
        title: "Preencha os filtros",
        description: "Informe um nome ou selecione um cargo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-candidatos-tse",
        {
          body: { busca, ano, cargo, estado: estado === "BR" ? "" : estado },
        }
      );

      if (error) throw error;

      setCandidatos(data.candidatos || []);
      
      if (data.candidatos?.length === 0) {
        toast({
          title: "Nenhum candidato encontrado",
          description: "Tente ajustar os filtros de busca",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar candidatos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Pesquisar Candidatos</h1>
        <p className="text-sm text-muted-foreground">
          Busque candidatos por nome, número, cargo ou partido
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="busca">Nome ou Número do Candidato</Label>
            <Input
              id="busca"
              placeholder="Digite o nome ou número"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

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
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">Todos</SelectItem>
                {estados.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleBuscar} className="w-full" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Candidatos
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando candidatos no TSE..." />}

      {candidatos.length > 0 && !loading && (
        <div className="space-y-3">
          {candidatos.map((candidato, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {candidato.foto && (
                    <img 
                      src={candidato.foto} 
                      alt={candidato.nome}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-bold text-lg">{candidato.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {candidato.numero} - {candidato.partido}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-secondary rounded">
                        {candidato.cargo}
                      </span>
                      <span className="px-2 py-1 bg-secondary rounded">
                        {candidato.uf}
                      </span>
                      {candidato.situacao && (
                        <span className={`px-2 py-1 rounded ${
                          candidato.situacao === "ELEITO" 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-secondary"
                        }`}>
                          {candidato.situacao}
                        </span>
                      )}
                    </div>

                    {candidato.bens && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span>Bens declarados: {candidato.bens}</span>
                      </div>
                    )}

                    {candidato.redesSociais && (
                      <div className="flex gap-2">
                        {candidato.redesSociais.map((rede: any, i: number) => (
                          <Button key={i} variant="outline" size="sm" asChild>
                            <a href={rede.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {rede.tipo}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EleicoesCandidatos;
