import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProfessoraChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  contexto: {
    tipo: string;
    nome: string;
    resumo?: string;
  };
}

export const ProfessoraChatModal = ({ isOpen, onClose, contexto }: ProfessoraChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const perguntasSugeridas = [
    `Quais foram as principais obras de ${contexto.nome}?`,
    `Como ${contexto.nome} influenciou o direito brasileiro?`,
    `Conte-me sobre casos famosos de ${contexto.nome}`,
    `Qual foi o contexto histórico da época de ${contexto.nome}?`
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem de boas-vindas contextual
      const welcomeMessage: Message = {
        role: "assistant",
        content: `Olá! 👋 Sou a professora e estou aqui para te ajudar a entender melhor sobre **${contexto.nome}**.\n\n${contexto.resumo ? contexto.resumo.substring(0, 200) + '...' : ''}\n\nFique à vontade para me fazer qualquer pergunta sobre este jurista brasileiro! 📚`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, contexto]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const enviarMensagem = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Usar API não-streaming por enquanto (streaming será implementado no edge function)
      const { data, error } = await supabase.functions.invoke("chat-professora-jurista", {
        body: {
          messages: [...messages, userMessage],
          contexto: contexto
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.resposta
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao conversar com a professora");
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full md:w-[500px] h-[80vh] md:h-[600px] bg-card border rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl">👩‍🏫</span>
            </div>
            <div>
              <h3 className="font-bold">Professora</h3>
              <p className="text-xs text-muted-foreground">Assistente educacional</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Preparando resposta técnica + descomplicada...
                  </span>
                </div>
              </div>
            )}
            
            {/* Perguntas sugeridas - apenas se não houver muitas mensagens */}
            {messages.length <= 1 && !isLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground font-medium px-2">💡 Perguntas sugeridas:</p>
                <div className="flex flex-col gap-2">
                  {perguntasSugeridas.map((pergunta, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(pergunta);
                      }}
                      className="text-left text-sm p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20 hover:border-primary/40"
                    >
                      {pergunta}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Faça uma pergunta..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={enviarMensagem}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
