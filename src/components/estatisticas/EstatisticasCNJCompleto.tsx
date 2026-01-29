import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { TabsCNJ, ABAS_CNJ } from "./abas/TabsCNJ";
import { FiltrosAvancadosCNJ, FiltrosCNJ, FILTROS_INICIAIS } from "./filtros/FiltrosAvancadosCNJ";
import { EmAltaCards } from "./EmAltaCards";
import { ToggleExplicacao } from "./ToggleExplicacao";
import { AnimatedBarChart } from "./AnimatedBarChart";
import { AnimatedPieChart } from "./AnimatedPieChart";
import { TrendChart } from "./TrendChart";
import { GrandesLitigantes } from "./GrandesLitigantes";
import { PainelTempos } from "./visualizacoes/PainelTempos";
import { PainelIndicadores } from "./visualizacoes/PainelIndicadores";
import { PainelConciliacao } from "./visualizacoes/PainelConciliacao";
import { PainelMais15Anos } from "./visualizacoes/PainelMais15Anos";
import { PainelMapas } from "./visualizacoes/PainelMapas";
import { PainelDownloads } from "./visualizacoes/PainelDownloads";
import { ExplicacaoIAModal } from "./ExplicacaoIAModal";

interface EstatisticasCNJCompletoProps {
  onExplicar?: (tipo: any, dados: any) => void;
}

export function EstatisticasCNJCompleto({ onExplicar }: EstatisticasCNJCompletoProps) {
  const [abaAtiva, setAbaAtiva] = useState("gestao");
  const [filtros, setFiltros] = useState<FiltrosCNJ>(FILTROS_INICIAIS);
  const [modoExplicacao, setModoExplicacao] = useState<"dados" | "explicacao" | "glossario" | "interpretar">("dados");
  const [isLoading, setIsLoading] = useState(true);
  
  const [kpis, setKpis] = useState<any>(null);
  const [tribunais, setTribunais] = useState<any[]>([]);
  const [assuntos, setAssuntos] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [tendencias, setTendencias] = useState<any[]>([]);
  const [litigantes, setLitigantes] = useState<any[]>([]);
  
  const [modalExplicacao, setModalExplicacao] = useState({
    isOpen: false,
    tipo: "kpi" as any,
    dados: null as any,
  });

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      const [kpisRes, tribunaisRes, assuntosRes, classesRes, tendenciasRes, litigantesRes] = await Promise.all([
        supabase.functions.invoke("buscar-estatisticas-cnj", {
          body: { tipo: "kpis", periodo: filtros.periodo, areaJuridica: filtros.natureza },
        }),
        supabase.functions.invoke("buscar-estatisticas-cnj", { body: { tipo: "tribunais" } }),
        supabase.functions.invoke("buscar-estatisticas-cnj", { body: { tipo: "assuntos", periodo: filtros.periodo } }),
        supabase.functions.invoke("buscar-estatisticas-cnj", { body: { tipo: "classes", periodo: filtros.periodo } }),
        supabase.functions.invoke("buscar-estatisticas-cnj", { body: { tipo: "tendencias", periodo: filtros.periodo } }),
        supabase.functions.invoke("buscar-estatisticas-cnj", { body: { tipo: "litigantes" } }),
      ]);

      if (kpisRes.data) setKpis(kpisRes.data);
      if (tribunaisRes.data?.tribunais) setTribunais(tribunaisRes.data.tribunais);
      if (assuntosRes.data?.assuntos) setAssuntos(assuntosRes.data.assuntos);
      if (classesRes.data?.classes) setClasses(classesRes.data.classes);
      if (tendenciasRes.data?.tendencia) setTendencias(tendenciasRes.data.tendencia);
      if (litigantesRes.data?.litigantes) setLitigantes(litigantesRes.data.litigantes);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setIsLoading(false);
    }
  }, [filtros.periodo, filtros.natureza]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirExplicacao = (tipo: any, dados: any) => {
    setModalExplicacao({ isOpen: true, tipo, dados });
  };

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case "gestao":
        return (
          <div className="space-y-6">
            <EmAltaCards
              kpis={kpis}
              isLoading={isLoading}
              periodo={filtros.periodo}
              area={filtros.natureza}
              tribunal={filtros.tribunal}
              onExplicar={abrirExplicacao}
              modoExplicacao={modoExplicacao === "explicacao"}
            />
            {isLoading ? <Skeleton className="h-[300px]" /> : (
              <TrendChart data={tendencias} titulo="Movimentação Processual" subtitulo="Novos vs Baixados" altura={300} />
            )}
          </div>
        );

      case "produtividade":
        return (
          <div className="space-y-6">
            {isLoading ? <Skeleton className="h-[350px]" /> : (
              <AnimatedBarChart
                data={tribunais.map(t => ({ nome: t.nome, valor: t.total, cor: t.cor, sigla: t.tribunal }))}
                titulo="Processos por Tribunal"
                subtitulo="Ranking de produtividade"
                horizontal
                altura={350}
                onExplicar={(item) => abrirExplicacao("tribunal", item)}
              />
            )}
            <GrandesLitigantes data={litigantes} onExplicar={(l) => abrirExplicacao("comparacao", l)} />
          </div>
        );

      case "indicadores":
        return <PainelIndicadores dados={null} isLoading={isLoading} />;

      case "tempos":
        return <PainelTempos dados={null} isLoading={isLoading} />;

      case "classes":
        return isLoading ? <Skeleton className="h-[300px]" /> : (
          <AnimatedBarChart
            data={classes.map(c => ({ nome: c.nome, valor: c.quantidade, cor: c.cor, sigla: c.nome.substring(0, 4) }))}
            titulo="Classes Processuais"
            subtitulo="Tipos mais frequentes"
            altura={350}
            onExplicar={(item) => abrirExplicacao("classe", item)}
          />
        );

      case "assuntos":
        return isLoading ? <Skeleton className="h-[350px]" /> : (
          <AnimatedPieChart data={assuntos} titulo="Assuntos Mais Frequentes" subtitulo="Distribuição por matéria" altura={350} onExplicar={(item) => abrirExplicacao("assunto", item)} />
        );

      case "temas":
        return isLoading ? <Skeleton className="h-[350px]" /> : (
          <AnimatedPieChart data={assuntos} titulo="Temas Repetitivos" subtitulo="Recursos com repercussão geral" altura={350} onExplicar={(item) => abrirExplicacao("assunto", item)} />
        );

      case "conciliacao":
        return <PainelConciliacao dados={null} isLoading={isLoading} />;

      case "mais15anos":
        return <PainelMais15Anos dados={null} isLoading={isLoading} />;

      case "mapas":
        return <PainelMapas dados={null} isLoading={isLoading} />;

      case "downloads":
        return <PainelDownloads />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Explicação */}
      <ToggleExplicacao modoExplicacao={modoExplicacao} setModoExplicacao={setModoExplicacao} />

      {/* Sistema de Abas CNJ */}
      <TabsCNJ abaAtiva={abaAtiva} onChangeAba={setAbaAtiva} />

      {/* Filtros Avançados */}
      <FiltrosAvancadosCNJ
        filtros={filtros}
        onChangeFiltros={setFiltros}
        onLimpar={() => setFiltros(FILTROS_INICIAIS)}
      />

      {/* Botão Atualizar */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={carregarDados} disabled={isLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Conteúdo da aba */}
      <motion.div
        key={abaAtiva}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderConteudoAba()}
      </motion.div>

      {/* Modal */}
      <ExplicacaoIAModal
        isOpen={modalExplicacao.isOpen}
        onClose={() => setModalExplicacao({ ...modalExplicacao, isOpen: false })}
        tipo={modalExplicacao.tipo}
        dados={modalExplicacao.dados}
      />
    </div>
  );
}
