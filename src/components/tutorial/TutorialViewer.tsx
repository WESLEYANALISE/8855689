import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneMockup } from './PhoneMockup';
import { TutorialAnnotation } from './TutorialAnnotation';

interface PassoTutorial {
  ordem: number;
  titulo: string;
  descricao: string;
  screenshot_url: string;
  anotacoes: Array<{
    tipo: 'retangulo' | 'seta' | 'circulo';
    posicao?: { x: number; y: number; largura: number; altura: number };
    de?: { x: number; y: number };
    para?: { x: number; y: number };
    cor: string;
  }>;
}

interface TutorialViewerProps {
  titulo: string;
  passos: PassoTutorial[];
  onClose?: () => void;
}

export const TutorialViewer: React.FC<TutorialViewerProps> = ({ titulo, passos, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const goToNext = useCallback(() => {
    if (currentStep < passos.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, passos.length]);

  const goToPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const currentPasso = passos[currentStep];

  if (!currentPasso) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum passo disponível
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center p-4">
      {/* Phone mockup with screenshot */}
      <div className="relative">
        <PhoneMockup>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
            >
              {/* Screenshot */}
              <img
                src={currentPasso.screenshot_url}
                alt={`Passo ${currentPasso.ordem}`}
                className="w-full h-full object-cover object-top"
              />
              
              {/* Annotations overlay */}
              <TutorialAnnotation
                anotacoes={currentPasso.anotacoes}
                stepNumber={currentPasso.ordem}
              />
            </motion.div>
          </AnimatePresence>
        </PhoneMockup>
      </div>

      {/* Description panel */}
      <div className="flex flex-col max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Step info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-xl p-4 border border-border mb-4"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mb-3"
              style={{ backgroundColor: currentPasso.anotacoes[0]?.cor || '#FF6B6B' }}
            >
              {currentPasso.ordem}
            </div>
            <h4 className="font-semibold text-foreground mb-2">{currentPasso.titulo}</h4>
            <p className="text-sm text-muted-foreground">{currentPasso.descricao}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {passos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : 'bg-muted hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentStep === passos.length - 1}
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Progress text */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          {currentStep + 1} de {passos.length}
        </p>
      </div>
    </div>
  );
};
