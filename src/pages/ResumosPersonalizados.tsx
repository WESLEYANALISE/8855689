import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepSelectType } from "@/components/resumos/StepSelectType";
import { StepSelectInput } from "@/components/resumos/StepSelectInput";
import { StepAnalyzing } from "@/components/resumos/StepAnalyzing";
import { StepSelectLevel } from "@/components/resumos/StepSelectLevel";
import { StepGenerating } from "@/components/resumos/StepGenerating";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDailyLimit } from "@/hooks/useDailyLimit";
import { DailyLimitBadge } from "@/components/DailyLimitBadge";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { FileText } from "lucide-react";

type InputType = "texto" | "pdf" | "imagem";
type ResumoLevel = "detalhado" | "resumido" | "super_resumido";
type Step = "select-type" | "input-content" | "analyzing" | "select-level" | "generating";

const ResumosPersonalizados = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("select-type");
  const [inputType, setInputType] = useState<InputType | null>(null);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ResumoLevel | null>(null);
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const { canUse, remainingUses, isUnlimited, incrementUse, loading: limitLoading } = useDailyLimit('resumos-personalizados');

  const handleTypeSelect = (type: InputType) => {
    if (!canUse && !isUnlimited) {
      setShowPremiumCard(true);
      return;
    }
    
    setInputType(type);
    setCurrentStep("input-content");
    setTexto("");
    setArquivo(null);
    setExtractedText(null);
    setSelectedLevel(null);
  };

  const handleInputSubmit = async (text?: string, file?: File) => {
    if (text) setTexto(text);
    if (file) setArquivo(file);
    
    setCurrentStep("analyzing");
    
    try {
      let arquivoBase64: string | undefined;
      if (file) {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const { data, error } = await supabase.functions.invoke("gerar-resumo", {
        body: {
          tipo: inputType,
          conteudo: text || undefined,
          arquivo: arquivoBase64,
          nomeArquivo: file?.name,
          acao: "extrair",
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("Erro na extração:", error);
        throw new Error("Erro ao processar documento. Tente um arquivo menor ou em outro formato.");
      }

      if (data?.extraido && typeof data.extraido === "string" && data.extraido.trim().length > 0) {
        setExtractedText(data.extraido);
        setTimeout(() => {
          setCurrentStep("select-level");
        }, 100);
      } else {
        throw new Error("Não foi possível extrair texto do documento.");
      }
    } catch (error: any) {
      console.error("Erro ao analisar:", error);
      
      const errorMessage = error.name === 'AbortError' 
        ? "Tempo esgotado. Tente um arquivo menor." 
        : error.message || "Erro ao processar documento.";
      
      toast({
        title: "Erro na análise",
        description: errorMessage,
        variant: "destructive",
      });
      
      setCurrentStep("input-content");
    }
  };

  const salvarNoHistorico = async (resumoTexto: string, nivel: ResumoLevel) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const titulo = arquivo?.name 
        ? arquivo.name.replace(/\.[^/.]+$/, "").substring(0, 100)
        : inputType === "texto" 
          ? texto.substring(0, 50).trim() + (texto.length > 50 ? "..." : "")
          : "Resumo de imagem";

      // Usando any para contornar tipos ainda não regenerados
      await (supabase as any).from("resumos_personalizados_historico").insert({
        user_id: user.id,
        titulo,
        resumo: resumoTexto,
        nivel,
        tipo_entrada: inputType,
        nome_arquivo: arquivo?.name || null,
        caracteres_fonte: extractedText?.length || texto.length || 0,
      });

      console.log("✅ Resumo salvo no histórico");
    } catch (error) {
      console.error("Erro ao salvar no histórico:", error);
    }
  };

  const handleLevelSelect = async (level: ResumoLevel) => {
    if (!canUse && !isUnlimited) {
      setShowPremiumCard(true);
      return;
    }

    setSelectedLevel(level);
    setCurrentStep("generating");

    try {
      let arquivoBase64: string | undefined;
      if (arquivo && inputType !== "texto") {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(arquivo);
        });
      }

      const { data, error } = await supabase.functions.invoke("gerar-resumo", {
        body: {
          tipo: inputType,
          conteudo: inputType === "texto" ? texto : extractedText || undefined,
          arquivo: arquivoBase64,
          nomeArquivo: arquivo?.name,
          acao: "resumir",
          nivel: level,
        },
      });

      if (error) {
        console.error("Erro ao gerar resumo:", error);
        throw error;
      }

      if (data?.resumo) {
        incrementUse();
        
        // Salvar no histórico
        await salvarNoHistorico(data.resumo, level);
        
        setTimeout(() => {
          navigate("/resumos-juridicos/resultado", {
            state: { 
              resumo: data.resumo, 
              titulo: "Resumo Jurídico Personalizado",
              nivel: level 
            },
          });
        }, 100);
      } else {
        throw new Error(data?.error || "Falha ao gerar resumo.");
      }
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setCurrentStep("select-level");
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "input-content":
        setCurrentStep("select-type");
        setInputType(null);
        break;
      case "select-level":
        setCurrentStep("input-content");
        setExtractedText(null);
        break;
      default:
        navigate("/resumos-juridicos");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Badge de limite diário flutuante */}
      {!limitLoading && currentStep === "select-type" && (
        <div className="fixed top-20 right-4 z-40 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Resumos:</span>
          <DailyLimitBadge feature="resumos-personalizados" />
        </div>
      )}

      {currentStep === "select-type" && (
        <StepSelectType onSelect={handleTypeSelect} />
      )}
      
      {currentStep === "input-content" && inputType && (
        <StepSelectInput
          inputType={inputType}
          onSubmit={handleInputSubmit}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "analyzing" && (
        <StepAnalyzing />
      )}
      
      {currentStep === "select-level" && (
        <StepSelectLevel
          onSelect={handleLevelSelect}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "generating" && (
        <StepGenerating nivel={selectedLevel || "detalhado"} />
      )}

      {/* Premium Card quando limite atingido */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Limite de Resumos Atingido"
        description="Você usou todos os seus 3 resumos gratuitos de hoje. Assine o Premium para resumos ilimitados!"
      />

    </div>
  );
};

export default ResumosPersonalizados;
