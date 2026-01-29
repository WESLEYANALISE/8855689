import { useState } from "react";
import { ArrowLeft, Search, Loader2, Newspaper, Calendar, ExternalLink, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublicacaoDOU {
  id: string;
  titulo: string;
  secao: string;
  data_publicacao: string;
  orgao: string;
  tipo_ato: string;
  ementa: string;
  url: string;
}

const SECOES_DOU = [
  { value: "todas", label: "Todas as Seções" },
  { value: "1", label: "Seção 1 - Atos Normativos" },
  { value: "2", label: "Seção 2 - Pessoal" },
  { value: "3", label: "Seção 3 - Contratos e Licitações" },
];

const AdvogadoDiarioOficial = () => {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [secao, setSecao] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicacoes, setPublicacoes] = useState<PublicacaoDOU[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const buscarDOU = async () => {
    if (!termo.trim()) {
      toast.error("Digite um termo para buscar");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);

    try {
      const { data, error } = await supabase.functions.invoke("buscar-dou", {
        body: {
          termo: termo.trim(),
          secao: secao === "todas" ? undefined : secao,
          dataInicio: dataInicio || undefined
        }
      });

      if (error) throw error;

      if (data?.publicacoes) {
        setPublicacoes(data.publicacoes);
      } else {
        setPublicacoes([]);
      }
    } catch (error) {
      console.error("Erro ao buscar DOU:", error);
      toast.error("Erro ao buscar no Diário Oficial. Tente novamente.");
      setPublicacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const getSecaoBadgeColor = (secao: string) => {
    switch (secao) {
      case "1": return "bg-blue-500/20 text-blue-400";
      case "2": return "bg-green-500/20 text-green-400";
      case "3": return "bg-orange-500/20 text-orange-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
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
            <h1 className="text-xl font-bold">Diário Oficial da União</h1>
            <p className="text-sm text-muted-foreground">Busque publicações no DOU</p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Buscar por termo, nome, CNPJ..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarDOU()}
                className="md:col-span-2"
              />
              <Select value={secao} onValueChange={setSecao}>
                <SelectTrigger>
                  <SelectValue placeholder="Seção" />
                </SelectTrigger>
                <SelectContent>
                  {SECOES_DOU.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                placeholder="Data início"
              />
            </div>
            <Button onClick={buscarDOU} disabled={loading} className="w-full md:w-auto gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar no DOU
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : publicacoes.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {publicacoes.length} publicação(ões) encontrada(s)
            </p>
            {publicacoes.map((pub, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-tight">{pub.titulo}</CardTitle>
                    <Badge className={getSecaoBadgeColor(pub.secao)}>
                      Seção {pub.secao}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{pub.data_publicacao}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{pub.tipo_ato}</span>
                    </div>
                    {pub.orgao && (
                      <div className="flex items-center gap-1.5">
                        <Newspaper className="w-4 h-4 text-muted-foreground" />
                        <span>{pub.orgao}</span>
                      </div>
                    )}
                  </div>
                  
                  {pub.ementa && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {pub.ementa}
                    </p>
                  )}

                  {pub.url && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={pub.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Ver publicação completa
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
              <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma publicação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos ou altere os filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Busque publicações no Diário Oficial da União</p>
              <p className="text-sm text-muted-foreground mt-1">
                Encontre atos normativos, nomeações, contratos e licitações
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvogadoDiarioOficial;
