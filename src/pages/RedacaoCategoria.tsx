import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { 
  FileText, 
  ChevronRight,
  Loader2,
  BookOpen,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SubcategoriaAgrupada {
  subcategoria: string | null;
  titulos: Array<{
    id: number;
    titulo: string;
    ordem: number;
  }>;
}

const RedacaoCategoria = () => {
  const navigate = useNavigate();
  const { categoria } = useParams<{ categoria: string }>();
  const categoriaDecodificada = decodeURIComponent(categoria || '');

  // Buscar subcategorias e títulos desta categoria
  const { data: subcategorias, isLoading } = useQuery({
    queryKey: ['redacao-categoria', categoriaDecodificada],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redacao_conteudo')
        .select('id, subcategoria, titulo, ordem')
        .eq('categoria', categoriaDecodificada)
        .order('ordem', { ascending: true });

      if (error) throw error;

      // Agrupar por subcategoria
      const agrupado: Record<string, SubcategoriaAgrupada> = {};
      
      data?.forEach((item) => {
        const key = item.subcategoria || '_root';
        
        if (!agrupado[key]) {
          agrupado[key] = {
            subcategoria: item.subcategoria,
            titulos: [],
          };
        }
        
        agrupado[key].titulos.push({
          id: item.id,
          titulo: item.titulo,
          ordem: item.ordem,
        });
      });

      return Object.values(agrupado);
    },
    enabled: !!categoriaDecodificada,
  });

  const handleClickTitulo = (id: number) => {
    navigate(`/redacao/conteudo/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <Header />
      
      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6">
          {/* Header da categoria */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Redação</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate">{categoriaDecodificada}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{categoriaDecodificada}</h1>
            <p className="text-sm text-muted-foreground">
              {subcategorias?.reduce((acc, s) => acc + s.titulos.length, 0) || 0} tópicos disponíveis
            </p>
          </motion.div>

          {/* Lista de Subcategorias e Títulos */}
          {subcategorias && subcategorias.length > 0 ? (
            <div className="space-y-6">
              {subcategorias.map((subcat, subIndex) => (
                <motion.div
                  key={subcat.subcategoria || '_root'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: subIndex * 0.1 }}
                  className="space-y-3"
                >
                  {/* Título da subcategoria */}
                  {subcat.subcategoria && (
                    <div className="flex items-center gap-2 px-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h2 className="font-semibold text-foreground">{subcat.subcategoria}</h2>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {subcat.titulos.length}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Lista de títulos */}
                  <div className="space-y-2">
                    {subcat.titulos.map((titulo, index) => (
                      <motion.div
                        key={titulo.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (subIndex * subcat.titulos.length + index) * 0.03 }}
                        onClick={() => handleClickTitulo(titulo.id)}
                        className="p-4 rounded-xl bg-neutral-900/50 border border-white/5 cursor-pointer hover:bg-neutral-800/50 hover:border-red-500/30 transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <FileText className="w-5 h-5 text-red-400" />
                          </div>
                          <span className="flex-1 text-foreground font-medium">
                            {titulo.titulo}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-neutral-800/50 rounded-full">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Nenhum conteúdo encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta categoria ainda não possui conteúdo disponível.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RedacaoCategoria;
