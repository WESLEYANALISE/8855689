import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Loader2, 
  BookOpen, 
  Lightbulb,
  BookMarked
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// 🔇 AUDIO/IMAGE DISABLED - Temporariamente desativado
// import { AudioPlayer } from "@/components/resumos/AudioPlayer";
// import { ImageWithZoom } from "@/components/resumos/ImageWithZoom";
import { FloatingControls } from "@/components/resumos/FloatingControls";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

// Mapeamento de código para nome da tabela
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

// Nome da área
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

const ResumosArtigosLeiView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const artigo = searchParams.get("artigo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // 🔇 AUDIO/IMAGE DISABLED - Estados de mídia removidos temporariamente
  // const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  // const [loadingImagem, setLoadingImagem] = useState<Record<string, boolean>>({});
  // const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  // const [imagemUrls, setImagemUrls] = useState<Map<string, string>>(new Map());

  // 🔇 AUDIO/IMAGE DISABLED - Refs de áudio removidos temporariamente
  // const audioResumoRef = useRef<HTMLAudioElement>(null);
  // const audioExemplosRef = useRef<HTMLAudioElement>(null);
  // const audioTermosRef = useRef<HTMLAudioElement>(null);

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
  const areaName = codigo ? getAreaName(codigo) : "";

  // Buscar resumo existente
  const { data: resumoData, isLoading, refetch } = useQuery({
    queryKey: ["resumo-artigo", codigo, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .select("*")
        .eq("area", areaName)
        .eq("tema", artigo)
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    },
    enabled: !!codigo && !!artigo,
  });

  // Gerar resumo se não existir
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-artigo-lei', {
        body: { tableName, artigo }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Resumo gerado com sucesso!");
        refetch();
      } else {
        throw new Error(data?.error || "Erro ao gerar resumo");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar resumo");
    } finally {
      setIsGenerating(false);
    }
  };

  // 🔇 AUDIO/IMAGE DISABLED - Funções de geração de mídia desativadas temporariamente
  // Para reativar, restaure as funções gerarImagem e gerarAudio originais

  // Compartilhar WhatsApp
  const compartilharWhatsApp = () => {
    if (!resumoData?.resumo_markdown) return;

    const textoFormatado = formatForWhatsApp(resumoData.resumo_markdown);
    const cabecalho = `╔═══════════════════╗
📚 *RESUMO - ARTIGO DE LEI*
╚═══════════════════╝

🎯 *Lei:* ${areaName}
📖 *Artigo:* ${artigo}

━━━━━━━━━━━━━━━━━━━━`;

    const rodape = `━━━━━━━━━━━━━━━━━━━━

✨ _Gerado pelo Direito Premium_
📱 _Seu app de estudos jurídicos_`;

    const mensagem = `${cabecalho}\n\n${textoFormatado}\n\n${rodape}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
    toast.success("Abrindo WhatsApp");
  };

  // Gerar automaticamente se não existir
  useEffect(() => {
    if (!isLoading && !resumoData?.resumo_markdown && !isGenerating) {
      handleGenerate();
    }
  }, [isLoading, resumoData]);

  if (!codigo || !artigo) {
    navigate("/resumos-juridicos/artigos-lei");
    return null;
  }

  // 🔇 AUDIO/IMAGE DISABLED - Renderizar exemplos SEM imagens (temporariamente)
  const renderExemplosComImagens = () => {
    if (!resumoData?.exemplos) return null;

    const exemplosText = resumoData.exemplos;
    const partes = exemplosText.split(/(?=##\s*Exemplo\s*\d+)/i).filter(Boolean);

    return (
      <div className="space-y-6">
        {partes.map((parte, index) => {
          const exemploNum = index + 1;
          if (exemploNum > 3) return null;

          return (
            <div key={exemploNum} className="space-y-3">
              {/* Texto do exemplo - IMAGEM DESATIVADA */}
              <div className="resumo-content resumo-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parte}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`px-3 py-4 max-w-4xl mx-auto pb-8 resumo-font-size-${fontSizeLevel}`}>
      {/* Floating Controls */}
      <FloatingControls onFontSizeChange={setFontSizeLevel} />
      {/* 🔇 AUDIO/IMAGE DISABLED - Hidden audio elements removidos temporariamente */}

      {/* Header */}
      <div className="mb-6">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{areaName}</h1>
            <p className="text-sm text-muted-foreground">
              Artigo {artigo}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {(isLoading || isGenerating) && (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">
              {isGenerating ? "Gerando resumo..." : "Carregando..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {isGenerating && "Isso pode levar alguns segundos"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo */}
      {!isLoading && !isGenerating && resumoData?.resumo_markdown && (
        <>
          {/* Botões de ação */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={compartilharWhatsApp}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="resumo" className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="exemplos" className="flex items-center gap-1">
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Exemplos</span>
              </TabsTrigger>
              <TabsTrigger value="termos" className="flex items-center gap-1">
                <BookMarked className="w-4 h-4" />
                <span className="hidden sm:inline">Termos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <Card>
                <CardContent className="pt-6">
                  {/* 🔇 AUDIO/IMAGE DISABLED - Imagem do resumo desativada temporariamente */}
                  <div className="resumo-content resumo-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {resumoData.resumo_markdown}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exemplos">
              <Card>
                <CardContent className="pt-6">
                  {renderExemplosComImagens()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="termos">
              <Card>
                <CardContent className="pt-6">
                  <div className="resumo-content resumo-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {resumoData.termos || "Termos não disponíveis"}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

    </div>
  );
};

export default ResumosArtigosLeiView;
