import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { OrgaoCard } from "@/components/OrgaoCard";

const CamaraOrgaos = () => {
  const [sigla, setSigla] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgaos, setOrgaos] = useState<any[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    handleBuscar();
  }, []);

  const buscarComCache = async (forceRefresh = false) => {
    const chaveCache = `lista_completa_${sigla || 'todos'}`;
    
    if (!forceRefresh) {
      const { data: cache } = await supabase
        .from('cache_camara_deputados')
        .select('*')
        .eq('tipo_cache', 'orgaos')
        .eq('chave_cache', chaveCache)
        .gt('expira_em', new Date().toISOString())
        .maybeSingle();
      
      if (cache) {
        setOrgaos(Array.isArray(cache.dados) ? cache.dados : []);
        setFromCache(true);
        return;
      }
    }
    
    setFromCache(false);
    
    const { data, error } = await supabase.functions.invoke(
      "buscar-orgaos",
      { body: { sigla: sigla || undefined } }
    );

    if (error) throw error;
    
    const orgaosData = data.orgaos || [];
    setOrgaos(orgaosData);
    
    await supabase
      .from('cache_camara_deputados')
      .upsert({
        tipo_cache: 'orgaos',
        chave_cache: chaveCache,
        dados: orgaosData,
        total_registros: orgaosData.length,
        expira_em: new Date(Date.now() + 24*60*60*1000).toISOString()
      }, {
        onConflict: 'tipo_cache,chave_cache'
      });
  };

  const handleBuscar = async (forceRefresh = false) => {
    setLoading(true);
    try {
      await buscarComCache(forceRefresh);
      
      if (orgaos.length === 0) {
        toast({
          title: "Nenhum órgão encontrado",
          description: "Tente ajustar os filtros",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Órgãos e Comissões</h1>
        <p className="text-sm text-muted-foreground">Comissões permanentes e temporárias</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Órgãos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla (Opcional)</Label>
            <Input
              id="sigla"
              placeholder="Ex: CCJC"
              value={sigla}
              onChange={(e) => setSigla(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleBuscar(false)} className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Buscar Órgãos
            </Button>
            <Button 
              onClick={() => handleBuscar(true)} 
              variant="outline" 
              size="icon"
              disabled={loading}
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {fromCache && (
            <p className="text-xs text-muted-foreground text-center">
              📦 Dados em cache (atualizados nas últimas 24h)
            </p>
          )}
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando órgãos..." />}

      {orgaos.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{orgaos.length} órgão(s) encontrado(s)</p>
          {orgaos.map((orgao) => (
            <OrgaoCard key={orgao.id} orgao={orgao} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraOrgaos;
