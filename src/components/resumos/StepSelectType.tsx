import { FileText, Upload, Image, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StandardPageHeader } from "@/components/StandardPageHeader";

type InputType = "texto" | "pdf" | "imagem";

interface StepSelectTypeProps {
  onSelect: (type: InputType) => void;
  onOpenHistory?: () => void;
}

export const StepSelectType = ({ onSelect, onOpenHistory }: StepSelectTypeProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <StandardPageHeader
        title="Resumo Personalizado"
        subtitle="Crie resumos de qualquer conteúdo"
        backPath="/resumos-juridicos"
        rightAction={
          onOpenHistory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHistory}
              className="rounded-full"
            >
              <History className="w-5 h-5" />
            </Button>
          )
        }
      />

      <div className="flex-1 flex items-center justify-center px-3 py-6">
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/20 mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl">📚</span>
            </div>
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
              Criar Resumo
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Escolha o formato do conteúdo
            </p>
          </div>

          {/* Grid responsivo - 3 colunas sempre */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.98]"
              onClick={() => onSelect("texto")}
            >
              <CardContent className="p-3 md:p-6 flex flex-col items-center text-center gap-2 md:gap-4">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <FileText className="w-5 h-5 md:w-8 md:h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Texto</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                    Cole ou digite o texto diretamente
                  </p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    Cole ou digite
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.98]"
              onClick={() => onSelect("pdf")}
            >
              <CardContent className="p-3 md:p-6 flex flex-col items-center text-center gap-2 md:gap-4">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Upload className="w-5 h-5 md:w-8 md:h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">PDF</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                    Faça upload de um arquivo PDF
                  </p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    Upload arquivo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.98]"
              onClick={() => onSelect("imagem")}
            >
              <CardContent className="p-3 md:p-6 flex flex-col items-center text-center gap-2 md:gap-4">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Image className="w-5 h-5 md:w-8 md:h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Imagem</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                    Envie uma foto ou screenshot
                  </p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    Envie foto
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
