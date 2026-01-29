interface ForcaVisualProps {
  erros: number;
}

export const ForcaVisual = ({ erros }: ForcaVisualProps) => {
  return (
    <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
      {/* Base */}
      <line x1="10" y1="230" x2="150" y2="230" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="230" x2="50" y2="20" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="20" x2="130" y2="20" stroke="currentColor" strokeWidth="4" />
      <line x1="130" y1="20" x2="130" y2="50" stroke="currentColor" strokeWidth="2" />
      
      {/* Cabeça */}
      {erros >= 1 && (
        <circle cx="130" cy="70" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
      )}
      
      {/* Corpo */}
      {erros >= 2 && (
        <line x1="130" y1="90" x2="130" y2="150" stroke="currentColor" strokeWidth="2" />
      )}
      
      {/* Braço Esquerdo */}
      {erros >= 3 && (
        <line x1="130" y1="110" x2="100" y2="130" stroke="currentColor" strokeWidth="2" />
      )}
      
      {/* Braço Direito */}
      {erros >= 4 && (
        <line x1="130" y1="110" x2="160" y2="130" stroke="currentColor" strokeWidth="2" />
      )}
      
      {/* Perna Esquerda */}
      {erros >= 5 && (
        <line x1="130" y1="150" x2="110" y2="190" stroke="currentColor" strokeWidth="2" />
      )}
      
      {/* Perna Direita */}
      {erros >= 6 && (
        <line x1="130" y1="150" x2="150" y2="190" stroke="currentColor" strokeWidth="2" />
      )}
      
      {/* Olhos (X) quando perde */}
      {erros >= 6 && (
        <>
          <line x1="122" y1="65" x2="128" y2="71" stroke="currentColor" strokeWidth="2" />
          <line x1="128" y1="65" x2="122" y2="71" stroke="currentColor" strokeWidth="2" />
          <line x1="132" y1="65" x2="138" y2="71" stroke="currentColor" strokeWidth="2" />
          <line x1="138" y1="65" x2="132" y2="71" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  );
};