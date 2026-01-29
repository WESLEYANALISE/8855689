import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstagioCard } from "@/components/EstagioCard";
import { EstagiosFiltrosHorizontal } from "@/components/EstagiosFiltrosHorizontal";
import { EstagioSearchBar } from "@/components/EstagioSearchBar";
import { Button } from "@/components/ui/button";
import { Briefcase, Lightbulb, BookOpen, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EstagioVaga } from "@/types/database.types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Estagios() {
  const navigate = useNavigate();
  const [vagas, setVagas] = useState<EstagioVaga[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todos");
  const [selectedEstado, setSelectedEstado] = useState("Todos");
  const [selectedTipo, setSelectedTipo] = useState("Todos");
  const [activeTab, setActiveTab] = useState("todas");
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    fetchVagas();
    fetchFavoritos();
    handleUsarLocalizacao(); // Buscar vagas próximas automaticamente
  }, []);

  const fetchVagas = async () => {
    try {
      const { data, error } = await supabase
        .from('estagios_vagas')
        .select('*')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false });

      if (error) throw error;
      setVagas(data || []);
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      toast.error("Erro ao carregar vagas");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoritos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('estagios_favoritos')
      .select('vaga_id')
      .eq('user_id', user.id);

    if (data) {
      setFavoritos(data.map(f => f.vaga_id));
    }
  };

  const filteredVagas = vagas.filter(vaga => {
    const matchSearch = 
      vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.local?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchArea = selectedArea === "Todos" || vaga.area_direito === selectedArea;
    const matchEstado = selectedEstado === "Todos" || vaga.estado === selectedEstado;
    const matchTipo = selectedTipo === "Todos" || vaga.tipo_vaga === selectedTipo;
    const matchTab = activeTab === "todas" || 
                     (activeTab === "favoritas" && favoritos.includes(vaga.id));

    return matchSearch && matchArea && matchEstado && matchTipo && matchTab;
  });

  const clearFilters = () => {
    setSelectedArea("Todos");
    setSelectedEstado("Todos");
    setSelectedTipo("Todos");
    setSearchTerm("");
  };

  const handleUsarLocalizacao = async () => {
    setLoadingGeo(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocalização não suportada pelo navegador");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Buscar vagas próximas via Adzuna
          const { data, error } = await supabase.functions.invoke('buscar-vagas-adzuna', {
            body: {
              keywords: 'direito OR advogado OR jurídico OR estagiário direito OR "estágio direito" OR "escritório advocacia"',
              latitude,
              longitude,
              page: 1,
              resultsPerPage: 50
            }
          });

          if (error) throw error;

          if (data?.vagas && data.vagas.length > 0) {
            // Adicionar vagas do Adzuna às vagas existentes
            const vagasComProximidade = data.vagas.map((v: any) => ({
              ...v,
              proximaAVoce: true
            }));
            setVagas(prev => [...vagasComProximidade, ...prev]);
            toast.success(`${data.vagas.length} vagas próximas encontradas!`);
          } else {
            toast.info("Nenhuma vaga próxima encontrada");
          }
        },
        (error) => {
          console.error('Erro de geolocalização:', error);
          toast.error("Não foi possível acessar sua localização");
        }
      );
    } catch (error) {
      console.error('Erro ao buscar vagas próximas:', error);
      toast.error("Erro ao buscar vagas próximas");
    } finally {
      setLoadingGeo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky padronizado */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10">
              <Briefcase className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">Estágios em Direito</h1>
              <p className="text-muted-foreground text-sm">Oportunidades exclusivas para estudantes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Botões de ação */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate("/estagios/dicas")} variant="outline" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Dicas para Estágio
          </Button>
          <Button onClick={() => navigate("/estagios/blog")} variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Blog de Estágios
          </Button>
        </div>

        {/* Filtros Horizontais - TOPO */}
        <EstagiosFiltrosHorizontal
          selectedArea={selectedArea}
          selectedEstado={selectedEstado}
          selectedTipo={selectedTipo}
          onAreaChange={setSelectedArea}
          onEstadoChange={setSelectedEstado}
          onTipoChange={setSelectedTipo}
          onClearFilters={clearFilters}
          onUsarLocalizacao={handleUsarLocalizacao}
          loadingGeo={loadingGeo}
          totalResultados={filteredVagas.length}
        />

        {/* Search */}
        <EstagioSearchBar value={searchTerm} onChange={setSearchTerm} />

        {/* Content */}
        <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="todas" className="flex-1">
                  Todas ({vagas.length})
                </TabsTrigger>
                <TabsTrigger value="favoritas" className="flex-1">
                  Favoritas ({favoritos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todas" className="space-y-4 mt-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))
                ) : filteredVagas.length > 0 ? (
                  filteredVagas.map((vaga) => (
                    <EstagioCard
                      key={vaga.id}
                      vaga={vaga}
                      isFavorited={favoritos.includes(vaga.id)}
                      onFavoriteChange={fetchFavoritos}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Tente ajustar os filtros de busca
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favoritas" className="space-y-4 mt-6">
                {filteredVagas.filter(v => favoritos.includes(v.id)).length > 0 ? (
                  filteredVagas.filter(v => favoritos.includes(v.id)).map((vaga) => (
                    <EstagioCard
                      key={vaga.id}
                      vaga={vaga}
                      isFavorited={true}
                      onFavoriteChange={fetchFavoritos}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma vaga favoritada</h3>
                    <p className="text-muted-foreground">
                      Favorite vagas para acessá-las rapidamente depois
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
