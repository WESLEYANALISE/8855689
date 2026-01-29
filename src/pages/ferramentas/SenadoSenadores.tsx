import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SenadorCard } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Users, Search, ArrowLeft, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCacheFirstSenado } from "@/hooks/useCacheFirstSenado";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SenadoSenadores = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroUf, setFiltroUf] = useState<string>("");
  const [filtroPartido, setFiltroPartido] = useState<string>("");

  // Cache-first: carrega instantaneamente do IndexedDB
  const { data: senadores, isLoading, isFetchingFresh, refresh } = useCacheFirstSenado({
    cacheKey: 'senadores',
    functionName: 'buscar-senadores',
    functionBody: {},
    dataExtractor: (response) => response?.senadores || []
  });

  // Extrair partidos únicos
  const partidos = useMemo(() => {
    return [...new Set(senadores.map((s: any) => s.partido).filter(Boolean))].sort() as string[];
  }, [senadores]);

  const senadoresFiltrados = useMemo(() => {
    return senadores.filter((s: any) => {
      const matchNome = !searchTerm || 
        s.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUf = !filtroUf || filtroUf === "all" || s.uf === filtroUf;
      const matchPartido = !filtroPartido || filtroPartido === "all" || s.partido === filtroPartido;
      return matchNome && matchUf && matchPartido;
    });
  }, [senadores, searchTerm, filtroUf, filtroPartido]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ferramentas/senado')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-amber-500/20 rounded-xl p-2">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Senadores</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Carregando...' : `${senadoresFiltrados.length} senadores`}
              {isFetchingFresh && !isLoading && ' • Atualizando...'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isFetchingFresh}
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingFresh ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={filtroUf} onValueChange={setFiltroUf}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {UFS.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroPartido} onValueChange={setFiltroPartido}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Partido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {partidos.map(partido => (
                <SelectItem key={partido} value={partido}>{partido}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <SkeletonList count={10} variant="horizontal" />
        ) : (
          <div className="space-y-3">
            {senadoresFiltrados.map((senador: any, index: number) => (
              <SenadorCard key={senador.codigo} senador={senador} index={index} />
            ))}
            
            {senadoresFiltrados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum senador encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SenadoSenadores;
