import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface NoticiaConteudoProps {
  url: string;
  titulo: string;
}

export const NoticiaConteudo = ({ url, titulo }: NoticiaConteudoProps) => {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const buscarConteudo = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('buscar-conteudo-noticia', {
          body: { url }
        });

        if (error) throw error;

        if (data?.success && data?.html) {
          setHtml(data.html);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao buscar conteúdo:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    buscarConteudo();
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Carregando conteúdo...</p>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Não foi possível carregar o conteúdo dentro do app.
        </p>
        <Button
          onClick={() => window.open(url, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir no Navegador
        </Button>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none p-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
