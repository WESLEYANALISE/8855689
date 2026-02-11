import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, MapPin, Calendar, Loader2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  buscarPorTema, 
  buscarCidades,
  Gazette, 
  City,
  formatDate,
  TEMAS_DISPONIVEIS
} from "@/lib/api/queridoDiarioApi";

const BuscaPorTema = () => {
  const navigate = useNavigate();
  
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [cities, setCities] = useState<City[]>([]);
  const [results, setResults] = useState<Gazette[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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
    if (!selectedTheme) {
      toast.error("Selecione um tema");
      return;
    }

    setIsSearching(true);
    try {
      const params: any = {
        theme: selectedTheme,
        size: 50,
      };

      if (selectedCity) params.territory_ids = [selectedCity.territory_id];
      if (dateFrom) params.published_since = dateFrom;
      if (dateTo) params.published_until = dateTo;

      const response = await buscarPorTema(params);
      setResults(response.gazettes || []);
      setTotalResults(response.total_gazettes || 0);
      
      if (response.gazettes?.length === 0) {
        toast.info("Nenhum resultado encontrado");
      } else {
        toast.success(`${response.total_gazettes} resultados encontrados`);
      }
    } catch (error: any) {
      console.error("Erro na busca:", error);
      toast.error(error.message || "Erro ao buscar por tema");
    } finally {
      setIsSearching(false);
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
              <Tag className="h-5 w-5 text-primary" />
              Busca por Tema
            </h1>
            <p className="text-sm text-muted-foreground">
              Licitações, nomeações, educação e mais
            </p>
          </div>
        </div>

        {/* Seleção de Tema */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TEMAS_DISPONIVEIS.map((tema) => (
            <button
              key={tema.slug}
              onClick={() => setSelectedTheme(tema.slug)}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedTheme === tema.slug
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-muted/50'
              }`}
            >
              <span className="text-2xl block mb-1">{tema.icon}</span>
              <span className="text-sm font-medium">{tema.nome}</span>
            </button>
          ))}
        </div>

        {/* Filtros Adicionais */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Cidade */}
            <div className="space-y-2 relative">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Município (opcional)
              </Label>
              <Input
                placeholder="Digite o nome da cidade..."
                value={citySearch}
                onChange={(e) => handleCitySearch(e.target.value)}
              />
              {isSearchingCities && (
                <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              
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

            {/* Botão */}
            <Button
              onClick={handleSearch}
              disabled={isSearching || !selectedTheme}
              className="w-full"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Tag className="h-4 w-4 mr-2" />
              )}
              Buscar por Tema
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">
              Resultados ({totalResults.toLocaleString()})
            </h2>

            <ScrollArea className="h-[calc(100vh-520px)]">
              <div className="space-y-3">
                {results.map((gazette, index) => (
                  <Card key={`${gazette.territory_id}-${gazette.date}-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{gazette.territory_name}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {gazette.state_code}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(gazette.date)}
                            {gazette.edition_number && ` • Edição ${gazette.edition_number}`}
                          </p>
                          {gazette.excerpts?.[0] && (
                            <div className="text-sm mt-2 bg-muted/50 p-2 rounded">
                              <p className="line-clamp-3" dangerouslySetInnerHTML={{ 
                                __html: sanitizeHtml(gazette.excerpts[0].replace(/<\/?em>/g, (m) => m === '<em>' ? '<mark class="bg-yellow-200 dark:bg-yellow-800">' : '</mark>'))
                              }} />
                            </div>
                          )}
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
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Selecione um tema acima para buscar publicações
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscaPorTema;
