import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Play, Loader2, CheckCircle } from 'lucide-react';
import { 
  Home, Scale, FileText, Wrench, Sparkles, Navigation,
  BookOpen, HelpCircle, GraduationCap, Brain, Library,
  GitBranch, Calendar, PlayCircle, Headphones, MessageCircle,
  Newspaper, Film, Book, Eye, Menu, Monitor, Search, Volume2,
  Lightbulb, Type, Share2, List, AlertTriangle, Users,
  FileCheck, ScrollText, FileEdit
} from 'lucide-react';
import { TutorialFuncionalidade } from '@/config/tutorialCategories';
import { TutorialCacheItem } from '@/hooks/useTutoriaisCache';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<any>> = {
  Home, Scale, FileText, Wrench, Sparkles, Navigation,
  BookOpen, HelpCircle, GraduationCap, Brain, Library,
  GitBranch, Calendar, PlayCircle, Headphones, MessageCircle,
  Newspaper, Film, Book, Eye, Menu, Monitor, Search, Volume2,
  Lightbulb, Type, Share2, List, AlertTriangle, Users,
  FileCheck, ScrollText, FileEdit,
};

interface TutorialExpandableCardProps {
  funcionalidade: TutorialFuncionalidade;
  cachedTutorial?: TutorialCacheItem;
  isGenerating: boolean;
  onGenerate: () => void;
  onStartTutorial: () => void;
}

export function TutorialExpandableCard({
  funcionalidade,
  cachedTutorial,
  isGenerating,
  onGenerate,
  onStartTutorial,
}: TutorialExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[funcionalidade.icone] || HelpCircle;

  const handleExpand = async () => {
    if (!cachedTutorial && !isGenerating) {
      onGenerate();
    }
    setIsExpanded(!isExpanded);
  };

  const descricao = cachedTutorial?.descricao_curta || funcionalidade.contexto.slice(0, 80) + '...';
  const funcionalidades = cachedTutorial?.funcionalidades || [];

  return (
    <motion.div
      layout
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {funcionalidade.titulo}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {descricao}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isGenerating ? (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          ) : cachedTutorial ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : null}
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Loading state */}
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Gerando conteúdo com IA...</span>
                </div>
              )}

              {/* Funcionalidades list */}
              {!isGenerating && funcionalidades.length > 0 && (
                <div className="space-y-3">
                  {funcionalidades.map((func, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground">
                          {func.nome}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {func.descricao}
                        </p>
                        {func.exemplo && (
                          <p className="text-xs text-primary/80 mt-1 italic">
                            💡 {func.exemplo}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Fallback when no cached content yet */}
              {!isGenerating && funcionalidades.length === 0 && (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    {funcionalidade.contexto}
                  </p>
                </div>
              )}

              {/* Start tutorial button */}
              <Button
                onClick={onStartTutorial}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="w-4 h-4" />
                Iniciar Tutorial
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
