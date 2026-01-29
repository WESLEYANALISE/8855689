import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Scale, ChevronRight, Loader2, Newspaper, Info, ChevronDown, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, addDays, isToday, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResenhaItem {
  id: string;
  numero_lei: string;
  ementa: string | null;
  data_publicacao: string;
  url_planalto: string;
  artigos: Array<{ numero: string; texto: string }>;
  areas_direito: string[];
  texto_formatado: string | null;
  status: string;
  explicacao_lei: string | null;
  pendente?: boolean; // Indica se a lei ainda está sendo processada
  fonte?: 'resenha_diaria' | 'leis_push_2025'; // Origem do dado
}

export default function VadeMecumResenhaDiaria() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingDias, setLoadingDias] = useState(true);
  const [resenhas, setResenhas] = useState<ResenhaItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [diasComLeis, setDiasComLeis] = useState<string[]>([]);

  // Gerar últimos 10 dias (todos, independente de ter leis)
  const lastDays = useMemo(() => 
    Array.from({ length: 10 }, (_, i) => subDays(new Date(), i)),
    []
  );

  // Verificar se um dia tem leis
  const diaTemLeis = (day: Date): boolean => {
    return diasComLeis.includes(format(day, 'yyyy-MM-dd'));
  };

  // Encontrar o último dia com leis
  const ultimoDiaComLeis = useMemo(() => {
    for (const day of lastDays) {
      if (diaTemLeis(day)) {
        return day;
      }
    }
    return null;
  }, [lastDays, diasComLeis]);

  useEffect(() => {
    fetchDiasComLeis();
  }, []);

  // Selecionar automaticamente o último dia com leis quando carregar
  useEffect(() => {
    if (!loadingDias && ultimoDiaComLeis && !selectedDate) {
      setSelectedDate(ultimoDiaComLeis);
    } else if (!loadingDias && !ultimoDiaComLeis && !selectedDate) {
      // Se não há dias com leis, seleciona hoje
      setSelectedDate(new Date());
    }
  }, [loadingDias, ultimoDiaComLeis, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchResenha();
    }
  }, [selectedDate]);

  const fetchDiasComLeis = async () => {
    setLoadingDias(true);
    try {
      // Buscar dias com leis em resenha_diaria
      const { data: resenhaData } = await supabase
        .from('resenha_diaria' as any)
        .select('data_publicacao')
        .eq('status', 'ativo');

      // Buscar dias com leis em leis_push_2025 (pendentes ou aprovadas)
      const { data: leisPushData } = await supabase
        .from('leis_push_2025' as any)
        .select('data_publicacao')
        .not('data_publicacao', 'is', null);

      // Combinar datas únicas de ambas as fontes
      const todasDatas = [
        ...(resenhaData || []).map((d: any) => d.data_publicacao),
        ...(leisPushData || []).map((d: any) => d.data_publicacao)
      ];
      const diasUnicos = [...new Set(todasDatas.filter(Boolean))];
      setDiasComLeis(diasUnicos);
    } catch (error) {
      console.error('Erro ao buscar dias com leis:', error);
    } finally {
      setLoadingDias(false);
    }
  };

  const fetchResenha = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const dataFormatada = format(startOfDay(selectedDate), 'yyyy-MM-dd');

      // Buscar de resenha_diaria (leis já processadas)
      const { data: resenhaData } = await supabase
        .from('resenha_diaria' as any)
        .select('*')
        .eq('status', 'ativo')
        .eq('data_publicacao', dataFormatada)
        .order('ordem_dou', { ascending: true, nullsFirst: false });

      // Buscar de leis_push_2025 (leis que podem estar pendentes)
      const { data: leisPushData } = await supabase
        .from('leis_push_2025' as any)
        .select('id, numero_lei, ementa, data_publicacao, url_planalto, artigos, areas_direito, texto_formatado, status, ordem_dou')
        .eq('data_publicacao', dataFormatada)
        .order('ordem_dou', { ascending: true, nullsFirst: false });

      // Identificar quais leis de leis_push_2025 já estão na resenha
      const numerosResenha = new Set((resenhaData || []).map((r: any) => r.numero_lei));
      
      // Marcar fonte das leis da resenha
      const resenhaComFonte = (resenhaData || []).map((r: any) => ({
        ...r,
        fonte: 'resenha_diaria' as const
      }));
      
      // Filtrar leis_push que não estão na resenha (são pendentes)
      const leisPushNaoNaResenha = (leisPushData || [])
        .filter((l: any) => !numerosResenha.has(l.numero_lei))
        .map((l: any) => ({
          ...l,
          explicacao_lei: null,
          pendente: true,
          fonte: 'leis_push_2025' as const
        }));

      // Combinar resultados (resenha primeiro, depois pendentes)
      const todasLeis = [...resenhaComFonte, ...leisPushNaoNaResenha];
      
      setResenhas(todasLeis as unknown as ResenhaItem[]);
    } catch (error) {
      console.error('Erro ao buscar resenha:', error);
      toast.error('Erro ao carregar resenha diária');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se a ementa é válida (não é apenas o número da lei)
  const ementaValida = (ementa: string | null): string | null => {
    if (!ementa) return null;
    
    // Ementas inválidas: contêm apenas o número da lei (ex: "Lei nº 15.316, de 22.12.2025")
    if (/^(Lei|Decreto|Medida Provisória|Lei Complementar)\s*(nº|n°|Nº|N°|Ordinária)?\s*[\d.]+/i.test(ementa.trim())) {
      return null;
    }
    
    return ementa;
  };

  const extrairDescricaoLei = (lei: ResenhaItem): string | null => {
    if (!lei.texto_formatado) return null;
    
    const regex = /(?:Vigência|Conversão da Medida Provisória|Regulamento|Texto compilado|Mensagem de veto)\s*\n*((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*(?:\n[^\n]*)?)/i;
    const match = lei.texto_formatado.match(regex);
    
    if (match && match[1]) {
      return match[1].replace(/\s+/g, ' ').trim().substring(0, 200);
    }
    
    const regexDireto = /((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*)/i;
    const matchDireto = lei.texto_formatado.match(regexDireto);
    
    if (matchDireto && matchDireto[1]) {
      return matchDireto[1].replace(/\s+/g, ' ').trim().substring(0, 200);
    }
    
    return null;
  };

  const formatFullDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatWeekday = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    return format(date, "EEE", { locale: ptBR });
  };

  // Ir para o último dia com leis
  const irParaUltimoDiaComLeis = () => {
    if (ultimoDiaComLeis) {
      setSelectedDate(ultimoDiaComLeis);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950/95 border-b border-orange-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-orange-300" />
                Resenha Diária
              </h1>
              <p className="text-sm text-white/60">
                Atualizações do Diário Oficial
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/vade-mecum/resenha-sobre')} 
              className="gap-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <Info className="w-4 h-4" />
              Sobre
            </Button>
          </div>

          {/* Navegação de Dias - TODOS os últimos 10 dias */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {loadingDias ? (
              <p className="text-white/60 text-sm">Carregando dias...</p>
            ) : (
              lastDays.map((day) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const today = isToday(day);
                const temLeis = diaTemLeis(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center w-[65px] min-w-[65px] h-[72px] px-3 py-2 rounded-xl transition-all relative ${
                      isSelected 
                        ? 'bg-white text-orange-900' 
                        : temLeis
                          ? 'bg-white/10 text-white/80 hover:bg-white/20'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-medium ${
                      isSelected 
                        ? 'text-orange-600' 
                        : temLeis 
                          ? 'text-white/60' 
                          : 'text-white/30'
                    }`}>
                      {formatWeekday(day)}
                    </span>
                    <span className={`text-lg font-bold ${!temLeis && !isSelected ? 'opacity-50' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    <span className={`text-[10px] uppercase ${
                      isSelected 
                        ? 'text-orange-600' 
                        : temLeis 
                          ? 'text-white/50' 
                          : 'text-white/25'
                    }`}>
                      {format(day, 'MMM', { locale: ptBR })}
                    </span>
                    
                    {/* Indicador de que tem leis */}
                    {temLeis && !isSelected && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                    )}
                    
                    {/* Indicador de hoje (se não tem leis) */}
                    {today && !temLeis && !isSelected && (
                      <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-white/30 rounded-full" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Data selecionada e contador */}
      {selectedDate && (
        <div className="px-4 py-3 sm:py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-xs sm:text-sm font-medium capitalize leading-tight">
                {formatFullDate(selectedDate)}
              </span>
              {isToday(selectedDate) && (
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[10px]">
                  Hoje
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-xs self-start sm:self-auto">
              {loading ? '...' : `${resenhas.length} leis`}
            </Badge>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="h-[calc(100vh-220px)] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="container mx-auto px-4 py-4 space-y-3">
          {!selectedDate || loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando resenha...</span>
            </div>
          ) : resenhas.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange-500/50" />
                </div>
                <h3 className="font-semibold mb-2">Sem atualização neste dia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isToday(selectedDate) ? (
                    <>
                      Não houve publicação oficial de legislação no Diário Oficial da União em{' '}
                      <span className="font-medium">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</span>.
                      <br />
                      <span className="text-xs text-muted-foreground/70 mt-2 block">
                        As atualizações geralmente ocorrem em dias úteis. Verifique novamente mais tarde.
                      </span>
                    </>
                  ) : (
                    <>
                      Não foram encontradas publicações de leis no Diário Oficial em{' '}
                      <span className="font-medium">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</span>.
                    </>
                  )}
                </p>
                {ultimoDiaComLeis && !isSameDay(selectedDate, ultimoDiaComLeis) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={irParaUltimoDiaComLeis}
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Ver última atualização ({format(ultimoDiaComLeis, "d/MM", { locale: ptBR })})
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            resenhas.map((lei) => {
              const isPendente = lei.pendente || (lei.fonte === 'leis_push_2025' && (!lei.artigos || lei.artigos.length === 0));
              
              return (
                <Card 
                  key={lei.id}
                  className={`hover:bg-muted/50 transition-colors cursor-pointer border-l-4 bg-card ${
                    isPendente ? 'border-l-amber-500' : 'border-l-orange-500'
                  }`}
                  onClick={() => navigate(`/vade-mecum/resenha/${lei.fonte === 'leis_push_2025' ? `push-${lei.id}` : lei.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Scale className={`w-5 h-5 flex-shrink-0 ${isPendente ? 'text-amber-500' : 'text-orange-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={`font-semibold text-sm ${isPendente ? 'text-amber-500' : 'text-orange-500'}`}>
                          {lei.numero_lei}
                        </h4>
                        {isPendente && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500 bg-amber-500/10">
                            Processando
                          </Badge>
                        )}
                      </div>
                      {/* Ementa como subtítulo - prioriza ementa válida, depois extrai do texto */}
                      {(ementaValida(lei.ementa) || extrairDescricaoLei(lei)) && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ementaValida(lei.ementa) || extrairDescricaoLei(lei)}
                        </p>
                      )}
                    </div>
                    {lei.explicacao_lei ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : isPendente ? (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
