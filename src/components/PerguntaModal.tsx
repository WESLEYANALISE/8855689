import { useState, useRef, useEffect } from "react";
import { X, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AssistantMessage } from "./AssistantMessage";
interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  showActions?: boolean;
}
interface PerguntaModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
}
const PerguntaModal = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo
}: PerguntaModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [linguagemMode, setLinguagemMode] = useState<'descomplicado' | 'tecnico'>('tecnico');
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  
  // Perguntas pré-prontas dinâmicas baseadas no artigo
  const getPerguntasProntas = () => {
    const perguntasBase = [
      "O que significa este artigo na prática?",
      "Quais são as exceções ou ressalvas?",
      "Como se aplica em casos reais?",
      "Tem relação com outros artigos?"
    ];
    
    const perguntasEspecificas = [
      `Quais são as pegadinhas comuns em provas sobre o Art. ${numeroArtigo}?`,
      "Pode dar um exemplo prático do dia a dia?",
      "Qual a consequência de violar este artigo?",
      "Como memorizar os pontos principais?"
    ];
    
    // Alternar entre base e específicas
    return [...perguntasBase.slice(0, 2), ...perguntasEspecificas.slice(0, 2)];
  };
  
  const perguntasProntas = getPerguntasProntas();
  
  // Enviar mensagem inicial da professora quando o modal abre
  useEffect(() => {
    if (isOpen && !initialMessageSent && artigo && numeroArtigo) {
      setInitialMessageSent(true);
      enviarMensagemInicial();
    }
  }, [isOpen, artigo, numeroArtigo, initialMessageSent]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInitialMessageSent(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  const enviarMensagemInicial = async () => {
    setLoading(true);
    
    try {
      const promptInicial = `Você é a professora Juris do app de estudos jurídicos. O aluno clicou em "Perguntar" sobre um artigo específico.

CONTEXTO DO ARTIGO:
Art. ${numeroArtigo}
${artigo}

SUA TAREFA:
1. Cumprimente brevemente o aluno (seja calorosa mas concisa)
2. Dê uma explicação MUITO BREVE do artigo (2-3 linhas no máximo)
3. Pergunte o que ele gostaria de saber sobre esse artigo

FORMATO:
- Seja simpática e didática
- Use emojis com moderação (1-2 no máximo)
- Mantenha a resposta curta e convidativa
- Termine com uma pergunta aberta`;

      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
            'Authorization': `Bearer ${session.data.session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: promptInicial }],
            files: [],
            mode: 'study',
            responseLevel: 'complete',
            linguagemMode: 'descomplicado'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao iniciar conversa (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      setMessages([{
        role: "assistant",
        content: "",
        suggestions: []
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            let payloadStr = trimmed;
            if (trimmed.startsWith('data:')) {
              payloadStr = trimmed.slice(5).trim();
              if (payloadStr === '[DONE]') continue;
            }

            try {
              const parsed = JSON.parse(payloadStr);
              // Formato OpenAI: choices[0].delta.content
              const content = parsed?.choices?.[0]?.delta?.content || parsed?.content || '';
              
              if (content) {
                accumulatedText += content;
                
                setMessages([{
                  role: 'assistant',
                  content: accumulatedText,
                  suggestions: [],
                  showActions: false
                }]);
              }

              // Verificar se terminou (formato OpenAI ou custom)
              if (parsed?.choices?.[0]?.finish_reason === 'stop' || parsed?.done) {
                setMessages([{
                  role: 'assistant',
                  content: accumulatedText,
                  suggestions: [],
                  showActions: true
                }]);
                break;
              }
            } catch (parseError) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro na mensagem inicial:", error);
      // Fallback: mostrar mensagem estática
      setMessages([{
        role: "assistant",
        content: `Olá! 👋 Vejo que você está estudando o Art. ${numeroArtigo}.\n\nEsse artigo trata sobre: ${artigo.substring(0, 150)}...\n\nO que você gostaria de saber sobre ele?`,
        showActions: true
      }]);
    } finally {
      setLoading(false);
    }
  };
  const enviarPergunta = async (pergunta: string) => {
    if (!pergunta.trim() || loading) return;
    
    const userMessage: Message = {
      role: "user",
      content: pergunta
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Preparar mensagens no formato esperado pela edge function
      let contextualPrompt = '';
      
      if (linguagemMode === 'descomplicado') {
        contextualPrompt = `Você é uma professora de Direito didática explicando de forma acessível e clara.

🎯 MODO DESCOMPLICADO - LINGUAGEM ACESSÍVEL E DIDÁTICA

TOM OBRIGATÓRIO:
- Linguagem CLARA e ACESSÍVEL, mas SEM gírias excessivas
- Use vocabulário simples e direto, como um bom professor explicando
- Evite juridiquês, mas mantenha seriedade profissional
- Analogias modernas e exemplos práticos SIM, gírias como "mano", "tipo", "massa" NÃO
- Traduza termos técnicos: "X (que significa Y em linguagem simples)"
- Tom didático, amigável, mas respeitoso e profissional

PERMITIDO:
✅ "Vamos entender...", "Para facilitar...", "Pense da seguinte forma..."
✅ Analogias com situações cotidianas (Uber, Netflix, redes sociais)
✅ Exemplos práticos e concretos
✅ Linguagem direta e objetiva

PROIBIDO:
❌ Gírias: "mano", "cara", "tipo assim", "sacou?", "massa", "na moral"
❌ Interjeições informais: "nossa", "caramba", "viu?", "peraí"
❌ Tom de conversa casual de WhatsApp
❌ Juridiquês desnecessário: "cumpre salientar", "preceitua"

O estudante está analisando o seguinte artigo:
Art. ${numeroArtigo} - ${artigo}

Pergunta: ${pergunta}

Explique de forma acessível, mas profissional, usando exemplos práticos quando relevante.`;
      } else {
        contextualPrompt = `Você é um assistente jurídico especialista e didático. 

O estudante está analisando o seguinte artigo:

Art. ${numeroArtigo}
${artigo}

Responda de forma clara, técnica e precisa. Use terminologia jurídica apropriada e exemplos práticos quando relevante.

Pergunta do estudante: ${pergunta}`;
      }
      
      const allMessages = [
        ...messages,
        {
          role: "user" as const,
          content: contextualPrompt
        }
      ];

      const session = await supabase.auth.getSession();
      
      // Fazer chamada com streaming SSE
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
            'Authorization': `Bearer ${session.data.session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            files: [],
            mode: 'study',
            responseLevel: 'complete',
            linguagemMode: linguagemMode
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', response.status, errorText);
        if (response.status === 429) {
          throw new Error('⏱️ Limite de perguntas atingido. Aguarde alguns minutos.');
        }
        throw new Error(`Erro ao processar pergunta (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      // Criar mensagem do assistente vazia
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "",
        suggestions: []
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            let payloadStr = trimmed;
            if (trimmed.startsWith('data:')) {
              payloadStr = trimmed.slice(5).trim();
              if (payloadStr === '[DONE]') continue;
            }

            try {
              const parsed = JSON.parse(payloadStr);
              // Formato OpenAI: choices[0].delta.content
              const content = parsed?.choices?.[0]?.delta?.content || parsed?.content || '';
              
              if (content) {
                accumulatedText += content;
                
                // Atualizar mensagem em tempo real
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: accumulatedText,
                    suggestions: [],
                    showActions: false
                  };
                  return newMessages;
                });
              }

              // Verificar se terminou (formato OpenAI ou custom)
              if (parsed?.choices?.[0]?.finish_reason === 'stop' || parsed?.done) {
                // Atualizar para mostrar ações
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    showActions: true
                  };
                  return newMessages;
                });
                break;
              }
            } catch (parseError) {
              // Ignore parse errors
            }
          }
        }

        // Se não recebeu conteúdo, mostrar erro
        if (!accumulatedText) {
          throw new Error('Não foi possível gerar resposta');
        }
      }
    } catch (error: any) {
      console.error("Erro ao enviar pergunta:", error);

      const errorMsg = error?.message || String(error);
      let description = "Não foi possível enviar sua pergunta. Tente novamente.";
      
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
        description = "⏱️ Limite de perguntas atingido. Aguarde alguns minutos.";
      }

      toast({
        title: "Erro",
        description,
        variant: "destructive"
      });

      // Remover mensagem do assistente se houver erro
      setMessages(prev => {
        if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setMessages([]);
    setInput("");
    setInitialMessageSent(false);
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border/50 bg-secondary/30">
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-yellow-500">👩‍🏫 Professora Juris</h2>
          <p className="text-sm text-foreground/70">Art. {numeroArtigo}</p>
          
          {/* Toggle Descomplicado/Técnico */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setLinguagemMode('descomplicado')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                linguagemMode === 'descomplicado'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-secondary/50 text-foreground/60'
              }`}
            >
              😊 Descomplicado
            </button>
            <button
              onClick={() => setLinguagemMode('tecnico')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                linguagemMode === 'tecnico'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-secondary/50 text-foreground/60'
              }`}
            >
              👔 Técnico
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Layout mais largo */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-secondary/20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex gap-1 mb-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-sm text-muted-foreground">A professora está analisando o artigo...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">👩‍🏫</div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Converse com a Professora Juris
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Aguarde, a professora está preparando a explicação...
                </p>
              </div>
            ) : <>
              {messages.map((msg, idx) => <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`w-full rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-yellow-500/20 text-foreground border border-yellow-500/30" : "bg-secondary/50 text-foreground border border-border/30"}`}>
                    {msg.role === "assistant" ? (
                      <>
                        <AssistantMessage 
                          content={msg.content}
                          onAskSuggestion={(suggestion) => enviarPergunta(suggestion)}
                        />
                        
                        {/* Sugestões de perguntas pré-prontas - Layout vertical */}
                        {msg.showActions && msg.content && (
                          <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium mb-2">💡 Sugestões:</p>
                            <div className="flex flex-col gap-2">
                              {perguntasProntas.map((pergunta, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => enviarPergunta(pergunta)}
                                  disabled={loading}
                                  className="text-left px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all text-sm text-foreground"
                                >
                                  {pergunta}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>)}
              {loading && <div className="flex justify-start w-full">
                  <div className="bg-secondary/50 border border-border/30 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "0ms"
              }} />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "150ms"
              }} />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{
                animationDelay: "300ms"
              }} />
                    </div>
                  </div>
                </div>}
            <div ref={messagesEndRef} />
          </>}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border/50 bg-secondary/30">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarPergunta(input);
          }
        }} placeholder="Digite sua pergunta..." className="flex-1 bg-input text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-border/50" disabled={loading} />
          <Button onClick={() => enviarPergunta(input)} disabled={loading || !input.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-black px-6">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>;
};
export default PerguntaModal;