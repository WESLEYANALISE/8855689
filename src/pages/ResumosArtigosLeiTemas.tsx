import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, BookOpen, CheckCircle, Loader2, Volume2, ImageIcon, ArrowUp, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { normalizeArticleNumber } from "@/lib/articleSorter";

// Mapeamento de código curto para nome da tabela no Supabase
const getTableName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    "cf": "CF - Constituição Federal",
    "cp": "CP - Código Penal",
    "cc": "CC - Código Civil",
    "cpc": "CPC – Código de Processo Civil",
    "cpp": "CPP – Código de Processo Penal",
    "cdc": "CDC – Código de Defesa do Consumidor",
    "clt": "CLT - Consolidação das Leis do Trabalho",
    "ctn": "CTN – Código Tributário Nacional",
    "ctb": "CTB Código de Trânsito Brasileiro",
    "ce": "CE – Código Eleitoral",
    "cpm": "CPM – Código Penal Militar",
    "cppm": "CPPM – Código de Processo Penal Militar",
    "ca": "CA - Código de Águas",
    "cba": "CBA Código Brasileiro de Aeronáutica",
    "cbt": "CBT Código Brasileiro de Telecomunicações",
    "ccom": "CCOM – Código Comercial",
    "cdm": "CDM – Código de Minas",
    "eca": "ESTATUTO - ECA",
    "estatuto-idoso": "ESTATUTO - IDOSO",
    "estatuto-oab": "ESTATUTO - OAB",
    "estatuto-pcd": "ESTATUTO - PESSOA COM DEFICIÊNCIA",
    "estatuto-igualdade": "ESTATUTO - IGUALDADE RACIAL",
    "estatuto-cidade": "ESTATUTO - CIDADE",
    "estatuto-torcedor": "ESTATUTO - TORCEDOR",
    "lep": "Lei 7.210 de 1984 - Lei de Execução Penal",
    "lcp": "LCP - Lei das Contravenções Penais",
    "drogas": "Lei 11.343 de 2006 - Lei de Drogas",
    "maria-da-penha": "Lei 11.340 de 2006 - Maria da Penha",
    "crimes-hediondos": "Lei 8.072 de 1990 - Crimes Hediondos",
    "tortura": "Lei 9.455 de 1997 - Tortura",
    "organizacoes-criminosas": "Lei 12.850 de 2013 - Organizações Criminosas",
    "lavagem-dinheiro": "LLD - Lei de Lavagem de Dinheiro",
    "interceptacao-telefonica": "Lei 9.296 de 1996 - Interceptação Telefônica",
    "abuso-autoridade": "Lei 13.869 de 2019 - Abuso de Autoridade",
    "juizados-especiais-criminais": "Lei 9.099 de 1995 - Juizados Especiais",
    "estatuto-desarmamento": "ESTATUTO - DESARMAMENTO",
    "lei-beneficios": "LEI 8213 - Benefícios",
    "lei-custeio": "LEI 8212 - Custeio",
    "sumulas-stf": "SÚMULAS STF",
    "sumulas-vinculantes": "SÚMULAS VINCULANTES",
    "sumulas-stj": "SÚMULAS STJ",
    "sumulas-tst": "SÚMULAS TST",
    "sumulas-tse": "SÚMULAS TSE",
    "sumulas-stm": "SÚMULAS STM",
    "enunciados-cnj": "ENUNCIADOS CNJ",
    "enunciados-cnmp": "ENUNCIADOS CNMP",
  };
  return mapping[codigo.toLowerCase()] || codigo;
};

// Mapeamento para nome da área nos resumos
const getAreaName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    "cf": "Constituição Federal",
    "cp": "Código Penal",
    "cc": "Código Civil",
    "cpc": "Código de Processo Civil",
    "cpp": "Código de Processo Penal",
    "cdc": "Código de Defesa do Consumidor",
    "clt": "CLT",
    "ctn": "Código Tributário Nacional",
    "ctb": "Código de Trânsito Brasileiro",
    "ce": "Código Eleitoral",
    "cpm": "Código Penal Militar",
    "cppm": "Código de Processo Penal Militar",
    "ca": "Código de Águas",
    "cba": "Código Brasileiro de Aeronáutica",
    "cbt": "Código de Telecomunicações",
    "ccom": "Código Comercial",
    "cdm": "Código de Minas",
    "eca": "ECA",
    "estatuto-idoso": "Estatuto do Idoso",
    "estatuto-oab": "Estatuto da OAB",
    "estatuto-pcd": "Estatuto da Pessoa com Deficiência",
    "estatuto-igualdade": "Estatuto da Igualdade Racial",
    "estatuto-cidade": "Estatuto da Cidade",
    "estatuto-torcedor": "Estatuto do Torcedor",
    "lep": "Lei de Execução Penal",
    "lcp": "Lei das Contravenções Penais",
    "drogas": "Lei de Drogas",
    "maria-da-penha": "Lei Maria da Penha",
    "crimes-hediondos": "Crimes Hediondos",
    "tortura": "Lei de Tortura",
    "organizacoes-criminosas": "Organizações Criminosas",
    "lavagem-dinheiro": "Lavagem de Dinheiro",
    "interceptacao-telefonica": "Interceptação Telefônica",
    "abuso-autoridade": "Abuso de Autoridade",
    "juizados-especiais-criminais": "Juizados Especiais",
    "estatuto-desarmamento": "Estatuto do Desarmamento",
    "lei-beneficios": "Lei de Benefícios",
    "lei-custeio": "Lei de Custeio",
    "sumulas-stf": "Súmulas STF",
    "sumulas-vinculantes": "Súmulas Vinculantes",
    "sumulas-stj": "Súmulas STJ",
    "sumulas-tst": "Súmulas TST",
    "sumulas-tse": "Súmulas TSE",
    "sumulas-stm": "Súmulas STM",
    "enunciados-cnj": "Enunciados CNJ",
    "enunciados-cnmp": "Enunciados CNMP",
  };
  return mapping[codigo.toLowerCase()] || codigo;
};

// Nome amigável para exibição
const getDisplayName = (codigo: string): string => {
  return getAreaName(codigo);
};

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para normalizar número do artigo (remove º, ª, espaços e caracteres especiais)
const normalizeArtigoNumber = (numero: string): string => {
  // Remove ordinal symbols, trim whitespace, and normalize
  return numero
    .replace(/[ºª°]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
};

const ResumosArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const cor = searchParams.get("cor") || "rgb(239, 68, 68)";
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingArtigos, setCurrentGeneratingArtigos] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const generationStartedRef = useRef(false);
  
  // Estados para geração de mídias (áudio + imagens)
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [currentMediaArtigo, setCurrentMediaArtigo] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'audio' | 'imagem' | null>(null);
  const [mediaGeneratedCount, setMediaGeneratedCount] = useState(0);
  const [totalMediaToGenerate, setTotalMediaToGenerate] = useState(0);
  const mediaGenerationStartedRef = useRef(false);
  
  // Estado para botão voltar ao topo
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Restaurar posição de scroll ao voltar da página de view
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem(`scroll-resumos-${codigo}`);
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos));
        sessionStorage.removeItem(`scroll-resumos-${codigo}`);
      }, 100);
    }
  }, [codigo]);
  
  // Detectar scroll para mostrar botão voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Esconder footer quando este componente estiver montado
  useEffect(() => {
    const footer = document.querySelector('[data-footer="main"]');
    if (footer) {
      (footer as HTMLElement).style.display = 'none';
    }
    return () => {
      if (footer) {
        (footer as HTMLElement).style.display = '';
      }
    };
  }, []);

  const tableName = codigo ? getTableName(codigo) : "";
  
  // Buscar artigos da tabela do Vade Mecum (sem limite de 1000)
  const { data: artigos, isLoading: isLoadingArtigos } = useQuery({
    queryKey: ["vade-mecum-artigos-resumos", tableName],
    queryFn: async () => {
      // Buscar todos os artigos usando paginação para evitar o limite de 1000
      const allArticles: { numero: string; id: number; ordem: number }[] = [];
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('"Número do Artigo", id, ordem_artigo')
          .order('ordem_artigo', { ascending: true, nullsFirst: false })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        const articles = data
          .filter((row: any) => row["Número do Artigo"])
          .map((row: any) => ({
            numero: String(row["Número do Artigo"]),
            id: row.id,
            ordem: row.ordem_artigo || 999999,
          }));
        
        allArticles.push(...articles);
        offset += batchSize;
        
        // Se retornou menos que o batch, chegamos ao fim
        if (data.length < batchSize) break;
      }

      // Ordenar por ordem_artigo (já normalizado na tabela)
      return allArticles.sort((a, b) => a.ordem - b.ordem);
    },
    enabled: !!codigo,
  });

  // Buscar resumos já gerados e contar total
  const { data: resumosData, refetch: refetchExistentes } = useQuery({
    queryKey: ["resumos-existentes-v2", codigo],
    queryFn: async () => {
      const areaName = getAreaName(codigo!);
      
      // Buscar contagem total
      const { count, error: countError } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .select("*", { count: 'exact', head: true })
        .eq("area", areaName);

      if (countError) throw countError;

      // Buscar todos os temas únicos (sem limite de 1000 padrão do Supabase)
      // Usando múltiplas requisições para garantir pegar todos os registros
      const allTemas: string[] = [];
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("tema")
          .eq("area", areaName)
          .order("id", { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allTemas.push(...data.map((row: any) => row.tema).filter(Boolean));
        offset += batchSize;
        
        // Se retornou menos que o batch, chegamos ao fim
        if (data.length < batchSize) break;
      }

      const artigosComResumo = new Set<string>();
      allTemas.forEach((tema: string) => {
        const temaStr = String(tema);
        // Adiciona tanto a versão original quanto a normalizada
        artigosComResumo.add(temaStr);
        artigosComResumo.add(normalizeArtigoNumber(temaStr));
      });

      console.log(`📊 Resumos carregados para ${areaName}: ${artigosComResumo.size} variações de artigos`);
      console.log('📊 Exemplos:', Array.from(artigosComResumo).slice(0, 30));

      return { artigos: artigosComResumo, total: count || 0 };
    },
    staleTime: 0,
    enabled: !!codigo,
  });

  const resumosExistentes = resumosData?.artigos;
  const totalResumosDisponiveis = resumosData?.total || 0;

  // Função para gerar resumo de um artigo
  const generateResumoForArtigo = async (artigoNumero: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-artigo-lei', {
        body: { tableName: tableName, artigo: artigoNumero }
      });

      if (error) {
        console.error(`Erro ao gerar resumo para Art. ${artigoNumero}:`, error);
        return false;
      }

      if (data?.success) {
        setGeneratedCount(prev => prev + 1);
        refetchExistentes();
        return true;
      }

      return data?.cached || false;
    } catch (err) {
      console.error(`Erro ao gerar resumo para Art. ${artigoNumero}:`, err);
      return false;
    }
  };

  // Função para gerar imagem de um resumo
  const gerarImagemPara = async (
    resumoId: number,
    tipo: 'resumo' | 'exemplo1' | 'exemplo2' | 'exemplo3',
    conteudo: string,
    tema: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-imagem-resumo', {
        body: {
          resumoId,
          tipo,
          conteudo: conteudo?.substring(0, 500) || '',
          area: areaName,
          tema,
          tabela: 'RESUMOS_ARTIGOS_LEI'
        }
      });
      return !error && data?.url_imagem;
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      return false;
    }
  };

  // ÁUDIO DESATIVADO - Função de geração de áudio removida
  // A função gerarAudioPara foi desativada temporariamente

  // Helper para extrair número do artigo para ordenação
  const extrairNumeroArtigo = (tema: string): number => {
    const match = tema?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
  };

  // 🔇 MEDIA GENERATION DISABLED - Geração de mídias (imagens/áudio) pausada temporariamente
  const iniciarGeracaoMidias = async () => {
    console.log('🔇 Geração de mídias (imagens/áudio) desativada temporariamente');
    // Não faz nada - geração pausada
    return;
  };

  // Iniciar geração automática de resumos em background
  useEffect(() => {
    if (!artigos || !resumosExistentes || generationStartedRef.current) return;
    
    const artigosFaltando = artigos
      .filter(a => !resumosExistentes.has(a.numero) && !resumosExistentes.has(normalizeArtigoNumber(a.numero)))
      .sort((a, b) => {
        const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    if (artigosFaltando.length === 0) {
      console.log("✅ Todos os artigos já têm resumos. Verificando mídias...");
      // Todos os resumos prontos - iniciar geração de mídias
      if (!mediaGenerationStartedRef.current && !isGeneratingMedia) {
        iniciarGeracaoMidias();
      }
      return;
    }

    generationStartedRef.current = true;
    console.log(`🚀 Iniciando geração automática de ${artigosFaltando.length} resumos`);
    setIsGenerating(true);
    setTotalToGenerate(artigosFaltando.length);

    const generateAll = async () => {
      // Gerar 100 artigos por vez (em paralelo)
      const BATCH_SIZE = 100;
      for (let i = 0; i < artigosFaltando.length; i += BATCH_SIZE) {
        const batch = artigosFaltando.slice(i, i + BATCH_SIZE);
        setCurrentGeneratingArtigos(batch.map(a => a.numero));
        
        await Promise.all(batch.map(artigo => generateResumoForArtigo(artigo.numero)));
        await delay(2000);
      }
      
      setIsGenerating(false);
      setCurrentGeneratingArtigos([]);
      toast.success(`Geração de resumos concluída! ${artigosFaltando.length} processados.`);
      
      // Após terminar resumos, iniciar geração de mídias
      console.log('📢 Resumos finalizados. Iniciando geração de mídias...');
      iniciarGeracaoMidias();
    };

    generateAll();
  }, [artigos, resumosExistentes]);

  const filteredArtigos = artigos?.filter((item) =>
    item.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Já está ordenado pelo ordem_artigo da query, apenas filtra
  const sortedArtigos = filteredArtigos;

  if (!codigo) {
    navigate("/resumos-juridicos/artigos-lei");
    return null;
  }

  const areaName = getAreaName(codigo);
  const displayName = getDisplayName(codigo);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: cor, boxShadow: `0 0 20px ${cor}80` }}
          >
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um artigo para ver o resumo
            </p>
          </div>
        </div>
      </div>

      {/* Banner de geração automática de resumos */}
      {isGenerating && (
        <Card className="mb-4 bg-gradient-to-r from-red-900/30 to-orange-800/20 border-red-700/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">
                  Gerando resumos automaticamente...
                </p>
                <p className="text-xs text-muted-foreground">
                  Art. {currentGeneratingArtigos.join(', ')} • {generatedCount}/{totalToGenerate} processados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔇 MEDIA GENERATION DISABLED - Banner de geração de capas ocultado */}

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-medium">Concluído</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span>A gerar</span>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Gerando</span>
          </div>
        )}
      </div>

      {/* Resumos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">
          Resumos Disponíveis ({sortedArtigos?.length || 0})
        </h2>
        
        {isLoadingArtigos ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[56px] w-full rounded-lg" />
            ))}
          </div>
        ) : sortedArtigos?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum artigo encontrado</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedArtigos?.map((artigo, index) => {
              // Verificar se tem resumo - checando tanto original quanto normalizado
              const hasResumo = resumosExistentes?.has(artigo.numero) || 
                               resumosExistentes?.has(normalizeArtigoNumber(artigo.numero));
              const isCurrentlyGenerating = currentGeneratingArtigos.includes(artigo.numero);
              
              return (
                <Card
                  key={artigo.id}
                  className={`cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all duration-200 border-l-4 ${
                    isCurrentlyGenerating 
                      ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse' 
                      : ''
                  }`}
                  style={{
                    borderLeftColor: "hsl(38, 92%, 50%)"
                  }}
                  onClick={() => {
                    sessionStorage.setItem(`scroll-resumos-${codigo}`, window.scrollY.toString());
                    navigate(`/resumos-juridicos/artigos-lei/view?codigo=${codigo}&artigo=${artigo.numero}`);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <FileText className={`w-5 h-5 ${isCurrentlyGenerating ? 'text-amber-400 animate-bounce' : 'text-amber-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Art. {artigo.numero}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{displayName}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isCurrentlyGenerating ? (
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      ) : hasResumo ? (
                        <CheckCircle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-20 right-4 rounded-full shadow-lg z-50 animate-fade-in bg-amber-500 hover:bg-amber-600 text-white"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default ResumosArtigosLeiTemas;