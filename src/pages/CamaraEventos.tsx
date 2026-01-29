import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { EventoCard } from "@/components/EventoCard";

const CamaraEventos = () => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);
  const { toast } = useToast();

  const handleBuscar = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Preencha as datas",
        description: "Informe o período de busca",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-eventos",
        { body: { dataInicio, dataFim } }
      );

      if (error) throw error;
      setEventos(data.eventos || []);
      
      if (data.eventos?.length === 0) {
        toast({
          title: "Nenhum evento encontrado",
          description: "Tente outro período",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Eventos</h1>
        <p className="text-sm text-muted-foreground">Agenda de sessões e reuniões</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleBuscar} className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Eventos
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando eventos..." />}

      {eventos.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{eventos.length} evento(s) encontrado(s)</p>
          {eventos.map((evento) => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraEventos;