import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, ChevronLeft, ChevronRight, Plus, Minus, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactCardFlip from "react-card-flip";
import bgPraticarExam from "@/assets/bg-praticar-exam.webp";
import StandardPageHeader from "@/components/StandardPageHeader";

const cleanMarkdown = (content: string | null | undefined, titulo?: string): string => {
  if (!content) return "Conteúdo não disponível";
  let cleaned = content.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.replace(/^```markdown\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  if (titulo) {
    const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}\\s*\\n+`, 'i'), '');
  }
  return cleaned.trim();
};

type TabType = "conteudo" | "exemplos" | "termos" | "flashcards";

interface Exemplo { titulo: string; situacao: string; analise: string; conclusao: string; }
interface Termo { termo: string; definicao: string; origem?: string; }
interface Flashcard { frente: string; verso: string; exemplo?: string; }
interface Questao { enunciado: string; opcoes: string[]; correta: number; explicacao: string; }

const FontSizeFloatingMenu = ({ fontSize, onIncrease, onDecrease }: { fontSize: number; onIncrease: () => void; onDecrease: () => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-1 bg-[#12121a]/95 backdrop-blur-sm border border-amber-500/20 rounded-full p-1 shadow-lg">
            <button onClick={onDecrease} disabled={fontSize <= 12} className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-500/20 disabled:opacity-30"><Minus className="w-4 h-4" /></button>
            <button onClick={onIncrease} disabled={fontSize >= 24} className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-500/20 disabled:opacity-30"><Plus className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${isOpen ? 'bg-amber-500 text-white' : 'bg-[#12121a]/95 border border-amber-500/20 text-amber-400'}`}><Type className="w-6 h-6" /></motion.button>
    </div>
  );
};

const ConceitosLivroTema = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("conteudo");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [showQuestoesCard, setShowQuestoesCard] = useState(false);
  const [showQuestoesIntro, setShowQuestoesIntro] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [fontSize, setFontSize] = useState(15);

  const { data: tema, isLoading, refetch } = useQuery({
    queryKey: ["conceitos-livro-tema", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("conceitos_livro_temas").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => query.state.data?.status === "gerando" ? 3000 : false,
  });

  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-conceitos-livro", { body: { temaId: id } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { refetch(); toast.success("Conteúdo gerado!"); },
    onError: () => toast.error("Erro ao gerar conteúdo"),
  });

  useEffect(() => {
    if (tema?.status === "pendente" && !gerarConteudoMutation.isPending) gerarConteudoMutation.mutate();
  }, [tema?.status]);

  let exemplos: Exemplo[] = [];
  if (tema?.exemplos) { try { exemplos = typeof tema.exemplos === 'string' ? JSON.parse(tema.exemplos) : tema.exemplos as unknown as Exemplo[]; } catch {} }
  const termos: Termo[] = (tema?.termos as unknown as Termo[]) || [];
  const flashcards: Flashcard[] = (tema?.flashcards as unknown as Flashcard[]) || [];
  const questoes: Questao[] = (tema?.questoes as unknown as Questao[]) || [];
  const questaoAtual = questoes[questaoIndex];
  const flashcardAtual = flashcards[flashcardIndex];

  const playSound = (type: 'correct' | 'error') => { try { const a = new Audio(`/sounds/${type}.mp3`); a.volume = 0.3; a.play().catch(() => {}); } catch {} };
  const verificarResposta = (index: number) => {
    if (respostaSelecionada !== null) return;
    setRespostaSelecionada(index); setMostrarExplicacao(true);
    if (index === questaoAtual.correta) { playSound('correct'); setAcertos(p => p + 1); setIsPulsing(true); setTimeout(() => setIsPulsing(false), 600); }
    else { playSound('error'); setIsShaking(true); setTimeout(() => setIsShaking(false), 400); }
  };
  const proximaQuestao = () => { if (questaoIndex < questoes.length - 1) { setQuestaoIndex(p => p + 1); setRespostaSelecionada(null); setMostrarExplicacao(false); } else { setShowQuestoesIntro(true); setQuestaoIndex(0); setRespostaSelecionada(null); setMostrarExplicacao(false); setAcertos(0); } };

  if (isLoading) return <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  const isGerando = tema?.status === "gerando" || gerarConteudoMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader 
        title={tema?.titulo || "Carregando..."} 
        subtitle={`Páginas ${tema?.pagina_inicial}-${tema?.pagina_final}`} 
        backPath={tema?.trilha ? `/conceitos/livro/${tema.trilha}` : "/conceitos"} 
      />
      
      {/* Capa do tema */}
      {tema?.capa_url ? (
        <div className="relative w-full h-48 overflow-hidden">
          <img src={tema.capa_url} alt={tema.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-transparent to-transparent" />
        </div>
      ) : tema?.status === 'concluido' && (
        <div className="w-full h-32 bg-gradient-to-r from-amber-900/30 to-amber-800/20 flex items-center justify-center">
          <span className="text-amber-400/60 text-sm">Gerando capa...</span>
        </div>
      )}
      <div className="px-4 pb-32"><div className="max-w-2xl mx-auto">
        {isGerando ? <div className="flex flex-col items-center justify-center py-16 text-center"><Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" /><h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2><p className="text-sm text-gray-400">A IA está criando o material de estudo.</p></div> : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <div className="mb-4"><TabsList className="grid w-full grid-cols-4 h-10 bg-[#12121a] border border-white/10"><TabsTrigger value="conteudo" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Conteúdo</TabsTrigger><TabsTrigger value="exemplos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Exemplos</TabsTrigger><TabsTrigger value="termos" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Termos</TabsTrigger><TabsTrigger value="flashcards" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Flashcards</TabsTrigger></TabsList></div>
            <TabsContent value="conteudo" className="mt-0"><div className="bg-[#12121a] rounded-xl border border-white/10 p-5"><EnrichedMarkdownRenderer content={cleanMarkdown(tema?.conteudo_markdown, tema?.titulo)} fontSize={fontSize} theme="classicos" /></div></TabsContent>
            <TabsContent value="exemplos" className="mt-0 space-y-4">{exemplos.map((e, i) => <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#12121a] rounded-xl border border-white/10 p-5"><h3 className="font-semibold text-amber-400 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{e.titulo}</h3><div className="space-y-3"><div><span className="text-xs text-amber-500/70 uppercase">Situação</span><p className="mt-1 text-gray-300" style={{ fontSize }}>{e.situacao}</p></div><div><span className="text-xs text-amber-500/70 uppercase">Análise</span><p className="mt-1 text-gray-300" style={{ fontSize }}>{e.analise}</p></div><div><span className="text-xs text-amber-500/70 uppercase">Conclusão</span><p className="mt-1 text-amber-400" style={{ fontSize }}>{e.conclusao}</p></div></div></motion.div>)}{exemplos.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum exemplo disponível</div>}</TabsContent>
            <TabsContent value="termos" className="mt-0 space-y-3">{termos.map((t, i) => <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#12121a] rounded-xl border border-white/10 p-5"><h3 className="font-semibold text-amber-400" style={{ fontFamily: "'Playfair Display', serif" }}>{t.termo}</h3><p className="mt-2 text-gray-300" style={{ fontSize }}>{t.definicao}</p>{t.origem && <p className="text-xs text-amber-500/60 mt-2 italic">Origem: {t.origem}</p>}</motion.div>)}{termos.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum termo disponível</div>}</TabsContent>
            <TabsContent value="flashcards" className="mt-0">{flashcards.length > 0 && flashcardAtual ? <div className="space-y-4"><div className="text-center text-sm text-gray-500">{flashcardIndex + 1} de {flashcards.length}</div><ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal"><motion.div className="min-h-[280px] bg-gradient-to-br from-amber-900/20 to-transparent rounded-xl border-2 border-amber-500/30 p-6 flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsFlipped(true)}><div className="text-xs text-amber-500/60 uppercase mb-4">Pergunta</div><p className="text-center text-lg font-medium text-white">{flashcardAtual.frente}</p><p className="text-xs text-gray-500 mt-6">Toque para ver a resposta</p></motion.div><motion.div className="min-h-[280px] bg-gradient-to-br from-green-900/20 to-transparent rounded-xl border-2 border-green-500/30 p-6 flex flex-col cursor-pointer" onClick={() => setIsFlipped(false)}><div className="text-xs text-green-400 uppercase mb-2">Resposta</div><p className="text-center flex-1 flex items-center justify-center font-medium text-white">{flashcardAtual.verso}</p>{flashcardAtual.exemplo && <div className="mt-4 pt-3 border-t border-green-500/20"><span className="text-xs text-green-400/70 uppercase">Exemplo</span><p className="text-sm text-gray-400 mt-1">{flashcardAtual.exemplo}</p></div>}</motion.div></ReactCardFlip><div className="flex justify-between"><Button variant="outline" onClick={() => { setIsFlipped(false); setTimeout(() => setFlashcardIndex(p => (p - 1 + flashcards.length) % flashcards.length), 100); }} className="border-amber-500/30 text-amber-400"><ChevronLeft className="w-4 h-4 mr-1" />Anterior</Button><Button variant="outline" onClick={() => { setIsFlipped(false); setTimeout(() => setFlashcardIndex(p => (p + 1) % flashcards.length), 100); }} className="border-amber-500/30 text-amber-400">Próximo<ChevronRight className="w-4 h-4 ml-1" /></Button></div></div> : <div className="text-center py-8 text-gray-500">Nenhum flashcard disponível</div>}</TabsContent>
          </Tabs>
        )}
      </div></div>
      {questoes.length > 0 && !isGerando && <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setShowQuestoesCard(true)} className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg z-40"><Target className="w-6 h-6 text-white" /></motion.button>}
      {!isGerando && <FontSizeFloatingMenu fontSize={fontSize} onIncrease={() => setFontSize(p => Math.min(p + 2, 24))} onDecrease={() => setFontSize(p => Math.max(p - 2, 12))} />}
      <Dialog open={showQuestoesCard} onOpenChange={setShowQuestoesCard}>
        <DialogContent className="bg-[#12121a] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          {showQuestoesIntro ? <div className="relative overflow-hidden rounded-xl"><div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${bgPraticarExam})` }} /><div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/80 to-transparent" /><div className="relative z-10 p-6 text-center"><Target className="w-16 h-16 text-red-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-white mb-2">Vamos Praticar?</h3><p className="text-gray-400 mb-6">{questoes.length} questões</p><Button onClick={() => setShowQuestoesIntro(false)} className="bg-red-600 hover:bg-red-500 px-8">Começar</Button></div></div> : (
            <div className={`${isShaking ? 'animate-shake' : ''} ${isPulsing ? 'animate-pulse' : ''}`}>
              <DialogHeader><DialogTitle className="text-white flex items-center justify-between"><span>Questão {questaoIndex + 1} de {questoes.length}</span><span className="text-sm text-green-400">{acertos} acertos</span></DialogTitle></DialogHeader>
              {questaoAtual && <div className="mt-4 space-y-4"><p className="text-gray-200 leading-relaxed">{questaoAtual.enunciado}</p><div className="space-y-2">{questaoAtual.opcoes.map((o, i) => { const isCorrect = i === questaoAtual.correta; const showResult = respostaSelecionada !== null; let bg = "bg-neutral-800/50 border-white/10 hover:border-amber-500/50"; if (showResult) { if (isCorrect) bg = "bg-green-900/30 border-green-500"; else if (respostaSelecionada === i) bg = "bg-red-900/30 border-red-500"; } return <button key={i} onClick={() => verificarResposta(i)} disabled={respostaSelecionada !== null} className={`w-full text-left p-4 rounded-lg border transition-all ${bg}`}><span className="text-gray-200">{o}</span></button>; })}</div>{mostrarExplicacao && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4"><p className="text-sm text-amber-200">{questaoAtual.explicacao}</p></motion.div>}</div>}
              <DialogFooter className="mt-6">{respostaSelecionada !== null && <Button onClick={proximaQuestao} className="w-full bg-amber-600 hover:bg-amber-500">{questaoIndex < questoes.length - 1 ? "Próxima Questão" : "Ver Resultado"}</Button>}</DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConceitosLivroTema;
