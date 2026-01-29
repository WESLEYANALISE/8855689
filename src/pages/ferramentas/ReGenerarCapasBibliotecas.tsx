import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, RefreshCw, Check, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
  id: number;
}

const BIBLIOTECAS = [
  { nome: "Biblioteca de Estudos", cor: "#10b981" },
  { nome: "Biblioteca Clássicos", cor: "#f59e0b" },
  { nome: "Biblioteca da OAB", cor: "#3b82f6" },
  { nome: "Biblioteca de Oratória", cor: "#a855f7" },
  { nome: "Biblioteca de Liderança", cor: "#6366f1" },
  { nome: "Biblioteca Fora da Toga", cor: "#ec4899" },
];

const ReGenerarCapasBibliotecas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gerando, setGerando] = useState<string | null>(null);
  const [gerandoTodas, setGerandoTodas] = useState(false);

  // Buscar capas atuais
  const { data: capas, refetch } = useQuery({
    queryKey: ["capas-biblioteca-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*");
      if (error) throw error;
      return data as CapaBiblioteca[];
    },
  });

  const getCapaUrl = (bibliotecaNome: string) => {
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
    const target = normalize(bibliotecaNome);
    return capas?.find((c) => c.Biblioteca && normalize(c.Biblioteca) === target)?.capa || null;
  };

  const gerarCapa = async (biblioteca: string) => {
    setGerando(biblioteca);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capas-bibliotecas", {
        body: { biblioteca },
      });

      if (error) throw error;

      if (data.resultados?.[0]?.sucesso) {
        toast.success(`Capa gerada: ${biblioteca}`);
        await refetch();
        queryClient.invalidateQueries({ queryKey: ["capas-biblioteca"] });
      } else {
        throw new Error(data.resultados?.[0]?.erro || "Erro ao gerar");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao gerar capa: ${err instanceof Error ? err.message : "Erro"}`);
    } finally {
      setGerando(null);
    }
  };

  const gerarTodas = async () => {
    setGerandoTodas(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capas-bibliotecas", {
        body: { regenerarTodas: true },
      });

      if (error) throw error;

      toast.success(`${data.processadas}/${data.total} capas geradas com sucesso!`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["capas-biblioteca"] });
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao gerar capas: ${err instanceof Error ? err.message : "Erro"}`);
    } finally {
      setGerandoTodas(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Regenerar Capas Bibliotecas</h1>
            <p className="text-xs text-muted-foreground">Gerar novas capas com IA (formato 2:3)</p>
          </div>
          <Button
            onClick={gerarTodas}
            disabled={gerandoTodas || !!gerando}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {gerandoTodas ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Todas
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de Bibliotecas */}
      <div className="p-4 space-y-4">
        {BIBLIOTECAS.map((bib) => {
          const capaUrl = getCapaUrl(bib.nome);
          const isGerando = gerando === bib.nome || gerandoTodas;

          return (
            <Card key={bib.nome} className="p-4 border-border/50 bg-card/50">
              <div className="flex gap-4">
                {/* Preview da Capa */}
                <div
                  className="relative w-24 h-36 rounded-lg overflow-hidden flex-shrink-0 border border-white/10"
                  style={{ 
                    background: `linear-gradient(135deg, ${bib.cor}30, ${bib.cor}10)` 
                  }}
                >
                  {capaUrl ? (
                    <img
                      src={capaUrl}
                      alt={bib.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  {isGerando && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info e Ações */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{bib.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {capaUrl ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3 h-3" /> Capa configurada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <X className="w-3 h-3" /> Sem capa
                        </span>
                      )}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gerarCapa(bib.nome)}
                    disabled={isGerando}
                    className="mt-2 w-fit"
                  >
                    {isGerando ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex gap-3">
            <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-amber-400 mb-1">Como funciona</p>
              <p>
                As capas são geradas com IA (Nano Banana) no formato 2:3 vertical, 
                otimizadas para WebP (~50KB cada) e armazenadas no Supabase Storage. 
                Após gerar, elas serão pré-carregadas automaticamente para exibição instantânea.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReGenerarCapasBibliotecas;
