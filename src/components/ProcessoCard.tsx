import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, FileText, Users, Lightbulb, Loader2 } from "lucide-react";
import ProcessoDetalhes from "./ProcessoDetalhes";
import ExplicacaoProcessoModal from "./ExplicacaoProcessoModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Processo {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataAjuizamento: string;
  classeProcessual: string;
  assunto: string;
  situacao: string;
  partes: Array<{
    nome: string;
    tipo: string;
  }>;
  tipoParticipacao?: string;
}

interface ProcessoCardProps {
  processo: Processo;
}

const ProcessoCard = ({ processo }: ProcessoCardProps) => {
  const [explicacao, setExplicacao] = useState("");
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const { toast } = useToast();

  const explicarProcesso = async () => {
    setLoadingExplicacao(true);
    try {
      const { data, error } = await supabase.functions.invoke("explicar-processo", {
        body: {
          numeroProcesso: processo.numeroProcesso,
          classeProcessual: processo.classeProcessual,
          assunto: processo.assunto,
          tribunal: processo.tribunal,
        },
      });

      if (error) throw error;

      if (data?.explicacao) {
        setExplicacao(data.explicacao);
        setMostrarExplicacao(true);
      }
    } catch (error: any) {
      console.error("Erro ao explicar processo:", error);
      toast({
        title: "Erro ao gerar explicação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoadingExplicacao(false);
    }
  };

  const getTipoParticipacaoBadge = () => {
    if (!processo.tipoParticipacao) return null;
    
    const variant = processo.tipoParticipacao.toLowerCase().includes("autor") 
      ? "default" 
      : "destructive";
    
    return (
      <Badge variant={variant} className="ml-2">
        {processo.tipoParticipacao}
      </Badge>
    );
  };

  return (
    <>
      <Card className="bg-card border-border hover:border-accent/50 transition-all">
        <CardHeader>
          <CardTitle className="text-lg flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-accent">{processo.numeroProcesso}</span>
                {getTipoParticipacaoBadge()}
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {processo.classeProcessual}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Tribunal</p>
                <p className="font-medium">{processo.tribunal}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Data Ajuizamento</p>
                <p className="font-medium">{processo.dataAjuizamento || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Órgão Julgador</p>
                <p className="font-medium">{processo.orgaoJulgador}</p>
              </div>
            </div>

            {processo.situacao && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Situação</p>
                  <p className="font-medium">{processo.situacao}</p>
                </div>
              </div>
            )}
          </div>

          {processo.assunto && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Assunto</p>
              <p className="text-sm">{processo.assunto}</p>
            </div>
          )}

          {processo.partes && processo.partes.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-accent" />
                <p className="text-xs text-muted-foreground">Partes</p>
              </div>
              <div className="space-y-1">
                {processo.partes.slice(0, 3).map((parte, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {parte.tipo}
                    </Badge>
                    <span>{parte.nome}</span>
                  </div>
                ))}
                {processo.partes.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {processo.partes.length - 3} parte(s)
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarDetalhes(true)}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={explicarProcesso}
              disabled={loadingExplicacao}
              className="flex-1"
            >
              {loadingExplicacao ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Explicando...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Explicar com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProcessoDetalhes
        processo={processo}
        open={mostrarDetalhes}
        onClose={() => setMostrarDetalhes(false)}
      />

      <ExplicacaoProcessoModal
        open={mostrarExplicacao}
        onClose={() => setMostrarExplicacao(false)}
        explicacao={explicacao}
        numeroProcesso={processo.numeroProcesso}
      />
    </>
  );
};

export default ProcessoCard;
