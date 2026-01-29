import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, Loader2, CheckCircle, HelpCircle, Ban, ListOrdered, CheckSquare, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getTableFromCodigo } from "@/lib/codigoMappings";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { useIndexedDBCache } from "@/hooks/useIndexedDBCache";

interface Artigo {
  id: number;
  "Número do Artigo": string | null;
  Artigo: string | null;
}

interface CachedQuestoesGrifos {
  questoes: string[];
  grifos: string[];
  timestamp: number;
}

const QuestoesArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo") || "cf";
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para geração automática
  const [isGeneratingQuestoes, setIsGeneratingQuestoes] = useState(false);
  const [currentGeneratingArtigo, setCurrentGeneratingArtigo] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const generationStartedRef = useRef(false);
  
  // Estado local para artigos recém-gerados (atualiza UI imediatamente)
  const [artigosRecemGerados, setArtigosRecemGerados] = useState<Set<string>>(new Set());

  // Estados para modo de seleção múltipla
  const [modo, setModo] = useState<"normal" | "selecionar">("normal");
  const [artigosSelecionados, setArtigosSelecionados] = useState<string[]>([]);

  const tableName = getTableFromCodigo(codigo);
  const displayName = tableName.split(" - ")[0] || tableName;

  // ========== CACHE INDEXEDDB - CARREGAMENTO INSTANTÂNEO ==========
  
  // Cache para artigos
  const { 
    cachedData: cachedArtigos, 
    isLoadingCache: isLoadingArtigosCache,
    saveToCache: saveArtigosToCache 
  } = useIndexedDBCache<Artigo>(`artigos-${tableName}`);
  
  // Cache para questões e grifos (combinado para eficiência)
  const { 
    cachedData: cachedQuestoesGrifos, 
    isLoadingCache: isLoadingQGCache,
    saveToCache: saveQGToCache 
  } = useIndexedDBCache<CachedQuestoesGrifos>(`questoes-grifos-${tableName}`);

  // Sets derivados do cache
  const [artigosComQuestoes, setArtigosComQuestoes] = useState<Set<string>>(new Set());
  const [artigosComGrifos, setArtigosComGrifos] = useState<Set<string>>(new Set());
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [questoesLoaded, setQuestoesLoaded] = useState(false); // Flag para saber se já carregou

  // Carregar dados do cache imediatamente
  useEffect(() => {
    if (!isLoadingArtigosCache && cachedArtigos && cachedArtigos.length > 0) {
      setArtigos(cachedArtigos);
    }
  }, [cachedArtigos, isLoadingArtigosCache]);

  // NÃO usar cache para questões - sempre carregar do banco
  // O cache IndexedDB pode estar desatualizado

  // Resetar questoesLoaded quando troca de código
  useEffect(() => {
    setQuestoesLoaded(false);
  }, [codigo]);

  // Resetar estados quando troca de lei/código
  useEffect(() => {
    generationStartedRef.current = false;
    setIsGeneratingQuestoes(false);
    setCurrentGeneratingArtigo(null);
    setGeneratedCount(0);
    setTotalToGenerate(0);
    setArtigosRecemGerados(new Set());
  }, [codigo]);

  const extractArtigoNumber = useCallback((artigo: string | null): string => {
    if (!artigo) return "";
    // Retorna o número do artigo como está (ex: "1º", "2º-A")
    // para comparação direta com o banco de dados
    return artigo.trim();
  }, []);

  const isArtigoTotalmenteVetado = useCallback((artigo: Artigo): boolean => {
    const texto = artigo.Artigo || "";
    const textoSemArt = texto.replace(/^Art\.?\s*\d+[\w°º-]*\.?\s*/i, "").trim();
    return /^\(?vetado\)?\.?\s*$/i.test(textoSemArt) || textoSemArt.length < 20;
  }, []);

  // ========== CARREGAMENTO DIRETO SE NÃO HÁ CACHE ==========
  
  const loadArtigosDirectly = useCallback(async () => {
    try {
      const pageSize = 1000;
      let allArtigos: Artigo[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        // Primeiro tenta com ordem_artigo, se falhar usa id
        let query = supabase
          .from(tableName as any)
          .select('id, "Número do Artigo", Artigo')
          .not("Número do Artigo", "is", null);

        const { data: batch, error } = await query
          .order("ordem_artigo", { ascending: true })
          .range(from, from + pageSize - 1);

        // Se ordem_artigo não existir, tentar com id
        if (error && error.message?.includes("ordem_artigo")) {
          const { data: batchFallback, error: errorFallback } = await supabase
            .from(tableName as any)
            .select('id, "Número do Artigo", Artigo')
            .not("Número do Artigo", "is", null)
            .order("id", { ascending: true })
            .range(from, from + pageSize - 1);

          if (errorFallback) {
            console.error("Erro ao carregar artigos:", errorFallback);
            break;
          }
          
          const batchData = (batchFallback as unknown as Artigo[]) || [];
          allArtigos = [...allArtigos, ...batchData];
          
          if (batchData.length < pageSize) {
            hasMore = false;
          } else {
            from += pageSize;
          }
          continue;
        }

        if (error) {
          console.error("Erro ao carregar artigos:", error);
          break;
        }
        
        const batchData = (batch as unknown as Artigo[]) || [];
        allArtigos = [...allArtigos, ...batchData];
        
        if (batchData.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      }

      const artigosComNumeros = allArtigos.filter(a => 
        a["Número do Artigo"] && /\d/.test(a["Número do Artigo"])
      );

      if (artigosComNumeros.length > 0) {
        setArtigos(artigosComNumeros);
        saveArtigosToCache(artigosComNumeros);
        console.log(`✅ Carregados ${artigosComNumeros.length} artigos diretamente`);
      }
    } catch (error) {
      console.error("Erro ao carregar artigos:", error);
    }
  }, [tableName, saveArtigosToCache]);

  // Se não tem cache, carregar diretamente
  useEffect(() => {
    if (!isLoadingArtigosCache && artigos.length === 0) {
      loadArtigosDirectly();
    }
  }, [isLoadingArtigosCache, artigos.length, loadArtigosDirectly]);

  const isVetado = isArtigoTotalmenteVetado;

  // ========== CARREGAR QUESTÕES/GRIFOS EM BACKGROUND ==========
  
  const loadQuestoesGrifosInBackground = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      // Buscar questões existentes (mais leve, apenas artigos únicos)
      const { data: questoesData } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("artigo")
        .eq("area", tableName);
      
      const questoesSet = new Set<string>();
      questoesData?.forEach(q => { if (q.artigo) questoesSet.add(q.artigo); });
      setArtigosComQuestoes(questoesSet);
      setQuestoesLoaded(true); // Marcar que questões foram carregadas

      // Buscar grifos existentes
      const { data: grifosData } = await supabase
        .from("questoes_grifos_cache")
        .select("numero_artigo")
        .eq("tabela_codigo", tableName);
      
      const grifosSet = new Set<string>();
      grifosData?.forEach(g => { if (g.numero_artigo) grifosSet.add(g.numero_artigo); });
      setArtigosComGrifos(grifosSet);
      
      // Salvar no cache
      saveQGToCache([{
        questoes: Array.from(questoesSet),
        grifos: Array.from(grifosSet),
        timestamp: Date.now()
      }] as any);

      console.log(`✅ Questões carregadas do banco:`, Array.from(questoesSet).slice(0, 20));
      console.log(`📊 Total de artigos com questões: ${questoesSet.size}`);
    } catch (error) {
      console.error("Erro ao carregar questões/grifos:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [tableName, isRefreshing, saveQGToCache]);

  // Carregar questões SEMPRE do banco (não confiar no cache para status)
  useEffect(() => {
    if (artigos.length > 0) {
      // Carregar imediatamente do banco
      loadQuestoesGrifosInBackground();
    }
  }, [artigos.length, tableName]); // Remove isLoadingQGCache para não esperar cache

  // ========== GERAÇÃO AUTOMÁTICA (SILENCIOSA PARA GRIFOS) ==========

  const generateGrifoForArtigo = useCallback(async (numeroArtigo: string): Promise<boolean> => {
    try {
      const { data: questaoData } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, comentario")
        .eq("area", tableName)
        .eq("artigo", numeroArtigo)
        .limit(1)
        .maybeSingle();

      if (!questaoData) return false;

      const variacoes = [numeroArtigo, `${numeroArtigo}°`, `Art. ${numeroArtigo}`, `Art. ${numeroArtigo}°`];
      let textoArtigo: string | null = null;
      
      for (const variacao of variacoes) {
        const { data: artigoData } = await supabase
          .from(tableName as any)
          .select("Artigo")
          .eq("Número do Artigo", variacao)
          .maybeSingle();
        
        if ((artigoData as any)?.Artigo) {
          textoArtigo = (artigoData as any).Artigo;
          break;
        }
      }

      if (!textoArtigo) return false;

      const alternativaCorreta = questaoData.resposta_correta?.toLowerCase();
      const textoAlternativaCorreta = alternativaCorreta 
        ? (questaoData as any)[`alternativa_${alternativaCorreta}`]
        : '';

      const { error } = await supabase.functions.invoke('identificar-grifo-artigo', {
        body: {
          textoArtigo,
          enunciado: questaoData.enunciado,
          alternativaCorreta: textoAlternativaCorreta,
          comentario: questaoData.comentario,
          tabelaCodigo: tableName,
          numeroArtigo,
          questaoId: questaoData.id,
          salvarCache: true
        }
      });

      return !error;
    } catch {
      return false;
    }
  }, [tableName]);

  const waitForQuestoes = useCallback(async (artigoNumero: string, maxAttempts = 60): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("id")
        .eq("area", tableName)
        .eq("artigo", artigoNumero)
        .limit(1);

      if (data && data.length > 0) return true;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
  }, [tableName]);

  const generateQuestoesForArtigo = useCallback(async (artigo: Artigo): Promise<boolean> => {
    const artigoNumero = extractArtigoNumber(artigo["Número do Artigo"]);
    
    try {
      setCurrentGeneratingArtigo(artigoNumero);
      
      const { data, error } = await supabase.functions.invoke('gerar-questoes-artigo', {
        body: { content: artigo.Artigo, numeroArtigo: artigoNumero, area: tableName }
      });

      if (error) return false;

      if (data?.status === "iniciando") {
        const success = await waitForQuestoes(artigoNumero);
        if (success) {
          setGeneratedCount(prev => prev + 1);
          setArtigosRecemGerados(prev => new Set(prev).add(artigoNumero));
          generateGrifoForArtigo(artigoNumero); // Silencioso
          return true;
        }
        return false;
      }

      if (data?.status === "cached") {
        setGeneratedCount(prev => prev + 1);
        setArtigosRecemGerados(prev => new Set(prev).add(artigoNumero));
        if (!artigosComGrifos.has(artigoNumero)) {
          generateGrifoForArtigo(artigoNumero); // Silencioso
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [tableName, extractArtigoNumber, waitForQuestoes, generateGrifoForArtigo, artigosComGrifos]);

  // Geração silenciosa de grifos em background
  const gerarGrifosSilenciosamente = useCallback(async () => {
    const artigosSemGrifos = Array.from(artigosComQuestoes).filter(
      artigo => !artigosComGrifos.has(artigo)
    );

    if (artigosSemGrifos.length === 0) return;

    console.log(`🖍️ Gerando ${artigosSemGrifos.length} grifos silenciosamente...`);

    const CONCURRENT_LIMIT = 5;
    for (let i = 0; i < artigosSemGrifos.length; i += CONCURRENT_LIMIT) {
      const batch = artigosSemGrifos.slice(i, i + CONCURRENT_LIMIT);
      await Promise.all(batch.map(artigo => generateGrifoForArtigo(artigo)));
      if (i + CONCURRENT_LIMIT < artigosSemGrifos.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Grifos gerados silenciosamente`);
  }, [artigosComQuestoes, artigosComGrifos, generateGrifoForArtigo]);

  // Iniciar geração automática - APENAS após questões terem sido carregadas
  useEffect(() => {
    // Esperar questões serem carregadas para não iniciar geração desnecessariamente
    if (isLoadingArtigosCache || isLoadingQGCache || !questoesLoaded || generationStartedRef.current || artigos.length === 0) return;
    
    // SAFEGUARD: Se temos muitos artigos mas 0 questões, provavelmente ainda está carregando
    // Isso evita iniciar geração falsa quando questões ainda não carregaram
    if (artigos.length > 50 && artigosComQuestoes.size === 0) {
      console.log("⏳ Aguardando questões carregarem antes de verificar geração...");
      return;
    }
    
    const verificarEIniciar = async () => {
      generationStartedRef.current = true;
      
      // Verificar questões pendentes
      const artigosFaltando = artigos
        .filter(a => {
          const numeroArtigo = extractArtigoNumber(a["Número do Artigo"]);
          return !artigosComQuestoes.has(numeroArtigo) && !isVetado(a);
        })
        .sort((a, b) => {
          const numA = parseInt(extractArtigoNumber(a["Número do Artigo"]).replace(/\D/g, '')) || 0;
          const numB = parseInt(extractArtigoNumber(b["Número do Artigo"]).replace(/\D/g, '')) || 0;
          return numA - numB;
        });

      console.log(`📊 Verificação: ${artigosComQuestoes.size} questões carregadas, ${artigosFaltando.length} faltando de ${artigos.length} artigos`);

      // Se todas as questões já existem, gerar grifos silenciosamente
      if (artigosFaltando.length === 0) {
        console.log("✅ Todas as questões já existem!");
        await gerarGrifosSilenciosamente();
        return;
      }

      // Se mais de 80% dos artigos "faltam" questões, provavelmente é um erro de carregamento
      // Não iniciar geração nesse caso
      const percentualFaltando = (artigosFaltando.length / artigos.length) * 100;
      if (percentualFaltando > 80 && artigos.length > 100) {
        console.log(`⚠️ ${percentualFaltando.toFixed(0)}% parecem faltar - provavelmente erro de carregamento, não iniciando geração`);
        return;
      }

      // Só mostrar banner se houver mais de 10 questões pendentes
      if (artigosFaltando.length <= 10) {
        // Gerar silenciosamente
        for (const artigo of artigosFaltando) {
          await generateQuestoesForArtigo(artigo);
        }
        await gerarGrifosSilenciosamente();
        return;
      }

      // Mostrar banner apenas para muitas questões pendentes
      console.log(`🚀 Gerando ${artigosFaltando.length} questões`);
      setIsGeneratingQuestoes(true);
      setTotalToGenerate(artigosFaltando.length);

      const BATCH_SIZE = 100;
      for (let i = 0; i < artigosFaltando.length; i += BATCH_SIZE) {
        const batch = artigosFaltando.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(artigo => generateQuestoesForArtigo(artigo)));
        if (i + BATCH_SIZE < artigosFaltando.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setCurrentGeneratingArtigo(null);
      setIsGeneratingQuestoes(false);
      toast.success("Questões geradas!");
      
      // Gerar grifos silenciosamente após questões
      await gerarGrifosSilenciosamente();
    };

    // Delay maior para garantir que dados carregaram do servidor
    const timeout = setTimeout(verificarEIniciar, 1500);
    return () => clearTimeout(timeout);
  }, [isLoadingArtigosCache, isLoadingQGCache, questoesLoaded, artigos.length, artigosComQuestoes, extractArtigoNumber, isVetado, generateQuestoesForArtigo, gerarGrifosSilenciosamente]);

  // ========== FILTROS E HANDLERS ==========

  const filteredArtigos = useMemo(() => {
    return artigos.filter((artigo) => {
      const numeroArtigo = artigo["Número do Artigo"] || "";
      const textoArtigo = artigo.Artigo || "";
      const search = searchTerm.toLowerCase();
      return (
        numeroArtigo.toLowerCase().includes(search) ||
        textoArtigo.toLowerCase().includes(search)
      );
    });
  }, [artigos, searchTerm]);

  const handleArtigoClick = useCallback((artigo: Artigo) => {
    if (isVetado(artigo)) return;
    
    const numeroArtigo = extractArtigoNumber(artigo["Número do Artigo"]);
    
    if (modo === "selecionar") {
      setArtigosSelecionados(prev => 
        prev.includes(numeroArtigo) 
          ? prev.filter(a => a !== numeroArtigo)
          : [...prev, numeroArtigo]
      );
      return;
    }
    
    navigate(`/questoes/artigos-lei/resolver?codigo=${codigo}&artigo=${numeroArtigo}`);
  }, [codigo, modo, navigate, isVetado, extractArtigoNumber]);

  const handleModoChange = useCallback((novoModo: string) => {
    if (novoModo === "normal" || novoModo === "selecionar") {
      setModo(novoModo);
      if (novoModo === "normal") setArtigosSelecionados([]);
    }
  }, []);

  const iniciarComSelecionados = useCallback(() => {
    if (artigosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um artigo");
      return;
    }
    navigate(`/questoes/artigos-lei/resolver?codigo=${codigo}&artigos=${artigosSelecionados.join(",")}`);
  }, [artigosSelecionados, codigo, navigate]);

  const totalComQuestoes = artigosComQuestoes.size;
  const totalVetados = useMemo(() => artigos.filter(a => isVetado(a)).length, [artigos, isVetado]);

  // Verificar se há dados (do cache ou carregados)
  const hasData = artigos.length > 0;
  const isInitialLoading = isLoadingArtigosCache && !hasData;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 shadow-lg shadow-amber-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {hasData 
                ? `${artigos.length} artigos • ${totalComQuestoes} com questões${totalVetados > 0 ? ` • ${totalVetados} vetados` : ""}`
                : "Carregando..."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Banner de geração - apenas para questões e quando há muitas pendentes */}
      {isGeneratingQuestoes && totalToGenerate > 10 && (
        <Card className="mb-4 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-amber-700/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">Gerando questões...</p>
                <p className="text-xs text-muted-foreground">
                  Art. {currentGeneratingArtigo} • {generatedCount}/{totalToGenerate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo de Busca + Toggle Mode */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar artigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Modo de estudo:</span>
            <ToggleGroup 
              type="single" 
              value={modo} 
              onValueChange={handleModoChange}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="normal" 
                aria-label="Modo normal"
                className="data-[state=on]:bg-amber-600 data-[state=on]:text-white px-3 py-1.5 text-xs"
              >
                <ListOrdered className="w-4 h-4 mr-1.5" />
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="selecionar" 
                aria-label="Modo seleção"
                className="data-[state=on]:bg-emerald-600 data-[state=on]:text-white px-3 py-1.5 text-xs"
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                Selecionar
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {modo === "selecionar" && (
            <p className="text-xs text-emerald-400 bg-emerald-950/30 px-3 py-2 rounded-lg">
              Toque nos artigos para selecioná-los. Depois clique em "Iniciar" para responder questões de todos de uma vez.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <TooltipProvider>
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Scale className="w-4 h-4 text-amber-500" />
            <span>Questões prontas</span>
          </div>
          <div className="flex items-center gap-1">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <span>Sem questões ainda</span>
          </div>
          {totalVetados > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Ban className="w-4 h-4 text-gray-500" />
                  <span>Vetado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Artigo vetado pelo Presidente da República. Não faz parte da lei vigente e não gera questões.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Lista de Artigos */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Artigos
        </h2>

        {isInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArtigos.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum artigo encontrado</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredArtigos.map((artigo, index) => {
              const numeroArtigo = extractArtigoNumber(artigo["Número do Artigo"]);
              // Normaliza removendo º/ª para comparar com o banco (que armazena sem esses caracteres)
              const numeroNormalizado = numeroArtigo.replace(/[ºª]/g, '');
              const temQuestoes = artigosComQuestoes.has(numeroArtigo) || artigosComQuestoes.has(numeroNormalizado) || artigosRecemGerados.has(numeroArtigo) || artigosRecemGerados.has(numeroNormalizado);
              const isCurrentGenerating = currentGeneratingArtigo === numeroArtigo;
              const vetado = isVetado(artigo);
              const isSelecionado = artigosSelecionados.includes(numeroArtigo);
              
              let borderColor = "hsl(38, 92%, 50%)";
              let StatusIcon = Scale;
              let iconColor = "text-amber-500";
              let cursorClass = "cursor-pointer hover:scale-[1.01] hover:shadow-lg";
              
              if (vetado) {
                borderColor = "#6b7280";
                StatusIcon = Ban;
                iconColor = "text-gray-500";
                cursorClass = "cursor-not-allowed opacity-60";
              } else if (modo === "selecionar" && isSelecionado) {
                borderColor = "hsl(142, 76%, 36%)";
              } else if (isCurrentGenerating) {
                borderColor = "hsl(38, 92%, 50%)";
                StatusIcon = Loader2;
                iconColor = "text-amber-400 animate-spin";
              } else if (temQuestoes) {
                borderColor = "hsl(38, 92%, 50%)";
                StatusIcon = Scale;
                iconColor = "text-amber-500";
              }
              
              const bgClass = vetado ? "bg-gray-900/50" : "";
              
              return (
                <Card
                  key={artigo.id}
                  className={`${cursorClass} transition-all border-l-4 ${bgClass} ${
                    modo === "selecionar" && isSelecionado ? "ring-2 ring-emerald-500/50 bg-emerald-950/20" : ""
                  }`}
                  style={{ borderLeftColor: borderColor }}
                  onClick={() => handleArtigoClick(artigo)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {modo === "selecionar" && !vetado && (
                      <div className="flex-shrink-0">
                        <Checkbox 
                          checked={isSelecionado}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </div>
                    )}
                    
                    <div className="flex-shrink-0">
                      <StatusIcon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Art. {numeroArtigo}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {vetado ? "(VETADO) - Artigo não vigente" : artigo.Artigo?.substring(0, 120) + "..."}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      {vetado ? (
                        <span className="text-gray-500 font-medium">Vetado</span>
                      ) : modo === "selecionar" ? (
                        <span className={isSelecionado ? "text-emerald-400 font-medium" : ""}>
                          {isSelecionado ? "Selecionado" : "Toque para selecionar"}
                        </span>
                      ) : temQuestoes ? (
                        <CheckCircle className="w-5 h-5 text-amber-500" />
                      ) : isCurrentGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Gerando...</>
                      ) : (
                        <span className="text-muted-foreground text-xs">Toque para gerar</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão fixo de rodapé */}
      <AnimatePresence>
        {modo === "selecionar" && artigosSelecionados.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4"
          >
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={iniciarComSelecionados}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/40 h-14 text-base font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar com {artigosSelecionados.length} artigo{artigosSelecionados.length > 1 ? "s" : ""} selecionado{artigosSelecionados.length > 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestoesArtigosLeiTemas;
