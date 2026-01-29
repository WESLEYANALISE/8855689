import React from 'react';
import { motion } from 'framer-motion';

interface Anotacao {
  tipo: 'retangulo' | 'seta' | 'circulo';
  posicao?: { x: number; y: number; largura: number; altura: number };
  de?: { x: number; y: number };
  para?: { x: number; y: number };
  cor: string;
}

interface TutorialAnnotationProps {
  anotacoes: Anotacao[];
  stepNumber: number;
}

export const TutorialAnnotation: React.FC<TutorialAnnotationProps> = ({ anotacoes, stepNumber }) => {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {anotacoes.map((_, index) => (
          <marker
            key={`arrow-${index}`}
            id={`arrowhead-${stepNumber}-${index}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={anotacoes[index].cor}
            />
          </marker>
        ))}
      </defs>

      {anotacoes.map((anotacao, index) => {
        if (anotacao.tipo === 'retangulo' && anotacao.posicao) {
          return (
            <motion.rect
              key={`rect-${index}`}
              x={`${anotacao.posicao.x}%`}
              y={`${anotacao.posicao.y}%`}
              width={`${anotacao.posicao.largura}%`}
              height={`${anotacao.posicao.altura}%`}
              fill="none"
              stroke={anotacao.cor}
              strokeWidth="0.5"
              strokeDasharray="2,1"
              rx="1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          );
        }

        if (anotacao.tipo === 'seta' && anotacao.de && anotacao.para) {
          return (
            <motion.line
              key={`arrow-${index}`}
              x1={`${anotacao.de.x}%`}
              y1={`${anotacao.de.y}%`}
              x2={`${anotacao.para.x}%`}
              y2={`${anotacao.para.y}%`}
              stroke={anotacao.cor}
              strokeWidth="0.4"
              markerEnd={`url(#arrowhead-${stepNumber}-${index})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
            />
          );
        }

        if (anotacao.tipo === 'circulo' && anotacao.posicao) {
          const cx = anotacao.posicao.x + anotacao.posicao.largura / 2;
          const cy = anotacao.posicao.y + anotacao.posicao.altura / 2;
          const r = Math.max(anotacao.posicao.largura, anotacao.posicao.altura) / 2;
          
          return (
            <motion.circle
              key={`circle-${index}`}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r={`${r}%`}
              fill="none"
              stroke={anotacao.cor}
              strokeWidth="0.5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          );
        }

        return null;
      })}

      {/* Step number badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <circle cx="8" cy="8" r="6" fill={anotacoes[0]?.cor || '#FF6B6B'} />
        <text
          x="8"
          y="8"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="4"
          fontWeight="bold"
        >
          {stepNumber}
        </text>
      </motion.g>
    </svg>
  );
};
