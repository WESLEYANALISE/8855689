import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Search, Loader2, FileText, ExternalLink, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  buscarCidades, 
  detalhesCidade,
  buscarDiarios,
  City,
  Gazette,
  formatDate
} from "@/lib/api/queridoDiarioApi";

const ExplorarCidades = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityDetails, setCityDetails] = useState<City | null>(null);
  const [recentGazettes, setRecentGazettes] = useState<Gazette[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      toast.error("Digite pelo menos 2 caracteres");
      return;
    }

    setIsSearching(true);
    setSelectedCity(null);
    setCityDetails(null);
    
    try {
      const response = await buscarCidades(searchTerm);
      setCities(response.cities || []);
      
      if (response.cities?.length === 0) {
        toast.info("Nenhuma cidade encontrada");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao buscar cidades");
    } finally {
      setIsSearching(false);
    }
  };

  const selectCity = async (city: City) => {
    setSelectedCity(city);
    setIsLoadingDetails(true);

    try {
      // Buscar detalhes e últimos diários em paralelo
      const [details, gazettesResponse] = await Promise.all([
        detalhesCidade(city.territory_id),
        buscarDiarios({
          territory_ids: [city.territory_id],
          size: 10,
          sort_by: 'descending_date'
        })
      ]);

      setCityDetails(details);
      setRecentGazettes(gazettesResponse.gazettes || []);
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar detalhes da cidade");
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
              <MapPin className="h-5 w-5 text-primary" />
              Explorar Cidades
            </h1>
            <p className="text-sm text-muted-foreground">
              Veja a cobertura de diários por município
            </p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Digite o nome da cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cidades */}
        {cities.length > 0 && !selectedCity && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">
              Cidades Encontradas ({cities.length})
            </h2>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cities.map((city) => (
                  <Card 
                    key={city.territory_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => selectCity(city)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-primary/50" />
                        <div>
                          <p className="font-semibold">{city.territory_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {city.state_code}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Detalhes da Cidade */}
        {selectedCity && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCity(null)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {selectedCity.territory_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Estado</p>
                        <p className="font-medium">{selectedCity.state_code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Código IBGE</p>
                        <p className="font-mono">{selectedCity.territory_id}</p>
                      </div>
                    </div>
                    
                    {cityDetails?.publication_urls && cityDetails.publication_urls.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Fontes de Publicação</p>
                        <div className="flex flex-wrap gap-2">
                          {cityDetails.publication_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Fonte {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Últimos Diários */}
                <div className="space-y-3">
                  <h2 className="font-semibold text-foreground">
                    Últimas Publicações
                  </h2>
                  
                  {recentGazettes.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {recentGazettes.map((gazette, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium">
                                      {formatDate(gazette.date)}
                                      {gazette.edition_number && ` • Ed. ${gazette.edition_number}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {gazette.is_extra_edition ? 'Edição Extra' : 'Edição Ordinária'}
                                    </p>
                                  </div>
                                </div>
                                {gazette.file_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(gazette.file_url, "_blank")}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma publicação encontrada para esta cidade
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && cities.length === 0 && !selectedCity && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Busque uma cidade para ver sua cobertura de diários oficiais
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorarCidades;
