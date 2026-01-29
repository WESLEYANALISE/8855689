import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Sparkles, FileText, HelpCircle, Loader2, ChevronLeft, ChevronRight, Check, X, RotateCcw, Layers, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ConteudoGerado {
  markdown?: string;
  exemplos?: string;
  termos?: string;
}

interface ResumoData {
  id: number;
  area: string;
  tema: string;
  subtema: string;
  conteudo: string | null;
  conteudo_gerado: ConteudoGerado | null;
}

export default function TrilhaSubtemaEstudo() {
  const navigate = useNavigate();
  const { area, tema, subtemaId } = useParams<{ area: string; tema: string; subtemaId: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const decodedTema = tema ? decodeURIComponent(tema) : "";
  const [activeTab, setActiveTab] = useState("conteudo");
  
  // Estado para menu flutuante
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Estado para flashcards
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [conhecidos, setConhecidos] = useState<number[]>([]);
  const [naoConhecidos, setNaoConhecidos] = useState<number[]>([]);

  // Buscar dados do resumo
  const { data: resumo, isLoading } = useQuery({
    queryKey: ['trilha-subtema-estudo', subtemaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('id, area, tema, subtema, conteudo, conteudo_gerado')
        .eq('id', Number(subtemaId))
        .single();

      if (error) throw error;
      return data as ResumoData;
    },
    enabled: !!subtemaId
  });

  // Parse do conteúdo gerado
  const conteudoGerado: ConteudoGerado | null = resumo?.conteudo_gerado 
    ? (typeof resumo.conteudo_gerado === 'string' 
        ? JSON.parse(resumo.conteudo_gerado) 
        : resumo.conteudo_gerado)
    : null;

  // Gerar flashcards a partir do conteúdo
  const flashcards = generateFlashcards(resumo, conteudoGerado);

  const handleFlashcardResponse = (conhece: boolean) => {
    if (conhece) {
      setConhecidos(prev => [...prev, currentFlashcardIndex]);
    } else {
      setNaoConhecidos(prev => [...prev, currentFlashcardIndex]);
    }
    
    // Avançar para o próximo
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const resetFlashcards = () => {
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setConhecidos([]);
    setNaoConhecidos([]);
    setShowFlashcards(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Conteúdo não encontrado</p>
      </div>
    );
  }

  const currentCard = flashcards[currentFlashcardIndex];
  const isCompleted = currentFlashcardIndex >= flashcards.length - 1 && (conhecidos.includes(currentFlashcardIndex) || naoConhecidos.includes(currentFlashcardIndex));

  // Renderizar Flashcards em tela cheia
  if (showFlashcards) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFlashcards(false)}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">Flashcards</p>
              <h1 className="text-base font-bold truncate">{resumo.subtema}</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {flashcards.length === 0 ? (
            <Card className="p-8 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Flashcards não disponíveis para este conteúdo.</p>
            </Card>
          ) : isCompleted ? (
            <Card className="p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sessão Concluída!</h3>
                <p className="text-muted-foreground">
                  Você revisou {flashcards.length} flashcards
                </p>
              </div>
              
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{conhecidos.length}</div>
                  <div className="text-sm text-muted-foreground">Conhecidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{naoConhecidos.length}</div>
                  <div className="text-sm text-muted-foreground">Revisar</div>
                </div>
              </div>

              <Button onClick={resetFlashcards} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Estudar Novamente
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progresso */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Card {currentFlashcardIndex + 1} de {flashcards.length}</span>
                <div className="flex gap-4">
                  <span className="text-green-500">{conhecidos.length} ✓</span>
                  <span className="text-red-500">{naoConhecidos.length} ✗</span>
                </div>
              </div>

              {/* Card */}
              <div 
                className="relative min-h-[300px] cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isFlipped ? "back" : "front"}
                    initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <Card className={`p-6 min-h-[300px] flex flex-col items-center justify-center text-center ${isFlipped ? 'bg-primary/5' : ''}`}>
                      {!isFlipped ? (
                        <>
                          <HelpCircle className="w-8 h-8 text-primary mb-4" />
                          <p className="text-lg font-medium">{currentCard?.frente}</p>
                          <p className="text-sm text-muted-foreground mt-4">Toque para ver a resposta</p>
                        </>
                      ) : (
                        <>
                          <Check className="w-8 h-8 text-green-500 mb-4" />
                          <p className="text-base">{currentCard?.verso}</p>
                        </>
                      )}
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Botões de resposta */}
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(false); }}
                  >
                    <X className="w-4 h-4" />
                    Não Sabia
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(true); }}
                  >
                    <Check className="w-4 h-4" />
                    Sabia
                  </Button>
                </motion.div>
              )}

              {/* Navegação */}
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentFlashcardIndex === 0}
                  onClick={() => { setCurrentFlashcardIndex(prev => prev - 1); setIsFlipped(false); }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentFlashcardIndex >= flashcards.length - 1}
                  onClick={() => { setCurrentFlashcardIndex(prev => prev + 1); setIsFlipped(false); }}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${encodeURIComponent(decodedTema)}`)}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{decodedArea} • {decodedTema}</p>
              <h1 className="text-base font-bold truncate">{resumo.subtema}</h1>
            </div>
          </div>
        </div>

        {/* Tabs - Conteúdo, Exemplo, Termos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border/50 rounded-none h-auto gap-0 overflow-x-auto">
            <TabsTrigger 
              value="conteudo" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5 shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="exemplo" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5 shrink-0"
              disabled={!conteudoGerado?.exemplos}
            >
              <Sparkles className="w-4 h-4" />
              <span>Exemplo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="termos" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5 shrink-0"
              disabled={!conteudoGerado?.termos}
            >
              <FileText className="w-4 h-4" />
              <span>Termos</span>
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Tabs */}
          <div className="px-4 py-6">
            <TabsContent value="conteudo" className="mt-0">
              <Card className="p-4 sm:p-6">
                <div className="resumo-content resumo-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {conteudoGerado?.markdown || resumo.conteudo || "Conteúdo não disponível"}
                  </ReactMarkdown>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="exemplo" className="mt-0">
              <Card className="p-4 sm:p-6">
                <div className="resumo-content resumo-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {conteudoGerado?.exemplos || "Exemplos não disponíveis para este conteúdo."}
                  </ReactMarkdown>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="termos" className="mt-0">
              <Card className="p-4 sm:p-6">
                <div className="resumo-content resumo-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {conteudoGerado?.termos || "Glossário de termos não disponível para este conteúdo."}
                  </ReactMarkdown>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Menu de Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-3 safe-area-pb">
        <AnimatePresence>
          {menuAberto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 bg-background border-t border-border/50 px-4 py-4"
            >
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setMenuAberto(false);
                    setShowFlashcards(true);
                  }}
                  variant="outline"
                  className="flex-1 max-w-[160px] gap-2 h-12"
                >
                  <Layers className="w-5 h-5 text-purple-500" />
                  Flashcards
                </Button>
                <Button
                  onClick={() => {
                    setMenuAberto(false);
                    // TODO: Implementar questões
                  }}
                  variant="outline"
                  className="flex-1 max-w-[160px] gap-2 h-12"
                >
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  Questões
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          onClick={() => setMenuAberto(!menuAberto)}
          className={`w-full h-12 gap-2 text-base font-semibold transition-all ${
            menuAberto 
              ? 'bg-muted text-foreground hover:bg-muted/80' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          {menuAberto ? 'Fechar' : 'Praticar'}
        </Button>
      </div>
    </div>
  );
}

// Função para gerar flashcards a partir do conteúdo
function generateFlashcards(resumo: ResumoData | undefined, conteudoGerado: ConteudoGerado | null): { frente: string; verso: string }[] {
  if (!resumo) return [];

  const flashcards: { frente: string; verso: string }[] = [];

  // Flashcard principal do subtema
  flashcards.push({
    frente: `O que é "${resumo.subtema}"?`,
    verso: resumo.conteudo?.substring(0, 300) + "..." || conteudoGerado?.markdown?.substring(0, 300) + "..." || "Conteúdo não disponível"
  });

  // Se tiver termos, criar flashcards para cada termo
  if (conteudoGerado?.termos) {
    const termosText = conteudoGerado.termos;
    // Tentar extrair termos do markdown (formato **termo**: definição)
    const termoMatches = termosText.match(/\*\*([^*]+)\*\*[:\s]+([^*\n]+)/g);
    
    if (termoMatches) {
      termoMatches.slice(0, 5).forEach(match => {
        const parts = match.split(/\*\*|\*\*/);
        if (parts.length >= 3) {
          const termo = parts[1].trim();
          const definicao = parts[2].replace(/^[:\s]+/, '').trim();
          if (termo && definicao) {
            flashcards.push({
              frente: `O que significa "${termo}"?`,
              verso: definicao
            });
          }
        }
      });
    }
  }

  return flashcards;
}
