import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DeputadoCard } from "@/components/DeputadoCard";
import { useNavigate } from "react-router-dom";
import { useGenericCache } from "@/hooks/useGenericCache";

const CamaraDeputadosLista = () => {
  const [nome, setNome] = useState("");
  const [siglaUf, setSiglaUf] = useState("");
  const [siglaPartido, setSiglaPartido] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const cacheKey = `deputados-lista-${siglaUf || 'todos'}-${siglaPartido || 'todos'}-${nome || 'todos'}`;

  const { data: deputados, isLoading, isFetching, isStale, refresh } = useGenericCache<any[]>({
    cacheKey,
    fetchFn: async () => {
      // Verificar cache no Supabase primeiro
      const { data: cache } = await supabase
        .from('cache_camara_deputados')
        .select('*')
        .eq('tipo_cache', 'deputados')
        .eq('chave_cache', cacheKey)
        .gt('expira_em', new Date().toISOString())
        .maybeSingle();
      
      if (cache) {
        return Array.isArray(cache.dados) ? cache.dados : [];
      }
      
      // Buscar da API
      const { data, error } = await supabase.functions.invoke(
        "buscar-deputados",
        {
          body: { 
            nome, 
            siglaUf: siglaUf === "todos" ? undefined : siglaUf, 
            siglaPartido: siglaPartido || undefined,
            idLegislatura: 57
          },
        }
      );

      if (error) throw error;

      const deputadosData = data.deputados || [];
      
      // Salvar no cache
      await supabase
        .from('cache_camara_deputados')
        .upsert({
          tipo_cache: 'deputados',
          chave_cache: cacheKey,
          dados: deputadosData,
          total_registros: deputadosData.length,
          expira_em: new Date(Date.now() + 24*60*60*1000).toISOString()
        }, {
          onConflict: 'tipo_cache,chave_cache'
        });

      return deputadosData;
    },
  });

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const handleBuscar = () => {
    refresh();
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Limpar cache do Supabase
      await supabase
        .from('cache_camara_deputados')
        .delete()
        .eq('tipo_cache', 'deputados')
        .eq('chave_cache', cacheKey);
      
      refresh();
      toast({
        title: "Dados atualizados",
        description: "Lista de deputados atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Deputados Federais</h1>
        <p className="text-sm text-muted-foreground">
          Lista completa de deputados em exercício
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Deputados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Deputado</Label>
            <Input
              id="nome"
              placeholder="Digite o nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Select value={siglaUf} onValueChange={setSiglaUf}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {estados.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Partido</Label>
              <Input
                placeholder="Ex: PT, PL..."
                value={siglaPartido}
                onChange={(e) => setSiglaPartido(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBuscar} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading || isFetching}>
              <Search className="w-4 h-4 mr-2" />
              Buscar Deputados
            </Button>
            <Button 
              onClick={handleForceRefresh} 
              variant="outline" 
              size="icon"
              disabled={isLoading || isFetching || isRefreshing}
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isStale && (
            <p className="text-xs text-muted-foreground text-center">
              📦 Dados em cache (atualizados nas últimas 24h)
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        </div>
      )}

      {(deputados || []).length > 0 && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {(deputados || []).length} deputado(s) encontrado(s)
          </p>
          {(deputados || []).map((deputado: any) => (
            <DeputadoCard 
              key={deputado.id} 
              deputado={deputado}
              onClick={() => navigate(`/camara-deputados/deputado/${deputado.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraDeputadosLista;
