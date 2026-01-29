import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, BookOpen, ArrowLeft, Loader2, Layers, ImageIcon, CheckCircle2, FileText, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PdfProcessorModal } from "@/components/conceitos/PdfProcessorModal";
import { useConceitosAutoGeneration } from "@/hooks/useConceitosAutoGeneration";

const ConceitosMateria = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Buscar matéria
  const { data: materia, isLoading: loadingMateria } = useQuery({
    queryKey: ["conceitos-materia", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("id", parseInt(id!))
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Buscar tópicos com refetch para acompanhar geração
  const { data: topicos, isLoading: loadingTopicos, refetch: refetchTopicos } = useQuery({
    queryKey: ["conceitos-topicos", materia?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_topicos")
        .select("*")
        .eq("materia_id", materia!.id)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!materia?.id,
    // Polling rápido quando há geração ativa
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActiveGeneration = data?.some(t => 
        t.status === "gerando" || t.status === "na_fila"
      );
      return hasActiveGeneration ? 2000 : false;
    },
  });

  // Hook de auto-geração
  const {
    isGenerating,
    currentGeneratingId,
    currentGeneratingTitle,
    currentProgress,
    totalTopicos,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus
  } = useConceitosAutoGeneration({
    materiaId: materia?.id || null,
    topicos: topicos?.map(t => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status,
      progresso: t.progresso,
      ordem: t.ordem
    })),
    enabled: !!materia?.id && !!topicos?.length
  });

  // Buscar progresso do usuário
  const { data: progressoData } = useQuery({
    queryKey: ["conceitos-progresso-materia", materia?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !topicos?.length) return [];
      
      const topicoIds = topicos.map(t => t.id);
      const { data, error } = await (supabase as any)
        .from('conceitos_topicos_progresso')
        .select('topico_id, leitura_completa, flashcards_completos, pratica_completa')
        .eq('user_id', user.id)
        .in('topico_id', topicoIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!topicos?.length,
  });

  // Contar tópicos concluídos pelo usuário
  const concluidosUsuario = useMemo(() => {
    if (!progressoData) return 0;
    return progressoData.filter((p: any) => 
      p.leitura_completa && p.flashcards_completos && p.pratica_completa
    ).length;
  }, [progressoData]);
  
  const percentualUsuario = totalTopicos > 0 ? Math.round(concluidosUsuario / totalTopicos * 100) : 0;
  const isLoading = loadingMateria || loadingTopicos;

  // Helper para renderizar status badge
  const renderStatusBadge = (topicoId: number, status: string | null, progresso: number | null, posicaoFila: number | null) => {
    if (status === "gerando") {
      return (
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{progresso || 0}%</span>
        </div>
      );
    }
    if (status === "na_fila") {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <Clock className="w-3 h-3" />
          <span>#{posicaoFila}</span>
        </div>
      );
    }
    if (status === "erro") {
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
        </div>
      );
    }
    if (status === "concluido") {
      return (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 className="w-3 h-3" />
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/conceitos/trilhante')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>
      
      {/* Header da Matéria */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          {materia && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Layers className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {materia.codigo}
                  </span>
                  <h1 className="text-lg font-bold mt-1">{materia.nome}</h1>
                </div>
              </div>
              
              {/* Barra de progresso da geração */}
              {isGenerating && currentGeneratingTitle && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Gerando conteúdo...</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {currentGeneratingTitle}
                  </p>
                  <Progress value={currentProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentProgress}% • {concluidos}/{totalTopicos} tópicos prontos
                  </p>
                </div>
              )}
              
              {/* Barra de progresso do usuário */}
              {totalTopicos > 0 && !isGenerating && (
                <div className="bg-card rounded-xl p-4 border border-border mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {percentualGeral === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : null}
                      <span className="text-sm text-muted-foreground">
                        {percentualGeral === 100 ? 'Todos prontos!' : 'Conteúdo gerado'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{concluidos}/{totalTopicos}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${percentualGeral}%` }} 
                      transition={{ duration: 0.5 }} 
                      className={`h-full rounded-full ${
                        percentualGeral === 100 
                          ? 'bg-gradient-to-r from-green-500 to-green-400' 
                          : 'bg-gradient-to-r from-primary to-primary/60'
                      }`} 
                    />
                  </div>
                  {pendentes > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {pendentes} tópico(s) pendente(s) serão gerados automaticamente
                    </p>
                  )}
                </div>
              )}
              
              {materia.ementa && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {materia.ementa}
                </p>
              )}

              {/* Botão de configurar/reprocessar PDF - sempre visível */}
              <Button 
                onClick={() => setShowPdfModal(true)}
                className="w-full mt-4"
                variant={topicos && topicos.length > 0 ? 'outline' : 'default'}
              >
                <FileText className="w-4 h-4 mr-2" />
                {topicos && topicos.length > 0 ? 'Reprocessar PDF / Extrair Tópicos' : 'Configurar PDF do Livro'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal de PDF */}
      {materia && (
        <PdfProcessorModal
          open={showPdfModal}
          onOpenChange={setShowPdfModal}
          materiaId={materia.id}
          materiaNome={materia.nome}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["conceitos-materia", id] });
            queryClient.invalidateQueries({ queryKey: ["conceitos-topicos"] });
          }}
        />
      )}

      {/* Lista de Tópicos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Conteúdo Programático
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {topicos?.map((topico, index) => {
                const temConteudo = topico.status === "concluido";
                const statusInfo = getTopicoStatus(topico.id);
                
                return (
                  <motion.button
                    key={topico.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => navigate(`/conceitos/topico/${topico.id}`)}
                    className={`w-full text-left border rounded-xl transition-all overflow-hidden ${
                      topico.status === "gerando" 
                        ? "bg-amber-500/5 border-amber-500/30" 
                        : topico.status === "na_fila"
                        ? "bg-blue-500/5 border-blue-500/30"
                        : topico.status === "erro"
                        ? "bg-destructive/5 border-destructive/30"
                        : "bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700/50"
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Capa */}
                      <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-800 rounded-l-xl overflow-hidden">
                        {topico.capa_url ? (
                          <img 
                            src={topico.capa_url} 
                            alt={topico.titulo}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800">
                            <ImageIcon className="w-6 h-6 text-neutral-500" />
                          </div>
                        )}
                        {/* Número */}
                        <div className="absolute bottom-0 left-0 bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                          {String(topico.ordem).padStart(2, '0')}
                        </div>
                        
                        {/* Indicador de geração sobreposto */}
                        {topico.status === "gerando" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <h3 className="text-sm font-medium leading-snug text-neutral-100 flex-1">
                            {topico.titulo}
                          </h3>
                          {renderStatusBadge(topico.id, topico.status, topico.progresso, topico.posicao_fila)}
                        </div>
                        
                        {/* Barra de progresso inline durante geração */}
                        {topico.status === "gerando" && topico.progresso > 0 && (
                          <div className="mt-2">
                            <Progress value={topico.progresso} className="h-1" />
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 mr-3" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
          
          {!isLoading && (!topicos || topicos.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum tópico encontrado</p>
              <p className="text-sm mt-2">Configure o PDF para extrair os tópicos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConceitosMateria;
