import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { getTutorialById, TutorialConfig } from '@/config/tutorialSteps';

interface TutorialContextType {
  iniciarTour: (tourId: string) => void;
  pararTour: () => void;
  tourAtivo: boolean;
  tourId: string | null;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [tourAtivo, setTourAtivo] = useState(false);
  const [tourId, setTourId] = useState<string | null>(null);
  const [currentTour, setCurrentTour] = useState<TutorialConfig | null>(null);
  const navigate = useNavigate();

  const iniciarTour = useCallback((id: string) => {
    const tour = getTutorialById(id);
    if (tour) {
      // Navega para a rota do tour se não estiver nela
      if (window.location.pathname !== tour.rota) {
        navigate(tour.rota);
        // Aguarda navegação antes de iniciar
        setTimeout(() => {
          setCurrentTour(tour);
          setTourId(id);
          setTourAtivo(true);
        }, 500);
      } else {
        setCurrentTour(tour);
        setTourId(id);
        setTourAtivo(true);
      }
    }
  }, [navigate]);

  const pararTour = useCallback(() => {
    setTourAtivo(false);
    setTourId(null);
    setCurrentTour(null);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      pararTour();
    }
    
    if (action === ACTIONS.CLOSE) {
      pararTour();
    }
  };

  return (
    <TutorialContext.Provider value={{ iniciarTour, pararTour, tourAtivo, tourId }}>
      {children}
      {tourAtivo && currentTour && (
        <Joyride
          steps={currentTour.steps}
          run={tourAtivo}
          continuous
          showProgress={false}
          showSkipButton
          scrollToFirstStep
          spotlightClicks={false}
          disableOverlayClose={false}
          disableScrolling={false}
          spotlightPadding={12}
          scrollOffset={150}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#ef4444',
              backgroundColor: '#1c1c1c',
              textColor: '#ffffff',
              arrowColor: '#1c1c1c',
              overlayColor: 'rgba(0, 0, 0, 0.75)',
              spotlightShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              maxWidth: 340,
            },
            tooltipContainer: {
              textAlign: 'left',
            },
            tooltipTitle: {
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 12,
              color: '#ffffff',
            },
            tooltipContent: {
              fontSize: 13,
              lineHeight: 1.6,
              color: '#e5e5e5',
              whiteSpace: 'pre-line',
            },
            buttonNext: {
              backgroundColor: '#ef4444',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: '#ffffff',
            },
            buttonBack: {
              color: '#a3a3a3',
              marginRight: 10,
              padding: '10px 16px',
            },
            buttonSkip: {
              color: '#a3a3a3',
              padding: '10px 16px',
            },
            buttonClose: {
              color: '#a3a3a3',
            },
            spotlight: {
              borderRadius: 16,
              border: '2px solid rgba(239, 68, 68, 0.6)',
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            },
            beacon: {
              display: 'none',
            },
          }}
          locale={{
            back: 'Anterior',
            close: 'Fechar',
            last: 'Finalizar',
            next: 'Próximo',
            open: 'Abrir',
            skip: 'Pular',
          }}
          floaterProps={{
            styles: {
              floater: {
                filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5)',
              },
            },
            disableAnimation: false,
          }}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
