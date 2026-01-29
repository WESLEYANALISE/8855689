import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Info, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StandardPageHeader from "@/components/StandardPageHeader";
import OABTrilhasReader from "@/components/oab/OABTrilhasReader";

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

interface Pagina {
  titulo: string;
  tipo: string;
  markdown: string;
}

interface ConteudoGerado {
  paginas?: Pagina[];
  resumo?: string;
  markdown?: string;
  exemplos?: any;
  termos?: any;
  flashcards?: Flashcard[];
  questoes?: Questao[];
}

const OABTrilhasSubtemaEstudo = () => {
  const { materiaId, topicoId, resumoId } = useParams();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState(15);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const parsedResumoId = resumoId ? parseInt(resumoId) : null;
  const parsedMateriaId = materiaId ? parseInt(materiaId) : null;
  const parsedTopicoId = topicoId ? parseInt(topicoId) : null;

  // Buscar dados do RESUMO com polling
  const { data: resumo, isLoading, refetch } = useQuery({
    queryKey: ["oab-resumo-estudo", parsedResumoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("*")
        .eq("id", parsedResumoId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!parsedResumoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Polling apenas para conteúdo, não para capa
      if (data && !data.conteudo_gerado) return 3000;
      return false;
    },
  });

  // Mutation para gerar capa manualmente
  const gerarCapaMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-capa-subtema-resumo", {
        body: { 
          resumo_id: parsedResumoId,
          titulo: resumo?.subtema,
          area: resumo?.area
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["oab-resumo-estudo", parsedResumoId] });
      toast.success("Capa gerada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao gerar capa. Tente novamente.");
    },
  });

  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingContent(true);
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-resumo-oab", {
        body: { resumo_id: parsedResumoId },
      });
      if (error) throw error;
      
      if (data?.status === "gerando") {
        let tentativas = 0;
        const maxTentativas = 60;
        
        while (tentativas < maxTentativas) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: resumoAtualizado } = await supabase
            .from("RESUMO")
            .select("conteudo_gerado")
            .eq("id", parsedResumoId!)
            .single();
          
          if (resumoAtualizado?.conteudo_gerado) {
            return { success: true, completed: true };
          }
          
          tentativas++;
        }
        
        throw new Error("Timeout ao aguardar geração de conteúdo");
      }
      
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["oab-resumo-estudo", parsedResumoId] });
      toast.success("Conteúdo gerado com sucesso!");
      setIsGeneratingContent(false);
    },
    onError: () => {
      toast.error("Erro ao gerar conteúdo");
      setIsGeneratingContent(false);
    },
  });

  // Gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (resumo && !resumo.conteudo_gerado && !gerarConteudoMutation.isPending && !isGeneratingContent) {
      gerarConteudoMutation.mutate();
    }
  }, [resumo?.id, resumo?.conteudo_gerado, isGeneratingContent]);

  // Parse conteudo_gerado
  const parseConteudoGerado = (): ConteudoGerado & { erro?: boolean; mensagem?: string; detalhe?: string; acao?: string } => {
    if (!resumo?.conteudo_gerado) return {};
    if (typeof resumo.conteudo_gerado === 'string') {
      try {
        return JSON.parse(resumo.conteudo_gerado);
      } catch {
        return {};
      }
    }
    return resumo.conteudo_gerado as ConteudoGerado;
  };
  
  const conteudoGerado = parseConteudoGerado();
  
  // Detectar se houve erro na geração (conteúdo fonte vazio)
  const isErroFonte = conteudoGerado.erro === true;
  
  // Extrair conteúdo das páginas (novo formato) ou fallback para formato antigo
  const extrairConteudoPrincipal = (): string => {
    // Se houver erro, retorna vazio
    if (isErroFonte) return "";
    // Novo formato: páginas
    if (conteudoGerado.paginas && conteudoGerado.paginas.length > 0) {
      return conteudoGerado.paginas.map(p => `## ${p.titulo}\n\n${p.markdown}`).join('\n\n---\n\n');
    }
    // Formato antigo: resumo ou markdown
    return conteudoGerado.resumo || conteudoGerado.markdown || resumo?.conteudo || "";
  };
  
  const conteudoPrincipal = extrairConteudoPrincipal();
  const flashcards: Flashcard[] = Array.isArray(conteudoGerado.flashcards) ? conteudoGerado.flashcards : [];
  const questoes: Questao[] = Array.isArray(conteudoGerado.questoes) ? conteudoGerado.questoes : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Estado de erro de fonte - conteúdo do PDF não disponível
  if (isErroFonte) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title={resumo?.subtema || "Erro"}
          subtitle={resumo?.area}
          backPath={`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${parsedTopicoId}`}
        />
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Info className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conteúdo Fonte Indisponível</h2>
          <p className="text-neutral-400 mb-2">
            {conteudoGerado.mensagem || "O texto extraído do PDF para este subtema não está disponível."}
          </p>
          {conteudoGerado.detalhe && (
            <p className="text-sm text-neutral-500 mb-4">
              {conteudoGerado.detalhe}
            </p>
          )}
          <p className="text-sm text-neutral-400 mb-6">
            {conteudoGerado.acao || "Volte ao tópico e reprocesse o PDF para corrigir."}
          </p>
          <Button
            onClick={() => window.history.back()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Voltar ao Tópico
          </Button>
        </div>
      </div>
    );
  }

  const isGerando = !resumo?.conteudo_gerado || gerarConteudoMutation.isPending || isGeneratingContent;

  // Estado de geração
  if (isGerando) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title={resumo?.subtema || "Carregando..."}
          subtitle={resumo?.area}
          backPath={`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${parsedTopicoId}`}
        />
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
          <p className="text-sm text-gray-400">
            A IA está criando o material de estudo para este subtema.
            <br />
            Isso pode levar alguns segundos.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar o Reader estilo Conceitos
  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader
        title={resumo?.subtema || "Carregando..."}
        subtitle={resumo?.area}
        backPath={`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${parsedTopicoId}`}
      />

      <OABTrilhasReader
        conteudoGerado={conteudoPrincipal}
        paginas={conteudoGerado.paginas}
        titulo={resumo?.subtema || ""}
        materia={resumo?.area}
        capaUrl={resumo?.url_imagem_resumo}
        flashcards={flashcards}
        questoes={questoes}
        topicoId={parsedResumoId || 0}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onGerarCapa={() => gerarCapaMutation.mutate()}
        isGeneratingCapa={gerarCapaMutation.isPending}
        correspondencias={(() => {
          // Extrair correspondências do campo termos ou dados_interativos das páginas
          const termos = conteudoGerado.termos as any;
          if (termos?.correspondencias && Array.isArray(termos.correspondencias)) {
            return termos.correspondencias;
          }
          // Fallback: se for array simples com termo/definicao
          if (Array.isArray(termos)) {
            return termos.filter((t: any) => t.termo && t.definicao);
          }
          // Fallback 2: buscar na página de correspondências
          const paginaCorr = conteudoGerado.paginas?.find((p: any) => p.tipo === 'correspondencias') as any;
          if (paginaCorr?.dados_interativos?.pares) {
            return paginaCorr.dados_interativos.pares.map((p: any) => ({
              termo: p.termo,
              definicao: p.definicao
            }));
          }
          return [];
        })()}
      />
    </div>
  );
};

export default OABTrilhasSubtemaEstudo;
