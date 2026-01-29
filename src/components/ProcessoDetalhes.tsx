import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, FileText, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

interface ProcessoDetalhesProps {
  processo: Processo;
  open: boolean;
  onClose: () => void;
}

const ProcessoDetalhes = ({ processo, open, onClose }: ProcessoDetalhesProps) => {
  const construirLink = (numeroProcesso: string, tribunal: string): string => {
    const tribunalUpper = tribunal.toUpperCase();
    
    switch (tribunalUpper) {
      case "STJ":
        return `https://processo.stj.jus.br/processo/pesquisa/?num_registro=${numeroProcesso}`;
      case "STF":
        return `https://portal.stf.jus.br/processos/detalhe.asp?incidente=${numeroProcesso}`;
      case "TST":
        return `https://consultaprocessual.tst.jus.br/consultaProcessual/consultaTstNumUnica.do?consulta=Consultar&conscsjt=&numeroTst=${numeroProcesso}`;
      default:
        return `https://www.jusbrasil.com.br/processos/${numeroProcesso}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Processo {processo.numeroProcesso}
            {processo.tipoParticipacao && (
              <Badge variant={processo.tipoParticipacao.toLowerCase().includes("autor") ? "default" : "destructive"}>
                {processo.tipoParticipacao}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{processo.classeProcessual}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tribunal</p>
                <p className="font-medium">{processo.tribunal}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Data de Ajuizamento</p>
                <p className="font-medium">{processo.dataAjuizamento || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Órgão Julgador</p>
                <p className="font-medium">{processo.orgaoJulgador}</p>
              </div>
            </div>

            {processo.situacao && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Situação</p>
                  <p className="font-medium">{processo.situacao}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {processo.assunto && (
            <>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Assunto
                </h3>
                <p className="text-sm text-muted-foreground">{processo.assunto}</p>
              </div>
              <Separator />
            </>
          )}

          {processo.partes && processo.partes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Partes do Processo
              </h3>
              <div className="space-y-2">
                {processo.partes.map((parte, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Badge variant="outline" className="mt-0.5">
                      {parte.tipo}
                    </Badge>
                    <p className="text-sm flex-1">{parte.nome}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(construirLink(processo.numeroProcesso, processo.tribunal), "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Consultar no Tribunal
            </Button>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Atenção:</strong> As informações aqui exibidas são de caráter público e
              foram obtidas através da API oficial DataJud do CNJ. Processos sigilosos não
              aparecem nesta consulta. Para informações completas, acesse o site oficial do tribunal.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessoDetalhes;
