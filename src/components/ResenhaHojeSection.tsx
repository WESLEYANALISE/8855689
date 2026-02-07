import { memo, useCallback } from "react";
import { ScrollText, ArrowRight, Loader2, Scale, FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ResenhaHojeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

interface LeiRecente {
  id: string;
  numero_lei: string;
  tipo_ato: string | null;
  ementa: string | null;
  data_dou: string | null;
}

// Mapeamento de cores por tipo de ato
const tipoAtoCores: Record<string, string> = {
  'Lei': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Decreto': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Lei Complementar': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Medida Provisória': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Resolução': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export const ResenhaHojeSection = memo(({ isDesktop, navigate, handleLinkHover }: ResenhaHojeSectionProps) => {
  // Buscar leis mais recentes de hoje ou últimos dias
  const { data: leisRecentes, isLoading, error } = useQuery({
    queryKey: ['resenha-hoje'],
    queryFn: async () => {
      // Buscar as 10 leis mais recentes com texto_formatado
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('id, numero_lei, tipo_ato, ementa, data_dou')
        .not('texto_formatado', 'is', null)
        .order('data_dou', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []) as LeiRecente[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const handleLeiClick = useCallback((lei: LeiRecente) => {
    navigate(`/vade-mecum/resenha/${lei.id}`);
  }, [navigate]);

  const getTipoAtoColor = (tipoAto: string | null) => {
    if (!tipoAto) return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    return tipoAtoCores[tipoAto] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getTipoAtoIcon = (tipoAto: string | null) => {
    if (tipoAto === 'Lei' || tipoAto === 'Lei Complementar') return Scale;
    return FileText;
  };

  return (
    <div className="space-y-3" data-tutorial="resenha-diaria">
      {/* Header FORA do container */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <ScrollText className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-orange-200 tracking-tight">
              Resenha Diária
            </h3>
            <p className="text-white/70 text-xs">
              Últimas leis atualizadas
            </p>
          </div>
        </div>
        
        {/* Botão Ver tudo */}
        <button
          onClick={() => handleNavigate('/vade-mecum/resenha-diaria')}
          onMouseEnter={() => handleLinkHover('/vade-mecum/resenha-diaria')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
        >
          <span>Ver tudo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container laranja */}
      <div className="bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950/95 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-orange-800/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-300" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-orange-300/70">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">Erro ao carregar leis</p>
          </div>
        ) : !leisRecentes || leisRecentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-orange-300/70">
            <ScrollText className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma lei disponível</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className={`flex gap-3 pb-2 ${isDesktop ? '' : 'touch-pan-x'}`}>
              {leisRecentes.map((lei) => {
                const Icon = getTipoAtoIcon(lei.tipo_ato);
                return (
                  <button
                    key={lei.id}
                    onClick={() => handleLeiClick(lei)}
                    className={`flex-shrink-0 bg-white/10 rounded-xl p-3 text-left transition-all duration-150 hover:bg-white/15 border border-white/10 hover:border-orange-400/30 overflow-hidden relative group ${isDesktop ? 'w-[200px]' : 'w-[180px]'}`}
                  >
                    {/* Badge tipo de ato */}
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border mb-2 ${getTipoAtoColor(lei.tipo_ato)}`}>
                      <Icon className="w-3 h-3" />
                      <span>{lei.tipo_ato || 'Ato'}</span>
                    </div>
                    
                    {/* Número da lei */}
                    <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1 group-hover:text-orange-200 transition-colors">
                      {lei.numero_lei}
                    </h4>
                    
                    {/* Ementa resumida */}
                    <p className="text-white/60 text-[11px] leading-snug line-clamp-3">
                      {lei.ementa || 'Sem descrição'}
                    </p>
                    
                    {/* Data */}
                    {lei.data_dou && (
                      <p className="text-orange-300/60 text-[10px] mt-2">
                        {format(new Date(lei.data_dou), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
});

ResenhaHojeSection.displayName = 'ResenhaHojeSection';

export default ResenhaHojeSection;
