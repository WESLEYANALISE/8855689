import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Brain, User, BookOpen, X, HelpCircle, Layers, ChevronDown, Loader2, Copy, Check, Sparkles, GraduationCap, Lightbulb, MessageCircle, FileText, BookMarked, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { QuadroComparativoVisual, extrairTabelaDoMarkdown } from "@/components/oab/QuadroComparativoVisual";

interface TermoJuridico {
  termo: string;
  definicao: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  termos?: TermoJuridico[]; // Termos extraídos dinamicamente pela API
  isStreaming?: boolean;
  onTopicClick?: (topic: string) => void;
}

// Dicionário de termos jurídicos com definições reais
const DICIONARIO_TERMOS: Record<string, string> = {
  // Direito Penal - Geral
  "legítima defesa": "Excludente de ilicitude prevista no Art. 25 do CP. Ocorre quando alguém, usando moderadamente dos meios necessários, repele injusta agressão, atual ou iminente, a direito seu ou de outrem.",
  "iminente": "Que está prestes a acontecer; próximo no tempo. No Direito Penal, refere-se a uma situação de perigo imediato que justifica ação defensiva antes que o dano ocorra.",
  "ilicitude": "Qualidade daquilo que é contrário ao direito; antijuridicidade. É um dos elementos do crime, junto com a tipicidade e a culpabilidade.",
  "excludente": "Causa que afasta ou exclui a responsabilidade penal do agente. As excludentes de ilicitude são: legítima defesa, estado de necessidade, estrito cumprimento do dever legal e exercício regular de direito.",
  "tipicidade": "Adequação da conduta ao tipo penal descrito em lei. É um dos elementos do crime.",
  "culpabilidade": "Juízo de reprovação pessoal sobre o autor do fato típico e ilícito. Exige imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa.",
  "dolo": "Vontade consciente de praticar o crime. O agente quer o resultado ou assume o risco de produzi-lo.",
  "culpa": "Inobservância do dever de cuidado objetivo, manifestada por negligência, imprudência ou imperícia.",
  "crime": "Fato típico, ilícito e culpável. Conduta humana que viola a lei penal.",
  "pena": "Sanção imposta pelo Estado ao autor de uma infração penal. Pode ser privativa de liberdade, restritiva de direitos ou multa.",
  "furto": "Crime previsto no Art. 155 do CP. Consiste em subtrair coisa alheia móvel para si ou para outrem. Pena: reclusão de 1 a 4 anos e multa.",
  "furto qualificado": "Furto praticado com circunstâncias agravantes (Art. 155, §4º CP): destruição de obstáculo, abuso de confiança, mediante fraude, escalada, destreza, chave falsa ou concurso de pessoas. Pena: reclusão de 2 a 8 anos.",
  "roubo": "Crime previsto no Art. 157 do CP. Subtrair coisa móvel alheia mediante grave ameaça ou violência. Pena: reclusão de 4 a 10 anos e multa.",
  "latrocínio": "Roubo seguido de morte (Art. 157, §3º CP). É crime hediondo. Pena: reclusão de 20 a 30 anos.",
  "estelionato": "Crime previsto no Art. 171 do CP. Obter vantagem ilícita mediante artifício, ardil ou qualquer meio fraudulento. Pena: reclusão de 1 a 5 anos e multa.",
  "homicídio": "Crime previsto no Art. 121 do CP. Matar alguém. Pode ser simples, qualificado, privilegiado ou culposo.",
  "lesão corporal": "Crime previsto no Art. 129 do CP. Ofender a integridade corporal ou a saúde de outrem.",
  "responsabilidade civil": "Obrigação de reparar o dano causado a outrem. Pode ser contratual ou extracontratual (aquiliana).",
  "responsabilidade civil objetiva": "Modalidade de responsabilidade civil que independe de culpa do agente. Basta a comprovação do dano e do nexo causal.",
  "responsabilidade civil subjetiva": "Modalidade de responsabilidade civil que exige a comprovação de culpa ou dolo do agente causador do dano.",
  "dano moral": "Lesão aos direitos da personalidade, como honra, imagem, nome e intimidade. Gera direito à indenização.",
  "dano material": "Prejuízo patrimonial sofrido pela vítima. Compreende os danos emergentes e os lucros cessantes.",
  "nexo causal": "Relação de causa e efeito entre a conduta do agente e o dano sofrido pela vítima.",
  "usucapião": "Modo originário de aquisição da propriedade pela posse prolongada do bem.",
  "contraditório": "Princípio constitucional que garante às partes o direito de serem ouvidas.",
  "ampla defesa": "Princípio constitucional que assegura ao acusado todos os meios de defesa.",
  "devido processo legal": "Princípio que garante que ninguém será privado de seus bens ou liberdade sem o devido processo.",
  "presunção de inocência": "Princípio pelo qual ninguém será considerado culpado até o trânsito em julgado.",
  "habeas corpus": "Remédio constitucional que protege a liberdade de locomoção contra ilegalidade ou abuso de poder.",
  "mandado de segurança": "Remédio constitucional que protege direito líquido e certo não amparado por habeas corpus ou habeas data.",
  "cláusula pétrea": "Dispositivo constitucional que não pode ser abolido por emenda constitucional (Art. 60, §4º CF).",
  "controle de constitucionalidade": "Mecanismo de verificação da compatibilidade de leis com a Constituição Federal.",
};

// Extrair termos jurídicos do texto com definições reais
const extractTerms = (content: string): { termo: string; definicao: string }[] => {
  const terms: { termo: string; definicao: string }[] = [];
  const contentLower = content.toLowerCase();
  const foundTerms = new Set<string>();
  
  for (const [termo, definicao] of Object.entries(DICIONARIO_TERMOS)) {
    if (contentLower.includes(termo.toLowerCase()) && !foundTerms.has(termo)) {
      foundTerms.add(termo);
      terms.push({ termo, definicao });
    }
  }
  
  return terms.slice(0, 10);
};

// Extrair tópicos clicáveis (bullet points)
const extractClickableTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-•*]\s+/.test(trimmed)) {
      const topic = trimmed.replace(/^[-•*]\s+/, '').trim();
      if (topic.length > 5 && topic.length < 150) {
        topics.push(topic);
      }
    }
  }
  
  return topics;
};

interface Questao {
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export const ChatMessageNew = memo(({ role, content, termos: propTermos, isStreaming, onTopicClick }: ChatMessageProps) => {
  const isUser = role === "user";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"tecnico" | "termos">("tecnico");
  const [selectedTerm, setSelectedTerm] = useState<{ termo: string; definicao: string } | null>(null);
  const [termDeepening, setTermDeepening] = useState<string | null>(null);
  const [deepeningContent, setDeepeningContent] = useState<string>("");
  const [loadingDeepening, setLoadingDeepening] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Estados para os modais flutuantes
  const [showQuestoes, setShowQuestoes] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [currentQuestaoIndex, setCurrentQuestaoIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingAula, setLoadingAula] = useState(false);
  const [loadingExemplo, setLoadingExemplo] = useState(false);
  
  // Estados para geração de aula com progresso
  const [aulaProgresso, setAulaProgresso] = useState(0);
  const [aulaMensagem, setAulaMensagem] = useState("");
  const [aulaGerada, setAulaGerada] = useState<any>(null);
  const [showAulaModal, setShowAulaModal] = useState(false);
  
  // Formatar conteúdo
  const formattedContent = !isStreaming && content
    ? content
        .replace(/(\n)(##\s)/g, '\n\n$2')
        .replace(/(\n)(\*\*[^*]+\*\*:)/g, '\n\n$2')
        .replace(/(\n)([-•]\s)/g, '\n$2')
    : content;

  // Usar termos da API se disponíveis, senão extrair do conteúdo
  const terms = useMemo(() => {
    if (!isStreaming && propTermos && propTermos.length > 0) {
      return propTermos;
    }
    return !isStreaming ? extractTerms(content) : [];
  }, [content, isStreaming, propTermos]);
  const clickableTopics = useMemo(() => !isStreaming ? extractClickableTopics(content) : [], [content, isStreaming]);

  // Copiar texto formatado
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Texto copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Não precisa mais gerar descomplicado - já vem da API

  // Aprofundar termo
  const handleAprofundarTermo = async (termo: string) => {
    setLoadingDeepening(true);
    setTermDeepening(termo);
    try {
      const { data, error } = await supabase.functions.invoke('chat-professora', {
        body: {
          messages: [{ role: 'user', content: `Explique detalhadamente o termo jurídico "${termo}" com:\n1. Definição técnica completa\n2. Fundamento legal (artigos de lei)\n3. Um exemplo prático do dia a dia\n4. Jurisprudência relevante (se houver)\n\nSeja didático e completo.` }],
          mode: 'study',
          linguagemMode: 'tecnico',
          responseLevel: 'complete'
        }
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'string') {
        setDeepeningContent(data);
      }
    } catch (error) {
      console.error('Erro ao aprofundar termo:', error);
      toast.error('Erro ao aprofundar termo');
    } finally {
      setLoadingDeepening(false);
    }
  };

  // Funções de ação
  const handleAprofundar = () => {
    if (onTopicClick) {
      onTopicClick(`Aprofunde mais sobre: ${content.substring(0, 200)}`);
    }
  };

  const handleGerarQuestoes = async () => {
    setLoadingQuestoes(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-questoes-chat', {
        body: { conteudo: content }
      });
      
      if (error) throw error;
      
      if (data?.questoes && data.questoes.length > 0) {
        setQuestoes(data.questoes);
        setCurrentQuestaoIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowQuestoes(true);
      } else {
        toast.error('Não foi possível gerar questões');
      }
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      toast.error('Erro ao gerar questões');
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const handleGerarFlashcards = async () => {
    setLoadingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-flashcards', {
        body: { content }
      });
      
      if (error) throw error;
      
      if (data?.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setShowFlashcards(true);
      } else {
        toast.error('Não foi possível gerar flashcards');
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
      toast.error('Erro ao gerar flashcards');
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleCompartilhar = () => {
    const text = encodeURIComponent(`📚 *Estudando com a Professora*\n\n${content}\n\n_App Direito_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Gerar PDF ABNT
  const handleGerarPDFABNT = async () => {
    setLoadingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-abnt', {
        body: { 
          content: content,
          titulo: "Trabalho Acadêmico - Professora Jurídica",
          autor: "Estudante",
          instituicao: "Instituição de Ensino",
          local: "Brasil",
          ano: new Date().getFullYear().toString(),
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      toast.success('PDF ABNT gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  // Gerar Aula com progresso (usando streaming)
  const handleGerarAula = async () => {
    setLoadingAula(true);
    setShowAulaModal(true);
    setAulaProgresso(5);
    setAulaMensagem("Iniciando geração da aula...");
    setAulaGerada(null);
    
    try {
      const tema = content.substring(0, 300).replace(/[#*_\n]/g, ' ').trim();
      
      setAulaProgresso(10);
      setAulaMensagem("Preparando estrutura da aula...");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-aula-streaming`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ tema })
        }
      );
      
      if (!response.ok) throw new Error('Erro ao gerar aula');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Sem reader');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.type === 'progress') {
              setAulaProgresso(parsed.progress || 0);
              setAulaMensagem(parsed.message || "Gerando conteúdo...");
            } else if (parsed.type === 'complete' && parsed.estrutura) {
              setAulaProgresso(100);
              setAulaMensagem("Aula pronta! 🎓");
              setAulaGerada(parsed.estrutura);
            }
          } catch {}
        }
      }
      
    } catch (error) {
      console.error('Erro ao gerar aula:', error);
      toast.error('Erro ao gerar aula');
      setShowAulaModal(false);
    } finally {
      setLoadingAula(false);
    }
  };
  
  // Ir para a aula gerada
  const handleIrParaAula = () => {
    if (aulaGerada) {
      sessionStorage.setItem('aulaGerada', JSON.stringify(aulaGerada));
      navigate('/aula-interativa');
    }
    setShowAulaModal(false);
  };

  // Gerar Exemplo (mostra no chat imediatamente via streaming)
  const handleGerarExemplo = async () => {
    setLoadingExemplo(true);
    
    try {
      const tema = content.substring(0, 500).replace(/[#*_\n]/g, ' ').trim();
      
      // Gerar exemplo via streaming e adicionar ao chat
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ 
              role: 'user', 
              content: `Crie um EXEMPLO PRÁTICO muito detalhado e completo para o seguinte tema jurídico:\n\n${tema}\n\n⚠️ IMPORTANTE:\n- Crie UMA história completa e detalhada (mínimo 800 palavras)\n- Use personagens com nomes (João, Maria, etc)\n- Descreva a situação do início ao fim\n- Explique CADA passo do que acontece juridicamente\n- Mostre como os artigos de lei se aplicam\n- Indique os prazos, procedimentos e consequências\n- Termine com o desfecho do caso\n\nSeja MUITO detalhado e didático. Conte uma história real que ilustre perfeitamente o tema.` 
            }],
            mode: 'study',
            linguagemMode: 'descomplicado',
            responseLevel: 'complete'
          })
        }
      );
      
      if (!response.ok) throw new Error('Erro');
      
      const result = await response.json();
      const texto = result?.data || result?.content || result?.generatedText || '';
      
      if (texto && onTopicClick) {
        onTopicClick(`💡 **EXEMPLO PRÁTICO:**\n\n${texto}`);
      }
      
      toast.success('Exemplo gerado!');
    } catch (error) {
      console.error('Erro ao gerar exemplo:', error);
      toast.error('Erro ao gerar exemplo');
    } finally {
      setLoadingExemplo(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNextQuestao = () => {
    if (currentQuestaoIndex < questoes.length - 1) {
      setCurrentQuestaoIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  // Renderizar conteúdo com suporte a tabelas visuais
  const renderContentWithTables = (text: string) => {
    // Verificar se há tabela no conteúdo
    const tabelaData = extrairTabelaDoMarkdown(text);
    
    if (tabelaData) {
      // Separar texto antes e depois da tabela
      const lines = text.split('\n');
      let beforeTable = '';
      let afterTable = '';
      let inTable = false;
      let tableEnded = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          inTable = true;
        } else if (inTable && !trimmed.startsWith('|')) {
          inTable = false;
          tableEnded = true;
        }
        
        if (!inTable && !tableEnded) {
          beforeTable += line + '\n';
        } else if (tableEnded && !inTable) {
          afterTable += line + '\n';
        }
      }
      
      return (
        <>
          {beforeTable.trim() && renderMarkdownContent(beforeTable)}
          <QuadroComparativoVisual 
            cabecalhos={tabelaData.cabecalhos}
            linhas={tabelaData.linhas}
            titulo="Quadro Comparativo"
          />
          {afterTable.trim() && renderMarkdownContent(afterTable)}
        </>
      );
    }
    
    return renderMarkdownContent(text);
  };

  // Renderizar conteúdo markdown
  const renderMarkdownContent = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-primary mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-foreground mt-3 mb-1.5">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-relaxed">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <div className="my-3 space-y-2">
            {children}
          </div>
        ),
        li: ({ children }) => {
          const text = String(children).replace(/,$/g, '').trim();
          const isClickable = clickableTopics.some(t => text.includes(t.substring(0, 20)));
          
          if (isClickable && onTopicClick && !isStreaming) {
            return (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onTopicClick(text)}
                className="flex items-start gap-2 w-full text-left p-2.5 rounded-lg bg-primary/5 hover:bg-primary/15 border border-primary/20 transition-all group"
              >
                <span className="text-primary mt-0.5">•</span>
                <span className="text-foreground group-hover:text-primary transition-colors">{children}</span>
              </motion.button>
            );
          }
          
          return (
            <div className="flex items-start gap-2 pl-1">
              <span className="text-primary mt-0.5">•</span>
              <span>{children}</span>
            </div>
          );
        },
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-3 py-1">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        // Não renderizar tabelas no markdown - já renderizamos com QuadroComparativoVisual
        table: () => null,
        thead: () => null,
        tbody: () => null,
        tr: () => null,
        th: () => null,
        td: () => null
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const currentQuestao = questoes[currentQuestaoIndex];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "flex flex-col gap-2.5 p-4 rounded-xl",
          isUser 
            ? "bg-primary/10 ml-12" 
            : "bg-muted/50 mr-4"
        )}
      >
        {/* Avatar e botão copiar - no topo */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
            )}>
              {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {isUser ? "Você" : "Professora"}
            </span>
          </div>
          
          {/* Botões copiar e compartilhar - só para assistente */}
          {!isUser && !isStreaming && content && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Copiar"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCompartilhar}
                className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Conteúdo */}
        <div className="pl-0 min-w-0 overflow-hidden">
          {isUser ? (
            <div className="text-[15px] text-foreground break-words leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              {/* Tabs: Técnico, Descomplicado, Termos */}
              {!isStreaming && content ? (
                <Tabs value={activeTab} onValueChange={(v) => {
                  setActiveTab(v as "tecnico" | "termos");
                }} className="w-full">
                  <TabsList className="h-9 mb-3 bg-background/50 w-full justify-start">
                    <TabsTrigger value="tecnico" className="text-xs gap-1.5 px-3 py-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Técnico
                    </TabsTrigger>
                    <TabsTrigger value="termos" className="text-xs gap-1.5 px-3 py-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Termos ({terms.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tab Técnico */}
                  <TabsContent value="tecnico" className="mt-0">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[15px] leading-[1.7] text-foreground/90"
                    >
                      {renderContentWithTables(formattedContent)}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Tab Termos */}
                  <TabsContent value="termos" className="mt-0">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      {terms.length > 0 ? (
                        terms.map((term, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 bg-background/50 rounded-lg border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-primary mb-1 capitalize">{term.termo}</p>
                                <p className="text-xs text-muted-foreground">{term.definicao}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAprofundarTermo(term.termo)}
                                disabled={loadingDeepening && termDeepening === term.termo}
                                className="h-7 text-xs gap-1 shrink-0"
                              >
                                {loadingDeepening && termDeepening === term.termo ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                Aprofundar
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum termo jurídico identificado</p>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              ) : (
                // Durante streaming: renderização otimizada sem processamentos pesados
                <div className="text-[15px] leading-[1.7] text-foreground/90">
                  {content ? (
                    isStreaming ? (
                      // Durante streaming: texto simples + cursor piscante (sem markdown pesado)
                      <div className="whitespace-pre-wrap break-words">
                        {formattedContent}
                        <span className="inline-block w-1.5 h-5 bg-primary/70 ml-0.5 animate-pulse" />
                      </div>
                    ) : (
                      renderMarkdownContent(formattedContent)
                    )
                  ) : null}
                  {isStreaming && !content && <span className="inline-block w-1.5 h-5 bg-primary/70 ml-0.5 animate-pulse" />}
                </div>
              )}

              {/* Botões de ação - 3 por linha, Aprofundar destacado */}
              {!isStreaming && content && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 pt-3 border-t border-border/30"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {/* Aprofundar - Destacado */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAprofundar}
                      className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Aprofundar
                    </Button>
                    
                    {/* Questões */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarQuestoes}
                      disabled={loadingQuestoes}
                      className="h-9 text-xs gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-0"
                    >
                      {loadingQuestoes ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5" />
                      )}
                      Questões
                    </Button>
                    
                    {/* Flashcards */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarFlashcards}
                      disabled={loadingFlashcards}
                      className="h-9 text-xs gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-0"
                    >
                      {loadingFlashcards ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Layers className="w-3.5 h-3.5" />
                      )}
                      Flashcards
                    </Button>
                    
                    {/* Aula - Novo */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarAula}
                      disabled={loadingAula}
                      className="h-9 text-xs gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 border-0"
                    >
                      {loadingAula ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5" />
                      )}
                      Aula
                    </Button>
                    
                    {/* Exemplo - Novo */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarExemplo}
                      disabled={loadingExemplo}
                      className="h-9 text-xs gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 border-0"
                    >
                      {loadingExemplo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookMarked className="w-3.5 h-3.5" />
                      )}
                      Exemplo
                    </Button>
                    
                    {/* PDF ABNT - Novo */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGerarPDFABNT}
                      disabled={loadingPDF}
                      className="h-9 text-xs gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-600 border-0"
                    >
                      {loadingPDF ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      PDF
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modal de aprofundamento de termo */}
      <AnimatePresence>
        {termDeepening && deepeningContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setTermDeepening(null);
              setDeepeningContent("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground capitalize">{termDeepening}</h3>
                </div>
                <button
                  onClick={() => {
                    setTermDeepening(null);
                    setDeepeningContent("");
                  }}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-[15px] leading-relaxed">
                  {renderMarkdownContent(deepeningContent)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal flutuante para Questões */}
      <AnimatePresence>
        {showQuestoes && currentQuestao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuestoes(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Questão {currentQuestaoIndex + 1}/{questoes.length}</h3>
                </div>
                <button
                  onClick={() => setShowQuestoes(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-[15px] font-medium text-foreground leading-relaxed">
                  {currentQuestao.pergunta}
                </p>

                <div className="space-y-2">
                  {currentQuestao.alternativas.map((alt, idx) => {
                    const isCorrect = idx === currentQuestao.resposta_correta;
                    const isSelected = selectedAnswer === idx;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={selectedAnswer !== null}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all text-sm",
                          selectedAnswer === null && "hover:bg-muted/50 hover:border-primary/50",
                          isSelected && isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-600",
                          isSelected && !isCorrect && "bg-red-500/20 border-red-500 text-red-600",
                          !isSelected && selectedAnswer !== null && isCorrect && "bg-emerald-500/10 border-emerald-500/50",
                          !isSelected && selectedAnswer !== null && !isCorrect && "opacity-50"
                        )}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + idx)})</span>
                        {alt}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <p className="text-sm font-medium text-foreground mb-2">💡 Explicação:</p>
                    <p className="text-sm text-muted-foreground">{currentQuestao.explicacao}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {showExplanation && currentQuestaoIndex < questoes.length - 1 && (
                <div className="p-4 border-t border-border">
                  <Button onClick={handleNextQuestao} className="w-full">
                    Próxima Questão
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal flutuante para Flashcards */}
      <AnimatePresence>
        {showFlashcards && flashcards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlashcards(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Flashcards ({flashcards.length})</h3>
                </div>
                <button
                  onClick={() => setShowFlashcards(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <FlashcardViewer flashcards={flashcards} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Progresso da Aula */}
      <AnimatePresence>
        {showAulaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => !loadingAula && setShowAulaModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Gerando Aula Interativa</h3>
                  <p className="text-sm text-muted-foreground">{aulaMensagem}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Progress value={aulaProgresso} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{aulaProgresso}% concluído</span>
                  {loadingAula && (
                    <div className="flex items-center gap-2 text-blue-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  )}
                </div>
                
                {aulaGerada && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-4 border-t border-border"
                  >
                    <Button
                      onClick={handleIrParaAula}
                      className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium gap-2"
                    >
                      <GraduationCap className="w-5 h-5" />
                      Ver Aula Pronta 🎓
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChatMessageNew.displayName = "ChatMessageNew";
