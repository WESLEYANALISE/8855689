import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, MapPin, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { buscarDiarios, buscarCidades, Gazette, City, formatDate } from "@/lib/api/queridoDiarioApi";

const BuscaDiarios = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [cities, setCities] = useState<City[]>([]);
  const [results, setResults] = useState<Gazette[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [isSearchingDiarios, setIsSearchingDiarios] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const handleCitySearch = async (term: string) => {
    setCitySearch(term);
    if (term.length < 3) {
      setCities([]);
      setShowCityDropdown(false);
      return;
    }

    setIsSearchingCities(true);
    try {
      const response = await buscarCidades(term);
      setCities(response.cities || []);
      setShowCityDropdown(true);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    } finally {
      setIsSearchingCities(false);
    }
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setCitySearch(`${city.territory_name} - ${city.state_code}`);
    setShowCityDropdown(false);
  };

  const handleSearch = async () => {
    if (!searchTerm && !selectedCity) {
      toast.error("Informe um termo de busca ou selecione uma cidade");
      return;
    }

    setIsSearchingDiarios(true);
    try {
      const params: any = {
        size: 50,
        sort_by: 'descending_date'
      };

      if (searchTerm) params.querystring = searchTerm;
      if (selectedCity) params.territory_ids = [selectedCity.territory_id];
      if (dateFrom) params.published_since = dateFrom;
      if (dateTo) params.published_until = dateTo;

      const response = await buscarDiarios(params);
      setResults(response.gazettes || []);
      setTotalResults(response.total_gazettes || 0);
      
      if (response.gazettes?.length === 0) {
        toast.info("Nenhum resultado encontrado");
      } else {
        toast.success(`${response.total_gazettes} resultados encontrados`);
      }
    } catch (error: any) {
      console.error("Erro na busca:", error);
      toast.error(error.message || "Erro ao buscar diários");
    } finally {
      setIsSearchingDiarios(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCitySearch("");
    setSelectedCity(null);
    setDateFrom("");
    setDateTo("");
    setResults([]);
    setTotalResults(0);
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
              <Search className="h-5 w-5 text-primary" />
              Busca em Diários
            </h1>
            <p className="text-sm text-muted-foreground">
              Pesquise publicações oficiais
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Termo de busca */}
            <div className="space-y-2">
              <Label>Termo de busca</Label>
              <Input
                placeholder="Ex: licitação, nomeação, contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Cidade */}
            <div className="space-y-2 relative">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Município
              </Label>
              <Input
                placeholder="Digite o nome da cidade..."
                value={citySearch}
                onChange={(e) => handleCitySearch(e.target.value)}
              />
              {isSearchingCities && (
                <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              
              {/* Dropdown de cidades */}
              {showCityDropdown && cities.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {cities.map((city) => (
                    <button
                      key={city.territory_id}
                      onClick={() => selectCity(city)}
                      className="w-full px-4 py-2 text-left hover:bg-muted/50 text-sm"
                    >
                      <span className="font-medium">{city.territory_name}</span>
                      <span className="text-muted-foreground ml-2">- {city.state_code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  De
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={handleSearch}
                disabled={isSearchingDiarios}
                className="flex-1"
              >
                {isSearchingDiarios ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
              <Button variant="outline" onClick={clearSearch}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                Resultados ({totalResults.toLocaleString()})
              </h2>
            </div>

            <ScrollArea className="h-[calc(100vh-480px)]">
              <div className="space-y-3">
                {results.map((gazette, index) => (
                  <Card key={`${gazette.territory_id}-${gazette.date}-${index}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold text-foreground truncate">
                              {gazette.territory_name}
                            </span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {gazette.state_code}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatDate(gazette.date)}
                            {gazette.edition_number && ` • Edição ${gazette.edition_number}`}
                            {gazette.is_extra_edition && " • Extra"}
                          </p>

                          {gazette.excerpts && gazette.excerpts.length > 0 && (
                            <div className="text-sm text-foreground/80 bg-muted/50 p-2 rounded">
                              <p className="line-clamp-3" dangerouslySetInnerHTML={{ 
                                __html: sanitizeHtml(gazette.excerpts[0].replace(/<\/?em>/g, (m) => m === '<em>' ? '<mark class="bg-yellow-200 dark:bg-yellow-800">' : '</mark>'))
                              }} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {gazette.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(gazette.file_url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {gazette.txt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(gazette.txt_url, "_blank")}
                              title="Ver texto"
                            >
                              TXT
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty State */}
        {!isSearchingDiarios && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Use os filtros acima para buscar em diários oficiais
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscaDiarios;
