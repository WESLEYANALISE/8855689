/**
 * Hook para tocar sons de feedback (acerto/erro) usando Web Audio API
 */
export const useFeedbackSound = () => {
  const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          resolve();
          return;
        }
        
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        
        if (type === 'correct') {
          // Som de acerto: acordes ascendentes (alegre)
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // Dó
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08); // Mi
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16); // Sol
        } else {
          // Som de erro: tom descendente (triste)
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // Mi
          oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12); // Dó grave
        }
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
        
        setTimeout(() => {
          audioContext.close();
          resolve();
        }, 300);
      } catch (err) {
        console.error('Erro ao tocar som:', err);
        resolve();
      }
    });
  };

  return { playFeedbackSound };
};

// Função standalone para uso sem hook
export const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve();
        return;
      }
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      
      if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
      } else {
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12);
      }
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
      
      setTimeout(() => {
        audioContext.close();
        resolve();
      }, 300);
    } catch (err) {
      console.error('Erro ao tocar som:', err);
      resolve();
    }
  });
};
