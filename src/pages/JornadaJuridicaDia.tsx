import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJornadaProgresso } from "@/hooks/useJornadaProgresso";
import { useJornadaAula } from "@/hooks/useJornadaAula";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JornadaAulaViewer } from "@/components/jornada/JornadaAulaViewer";

interface ResumoData {
  id: number;
  area: string;
  tema: string;
  resumo_markdown: string;
  exemplos: string;
  termos: { termo: string; definicao: string }[] | string;
}

const JornadaJuridicaDia = () => {
  const navigate = useNavigate();
  const { dia } = useParams<{ dia: string }>();
  const diaNumero = parseInt(dia || "1");

  const { progresso, marcarDiaCompleto } = useJornadaProgresso();
  const { loading: loadingAula, aulaEstrutura, buscarOuGerarAula, limparAula } = useJornadaAula();
  
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(true);

  // Fetch resumo for this day
  useEffect(() => {
    const fetchResumo = async () => {
      if (!progresso?.area_selecionada) return;

      setLoadingResumo(true);
      try {
        const artigosPorDia = progresso.artigos_por_dia || 1;
        const offset = (diaNumero - 1) * artigosPorDia;

        // Fetch resumo in order by id
        const { data, error } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("id, area, tema, resumo_markdown, exemplos, termos")
          .eq("area", progresso.area_selecionada)
          .order("id", { ascending: true })
          .range(offset, offset);

        if (error) throw error;

        if (data && data.length > 0) {
          const item = data[0];
          let parsedTermos: { termo: string; definicao: string }[] = [];
          if (item.termos) {
            try {
              parsedTermos = typeof item.termos === "string"
                ? JSON.parse(item.termos)
                : (item.termos as { termo: string; definicao: string }[]);
            } catch {
              parsedTermos = [];
            }
          }
          setResumo({ ...item, termos: parsedTermos });
        } else {
          toast.error("Conteúdo não encontrado para este dia");
          navigate("/jornada-juridica/trilha");
        }
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
        toast.error("Erro ao carregar conteúdo");
      } finally {
        setLoadingResumo(false);
      }
    };

    fetchResumo();
  }, [diaNumero, progresso, navigate]);

  // Generate/fetch aula when resumo is loaded
  useEffect(() => {
    if (resumo && !aulaEstrutura) {
      buscarOuGerarAula(resumo);
    }
  }, [resumo, aulaEstrutura, buscarOuGerarAula]);

  const handleClose = () => {
    limparAula();
    navigate("/jornada-juridica/trilha");
  };

  const handleComplete = (acertos: number, total: number) => {
    const percentual = (acertos / total) * 100;
    if (percentual >= 60) {
      marcarDiaCompleto(diaNumero);
      toast.success(`Dia ${diaNumero} completo! 🎉`);
    }
  };

  // Loading state
  if (loadingResumo || loadingAula || !aulaEstrutura) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Dia {diaNumero}</h1>
              <p className="text-xs text-muted-foreground">{progresso?.area_selecionada}</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">Preparando sua aula</h2>
            <p className="text-muted-foreground text-sm">
              {loadingResumo 
                ? "Carregando conteúdo..." 
                : "Gerando aula interativa personalizada..."}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <JornadaAulaViewer
      aulaEstrutura={aulaEstrutura}
      tema={resumo?.tema || `Dia ${diaNumero}`}
      area={progresso?.area_selecionada || ""}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
};

export default JornadaJuridicaDia;
