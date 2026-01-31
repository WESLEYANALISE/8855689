import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Book, User, FileText, Scale, Briefcase, GraduationCap, Star, Lightbulb } from "lucide-react";
import type { CollapsibleItem } from "./types";

interface SlideCollapsibleProps {
  items: CollapsibleItem[];
  titulo?: string;
  conteudo?: string;
  allowMultiple?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  book: Book,
  user: User,
  file: FileText,
  scale: Scale,
  briefcase: Briefcase,
  education: GraduationCap,
  star: Star,
  lightbulb: Lightbulb,
};

export const SlideCollapsible = ({ 
  items, 
  titulo, 
  conteudo,
  allowMultiple = true 
}: SlideCollapsibleProps) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhum item para exibir
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Intro text if provided */}
      {conteudo && (
        <p className="text-foreground leading-relaxed mb-4 animate-fade-in">
          {conteudo}
        </p>
      )}
      
      {/* Collapsible items */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openItems.has(idx);
          const IconComponent = item.icone ? iconMap[item.icone.toLowerCase()] : Book;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl border border-border/50 bg-card/60 overflow-hidden"
            >
              {/* Header - always visible */}
              <button
                onClick={() => toggleItem(idx)}
                className="w-full p-4 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    {IconComponent && <IconComponent className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <span className="font-semibold text-foreground text-left">
                    {item.titulo}
                  </span>
                </div>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isOpen ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              {/* Collapsible content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="pl-13 border-l-2 border-indigo-500/30 ml-5 pl-6">
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {item.conteudo}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center mt-4 animate-fade-in">
        Toque para expandir cada conceito
      </p>
    </div>
  );
};

export default SlideCollapsible;
