import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Film, Search, Calendar, RefreshCw, FileText, Play, 
  Settings2, ArrowLeft, Flame, Heart, Users, ImagePlus, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CapaDocumentario from "@/components/documentarios/CapaDocumentario";
import { preloadCapas, invalidateCapaCache } from "@/hooks/useCapaDocumentario";
import { useInstantCache } from "@/hooks/useInstantCache";

// Preload da imagem de fundo
import heroBlogJuridico from "@/assets/hero-blog-juridico.webp";
const preloadedImage = new Image();
preloadedImage.src = heroBlogJuridico;

interface Documentario {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  capa_webp: string | null;
  duracao: string | null;
  publicado_em: string | null;
  canal_nome: string | null;
  transcricao: any;
  transcricao_texto: string | null;
  visualizacoes: number;
  categoria: string | null;
}

const DocumentariosJuridicos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncingIC, setIsSyncingIC] = useState(false);
  const [generatingCapaId, setGeneratingCapaId] = useState<string | null>(null);
  
  // Verificar se veio com aba específica (ex: da página Tela)
  const abaFromUrl = searchParams.get("aba");
  const isDirectCategory = !!abaFromUrl && ["destaques", "familiares", "passionais"].includes(abaFromUrl);
  const [abaAtiva, setAbaAtiva] = useState(abaFromUrl || "destaques");

  // Carregamento instantâneo com cache IndexedDB
  const {
    data: documentariosData,
    isLoading,
    isFetching: isLoadingMore,
    refresh: refetch
  } = useInstantCache<Documentario[]>({
    cacheKey: "documentarios-juridicos",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentarios_juridicos")
        .select("*")
        .order("publicado_em", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    imageExtractor: (docs) => docs
      .map(d => d.capa_webp || d.thumbnail)
      .filter(Boolean) as string[]
  });

  const documentarios = documentariosData || [];
  const totalLoaded = documentarios.length;

  // Pré-carregar capas em background quando documentários carregarem
  useEffect(() => {
    if (documentarios.length > 0) {
      preloadCapas(documentarios.map(d => ({
        id: d.id,
        capa_webp: d.capa_webp,
        thumbnail: d.thumbnail
      })));
    }
  }, [documentarios]);

  // Filtrar por categoria
  const docsPorCategoria = useMemo(() => {
    const destaques = documentarios.filter(d => d.categoria === 'destaque' || !d.categoria);
    const familiares = documentarios.filter(d => d.categoria === 'familiares');
    const passionais = documentarios.filter(d => d.categoria === 'passionais');
    return { destaques, familiares, passionais };
  }, [documentarios]);

  // Filtrar por busca na aba atual
  const docsAbaAtual = useMemo(() => {
    let docs: Documentario[] = [];
    if (abaAtiva === 'destaques') docs = docsPorCategoria.destaques;
    else if (abaAtiva === 'familiares') docs = docsPorCategoria.familiares;
    else if (abaAtiva === 'passionais') docs = docsPorCategoria.passionais;
    
    if (!searchTerm.trim()) return docs;
    
    const term = searchTerm.toLowerCase();
    return docs.filter(
      doc =>
        doc.titulo?.toLowerCase().includes(term) ||
        doc.descricao?.toLowerCase().includes(term)
    );
  }, [docsPorCategoria, abaAtiva, searchTerm]);

  // Gerar capa para um documentário
  const handleGerarCapa = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setGeneratingCapaId(docId);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capa-documentario", {
        body: { documentarioId: docId }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Invalidar cache local da capa antiga
      await invalidateCapaCache(docId);
      
      // Atualizar o cache do React Query diretamente
      if (data.capa_webp) {
        queryClient.setQueryData(["documentarios-juridicos"], (old: Documentario[] | undefined) => {
          if (!old) return old;
          return old.map(doc => 
            doc.id === docId 
              ? { ...doc, capa_webp: data.capa_webp, thumbnail: data.capa_webp }
              : doc
          );
        });
      }
      
      toast.success("Capa gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar capa:", error);
      toast.error("Erro ao gerar capa");
    } finally {
      setGeneratingCapaId(null);
    }
  };

  const handleSyncIC = async (categoria?: string) => {
    setIsSyncingIC(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-videos-ic", {
        body: categoria ? { categoria } : {}
      });
      if (error) throw error;
      toast.success(
        `Sincronização IC concluída! ${data.novos_inseridos} novos vídeos inseridos`
      );
      refetch();
    } catch (error) {
      console.error("Erro na sincronização IC:", error);
      toast.error("Erro ao sincronizar vídeos do IC");
    } finally {
      setIsSyncingIC(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Limpa o título removendo "Audiodescrição | 🎥 Documentário -" e similares
  const formatTitulo = (titulo: string) => {
    // Remove prefixos como "Audiodescrição | 🎥 Documentário - " ou "Audiodescrição | 🎥 Documentário – "
    const cleaned = titulo
      .replace(/^Audiodescrição\s*\|\s*🎥?\s*Documentário\s*[-–]\s*/i, '')
      .replace(/^🎥?\s*Documentário\s*[-–]\s*/i, '')
      .trim();
    return cleaned || titulo;
  };

  const hasTranscript = (doc: Documentario) => {
    return doc.transcricao && Array.isArray(doc.transcricao) && doc.transcricao.length > 0;
  };

  const totalGeral = totalLoaded;

  // Renderizar card de documentário
  const renderDocCard = (doc: Documentario, index: number, showGerarCapa: boolean = true) => (
    <button
      key={doc.id}
      onClick={() => navigate(`/ferramentas/documentarios-juridicos/${doc.id}`)}
      className="w-full flex gap-4 p-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl hover:bg-card hover:border-primary/30 transition-colors text-left group"
    >
      <div className="relative w-32 sm:w-40 h-20 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden">
        {/* Se não tem capa E está em destaques, mostra botão para gerar */}
        {!doc.capa_webp && showGerarCapa ? (
          <button
            onClick={(e) => handleGerarCapa(e, doc.id)}
            disabled={generatingCapaId === doc.id}
            className="w-full h-full bg-muted/50 border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            {generatingCapaId === doc.id ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Gerar Capa</span>
              </>
            )}
          </button>
        ) : (
          <>
            <CapaDocumentario
              id={doc.id}
              capaWebp={showGerarCapa ? doc.capa_webp : null}
              thumbnail={doc.thumbnail}
              titulo={doc.titulo}
              className="w-full h-full"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
              </div>
            </div>
          </>
        )}
        {doc.duracao && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
            {doc.duracao}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 py-1">
        <h3 className="font-medium text-foreground text-sm sm:text-base group-hover:text-primary transition-colors leading-tight">
          {formatTitulo(doc.titulo)}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          {doc.publicado_em && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(doc.publicado_em)}
            </span>
          )}
        </div>
        {hasTranscript(doc) && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
            <FileText className="h-3 w-3" />
            Transcrição
          </span>
        )}
      </div>
    </button>
  );

  // Renderizar lista de documentários
  const renderDocsList = (docs: Documentario[], emptyMessage: string, showGerarCapa: boolean = true) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-3">
              <div className="w-32 sm:w-40 h-20 sm:h-24 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (docs.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
          {(abaAtiva === 'familiares' || abaAtiva === 'passionais') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncIC(abaAtiva)}
              disabled={isSyncingIC}
              className="mt-4 gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingIC ? "animate-spin" : ""}`} />
              {isSyncingIC ? "Sincronizando..." : "Buscar Vídeos"}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {docs.map((doc, index) => renderDocCard(doc, index, showGerarCapa))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background FIXO com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroBlogJuridico}
          alt="Documentário Jurídico"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.7) 0%,
              hsl(var(--background) / 0.75) 30%,
              hsl(var(--background) / 0.8) 60%,
              hsl(var(--background) / 0.9) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col pb-24">
        {/* Header sticky com blur */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => isDirectCategory ? navigate('/videoaulas') : navigate('/?tab=iniciante')}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-600/10">
                  <Film className="w-5 h-5 text-red-400" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isDirectCategory 
                    ? abaAtiva === 'destaques' ? 'Destaques' 
                    : abaAtiva === 'familiares' ? 'Crimes Familiares' 
                    : 'Crimes Passionais'
                    : 'Documentário Jurídico'
                  }
                </h1>
              </div>
            </div>
            
            {!isDirectCategory && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/ferramentas/ajuste-documentarios")}
                  className="h-9 w-9"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm ml-11">
            <span className="text-red-400 font-semibold">{docsAbaAtual.length.toLocaleString('pt-BR')}</span> documentários
            {isLoadingMore && <span className="ml-2 text-xs text-muted-foreground">(carregando mais...)</span>}
          </p>
        </div>

        {/* Sistema de Tabs - só mostra se não veio de categoria direta */}
        <div className="px-4 pt-4">
          {isDirectCategory ? (
            // Modo direto: só lista sem tabs
            <>
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentário..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/80 backdrop-blur-sm border-border/50"
                />
              </div>

              {/* Botão de sync se necessário */}
              {(abaAtiva === 'familiares' || abaAtiva === 'passionais') && !isLoading && docsAbaAtual.length === 0 && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncIC(abaAtiva)}
                    disabled={isSyncingIC}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingIC ? "animate-spin" : ""}`} />
                    {isSyncingIC ? "Sincronizando..." : "Buscar Vídeos"}
                  </Button>
                </div>
              )}

              {/* Lista direta */}
              <div className="mt-4">
                {renderDocsList(
                  docsAbaAtual, 
                  abaAtiva === 'destaques' 
                    ? "Nenhum documentário em destaque disponível."
                    : abaAtiva === 'familiares'
                    ? "Nenhum documentário de crimes familiares."
                    : "Nenhum documentário de crimes passionais.",
                  abaAtiva === 'destaques'
                )}
              </div>
            </>
          ) : (
            // Modo com tabs
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
                <TabsTrigger 
                  value="destaques" 
                  className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  <Flame className="w-4 h-4" />
                  <span>Destaques</span>
                  <span className="hidden sm:inline text-xs opacity-70">({docsPorCategoria.destaques.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="familiares" 
                  className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4" />
                  <span>Familiares</span>
                  <span className="hidden sm:inline text-xs opacity-70">({docsPorCategoria.familiares.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="passionais" 
                  className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
                >
                  <Heart className="w-4 h-4" />
                  <span>Passionais</span>
                  <span className="hidden sm:inline text-xs opacity-70">({docsPorCategoria.passionais.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Busca */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentário..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/80 backdrop-blur-sm border-border/50"
                />
              </div>

              {/* Botões de sync por aba - apenas para familiares/passionais */}
              {(abaAtiva === 'familiares' || abaAtiva === 'passionais') && (
                <div className="flex justify-end mt-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncIC(abaAtiva)}
                    disabled={isSyncingIC}
                    className="gap-2 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingIC ? "animate-spin" : ""}`} />
                    {isSyncingIC ? "Sincronizando..." : "Sync IC Criminal"}
                  </Button>
                </div>
              )}

              {/* Conteúdo das Tabs */}
              <div className="mt-4">
                <TabsContent value="destaques" className="mt-0">
                  {renderDocsList(
                    docsAbaAtual, 
                    "Nenhum documentário disponível. Clique em Sync TV Justiça para buscar.",
                    true
                  )}
                </TabsContent>
                
                <TabsContent value="familiares" className="mt-0">
                  {renderDocsList(
                    docsAbaAtual,
                    "Nenhum documentário de crimes familiares. Clique em buscar vídeos para sincronizar.",
                    false
                  )}
                </TabsContent>
                
                <TabsContent value="passionais" className="mt-0">
                  {renderDocsList(
                    docsAbaAtual,
                    "Nenhum documentário de crimes passionais. Clique em buscar vídeos para sincronizar.",
                    false
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentariosJuridicos;
