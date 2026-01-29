import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGenericCache } from "@/hooks/useGenericCache";

const topicosConteudo: Record<string, { titulo: string; emoji: string; termoWikipedia: string }> = {
  "deputado": {
    titulo: "O que é um Deputado Federal?",
    emoji: "👔",
    termoWikipedia: "Deputado_federal_(Brasil)"
  },
  "senador": {
    titulo: "O que é um Senador?",
    emoji: "🏛️",
    termoWikipedia: "Senador_(Brasil)"
  },
  "votacao": {
    titulo: "Como funciona uma votação?",
    emoji: "🗳️",
    termoWikipedia: "Votação_no_Congresso_Nacional_do_Brasil"
  },
  "cpi": {
    titulo: "O que é uma CPI?",
    emoji: "🔍",
    termoWikipedia: "Comissão_Parlamentar_de_Inquérito"
  },
  "pec": {
    titulo: "O que é uma PEC?",
    emoji: "📜",
    termoWikipedia: "Proposta_de_emenda_constitucional"
  },
  "projeto-lei": {
    titulo: "Como um projeto vira lei?",
    emoji: "⚖️",
    termoWikipedia: "Processo_legislativo_brasileiro"
  },
  "tres-poderes": {
    titulo: "Quais são os três poderes?",
    emoji: "🏛️",
    termoWikipedia: "Separação_de_poderes_no_Brasil"
  },
  "stf": {
    titulo: "O que é o STF?",
    emoji: "⚖️",
    termoWikipedia: "Supremo_Tribunal_Federal"
  }
};

const PoliticaComoFuncionaView = () => {
  const { topico } = useParams<{ topico: string }>();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(17);

  const topicoInfo = topico ? topicosConteudo[topico] : null;

  const { data: conteudo, isLoading } = useGenericCache<string | null>({
    cacheKey: `politica-como-funciona-${topico}`,
    fetchFn: async () => {
      if (!topicoInfo) return null;
      
      // Verificar cache no banco
      const { data: cached } = await supabase
        .from('BLOGGER_POLITICO' as any)
        .select('conteudo_gerado')
        .eq('categoria', 'como-funciona')
        .eq('termo_wikipedia', topicoInfo.termoWikipedia)
        .single();
      
      if ((cached as any)?.conteudo_gerado) {
        return (cached as any).conteudo_gerado;
      }

      // Gerar via edge function
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-politico', {
        body: { 
          termo: topicoInfo.termoWikipedia,
          titulo: topicoInfo.titulo,
          categoria: 'como-funciona'
        }
      });
      
      if (error) throw error;
      
      return data?.conteudo || null;
    },
    enabled: !!topicoInfo
  });

  const handleShare = async () => {
    if (!topicoInfo) return;
    
    const url = window.location.href;
    const text = `${topicoInfo.titulo} - Direito Premium`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: topicoInfo.titulo, text, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!topicoInfo) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-muted-foreground">Tópico não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-600 shadow-lg flex items-center justify-center">
              <span className="text-2xl">{topicoInfo.emoji}</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{topicoInfo.titulo}</h1>
              <p className="text-sm text-muted-foreground">Educação Política</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </motion.div>

        <Card>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">Carregando conteúdo...</p>
                </div>
              </div>
            ) : conteudo ? (
              <article 
                className="prose prose-sm dark:prose-invert max-w-none"
                style={{ fontSize: `${fontSize}px` }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {conteudo}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Conteúdo não disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Fonte: Wikipedia
        </p>
      </div>

      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg w-10 h-10"
          onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
        >
          A+
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg w-10 h-10"
          onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
        >
          A-
        </Button>
      </div>
    </div>
  );
};

export default PoliticaComoFuncionaView;
