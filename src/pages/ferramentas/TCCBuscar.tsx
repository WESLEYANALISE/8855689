import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Filter, GraduationCap, Building, Calendar, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TCCResult {
  id: string;
  titulo: string;
  autor: string | null;
  ano: number | null;
  instituicao: string | null;
  tipo: string | null;
  area_direito: string | null;
  resumo_original: string | null;
  link_acesso: string | null;
  fonte: string | null;
}

const AREAS_DIREITO = [
  { value: "all", label: "Todas as áreas" },
  { value: "constitucional", label: "Constitucional" },
  { value: "administrativo", label: "Administrativo" },
  { value: "civil", label: "Civil" },
  { value: "penal", label: "Penal" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributário", label: "Tributário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "ambiental", label: "Ambiental" },
  { value: "digital", label: "Digital" },
  { value: "internacional", label: "Internacional" },
  { value: "processual", label: "Processual" },
  { value: "previdenciário", label: "Previdenciário" },
  { value: "eleitoral", label: "Eleitoral" },
  { value: "consumidor", label: "Consumidor" },
  { value: "família", label: "Família" },
  { value: "outro", label: "Outro" },
];

const TIPOS_TRABALHO = [
  { value: "all", label: "Todos os tipos" },
  { value: "tcc", label: "TCC" },
  { value: "dissertacao", label: "Dissertação" },
  { value: "tese", label: "Tese" },
];

const anoAtual = new Date().getFullYear();
const ANOS = [
  { value: "all", label: "Todos os anos" },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: String(anoAtual - i),
    label: String(anoAtual - i),
  })),
];

const TCCBuscar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [palavraChave, setPalavraChave] = useState(searchParams.get("q") || "");
  const [areaDireito, setAreaDireito] = useState(searchParams.get("area") || "all");
  const [tipo, setTipo] = useState("all");
  const [ano, setAno] = useState("all");
  const [tema, setTema] = useState("all");
  const [temasDisponiveis, setTemasDisponiveis] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<TCCResult[]>([]);
  const [total, setTotal] = useState(0);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Carregar temas disponíveis do banco
  useEffect(() => {
    const carregarTemas = async () => {
      try {
        const { data, error } = await supabase
          .from("tcc_temas_sugeridos")
          .select("tema")
          .not("tema", "is", null)
          .order("tema");

        if (!error && data) {
          const temasUnicos = [...new Set(data.map(d => d.tema).filter(Boolean))];
          setTemasDisponiveis([
            { value: "all", label: "Todos os temas" },
            ...temasUnicos.map(t => ({ value: t!, label: t! }))
          ]);
        }
      } catch (err) {
        console.error("Erro ao carregar temas:", err);
      }
    };
    carregarTemas();
  }, []);

  useEffect(() => {
    if (searchParams.get("q")) {
      buscarTCCs();
    }
  }, []);

  const buscarTCCs = async (pagina = 1) => {
    if (!palavraChave.trim()) {
      toast.error("Digite uma palavra-chave para buscar");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);
    setPaginaAtual(pagina);

    try {
      const { data, error } = await supabase.functions.invoke("buscar-tcc", {
          body: {
            palavraChave: palavraChave.trim(),
            tipo: tipo === "all" ? null : tipo,
            areaDireito: areaDireito === "all" ? null : areaDireito,
            ano: ano !== "all" ? parseInt(ano) : null,
            tema: tema === "all" ? null : tema,
            pagina: pagina,
          },
      });

      if (error) throw error;

      if (data.success) {
        setResultados(data.resultados || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data.error || "Erro na busca");
      }
    } catch (error) {
      console.error("Erro ao buscar TCCs:", error);
      toast.error("Erro ao buscar trabalhos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      buscarTCCs(1);
    }
  };

  const getTipoLabel = (tipo: string | null) => {
    switch (tipo) {
      case "tcc": return "TCC";
      case "dissertacao": return "Dissertação";
      case "tese": return "Tese";
      default: return tipo || "Trabalho";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/tcc")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Buscar TCC</h1>
            <p className="text-xs text-muted-foreground">BDTD e OASIS BR</p>
          </div>
        </div>

        {/* Busca */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por tema, autor..."
                value={palavraChave}
                onChange={(e) => setPalavraChave(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-9"
              />
            </div>
            <Button onClick={() => buscarTCCs(1)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>

          {/* Filtros */}
          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={areaDireito} onValueChange={setAreaDireito}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS_DIREITO.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_TRABALHO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tema} onValueChange={setTema}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tema" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {temasDisponiveis.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros ativos */}
              {(areaDireito !== "all" || tipo !== "all" || ano !== "all" || tema !== "all") && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {areaDireito !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Área: {AREAS_DIREITO.find(a => a.value === areaDireito)?.label}
                      <button onClick={() => setAreaDireito("all")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {tipo !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Tipo: {TIPOS_TRABALHO.find(t => t.value === tipo)?.label}
                      <button onClick={() => setTipo("all")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {ano !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Ano: {ano}
                      <button onClick={() => setAno("all")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {tema !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Tema: {tema}
                      <button onClick={() => setTema("all")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 text-muted-foreground"
                    onClick={() => {
                      setAreaDireito("all");
                      setTipo("all");
                      setAno("all");
                      setTema("all");
                    }}
                  >
                    Limpar todos
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Resultados */}
        {buscaRealizada && (
          <div className="space-y-3">
            {total > 0 && (
              <p className="text-sm text-muted-foreground">
                {total} resultado{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
              </p>
            )}

            {resultados.length === 0 && !loading && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente outros termos ou ajuste os filtros
                  </p>
                </CardContent>
              </Card>
            )}

            {resultados.map((tcc) => (
              <Card
                key={tcc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/ferramentas/tcc/${tcc.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {tcc.tipo && (
                        <Badge variant="secondary" className="text-xs">
                          {getTipoLabel(tcc.tipo)}
                        </Badge>
                      )}
                      {tcc.area_direito && (
                        <Badge variant="outline" className="text-xs">
                          {tcc.area_direito}
                        </Badge>
                      )}
                    </div>
                    {tcc.fonte && (
                      <Badge variant="outline" className="text-xs uppercase">
                        {tcc.fonte}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-medium text-foreground line-clamp-3">
                    {tcc.titulo}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {tcc.autor && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>{tcc.autor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      {tcc.instituicao && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          <span>{tcc.instituicao}</span>
                        </div>
                      )}
                      {tcc.ano && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{tcc.ano}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {tcc.resumo_original && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tcc.resumo_original}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {resultados.length > 0 && total > resultados.length && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => buscarTCCs(paginaAtual + 1)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Carregar mais
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TCCBuscar;
