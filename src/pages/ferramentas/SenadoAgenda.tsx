import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AgendaSenadoItem } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Calendar, ArrowLeft, Building2, Landmark } from "lucide-react";
import { toast } from "sonner";

const SenadoAgenda = () => {
  const navigate = useNavigate();
  const [agendaPlenario, setAgendaPlenario] = useState<any[]>([]);
  const [agendaComissoes, setAgendaComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataConsulta, setDataConsulta] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchAgenda();
  }, [dataConsulta]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const [plenarioRes, comissoesRes] = await Promise.all([
        supabase.functions.invoke('agenda-plenario-senado', { body: { data: dataConsulta } }),
        supabase.functions.invoke('agenda-comissoes-senado', { body: { data: dataConsulta } }),
      ]);

      if (plenarioRes.error) throw plenarioRes.error;
      if (comissoesRes.error) throw comissoesRes.error;

      setAgendaPlenario(plenarioRes.data?.agenda || []);
      setAgendaComissoes(comissoesRes.data?.reunioes || []);
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ferramentas/senado')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-orange-500/20 rounded-xl p-2">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Agenda</h1>
            <p className="text-xs text-muted-foreground">
              Plenário e Comissões
            </p>
          </div>
        </div>

        {/* Seletor de data */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={dataConsulta}
            onChange={(e) => setDataConsulta(e.target.value)}
            className="w-auto"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="plenario">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plenario" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Plenário ({agendaPlenario.length})
            </TabsTrigger>
            <TabsTrigger value="comissoes" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Comissões ({agendaComissoes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plenario" className="mt-4">
            {loading ? (
              <SkeletonList count={3} />
            ) : agendaPlenario.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma sessão plenária agendada
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaPlenario.map((item, index) => (
                  <AgendaSenadoItem key={item.codigoSessao || index} item={item} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comissoes" className="mt-4">
            {loading ? (
              <SkeletonList count={5} />
            ) : agendaComissoes.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma reunião de comissão agendada
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaComissoes.map((item, index) => (
                  <AgendaSenadoItem key={item.codigo || index} item={item} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SenadoAgenda;
