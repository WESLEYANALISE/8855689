import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Scale, ArrowRight, Loader2, CalendarX } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface LeiRecente {
  id: string;
  tipo: string;
  numero: string;
  data_publicacao: string;
  ementa: string;
  areas_direito?: string[] | null;
}

// Gerar tags automáticas baseadas no tipo e ementa
const gerarTags = (lei: LeiRecente): string[] => {
  const tags: string[] = [];
  const ementa = lei.ementa.toLowerCase();
  const tipo = lei.tipo.toLowerCase();
  
  if (tipo.includes('decreto')) tags.push('Decreto');
  else if (tipo.includes('complementar')) tags.push('LC');
  else if (tipo.includes('ordinária') || tipo.includes('lei')) tags.push('Lei');
  else if (tipo.includes('medida')) tags.push('MP');
  else tags.push(lei.tipo.split(' ')[0]);
  
  if (ementa.includes('tribut') || ementa.includes('fiscal') || ementa.includes('imposto')) tags.push('Tributário');
  else if (ementa.includes('penal') || ementa.includes('crime') || ementa.includes('pena')) tags.push('Penal');
  else if (ementa.includes('trabalh') || ementa.includes('emprego') || ementa.includes('clt')) tags.push('Trabalhista');
  else if (ementa.includes('civil') || ementa.includes('contrato')) tags.push('Civil');
  else if (ementa.includes('constituc')) tags.push('Constitucional');
  else if (ementa.includes('ambiente') || ementa.includes('ambiental')) tags.push('Ambiental');
  else if (ementa.includes('saúde') || ementa.includes('sus')) tags.push('Saúde');
  else if (ementa.includes('educação') || ementa.includes('ensino')) tags.push('Educação');
  else if (ementa.includes('previdên') || ementa.includes('aposentad')) tags.push('Previdência');
  else if (ementa.includes('consumidor')) tags.push('Consumidor');
  else if (ementa.includes('denomina') || ementa.includes('rodovia') || ementa.includes('homenagem')) tags.push('Honorífico');
  else if (ementa.includes('crédito') || ementa.includes('orçament')) tags.push('Orçamentário');
  else tags.push('Geral');
  
  if (ementa.includes('altera') || ementa.includes('alteração')) tags.push('Alteração');
  else if (ementa.includes('revoga')) tags.push('Revogação');
  else if (ementa.includes('institui') || ementa.includes('cria')) tags.push('Novo');
  else if (ementa.includes('regulament')) tags.push('Regulamenta');
  else tags.push('Publicado');
  
  return tags.slice(0, 3);
};

// Obter data/hora atual no fuso de Brasília (UTC-3)
const getDataHoraSaoPaulo = (): { year: number; month: number; day: number } => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utc - (3 * 60 * 60 * 1000));
  
  return {
    year: brasiliaTime.getFullYear(),
    month: brasiliaTime.getMonth() + 1,
    day: brasiliaTime.getDate()
  };
};

const getHojeSaoPaulo = (): string => {
  const { year, month, day } = getDataHoraSaoPaulo();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

export default function ResenhaDiariaCarousel() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNoDataToast, setShowNoDataToast] = useState(false);

  // Gerar últimos 5 dias
  const diasDisponiveis = useMemo(() => {
    const dias: { dataStr: string; diaSemana: string; diaNum: string; mes: string }[] = [];
    const hojeSP = getHojeSaoPaulo();
    const [year, month, day] = hojeSP.split('-').map(Number);
    const hojeDate = new Date(year, month - 1, day);
    
    for (let i = 0; i < 5; i++) {
      const date = subDays(hojeDate, i);
      const dataStr = format(date, 'yyyy-MM-dd');
      const diaSemana = format(date, 'EEE', { locale: ptBR }).toUpperCase();
      
      dias.push({
        dataStr,
        diaSemana: i === 0 ? "HOJE" : diaSemana,
        diaNum: format(date, 'dd'),
        mes: format(date, 'MMM', { locale: ptBR }).toUpperCase()
      });
    }
    return dias;
  }, []);

  // Buscar quais datas têm leis disponíveis
  const { data: datasComLeis } = useQuery({
    queryKey: ['datas-com-leis'],
    queryFn: async () => {
      const datas = diasDisponiveis.map(d => d.dataStr);
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('data_publicacao')
        .in('data_publicacao', datas);

      if (error) throw error;
      const datasUnicas = [...new Set((data || []).map(d => d.data_publicacao).filter(Boolean))];
      return datasUnicas as string[];
    },
    staleTime: 1000 * 60 * 5
  });

  // Selecionar automaticamente a primeira data que tem leis
  useEffect(() => {
    if (datasComLeis && datasComLeis.length > 0 && !selectedDate) {
      // Ordenar por data decrescente e pegar a mais recente
      const datasOrdenadas = [...datasComLeis].sort((a, b) => b.localeCompare(a));
      setSelectedDate(datasOrdenadas[0]);
    } else if (datasComLeis && datasComLeis.length === 0 && !selectedDate) {
      // Se não tem nenhuma data com leis, seleciona hoje mesmo
      setSelectedDate(getHojeSaoPaulo());
    }
  }, [datasComLeis, selectedDate]);

  // Buscar leis recentes para a data selecionada
  const { data: leisRecentes, isLoading } = useQuery({
    queryKey: ['leis-recentes-resenha', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('id, numero_lei, data_publicacao, ementa, areas_direito, tipo_ato, status')
        .eq('data_publicacao', selectedDate)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(lei => ({
        id: lei.id,
        tipo: lei.tipo_ato || 'Lei',
        numero: lei.numero_lei || '',
        data_publicacao: lei.data_publicacao,
        ementa: lei.ementa || '',
        areas_direito: lei.areas_direito || []
      })) as LeiRecente[];
    },
    enabled: !!selectedDate,
    staleTime: 1000 * 60 * 5
  });

  const handleDateSelect = (dataStr: string) => {
    setSelectedDate(dataStr);
    
    // Se a data não tem leis, mostrar toast
    if (datasComLeis && !datasComLeis.includes(dataStr)) {
      setShowNoDataToast(true);
      setTimeout(() => setShowNoDataToast(false), 3000);
    }
  };

  // Verificar se uma data tem leis
  const dataTemLeis = (dataStr: string) => {
    return datasComLeis?.includes(dataStr) ?? false;
  };

  return (
    <div className="space-y-4 -mx-4 md:-mx-6">
      {/* Container sem margem lateral */}
      <div className="bg-card relative overflow-hidden shadow-2xl border-y border-border/30">
        {/* Linha decorativa no topo - igual ao Mundo Jurídico */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        
        <div className="p-4 md:p-4 relative">
        
          {/* Toast flutuante para data sem leis */}
          {showNoDataToast && (
            <div
              className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-fade-in"
            >
              <div className="p-2 bg-red-500/20 rounded-full">
                <CalendarX className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sem atualizações</p>
                <p className="text-xs text-muted-foreground">Nenhuma lei publicada nesta data</p>
              </div>
            </div>
          )}

          {/* Header compacto */}
          <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
                <Scale className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                  Resenha Diária
                </h3>
                <p className="text-muted-foreground text-xs">Atualizações do Diário Oficial</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/resenha-diaria-sobre')}
              className="h-7 bg-red-600 hover:bg-red-500 text-white border-0 rounded-full px-3 text-[10px] font-semibold flex items-center gap-1 shadow-md"
            >
              Sobre
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Seletor de datas compacto - COM fundo rosa */}
          <div className="bg-red-900/40 rounded-xl p-3 relative overflow-hidden mb-3 border border-red-800/30">
          
            {/* Datas em linha */}
            <div className="flex gap-1.5 justify-between mb-2 relative z-10">
              {diasDisponiveis.map((dia, index) => {
                const isSelected = dia.dataStr === selectedDate;
                const temLeis = dataTemLeis(dia.dataStr);
                
                return (
                  <button
                    key={dia.dataStr}
                    onClick={() => handleDateSelect(dia.dataStr)}
                    className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-lg transition-colors duration-150 relative ${
                      isSelected 
                        ? 'bg-red-600 text-white shadow-md' 
                        : temLeis
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[8px] font-medium uppercase tracking-wide opacity-80">
                      {dia.diaSemana}
                    </span>
                    <span className="text-base font-bold leading-none">{dia.diaNum}</span>
                    <span className="text-[8px] uppercase opacity-60">{dia.mes}</span>
                    
                    {/* Indicador de que tem leis */}
                    {temLeis && !isSelected && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

          </div>


          {/* Lista de leis com tags */}
          <div>
            {isLoading || !selectedDate ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : leisRecentes && leisRecentes.length > 0 ? (
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {leisRecentes.slice(0, 10).map((lei, index) => {
                    const tags = gerarTags(lei);
                    
                      return (
                      <button
                        key={lei.id}
                        onClick={() => navigate(`/vade-mecum/resenha/${lei.id}`)}
                        className="flex-shrink-0 w-56 bg-card border border-border rounded-lg p-2.5 text-left hover:border-primary/50 transition-colors group"
                      >
                        {/* Tags no topo */}
                        <div className="flex gap-1 mb-1.5 flex-wrap">
                          {tags.map((tag, i) => (
                            <span 
                              key={i}
                              className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                                i === 0 
                                  ? 'bg-primary/20 text-primary' 
                                  : i === 1 
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-amber-500/20 text-amber-500'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Número */}
                        <p className="text-[10px] text-muted-foreground font-medium mb-1 truncate">
                          {lei.numero}
                        </p>
                        
                        {/* Ementa */}
                        <p className="text-[11px] text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {lei.ementa}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Scale className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs">Nenhuma lei publicada nesta data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
