/**
 * Utilitário de Animações CSS Leves
 * Substitui framer-motion por classes CSS nativas para melhor performance
 */

// Animações de entrada
export const fadeIn = "animate-[fadeIn_200ms_ease-out]";
export const fadeInFast = "animate-[fadeIn_150ms_ease-out]";
export const fadeInSlow = "animate-[fadeIn_300ms_ease-out]";

// Animações de slide
export const slideUp = "animate-[slideUp_200ms_ease-out]";
export const slideUpFast = "animate-[slideUp_150ms_ease-out]";
export const slideDown = "animate-[slideDown_200ms_ease-out]";
export const slideLeft = "animate-[slideLeft_200ms_ease-out]";
export const slideRight = "animate-[slideRight_200ms_ease-out]";

// Animações de escala
export const scaleIn = "animate-[scaleIn_150ms_ease-out]";
export const scaleInSlow = "animate-[scaleIn_250ms_ease-out]";

// Animações combinadas
export const fadeSlideUp = "animate-[fadeSlideUp_200ms_ease-out]";
export const fadeSlideDown = "animate-[fadeSlideDown_200ms_ease-out]";

// Classes de transição para estados
export const transitionFast = "transition-all duration-150 ease-out";
export const transitionNormal = "transition-all duration-200 ease-out";
export const transitionSlow = "transition-all duration-300 ease-out";

// Classes para flip de cards (CSS puro)
export const flipCard = "transition-transform duration-300 ease-out";
export const flipCardFront = "backface-hidden";
export const flipCardBack = "backface-hidden rotate-y-180";

// Utilitário para combinar classes de animação
export const combineAnimations = (...classes: string[]) => classes.join(" ");

// Presets comuns
export const presets = {
  // Para modais e drawers
  modal: "animate-[scaleIn_200ms_ease-out]",
  drawer: "animate-[slideUp_250ms_ease-out]",
  
  // Para cards
  cardEnter: "animate-[fadeSlideUp_200ms_ease-out]",
  cardHover: "transition-transform duration-150 hover:scale-[1.02]",
  
  // Para listas
  listItem: "animate-[fadeIn_150ms_ease-out]",
  staggerDelay: (index: number) => `animation-delay: ${index * 50}ms`,
};

export default {
  fadeIn,
  fadeInFast,
  fadeInSlow,
  slideUp,
  slideUpFast,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleInSlow,
  fadeSlideUp,
  fadeSlideDown,
  transitionFast,
  transitionNormal,
  transitionSlow,
  flipCard,
  flipCardFront,
  flipCardBack,
  combineAnimations,
  presets,
};
