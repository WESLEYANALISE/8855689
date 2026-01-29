import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  tipo?: 'flowchart' | 'mindmap' | 'sequence' | 'timeline' | 'er' | 'pie' | 'class';
  className?: string;
}

// Configurações otimizadas por tipo de diagrama
const getThemeConfig = (tipo?: string) => {
  const baseConfig = {
    primaryColor: '#ea384c',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#ea384c',
    lineColor: '#888888',
    secondaryColor: '#333333',
    tertiaryColor: '#444444',
    background: 'transparent',
    mainBkg: '#2a2a2a',
    nodeBorder: '#ea384c',
    clusterBkg: '#333333',
    titleColor: '#ffffff',
    edgeLabelBackground: '#2a2a2a',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  };

  switch (tipo) {
    case 'mindmap':
      return {
        ...baseConfig,
        primaryColor: '#ea384c',
        secondaryColor: '#3b82f6',
        tertiaryColor: '#22c55e',
      };
    case 'pie':
      return {
        ...baseConfig,
        pie1: '#ea384c',
        pie2: '#3b82f6',
        pie3: '#22c55e',
        pie4: '#f59e0b',
        pie5: '#8b5cf6',
        pie6: '#ec4899',
      };
    case 'er':
      return {
        ...baseConfig,
        attributeBackgroundColorEven: '#2a2a2a',
        attributeBackgroundColorOdd: '#333333',
      };
    default:
      return baseConfig;
  }
};

const getDiagramConfig = (tipo?: string) => {
  const baseFlowchart = {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis' as const,
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 60,
  };

  switch (tipo) {
    case 'flowchart':
      return { flowchart: baseFlowchart };
    case 'mindmap':
      return { 
        mindmap: { 
          useMaxWidth: true, 
          padding: 30,
        } 
      };
    case 'sequence':
      return { 
        sequence: { 
          useMaxWidth: true,
          diagramMarginX: 20,
          diagramMarginY: 20,
          actorMargin: 80,
          messageMargin: 40,
        } 
      };
    case 'timeline':
      return { 
        timeline: { 
          useMaxWidth: true,
          padding: 20,
        } 
      };
    case 'er':
      return { 
        er: { 
          useMaxWidth: true,
          layoutDirection: 'TB' as const,
          minEntityWidth: 100,
          minEntityHeight: 50,
          entityPadding: 15,
        } 
      };
    case 'pie':
      return { 
        pie: { 
          useMaxWidth: true,
          textPosition: 0.75,
        } 
      };
    case 'class':
      return { 
        class: { 
          useMaxWidth: true,
          padding: 20,
        } 
      };
    default:
      return { flowchart: baseFlowchart };
  }
};

export const MermaidDiagram = ({ chart, title, tipo, className }: MermaidDiagramProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart) return;
      
      setError(null);
      setIsRendered(false);

      try {
        // Detectar tipo do diagrama se não fornecido
        const tipoDetectado = tipo || detectarTipo(chart);
        
        // Gera um ID único para cada render
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('📊 Renderizando Mermaid:', { tipo: tipoDetectado, preview: chart.substring(0, 80) });
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: getThemeConfig(tipoDetectado),
          ...getDiagramConfig(tipoDetectado),
          securityLevel: 'loose',
        });

        const { svg } = await mermaid.render(uniqueId, chart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          // Ajustar SVG para responsividade
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';
          }
          
          setIsRendered(true);
          console.log('✅ Diagrama renderizado com sucesso');
        }
      } catch (err) {
        console.error('❌ Erro ao renderizar diagrama Mermaid:', err);
        console.error('Código que falhou:', chart);
        setError(err instanceof Error ? err.message : 'Erro ao renderizar diagrama');
      }
    };

    if (chart) {
      renderDiagram();
    }
  }, [chart, tipo]);

  // Detectar tipo de diagrama pelo código
  const detectarTipo = (codigo: string): string => {
    const primeira = codigo.split('\n')[0].trim().toLowerCase();
    if (primeira.startsWith('flowchart') || primeira.startsWith('graph')) return 'flowchart';
    if (primeira.startsWith('mindmap')) return 'mindmap';
    if (primeira.startsWith('sequencediagram')) return 'sequence';
    if (primeira.startsWith('timeline')) return 'timeline';
    if (primeira.startsWith('erdiagram')) return 'er';
    if (primeira.startsWith('pie')) return 'pie';
    if (primeira.startsWith('classdiagram')) return 'class';
    return 'flowchart';
  };
  
  return (
    <div className={`relative ${className || ''}`}>
      {title && (
        <h3 className="font-semibold mb-4 text-center text-foreground text-lg">
          {title}
        </h3>
      )}
      
      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="text-destructive text-sm font-medium mb-2">
            ❌ Erro ao renderizar diagrama
          </div>
          <div className="text-xs text-muted-foreground text-center max-w-md">
            {error}
          </div>
          <div className="mt-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono max-w-full overflow-x-auto">
            {chart.substring(0, 100)}...
          </div>
        </div>
      ) : (
        <div 
          ref={elementRef} 
          className={`
            flex justify-center items-center min-h-[200px] p-4
            transition-opacity duration-300
            ${isRendered ? 'opacity-100' : 'opacity-50'}
          `}
        />
      )}
      
      {!isRendered && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">
            Renderizando...
          </div>
        </div>
      )}
    </div>
  );
};
