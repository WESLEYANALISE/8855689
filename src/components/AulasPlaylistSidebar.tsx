import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCursosCache } from "@/hooks/useCursosCache";

interface AulasPlaylistSidebarProps {
  area: string;
  aulaAtual: string;
}

export const AulasPlaylistSidebar = ({ area, aulaAtual }: AulasPlaylistSidebarProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Hook moved here from Layout.tsx
  const { cursos } = useCursosCache();
  const aulas = cursos.filter(c => c.area === area).map(c => ({
    tema: c.tema,
    ordem: c.ordem,
    'capa-aula': c['capa-aula'],
    'aula-link': c['aula-link']
  }));

  const filteredAulas = aulas.filter((aula) =>
    aula.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVoltar = () => {
    navigate(`/iniciando-direito/${encodeURIComponent(area)}/temas`);
  };

  return (
    <div className="h-full w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVoltar}
          className="w-full justify-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para {area}
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de Aulas */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredAulas.map((aula) => {
            const isAtual = aula.tema === aulaAtual;
            
            return (
              <button
                key={aula.ordem}
                onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(area)}/aula/${encodeURIComponent(aula.tema)}`)}
                className={`
                  w-full p-3 rounded-lg text-left transition-all duration-200
                  hover:bg-accent/50
                  ${isAtual ? 'bg-primary/10 border-l-4 border-primary' : 'hover:border-l-4 hover:border-accent'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant={isAtual ? "default" : "outline"} className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                      {aula.ordem}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isAtual && <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                      <h4 className={`text-sm font-medium line-clamp-2 ${isAtual ? 'text-primary' : ''}`}>
                        {aula.tema}
                      </h4>
                    </div>
                    {aula['aula-link'] && (
                      <p className="text-xs text-muted-foreground">
                        {aula['aula-link'].includes('youtube') ? 'Vídeo disponível' : 'Conteúdo disponível'}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          {filteredAulas.length} aula{filteredAulas.length !== 1 ? 's' : ''} {searchTerm && 'encontrada(s)'}
        </p>
      </div>
    </div>
  );
};
