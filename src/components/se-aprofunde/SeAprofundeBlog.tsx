import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Artigo {
  id: string;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  imagem_url: string | null;
  created_at: string;
}

interface SeAprofundeBlogProps {
  instituicao: string;
  config: {
    nome: string;
    sigla: string;
    cor: string;
    corBg: string;
  };
}

const categoriaLabels: Record<string, string> = {
  historia: "História",
  funcionamento: "Funcionamento",
  analise: "Análise",
  personalidade: "Personalidade"
};

const SeAprofundeBlog = ({ instituicao, config }: SeAprofundeBlogProps) => {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtigos();
  }, [instituicao]);

  const fetchArtigos = async () => {
    try {
      const { data, error } = await supabase
        .from("aprofundamento_blog")
        .select("*")
        .eq("instituicao", instituicao)
        .eq("publicado", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtigos(data || []);
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (artigos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className={`w-12 h-12 mx-auto mb-4 ${config.cor} opacity-50`} />
        <p className="text-muted-foreground">
          Nenhuma análise publicada ainda para {config.sigla}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          As análises serão adicionadas em breve
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {artigos.length} {artigos.length === 1 ? "análise disponível" : "análises disponíveis"}
      </p>

      <div className="space-y-3">
        {artigos.map((artigo, index) => (
          <motion.div
            key={artigo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="overflow-hidden cursor-pointer hover:scale-[1.01] transition-all border-border/50 hover:border-primary/30">
              <CardContent className="p-0">
                <div className="flex gap-3 p-4">
                  {/* Imagem */}
                  <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${config.corBg}`}>
                    {artigo.imagem_url ? (
                      <img 
                        src={artigo.imagem_url} 
                        alt={artigo.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className={`w-8 h-8 ${config.cor}`} />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {artigo.categoria && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {categoriaLabels[artigo.categoria] || artigo.categoria}
                      </Badge>
                    )}
                    
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                      {artigo.titulo}
                    </h3>
                    
                    {artigo.resumo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {artigo.resumo}
                      </p>
                    )}
                  </div>

                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SeAprofundeBlog;
