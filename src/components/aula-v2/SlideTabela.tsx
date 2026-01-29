import { useRef, useState, useCallback } from "react";
import { Table2, GripHorizontal } from "lucide-react";
import { TabelaData } from "./types";

interface SlideTabelaProps {
  tabela: TabelaData;
  titulo?: string;
  conteudo?: string;
}

export const SlideTabela = ({ tabela, titulo, conteudo }: SlideTabelaProps) => {
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

  if (!tabela || !tabela.cabecalhos || !tabela.linhas) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Tabela não disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Intro text if provided */}
      {conteudo && (
        <p className="text-foreground leading-relaxed mb-4 animate-fade-in">
          {conteudo}
        </p>
      )}

      {/* Drag hint */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs animate-fade-in">
        <GripHorizontal className="w-4 h-4" />
        <span>Arraste para ver mais colunas</span>
      </div>
      
      {/* Table container with horizontal scroll */}
      <div 
        ref={scrollRef}
        className={`overflow-x-auto rounded-xl border border-border select-none animate-fade-in ${
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
          .table-scroll-container::-webkit-scrollbar {
            height: 10px;
          }
          .table-scroll-container::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 5px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb {
            background: hsl(var(--primary));
            border-radius: 5px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--primary) / 0.8);
          }
        `}</style>
        <div className="table-scroll-container overflow-x-auto" style={{ minWidth: '100%' }}>
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20">
                {tabela.cabecalhos.map((header, idx) => (
                  <th 
                    key={idx}
                    className="px-4 py-3 text-left font-semibold text-foreground border-b border-border/50 first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody>
              {tabela.linhas.map((linha, rowIdx) => (
                <tr 
                  key={rowIdx}
                  className={`
                    ${rowIdx % 2 === 0 ? 'bg-card/30' : 'bg-card/60'}
                    hover:bg-primary/5 transition-colors
                  `}
                >
                  {linha.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx}
                      className="px-4 py-3 text-muted-foreground border-b border-border/30 whitespace-nowrap"
                    >
                      {cell}
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
        <Table2 className="w-4 h-4 text-cyan-400" />
        <span className="text-xs">Quadro comparativo para facilitar a memorização</span>
      </div>
    </div>
  );
};
