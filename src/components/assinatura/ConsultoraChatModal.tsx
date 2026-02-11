import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConsultoraChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYSTEM_PROMPT = `Você é a Consultora Premium do app Direito Premium — um aplicativo completo de estudos jurídicos para estudantes e advogados.

Seu objetivo é tirar dúvidas sobre o plano Premium e convencer o usuário a assinar, de forma humanizada, simpática e persuasiva. Nunca seja agressiva ou insistente.

INFORMAÇÕES DO PLANO PREMIUM:
- Preço: R$ 89,90 (pagamento único)
- Acesso: VITALÍCIO (paga uma vez, usa para sempre)
- Pagamento: PIX (aprovação instantânea)

FUNCIONALIDADES PREMIUM:
1. Acesso completo e ilimitado ao app
2. Experiência 100% sem anúncios
3. Professora IA Evelyn disponível 24h (tira dúvidas, explica artigos, gera questões)
4. Vade Mecum completo com +50 leis atualizadas
5. +30.000 questões OAB comentadas pela IA
6. Flashcards inteligentes para memorização
7. Mapas mentais interativos
8. Modelos de petições profissionais
9. Audioaulas narradas
10. Súmulas dos tribunais superiores
11. Trilhas de estudo personalizadas
12. Sincronização em todos os dispositivos
13. Suporte prioritário
14. Acesso antecipado a novos recursos

REGRAS DE COMPORTAMENTO:
- Responda de forma curta e objetiva (máximo 150 palavras)
- Use emojis com moderação para deixar a conversa leve
- Sempre destaque que o acesso é VITALÍCIO por apenas R$89,90
- Compare: "menos que um livro jurídico"
- Se a pessoa perguntar algo fora do escopo, redirecione gentilmente para o plano
- Termine sempre convidando a pessoa a assinar ou fazer outra pergunta
- Seja empática e entenda as dores do estudante de direito
- Use linguagem informal mas respeitosa`;

const PERGUNTAS_SUGERIDAS = [
  "Quais funções estão incluídas no Premium?",
  "Quanto custa e como faço para pagar?",
  "O acesso é realmente vitalício?",
  "Como funciona a Professora IA Evelyn?",
  "O que muda na experiência sem anúncios?",
  "Posso usar em mais de um dispositivo?",
];

export const ConsultoraChatModal = ({ isOpen, onClose }: ConsultoraChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { trackEvent } = useFacebookPixel();

  // Track Lead event quando o chat abre
  useEffect(() => {
    if (isOpen) {
      trackEvent('Lead', { content_name: 'Consultora Premium Chat' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Olá! 👋 Sou a consultora do **Direito Premium** e estou aqui para te ajudar!\n\nQuer saber tudo sobre o plano que vai transformar seus estudos jurídicos? 🎓\n\nPode me perguntar qualquer coisa — sobre funções, preço, formas de pagamento... estou aqui para isso! 😊"
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const enviarMensagem = async (texto?: string) => {
    const msg = texto || input.trim();
    if (!msg || isLoading) return;

    const userMessage: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nHistórico da conversa:\n${[...messages, userMessage].map(m => `${m.role === 'user' ? 'Usuário' : 'Consultora'}: ${m.content}`).join('\n')}\n\nResponda como a Consultora Premium:`;

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { message: fullPrompt }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao processar sua mensagem");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, tive um probleminha técnico. 😅 Tente novamente!"
      }]);
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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:w-[500px] h-[80vh] md:h-[600px] bg-card border rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-amber-500/10 to-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold">Consultora Premium</h3>
              <p className="text-xs text-muted-foreground">Tire suas dúvidas sobre o plano</p>
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
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
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
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  <span className="text-sm text-muted-foreground">Digitando...</span>
                </div>
              </div>
            )}

            {/* Perguntas sugeridas */}
            {messages.length <= 1 && !isLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground font-medium px-2">💡 Perguntas frequentes:</p>
                <div className="flex flex-col gap-2">
                  {PERGUNTAS_SUGERIDAS.map((pergunta, idx) => (
                    <button
                      key={idx}
                      onClick={() => enviarMensagem(pergunta)}
                      className="text-left text-sm p-3 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/20 hover:border-amber-500/40"
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
              placeholder="Pergunte sobre o Premium..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => enviarMensagem()}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
