import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemaIdentificado {
  ordem: number;
  titulo: string;
  pagina_inicial: number;
  pagina_final: number;
  subtopicos?: any[];
}

interface OABPdfProcessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materiaId: number;
  materiaNome: string;
  onComplete: () => void;
}

type ProcessStep = 'input' | 'extracting' | 'identifying' | 'confirming' | 'saving';

export const OABPdfProcessorModal = ({
  open,
  onOpenChange,
  materiaId,
  materiaNome,
  onComplete
}: OABPdfProcessorModalProps) => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [step, setStep] = useState<ProcessStep>('input');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [temas, setTemas] = useState<TemaIdentificado[]>([]);
  const [selectedTemas, setSelectedTemas] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setPdfUrl("");
    setStep('input');
    setProgress(0);
    setMessage("");
    setTemas([]);
    setSelectedTemas(new Set());
    setError(null);
  };

  const handleClose = () => {
    if (step === 'extracting' || step === 'identifying' || step === 'saving') {
      return; // Não permitir fechar durante processamento
    }
    resetState();
    onOpenChange(false);
  };

  const processarPdf = async () => {
    if (!pdfUrl.trim()) {
      toast.error("Cole o link do PDF do Google Drive");
      return;
    }

    setError(null);
    setStep('extracting');
    setProgress(10);
    setMessage("Baixando e extraindo texto do PDF...");

    try {
      // Chamar edge function para processar PDF
      const { data, error } = await supabase.functions.invoke('processar-pdf-oab-materia', {
        body: { materiaId, pdfUrl }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro no processamento");

      setProgress(50);
      setStep('identifying');
      setMessage("Identificando temas do índice...");

      // Simular progresso da identificação
      const intervalId = setInterval(() => {
        setProgress(p => Math.min(p + 5, 85));
      }, 500);

      // Chamar edge function para identificar temas
      const { data: temasData, error: temasError } = await supabase.functions.invoke('identificar-temas-oab', {
        body: { materiaId }
      });

      clearInterval(intervalId);

      if (temasError) throw temasError;
      if (!temasData.success) throw new Error(temasData.error || "Erro na identificação de temas");

      setProgress(100);
      setTemas(temasData.temas || []);
      setSelectedTemas(new Set(temasData.temas?.map((t: TemaIdentificado) => t.ordem) || []));
      setStep('confirming');
      setMessage("");

    } catch (err) {
      console.error("Erro no processamento:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setStep('input');
      setProgress(0);
    }
  };

  const confirmarTemas = async () => {
    const temasParaSalvar = temas.filter(t => selectedTemas.has(t.ordem));
    
    if (temasParaSalvar.length === 0) {
      toast.error("Selecione pelo menos um tema");
      return;
    }

    setStep('saving');
    setProgress(0);
    setMessage("Salvando tópicos...");

    try {
      const { data, error } = await supabase.functions.invoke('confirmar-temas-oab', {
        body: { materiaId, temas: temasParaSalvar }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao salvar temas");

      setProgress(100);
      toast.success(`${temasParaSalvar.length} tópicos criados com sucesso!`);
      
      setTimeout(() => {
        resetState();
        onOpenChange(false);
        onComplete();
      }, 500);

    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err instanceof Error ? err.message : "Erro ao salvar temas");
      setStep('confirming');
    }
  };

  const toggleTema = (ordem: number) => {
    const newSelected = new Set(selectedTemas);
    if (newSelected.has(ordem)) {
      newSelected.delete(ordem);
    } else {
      newSelected.add(ordem);
    }
    setSelectedTemas(newSelected);
  };

  const toggleAllTemas = () => {
    if (selectedTemas.size === temas.length) {
      setSelectedTemas(new Set());
    } else {
      setSelectedTemas(new Set(temas.map(t => t.ordem)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" hideCloseButton={step === 'extracting' || step === 'identifying' || step === 'saving'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Processar PDF - {materiaNome}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && "Cole o link do Google Drive para extrair o conteúdo"}
            {step === 'extracting' && "Extraindo texto do PDF com OCR..."}
            {step === 'identifying' && "Analisando índice e identificando temas..."}
            {step === 'confirming' && "Confirme os temas identificados"}
            {step === 'saving' && "Salvando tópicos..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Etapa: Input */}
          {step === 'input' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link do Google Drive</label>
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  O link deve ser de compartilhamento público ou com acesso para qualquer pessoa
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={processarPdf} className="flex-1">
                  Processar PDF
                </Button>
              </div>
            </>
          )}

          {/* Etapa: Processando */}
          {(step === 'extracting' || step === 'identifying' || step === 'saving') && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Não feche esta janela
              </p>
            </div>
          )}

          {/* Etapa: Confirmar Temas */}
          {step === 'confirming' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedTemas.size} de {temas.length} selecionados
                </span>
                <Button variant="ghost" size="sm" onClick={toggleAllTemas}>
                  {selectedTemas.size === temas.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {temas.map((tema) => (
                    <div
                      key={tema.ordem}
                      className={`border rounded-lg transition-colors ${
                        selectedTemas.has(tema.ordem) 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-3">
                        <Checkbox
                          checked={selectedTemas.has(tema.ordem)}
                          onCheckedChange={() => toggleTema(tema.ordem)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {String(tema.ordem).padStart(2, '0')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              págs {tema.pagina_inicial}-{tema.pagina_final}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium mt-1">{tema.titulo}</h4>
                          {tema.subtopicos && tema.subtopicos.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tema.subtopicos.length} subtópicos
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={confirmarTemas} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar {selectedTemas.size} Tópicos
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
