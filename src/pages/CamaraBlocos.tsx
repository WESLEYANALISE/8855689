import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";

export default function CamaraBlocos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blocos, setBlocos] = useState<any[]>([]);

  useEffect(() => {
    buscarBlocos();
  }, []);

  const buscarBlocos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('buscar-blocos', {
        body: {}
      });

      if (error) throw error;

      setBlocos(data.blocos || []);
    } catch (error) {
      console.error('Erro ao buscar blocos:', error);
      toast.error('Erro ao carregar blocos parlamentares');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <ContentGenerationLoader message="Carregando blocos parlamentares..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <Button
        variant="ghost"
        onClick={() => navigate('/camara-deputados')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="p-6 mb-6 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-rose-500/50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-rose-600 shadow-lg flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Blocos Parlamentares</h1>
            <p className="text-muted-foreground">
              Agrupamentos de partidos políticos na Câmara
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {blocos.length} blocos ativos
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {blocos.map((bloco) => (
          <Card key={bloco.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{bloco.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    ID: {bloco.id}
                  </p>
                  {bloco.idLegislatura && (
                    <Badge variant="outline" className="mb-2">
                      Legislatura {bloco.idLegislatura}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 rounded-full bg-rose-600/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {blocos.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Nenhum bloco parlamentar encontrado
          </p>
        </Card>
      )}
    </div>
  );
}
