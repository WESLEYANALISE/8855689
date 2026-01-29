import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Newspaper, Loader2, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Noticia {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  fonte: string | null;
  imagem_url: string | null;
  data_publicacao: string | null;
}

interface SeAprofundeNoticiasProps {
  instituicao: string;
  config: {
    nome: string;
    sigla: string;
    cor: string;
    corBg: string;
  };
}

// Palavras-chave para filtrar notícias por instituição
const palavrasChavePorInstituicao: Record<string, string[]> = {
  stf: ['STF', 'Supremo Tribunal Federal', 'ministro do supremo', 'suprema corte', 'Barroso', 'Moraes', 'Toffoli', 'Fux', 'Weber', 'Mendes', 'Dino', 'Zanin', 'Nunes Marques'],
  stj: ['STJ', 'Superior Tribunal de Justiça', 'tribunal superior'],
  camara: ['Câmara dos Deputados', 'câmara', 'deputado', 'deputada', 'deputados', 'Arthur Lira', 'Hugo Motta'],
  senado: ['Senado', 'senador', 'senadora', 'senadores', 'Rodrigo Pacheco', 'Davi Alcolumbre'],
  presidencia: ['Planalto', 'presidente Lula', 'governo federal', 'presidência', 'presidente da república', 'Lula']
};

const SeAprofundeNoticias = ({ instituicao, config }: SeAprofundeNoticiasProps) => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNoticias();
  }, [instituicao]);

  const fetchNoticias = async () => {
    try {
      setLoading(true);
      const palavrasChave = palavrasChavePorInstituicao[instituicao] || [];
      
      // Primeiro tenta buscar da tabela aprofundamento_noticias
      const { data: noticiasAprofundamento, error: errorAprofundamento } = await supabase
        .from("aprofundamento_noticias")
        .select("*")
        .eq("instituicao", instituicao)
        .order("data_publicacao", { ascending: false })
        .limit(20);

      if (!errorAprofundamento && noticiasAprofundamento && noticiasAprofundamento.length > 0) {
        setNoticias(noticiasAprofundamento.map(n => ({
          id: n.id,
          titulo: n.titulo,
          descricao: n.descricao,
          url: n.url,
          fonte: n.fonte,
          imagem_url: n.imagem_webp || n.imagem_url,
          data_publicacao: n.data_publicacao
        })));
        setLoading(false);
        return;
      }

      // Se não houver notícias específicas, buscar das tabelas de cache e filtrar
      const noticiasEncontradas: Noticia[] = [];

      // Buscar de noticias_juridicas_cache (para STF, STJ)
      if (['stf', 'stj'].includes(instituicao)) {
        const { data: noticiasJuridicas } = await supabase
          .from("noticias_juridicas_cache")
          .select("*")
          .order("data_publicacao", { ascending: false })
          .limit(100);

        if (noticiasJuridicas) {
          const filtradas = noticiasJuridicas.filter(n => 
            palavrasChave.some(p => 
              n.titulo?.toLowerCase().includes(p.toLowerCase()) ||
              n.descricao?.toLowerCase().includes(p.toLowerCase())
            )
          );

          noticiasEncontradas.push(...filtradas.map(n => ({
            id: n.id,
            titulo: n.titulo,
            descricao: n.descricao,
            url: n.link,
            fonte: n.fonte,
            imagem_url: n.imagem_webp || n.imagem,
            data_publicacao: n.data_publicacao
          })));
        }
      }

      // Buscar de noticias_politicas_cache (para Câmara, Senado, Presidência)
      if (['camara', 'senado', 'presidencia'].includes(instituicao)) {
        const { data: noticiasPoliticas } = await supabase
          .from("noticias_politicas_cache")
          .select("*")
          .order("data_publicacao", { ascending: false })
          .limit(100);

        if (noticiasPoliticas) {
          const filtradas = noticiasPoliticas.filter(n => 
            palavrasChave.some(p => 
              n.titulo?.toLowerCase().includes(p.toLowerCase()) ||
              n.descricao?.toLowerCase().includes(p.toLowerCase())
            )
          );

          noticiasEncontradas.push(...filtradas.map(n => ({
            id: n.id?.toString(),
            titulo: n.titulo,
            descricao: n.descricao,
            url: n.url,
            fonte: n.fonte,
            imagem_url: n.imagem_url_webp || n.imagem_url,
            data_publicacao: n.data_publicacao
          })));
        }
      }

      // Ordenar por data e limitar
      noticiasEncontradas.sort((a, b) => {
        const dateA = new Date(a.data_publicacao || 0);
        const dateB = new Date(b.data_publicacao || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setNoticias(noticiasEncontradas.slice(0, 20));
    } catch (error) {
      console.error("Erro ao buscar notícias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticiaClick = (noticia: Noticia) => {
    navigate(`/se-aprofunde/${instituicao}/noticia/${noticia.id}`, {
      state: { noticia }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="text-center py-12">
        <Newspaper className={`w-12 h-12 mx-auto mb-4 ${config.cor} opacity-50`} />
        <p className="text-muted-foreground">
          Nenhuma notícia encontrada para {config.sigla}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          As notícias serão atualizadas em breve
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {noticias.length} {noticias.length === 1 ? "notícia" : "notícias"} recentes
      </p>

      <div className="space-y-3">
        {noticias.map((noticia, index) => (
          <motion.div
            key={noticia.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover:scale-[1.01] transition-all border-border/50 hover:border-primary/30"
              onClick={() => handleNoticiaClick(noticia)}
            >
              <CardContent className="p-0">
                <div className="flex gap-3 p-4">
                  {/* Imagem */}
                  {noticia.imagem_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={noticia.imagem_url} 
                        alt={noticia.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    
                    {noticia.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {noticia.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {noticia.fonte && (
                        <span className={`text-xs ${config.cor} font-medium`}>
                          {noticia.fonte}
                        </span>
                      )}
                      {noticia.data_publicacao && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(noticia.data_publicacao)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SeAprofundeNoticias;
