import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlanoEstudosWizard } from "@/components/PlanoEstudosWizard";

const PlanoEstudos = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const loadingMessages = [
    "Analisando conteúdo...",
    "Estruturando cronograma...",
    "Organizando tópicos por semana...",
    "Definindo estratégias de estudo...",
    "Quase lá, finalizando detalhes...",
    "Preparando materiais recomendados...",
    "Ajustando carga horária...",
    "Revisando estrutura final...",
  ];

  const simulateProgress = () => {
    let currentProgress = 0;
    let messageIndex = 0;
    
    const interval = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += Math.random() * 8 + 2;
        if (currentProgress > 95) currentProgress = 95;
        setProgress(Math.floor(currentProgress));
      }
      
      setStatusMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 1200);
    
    return interval;
  };

  const handleWizardComplete = async (data: {
    metodo: "tema" | "arquivo";
    materia?: string;
    arquivo?: File;
    diasSelecionados: string[];
    horasPorDia: number;
    duracaoSemanas: number;
  }) => {
    setIsProcessing(true);
    setProgress(0);
    const progressInterval = simulateProgress();

    try {
      let arquivoBase64: string | undefined;
      let tipoArquivo: "pdf" | "imagem" | undefined;

      if (data.arquivo) {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.arquivo!);
        });
        tipoArquivo = data.arquivo.type.includes("pdf") ? "pdf" : "imagem";
      }

      const { data: result, error } = await supabase.functions.invoke("gerar-plano-estudos", {
        body: {
          materia: data.materia || "Plano de Estudos Personalizado",
          horasPorDia: data.horasPorDia,
          diasSemana: data.diasSelecionados,
          duracaoSemanas: data.duracaoSemanas,
          arquivo: arquivoBase64,
          tipoArquivo,
        },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (result?.plano) {
        setProgress(100);
        setStatusMessage("✅ Plano pronto!");

        setTimeout(() => {
          navigate("/plano-estudos/resultado", {
            state: {
              plano: result.plano,
              materia: data.materia || "Plano de Estudos",
              totalHoras: result.totalHoras,
            },
          });
        }, 300);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Erro ao gerar plano:", error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <ProgressBar
            progress={progress}
            message={statusMessage}
            subMessage="Criando seu cronograma personalizado..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Plano de Estudos</h1>
            <p className="text-sm text-muted-foreground">
              Crie um cronograma personalizado passo a passo
            </p>
          </div>
        </div>
      </div>

      <PlanoEstudosWizard onComplete={handleWizardComplete} />
    </div>
  );
};

export default PlanoEstudos;
