import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";
import { StandardPageHeader } from "@/components/StandardPageHeader";

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

  const getSubtitle = () => {
    switch (inputType) {
      case "texto": return "Digite ou cole o conteúdo";
      case "pdf": return "Selecione o arquivo PDF";
      case "imagem": return "Selecione a imagem";
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
    <div className="min-h-screen flex flex-col">
      <StandardPageHeader
        title={getTitle()}
        subtitle={getSubtitle()}
        onBack={onBack}
        icon={<span className="text-2xl">{getIcon()}</span>}
      />

      <div className="flex-1 px-3 md:px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="space-y-4 md:space-y-6">
          {inputType === "texto" ? (
            <div className="space-y-3">
              <Label htmlFor="texto" className="text-base">Seu texto</Label>
              <Textarea
                id="texto"
                placeholder="Cole aqui o texto que deseja resumir..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="min-h-[300px] md:min-h-[400px] resize-none text-base"
              />
              <p className="text-xs text-muted-foreground">
                {texto.length} caracteres
              </p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-accent bg-accent/10 scale-[1.02]"
                  : arquivo
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 transition-colors ${
                arquivo ? "text-accent" : "text-muted-foreground"
              }`} />
              {arquivo ? (
                <div>
                  <p className="text-base md:text-lg font-semibold text-foreground mb-1">
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
                  <p className="text-sm md:text-base text-foreground mb-2 font-medium">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {inputType === "pdf" ? "PDF até 20MB" : "JPG, PNG ou WEBP até 20MB"}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full text-base md:text-lg h-12 md:h-14"
          >
            Analisar Conteúdo
          </Button>
        </div>
      </div>
    </div>
  );
};
