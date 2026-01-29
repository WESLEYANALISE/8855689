import { useCallback, useRef, useMemo } from "react";
import { List, useListRef, ListImperativeAPI } from "react-window";
import { DicionarioTermCard } from "./DicionarioTermCard";
import { CSSProperties, ReactElement } from "react";

interface DicionarioTermo {
  Letra: string | null;
  Palavra: string | null;
  Significado: string | null;
  "Exemplo de Uso 1": string | null;
  "Exemplo de Uso 2": string | null;
  exemplo_pratico?: string | null;
}

interface DicionarioVirtualListProps {
  termos: DicionarioTermo[];
  exemploPratico: Record<string, string>;
  loadingExemplo: Record<string, boolean>;
  onGerarExemplo: (palavra: string, significado: string, existente?: string | null) => void;
  height?: number;
}

interface RowProps {
  termos: DicionarioTermo[];
  exemploPratico: Record<string, string>;
  loadingExemplo: Record<string, boolean>;
  onGerarExemplo: (palavra: string, significado: string, existente?: string | null) => void;
}

const ITEM_HEIGHT = 140;

const RowComponent = ({
  index,
  style,
  termos,
  exemploPratico,
  loadingExemplo,
  onGerarExemplo,
}: {
  ariaAttributes: { "aria-posinset": number; "aria-setsize": number; role: "listitem" };
  index: number;
  style: CSSProperties;
} & RowProps): ReactElement => {
  const termo = termos[index];
  
  if (!termo?.Palavra) {
    return <div style={style} />;
  }

  const adjustedStyle: CSSProperties = {
    ...style,
    paddingRight: '16px',
    paddingLeft: '4px',
    paddingTop: '6px',
    paddingBottom: '6px',
  };

  return (
    <div style={adjustedStyle}>
      <DicionarioTermCard
        palavra={termo.Palavra}
        significado={termo.Significado || ""}
        exemploUso1={termo["Exemplo de Uso 1"]}
        exemploUso2={termo["Exemplo de Uso 2"]}
        exemploPratico={termo.exemplo_pratico}
        onGerarExemplo={() => onGerarExemplo(termo.Palavra!, termo.Significado!, termo.exemplo_pratico)}
        isLoadingExemplo={loadingExemplo[termo.Palavra!]}
        exemploPraticoContent={exemploPratico[termo.Palavra!]}
        compact
      />
    </div>
  );
};

export const DicionarioVirtualList = ({
  termos,
  exemploPratico,
  loadingExemplo,
  onGerarExemplo,
  height = 600,
}: DicionarioVirtualListProps) => {
  const listRef = useListRef();

  const calculatedHeight = useMemo(() => {
    if (typeof window !== 'undefined') {
      return Math.min(height, window.innerHeight - 280);
    }
    return height;
  }, [height]);

  const rowProps: RowProps = useMemo(() => ({
    termos,
    exemploPratico,
    loadingExemplo,
    onGerarExemplo,
  }), [termos, exemploPratico, loadingExemplo, onGerarExemplo]);

  if (termos.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <List
        listRef={listRef}
        style={{ height: calculatedHeight, width: '100%' }}
        rowCount={termos.length}
        rowHeight={ITEM_HEIGHT}
        rowComponent={RowComponent}
        rowProps={rowProps}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      />
      
      {/* Fade overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};

export const scrollToIndex = (listRef: React.RefObject<ListImperativeAPI | null>, index: number) => {
  listRef.current?.scrollToRow({ index, align: "start" });
};
