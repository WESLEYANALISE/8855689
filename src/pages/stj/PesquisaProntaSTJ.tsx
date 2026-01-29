import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Scale, 
  BookOpen,
  Filter,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface PesquisaPronta {
  id: string;
  ramo_direito: string;
  titulo_secao: string;
  tema: string;
  link_pesquisa: string | null;
  created_at: string;
  updated_at: string;
}

export default function PesquisaProntaSTJ() {
  const [busca, setBusca] = useState("");
  const [ramoFiltro, setRamoFiltro] = useState<string>("todos");
  const queryClient = useQueryClient();

  // Buscar pesquisas prontas
  const { data: pesquisas, isLoading, error } = useQuery({
    queryKey: ["stj-pesquisa-pronta", busca, ramoFiltro],
    queryFn: async () => {
      let query = supabase
        .from("stj_pesquisa_pronta")
        .select("*")
        .order("ramo_direito")
        .order("titulo_secao")
        .order("tema");

      if (ramoFiltro && ramoFiltro !== "todos") {
        query = query.eq("ramo_direito", ramoFiltro);
      }

      if (busca.trim()) {
        query = query.or(`tema.ilike.%${busca}%,titulo_secao.ilike.%${busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PesquisaPronta[];
    },
  });

  // Buscar ramos únicos para o filtro
  const { data: ramos } = useQuery({
    queryKey: ["stj-pesquisa-pronta-ramos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stj_pesquisa_pronta")
        .select("ramo_direito")
        .order("ramo_direito");
      
      if (error) throw error;
      const ramosUnicos = [...new Set(data.map(r => r.ramo_direito))];
      return ramosUnicos;
    },
  });

  // Mutation para sincronizar
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("raspar-stj-pesquisa-pronta");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Sincronizado: ${data.inseridas} pesquisas atualizadas`);
        queryClient.invalidateQueries({ queryKey: ["stj-pesquisa-pronta"] });
        queryClient.invalidateQueries({ queryKey: ["stj-pesquisa-pronta-ramos"] });
      } else {
        toast.error(data.error || "Erro ao sincronizar");
      }
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  // Agrupar por ramo e título
  const agrupado = pesquisas?.reduce((acc, item) => {
    if (!acc[item.ramo_direito]) {
      acc[item.ramo_direito] = {};
    }
    if (!acc[item.ramo_direito][item.titulo_secao]) {
      acc[item.ramo_direito][item.titulo_secao] = [];
    }
    acc[item.ramo_direito][item.titulo_secao].push(item);
    return acc;
  }, {} as Record<string, Record<string, PesquisaPronta[]>>);

  const totalPesquisas = pesquisas?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/80 to-green-700/80 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Pesquisa Pronta - STJ</h1>
          </div>
          <p className="text-green-100 text-sm">
            Pesquisas de jurisprudência pré-configuradas organizadas por tema
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Controles */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tema..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por ramo */}
            <div className="w-full md:w-64">
              <Select value={ramoFiltro} onValueChange={setRamoFiltro}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por ramo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os ramos</SelectItem>
                  {ramos?.map((ramo) => (
                    <SelectItem key={ramo} value={ramo}>
                      {ramo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sincronizar */}
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="outline"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {totalPesquisas} pesquisas
            </span>
            {ramos && (
              <span>{ramos.length} ramos do direito</span>
            )}
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 text-center text-destructive">
            Erro ao carregar pesquisas: {(error as Error).message}
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && pesquisas?.length === 0 && (
          <Card className="p-8 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma pesquisa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {busca ? "Tente outro termo de busca" : "Clique em Sincronizar para importar as pesquisas do STJ"}
            </p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar agora
            </Button>
          </Card>
        )}

        {/* Lista agrupada */}
        {agrupado && Object.keys(agrupado).length > 0 && (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(agrupado).map(([ramo, secoes]) => (
                <AccordionItem key={ramo} value={ramo} className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Scale className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{ramo}</span>
                      <Badge variant="secondary" className="ml-2">
                        {Object.values(secoes).flat().length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(secoes).map(([secao, temas]) => (
                        <AccordionItem key={secao} value={secao} className="border rounded-md">
                          <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span>{secao}</span>
                              <Badge variant="outline" className="ml-2">
                                {temas.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <ul className="space-y-2">
                              {temas.map((tema) => (
                                <li
                                  key={tema.id}
                                  className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                >
                                  <span className="text-sm flex-1">{tema.tema}</span>
                                  {tema.link_pesquisa && (
                                    <a
                                      href={tema.link_pesquisa}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80 transition-colors"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
