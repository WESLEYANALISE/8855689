import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Download, ExternalLink, Loader2, ArrowLeft, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LivroAnnas {
  titulo: string;
  autor: string;
  editora?: string;
  ano?: string;
  idioma: string;
  formato: string;
  tamanho: string;
  capa?: string;
  descricao?: string;
  link: string;
  md5: string;
}

const BuscarLivros = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [livros, setLivros] = useState<LivroAnnas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [filtroPortugues, setFiltroPortugues] = useState(false);

  const buscar = async () => {
    if (!query.trim() || query.trim().length < 2) {
      toast.error("Digite pelo menos 2 caracteres para buscar");
      return;
    }

    setIsLoading(true);
    setBuscou(true);
    setLivros([]);

    try {
      const { data, error } = await supabase.functions.invoke('buscar-livros-annas-archive', {
        body: { 
          query: query.trim(),
          idioma: filtroPortugues ? 'pt' : undefined,
          limite: 20
        }
      });

      if (error) throw error;

      if (data?.success && data?.livros) {
        setLivros(data.livros);
        if (data.livros.length === 0) {
          toast.info("Nenhum livro encontrado para essa busca");
        } else {
          toast.success(`${data.livros.length} livros encontrados`);
        }
      } else {
        toast.error(data?.error || "Erro ao buscar livros");
      }
    } catch (err) {
      console.error("Erro ao buscar:", err);
      toast.error("Erro ao conectar com o serviço de busca");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  const abrirLivro = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const getIdiomaLabel = (idioma: string) => {
    const idiomas: Record<string, string> = {
      pt: "Português",
      en: "Inglês",
      es: "Espanhol",
      fr: "Francês",
      de: "Alemão",
      it: "Italiano"
    };
    return idiomas[idioma] || idioma.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-500/20 to-background border-b border-border/50">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ferramentas')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Biblioteca Digital</h1>
                <p className="text-sm text-muted-foreground">Busque livros em acervos digitais</p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o título ou autor do livro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-card/80 border-border/50"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={buscar} 
              disabled={isLoading || !query.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Filtro Português */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={filtroPortugues ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroPortugues(!filtroPortugues)}
              className={filtroPortugues ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Apenas Português
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4 pb-24">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Buscando livros...</p>
          </div>
        )}

        {!isLoading && buscou && livros.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum livro encontrado</p>
            <p className="text-sm text-muted-foreground/70">Tente buscar com outros termos</p>
          </div>
        )}

        {!isLoading && livros.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {livros.length} resultado{livros.length !== 1 ? 's' : ''} encontrado{livros.length !== 1 ? 's' : ''}
            </p>
            
            {livros.map((livro, index) => (
              <div
                key={`${livro.md5}-${index}`}
                onClick={() => abrirLivro(livro.link)}
                className="bg-card/90 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.01] transition-all border border-border/30 shadow-lg group"
                style={{
                  opacity: 0,
                  transform: 'translateY(10px)',
                  animation: `fadeSlideUp 0.3s ease-out ${index * 0.05}s forwards`
                }}
              >
                <div className="flex gap-3">
                  {/* Capa */}
                  <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                    {livro.capa ? (
                      <img
                        src={livro.capa}
                        alt={livro.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight mb-1 group-hover:text-amber-400 transition-colors">
                      {livro.titulo}
                    </h3>
                    
                    {livro.autor && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {livro.autor}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {livro.formato}
                      </Badge>
                      {livro.tamanho && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {livro.tamanho}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${
                          livro.idioma === 'pt' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                            : ''
                        }`}
                      >
                        {getIdiomaLabel(livro.idioma)}
                      </Badge>
                      {livro.ano && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {livro.ano}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex items-center">
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!buscou && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="p-4 rounded-full bg-amber-500/10">
              <Search className="w-10 h-10 text-amber-500/50" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Busque por livros</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Digite o título ou autor e clique em buscar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BuscarLivros;
