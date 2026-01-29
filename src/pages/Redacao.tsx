import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { 
  PenTool, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  Target,
  ChevronRight,
  Loader2,
  Sparkles,
  GraduationCap
} from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoriaAgrupada {
  categoria: string;
  subcategorias: {
    subcategoria: string | null;
    titulos: Array<{
      id: number;
      titulo: string;
      ordem: number;
    }>;
  }[];
  totalItens: number;
}

// Mapeamento de ícones por categoria (baseado em palavras-chave)
const getIconForCategoria = (categoria: string) => {
  const cat = categoria.toLowerCase();
  if (cat.includes('introdução') || cat.includes('fundamento')) return BookOpen;
  if (cat.includes('estrutura') || cat.includes('formato')) return FileText;
  if (cat.includes('técnica') || cat.includes('estilo')) return Sparkles;
  if (cat.includes('conclusão') || cat.includes('encerramento')) return Target;
  if (cat.includes('dica') || cat.includes('conselho')) return Lightbulb;
  if (cat.includes('exercício') || cat.includes('prática')) return GraduationCap;
  return PenTool;
};

// Cores para as categorias
const categoryColors = [
  { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', iconBg: 'bg-red-500/20' },
  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  { bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/30', text: 'text-pink-400', iconBg: 'bg-pink-500/20' },
];

const Redacao = () => {
  const navigate = useNavigate();

  // Buscar conteúdo agrupado por categoria
  const { data: categorias, isLoading } = useQuery({
    queryKey: ['redacao-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redacao_conteudo')
        .select('id, categoria, subcategoria, titulo, ordem')
        .order('ordem', { ascending: true });

      if (error) throw error;

      // Agrupar por categoria
      const agrupado: Record<string, CategoriaAgrupada> = {};
      
      data?.forEach((item) => {
        if (!agrupado[item.categoria]) {
          agrupado[item.categoria] = {
            categoria: item.categoria,
            subcategorias: [],
            totalItens: 0,
          };
        }
        
        // Encontrar ou criar subcategoria
        let subcatIndex = agrupado[item.categoria].subcategorias.findIndex(
          s => s.subcategoria === item.subcategoria
        );
        
        if (subcatIndex === -1) {
          agrupado[item.categoria].subcategorias.push({
            subcategoria: item.subcategoria,
            titulos: [],
          });
          subcatIndex = agrupado[item.categoria].subcategorias.length - 1;
        }
        
        agrupado[item.categoria].subcategorias[subcatIndex].titulos.push({
          id: item.id,
          titulo: item.titulo,
          ordem: item.ordem,
        });
        
        agrupado[item.categoria].totalItens++;
      });

      return Object.values(agrupado);
    },
  });

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
          {/* Header da página */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl border border-red-500/30 mb-3">
              <PenTool className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Redação</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Domine as técnicas de escrita e conquiste notas máximas
            </p>
          </motion.div>

          {/* Lista de Categorias */}
          {categorias && categorias.length > 0 ? (
            <div className="space-y-4">
              {categorias.map((cat, index) => {
                const color = categoryColors[index % categoryColors.length];
                const Icon = getIconForCategoria(cat.categoria);
                
                return (
                  <motion.div
                    key={cat.categoria}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/redacao/${encodeURIComponent(cat.categoria)}`)}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${color.bg} border ${color.border} cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${color.iconBg}`}>
                        <Icon className={`w-6 h-6 ${color.text}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {cat.categoria}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {cat.totalItens} {cat.totalItens === 1 ? 'tópico' : 'tópicos'} • {cat.subcategorias.length} {cat.subcategorias.length === 1 ? 'seção' : 'seções'}
                        </p>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-neutral-800/50 rounded-full">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Conteúdo em preparação</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O material de redação está sendo processado. Volte em breve!
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Redacao;
