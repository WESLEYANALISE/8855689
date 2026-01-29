import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AulaTeoriaProps {
  titulo: string;
  conteudo: string;
  onProximo: () => void;
  proximoLabel?: string;
}

export const AulaTeoria = ({ titulo, conteudo, onProximo, proximoLabel }: AulaTeoriaProps) => {
  return (
    <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <Card className="p-6 md:p-8 border-2 border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 rounded-lg p-3">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{titulo}</h2>
              <p className="text-sm text-muted-foreground">Conteúdo Teórico</p>
            </div>
          </div>

          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {conteudo}
            </ReactMarkdown>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={onProximo}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {proximoLabel || 'Próximo: Jogo de Matching'}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
