import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, AlertTriangle, Lightbulb, Pin, Scale } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AulaExemploPratico } from "./AulaExemploPratico";
import { QuizFixacao } from "./QuizFixacao";

interface AulaTeoriaEnhancedProps {
  moduloNumero: number;
  titulo: string;
  conteudo: string;
  exemploPratico?: {
    cenario: string;
    analise: string;
    solucao: string;
  };
  quizRapido?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
  }>;
  resumo?: string[];
  onProximo: () => void;
  proximoLabel?: string;
}

export const AulaTeoriaEnhanced = ({
  moduloNumero,
  titulo,
  conteudo,
  exemploPratico,
  quizRapido,
  resumo,
  onProximo,
  proximoLabel = "Próxima Etapa"
}: AulaTeoriaEnhancedProps) => {
  const [activeTab, setActiveTab] = useState("teoria");

  const parseMarkdownWithCards = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentBlock: string[] = [];
    let inBlockquote = false;
    let blockquoteType = '';
    
    lines.forEach((line, index) => {
      if (line.startsWith('> ⚠️')) {
        if (currentBlock.length > 0) {
          elements.push(
            <div key={`text-${index}`} className="mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentBlock.join('\n')}
              </ReactMarkdown>
            </div>
          );
          currentBlock = [];
        }
        blockquoteType = 'warning';
        inBlockquote = true;
        const content = line.replace('> ⚠️ **ATENÇÃO**:', '').trim();
        currentBlock = [content];
      } else if (line.startsWith('> 💡')) {
        if (currentBlock.length > 0) {
          elements.push(
            <div key={`text-${index}`} className="mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentBlock.join('\n')}
              </ReactMarkdown>
            </div>
          );
          currentBlock = [];
        }
        blockquoteType = 'info';
        inBlockquote = true;
        const content = line.replace('> 💡 **IMPORTANTE**:', '').trim();
        currentBlock = [content];
      } else if (line.startsWith('> 📌')) {
        if (currentBlock.length > 0) {
          elements.push(
            <div key={`text-${index}`} className="mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentBlock.join('\n')}
              </ReactMarkdown>
            </div>
          );
          currentBlock = [];
        }
        blockquoteType = 'tip';
        inBlockquote = true;
        const content = line.replace('> 📌 **DICA PRÁTICA**:', '').trim();
        currentBlock = [content];
      } else if (line.startsWith('> ⚖️')) {
        if (currentBlock.length > 0) {
          elements.push(
            <div key={`text-${index}`} className="mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentBlock.join('\n')}
              </ReactMarkdown>
            </div>
          );
          currentBlock = [];
        }
        blockquoteType = 'law';
        inBlockquote = true;
        const content = line.replace('> ⚖️ **JURISPRUDÊNCIA**:', '').trim();
        currentBlock = [content];
      } else if (line.startsWith('>') && inBlockquote) {
        currentBlock.push(line.replace('> ', ''));
      } else if (inBlockquote && !line.startsWith('>')) {
        // Fim do blockquote
        const Icon = blockquoteType === 'warning' ? AlertTriangle :
                    blockquoteType === 'info' ? Lightbulb :
                    blockquoteType === 'tip' ? Pin : Scale;
        
        const variant = blockquoteType === 'warning' ? 'destructive' :
                       blockquoteType === 'info' ? 'default' :
                       blockquoteType === 'tip' ? 'default' : 'default';
        
        const bgColor = blockquoteType === 'warning' ? 'bg-red-500/10 border-red-500' :
                       blockquoteType === 'info' ? 'bg-blue-500/10 border-blue-500' :
                       blockquoteType === 'tip' ? 'bg-green-500/10 border-green-500' :
                       'bg-purple-500/10 border-purple-500';
        
        elements.push(
          <Alert key={`alert-${index}`} variant={variant} className={`mb-4 ${bgColor}`}>
            <Icon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {currentBlock.join(' ')}
            </AlertDescription>
          </Alert>
        );
        
        inBlockquote = false;
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    });
    
    if (currentBlock.length > 0) {
      if (inBlockquote) {
        const Icon = blockquoteType === 'warning' ? AlertTriangle :
                    blockquoteType === 'info' ? Lightbulb :
                    blockquoteType === 'tip' ? Pin : Scale;
        
        const variant = blockquoteType === 'warning' ? 'destructive' :
                       blockquoteType === 'info' ? 'default' :
                       blockquoteType === 'tip' ? 'default' : 'default';
        
        const bgColor = blockquoteType === 'warning' ? 'bg-red-500/10 border-red-500' :
                       blockquoteType === 'info' ? 'bg-blue-500/10 border-blue-500' :
                       blockquoteType === 'tip' ? 'bg-green-500/10 border-green-500' :
                       'bg-purple-500/10 border-purple-500';
        
        elements.push(
          <Alert key="alert-last" variant={variant} className={`mb-4 ${bgColor}`}>
            <Icon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {currentBlock.join(' ')}
            </AlertDescription>
          </Alert>
        );
      } else {
        elements.push(
          <div key="text-last" className="mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentBlock.join('\n')}
            </ReactMarkdown>
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="p-6 border-2 border-primary/20">
          <div className="mb-4">
            <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary mb-2">
              Módulo {moduloNumero}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{titulo}</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="teoria">📖 Teoria</TabsTrigger>
              <TabsTrigger value="exemplo" disabled={!exemploPratico}>
                💼 Exemplo
              </TabsTrigger>
              <TabsTrigger value="quiz" disabled={!quizRapido}>
                ✍️ Quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teoria" className="space-y-4">
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                {parseMarkdownWithCards(conteudo)}
              </div>

              {resumo && resumo.length > 0 && (
                <Card className="p-4 bg-primary/5 border-primary/20 mt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    Resumo do Módulo
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {resumo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="exemplo">
              {exemploPratico && (
                <AulaExemploPratico exemplo={exemploPratico} />
              )}
            </TabsContent>

            <TabsContent value="quiz">
              {quizRapido && (
                <QuizFixacao questoes={quizRapido} />
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button
              onClick={onProximo}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {proximoLabel}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
