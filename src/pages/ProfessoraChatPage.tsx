import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  ArrowLeft, 
  GraduationCap,
  Sparkles,
  Trash2,
  Image,
  FileText,
  Paperclip,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamingChat, UploadedFile } from "@/hooks/useStreamingChat";
import { ChatMessageNew } from "@/components/chat/ChatMessageNew";

export default function ProfessoraChatPage() {
  const navigate = useNavigate();
  const [thinkingTime, setThinkingTime] = useState(0);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isStreaming,
    uploadedFiles,
    setUploadedFiles,
    sendMessage,
    clearChat,
    stopStreaming
  } = useStreamingChat({
    mode: 'study',
    responseLevel: 'complete',
    linguagemMode: 'descomplicado'
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Timer for thinking indicator
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming) {
      setThinkingTime(0);
      interval = setInterval(() => {
        setThinkingTime(prev => prev + 100);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
      setThinkingTime(0);
    };
  }, [isStreaming]);

  const handleSend = () => {
    if (!input.trim() && !uploadedFiles.length) return;
    if (isStreaming) return;
    
    sendMessage(input.trim(), uploadedFiles);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File, type: 'image' | 'pdf') => {
    setIsProcessingFile(true);
    setShowAttachMenu(false);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploaded: UploadedFile = {
        name: file.name,
        type: file.type,
        data: base64
      };

      setUploadedFiles([...uploadedFiles, uploaded]);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const suggestedQuestions = [
    "O que é princípio da legalidade?",
    "Explique habeas corpus de forma simples",
    "Qual a diferença entre dolo e culpa?",
    "O que são direitos fundamentais?",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0505] via-[#1a0a0a] to-[#0a0505] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a0a0a]/95 backdrop-blur-lg border-b border-red-900/30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <h1 className="font-playfair text-lg font-bold text-amber-100">Professora</h1>
              <p className="text-xs text-white/50">Assistente Jurídica</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          <div className="py-6 space-y-6 min-h-full">
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 mb-6">
                  <GraduationCap className="w-12 h-12 text-amber-400" />
                </div>
                <h2 className="text-2xl font-playfair font-bold text-amber-100 mb-2">
                  Olá! Sou a Professora.
                </h2>
                <p className="text-white/60 max-w-md mb-8">
                  Sua assistente jurídica pessoal. Pergunte qualquer dúvida sobre Direito e te explico de forma clara e didática.
                </p>

                {/* Suggested questions */}
                <div className="w-full max-w-lg">
                  <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">
                    Sugestões para começar
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => {
                          setInput(question);
                          textareaRef.current?.focus();
                        }}
                        className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all text-sm text-white/70 hover:text-white"
                      >
                        <Sparkles className="w-3 h-3 inline mr-2 text-amber-400" />
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === 'user' 
                      ? 'bg-amber-600/20 border border-amber-500/30 text-white' 
                      : 'bg-white/5 border border-white/10'
                  )}>
                    {msg.role === 'assistant' && msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-3 p-2">
                        <motion.span
                          className="text-xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🧠
                        </motion.span>
                        <span className="text-blue-400 font-medium">Analisando...</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-blue-400"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ChatMessageNew 
                        role={msg.role}
                        content={msg.content}
                        termos={msg.termos}
                        isStreaming={msg.isStreaming}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-gradient-to-t from-[#1a0a0a] via-[#1a0a0a] to-transparent pt-6 pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm border border-white/20"
                  >
                    {file.type.includes('image') ? (
                      <Image className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-red-400" />
                    )}
                    <span className="max-w-32 truncate text-white/80">{file.name}</span>
                    <button 
                      onClick={() => removeFile(index)}
                      className="hover:text-red-400 text-white/60"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3 bg-white/5 border border-white/20 rounded-2xl p-2 focus-within:border-amber-500/50 transition-colors">
              {/* Attach button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  disabled={isStreaming || isProcessingFile}
                  className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  {isProcessingFile ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </Button>

                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-14 left-0 bg-[#2a1515] border border-white/20 rounded-xl shadow-xl p-2 min-w-40 z-50"
                    >
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-white/80"
                      >
                        <Image className="w-4 h-4 text-blue-400" />
                        Imagem
                      </button>
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-white/80"
                      >
                        <FileText className="w-4 h-4 text-red-400" />
                        PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'image');
                    e.target.value = '';
                  }}
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'pdf');
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta..."
                className="flex-1 min-h-[44px] max-h-[150px] resize-none bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 text-base py-3"
                rows={1}
                disabled={isStreaming}
              />

              {/* Send/Stop button */}
              <Button
                onClick={isStreaming ? stopStreaming : handleSend}
                disabled={!input.trim() && !uploadedFiles.length && !isStreaming}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all",
                  isStreaming 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {isStreaming ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-white/30 mt-3">
              A Professora pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
