import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StandardPageHeader from "@/components/StandardPageHeader";
import FlashcardStack from "@/components/conceitos/FlashcardStack";

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

const OABTrilhasSubtemaFlashcards = () => {
  const { materiaId, topicoId, resumoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);

  // Buscar dados do RESUMO (subtema)
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["oab-resumo-flashcards", resumoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("id, subtema, area, tema, conteudo_gerado")
        .eq("id", parseInt(resumoId!))
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Extrair flashcards do conteudo_gerado
  const parseFlashcards = (): Flashcard[] => {
    if (!resumo?.conteudo_gerado) return [];
    
    const conteudo = typeof resumo.conteudo_gerado === 'string' 
      ? JSON.parse(resumo.conteudo_gerado)
      : resumo.conteudo_gerado;
    
    if (Array.isArray(conteudo?.flashcards)) {
      return conteudo.flashcards;
    }
    return [];
  };

  const flashcards = parseFlashcards();

  // Converter para formato esperado pelo FlashcardStack (incluindo exemplo)
  const flashcardsFormatados = flashcards.map(f => ({
    pergunta: f.frente,
    resposta: f.verso,
    exemplo: f.exemplo
  }));

  const backPath = `/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}`;

  // Marcar flashcards como completos
  const marcarCompleto = async () => {
    if (!user || !topicoId) return;
    
    try {
      await supabase
        .from('oab_trilhas_estudo_progresso')
        .upsert({
          user_id: user.id,
          topico_id: parseInt(topicoId),
          flashcards_completos: true,
          progresso_flashcards: 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
      
      setCompleted(true);
      toast.success("Flashcards concluídos! Questões desbloqueadas.");
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Flashcards"
          subtitle={resumo?.subtema}
          backPath={backPath}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-gray-400">Nenhum flashcard disponível para este subtema.</p>
          <Button
            onClick={() => navigate(backPath)}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Flashcards"
          subtitle={resumo?.subtema}
          backPath={backPath}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Flashcards Concluídos!</h2>
          <p className="text-gray-400 mb-6">Você completou todos os flashcards deste subtema.</p>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(backPath)}
              variant="outline"
            >
              Voltar ao Estudo
            </Button>
            <Button
              onClick={() => navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}/questoes`)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Ir para Questões →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader
        title="Flashcards"
        subtitle={resumo?.subtema}
        backPath={backPath}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progresso */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400">
            {flashcardsFormatados.length} flashcards disponíveis
          </p>
        </div>

        {/* Flashcards Stack com conclusão automática */}
        <FlashcardStack 
          flashcards={flashcardsFormatados}
          titulo={resumo?.subtema || "Flashcards"}
          onGoToQuestions={() => navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}/questoes`)}
          onComplete={marcarCompleto}
        />
      </div>
    </div>
  );
};

export default OABTrilhasSubtemaFlashcards;
