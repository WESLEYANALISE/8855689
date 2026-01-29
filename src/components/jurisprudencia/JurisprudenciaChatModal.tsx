import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  enunciado?: string;
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  textoTese?: string;
  textoEmenta?: string;
}

interface JurisprudenciaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: JurisprudenciaItem;
}

// Função para gerar perguntas contextuais baseadas na jurisprudência
function gerarPerguntasSugeridas(item: JurisprudenciaItem): string[] {
  const titulo = item.titulo;
  const tribunal = item.tribunal || 'Tribunal';
  const tipo = item.tipo;
  
  // Perguntas base
  const perguntas: string[] = [];
  
  // Pergunta sobre impacto
  perguntas.push(`Qual é o impacto prático do ${titulo} na advocacia?`);
  
  // Pergunta sobre fundamentos
  if (tipo?.includes('repercussao') || tipo?.includes('repetitivo')) {
    perguntas.push(`Quais são os fundamentos constitucionais do ${titulo}?`);
  } else {
    perguntas.push(`Quais são os fundamentos legais do ${titulo}?`);
  }
  
  // Pergunta sobre aplicação
  perguntas.push(`Em quais situações posso usar o ${titulo} em minhas petições?`);
  
  // Pergunta sobre exceções/divergências
  if (tipo?.includes('sumula')) {
    perguntas.push(`Existem exceções à aplicação desta súmula?`);
  } else {
    perguntas.push(`Existe jurisprudência divergente sobre este tema?`);
  }
  
  return perguntas;
}

export function JurisprudenciaChatModal({ 
  isOpen, 
  onClose, 
  item 
}: JurisprudenciaChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState(1); // 0=pequena, 1=normal, 2=grande
  const scrollRef = useRef<HTMLDivElement>(null);

  const perguntasSugeridas = gerarPerguntasSugeridas(item);

  const aumentarFonte = () => setTamanhoFonte(prev => Math.min(2, prev + 1));
  const diminuirFonte = () => setTamanhoFonte(prev => Math.max(0, prev - 1));

  // Classes de fonte baseadas no tamanho
  const classesFonte = tamanhoFonte === 0 ? 'text-[10px]' : tamanhoFonte === 1 ? 'text-[11px]' : 'text-xs';
  const classesFonteUser = tamanhoFonte === 0 ? 'text-[10px]' : tamanhoFonte === 1 ? 'text-[11px]' : 'text-xs';

  // Mensagem de boas-vindas ao abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const textoBase = item.textoTese || item.tese || item.enunciado || item.ementa || item.texto || '';
      const textoResumo = textoBase.length > 200 ? textoBase.substring(0, 200) + '...' : textoBase;
      
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Olá! 👋 Sou a Professora e vou te ajudar a entender o **${item.titulo}**${item.tribunal ? ` (${item.tribunal})` : ''}.\n\n📌 **Sobre esta jurisprudência:** ${textoResumo}\n\nFique à vontade para me fazer qualquer pergunta sobre esta decisão! 📚`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, item]);

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const enviarMensagem = async (mensagemTexto?: string) => {
    const textoParaEnviar = mensagemTexto || input;
    if (!textoParaEnviar.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textoParaEnviar };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Preparar contexto da jurisprudência para a professora
      const contextoJurisprudencia = {
        tipo: 'jurisprudencia',
        nome: item.titulo,
        resumo: `Tribunal: ${item.tribunal || 'N/A'}. ${item.textoTese || item.tese || item.enunciado || item.ementa || item.texto || ''}`.substring(0, 1000),
        dados_adicionais: {
          tribunal: item.tribunal,
          data: item.data,
          relator: item.relator,
          tipo: item.tipo,
          textoCompleto: `${item.textoTese || item.tese || ''}\n\n${item.textoEmenta || item.ementa || ''}\n\n${item.enunciado || item.texto || ''}`.substring(0, 3000)
        }
      };

      const { data, error } = await supabase.functions.invoke('chat-professora-jurista', {
        body: {
          messages: [...messages, userMessage],
          contexto: contextoJurisprudencia,
          linguagemMode: 'simples' // Usar linguagem simples por padrão
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.resposta
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao conversar com a professora');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const selecionarPergunta = (pergunta: string) => {
    enviarMensagem(pergunta);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full md:w-[420px] h-[85vh] md:h-[600px] bg-card border rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-violet-500/10 to-background">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-base">👩‍🏫</span>
            </div>
            <div>
              <h3 className="font-bold text-sm">Professora</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                {item.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Botões de fonte */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={diminuirFonte}
              disabled={tamanhoFonte === 0}
              className="w-7 h-7"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={aumentarFonte}
              disabled={tamanhoFonte === 2}
              className="w-7 h-7"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3" ref={scrollRef}>
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className={`prose prose-sm dark:prose-invert max-w-none ${classesFonte} leading-relaxed [&>p]:mb-1.5 [&>p]:mt-0`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className={classesFonteUser}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                </div>
              </div>
            )}
            
            {/* Perguntas sugeridas - apenas no início */}
            {messages.length <= 1 && !isLoading && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] text-muted-foreground font-medium px-1">
                  💡 Perguntas sugeridas:
                </p>
                <div className="flex flex-col gap-1.5">
                  {perguntasSugeridas.map((pergunta, idx) => (
                    <button
                      key={idx}
                      onClick={() => selecionarPergunta(pergunta)}
                      className="text-left text-[10px] p-2 rounded-lg bg-violet-500/5 hover:bg-violet-500/10 transition-colors border border-violet-500/20 hover:border-violet-500/40 leading-snug"
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
        <div className="p-3 border-t bg-background/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Faça uma pergunta sobre a jurispru..."
              disabled={isLoading}
              className="flex-1 text-xs h-9"
            />
            <Button
              onClick={() => enviarMensagem()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-violet-600 hover:bg-violet-700 w-9 h-9"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
