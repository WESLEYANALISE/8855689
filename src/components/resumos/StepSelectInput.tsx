import { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";

type InputType = "texto" | "pdf" | "imagem";

interface StepSelectInputProps {
  inputType: InputType;
  onSubmit: (text?: string, file?: File) => void;
  onBack: () => void;
}

export const StepSelectInput = ({ inputType, onSubmit, onBack }: StepSelectInputProps) => {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: inputType === "pdf" 
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setArquivo(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = () => {
    if (inputType === "texto" && !texto.trim()) {
      toast({
        title: "Campo vazio",
        description: "Por favor, insira um texto para resumir.",
        variant: "destructive",
      });
      return;
    }

    if ((inputType === "pdf" || inputType === "imagem") && !arquivo) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(texto, arquivo || undefined);
  };

  const getTitle = () => {
    switch (inputType) {
      case "texto": return "Cole seu texto";
      case "pdf": return "Envie seu PDF";
      case "imagem": return "Envie sua imagem";
    }
  };

  const getIcon = () => {
    switch (inputType) {
      case "texto": return "📝";
      case "pdf": return "📄";
      case "imagem": return "🖼️";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
            <span className="text-3xl">{getIcon()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground">
            {inputType === "texto" 
              ? "Digite ou cole o conteúdo que você quer resumir"
              : "Selecione o arquivo que você quer resumir"}
          </p>
        </div>

        <div className="space-y-6">
          {inputType === "texto" ? (
            <div className="space-y-3">
              <Label htmlFor="texto" className="text-base">Seu texto</Label>
              <Textarea
                id="texto"
                placeholder="Cole aqui o texto que deseja resumir..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="min-h-[400px] resize-none text-base"
              />
              <p className="text-xs text-muted-foreground">
                {texto.length} caracteres
              </p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-accent bg-accent/10 scale-105"
                  : arquivo
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                arquivo ? "text-accent" : "text-muted-foreground"
              }`} />
              {arquivo ? (
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {arquivo.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArquivo(null);
                    }}
                  >
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-base text-foreground mb-2 font-medium">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {inputType === "pdf" ? "PDF até 20MB" : "JPG, PNG ou WEBP até 20MB"}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full text-lg h-14"
          >
            Analisar Conteúdo
          </Button>
        </div>
      </div>
    </div>
  );
};
