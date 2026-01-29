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
  subtopicos?: string[];
}

interface OABEticaPdfProcessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type ProcessStep = 'input' | 'extracting' | 'identifying' | 'confirming' | 'saving';

export const OABEticaPdfProcessorModal = ({
  open,
  onOpenChange,
  onComplete
}: OABEticaPdfProcessorModalProps) => {
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
      toast.error("Por favor, insira a URL do PDF");
      return;
    }

    setError(null);
    setStep('extracting');
    setProgress(10);
    setMessage("Baixando e extraindo texto do PDF...");

    try {
      // Etapa 1: Processar PDF com Mistral OCR
      const { data: extractData, error: extractError } = await supabase.functions.invoke(
        'processar-pdf-oab-etica',
        { body: { pdfUrl } }
      );

      if (extractError || !extractData?.success) {
        throw new Error(extractData?.error || extractError?.message || 'Erro na extração');
      }

      setProgress(50);
      setMessage(`${extractData.totalPaginas} páginas extraídas. Identificando temas...`);
      setStep('identifying');

      // Etapa 2: Identificar temas com Gemini
      const { data: temasData, error: temasError } = await supabase.functions.invoke(
        'identificar-temas-oab-etica',
        { body: {} }
      );

      if (temasError || !temasData?.success) {
        throw new Error(temasData?.error || temasError?.message || 'Erro na identificação');
      }

      setProgress(90);
      setMessage("Temas identificados!");
      setTemas(temasData.temas || []);
      setSelectedTemas(new Set(temasData.temas?.map((_: TemaIdentificado, i: number) => i) || []));
      setStep('confirming');
      setProgress(100);

    } catch (err: unknown) {
      console.error("Erro no processamento:", err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setStep('input');
      toast.error(errorMessage);
    }
  };

  const confirmarTemas = async () => {
    const temasParaConfirmar = temas.filter((_, index) => selectedTemas.has(index));
    
    if (temasParaConfirmar.length === 0) {
      toast.error("Selecione pelo menos um tema");
      return;
    }

    setStep('saving');
    setProgress(50);
    setMessage("Salvando temas...");

    try {
      const { data, error } = await supabase.functions.invoke(
        'confirmar-temas-oab-etica',
        { body: { temas: temasParaConfirmar } }
      );

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao salvar');
      }

      setProgress(100);
      setMessage("Temas salvos com sucesso!");
      toast.success(`${temasParaConfirmar.length} temas criados com sucesso!`);
      
      setTimeout(() => {
        resetState();
        onOpenChange(false);
        onComplete();
      }, 1500);

    } catch (err: unknown) {
      console.error("Erro ao salvar:", err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setStep('confirming');
      toast.error(errorMessage);
    }
  };

  const toggleTema = (index: number) => {
    const newSelected = new Set(selectedTemas);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTemas(newSelected);
  };

  const toggleAll = () => {
    if (selectedTemas.size === temas.length) {
      setSelectedTemas(new Set());
    } else {
      setSelectedTemas(new Set(temas.map((_, i) => i)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            Processar PDF - Ética Profissional
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Extraia e identifique temas do material de Ética OAB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Etapa: Input */}
          {step === 'input' && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Link do PDF (Google Drive)</label>
                <Input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Cole o link de compartilhamento do Google Drive
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={processarPdf}
                disabled={!pdfUrl.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
              >
                Processar PDF
              </Button>
            </>
          )}

          {/* Etapa: Processando */}
          {(step === 'extracting' || step === 'identifying' || step === 'saving') && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-gray-400">{message}</p>
            </div>
          )}

          {/* Etapa: Confirmar temas */}
          {step === 'confirming' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-300">
                  {temas.length} temas identificados
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                  className="text-red-400 hover:text-red-300"
                >
                  {selectedTemas.size === temas.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>

              <ScrollArea className="h-[300px] rounded-lg border border-neutral-800">
                <div className="p-3 space-y-2">
                  {temas.map((tema, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedTemas.has(index)
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                      }`}
                      onClick={() => toggleTema(index)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTemas.has(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white">
                            {tema.ordem}. {tema.titulo}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Páginas {tema.pagina_inicial} - {tema.pagina_final}
                          </p>
                          {tema.subtopicos && tema.subtopicos.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {tema.subtopicos.slice(0, 3).join(', ')}
                              {tema.subtopicos.length > 3 && '...'}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 
                          className={`w-5 h-5 flex-shrink-0 ${
                            selectedTemas.has(index) ? 'text-red-500' : 'text-gray-600'
                          }`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetState();
                  }}
                  className="flex-1 border-neutral-700 text-gray-300 hover:bg-neutral-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarTemas}
                  disabled={selectedTemas.size === 0}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                >
                  Confirmar {selectedTemas.size} tema{selectedTemas.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};