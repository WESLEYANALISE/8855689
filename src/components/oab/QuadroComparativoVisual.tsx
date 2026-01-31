import { useRef, useState, useCallback } from "react";
import { Table2, GripHorizontal } from "lucide-react";

// Função local para processar Markdown inline (negrito e itálico)
const processInlineMarkdown = (text: string): React.ReactNode => {
  if (!text || typeof text !== 'string') return text;
  
  const parts: React.ReactNode[] = [];
  let key = 0;
  
  // Regex para **negrito** e *itálico*
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    if (match[2]) {
      // **negrito**
      parts.push(<strong key={key++} className="font-bold text-amber-200">{match[2]}</strong>);
    } else if (match[3]) {
      // *itálico*
      parts.push(<em key={key++} className="italic text-amber-100/80">{match[3]}</em>);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 1 ? <>{parts}</> : parts[0] || text;
};

interface QuadroComparativoVisualProps {
  cabecalhos: string[];
  linhas: string[][];
  titulo?: string;
}

/**
 * Componente visual para Quadro Comparativo no OAB Trilhas.
 * Baseado no SlideTabela com temática vermelho/laranja.
 * Suporta drag horizontal e touch para mobile.
 */
export const QuadroComparativoVisual = ({ cabecalhos, linhas, titulo }: QuadroComparativoVisualProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  if (!cabecalhos || cabecalhos.length === 0 || !linhas || linhas.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 my-6">
      {/* Título se fornecido */}
      {titulo && (
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Table2 className="w-5 h-5 text-red-400" />
          {titulo}
        </h3>
      )}

      {/* Drag hint */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs animate-fade-in">
        <GripHorizontal className="w-4 h-4 text-red-400/60" />
        <span>Arraste para ver mais colunas</span>
      </div>
      
      {/* Table container with horizontal scroll */}
      <div 
        ref={scrollRef}
        className={`overflow-x-auto rounded-xl border border-red-500/30 select-none animate-fade-in ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        <style>{`
          .quadro-scroll-container::-webkit-scrollbar {
            height: 10px;
          }
          .quadro-scroll-container::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 5px;
          }
          .quadro-scroll-container::-webkit-scrollbar-thumb {
            background: linear-gradient(to right, #ef4444, #f97316);
            border-radius: 5px;
          }
          .quadro-scroll-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to right, #dc2626, #ea580c);
          }
        `}</style>
        <div className="quadro-scroll-container overflow-x-auto" style={{ minWidth: '100%' }}>
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-red-500/30 to-orange-500/30">
                {cabecalhos.map((header, idx) => (
                  <th 
                    key={idx}
                    className="px-4 py-3 text-left font-semibold text-white border-b border-red-500/30 first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody>
              {linhas.map((linha, rowIdx) => (
                <tr 
                  key={rowIdx}
                  className={`
                    ${rowIdx % 2 === 0 ? 'bg-[#1a1a24]/60' : 'bg-[#12121a]/80'}
                    hover:bg-red-500/10 transition-colors
                  `}
                >
                  {linha.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx}
                      className="px-4 py-3 text-gray-300 border-b border-red-500/20 whitespace-nowrap"
                    >
                      {processInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Table indicator */}
      <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
        <Table2 className="w-4 h-4 text-red-400" />
        <span className="text-xs">Quadro comparativo para facilitar a memorização</span>
      </div>
    </div>
  );
};

/**
 * Extrai dados de tabela de um conteúdo Markdown.
 * Retorna null se não encontrar tabela válida.
 */
export const extrairTabelaDoMarkdown = (markdown: string): { cabecalhos: string[]; linhas: string[][] } | null => {
  if (!markdown || !markdown.includes("|")) return null;
  
  // Encontrar linhas que parecem ser tabela (mais flexível)
  const allLines = markdown.split('\n');
  const tableLines: string[] = [];
  let inTable = false;
  
  for (const line of allLines) {
    const trimmed = line.trim();
    // Linha de tabela: começa e termina com |, ou tem | no meio
    if (trimmed.includes('|')) {
      const pipeCount = (trimmed.match(/\|/g) || []).length;
      if (pipeCount >= 2) {
        inTable = true;
        tableLines.push(trimmed);
      }
    } else if (inTable && trimmed === '') {
      // Linha vazia após tabela - continua checando
      continue;
    } else if (inTable) {
      // Linha não-tabela - termina a detecção
      break;
    }
  }
  
  if (tableLines.length < 3) return null; // Mínimo: header, separator, 1 row
  
  // Primeira linha = headers
  const headerLine = tableLines[0];
  const cabecalhos = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell !== '' && !/^[-:]+$/.test(cell));
  
  if (cabecalhos.length === 0) return null;
  
  // Ignorar linha separadora (segunda linha com ---)
  // Restante = linhas de dados
  const dataLines = tableLines.slice(2);
  
  const linhas: string[][] = [];
  for (const line of dataLines) {
    // Ignorar linhas separadoras
    if (/^[\|\s\-:]+$/.test(line)) continue;
    
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
    
    if (cells.length > 0) {
      linhas.push(cells);
    }
  }
  
  if (linhas.length === 0) return null;
  
  console.log('📊 Tabela detectada:', { cabecalhos, linhasCount: linhas.length });
  
  return { cabecalhos, linhas };
};

export default QuadroComparativoVisual;
