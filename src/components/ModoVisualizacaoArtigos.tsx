import { List, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModoVisualizacaoArtigosProps {
  modo: 'numerico' | 'capitulos';
  onModoChange: (modo: 'numerico' | 'capitulos') => void;
  capituloSelecionado?: string;
  onCapituloChange?: (capitulo: string) => void;
  capitulos?: { id: string; titulo: string; artigosCount: number }[];
}

export const ModoVisualizacaoArtigos = ({ 
  modo, 
  onModoChange,
  capituloSelecionado,
  onCapituloChange,
  capitulos = []
}: ModoVisualizacaoArtigosProps) => {
  return (
    <div className="space-y-3">
      {/* Toggle Numérico/Capítulos */}
      <Tabs value={modo} onValueChange={(v) => onModoChange(v as 'numerico' | 'capitulos')} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-10 bg-muted/50 rounded-lg p-1">
          <TabsTrigger 
            value="numerico" 
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
          >
            <List className="w-4 h-4" />
            <span>Numérico</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="capitulos" 
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Capítulos</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Lista de Capítulos quando modo = capitulos */}
      {modo === 'capitulos' && capitulos.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
          {capitulos.map((cap) => (
            <button
              key={cap.id}
              onClick={() => onCapituloChange?.(cap.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                capituloSelecionado === cap.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-background/50 hover:bg-background text-foreground'
              }`}
            >
              <div className="font-medium">{cap.titulo}</div>
              <div className="text-xs text-muted-foreground">{cap.artigosCount} artigos</div>
            </button>
          ))}
        </div>
      )}
      
      {modo === 'capitulos' && capitulos.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Estrutura de capítulos não disponível para esta legislação.
        </div>
      )}
    </div>
  );
};
