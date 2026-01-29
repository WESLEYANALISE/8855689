import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Componente temporário para popular proposições manualmente
 * Chamar a função apenas uma vez quando o cache estiver vazio
 */
const PopularProposicoesManual = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [alreadyPopulated, setAlreadyPopulated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAndPopulate = async () => {
      // Verificar se já foi populado nesta sessão
      if (alreadyPopulated || isPopulating) return;

      try {
        // Verificar se existem dados no cache E se estão completos (com autor e foto)
        const { data: plsData } = await supabase
          .from('cache_proposicoes_recentes')
          .select('id_proposicao, autor_principal_nome, autor_principal_foto')
          .limit(10);

        const { data: plpsData } = await supabase
          .from('cache_plp_recentes')
          .select('id_proposicao, autor_principal_nome, autor_principal_foto')
          .limit(5);

        // Verificar se os dados estão COMPLETOS (com autor e foto)
        const plsDadosCompletos = plsData && plsData.length > 0 && 
          plsData.some(p => p.autor_principal_nome && p.autor_principal_foto);
        
        const plpsDadosCompletos = plpsData && plpsData.length > 0 && 
          plpsData.some(p => p.autor_principal_nome && p.autor_principal_foto);

        // Se já tem dados completos, não precisa popular
        if (plsDadosCompletos || plpsDadosCompletos) {
          console.log('✅ Cache já possui dados completos, não é necessário popular');
          setAlreadyPopulated(true);
          return;
        }

        // Se tem dados mas estão incompletos, limpar cache antes
        if ((plsData && plsData.length > 0) || (plpsData && plpsData.length > 0)) {
          console.log('⚠️ Cache possui dados incompletos, forçando limpeza e repopulação...');
        }

        // Cache vazio, popular agora
        console.log('🚀 Iniciando população automática do cache...');
        setIsPopulating(true);

        const { data, error } = await supabase.functions.invoke('popular-proposicoes-manual');

        if (error) throw error;

        console.log('✅ Proposições populadas com sucesso:', data);
        setAlreadyPopulated(true);
        
        toast({
          title: "Proposições carregadas!",
          description: `${data.stats?.total || 0} proposições adicionadas ao cache.`,
        });

        // Recarregar a página para atualizar os carrosséis
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error('Erro ao popular proposições:', error);
        toast({
          title: "Erro ao carregar proposições",
          description: "Não foi possível popular o cache. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsPopulating(false);
      }
    };

    // Executar após 2 segundos para garantir que as outras queries já tentaram
    const timeout = setTimeout(() => {
      checkAndPopulate();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [alreadyPopulated, isPopulating, toast]);

  if (!isPopulating) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg flex items-center gap-3 z-50">
      <Loader2 className="w-5 h-5 animate-spin text-accent" />
      <div className="text-sm">
        <p className="font-medium text-foreground">Carregando proposições...</p>
        <p className="text-muted-foreground text-xs">Buscando dados da Câmara dos Deputados</p>
      </div>
    </div>
  );
};

export default PopularProposicoesManual;
