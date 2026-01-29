import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface ExplicacaoSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  conteudo: string;
}

const ExplicacaoSimpleModal = ({
  isOpen,
  onClose,
  titulo,
  conteudo
}: ExplicacaoSimpleModalProps) => {
  const customComponents: Components = {
    p: ({ children }) => (
      <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-accent mb-6 mt-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-accent mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium text-foreground mb-3 mt-6">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-accent pl-6 pr-4 py-4 my-6 bg-secondary/40 rounded-r-lg text-foreground/95 text-[15px] leading-relaxed shadow-sm">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => {
      return <strong className="text-foreground font-bold">{children}</strong>;
    },
    code: ({ children }) => (
      <code className="bg-secondary/60 px-2 py-0.5 rounded text-sm text-accent">
        {children}
      </code>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 my-4 list-disc list-inside">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 my-4 list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-[15px] text-foreground/90 leading-relaxed ml-2">
        {children}
      </li>
    ),
    hr: ({ children }) => (
      <hr className="border-border/40 my-8" />
    )
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold">{titulo}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          <div className="animate-fade-in">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
              {conteudo}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplicacaoSimpleModal;
