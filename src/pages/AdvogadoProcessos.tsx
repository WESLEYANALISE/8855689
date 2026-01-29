import { useState } from "react";
import { ArrowLeft, Search, Loader2, FileText, Calendar, Building2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Processo {
  numeroProcesso: string;
  tribunal: string;
  classe: string;
  assunto: string;
  dataAjuizamento: string;
  orgaoJulgador: string;
  movimentos: Array<{
    data: string;
    descricao: string;
  }>;
}

const TRIBUNAIS = [
  { value: "todos", label: "Todos os Tribunais" },
  { value: "TJSP", label: "TJSP - Tribunal de Justiça de São Paulo" },
  { value: "TJRJ", label: "TJRJ - Tribunal de Justiça do Rio de Janeiro" },
  { value: "TJMG", label: "TJMG - Tribunal de Justiça de Minas Gerais" },
  { value: "TRF1", label: "TRF1 - Tribunal Regional Federal 1ª Região" },
  { value: "TRF3", label: "TRF3 - Tribunal Regional Federal 3ª Região" },
  { value: "STJ", label: "STJ - Superior Tribunal de Justiça" },
  { value: "STF", label: "STF - Supremo Tribunal Federal" },
];

const AdvogadoProcessos = () => {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [tribunal, setTribunal] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const buscarProcessos = async () => {
    if (!termo.trim()) {
      toast.error("Digite um número de processo ou nome da parte");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("buscar-jurisprudencia-datajud", {
        body: { 
          termo: termo.trim(),
          tribunal: tribunal === "todos" ? undefined : tribunal,
          pagina: 1,
          tamanho: 20
        }
      });

      if (error) throw error;
      
      if (data?.resultados) {
        setProcessos(data.resultados.map((item: any) => ({
          numeroProcesso: item.numeroProcesso || item.numero || "N/A",
          tribunal: item.tribunal || tribunal,
          classe: item.classe || item.classeProcessual || "N/A",
          assunto: item.assunto || item.ementa?.substring(0, 200) || "N/A",
          dataAjuizamento: item.dataAjuizamento || item.dataPublicacao || "N/A",
          orgaoJulgador: item.orgaoJulgador || item.relator || "N/A",
          movimentos: item.movimentos || []
        })));
      } else {
        setProcessos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      toast.error("Erro ao buscar processos. Tente novamente.");
      setProcessos([]);
    } finally {
      setLoading(false);
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
            <h1 className="text-xl font-bold">Consultar Processos</h1>
            <p className="text-sm text-muted-foreground">Busque processos em tribunais brasileiros</p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Número do processo ou nome da parte..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarProcessos()}
                className="flex-1"
              />
              <Select value={tribunal} onValueChange={setTribunal}>
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Selecione o tribunal" />
                </SelectTrigger>
                <SelectContent>
                  {TRIBUNAIS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={buscarProcessos} disabled={loading} className="gap-2">
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
        ) : processos.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {processos.length} processo(s) encontrado(s)
            </p>
            {processos.map((processo, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {processo.numeroProcesso}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tribunal:</span>
                      <span>{processo.tribunal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Data:</span>
                      <span>{processo.dataAjuizamento}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Órgão:</span>
                      <span>{processo.orgaoJulgador}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Classe:</span>
                      <span>{processo.classe}</span>
                    </div>
                  </div>
                  {processo.assunto !== "N/A" && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {processo.assunto}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : buscaRealizada ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum processo encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos ou selecione um tribunal específico
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Digite um termo para buscar processos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você pode buscar por número do processo ou nome da parte
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvogadoProcessos;
