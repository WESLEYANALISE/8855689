import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Brain, BookOpen, Scale, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import { useStreamingChat, UploadedFile } from "@/hooks/useStreamingChat";
import { ChatMessageNew } from "@/components/chat/ChatMessageNew";
import { ChatInputNew } from "@/components/chat/ChatInputNew";
import { FloatingFlashcardsButton } from "@/components/chat/FloatingFlashcardsButton";
import { FloatingComparativeButton } from "@/components/chat/FloatingComparativeButton";

import { TypingIndicator } from "@/components/simulacao/TypingIndicator";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { cn } from "@/lib/utils";
import themisFull from "@/assets/themis-full.webp";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumChatGate } from "@/components/PremiumChatGate";

type ChatMode = "study" | "realcase" | "recommendation" | "psychologist" | "tcc" | "refutacao" | "aula";

const MODES = [
  { id: "study", label: "Estudar", icon: BookOpen },
  { id: "realcase", label: "Caso Real", icon: Scale },
  { id: "aula", label: "Criar Aula", icon: GraduationCap },
] as const;

const ChatProfessora = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as ChatMode) || "study";
  
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  
  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = themisFull;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = themisFull;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);
  // OTIMIZAÇÃO: Usar 'concise' como padrão para respostas mais rápidas
  const [responseLevel] = useState<'concise' | 'basic' | 'complete' | 'deep'>('concise');
  const [linguagemMode] = useState<'descomplicado' | 'tecnico'>('tecnico');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    messages,
    isStreaming,
    uploadedFiles,
    setUploadedFiles,
    sendMessage,
    clearChat,
    stopStreaming
  } = useStreamingChat({
    mode,
    responseLevel,
    linguagemMode
  });

  // Configurar worker do PDF.js
  useEffect(() => {
    try {
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    } catch (e) {
      console.warn("Falha ao configurar worker do PDF.js", e);
    }
  }, []);

  // Auto-scroll durante streaming
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    
    const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, autoScroll]);

  // Detectar scroll manual
  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Extrair texto de PDF
  const extractPdfText = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages, 50);
      let fullText = '';
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((it: any) => ('str' in it ? it.str : ''))
          .join(' ');
        fullText += `\n\n[Página ${i}]\n${pageText}`;
      }
      
      return fullText.trim();
    } catch (e) {
      console.error('Erro ao extrair texto do PDF:', e);
      return 'Não foi possível extrair o texto deste PDF.';
    }
  }, []);

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === 'aula') {
      // Verificar Premium antes de criar aula
      if (!isPremium && !loadingSubscription) {
        setShowPremiumGate(true);
        return;
      }
      navigate('/aula-interativa');
      return;
    }
    setMode(newMode);
    clearChat();
  };

  const handleSend = (message: string, files?: UploadedFile[], extractedText?: string) => {
    // Usuários gratuitos podem usar o chat normalmente (sem arquivos)
    const streamMode = files?.length ? 'analyze' : 'chat';
    sendMessage(message, files, extractedText, streamMode);
    setAutoScroll(true);
  };

  // Handler para tópicos clicáveis
  const handleTopicClick = (topic: string) => {
    handleSend(topic);
  };

  // Calcular última mensagem do assistente para o botão flutuante
  const { lastAssistantMessage, assistantMessageCount } = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant' && m.content);
    return {
      lastAssistantMessage: assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : '',
      assistantMessageCount: assistantMessages.length
    };
  }, [messages]);

  // Mostrar botão flutuante apenas quando há resposta do assistente e não está em streaming
  const showFloatingButton = !isStreaming && lastAssistantMessage.length > 100;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d0a0a] to-background relative overflow-hidden">
      {/* Imagem de Têmis - Fundo de tela toda */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img 
          src={themisFull} 
          alt="Têmis" 
          className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-15' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a0a]/80 via-transparent to-[#1a0a0a]/90" />
      </div>
      
      {/* Header */}
      <header className="flex-shrink-0 border-b border-red-900/30 bg-[#1a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a0a0a]/60 relative z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h1 className="font-semibold text-white">Professora</h1>
                <p className="text-xs text-white/60">Assistente de Estudos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mode Tabs - 3 opções com tamanho igual */}
        <div className="px-4 pb-3">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as ChatMode)} className="w-full">
            <TabsList className="flex w-full h-10 gap-1 bg-transparent p-0">
              {MODES.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-full border transition-all",
                    "data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:border-red-700",
                    "data-[state=inactive]:bg-white/5 data-[state=inactive]:text-white/70 data-[state=inactive]:border-white/10 data-[state=inactive]:hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Messages - sem virtualização para evitar perda de scroll */}
      <ScrollArea ref={scrollRef} className="flex-1 relative z-10">
        <div className="p-4 space-y-4 pb-8 min-h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-8">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2 font-playfair">
                  A Justiça te guia.
                </h2>
                <p className="text-white/60 max-w-xs mb-6">
                  Pergunte sobre Direito.
                </p>
                <SuggestedQuestions mode={mode} onQuestionClick={handleTopicClick} />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const showTyping = isStreaming && isLastMessage && message.role === 'assistant' && !message.content;
                
                // Se é a última mensagem do assistant e ainda não tem conteúdo, mostra typing
                if (showTyping) {
                  return <TypingIndicator key={`typing-${message.id}`} variant="chat" />;
                }
                
                return (
                  <ChatMessageNew
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    termos={message.termos}
                    isStreaming={message.isStreaming}
                    onTopicClick={handleTopicClick}
                  />
                );
              })}
              {/* Typing indicator - mostra quando última mensagem é do usuário */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <TypingIndicator key="typing-indicator" variant="chat" />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInputNew
        onSend={handleSend}
        isStreaming={isStreaming}
        onStop={stopStreaming}
        uploadedFiles={uploadedFiles}
        onFilesChange={setUploadedFiles}
        onExtractPdf={extractPdfText}
      />

      {/* Botão Flutuante de Tabela Comparativa */}
      <FloatingComparativeButton
        isVisible={showFloatingButton}
        lastAssistantMessage={lastAssistantMessage}
      />

      {/* Botão Flutuante de Flashcards */}
      <FloatingFlashcardsButton
        isVisible={showFloatingButton}
        lastAssistantMessage={lastAssistantMessage}
        messageCount={assistantMessageCount}
      />
      
      {/* Gate Premium - mostra quando usuário tenta enviar mensagem sem ser Premium */}
      {showPremiumGate && (
        <PremiumChatGate onClose={() => setShowPremiumGate(false)} />
      )}
    </div>
  );
};

export default ChatProfessora;
