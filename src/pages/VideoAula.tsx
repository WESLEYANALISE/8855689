import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Aula": string | null;
}

const VideoAula = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("id");
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("CP - Código Penal")
        .select("*")
        .eq("id", parseInt(articleId))
        .single();

      if (error) {
        console.error("Erro ao buscar artigo:", error);
      } else {
        setArticle(data);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Artigo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-4 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold">
            Art. {article["Número do Artigo"]} - Aula
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 max-w-6xl mx-auto py-8">
        {/* Video Player */}
        {article["Aula"] && (
          <div className="mb-8 rounded-2xl overflow-hidden bg-card border border-border">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={article["Aula"]}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-article-highlight font-bold text-xl md:text-2xl mb-4">
            Art. {article["Número do Artigo"]}
          </h2>
          <div className="text-foreground/90 whitespace-pre-line leading-relaxed">
            {article["Artigo"] || "Conteúdo não disponível"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAula;
