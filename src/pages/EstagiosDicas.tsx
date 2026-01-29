import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { EstagioDica } from "@/types/database.types";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EstagiosDicas() {
  const navigate = useNavigate();
  const [dicas, setDicas] = useState<EstagioDica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDicas();
  }, []);

  const fetchDicas = async () => {
    try {
      const { data, error } = await supabase
        .from('estagios_dicas')
        .select('*')
        .order('ordem');

      if (error) throw error;
      setDicas(data || []);
    } catch (error) {
      console.error('Erro ao buscar dicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    { id: "curriculo", label: "📝 Currículo" },
    { id: "entrevista", label: "💬 Entrevista" },
    { id: "networking", label: "🤝 Networking" },
    { id: "primeiros-dias", label: "🚀 Primeiros Dias" },
    { id: "destaque", label: "⭐ Como se Destacar" },
    { id: "equilibrio", label: "⚖️ Equilíbrio" }
  ];

  const dicasPorCategoria = (categoria: string) => 
    dicas.filter(d => d.categoria === categoria);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/estagios')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Dicas para Estágio</h1>
          <p className="text-lg text-muted-foreground">
            Tudo que você precisa saber para conseguir e se destacar no seu estágio
          </p>
        </div>

        <Tabs defaultValue="curriculo" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {categorias.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categorias.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="space-y-6">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))
              ) : (
                dicasPorCategoria(cat.id).map(dica => (
                  <Card key={dica.id} className="p-8">
                    <div className="flex items-start gap-4 mb-4">
                      {dica.icone && <span className="text-4xl">{dica.icone}</span>}
                      <h2 className="text-2xl font-bold flex-1">{dica.titulo}</h2>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{dica.conteudo}</ReactMarkdown>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
