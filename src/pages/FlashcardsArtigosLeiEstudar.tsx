import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Scale } from "lucide-react";
import { FlashcardViewer, FlashcardSettings } from "@/components/FlashcardViewer";
import { FlashcardSettingsModal } from "@/components/FlashcardSettingsModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

const FlashcardsArtigosLeiEstudar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const artigo = searchParams.get("artigo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<FlashcardSettings | null>(null);

  const tableName = codigo ? getTableName(codigo) : "";
  const areaName = codigo ? getAreaName(codigo) : "";

  // 1. Buscar flashcards do cache (tabela FLASHCARDS - ARTIGOS LEI)
  const { data: flashcardsCache, isLoading: isLoadingCache, refetch: refetchCache } = useQuery({
    queryKey: ["flashcards-cache", areaName, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("*")
        .eq("area", areaName)
        .eq("tema", parseInt(artigo as string));

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          front: row.pergunta || "",
          back: row.resposta || "",
          exemplo: row.exemplo || undefined,
          base_legal: row.base_legal || undefined,
          url_imagem_exemplo: row.url_imagem_exemplo || undefined,
          url_audio_exemplo: row.url_audio_exemplo || undefined,
          "audio-pergunta": row["audio-pergunta"] || undefined,
          "audio-resposta": row["audio-resposta"] || undefined,
        }));
      }
      return null;
    },
    enabled: !!codigo && !!artigo,
  });

  // 2. Buscar conteúdo do artigo do Vade Mecum (para gerar flashcards se necessário)
  const { data: artigoContent } = useQuery({
    queryKey: ["artigo-content", tableName, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq('"Número do Artigo"', artigo)
        .maybeSingle();

      if (error) throw error;
      return data as { Artigo?: string; "Número do Artigo"?: string } | null;
    },
    enabled: !!tableName && !!artigo && !flashcardsCache,
  });

  // 3. Mutation para gerar flashcards via edge function
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!artigoContent?.Artigo) {
        throw new Error("Conteúdo do artigo não encontrado");
      }

      const { data, error } = await supabase.functions.invoke('gerar-flashcards', {
        body: {
          content: artigoContent.Artigo,
          tableName: codigo,
          numeroArtigo: artigo,
          area: areaName,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards-cache", areaName, artigo] });
      queryClient.invalidateQueries({ queryKey: ["flashcards-existentes", codigo] });
      refetchCache();
    },
    onError: (error) => {
      console.error("Erro ao gerar flashcards:", error);
      toast.error("Erro ao gerar flashcards. Tente novamente.");
    },
  });

  // Se não tem cache e tem conteúdo do artigo, gerar automaticamente
  useEffect(() => {
    if (flashcardsCache === null && artigoContent && !isGenerating && !generateMutation.isPending) {
      setIsGenerating(true);
      generateMutation.mutate();
    }
  }, [flashcardsCache, artigoContent, isGenerating, generateMutation.isPending]);

  // Mostrar modal de configurações quando flashcards estiverem prontos
  useEffect(() => {
    if (flashcardsCache && flashcardsCache.length > 0 && !settings) {
      setShowSettingsModal(true);
    }
  }, [flashcardsCache, settings]);

  const handleSettingsConfirm = (newSettings: FlashcardSettings) => {
    setSettings(newSettings);
    setShowSettingsModal(false);
  };

  if (!codigo || !artigo) {
    navigate("/flashcards/artigos-lei");
    return null;
  }

  // Loading estado inicial
  if (isLoadingCache) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Gerando flashcards
  if (generateMutation.isPending || (flashcardsCache === null && artigoContent)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95 gap-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-amber-500 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground text-center px-4">
          Gerando flashcards para o Art. {artigo}...
          <br />
          <span className="text-xs">Isso pode levar alguns segundos</span>
        </p>
      </div>
    );
  }

  // Nenhum flashcard encontrado e sem conteúdo para gerar
  if (!flashcardsCache || flashcardsCache.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os flashcards para o Art. {artigo}
          </p>
          <button 
            onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`)}
            className="text-primary underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tema = `${areaName} - Art. ${artigo}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-24">
      {/* Modal de configurações */}
      <FlashcardSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onStart={handleSettingsConfirm}
        totalFlashcards={flashcardsCache.length}
        tema={tema}
        onBack={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(codigo || '')}`)}
      />

      <div className="max-w-4xl mx-auto px-3 py-4">
        {settings ? (
          <FlashcardViewer flashcards={flashcardsCache} tema={tema} settings={settings} tabela="artigos-lei" codigoNome={areaName} numeroArtigo={artigo || undefined} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Button onClick={() => setShowSettingsModal(true)}>
              Configurar Estudo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLeiEstudar;
