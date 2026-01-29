import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Scale, CheckCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mapeamento de código curto para nome da tabela no Supabase
const getTableName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    // Códigos
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
    // Estatutos
    "eca": "ESTATUTO - ECA",
    "estatuto-idoso": "ESTATUTO - IDOSO",
    "estatuto-oab": "ESTATUTO - OAB",
    "estatuto-pcd": "ESTATUTO - PESSOA COM DEFICIÊNCIA",
    "estatuto-igualdade": "ESTATUTO - IGUALDADE RACIAL",
    "estatuto-cidade": "ESTATUTO - CIDADE",
    "estatuto-torcedor": "ESTATUTO - TORCEDOR",
    // Legislação Penal Especial
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
    // Previdenciário
    "lei-beneficios": "LEI 8213 - Benefícios",
    "lei-custeio": "LEI 8212 - Custeio",
    // Súmulas
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

// Mapeamento de código/tabela para nome da área nos flashcards
// IMPORTANTE: O nome da área deve corresponder EXATAMENTE ao que foi salvo na tabela FLASHCARDS - ARTIGOS LEI
const getAreaName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    // Códigos
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
    // Estatutos
    "eca": "ECA",
    "estatuto-idoso": "Estatuto do Idoso",
    "estatuto-oab": "Estatuto da OAB",
    "estatuto-pcd": "Estatuto da Pessoa com Deficiência",
    "estatuto-igualdade": "Estatuto da Igualdade Racial",
    "estatuto-cidade": "Estatuto da Cidade",
    "estatuto-torcedor": "Estatuto do Torcedor",
    // Legislação Penal Especial - USAR O NOME DA TABELA para buscar flashcards existentes
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
    // Previdenciário
    "lei-beneficios": "LEI 8213 - Benefícios",
    "lei-custeio": "LEI 8212 - Custeio",
    // Súmulas
    "sumulas-stf": "SÚMULAS STF",
    "sumulas-vinculantes": "SÚMULAS VINCULANTES",
    "sumulas-stj": "SÚMULAS STJ",
    "sumulas-tst": "SÚMULAS TST",
    "sumulas-tse": "SÚMULAS TSE",
    "sumulas-stm": "SÚMULAS STM",
    "enunciados-cnj": "ENUNCIADOS CNJ",
    "enunciados-cnmp": "ENUNCIADOS CNMP",
    // Legacy mappings (nome de tabela completo)
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
    "CA - Código de Águas": "Código de Águas",
    "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CCOM – Código Comercial": "Código Comercial",
    "CDM – Código de Minas": "Código de Minas",
    "ESTATUTO - ECA": "ECA",
    "ESTATUTO - IDOSO": "Estatuto do Idoso",
    "ESTATUTO - OAB": "Estatuto da OAB",
    "ESTATUTO - PESSOA COM DEFICIÊNCIA": "Estatuto da Pessoa com Deficiência",
    "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
    "ESTATUTO - CIDADE": "Estatuto da Cidade",
    "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
  };
  return mapping[codigo.toLowerCase()] || mapping[codigo] || codigo;
};

// Nome amigável para exibição no header (sem número da lei)
const getDisplayName = (codigo: string): string => {
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

// Extrair apenas o número de um artigo (ex: "1º" -> "1", "1º-A" -> "1")
const extractArtigoNumber = (artigo: string): string => {
  const match = artigo.match(/^(\d+)/);
  return match ? match[1] : artigo;
};

const FlashcardsArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const cor = searchParams.get("cor") || "rgb(16, 185, 129)";
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingArtigo, setCurrentGeneratingArtigo] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const generationStartedRef = useRef(false);

  // Buscar artigos diretamente da tabela do Vade Mecum
  const tableName = codigo ? getTableName(codigo) : "";
  
  const { data: artigos, isLoading: isLoadingArtigos } = useQuery({
    queryKey: ["vade-mecum-artigos", tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('"Número do Artigo", id')
        .order('id');

      if (error) throw error;

      return data
        .filter((row: any) => row["Número do Artigo"])
        .map((row: any) => ({
          numero: String(row["Número do Artigo"]),
          id: row.id,
        }));
    },
    enabled: !!codigo,
  });

  // Buscar quais artigos já têm flashcards gerados e contar total
  const { data: flashcardsData, refetch: refetchExistentes } = useQuery({
    queryKey: ["flashcards-existentes", codigo],
    queryFn: async () => {
      const areaName = getAreaName(codigo!);
      
      // Buscar contagem total de flashcards (sem limite)
      const { count, error: countError } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("*", { count: 'exact', head: true })
        .eq("area", areaName);

      if (countError) throw countError;

      // Buscar artigos únicos com flashcards (usando range para pegar todos)
      const artigosComFlashcards = new Set<string>();
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("FLASHCARDS - ARTIGOS LEI")
          .select("tema")
          .eq("area", areaName)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          data.forEach((row: any) => {
            if (row.tema !== null && row.tema !== undefined) {
              artigosComFlashcards.add(String(row.tema));
            }
          });
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      return { artigos: artigosComFlashcards, total: count || 0 };
    },
    enabled: !!codigo,
  });

  // Extrair dados para uso
  const flashcardsExistentes = flashcardsData?.artigos;
  const totalFlashcardsDisponiveis = flashcardsData?.total || 0;

  // Função para gerar flashcards de um artigo
  const generateFlashcardsForArtigo = async (artigoNumero: string): Promise<boolean> => {
    try {
      setCurrentGeneratingArtigo(artigoNumero);
      
      const { data, error } = await supabase.functions.invoke('gerar-flashcards-lote', {
        body: { tableName: tableName, artigo: artigoNumero }
      });

      if (error) {
        console.error(`Erro ao gerar flashcards para Art. ${artigoNumero}:`, error);
        return false;
      }

      if (data?.success) {
        setGeneratedCount(prev => prev + 1);
        // Atualizar lista de flashcards existentes
        refetchExistentes();
        return true;
      }

      return data?.cached || false;
    } catch (err) {
      console.error(`Erro ao gerar flashcards para Art. ${artigoNumero}:`, err);
      return false;
    }
  };

  // Iniciar geração automática em background
  useEffect(() => {
    if (!artigos || !flashcardsExistentes || generationStartedRef.current) return;
    
    const artigosFaltando = artigos
      .filter(a => !flashcardsExistentes.has(extractArtigoNumber(a.numero)))
      .sort((a, b) => {
        const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    if (artigosFaltando.length === 0) {
      console.log("✅ Todos os artigos já têm flashcards");
      return;
    }

    generationStartedRef.current = true;
    console.log(`🚀 Iniciando geração automática de ${artigosFaltando.length} artigos`);
    setIsGenerating(true);
    setTotalToGenerate(artigosFaltando.length);

    const generateAll = async () => {
      for (const artigo of artigosFaltando) {
        await generateFlashcardsForArtigo(artigo.numero);
        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setIsGenerating(false);
      setCurrentGeneratingArtigo(null);
      toast.success(`Geração concluída! ${artigosFaltando.length} artigos processados.`);
    };

    generateAll();
  }, [artigos, flashcardsExistentes]);

  const filteredArtigos = artigos?.filter((item) =>
    item.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar pelo id (ordem correta na tabela)
  const sortedArtigos = filteredArtigos?.sort((a, b) => a.id - b.id);

  if (!codigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  const areaName = getAreaName(codigo);
  const displayName = getDisplayName(codigo);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-lg shadow-lg"
            style={{ backgroundColor: cor, boxShadow: `0 0 20px ${cor}80` }}
          >
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um artigo para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Banner de geração automática */}
      {isGenerating && (
        <Card className="mb-4 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-amber-700/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">
                  Gerando flashcards automaticamente...
                </p>
                <p className="text-xs text-muted-foreground">
                  Art. {currentGeneratingArtigo} • {generatedCount}/{totalToGenerate} processados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Flashcards prontos</span>
        </div>
        <div className="flex items-center gap-1">
          <Scale className="w-4 h-4 text-amber-500" />
          <span>A gerar</span>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Gerando</span>
          </div>
        )}
      </div>

      {/* Flashcards Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">
          Flashcards Disponíveis ({totalFlashcardsDisponiveis})
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
          <div className="flex flex-col gap-2">
            {sortedArtigos?.map((item, index) => {
              // Comparar usando apenas o número extraído (ex: "1º" -> "1")
              const artigoNumero = extractArtigoNumber(item.numero);
              const temFlashcards = flashcardsExistentes?.has(artigoNumero);
              const isCurrentlyGenerating = currentGeneratingArtigo === item.numero;
              
              return (
                <Card
                  key={item.numero}
                  className={`cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 bg-card/90 backdrop-blur-sm group overflow-hidden relative opacity-0 ${isCurrentlyGenerating ? 'border-amber-500/50' : ''}`}
                  style={{
                    borderLeftColor: cor,
                    animation: `fade-in 0.4s ease-out forwards`,
                    animationDelay: `${Math.min(index * 50, 2000)}ms`,
                    boxShadow: temFlashcards ? `0 4px 20px -8px ${cor}60` : undefined
                  }}
                  onClick={() =>
                    navigate(`/flashcards/artigos-lei/estudar?codigo=${encodeURIComponent(codigo)}&artigo=${encodeURIComponent(item.numero)}`)
                  }
                >
                  <CardContent className="py-4 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCurrentlyGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: cor }} />
                      ) : temFlashcards ? (
                        <CheckCircle className="w-5 h-5" style={{ color: cor }} />
                      ) : (
                        <Scale className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-bold text-base">Art. {item.numero}</h3>
                        <p className="text-xs text-muted-foreground">{displayName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isCurrentlyGenerating ? "Gerando..." : temFlashcards ? "Flashcards prontos" : "A gerar"}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLeiTemas;
