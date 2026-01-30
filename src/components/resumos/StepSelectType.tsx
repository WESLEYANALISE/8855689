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
    <div className="min-h-screen flex flex-col bg-background">
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
              className="rounded-full hover:bg-accent/20"
            >
              <History className="w-5 h-5" />
            </Button>
          )
        }
      />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Título centralizado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Criar Resumo
            </h1>
            <p className="text-muted-foreground">
              Escolha o formato do conteúdo
            </p>
          </div>

          {/* Grid de opções - sempre 3 colunas */}
          <div className="grid grid-cols-3 gap-3">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
              onClick={() => onSelect("texto")}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Texto</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Cole ou digite
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
              onClick={() => onSelect("pdf")}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">PDF</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Upload arquivo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
              onClick={() => onSelect("imagem")}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Image className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Imagem</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
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
