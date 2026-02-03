import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Lightbulb, BookText, Target, ChevronLeft, ChevronRight, Plus, Minus, Type, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ReactCardFlip from "react-card-flip";
import StandardPageHeader from "@/components/StandardPageHeader";
import DragDropMatchingGame from "@/components/DragDropMatchingGame";

// Função para limpar markdown encapsulado e remover título duplicado
const cleanMarkdown = (content: string | null | undefined, titulo?: string): string => {
  if (!content) return "Conteúdo não disponível";
  let cleaned = content.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.replace(/^```markdown\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();
  
  if (titulo) {
    const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}\\s*\\n+`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`^#+\\s*${tituloEscapado}[:\\-–—].*\\n+`, 'i'), '');
  }
  
  return cleaned.trim();
};

type TabType = "analise" | "exemplos" | "termos" | "flashcards" | "interativo";

interface Correspondencia {
  conceito: string;
  definicao: string;
}

interface Exemplo {
  titulo: string;
  situacao?: string;
  conexao_livro?: string;
  reflexao?: string;
}

interface Termo {
  termo: string;
  definicao: string;
  relevancia?: string;
}

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
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

const BibliotecaClassicosAnaliseTema = () => {
  const { livroId, temaId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("analise");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [showQuestoesCard, setShowQuestoesCard] = useState(false);

  const aumentarFonte = () => setFontSize(prev => Math.min(prev + 2, 24));
  const diminuirFonte = () => setFontSize(prev => Math.max(prev - 2, 12));

  // Buscar tema
  const { data: tema, isLoading, refetch } = useQuery({
    queryKey: ["biblioteca-classicos-tema", temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_classicos_temas")
        .select("*")
        .eq("id", temaId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando") {
        return 3000;
      }
      return false;
    },
  });

  // Buscar livro
  const { data: livro } = useQuery({
    queryKey: ["biblioteca-classicos-livro-tema", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("livro, autor")
        .eq("id", livroId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Gerar conteúdo se pendente
  useEffect(() => {
    const gerarConteudo = async () => {
      if (tema && tema.status === 'pendente') {
        try {
          const { error } = await supabase.functions.invoke('gerar-conteudo-classicos', {
            body: { temaId }
          });

          if (error) {
            console.error("Erro ao iniciar geração:", error);
          } else {
            refetch();
          }
        } catch (e) {
          console.error("Erro:", e);
        }
      }
    };

    gerarConteudo();
  }, [tema?.status, temaId, refetch]);

  // Parse exemplos e termos (podem ser string JSON ou array)
  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  };

  const exemplos: Exemplo[] = parseJsonField(tema?.exemplos);
  const termos: Termo[] = parseJsonField(tema?.termos);
  const flashcards: Flashcard[] = parseJsonField(tema?.flashcards);
  const questoes = parseJsonField(tema?.questoes);
  const correspondencias: Correspondencia[] = parseJsonField((tema as any)?.correspondencias);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!tema) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0d0d14]">
        <p className="text-gray-400">Tema não encontrado</p>
        <Button onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise`)}>Voltar</Button>
      </div>
    );
  }

  const isGerando = tema.status === "gerando" || tema.status === "pendente";

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header Global */}
      <StandardPageHeader
        title={tema.titulo || "Carregando..."}
        subtitle={livro?.livro}
        backPath={`/biblioteca-classicos/${livroId}/analise`}
      />

      {/* Header do Capítulo - Estilo Leitura Dinâmica */}
      <div className="flex flex-col items-center justify-center text-center relative mb-4">
        {/* Capa do tema */}
        {tema.capa_url && (
          <div className="w-full aspect-video max-h-[220px] overflow-hidden shadow-2xl shadow-black/50 -mt-8">
            <img 
              src={tema.capa_url} 
              alt={tema.titulo} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/30 to-transparent" />
          </div>
        )}
        
        {/* Decoração com estrelas e título */}
        <div className={`py-6 px-4 ${tema.capa_url ? '-mt-16 relative z-10' : ''}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-400 text-xl">✦</span>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
          </div>
          
          <span className="text-amber-400/70 text-xs uppercase tracking-[0.3em] font-medium mb-2 block">
            CAPÍTULO {tema.ordem}
          </span>
          
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 px-4 leading-tight max-w-2xl mx-auto"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {tema.titulo}
          </h1>
          
          <span className="text-xs text-gray-500">
            {livro?.livro} • Páginas {tema.pagina_inicial}-{tema.pagina_final}
          </span>
          
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-400 text-xl">✦</span>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          {isGerando ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Gerando análise...</h2>
              <p className="text-sm text-gray-400">
                A IA está criando uma análise completa deste capítulo.
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
                    <TabsTrigger value="analise" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Análise
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

                {/* ============ ANÁLISE ============ */}
                <TabsContent value="analise" className="mt-0">
                  <div className="bg-[#12121a] rounded-xl border border-white/10 p-5">
                    <EnrichedMarkdownRenderer 
                      content={cleanMarkdown(tema.conteudo_markdown, tema.titulo)}
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
                        {exemplo.situacao && (
                          <div>
                            <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Situação</span>
                            <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                              {exemplo.situacao}
                            </p>
                          </div>
                        )}
                        {exemplo.conexao_livro && (
                          <>
                            <div className="my-4 flex items-center justify-center gap-4">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                              <span className="text-amber-500/40 text-xs">✦</span>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            </div>
                            <div>
                              <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Conexão com o Livro</span>
                              <p className="mt-2 text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                                {exemplo.conexao_livro}
                              </p>
                            </div>
                          </>
                        )}
                        {exemplo.reflexao && (
                          <>
                            <div className="my-4 flex items-center justify-center gap-4">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                              <span className="text-amber-500/40 text-xs">✦</span>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            </div>
                            <div>
                              <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Reflexão</span>
                              <p className="mt-2 text-amber-400 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif", fontSize: `${fontSize}px` }}>
                                {exemplo.reflexao}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {exemplos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum exemplo disponível</p>
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
                      {termo.relevancia && (
                        <p className="text-xs text-amber-500/60 mt-3 italic">
                          Relevância: {termo.relevancia}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  {termos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum termo disponível</p>
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
                            
                            {flashcardAtual.exemplo && (
                              <div className="mt-4 pt-4 border-t border-green-500/20">
                                <div className="text-xs text-green-500/60 uppercase tracking-wider mb-1">Exemplo</div>
                                <p className="text-sm text-gray-400">{flashcardAtual.exemplo}</p>
                              </div>
                            )}
                          </motion.div>
                        </ReactCardFlip>
                      </div>

                      {/* Navegação */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={anteriorFlashcard}
                          className="flex-1 bg-transparent border-white/10 text-gray-400 hover:bg-white/5"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Anterior
                        </Button>
                        <Button
                          onClick={proximoFlashcard}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Próximo
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum flashcard disponível</p>
                    </div>
                  )}
                </TabsContent>

                {/* ============ INTERATIVO (JOGO) ============ */}
                <TabsContent value="interativo" className="mt-0">
                  <div className="bg-[#12121a] rounded-xl border border-purple-500/20 p-5">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                        Jogo de Correspondência
                      </h3>
                      <p className="text-sm text-gray-400">
                        Conecte cada conceito com sua definição correta
                      </p>
                    </div>

                    <DragDropMatchingGame 
                      items={correspondencias.length > 0 ? correspondencias : termos.slice(0, 6).map(t => ({
                        conceito: t.termo,
                        definicao: t.definicao
                      }))}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Botão Flutuante - Questões */}
      {questoes.length > 0 && !isGerando && (
        <>
          <AnimatePresence>
            {showQuestoesCard && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-36 right-4 z-40 w-72 bg-[#12121a]/95 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 shadow-xl"
              >
                <h3 className="font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Vamos praticar?
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Teste seus conhecimentos com {questoes.length} questões sobre este capítulo.
                </p>
                <Button
                  onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise/${temaId}/questoes`)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  Iniciar Questões
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowQuestoesCard(!showQuestoesCard)}
            className={`fixed bottom-36 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
              showQuestoesCard
                ? 'bg-amber-500 text-white'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            }`}
          >
            <Target className="w-6 h-6" />
          </motion.button>
        </>
      )}

      {/* Menu Flutuante de Fonte */}
      {!isGerando && (
        <FontSizeFloatingMenu
          fontSize={fontSize}
          onIncrease={aumentarFonte}
          onDecrease={diminuirFonte}
        />
      )}
    </div>
  );
};

export default BibliotecaClassicosAnaliseTema;
