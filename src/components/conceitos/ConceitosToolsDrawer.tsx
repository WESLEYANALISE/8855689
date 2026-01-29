import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  BookText, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import ReactCardFlip from "react-card-flip";

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

type ToolType = null | "exemplos" | "termos" | "flashcards";

interface ConceitosToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exemplos: Exemplo[];
  termos: Termo[];
  flashcards: Flashcard[];
  fontSize: number;
}

const ConceitosToolsDrawer = ({
  isOpen,
  onClose,
  exemplos,
  termos,
  flashcards,
  fontSize
}: ConceitosToolsDrawerProps) => {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  const handleBack = () => {
    setActiveTool(null);
    setFlashcardIndex(0);
    setIsFlipped(false);
  };

  const handleClose = () => {
    setActiveTool(null);
    setFlashcardIndex(0);
    setIsFlipped(false);
    onClose();
  };

  // Menu principal
  const renderMenu = () => (
    <div className="space-y-3 p-4">
      <button
        onClick={() => setActiveTool("exemplos")}
        disabled={exemplos.length === 0}
        className="w-full flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-xl border border-amber-500/20 hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-400" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-white">Exemplos Práticos</h3>
          <p className="text-xs text-gray-400">{exemplos.length} exemplos disponíveis</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTool("termos")}
        disabled={termos.length === 0}
        className="w-full flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-xl border border-amber-500/20 hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <BookText className="w-6 h-6 text-amber-400" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-white">Termos Importantes</h3>
          <p className="text-xs text-gray-400">{termos.length} termos disponíveis</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTool("flashcards")}
        disabled={flashcards.length === 0}
        className="w-full flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-xl border border-amber-500/20 hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-white">Flashcards</h3>
          <p className="text-xs text-gray-400">{flashcards.length} cards disponíveis</p>
        </div>
      </button>
    </div>
  );

  // Exemplos
  const renderExemplos = () => (
    <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
      {exemplos.map((exemplo, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#1a1a2e] rounded-xl border border-white/10 p-5"
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
    </div>
  );

  // Termos
  const renderTermos = () => (
    <div className="space-y-3 p-4 max-h-[60vh] overflow-y-auto">
      {termos.map((termo, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-[#1a1a2e] rounded-xl border border-white/10 p-5"
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
    </div>
  );

  // Flashcards
  const renderFlashcards = () => (
    <div className="p-4">
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
                className="min-h-[240px] bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent rounded-xl border-2 border-amber-500/30 p-6 flex flex-col items-center justify-center cursor-pointer"
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
                className="min-h-[240px] bg-gradient-to-br from-green-900/20 via-green-800/10 to-transparent rounded-xl border-2 border-green-500/30 p-6 flex flex-col cursor-pointer"
                onClick={() => setIsFlipped(false)}
              >
                <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Resposta</div>
                <p className="text-center flex-1 flex items-center justify-center font-medium text-white" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                  {flashcardAtual.verso}
                </p>
                
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
              className="flex-1 py-3 bg-[#1a1a2e] border border-white/10 text-gray-400 rounded-xl font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={proximoFlashcard}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nenhum flashcard disponível
        </div>
      )}
    </div>
  );

  const getTitle = () => {
    switch (activeTool) {
      case "exemplos": return "Exemplos Práticos";
      case "termos": return "Termos Importantes";
      case "flashcards": return "Flashcards";
      default: return "Ferramentas de Estudo";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="bg-[#12121a] border-t border-amber-500/20 max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {activeTool && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-white/5"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <SheetTitle className="text-white font-serif text-lg">{getTitle()}</SheetTitle>
          </div>
        </SheetHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool || "menu"}
            initial={{ opacity: 0, x: activeTool ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTool ? -20 : 20 }}
            transition={{ duration: 0.15 }}
          >
            {!activeTool && renderMenu()}
            {activeTool === "exemplos" && renderExemplos()}
            {activeTool === "termos" && renderTermos()}
            {activeTool === "flashcards" && renderFlashcards()}
          </motion.div>
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default ConceitosToolsDrawer;
