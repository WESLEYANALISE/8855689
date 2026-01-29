import { memo, useRef, useEffect, useState, ReactNode, ReactElement, CSSProperties } from 'react';
import { Grid, CellComponentProps } from 'react-window';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  itemWidth?: number;
  columns?: number;
  gap?: number;
  className?: string;
  overscanCount?: number;
}

interface CellData<T> {
  items: T[];
  columns: number;
  gap: number;
  renderItem: (item: T, index: number) => ReactNode;
}

// Cell component for the grid
function Cell<T>({ 
  columnIndex, 
  rowIndex, 
  style, 
  ...rest
}: {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  ariaAttributes: any;
} & CellData<T>): ReactElement {
  const { items, columns, gap, renderItem } = rest;
  const index = rowIndex * columns + columnIndex;
  
  if (index >= items.length) {
    return <div style={style} />;
  }

  const item = items[index];
  
  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + gap / 2,
        top: Number(style.top) + gap / 2,
        width: Number(style.width) - gap,
        height: Number(style.height) - gap,
      }}
    >
      {renderItem(item, index)}
    </div>
  );
}

/**
 * Grid virtualizado para renderizar grandes listas de items em formato de grade.
 * Só renderiza os items visíveis na viewport + overscan para scroll suave.
 * 
 * @example
 * <VirtualizedGrid
 *   items={noticias}
 *   renderItem={(noticia, index) => <NoticiaCard key={noticia.id} {...noticia} />}
 *   itemHeight={120}
 *   columns={3}
 *   gap={12}
 * />
 */
function VirtualizedGridComponent<T>({
  items,
  renderItem,
  itemHeight,
  itemWidth,
  columns = 3,
  gap = 12,
  className = '',
  overscanCount = 2,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Detectar dimensões do container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.min(rect.height || window.innerHeight * 0.8, window.innerHeight),
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = Math.ceil(items.length / columns);
  const calculatedItemWidth = itemWidth || (dimensions.width - gap) / columns;

  const cellProps: CellData<T> = {
    items,
    columns,
    gap,
    renderItem,
  };

  if (dimensions.width === 0) {
    return (
      <div ref={containerRef} className={`min-h-[400px] ${className}`} />
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Grid
        columnCount={columns}
        columnWidth={calculatedItemWidth}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        overscanCount={overscanCount}
        cellComponent={Cell as any}
        cellProps={cellProps}
        style={{ height: dimensions.height, width: dimensions.width }}
      />
    </div>
  );
}

export const VirtualizedGrid = memo(VirtualizedGridComponent) as typeof VirtualizedGridComponent;

export default VirtualizedGrid;
