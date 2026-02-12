import { useState, useEffect } from 'react';

const placeholders = [
  "Pesquise livros...",
  "Busque artigos de lei...",
  "Encontre videoaulas...",
  "Procure súmulas...",
  "Busque flashcards...",
  "Pesquise questões OAB...",
  "Busque mapas mentais...",
];

const SearchBarAnimatedText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = placeholders[currentIndex];

    if (!isDeleting && displayText === currentPhrase) {
      const pause = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(pause);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % placeholders.length);
      return;
    }

    const speed = isDeleting ? 30 : 60;
    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentPhrase.substring(0, displayText.length - 1)
          : currentPhrase.substring(0, displayText.length + 1)
      );
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors flex-1 min-w-0">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default SearchBarAnimatedText;
