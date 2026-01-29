import { MessageSquare, HelpCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SuggestedQuestionsProps {
  mode: string;
  onQuestionClick: (question: string) => void;
}

const QUESTIONS_BY_MODE: Record<string, { category: string; questions: string[] }[]> = {
  realcase: [
    {
      category: "📜 Casos Penais",
      questions: [
        "Analise um caso de furto qualificado",
        "Analise um caso de legítima defesa",
        "Simule um júri de homicídio doloso",
      ]
    },
    {
      category: "⚖️ Casos Cíveis",
      questions: [
        "Explique um caso de responsabilidade civil",
        "Apresente um caso de usucapião",
        "Disserte sobre dano moral por negativação indevida",
      ]
    },
    {
      category: "👔 Casos Trabalhistas",
      questions: [
        "Simule uma audiência trabalhista",
        "Analise um caso de demissão por justa causa",
        "Explique um caso de assédio moral no trabalho",
      ]
    },
  ],
  recommendation: [
    {
      category: "📚 Livros e Doutrina",
      questions: [
        "Melhores livros para Direito Constitucional?",
        "Doutrinadores essenciais para concursos",
        "Obras clássicas do Direito Penal",
      ]
    },
    {
      category: "🎬 Conteúdo Digital",
      questions: [
        "Canais de Direito no YouTube para OAB",
        "Podcasts jurídicos recomendados",
        "Cursos online gratuitos de Direito",
      ]
    },
  ],
  tcc: [
    {
      category: "💡 Temas de TCC",
      questions: [
        "Sugira temas de TCC em Direito Penal",
        "Temas atuais de TCC em Direito Civil",
        "Temas de TCC sobre LGPD",
      ]
    },
    {
      category: "📝 Metodologia",
      questions: [
        "Como estruturar um TCC jurídico?",
        "Como fazer revisão de literatura jurídica?",
        "Referências bibliográficas sobre LGPD",
      ]
    },
  ],
  study: [
    {
      category: "📖 Direito Penal",
      questions: [
        "O que é legítima defesa?",
        "Diferença entre dolo e culpa",
        "Princípio da legalidade penal",
        "O que são crimes hediondos?",
      ]
    },
    {
      category: "🏛️ Direito Constitucional",
      questions: [
        "O que são cláusulas pétreas?",
        "Controle de constitucionalidade",
        "Princípios fundamentais da CF",
        "O que são direitos fundamentais?",
      ]
    },
    {
      category: "⚖️ Direito Civil",
      questions: [
        "Responsabilidade civil objetiva",
        "O que é usucapião?",
        "Diferença entre pessoa física e jurídica",
        "O que são direitos da personalidade?",
      ]
    },
    {
      category: "👔 Direito Administrativo",
      questions: [
        "Princípios do Direito Administrativo",
        "O que é licitação?",
        "O que são atos administrativos?",
        "Competência da Justiça Federal",
      ]
    },
  ],
};

export const SuggestedQuestions = ({ mode, onQuestionClick }: SuggestedQuestionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const categories = QUESTIONS_BY_MODE[mode] || QUESTIONS_BY_MODE.study;

  const handleQuestionSelect = (question: string) => {
    setIsOpen(false);
    onQuestionClick(question);
  };

  return (
    <div className="w-full max-w-sm mx-auto relative">
      {/* Botão principal */}
      <Button
        variant="outline"
        className="text-sm h-auto py-3 px-4 w-full justify-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="w-5 h-5 text-red-400" />
        <span className="font-medium">Perguntas Frequentes</span>
      </Button>

      {/* Modal/Card flutuante */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Card */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-b from-[#2a1515] to-[#1a0a0a] border border-red-900/50 rounded-2xl shadow-2xl shadow-red-900/20 max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-red-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Perguntas Frequentes</h3>
                    <p className="text-xs text-white/60">Clique em uma pergunta para começar</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Explicação */}
              <div className="px-4 py-3 bg-white/5 border-b border-red-900/20">
                <p className="text-sm text-white/80">
                  🎓 <span className="text-white font-medium">Você pode perguntar sobre:</span> conceitos jurídicos, análise de casos, dúvidas sobre leis, preparação para OAB, questões de concursos e muito mais!
                </p>
              </div>

              {/* Lista de perguntas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {categories.map((cat, catIndex) => (
                  <div key={catIndex}>
                    <h4 className="text-sm font-semibold text-red-400/90 mb-2 px-1">
                      {cat.category}
                    </h4>
                    <div className="space-y-1.5">
                      {cat.questions.map((question, qIndex) => (
                        <button
                          key={qIndex}
                          onClick={() => handleQuestionSelect(question)}
                          className="w-full text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/90 hover:text-white text-sm transition-all group flex items-center justify-between gap-2 border border-transparent hover:border-red-900/40"
                        >
                          <span className="flex-1">{question}</span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-red-900/30 bg-black/20">
                <p className="text-xs text-white/50 text-center">
                  💡 Dica: Você também pode digitar sua própria pergunta no campo abaixo
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};