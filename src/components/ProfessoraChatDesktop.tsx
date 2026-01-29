import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Send, 
  X, 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  Scale,
  Image,
  FileText,
  Brain,
  MessageCircle,
  Paperclip
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { HighlightedBox } from "@/components/chat/HighlightedBox";
import { ComparisonCarousel } from "@/components/chat/ComparisonCarousel";
import { PracticalCasesCarousel } from "@/components/chat/PracticalCasesCarousel";
import { InfographicTimeline } from "@/components/chat/InfographicTimeline";
import { StatisticsCard } from "@/components/chat/StatisticsCard";
import { LegalStatistics } from "@/components/chat/LegalStatistics";
import { ProcessFlow } from "@/components/chat/ProcessFlow";
import { MarkdownTabs } from "@/components/chat/MarkdownTabs";
import { MarkdownAccordion } from "@/components/chat/MarkdownAccordion";
import { MarkdownSlides } from "@/components/chat/MarkdownSlides";

interface Message {
  role: "user" | "assistant";
  content: string;
  descomplicadoContent?: string;
  isStreaming?: boolean;
}

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

type ChatMode = "study" | "aula" | "recommendation" | "realcase";

interface ProfessoraChatDesktopProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfessoraChatDesktop = ({ isOpen, onClose }: ProfessoraChatDesktopProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ChatMode>("study");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [linguagemMode, setLinguagemMode] = useState<'descomplicado' | 'tecnico'>('descomplicado');
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Notificar parent quando modal abre/fecha
  useEffect(() => {
    if (isOpen && onClose) {
      // Disparar evento customizado quando modal abre
      window.dispatchEvent(new CustomEvent('professora-modal-open'));
    }
    return () => {
      if (isOpen) {
        window.dispatchEvent(new CustomEvent('professora-modal-close'));
      }
    };
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === "aula") {
      navigate('/aula-interativa');
      return;
    }
    setMode(newMode);
    setMessages([]);
    setInput("");
    setUploadedFiles([]);
  };

  const limparConversa = () => {
    setMessages([]);
    setUploadedFiles([]);
    setInput("");
  };

  const handleFileSelect = async (file: File, expectedType: "image" | "pdf") => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploaded: UploadedFile = {
        name: file.name,
        type: file.type,
        data: base64,
      };

      setUploadedFiles((prev) => [...prev, uploaded]);
      sonnerToast.info(`${expectedType === "image" ? "Imagem" : "PDF"} anexada`);
    } catch (error) {
      sonnerToast.error("Erro ao processar arquivo");
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      console.log('🎓 Enviando mensagem para chat-professora:', {
        messagesCount: newMessages.length,
        filesCount: uploadedFiles.length,
        mode,
        linguagemMode
      });

      const { data, error } = await supabase.functions.invoke("chat-professora", {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          files: uploadedFiles,
          mode: mode,
          linguagemMode: linguagemMode,
        },
      });

      console.log('✅ Resposta recebida:', { data, error });

      if (error) {
        console.error('❌ Erro da função:', error);
        throw error;
      }

      if (!data || !data.data) {
        console.error('❌ Resposta inválida. Dados completos:', JSON.stringify(data, null, 2));
        throw new Error('Resposta inválida do servidor');
      }

      setMessages([
        ...newMessages,
        { 
          role: "assistant", 
          content: data.data || data.content || data.tecnico,
          descomplicadoContent: data.descomplicado 
        },
      ]);
      setUploadedFiles([]);
      sonnerToast.success("Resposta recebida!");
    } catch (error) {
      console.error("❌ Erro completo ao enviar mensagem:", error);
      sonnerToast.error("Erro ao enviar mensagem. Tente novamente.");
      // Remove a última mensagem do usuário em caso de erro
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Perguntas comuns
  const commonQuestions = [
    "Qual a diferença entre dolo e culpa?",
    "O que é presunção de inocência?",
    "Explique o princípio da legalidade",
    "O que são direitos fundamentais?",
  ];

  // Função para parsear conteúdo especial (copiado do mobile)
  const parseSpecialContent = (content: string) => {
    let processedContent = content.replace(/\\n\\n\\n\\n/g, '\n\n\n\n')
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n');

    const elements: JSX.Element[] = [];
    let key = 0;

    const comparisonRegex = /\[(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS):\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS)\]/gi;
    const practicalCasesRegex = /\[CASOS_PRATICOS\]\s*(\{[\s\S]*?\})\s*\[\/CASOS_PRATICOS\]/gi;
    const clickableQuestionsRegex = /\[QUESTOES_CLICAVEIS\]([\s\S]*?)\[\/QUESTOES_CLICAVEIS\]/gi;
    const infographicRegex = /\[INFOGRÁFICO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/INFOGRÁFICO\]/gi;
    const statsRegex = /\[ESTATÍSTICAS(?::\s*([^\]]+))?\]\s*(\{[\s\S]*?\})\s*\[\/ESTATÍSTICAS\]/gi;
    const processRegex = /\[PROCESSO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/PROCESSO\]/gi;
    const tabsRegex = /\[TABS:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/TABS\]/gi;
    const accordionRegex = /\[ACCORDION\]\s*(\{[\s\S]*?\})\s*\[\/ACCORDION\]/gi;
    const slidesRegex = /\[SLIDES:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/SLIDES\]/gi;

    const allMatches: Array<{
      index: number;
      length: number;
      type: string;
      match: RegExpMatchArray;
    }> = [];

    // Coletar todas as correspondências
    const compMatches = processedContent.matchAll(comparisonRegex);
    for (const m of compMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'comparison',
          match: m as RegExpMatchArray
        });
      }
    }

    const practicalMatches = processedContent.matchAll(practicalCasesRegex);
    for (const m of practicalMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'practical_cases',
          match: m as RegExpMatchArray
        });
      }
    }

    const questionMatches = processedContent.matchAll(clickableQuestionsRegex);
    for (const m of questionMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'clickable_questions',
          match: m as RegExpMatchArray
        });
      }
    }

    const infoMatches = processedContent.matchAll(infographicRegex);
    for (const m of infoMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'infographic',
          match: m as RegExpMatchArray
        });
      }
    }

    const statMatches = processedContent.matchAll(statsRegex);
    for (const m of statMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'stats',
          match: m as RegExpMatchArray
        });
      }
    }

    const processMatches = processedContent.matchAll(processRegex);
    for (const m of processMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'process',
          match: m as RegExpMatchArray
        });
      }
    }

    const tabMatches = processedContent.matchAll(tabsRegex);
    for (const m of tabMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'tabs',
          match: m as RegExpMatchArray
        });
      }
    }

    const accordionMatches = processedContent.matchAll(accordionRegex);
    for (const m of accordionMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'accordion',
          match: m as RegExpMatchArray
        });
      }
    }

    const slideMatches = processedContent.matchAll(slidesRegex);
    for (const m of slideMatches) {
      if (m.index !== undefined) {
        allMatches.push({
          index: m.index,
          length: m[0].length,
          type: 'slides',
          match: m as RegExpMatchArray
        });
      }
    }

    // Ordenar por índice
    allMatches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    allMatches.forEach(({ index: startIdx, length, type, match }) => {
      const endIdx = startIdx + length;

      // Adicionar texto antes do elemento especial
      if (startIdx > lastIndex) {
        let textBefore = processedContent.substring(lastIndex, startIdx);
        
        if (textBefore.trim()) {
          elements.push(
            <div key={key++} className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 mt-8 leading-tight">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 mt-6 leading-tight">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 mt-5 leading-snug">
                      {children}
                    </h3>
                  ),
                  p: ({ children, node }: any) => {
                    const text = node?.children?.map((child: any) => child.value || '').join('') || '';
                    
                    // Detectar [DICA DE OURO] - regex mais flexível
                    if (text.includes('[DICA DE OURO')) {
                      const match = text.match(/\[DICA DE OURO\s*💎?\s*\]([\s\S]*?)\[\/DICA DE OURO\]/i);
                      if (match) {
                        return (
                          <div className="my-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl flex-shrink-0">💎</span>
                              <div>
                                <strong className="text-yellow-400 block mb-2">DICA DE OURO</strong>
                                <div className="text-foreground text-[15px] md:text-base leading-relaxed">
                                  {match[1].trim()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    }
                    
                    // Detectar [SACOU?] - regex mais flexível
                    if (text.includes('[SACOU?') || text.includes('[SACOU\\?')) {
                      const match = text.match(/\[SACOU\??\s*💡?\s*\]([\s\S]*?)\[\/SACOU\??\]/i);
                      if (match) {
                        return (
                          <div className="my-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl flex-shrink-0">💡</span>
                              <div>
                                <strong className="text-blue-400 block mb-2">SACOU?</strong>
                                <div className="text-foreground text-[15px] md:text-base leading-relaxed">
                                  {match[1].trim()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    }
                    
                    // [FICA LIGADO!]
                    if (text.match(/\[FICA LIGADO/i)) {
                      const match = text.match(/\[FICA LIGADO!?\s*⚠️?\s*\]([\s\S]*?)\[\/FICA LIGADO!?\]/i);
                      if (match) return (<div className="my-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">⚠️</span><div><strong className="text-orange-400 block mb-2">FICA LIGADO!</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{match[1].trim()}</div></div></div></div>);
                    }
                    
                    // [IMPORTANTE]
                    if (text.match(/\[IMPORTANTE\]/i)) {
                      const match = text.match(/\[IMPORTANTE\]([\s\S]*?)\[\/IMPORTANTE\]/i);
                      if (match) return (<div className="my-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">🚨</span><div><strong className="text-red-400 block mb-2">IMPORTANTE</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{match[1].trim()}</div></div></div></div>);
                    }
                    
                    // [ATENÇÃO]
                    if (text.match(/\[ATEN(Ç|C)ÃO\]/i)) {
                      const match = text.match(/\[ATEN(Ç|C)ÃO\]([\s\S]*?)\[\/ATEN(Ç|C)ÃO\]/i);
                      if (match) return (<div className="my-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">⚠️</span><div><strong className="text-orange-400 block mb-2">ATENÇÃO</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{match[2].trim()}</div></div></div></div>);
                    }
                    
                    // [NOTA]
                    if (text.match(/\[NOTA\]/i)) {
                      const match = text.match(/\[NOTA\]([\s\S]*?)\[\/NOTA\]/i);
                      if (match) return (<div className="my-4 p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">📝</span><div><strong className="text-purple-400 block mb-2">NOTA</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{match[1].trim()}</div></div></div></div>);
                    }
                    
                    // [DICA]
                    if (text.match(/^\[DICA\]/i)) {
                      const match = text.match(/\[DICA\]([\s\S]*?)\[\/DICA\]/i);
                      if (match) return (<div className="my-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">💡</span><div><strong className="text-blue-400 block mb-2">DICA</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{match[1].trim()}</div></div></div></div>);
                    }
                    
                    // Detectar [ATENÇÃO], [IMPORTANTE], [DICA], [NOTA], [EXEMPLO]
                    const highlightMatch = text.match(/\[(ATENÇÃO|IMPORTANTE|DICA|NOTA|EXEMPLO)\]([\s\S]*?)\[\/\1\]/i);
                    if (highlightMatch) {
                      const type = highlightMatch[1].toLowerCase();
                      const content = highlightMatch[2].trim();
                      return <HighlightedBox type={type as any}>{content}</HighlightedBox>;
                    }
                    
                    return (
                      <p className="text-foreground text-[15px] md:text-base mb-4 leading-relaxed">
                        {children}
                      </p>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4 text-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground text-[15px] md:text-base leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-primary">
                      {children}
                    </strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/50 pl-6 pr-4 py-4 my-6 bg-primary/5 rounded-r-lg text-foreground/95 text-[15px] leading-relaxed shadow-sm italic">
                      {children}
                    </blockquote>
                  )
                }}
              >
                {textBefore}
              </ReactMarkdown>
            </div>
          );
        }
      }

      // Adicionar elemento especial
      try {
        if (type === 'comparison') {
          const title = match[2]?.trim();
          const jsonStr = match[3]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.cards && Array.isArray(data.cards)) {
            elements.push(<ComparisonCarousel key={key++} title={title} cards={data.cards} />);
          }
        } else if (type === 'practical_cases') {
          const jsonStr = match[1]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.cases && Array.isArray(data.cases)) {
            elements.push(<PracticalCasesCarousel key={key++} cases={data.cases} title="📝 Casos Práticos" />);
          }
        } else if (type === 'clickable_questions') {
          try {
            const rawContent = match[1]?.trim();
            let questions;
            try {
              questions = JSON.parse(rawContent);
            } catch (parseError) {
              const cleaned = rawContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
              questions = JSON.parse(cleaned);
            }
            if (Array.isArray(questions) && questions.length > 0) {
              elements.push(
                <div key={key++} className="my-6">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    💭 Questões para Aprofundamento
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {questions.map((question: string, idx: number) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full text-left justify-start h-auto py-3 px-4 whitespace-normal break-words hover:bg-primary/10 hover:border-primary transition-all group"
                        onClick={() => {
                          setInput(question);
                          setTimeout(() => sendMessage(), 100);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm md:text-base leading-relaxed">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            }
          } catch (e) {
            console.error('❌ Erro ao parsear questões clicáveis:', e);
          }
        } else if (type === 'infographic') {
          const title = match[1]?.trim();
          const jsonStr = match[2]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.steps && Array.isArray(data.steps)) {
            elements.push(<InfographicTimeline key={key++} title={title} steps={data.steps} />);
          }
        } else if (type === 'stats') {
          const title = match[1]?.trim();
          const jsonStr = match[2]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.stats && Array.isArray(data.stats)) {
            elements.push(<LegalStatistics key={key++} title={title} stats={data.stats} />);
          }
        } else if (type === 'process') {
          const title = match[1]?.trim();
          const jsonStr = match[2]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.steps && Array.isArray(data.steps)) {
            elements.push(<ProcessFlow key={key++} title={title} steps={data.steps} />);
          }
        } else if (type === 'tabs') {
          const title = match[1]?.trim();
          const jsonStr = match[2]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.tabs && Array.isArray(data.tabs)) {
            elements.push(<MarkdownTabs key={key++} tabs={data.tabs} />);
          }
        } else if (type === 'accordion') {
          const jsonStr = match[1]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.items && Array.isArray(data.items)) {
            elements.push(<MarkdownAccordion key={key++} items={data.items} />);
          }
        } else if (type === 'slides') {
          const title = match[1]?.trim();
          const jsonStr = match[2]?.trim();
          const data = JSON.parse(jsonStr);
          if (data.slides && Array.isArray(data.slides)) {
            elements.push(<MarkdownSlides key={key++} title={title} slides={data.slides} />);
          }
        }
      } catch (e) {
        console.error(`❌ ERRO ao parsear ${type}:`, e);
        elements.push(
          <div key={key++} className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {match[0]}
            </ReactMarkdown>
          </div>
        );
      }

      lastIndex = endIdx;
    });

    // Adicionar texto restante
    if (lastIndex < processedContent.length) {
      let remainingText = processedContent.substring(lastIndex);

      if (remainingText.trim()) {
        elements.push(
          <div key={key++} className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 mt-8 leading-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 mt-6 leading-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 mt-5 leading-snug">
                    {children}
                  </h3>
                ),
                p: ({ children, node }: any) => {
                  const text = node?.children?.map((child: any) => child.value || '').join('') || '';
                  
                  if (text.includes('[DICA DE OURO')) {
                    const match = text.match(/\[DICA DE OURO\s*💎?\]([\s\S]*?)\[\/DICA DE OURO\]/i);
                    if (match) {
                      return (
                        <div className="my-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">💎</span>
                            <div>
                              <strong className="text-yellow-400 block mb-2">DICA DE OURO</strong>
                              <div className="text-foreground text-[15px] md:text-base leading-relaxed">
                                {match[1].trim()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  if (text.includes('[SACOU?')) {
                    const match = text.match(/\[SACOU\?\s*💡?\]([\s\S]*?)\[\/SACOU\?\]/i);
                    if (match) {
                      return (
                        <div className="my-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">💡</span>
                            <div>
                              <strong className="text-blue-400 block mb-2">SACOU?</strong>
                              <div className="text-foreground text-[15px] md:text-base leading-relaxed">
                                {match[1].trim()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  if (text.includes('[FICA LIGADO!')) {
                    const match = text.match(/\[FICA LIGADO!\s*⚠️?\]([\s\S]*?)\[\/FICA LIGADO!\]/i);
                    if (match) {
                      return (
                        <div className="my-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">⚠️</span>
                            <div>
                              <strong className="text-orange-400 block mb-2">FICA LIGADO!</strong>
                              <div className="text-foreground text-[15px] md:text-base leading-relaxed">
                                {match[1].trim()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  const highlightMatch = text.match(/\[(ATENÇÃO|IMPORTANTE|DICA|NOTA|EXEMPLO)\]([\s\S]*?)\[\/\1\]/i);
                  if (highlightMatch) {
                    const type = highlightMatch[1].toLowerCase();
                    const content = highlightMatch[2].trim();
                    return <HighlightedBox type={type as any}>{content}</HighlightedBox>;
                  }
                  
                  return (
                    <p className="text-foreground text-[15px] md:text-base mb-4 leading-relaxed">
                      {children}
                    </p>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4 text-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground text-[15px] md:text-base leading-relaxed">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-primary">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-6 pr-4 py-4 my-6 bg-primary/5 rounded-r-lg text-foreground/95 text-[15px] leading-relaxed shadow-sm italic">
                    {children}
                  </blockquote>
                )
              }}
            >
              {remainingText}
            </ReactMarkdown>
          </div>
        );
      }
    }

    return elements.length > 0 ? <>{elements}</> : null;
  };

  const renderWelcomeScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 px-6">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Assistente de Estudo</h2>

          <div className="text-left space-y-3 bg-card border border-border rounded-lg p-4">
            <p className="font-semibold">📚 O que posso fazer:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {linguagemMode === 'descomplicado' ? (
                <>
                  <li>• Explicar conceitos jurídicos de forma simples</li>
                  <li>• Usar analogias do dia a dia</li>
                  <li>• Analisar documentos e imagens</li>
                </>
              ) : (
                <>
                  <li>• Esclarecer dúvidas com rigor técnico-jurídico</li>
                  <li>• Analisar documentos jurídicos</li>
                  <li>• Fundamentação legal e doutrinária</li>
                </>
              )}
            </ul>
          </div>

        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay escuro e fosco */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Container principal com grid para sidebar + conteúdo */}
      <div className="relative z-50 flex w-full max-w-7xl mx-auto my-8">
        <div className="flex w-full bg-background rounded-lg shadow-2xl overflow-hidden">
          
          {/* Sidebar Lateral Esquerda */}
          <div className="w-[200px] bg-card border-r border-border flex flex-col p-4 gap-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Modo</h2>
            </div>
            
            {/* Botões de Modo - Verticais */}
            <Button
              variant={mode === "study" ? "default" : "ghost"}
              onClick={() => handleModeChange("study")}
              className="w-full justify-start gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Estudo</span>
            </Button>
            
            <Button
              variant={mode === "aula" ? "default" : "ghost"}
              onClick={() => handleModeChange("aula")}
              className="w-full justify-start gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm">Aula</span>
            </Button>
            
            <Button
              variant={mode === "recommendation" ? "default" : "ghost"}
              onClick={() => handleModeChange("recommendation")}
              className="w-full justify-start gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm">Material</span>
            </Button>
            
            <Button
              variant={mode === "realcase" ? "default" : "ghost"}
              onClick={() => handleModeChange("realcase")}
              className="w-full justify-start gap-2"
            >
              <Scale className="w-4 h-4" />
              <span className="text-sm">Caso Real</span>
            </Button>

            <Separator className="my-2" />

            {/* Toggle de Linguagem - Vertical */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Linguagem</h2>
              
              <Button
                variant={linguagemMode === "descomplicado" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  if (linguagemMode !== 'descomplicado') {
                    setLinguagemMode('descomplicado');
                    limparConversa();
                  }
                }}
              >
                <span>😊</span>
                <span className="text-xs">Descomplicado</span>
              </Button>
              
              <Button
                variant={linguagemMode === "tecnico" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  if (linguagemMode !== 'tecnico') {
                    setLinguagemMode('tecnico');
                    limparConversa();
                  }
                }}
              >
                <span>⚖️</span>
                <span className="text-xs">Técnico</span>
              </Button>
            </div>
          </div>

          {/* Área de Chat Principal */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header Simplificado */}
            <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h1 className="text-xl font-bold">Professora Jurídica</h1>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages Area - responsivo sem gap */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollRef} className="h-full py-4">
                {messages.length === 0 ? (
                  renderWelcomeScreen()
                ) : (
                  <div className="space-y-4 px-6 max-w-4xl mx-auto">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary/60 text-primary-foreground max-w-[80%]"
                              : "bg-muted max-w-[90%]"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="text-[13px] leading-[1.5]">
                              {parseSpecialContent(message.content)}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-[13px] leading-[1.5]">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Professora está pensando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Footer estilo ChatGPT - sempre visível e fixo */}
            <div className="flex-shrink-0 px-6 py-4 bg-background border-t border-border">
              {uploadedFiles.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm"
                      >
                        {file.type.includes("image") ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(index)}>
                          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Container estilo ChatGPT */}
              <div className="bg-muted/30 rounded-2xl border border-border/50 shadow-sm">
                {/* Inputs escondidos */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0], "image")
                  }
                  className="hidden"
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0], "pdf")
                  }
                  className="hidden"
                />

                <div className="px-4 py-3 flex items-center gap-2">
                  {/* Botão de clipe (paperclip) para anexar arquivos */}
                  {mode !== "recommendation" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // Criar menu de opções
                        const options = document.createElement('div');
                        options.className = 'absolute bottom-16 left-4 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1';
                        options.innerHTML = `
                          <button class="upload-option flex items-center gap-2 px-3 py-2 rounded hover:bg-muted w-full text-left text-sm" data-type="image">
                            <span class="w-4 h-4">📷</span>
                            <span>Imagem</span>
                          </button>
                          <button class="upload-option flex items-center gap-2 px-3 py-2 rounded hover:bg-muted w-full text-left text-sm" data-type="pdf">
                            <span class="w-4 h-4">📄</span>
                            <span>PDF</span>
                          </button>
                        `;
                        document.body.appendChild(options);
                        
                        const closeMenu = () => {
                          options.remove();
                          document.removeEventListener('click', closeMenu);
                        };
                        
                        options.querySelectorAll('.upload-option').forEach(btn => {
                          btn.addEventListener('click', (e) => {
                            const type = (e.currentTarget as HTMLElement).dataset.type;
                            if (type === 'image') imageInputRef.current?.click();
                            if (type === 'pdf') pdfInputRef.current?.click();
                            closeMenu();
                          });
                        });
                        
                        setTimeout(() => document.addEventListener('click', closeMenu), 100);
                      }}
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite sua pergunta..."
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    size="icon"
                    className="rounded-full shrink-0"
                  >
                    {isLoading ? (
                      <Brain className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
