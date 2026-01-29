import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/posts-juridicos/PostCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PostsJuridicos = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLei, setFiltroLei] = useState<string>("todos");

  useEffect(() => {
    carregarPosts();
  }, []);

  const carregarPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts_juridicos")
        .select("*")
        .eq("status", "publicado")
        .order("data_publicacao", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Atualizar curtidas no banco
    try {
      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase
          .from("posts_juridicos")
          .update({ curtidas: (post.curtidas || 0) + 1 })
          .eq("id", postId);
      }
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const filtros = [
    { value: "todos", label: "Todos" },
    { value: "penal", label: "Penal" },
    { value: "civil", label: "Civil" },
    { value: "constitucional", label: "Constitucional" },
    { value: "trabalho", label: "Trabalho" },
  ];

  const postsFiltrados = filtroLei === "todos" 
    ? posts 
    : posts.filter(post => {
        const lei = post.lei_tabela?.toLowerCase() || "";
        if (filtroLei === "penal") return lei.includes("penal");
        if (filtroLei === "civil") return lei.includes("civil");
        if (filtroLei === "constitucional") return lei.includes("constituição");
        if (filtroLei === "trabalho") return lei.includes("clt") || lei.includes("trabalho");
        return true;
      });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Posts Jurídicos</h1>
              <p className="text-xs text-muted-foreground">Aprenda direito no estilo Instagram</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={carregarPosts}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filtros */}
        <div className="px-4 pb-3">
          <Tabs value={filtroLei} onValueChange={setFiltroLei}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {filtros.map(filtro => (
                <TabsTrigger key={filtro.value} value={filtro.value} className="text-xs">
                  {filtro.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto py-4 space-y-6 px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Carregando posts...</p>
            </div>
          ) : postsFiltrados.length > 0 ? (
            postsFiltrados.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-6xl">📭</div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum post ainda</h3>
              <p className="text-sm text-muted-foreground text-center">
                Os posts jurídicos aparecerão aqui assim que forem publicados.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PostsJuridicos;
