import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { 
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lightbulb,
  BookOpen,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';

interface RedacaoConteudoData {
  id: number;
  categoria: string;
  subcategoria: string | null;
  titulo: string;
  conteudo: string;
  exemplos: string[];
  dicas: string[];
  ordem: number;
  pagina_pdf: number | null;
}

const RedacaoConteudo = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const conteudoId = parseInt(id || '0');

  // Buscar conteúdo específico
  const { data: conteudo, isLoading } = useQuery({
    queryKey: ['redacao-conteudo', conteudoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redacao_conteudo')
        .select('*')
        .eq('id', conteudoId)
        .single();

      if (error) throw error;
      return data as RedacaoConteudoData;
    },
    enabled: conteudoId > 0,
  });

  // Buscar anterior e próximo
  const { data: navegacao } = useQuery({
    queryKey: ['redacao-navegacao', conteudoId],
    queryFn: async () => {
      // Buscar o item atual para pegar a ordem
      const { data: atual } = await supabase
        .from('redacao_conteudo')
        .select('ordem')
        .eq('id', conteudoId)
        .single();

      if (!atual) return { anterior: null, proximo: null };

      // Buscar anterior
      const { data: anterior } = await supabase
        .from('redacao_conteudo')
        .select('id, titulo')
        .lt('ordem', atual.ordem)
        .order('ordem', { ascending: false })
        .limit(1)
        .single();

      // Buscar próximo
      const { data: proximo } = await supabase
        .from('redacao_conteudo')
        .select('id, titulo')
        .gt('ordem', atual.ordem)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      return { anterior, proximo };
    },
    enabled: conteudoId > 0,
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

  if (!conteudo) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Conteúdo não encontrado</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse exemplos e dicas (pode vir como string ou array)
  const exemplos = Array.isArray(conteudo.exemplos) 
    ? conteudo.exemplos 
    : typeof conteudo.exemplos === 'string' 
      ? JSON.parse(conteudo.exemplos || '[]') 
      : [];
      
  const dicas = Array.isArray(conteudo.dicas) 
    ? conteudo.dicas 
    : typeof conteudo.dicas === 'string' 
      ? JSON.parse(conteudo.dicas || '[]') 
      : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6 pb-32">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap"
          >
            <span 
              onClick={() => navigate('/redacao')}
              className="cursor-pointer hover:text-foreground"
            >
              Redação
            </span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span 
              onClick={() => navigate(`/redacao/${encodeURIComponent(conteudo.categoria)}`)}
              className="cursor-pointer hover:text-foreground truncate"
            >
              {conteudo.categoria}
            </span>
            {conteudo.subcategoria && (
              <>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{conteudo.subcategoria}</span>
              </>
            )}
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-foreground">{conteudo.titulo}</h1>
            {conteudo.subcategoria && (
              <p className="text-sm text-muted-foreground mt-1">{conteudo.subcategoria}</p>
            )}
          </motion.div>

          {/* Conteúdo Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium text-foreground mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
                li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-red-400">{children}</strong>,
                em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-red-500/50 pl-4 py-1 my-3 bg-red-500/5 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {conteudo.conteudo}
            </ReactMarkdown>
          </motion.div>

          {/* Exemplos */}
          {exemplos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-foreground">Exemplos Práticos</h2>
              </div>
              <div className="space-y-3">
                {exemplos.map((exemplo: string, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-foreground/90 text-sm leading-relaxed">{exemplo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dicas */}
          {dicas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-foreground">Dicas de Aplicação</h2>
              </div>
              <div className="space-y-3">
                {dicas.map((dica: string, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-emerald-400">{index + 1}</span>
                      </div>
                      <p className="text-foreground/90 text-sm leading-relaxed">{dica}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Navegação Anterior/Próximo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12"
            disabled={!navegacao?.anterior}
            onClick={() => navegacao?.anterior && navigate(`/redacao/conteudo/${navegacao.anterior.id}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            className="flex-1 h-12 bg-red-600 hover:bg-red-700"
            disabled={!navegacao?.proximo}
            onClick={() => navegacao?.proximo && navigate(`/redacao/conteudo/${navegacao.proximo.id}`)}
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RedacaoConteudo;
