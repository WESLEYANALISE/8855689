import { useState } from "react";
import { ArrowLeft, Search, Loader2, Scale, Building2, FileText, ExternalLink, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Jurisprudencia {
  id: string;
  tribunal: string;
  numero_processo: string;
  classe: string;
  relator: string;
  data_julgamento: string;
  data_publicacao: string;
  ementa: string;
  link?: string;
}

const TRIBUNAIS = [
  { value: "datajud", label: "DataJud (Todos os tribunais)", icon: "⚖️" },
  { value: "tjsp", label: "TJSP - São Paulo", icon: "🏛️" },
  { value: "stj", label: "STJ - Superior Tribunal de Justiça", icon: "🏛️" },
  { value: "corpus927", label: "Corpus 927 (Precedentes)", icon: "📚" },
];

const AdvogadoJurisprudencia = () => {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [tribunal, setTribunal] = useState("datajud");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<Jurisprudencia[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const buscarJurisprudencia = async () => {
    if (!termo.trim()) {
      toast.error("Digite um termo para buscar");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);

    try {
      let functionName = "buscar-jurisprudencia-datajud";
      let body: any = { termo: termo.trim(), pagina: 1, tamanho: 20 };

      switch (tribunal) {
        case "tjsp":
          functionName = "buscar-jurisprudencia-esaj";
          body = { termo: termo.trim() };
          break;
        case "corpus927":
          functionName = "buscar-jurisprudencia-corpus927";
          body = { termo: termo.trim() };
          break;
        case "stj":
          functionName = "buscar-jurisprudencia-datajud";
          body = { termo: termo.trim(), tribunal: "STJ", pagina: 1, tamanho: 20 };
          break;
        default:
          functionName = "buscar-jurisprudencia-datajud";
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      // Normalizar resultados de diferentes fontes
      let normalizedResults: Jurisprudencia[] = [];

      if (data?.resultados) {
        normalizedResults = data.resultados.map((item: any) => ({
          id: item.id || item.numeroProcesso || Math.random().toString(),
          tribunal: item.tribunal || tribunal.toUpperCase(),
          numero_processo: item.numeroProcesso || item.numero || "N/A",
          classe: item.classe || item.classeProcessual || "N/A",
          relator: item.relator || item.orgaoJulgador || "N/A",
          data_julgamento: item.dataJulgamento || item.data || "N/A",
          data_publicacao: item.dataPublicacao || "N/A",
          ementa: item.ementa || item.resumo || "N/A",
          link: item.link || item.url
        }));
      } else if (data?.items || Array.isArray(data)) {
        const items = data.items || data;
        normalizedResults = items.map((item: any) => ({
          id: item.id || Math.random().toString(),
          tribunal: item.tribunal || tribunal.toUpperCase(),
          numero_processo: item.numeroProcesso || item.numero || "N/A",
          classe: item.classe || "N/A",
          relator: item.relator || "N/A",
          data_julgamento: item.dataJulgamento || item.data || "N/A",
          data_publicacao: item.dataPublicacao || "N/A",
          ementa: item.ementa || item.resumo || "N/A",
          link: item.link || item.url
        }));
      }

      setResultados(normalizedResults);
    } catch (error) {
      console.error("Erro ao buscar jurisprudência:", error);
      toast.error("Erro ao buscar jurisprudência. Tente novamente.");
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const getTribunalBadgeColor = (trib: string) => {
    const colors: Record<string, string> = {
      "STF": "bg-purple-500/20 text-purple-400",
      "STJ": "bg-blue-500/20 text-blue-400",
      "TJSP": "bg-green-500/20 text-green-400",
      "TRF": "bg-orange-500/20 text-orange-400",
      "TST": "bg-red-500/20 text-red-400",
    };
    
    for (const [key, value] of Object.entries(colors)) {
      if (trib.includes(key)) return value;
    }
    return "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-4 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Jurisprudência</h1>
            <p className="text-sm text-muted-foreground">Busque decisões em tribunais brasileiros</p>
          </div>
        </div>

        {/* Fontes de Busca */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TRIBUNAIS.map((t) => (
                <Button
                  key={t.value}
                  variant={tribunal === t.value ? "default" : "outline"}
                  onClick={() => setTribunal(t.value)}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs text-center leading-tight">{t.label}</span>
                </Button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Digite palavras-chave, número do processo, ou tema jurídico..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarJurisprudencia()}
                className="flex-1"
              />
              <Button onClick={buscarJurisprudencia} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : resultados.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {resultados.length} resultado(s) encontrado(s)
            </p>
            {resultados.map((item, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">{item.numero_processo}</CardTitle>
                    </div>
                    <Badge className={getTribunalBadgeColor(item.tribunal)}>
                      {item.tribunal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Classe:</span>
                      <span>{item.classe}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Relator:</span>
                      <span className="truncate">{item.relator}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Data:</span>
                      <span>{item.data_julgamento}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {item.ementa}
                    </p>
                  </div>

                  {item.link && (
                    <Button variant="outline" size="sm" asChild className="gap-2 mt-2">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Ver inteiro teor
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : buscaRealizada ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma jurisprudência encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos ou selecione outro tribunal
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione uma fonte e busque jurisprudência</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pesquise por tema, número de processo ou palavras-chave
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvogadoJurisprudencia;
