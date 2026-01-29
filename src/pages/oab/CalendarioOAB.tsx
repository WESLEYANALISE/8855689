import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarioItem {
  id: string;
  exame_numero: number;
  exame_titulo: string;
  publicacao_edital: string | null;
  inscricao_inicio: string | null;
  inscricao_fim: string | null;
  prova_primeira_fase: string | null;
  prova_segunda_fase: string | null;
  reaproveitamento_inicio: string | null;
  reaproveitamento_fim: string | null;
  observacoes: string | null;
  atualizado_em: string | null;
}

const CalendarioOAB = () => {
  const navigate = useNavigate();

  const { data: calendario, isLoading } = useQuery({
    queryKey: ['calendario-oab'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendario_oab')
        .select('*')
        .order('exame_numero', { ascending: true });
      
      if (error) throw error;
      return data as CalendarioItem[];
    }
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const getNextEvent = () => {
    if (!calendario) return null;
    
    const allEvents: { date: Date; label: string; exame: number }[] = [];
    
    calendario.forEach(item => {
      if (item.publicacao_edital && isFuture(new Date(item.publicacao_edital))) {
        allEvents.push({ date: new Date(item.publicacao_edital), label: 'Edital', exame: item.exame_numero });
      }
      if (item.inscricao_inicio && isFuture(new Date(item.inscricao_inicio))) {
        allEvents.push({ date: new Date(item.inscricao_inicio), label: 'Inscrições', exame: item.exame_numero });
      }
      if (item.prova_primeira_fase && isFuture(new Date(item.prova_primeira_fase))) {
        allEvents.push({ date: new Date(item.prova_primeira_fase), label: '1ª Fase', exame: item.exame_numero });
      }
      if (item.prova_segunda_fase && isFuture(new Date(item.prova_segunda_fase))) {
        allEvents.push({ date: new Date(item.prova_segunda_fase), label: '2ª Fase', exame: item.exame_numero });
      }
    });
    
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    return allEvents[0] || null;
  };

  const nextEvent = getNextEvent();
  const daysUntilNext = nextEvent ? differenceInDays(nextEvent.date, new Date()) : null;

  const getEventStatus = (dateStr: string | null) => {
    if (!dateStr) return 'pending';
    return isPast(new Date(dateStr)) ? 'past' : 'future';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/oab/primeira-fase')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Calendário OAB</h1>
            <p className="text-xs text-muted-foreground">Datas dos Exames de Ordem</p>
          </div>
        </div>

        {/* Countdown Card */}
        {nextEvent && daysUntilNext !== null && (
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-900/50 rounded-xl p-3">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-purple-300/80">Próximo evento</p>
                <p className="text-lg font-bold text-white">
                  {nextEvent.exame}º EOU - {nextEvent.label}
                </p>
                <p className="text-sm text-purple-200">
                  {format(nextEvent.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-300">{daysUntilNext}</p>
                <p className="text-xs text-purple-400">dias</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Calendar Cards */}
        {calendario?.map((item) => (
          <div 
            key={item.id}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/10 px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white">{item.exame_titulo}</h3>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-3">
              {/* Edital */}
              <TimelineItem 
                icon={<FileText className="w-4 h-4" />}
                label="Publicação do Edital"
                date={formatDate(item.publicacao_edital)}
                status={getEventStatus(item.publicacao_edital)}
                color="purple"
              />

              {/* Inscrições */}
              <TimelineItem 
                icon={<Calendar className="w-4 h-4" />}
                label="Período de Inscrição"
                date={`${formatDate(item.inscricao_inicio)} a ${formatDate(item.inscricao_fim)}`}
                status={getEventStatus(item.inscricao_fim)}
                color="blue"
              />

              {/* Reaproveitamento */}
              <TimelineItem 
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Reaproveitamento"
                date={`${formatDate(item.reaproveitamento_inicio)} a ${formatDate(item.reaproveitamento_fim)}`}
                status={getEventStatus(item.reaproveitamento_fim)}
                color="yellow"
              />

              {/* 1ª Fase */}
              <TimelineItem 
                icon={<AlertCircle className="w-4 h-4" />}
                label="Prova 1ª Fase"
                date={formatDate(item.prova_primeira_fase)}
                status={getEventStatus(item.prova_primeira_fase)}
                color="green"
              />

              {/* 2ª Fase */}
              <TimelineItem 
                icon={<AlertCircle className="w-4 h-4" />}
                label="Prova 2ª Fase"
                date={formatDate(item.prova_segunda_fase)}
                status={getEventStatus(item.prova_segunda_fase)}
                color="red"
              />
            </div>
          </div>
        ))}

        {/* Info Footer */}
        <div className="bg-neutral-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Fonte: Site oficial do Exame de Ordem (examedeordem.oab.org.br)
          </p>
        </div>
      </div>
    </div>
  );
};

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  date: string;
  status: 'past' | 'future' | 'pending';
  color: 'purple' | 'blue' | 'green' | 'red' | 'yellow';
}

const TimelineItem = ({ icon, label, date, status, color }: TimelineItemProps) => {
  const colorClasses = {
    purple: 'bg-purple-900/30 text-purple-400 border-purple-700/30',
    blue: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
    green: 'bg-green-900/30 text-green-400 border-green-700/30',
    red: 'bg-red-900/30 text-red-400 border-red-700/30',
    yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg border ${colorClasses[color]} ${status === 'past' ? 'opacity-50' : ''}`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      {status === 'past' && (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      )}
    </div>
  );
};

export default CalendarioOAB;
