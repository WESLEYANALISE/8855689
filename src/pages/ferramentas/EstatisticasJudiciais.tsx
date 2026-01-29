import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

import { EmAltaCards } from "@/components/estatisticas/EmAltaCards";
import { FiltrosRapidos } from "@/components/estatisticas/FiltrosRapidos";
import { ToggleExplicacao } from "@/components/estatisticas/ToggleExplicacao";
import { AnimatedBarChart } from "@/components/estatisticas/AnimatedBarChart";
import { AnimatedPieChart } from "@/components/estatisticas/AnimatedPieChart";
import { ExplicacaoIAModal } from "@/components/estatisticas/ExplicacaoIAModal";
import { TrendChart } from "@/components/estatisticas/TrendChart";
import { GrandesLitigantes } from "@/components/estatisticas/GrandesLitigantes";
import { MapaProcessosUF } from "@/components/estatisticas/MapaProcessosUF";
import { MenuJusticaNumeros, PainelId } from "@/components/estatisticas/MenuJusticaNumeros";
import { PainelPessoal } from "@/components/estatisticas/PainelPessoal";
import { PainelDespesas } from "@/components/estatisticas/PainelDespesas";
import { PainelMetas } from "@/components/estatisticas/PainelMetas";
import { PainelINSS } from "@/components/estatisticas/PainelINSS";
import { PainelViolenciaMulher } from "@/components/estatisticas/PainelViolenciaMulher";
import { PainelFazenda } from "@/components/estatisticas/PainelFazenda";
import { PainelSaude } from "@/components/estatisticas/PainelSaude";
import { PainelJuri } from "@/components/estatisticas/PainelJuri";
import { GlossarioJuridico } from "@/components/estatisticas/GlossarioJuridico";
import { ComoInterpretar } from "@/components/estatisticas/ComoInterpretar";

interface KPIData {
  totalProcessos: number;
  processosNovos: number;
  processosBaixados: number;
  processosPendentes: number;
  taxaCongestionamento?: number;
  indiceAtendimentoDemanda?: number;
  atualizadoEm?: string;
  fonte?: string;
  dadosOficiais?: boolean;
}

interface TribunalData {
  tribunal: string;
  nome: string;
  total: number;
  tipo: string;
  cor: string;
}

interface AssuntoData {
  nome: string;
  quantidade: number;
  percentual: number;
  cor: string;
}

export default function EstatisticasJudiciais() {
  const navigate = useNavigate();
  
  // Estado para controlar se está no menu inicial ou em um painel
  const [painelSelecionado, setPainelSelecionado] = useState<PainelId | null>(null);
  
  // States para filtros (usados apenas quando um painel está selecionado)
  const [tribunal, setTribunal] = useState("");
  const [periodo, setPeriodo] = useState("ano");
  const [area, setArea] = useState("");
  const [grau, setGrau] = useState("");
  const [modoExplicacao, setModoExplicacao] = useState<"dados" | "explicacao" | "glossario" | "interpretar">("dados");
  const [dataKey, setDataKey] = useState(Date.now());
  
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [tribunais, setTribunais] = useState<TribunalData[]>([]);
  const [assuntos, setAssuntos] = useState<AssuntoData[]>([]);
  const [classes, setClasses] = useState<AssuntoData[]>([]);
  const [tendencias, setTendencias] = useState<any[]>([]);
  const [litigantes, setLitigantes] = useState<any[]>([]);
  const [mapaUF, setMapaUF] = useState<any[]>([]);
  
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [isLoadingTribunais, setIsLoadingTribunais] = useState(true);
  const [isLoadingAssuntos, setIsLoadingAssuntos] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingTendencias, setIsLoadingTendencias] = useState(true);
  const [isLoadingLitigantes, setIsLoadingLitigantes] = useState(true);
  const [isLoadingMapaUF, setIsLoadingMapaUF] = useState(true);
  
  const [modalExplicacao, setModalExplicacao] = useState<{
    isOpen: boolean;
    tipo: "kpi" | "tribunal" | "assunto" | "classe" | "comparacao" | "tendencia";
    dados: any;
  }>({
    isOpen: false,
    tipo: "kpi",
    dados: null,
  });

  const carregarKPIs = useCallback(async () => {
    setIsLoadingKpis(true);
    try {
      console.log(`[Frontend] Carregando KPIs com período: ${periodo}, área: ${area}, tribunal: ${tribunal}`);
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "kpis", tribunal, periodo, areaJuridica: area },
      });
      
      if (error) throw error;
      console.log("[Frontend] KPIs recebidos:", data);
      setKpis(data);
      setDataKey(Date.now());
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
      setKpis({
        totalProcessos: 80000000,
        processosNovos: 12000000,
        processosBaixados: 11500000,
        processosPendentes: 68500000,
      });
    } finally {
      setIsLoadingKpis(false);
    }
  }, [tribunal, periodo, area]);

  const carregarTribunais = useCallback(async () => {
    setIsLoadingTribunais(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "tribunais" },
      });
      if (error) throw error;
      setTribunais(data.tribunais || []);
    } catch (error) {
      setTribunais([
        { tribunal: "TJSP", nome: "TJ São Paulo", total: 25000000, tipo: "Estadual", cor: "#f59e0b" },
        { tribunal: "TJRJ", nome: "TJ Rio de Janeiro", total: 12000000, tipo: "Estadual", cor: "#f59e0b" },
      ]);
    } finally {
      setIsLoadingTribunais(false);
    }
  }, []);

  const carregarAssuntos = useCallback(async () => {
    setIsLoadingAssuntos(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "assuntos", tribunal, areaJuridica: area, periodo },
      });
      if (error) throw error;
      setAssuntos(data.assuntos || []);
    } catch (error) {
      setAssuntos([
        { nome: "Direito Civil", quantidade: 28000000, percentual: 35, cor: "#ea384c" },
        { nome: "Direito do Consumidor", quantidade: 16000000, percentual: 20, cor: "#3b82f6" },
      ]);
    } finally {
      setIsLoadingAssuntos(false);
    }
  }, [tribunal, area, periodo]);

  const carregarClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "classes", tribunal, periodo },
      });
      if (error) throw error;
      setClasses(data.classes || []);
    } catch (error) {
      setClasses([
        { nome: "Procedimento Comum Cível", quantidade: 25000000, percentual: 31, cor: "#ea384c" },
      ]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [tribunal, periodo]);

  const carregarTendencias = useCallback(async () => {
    setIsLoadingTendencias(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "tendencias", tribunal, periodo },
      });
      if (error) throw error;
      setTendencias(data.tendencia || []);
    } catch (error) {
      setTendencias([
        { mes: "Jan", novos: 1200000, baixados: 1100000 },
        { mes: "Fev", novos: 1150000, baixados: 1050000 },
      ]);
    } finally {
      setIsLoadingTendencias(false);
    }
  }, [tribunal, periodo]);

  const carregarLitigantes = useCallback(async () => {
    setIsLoadingLitigantes(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "litigantes" },
      });
      if (error) throw error;
      setLitigantes(data.litigantes || []);
    } catch (error) {
      setLitigantes([
        { nome: 'INSS', quantidade: 4200000, percentual: 12.5 },
      ]);
    } finally {
      setIsLoadingLitigantes(false);
    }
  }, []);

  const carregarMapaUF = useCallback(async () => {
    setIsLoadingMapaUF(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-estatisticas-cnj", {
        body: { tipo: "mapa_uf" },
      });
      if (error) throw error;
      setMapaUF(data.estados || []);
    } catch (error) {
      setMapaUF([]);
    } finally {
      setIsLoadingMapaUF(false);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    await Promise.all([
      carregarKPIs(),
      carregarTribunais(),
      carregarAssuntos(),
      carregarClasses(),
      carregarTendencias(),
      carregarLitigantes(),
      carregarMapaUF(),
    ]);
  }, [carregarKPIs, carregarTribunais, carregarAssuntos, carregarClasses, carregarTendencias, carregarLitigantes, carregarMapaUF]);

  // Carregar dados apenas quando um painel for selecionado
  useEffect(() => {
    if (painelSelecionado === "estatisticas") {
      carregarDados();
    }
  }, [painelSelecionado, tribunal, periodo, area]);

  const limparFiltros = () => {
    setTribunal("");
    setPeriodo("ano");
    setArea("");
    setGrau("");
  };

  const abrirExplicacao = (tipo: any, dados: any) => {
    setModalExplicacao({ isOpen: true, tipo, dados });
  };

  const voltarAoMenu = () => {
    setPainelSelecionado(null);
  };

  const selecionarPainel = (painel: PainelId) => {
    setPainelSelecionado(painel);
  };

  const renderPainelConteudo = () => {
    switch (painelSelecionado) {
      case "pessoal":
        return <PainelPessoal />;
      case "despesas":
        return <PainelDespesas />;
      case "metas":
        return <PainelMetas />;
      case "inss":
        return <PainelINSS />;
      case "violencia":
        return <PainelViolenciaMulher />;
      case "fazenda":
        return <PainelFazenda />;
      case "saude":
        return <PainelSaude />;
      case "juri":
        return <PainelJuri />;
      case "litigantes":
        return isLoadingLitigantes ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : (
          <GrandesLitigantes data={litigantes} onExplicar={(l) => abrirExplicacao("comparacao", l)} />
        );
      case "estatisticas":
        return renderEstatisticasPrincipais();
      default:
        return null;
    }
  };

  const renderEstatisticasPrincipais = () => (
    <>
      {/* Toggle entre modos */}
      <ToggleExplicacao 
        modoExplicacao={modoExplicacao} 
        setModoExplicacao={setModoExplicacao} 
      />

      {/* Renderizar conteúdo baseado no modo selecionado */}
      {modoExplicacao === "glossario" ? (
        <GlossarioJuridico />
      ) : modoExplicacao === "interpretar" ? (
        <ComoInterpretar />
      ) : (
        <>
          {/* Em Alta - Cards principais */}
          <EmAltaCards
            kpis={kpis}
            isLoading={isLoadingKpis}
            periodo={periodo}
            area={area}
            tribunal={tribunal}
            onExplicar={abrirExplicacao}
            modoExplicacao={modoExplicacao === "explicacao"}
          />

          {/* Filtros Rápidos */}
          <FiltrosRapidos
            periodo={periodo}
            setPeriodo={setPeriodo}
            area={area}
            setArea={setArea}
            tribunal={tribunal}
            setTribunal={setTribunal}
            onLimpar={limparFiltros}
          />

          {/* Tabs para gráficos */}
          <Tabs defaultValue="tribunais" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
              <TabsTrigger value="tribunais" className="text-xs py-2">Tribunais</TabsTrigger>
              <TabsTrigger value="assuntos" className="text-xs py-2">Assuntos</TabsTrigger>
              <TabsTrigger value="classes" className="text-xs py-2">Classes</TabsTrigger>
              <TabsTrigger value="tendencias" className="text-xs py-2">Tendências</TabsTrigger>
              <TabsTrigger value="litigantes" className="text-xs py-2">Litigantes</TabsTrigger>
              <TabsTrigger value="mapa" className="text-xs py-2">Por UF</TabsTrigger>
            </TabsList>

            <TabsContent value="tribunais">
              {isLoadingTribunais ? <Skeleton className="h-[350px] w-full rounded-xl" /> : (
                <AnimatedBarChart
                  data={tribunais.map(t => ({ nome: t.nome, valor: t.total, cor: t.cor, sigla: t.tribunal }))}
                  titulo="Processos por Tribunal"
                  subtitulo="Ranking dos principais tribunais"
                  horizontal
                  altura={350}
                  onExplicar={(item) => abrirExplicacao("tribunal", item)}
                />
              )}
            </TabsContent>

            <TabsContent value="assuntos">
              {isLoadingAssuntos ? <Skeleton className="h-[350px] w-full rounded-xl" /> : (
                <AnimatedPieChart data={assuntos} titulo="Assuntos Mais Frequentes" subtitulo="Distribuição por área" altura={350} onExplicar={(item) => abrirExplicacao("assunto", item)} />
              )}
            </TabsContent>

            <TabsContent value="classes">
              {isLoadingClasses ? <Skeleton className="h-[300px] w-full rounded-xl" /> : (
                <AnimatedBarChart
                  data={classes.map(c => ({ nome: c.nome, valor: c.quantidade, cor: c.cor, sigla: c.nome.substring(0, 4) }))}
                  titulo="Classes Processuais"
                  subtitulo="Tipos de processos"
                  altura={300}
                  onExplicar={(item) => abrirExplicacao("classe", item)}
                />
              )}
            </TabsContent>

            <TabsContent value="tendencias">
              {isLoadingTendencias ? <Skeleton className="h-[300px] w-full rounded-xl" /> : (
                <TrendChart data={tendencias} titulo="Tendência de Processos" subtitulo="Novos vs Baixados" altura={300} />
              )}
            </TabsContent>

            <TabsContent value="litigantes">
              {isLoadingLitigantes ? <Skeleton className="h-[400px] w-full rounded-xl" /> : (
                <GrandesLitigantes data={litigantes} onExplicar={(l) => abrirExplicacao("comparacao", l)} />
              )}
            </TabsContent>

            <TabsContent value="mapa">
              {isLoadingMapaUF ? <Skeleton className="h-[500px] w-full rounded-xl" /> : (
                <MapaProcessosUF data={mapaUF} onExplicar={(e) => abrirExplicacao("comparacao", e)} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </>
  );

  // Se nenhum painel foi selecionado, mostrar apenas o menu circular (sem header, sem footer)
  if (!painelSelecionado) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Menu circular com imagem de fundo em tela cheia */}
        <MenuJusticaNumeros onSelecionarPainel={selecionarPainel} onVoltar={() => navigate("/ferramentas")} />
      </div>
    );
  }

  // Se um painel foi selecionado, mostrar o conteúdo do painel
  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header com botão voltar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={voltarAoMenu}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {painelSelecionado === "estatisticas" ? "Estatísticas Gerais" : 
               painelSelecionado === "pessoal" ? "Dados de Pessoal" :
               painelSelecionado === "despesas" ? "Despesas e Receitas" :
               painelSelecionado === "litigantes" ? "Grandes Litigantes" :
               painelSelecionado === "metas" ? "Metas CNJ" :
               painelSelecionado === "saude" ? "Direito à Saúde" :
               painelSelecionado === "juri" ? "Tribunal do Júri" :
               painelSelecionado === "inss" ? "Painel INSS" :
               painelSelecionado === "violencia" ? "Violência contra a Mulher" :
               painelSelecionado === "fazenda" ? "Fazenda Nacional" :
               "Estatísticas"}
            </h1>
            <p className="text-xs text-muted-foreground">Justiça em Números 2025</p>
          </div>
          {painelSelecionado === "estatisticas" && (
            <Button variant="outline" size="sm" onClick={carregarDados} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="flex-1 px-4 py-4 space-y-6">
        <motion.div 
          key={painelSelecionado} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {renderPainelConteudo()}
        </motion.div>

        {/* Fonte */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4"
        >
          <span>Fonte: CNJ - Justiça em Números 2025</span>
        </motion.div>
      </div>

      {/* Modal de Explicação */}
      <ExplicacaoIAModal
        isOpen={modalExplicacao.isOpen}
        onClose={() => setModalExplicacao({ ...modalExplicacao, isOpen: false })}
        tipo={modalExplicacao.tipo}
        dados={modalExplicacao.dados}
      />
    </div>
  );
}
