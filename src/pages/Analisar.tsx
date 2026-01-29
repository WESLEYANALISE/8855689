import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, FileText, Scale, CheckCircle, BookOpen, FileSignature, ScanText, Upload, Camera, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisFunction {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  borderColor: string;
}

const Analisar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFunction, setSelectedFunction] = useState<AnalysisFunction | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisFunctions: AnalysisFunction[] = [
    {
      id: "documento",
      title: "Analisar Documento",
      description: "Análise completa de documentos jurídicos",
      icon: FileText,
      gradient: "from-[hsl(0,75%,55%)] to-[hsl(0,65%,45%)]",
      borderColor: "border-[hsl(0,75%,55%)]",
    },
    {
      id: "peticao",
      title: "Analisar Petição",
      description: "Identifique partes, pedidos e fundamentos",
      icon: Scale,
      gradient: "from-[hsl(220,85%,60%)] to-[hsl(220,75%,50%)]",
      borderColor: "border-[hsl(220,85%,60%)]",
    },
    {
      id: "prova",
      title: "Corrigir Prova",
      description: "Avaliação e feedback de respostas",
      icon: CheckCircle,
      gradient: "from-[hsl(140,75%,50%)] to-[hsl(140,65%,40%)]",
      borderColor: "border-[hsl(140,75%,50%)]",
    },
    {
      id: "resumo",
      title: "Digitalizar Resumo",
      description: "Transforme textos em resumos estruturados",
      icon: BookOpen,
      gradient: "from-[hsl(280,75%,60%)] to-[hsl(280,65%,50%)]",
      borderColor: "border-[hsl(280,75%,60%)]",
    },
    {
      id: "contrato",
      title: "Analisar Contrato",
      description: "Identifique cláusulas e riscos",
      icon: FileSignature,
      gradient: "from-[hsl(30,90%,55%)] to-[hsl(30,80%,45%)]",
      borderColor: "border-[hsl(30,90%,55%)]",
    },
    {
      id: "ocr",
      title: "OCR Simples",
      description: "Extraia texto de imagens e PDFs",
      icon: ScanText,
      gradient: "from-[hsl(200,75%,55%)] to-[hsl(200,65%,45%)]",
      borderColor: "border-[hsl(200,75%,55%)]",
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Criar elemento de vídeo temporário
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      // Capturar frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      // Parar stream
      stream.getTracks().forEach(track => track.stop());
      
      // Converter para file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setUploadedFile(file);
        }
      }, 'image/jpeg');
    } catch (error) {
      console.error('Erro ao capturar câmera:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive",
      });
    }
  };

  const analisarDocumento = async () => {
    if (!uploadedFile || !selectedFunction) return;

    setIsAnalyzing(true);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadedFile);
      });

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('analisar-documento', {
        body: {
          tipo: selectedFunction.id,
          fileBase64,
          fileName: uploadedFile.name,
        }
      });

      if (error) throw error;

      // Navegar para página de resultado
      navigate('/analisar/resultado', {
        state: {
          resultado: data.resultado,
          tipo: selectedFunction.id,
          fileName: uploadedFile.name,
        }
      });

    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-accent/20 p-2 rounded-xl">
            <Camera className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">Digitalizar & Analisar</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha a função desejada para análise inteligente
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {analysisFunctions.map((func) => {
          const Icon = func.icon;
          return (
            <Card
              key={func.id}
              className={`cursor-pointer hover:scale-105 transition-all overflow-hidden border-2 ${func.borderColor} bg-card shadow-xl hover:shadow-2xl`}
              onClick={() => setSelectedFunction(func)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center min-h-[160px]">
                <div className={`bg-gradient-to-br ${func.gradient} rounded-full p-4 mb-3`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1">{func.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {func.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Upload */}
      <Dialog open={!!selectedFunction} onOpenChange={() => setSelectedFunction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedFunction?.title}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFunction(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedFunction?.description}
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCameraCapture}
              >
                <Camera className="w-4 h-4 mr-2" />
                Tirar Foto
              </Button>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Imagem
                  </label>
                </Button>
              </label>

              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Enviar Documento
                  </label>
                </Button>
              </label>
            </div>

            {uploadedFile && (
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-sm font-medium">Arquivo selecionado:</p>
                <p className="text-xs text-muted-foreground truncate">
                  {uploadedFile.name}
                </p>
              </div>
            )}

            {uploadedFile && (
              <Button 
                className="w-full" 
                onClick={analisarDocumento}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Analisar Agora'
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analisar;
