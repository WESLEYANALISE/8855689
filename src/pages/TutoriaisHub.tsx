import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, BookOpen, Sparkles } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useTutoriaisCache } from '@/hooks/useTutoriaisCache';
import { TUTORIAL_CATEGORIES, getCategoryById } from '@/config/tutorialCategories';
import { TutorialCategoryCarousel } from '@/components/tutorial/TutorialCategoryCarousel';
import { TutorialExpandableCard } from '@/components/tutorial/TutorialExpandableCard';

export default function TutoriaisHub() {
  const navigate = useNavigate();
  const { iniciarTour } = useTutorial();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { 
    tutoriais, 
    isLoading, 
    gerarTutorial, 
    isGenerating,
    gerarTutoriaisFaltantes 
  } = useTutoriaisCache(selectedCategory || undefined);

  // Selecionar primeira categoria por padrão
  useEffect(() => {
    if (!selectedCategory && TUTORIAL_CATEGORIES.length > 0) {
      setSelectedCategory(TUTORIAL_CATEGORIES[0].id);
    }
  }, [selectedCategory]);

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : null;

  const handleStartTutorial = (funcId: string, rota: string) => {
    navigate(rota, { state: { startTour: funcId } });
    setTimeout(() => {
      iniciarTour(funcId);
    }, 600);
  };

  const handleGenerateTutorial = (funcId: string) => {
    if (!currentCategory) return;
    const func = currentCategory.funcionalidades.find(f => f.id === funcId);
    if (func) {
      gerarTutorial(func, currentCategory.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tutoriais do App</h1>
              <p className="text-sm text-muted-foreground">
                Aprenda todas as funcionalidades
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <TutorialCategoryCarousel
            categories={TUTORIAL_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </motion.div>

        {/* Category description */}
        {currentCategory && (
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">
                {currentCategory.nome}
              </span>
              <span className="text-xs text-muted-foreground">
                • {currentCategory.funcionalidades.length} funcionalidades
              </span>
            </div>
          </motion.div>
        )}

        {/* Funcionalidades list */}
        {currentCategory ? (
          <div className="space-y-3">
            {currentCategory.funcionalidades.map((func, index) => {
              const cached = tutoriais.find(t => t.funcionalidade_id === func.id);
              
              return (
                <motion.div
                  key={func.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TutorialExpandableCard
                    funcionalidade={func}
                    cachedTutorial={cached}
                    isGenerating={isGenerating(func.id)}
                    onGenerate={() => handleGenerateTutorial(func.id)}
                    onStartTutorial={() => handleStartTutorial(func.id, func.rota)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Selecione uma categoria para ver os tutoriais
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
