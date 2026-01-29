import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortArticles } from "@/lib/articleSorter";

const EleicoesLegislacao = () => {
  const [busca, setBusca] = useState("");
  const [artigos, setArtigos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    carregarCodigoEleitoral();
  }, []);

  const carregarCodigoEleitoral = async () => {
    try {
      const { data, error } = await supabase
        .from("CE – Código Eleitoral")
        .select("*")
        .order("id");

      if (error) throw error;

      setArtigos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({
        title: "Erro ao carregar legislação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const artigosFiltrados = artigos.filter(artigo => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      artigo["Número do Artigo"]?.toLowerCase().includes(termo) ||
      artigo.Artigo?.toLowerCase().includes(termo) ||
      artigo.Narração?.toLowerCase().includes(termo)
    );
  });

  const recursos = [
    {
      titulo: "Portal TSE",
      descricao: "Acesse o portal oficial do Tribunal Superior Eleitoral",
      url: "https://www.tse.jus.br/",
    },
    {
      titulo: "Legislação Completa",
      descricao: "Todas as leis, resoluções e normas eleitorais",
      url: "https://www.tse.jus.br/legislacao",
    },
    {
      titulo: "Jurisprudência Eleitoral",
      descricao: "Consulte súmulas e decisões do TSE",
      url: "https://www.tse.jus.br/jurisprudencia",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Legislação Eleitoral</h1>
        <p className="text-sm text-muted-foreground">
          Acesso ao Código Eleitoral, súmulas e jurisprudência
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Recursos Oficiais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recursos.map((recurso, index) => (
              <a
                key={index}
                href={recurso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
              >
                <div>
                  <p className="font-bold">{recurso.titulo}</p>
                  <p className="text-sm text-muted-foreground">{recurso.descricao}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-accent" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Código Eleitoral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando artigos...</p>
            ) : artigosFiltrados.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum artigo encontrado</p>
            ) : (
              artigosFiltrados.map((artigo) => (
                <div key={artigo.id} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-accent">
                      Artigo {artigo["Número do Artigo"]}
                    </h3>
                  </div>
                  {artigo.Artigo && (
                    <p className="text-sm font-medium">{artigo.Artigo}</p>
                  )}
                  {artigo.Narração && (
                    <p className="text-sm text-muted-foreground">{artigo.Narração}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EleicoesLegislacao;
