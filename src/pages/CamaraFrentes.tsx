import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { FrenteCard } from "@/components/FrenteCard";

const CamaraFrentes = () => {
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [frentes, setFrentes] = useState<any[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    handleBuscar();
  }, []);

  const buscarComCache = async (forceRefresh = false) => {
    const chaveCache = `lista_completa_${keywords || 'todos'}`;
    
    if (!forceRefresh) {
      const { data: cache } = await supabase
        .from('cache_camara_deputados')
        .select('*')
        .eq('tipo_cache', 'frentes')
        .eq('chave_cache', chaveCache)
        .gt('expira_em', new Date().toISOString())
        .maybeSingle();
      
      if (cache) {
        setFrentes(Array.isArray(cache.dados) ? cache.dados : []);
        setFromCache(true);
        return;
      }
    }
    
    setFromCache(false);
    
    const { data, error } = await supabase.functions.invoke(
      "buscar-frentes",
      { body: { idLegislatura: 57, keywords: keywords || undefined } }
    );

    if (error) throw error;
    
    const frentesData = data.frentes || [];
    setFrentes(frentesData);
    
    await supabase
      .from('cache_camara_deputados')
      .upsert({
        tipo_cache: 'frentes',
        chave_cache: chaveCache,
        dados: frentesData,
        total_registros: frentesData.length,
        expira_em: new Date(Date.now() + 24*60*60*1000).toISOString()
      }, {
        onConflict: 'tipo_cache,chave_cache'
      });
  };

  const handleBuscar = async (forceRefresh = false) => {
    setLoading(true);
    try {
      await buscarComCache(forceRefresh);
      
      if (frentes.length === 0) {
        toast({
          title: "Nenhuma frente encontrada",
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
        <h1 className="text-xl md:text-2xl font-bold mb-1">Frentes Parlamentares</h1>
        <p className="text-sm text-muted-foreground">Frentes temáticas da Câmara</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Frentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave (Opcional)</Label>
            <Input
              id="keywords"
              placeholder="Ex: educação, saúde..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleBuscar(false)} className="flex-1 bg-rose-600 hover:bg-rose-700" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Buscar Frentes
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

      {loading && <ContentGenerationLoader message="Buscando frentes..." />}

      {frentes.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{frentes.length} frente(s) encontrada(s)</p>
          {frentes.map((frente) => (
            <FrenteCard key={frente.id} frente={frente} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraFrentes;
