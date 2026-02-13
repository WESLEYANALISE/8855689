import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Lightbulb, BookText, Sparkles, GraduationCap, Target, CheckCircle2, ChevronLeft, ChevronRight, X, Plus, Minus, Type, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactCardFlip from "react-card-flip";
import bgPraticarExam from "@/assets/bg-praticar-exam.webp";
import StandardPageHeader from "@/components/StandardPageHeader";
import { Slider } from "@/components/ui/slider";

// Função para limpar markdown encapsulado em code blocks e remover título duplicado
const cleanMarkdown = (content: string | null | undefined, titulo?: string): string => {
  if (!content) return "Conteúdo não disponível";
  // Remove ```markdown ... ``` wrappers
  let cleaned = content.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.replace(/^```markdown\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();
  
  // Remove título duplicado do início do conteúdo (várias formas)
  if (titulo) {
    const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Remove H1/H2 exato
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}\\s*\\n+`, 'i'), '');
    
    // Remove H1/H2 com sufixos comuns como ": Características Gerais", ": Conceitos", etc.
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}[:\\-–—].*\\n+`, 'i'), '');
    
    // Remove qualquer H1/H2 inicial que contenha palavras-chave do título (primeira palavra significativa)
    const palavrasChave = titulo.split(/\s+/).filter(p => p.length > 4).slice(0, 2);
    if (palavrasChave.length > 0) {
      const palavraEscapada = palavrasChave[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Se o H1/H2 inicial contém a palavra-chave principal e não é "Conceito", remove
      const regexPalavra = new RegExp(`^(#+)\\s*(?!Conceito)[^\\n]*${palavraEscapada}[^\\n]*\\n+`, 'i');
      cleaned = cleaned.replace(regexPalavra, '');
    }
  }
  
  return cleaned.trim();
};

type TabType = "conteudo" | "exemplos" | "termos" | "flashcards";

interface Exemplo {
  titulo: string;
  situacao: string;
  analise: string;
  conclusao: string;
}

interface Termo {
  termo: string;
  definicao: string;
  origem?: string;
}

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

interface Questao {
  enunciado: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
  exemplo?: string;
  dificuldade?: string;
}

// Componente de Menu Flutuante de Fonte
const FontSizeFloatingMenu = ({ 
  fontSize, 
  onIncrease, 
  onDecrease 
}: { 
  fontSize: number; 
  onIncrease: () => void; 
  onDecrease: () => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 bg-[#12121a]/95 backdrop-blur-sm border border-amber-500/20 rounded-full p-1 shadow-lg"
          >
            <button
              onClick={onDecrease}
              disabled={fontSize <= 12}
              className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-colors"
              title="Diminuir fonte"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={onIncrease}
              disabled={fontSize >= 24}
              className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-colors"
              title="Aumentar fonte"
            >
              <Plus className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isOpen 
            ? 'bg-amber-500 text-white' 
            : 'bg-[#12121a]/95 backdrop-blur-sm border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
        }`}
      >
        <Type className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

const FaculdadeTopicoEstudo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("conteudo");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Questões flutuante state
  const [showQuestoesCard, setShowQuestoesCard] = useState(false);
  const [showQuestoesIntro, setShowQuestoesIntro] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [isGerandoQuestoes, setIsGerandoQuestoes] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  
  const aumentarFonte = () => setFontSize(prev => Math.min(prev + 2, 24));
  const diminuirFonte = () => setFontSize(prev => Math.max(prev - 2, 12));
  

  // Buscar tópico com disciplina - com polling quando está gerando
  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["faculdade-topico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_topicos")
        .select(`
          *,
          disciplina:faculdade_disciplinas(*)
        `)
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      return data;
    },
    // Polling a cada 3 segundos quando está gerando
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando") {
        return 3000; // Poll a cada 3 segundos
      }
      return false; // Para o polling quando não está gerando
    },
  });

  // Buscar progresso
  const { data: progresso } = useQuery({
    queryKey: ["faculdade-topico-progresso", user?.id, id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from("faculdade_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("topico_id", parseInt(id!))
        .single();

      return data;
    },
    enabled: !!user?.id && !!id,
  });

  // Mutation para gerar conteúdo
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-faculdade", {
        body: { topico_id: parseInt(id!) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success("Conteúdo gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar conteúdo");
      console.error(error);
    },
  });

  // Mutation para marcar como concluído
  const marcarConcluidoMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("faculdade_progresso")
        .upsert({
          user_id: user.id,
          topico_id: parseInt(id!),
          concluido: true,
          data_conclusao: new Date().toISOString(),
        }, { onConflict: "user_id,topico_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculdade-topico-progresso"] });
      queryClient.invalidateQueries({ queryKey: ["faculdade-progresso"] });
      setShowConfirmDialog(false);
      toast.success("Tópico concluído!");
    },
  });

  // Gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (topico && topico.status === "pendente" && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate();
    }
  }, [topico?.status]);

  const exemplos: Exemplo[] = (topico?.exemplos as unknown as Exemplo[]) || [];
  const termos: Termo[] = (topico?.termos as unknown as Termo[]) || [];
  const flashcards: Flashcard[] = (topico?.flashcards as unknown as Flashcard[]) || [];
  const questoes: Questao[] = (topico?.questoes as unknown as Questao[]) || [];
  const questaoAtual = questoes[questaoIndex];
  const flashcardAtual = flashcards[flashcardIndex];

  const proximoFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    }, 100);
  };

  const anteriorFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 100);
  };

  const playSound = (type: 'correct' | 'error') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      console.log("Áudio não disponível");
    }
  };

  const proximaQuestao = () => {
    if (questaoIndex < questoes.length - 1) {
      setQuestaoIndex(prev => prev + 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
    } else {
      // Quiz finalizado - resetar para intro
      setShowQuestoesIntro(true);
      setQuestaoIndex(0);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
      setAcertos(0);
    }
  };

  const reiniciarQuiz = () => {
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setMostrarExplicacao(false);
    setAcertos(0);
    setShowQuestoesIntro(true);
  };

  const verificarResposta = (index: number) => {
    if (respostaSelecionada !== null) return;
    
    setRespostaSelecionada(index);
    setMostrarExplicacao(true);
    
    const correct = index === questaoAtual.correta;
    if (correct) {
      playSound('correct');
      setAcertos(prev => prev + 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    } else {
      playSound('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isGerando = topico?.status === "gerando" || gerarConteudoMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header Global */}
      <StandardPageHeader
        title={topico?.titulo || "Carregando..."}
        subtitle={topico?.disciplina?.nome}
        backPath={topico?.disciplina?.codigo ? `/faculdade/disciplina/${topico.disciplina.codigo}` : undefined}
      />

      {/* Capa do Tópico */}
      {topico?.capa_url && (
        <div className="relative w-full aspect-video max-h-[200px] overflow-hidden -mt-8">
          <img 
            src={topico.capa_url} 
            alt={topico.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/50 to-transparent" />
        </div>
      )}
      
      {/* Header do conteúdo */}
      <div className={`${topico?.capa_url ? 'pt-0 -mt-12 relative z-10' : 'pt-2'} pb-4 px-4`}>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-amber-400">{topico?.ordem}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  {topico?.disciplina?.nome}
                </span>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{topico?.titulo}</h1>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          {isGerando ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
              <p className="text-sm text-gray-400">
                A IA está criando o material de estudo para este tópico.
                <br />
                Isso pode levar alguns segundos.
              </p>
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                {/* Abas de Estudo */}
                <div className="mb-4">
                  <TabsList className="grid w-full grid-cols-4 h-10 bg-[#12121a] border border-white/10">
                    <TabsTrigger value="conteudo" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="exemplos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Exemplos
                    </TabsTrigger>
                    <TabsTrigger value="termos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Termos
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Flashcards
                    </TabsTrigger>
                  </TabsList>
                </div>


                {/* ============ CONTEÚDO ============ */}
                <TabsContent value="conteudo" className="mt-0">
                  <div className="bg-[#12121a] rounded-xl border border-white/10 p-5">
                    <EnrichedMarkdownRenderer 
                      content={cleanMarkdown(topico?.conteudo_gerado, topico?.titulo)}
                      imagensDiagramas={topico?.imagens_diagramas as Array<{tipo: string; titulo: string; url: string}> | undefined}
                      fontSize={fontSize}
                      theme="classicos"
                    />
                  </div>
                </TabsContent>

                {/* ============ EXEMPLOS ============ */}
                <TabsContent value="exemplos" className="mt-0 space-y-4">
                  {exemplos.map((exemplo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#12121a] rounded-xl border border-white/10 p-5"
                    >
                      <h3 className="font-semibold text-amber-400 mb-4" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: `${fontSize + 2}px` }}>
                        {exemplo.titulo}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Situação</span>
                          <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.situacao}
                          </p>
                        </div>
                        <div className="my-4 flex items-center justify-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                          <span className="text-amber-500/40 text-xs">✦</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        </div>
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Análise</span>
                          <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.analise}
                          </p>
                        </div>
                        <div className="my-4 flex items-center justify-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                          <span className="text-amber-500/40 text-xs">✦</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        </div>
                        <div>
                          <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Conclusão</span>
                          <p className="mt-2 text-amber-400 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                            {exemplo.conclusao}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {exemplos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum exemplo disponível
                    </div>
                  )}
                </TabsContent>

                {/* ============ TERMOS ============ */}
                <TabsContent value="termos" className="mt-0 space-y-3">
                  {termos.map((termo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#12121a] rounded-xl border border-white/10 p-5"
                    >
                      <h3 className="font-semibold text-amber-400" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: `${fontSize + 2}px` }}>
                        {termo.termo}
                      </h3>
                      <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                        {termo.definicao}
                      </p>
                      {termo.origem && (
                        <p className="text-xs text-amber-500/60 mt-3 italic">
                          Origem: {termo.origem}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  {termos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum termo disponível
                    </div>
                  )}
                </TabsContent>

                {/* ============ FLASHCARDS COM FLIP ANIMATION ============ */}
                <TabsContent value="flashcards" className="mt-0">
                  {flashcards.length > 0 && flashcardAtual ? (
                    <div className="space-y-4">
                      {/* Contador */}
                      <div className="text-center text-sm text-gray-500">
                        {flashcardIndex + 1} de {flashcards.length}
                      </div>

                      {/* Card com Flip */}
                      <div className="perspective-1000">
                        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
                          {/* FRENTE */}
                          <motion.div
                            key={`front-${flashcardIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="min-h-[280px] bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent rounded-xl border-2 border-amber-500/30 p-6 flex flex-col items-center justify-center cursor-pointer"
                            onClick={() => setIsFlipped(true)}
                          >
                            <div className="text-xs text-amber-500/60 uppercase tracking-wider mb-4">Pergunta</div>
                            <p className="text-center text-lg font-medium text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                              {flashcardAtual.frente}
                            </p>
                            <p className="text-xs text-gray-500 mt-6">Toque para ver a resposta</p>
                          </motion.div>

                          {/* VERSO */}
                          <motion.div
                            key={`back-${flashcardIndex}`}
                            className="min-h-[280px] bg-gradient-to-br from-green-900/20 via-green-800/10 to-transparent rounded-xl border-2 border-green-500/30 p-6 flex flex-col cursor-pointer"
                            onClick={() => setIsFlipped(false)}
                          >
                            <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Resposta</div>
                            <p className="text-center flex-1 flex items-center justify-center font-medium text-white" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                              {flashcardAtual.verso}
                            </p>
                            
                            {/* Exemplo (se existir) */}
                            {flashcardAtual.exemplo && (
                              <div className="mt-4 pt-4 border-t border-green-500/20">
                                <div className="text-xs text-amber-500/70 mb-1">💡 EXEMPLO</div>
                                <p className="text-sm text-gray-400" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                                  {flashcardAtual.exemplo}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 text-center mt-4">Toque para voltar</p>
                          </motion.div>
                        </ReactCardFlip>
                      </div>

                      {/* Navegação */}
                      <div className="flex gap-2">
                        <button
                          onClick={anteriorFlashcard}
                          className="flex-1 py-3 bg-[#12121a] border border-white/10 text-gray-400 rounded-xl font-medium hover:bg-white/5 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={proximoFlashcard}
                          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum flashcard disponível
                    </div>
                  )}
                </TabsContent>

                {/* ============ QUESTÕES ============ */}
                <TabsContent value="questoes" className="mt-0">
                  {questoes.length > 0 && questaoAtual ? (
                    <div className="space-y-4">
                      {/* Header com contador e dificuldade */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Questão {questaoIndex + 1} de {questoes.length}
                        </div>
                        {questaoAtual.dificuldade && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            questaoAtual.dificuldade === 'facil' ? 'bg-green-500/10 text-green-400' :
                            questaoAtual.dificuldade === 'medio' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {questaoAtual.dificuldade === 'facil' ? 'Fácil' : 
                             questaoAtual.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                          </span>
                        )}
                      </div>

                      <div className="bg-[#12121a] rounded-xl border border-white/10 p-4">
                        <p className="font-medium text-white mb-4" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                          {questaoAtual.enunciado}
                        </p>
                        <div className="space-y-2">
                          {questaoAtual.opcoes.map((opcao, index) => (
                            <button
                              key={index}
                              onClick={() => !mostrarExplicacao && verificarResposta(index)}
                              disabled={mostrarExplicacao}
                              className={`w-full text-left p-3 rounded-lg border transition-all text-gray-300 ${
                                mostrarExplicacao
                                  ? index === questaoAtual.correta
                                    ? "bg-green-500/10 border-green-500 text-green-400"
                                    : respostaSelecionada === index
                                    ? "bg-red-500/10 border-red-500 text-red-400"
                                    : "border-white/10 opacity-50"
                                  : "border-white/10 hover:border-amber-500/50"
                              }`}
                            >
                              {opcao}
                            </button>
                          ))}
                        </div>
                        {mostrarExplicacao && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-amber-500/5 rounded-lg border border-amber-500/10"
                          >
                            <p className="text-sm font-medium mb-2 text-white">
                              {respostaSelecionada === questaoAtual.correta
                                ? "✅ Correto!"
                                : "❌ Incorreto"}
                            </p>
                            <p className="text-sm text-gray-400 whitespace-pre-wrap" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                              {questaoAtual.explicacao}
                            </p>
                          </motion.div>
                        )}
                      </div>
                      {mostrarExplicacao && (
                        <button
                          onClick={proximaQuestao}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium"
                        >
                          Próxima Questão
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma questão disponível
                    </div>
                  )}
                </TabsContent>
              </Tabs>


              {/* Badge de Concluído */}
              {progresso?.concluido && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto py-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Tópico Concluído
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botão Flutuante de Questões - Esconde na aba Flashcards */}
      {!showQuestoesCard && !isGerando && topico?.conteudo_gerado && activeTab !== 'flashcards' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            if (questoes.length === 0) {
              // Gerar questões automaticamente
              setIsGerandoQuestoes(true);
              toast.info("Gerando questões...");
              try {
                await gerarConteudoMutation.mutateAsync();
              } catch (e) {
                console.error(e);
              } finally {
                setIsGerandoQuestoes(false);
              }
            } else {
              setShowQuestoesCard(true);
            }
          }}
          disabled={isGerandoQuestoes}
          className="fixed bottom-32 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center z-50"
        >
          {isGerandoQuestoes ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Target className="w-6 h-6 text-white" />
          )}
        </motion.button>
      )}

      {/* Controle de Tamanho de Fonte - Menu Flutuante com T */}
      {!showQuestoesCard && !isGerando && topico?.conteudo_gerado && activeTab !== 'flashcards' && (
        <FontSizeFloatingMenu 
          fontSize={fontSize}
          onIncrease={aumentarFonte}
          onDecrease={diminuirFonte}
        />
      )}

      {/* Card Flutuante de Questões - Centralizado com blur */}
      <AnimatePresence>
        {showQuestoesCard && (
          <>
            {/* Overlay com blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestoesCard(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            {/* Card centralizado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div className="bg-[#12121a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="relative h-40">
                  <img src={bgPraticarExam} alt="Praticar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/60 to-transparent" />
                </div>
                <div className="p-5 -mt-12 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Vamos praticar?</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    São <span className="font-semibold text-white">{questoes.length} questões</span> para você praticar o que aprendeu.
                  </p>
                  <Button 
                    onClick={() => navigate(`/faculdade/topico/${id}/questoes`)} 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
                  >
                    Começar
                  </Button>
                </div>
                <button 
                  onClick={() => setShowQuestoesCard(false)} 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-[#12121a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              Marcar como Concluído?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Você estudou todo o conteúdo deste tópico e está pronto para prosseguir?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-white/10 text-gray-400 hover:bg-white/5">
              Continuar Estudando
            </Button>
            <Button 
              onClick={() => marcarConcluidoMutation.mutate()}
              disabled={marcarConcluidoMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {marcarConcluidoMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Sim, Concluir!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FaculdadeTopicoEstudo;
