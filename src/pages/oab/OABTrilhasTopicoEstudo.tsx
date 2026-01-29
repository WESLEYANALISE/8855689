import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Info, Clock, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface QueueInfo {
  totalNaFila: number;
  posicaoAtual: number | null;
}

const OABTrilhasTopicoEstudo = () => {
  const { id, materiaId, topicoId } = useParams();
  const targetId = id || topicoId;
  
  const [fontSize, setFontSize] = useState(15);
  const [isGeracaoTravada, setIsGeracaoTravada] = useState(false);

  // Buscar informações da fila
  const { data: queueInfo } = useQuery<QueueInfo>({
    queryKey: ["oab-trilha-queue-info", targetId],
    queryFn: async () => {
      // Contar total na fila
      const { count: totalNaFila } = await supabase
        .from("oab_trilhas_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");

      // Buscar posição deste tópico se estiver na fila
      const { data: topico } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", parseInt(targetId!))
        .single();

      return {
        totalNaFila: totalNaFila || 0,
        posicaoAtual: topico?.status === "na_fila" ? topico.posicao_fila : null,
      };
    },
    refetchInterval: 3000, // Atualizar a cada 3s
  });

  // Buscar dados do tópico
  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["oab-trilha-topico-estudo", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_topicos")
        .select(`
          *,
          materia:oab_trilhas_materias(*)
        `)
        .eq("id", parseInt(targetId!))
        .single();

      if (error) throw error;
      
      if (data?.status === "gerando" && data?.updated_at) {
        const updatedAt = new Date(data.updated_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - updatedAt) / (1000 * 60);
        setIsGeracaoTravada(diffMinutes > 5);
      } else {
        setIsGeracaoTravada(false);
      }
      
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando" || data?.status === "na_fila") return 3000;
      if (data?.status === "concluido" && !data?.capa_url) return 5000;
      return false;
    },
  });

  // Mutation para gerar conteúdo
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-oab-trilhas", {
        body: { topico_id: parseInt(targetId!) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setIsGeracaoTravada(false);
      refetch();
      
      if (data?.queued) {
        toast.info(`Adicionado à fila - Posição ${data.position}`);
      } else if (data?.requeued) {
        toast.warning(`Conteúdo incompleto, reprocessando...`);
      } else {
        toast.success(data?.message || "Conteúdo gerado com sucesso!");
      }
    },
    onError: () => {
      setIsGeracaoTravada(false);
      refetch();
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    },
  });

  // Gerar conteúdo automaticamente se não existir
  if (topico?.status === "pendente" && !gerarConteudoMutation.isPending) {
    gerarConteudoMutation.mutate();
  }

  const flashcards: Flashcard[] = (topico?.flashcards as unknown as Flashcard[]) || [];
  const questoes: Questao[] = (topico?.questoes as unknown as Questao[]) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const isNaFila = topico?.status === "na_fila";
  const isGerando = topico?.status === "gerando" || gerarConteudoMutation.isPending;
  const isEtica = topico?.materia?.nome?.toLowerCase().includes("ética");
  const accentColor = isEtica ? "amber" : "red";

  // Estado de fila
  if (isNaFila) {
    const posicao = queueInfo?.posicaoAtual || topico?.posicao_fila || 1;
    const total = queueInfo?.totalNaFila || 1;
    const progressPercent = total > 1 ? ((total - posicao + 1) / total) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title={topico?.titulo || "Carregando..."}
          subtitle={topico?.materia?.nome}
          backPath={materiaId && topicoId 
            ? `/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}` 
            : topico?.materia?.id 
              ? `/oab/trilhas-aprovacao/materia/${topico.materia.id}` 
              : undefined}
        />
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${accentColor}-500/20 flex items-center justify-center`}>
            <Clock className={`w-8 h-8 text-${accentColor}-400 animate-pulse`} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Aguardando na fila...</h2>
          <p className="text-neutral-400 mb-4">
            Outro conteúdo está sendo gerado no momento.
          </p>
          
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ListOrdered className="w-4 h-4 text-neutral-500" />
              <span className={`text-lg font-bold text-${accentColor}-400`}>
                Posição: {posicao} de {total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          <p className="text-xs text-neutral-500">
            {topico?.tentativas && topico.tentativas > 0 
              ? `Tentativa ${topico.tentativas + 1} de 3`
              : "A geração iniciará automaticamente"}
          </p>
        </div>
      </div>
    );
  }

  // Estado de geração
  if (isGerando) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title={topico?.titulo || "Carregando..."}
          subtitle={topico?.materia?.nome}
          backPath={materiaId && topicoId 
            ? `/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}` 
            : topico?.materia?.id 
              ? `/oab/trilhas-aprovacao/materia/${topico.materia.id}` 
              : undefined}
        />
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          {!isGeracaoTravada ? (
            <>
              <Loader2 className={`w-12 h-12 animate-spin text-${accentColor}-500 mb-4`} />
              <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
              <p className="text-sm text-gray-400">
                A IA está criando o material de estudo para este tópico.
                <br />
                Isso pode levar alguns segundos.
              </p>
              
              {topico?.progresso && topico.progresso > 0 && (
                <div className="w-full max-w-xs mt-4">
                  <Progress value={topico.progresso} className="h-2" />
                  <p className="text-xs text-neutral-500 mt-1">{topico.progresso}%</p>
                </div>
              )}
              
              {queueInfo && queueInfo.totalNaFila > 0 && (
                <p className="text-xs text-neutral-500 mt-4">
                  {queueInfo.totalNaFila} item(ns) aguardando na fila
                </p>
              )}
            </>
          ) : (
            <>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${accentColor}-500/20 flex items-center justify-center`}>
                <Info className={`w-8 h-8 text-${accentColor}-400`} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Geração demorando mais que o esperado</h2>
              <p className="text-neutral-400 mb-4">
                A geração está demorando mais de 5 minutos.
                <br />
                Você pode tentar novamente.
              </p>
              <Button
                onClick={() => {
                  setIsGeracaoTravada(false);
                  gerarConteudoMutation.mutate();
                }}
                className={`bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Renderizar o novo Reader
  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader
        title={topico?.titulo || "Carregando..."}
        subtitle={topico?.materia?.nome}
        backPath={materiaId && topicoId 
          ? `/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}` 
          : topico?.materia?.id 
            ? `/oab/trilhas-aprovacao/materia/${topico.materia.id}` 
            : undefined}
      />

      <OABTrilhasReader
        conteudoGerado={topico?.conteudo_gerado || ""}
        titulo={topico?.titulo || ""}
        materia={topico?.materia?.nome}
        capaUrl={topico?.materia?.capa_url || topico?.capa_url}
        flashcards={flashcards}
        questoes={questoes}
        topicoId={parseInt(targetId!)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        correspondencias={(() => {
          // Extrair correspondências do campo termos (pode ser array legado ou objeto com correspondencias)
          const termos = topico?.termos as any;
          if (termos?.correspondencias && Array.isArray(termos.correspondencias)) {
            return termos.correspondencias;
          }
          // Fallback: se for array simples, usar como correspondências
          if (Array.isArray(termos)) {
            return termos.filter((t: any) => t.termo && t.definicao);
          }
          return [];
        })()}
      />
    </div>
  );
};

export default OABTrilhasTopicoEstudo;
