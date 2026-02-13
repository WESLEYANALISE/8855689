import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import ExplicacaoModal from "./ExplicacaoModal";

interface Explicacao {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  conteudo_gerado: string | null;
  conteudo_descomplicado?: string | null;
  url_capa: string | null;
  url_audio: string | null;
  url_audio_descomplicado?: string | null;
}

const ExplicacoesList = () => {
  const [explicacoes, setExplicacoes] = useState<Explicacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExplicacao, setSelectedExplicacao] = useState<Explicacao | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { isPremium } = useSubscription();

  const FREE_LIMIT = 3;

  useEffect(() => {
    fetchExplicacoes();
  }, []);

  const fetchExplicacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("lei_seca_explicacoes")
        .select("*")
        .order("ordem");

      if (error) throw error;
      setExplicacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar explicações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleExplicacaoClick = (explicacao: Explicacao, index: number) => {
    if (!isPremium && index >= FREE_LIMIT) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedExplicacao(explicacao);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Recarregar para atualizar dados (capa, áudio)
    fetchExplicacoes();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Aprenda com o Vade Mecum X</h3>
          <p className="text-sm text-muted-foreground">
            {explicacoes.length} artigos educativos sobre legislação
          </p>
        </div>
      </div>

      {/* Lista de Artigos */}
      <div className="space-y-3">
        {explicacoes.map((explicacao, index) => {
          const isLocked = !isPremium && index >= FREE_LIMIT;
          return (
          <motion.div
            key={explicacao.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className={`cursor-pointer transition-colors border-border/50 overflow-hidden ${isLocked ? 'opacity-60' : 'hover:bg-accent/50'} bg-card/80 backdrop-blur-sm`}
              onClick={() => handleExplicacaoClick(explicacao, index)}
            >
              <CardContent className="p-0">
                <div className="flex gap-3 relative">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center relative overflow-hidden">
                    {explicacao.url_capa ? (
                      <img
                        src={explicacao.url_capa}
                        alt={explicacao.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-amber-400/60">
                        {explicacao.ordem}
                      </span>
                    )}
                    {/* Número no canto */}
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {explicacao.ordem}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 py-2 pr-3 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-tight">
                        {explicacao.titulo}
                      </h4>
                      {!explicacao.conteudo_gerado && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] px-1.5 py-0 h-5 border-amber-500/50 text-amber-500"
                        >
                          <Sparkles className="w-3 h-3 mr-0.5" />
                          Novo
                        </Badge>
                      )}
                    </div>
                    {explicacao.descricao_curta && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {explicacao.descricao_curta}
                      </p>
                    )}
                  </div>
                  {/* Lock overlay */}
                  {isLocked && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-amber-500/20 px-2 py-1 rounded-full">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-400">Premium</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <ExplicacaoModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        explicacao={selectedExplicacao}
      />

      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Este conteúdo"
      />
    </div>
  );
};

export default ExplicacoesList;
