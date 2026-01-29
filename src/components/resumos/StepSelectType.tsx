import { FileText, Upload, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type InputType = "texto" | "pdf" | "imagem";

interface StepSelectTypeProps {
  onSelect: (type: InputType) => void;
}

export const StepSelectType = ({ onSelect }: StepSelectTypeProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Criar Resumo Personalizado
          </h1>
          <p className="text-muted-foreground">
            Escolha o formato do conteúdo que você quer resumir
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group"
            onClick={() => onSelect("texto")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <FileText className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Texto</h3>
                <p className="text-sm text-muted-foreground">
                  Cole ou digite o texto diretamente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group"
            onClick={() => onSelect("pdf")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Upload className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Faça upload de um arquivo PDF
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group"
            onClick={() => onSelect("imagem")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Image className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Imagem</h3>
                <p className="text-sm text-muted-foreground">
                  Envie uma foto ou screenshot
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
