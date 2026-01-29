import { useMemo, useState } from "react";
import { Calendar, FileEdit, Plus, X, Minus, AlertTriangle, Eye, ChevronDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Alteracao {
  id: number;
  tabela_lei: string;
  numero_artigo: string;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  data_alteracao: string | null;
  ano_alteracao: number | null;
  texto_completo: string;
  created_at: string;
}

interface AlteracoesTimelineProps {
  tableName: string;
  onArtigoClick?: (numeroArtigo: string) => void;
}

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  'Redação': { 
    icon: <FileEdit className="h-3.5 w-3.5" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  'Inclusão': { 
    icon: <Plus className="h-3.5 w-3.5" />, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20'
  },
  'Acréscimo': { 
    icon: <Plus className="h-3.5 w-3.5" />, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20'
  },
  'Revogação': { 
    icon: <X className="h-3.5 w-3.5" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/20'
  },
  'Supressão': { 
    icon: <Minus className="h-3.5 w-3.5" />, 
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/20'
  },
  'Vetado': { 
    icon: <AlertTriangle className="h-3.5 w-3.5" />, 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20'
  },
  'Alteração': { 
    icon: <FileEdit className="h-3.5 w-3.5" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20'
  },
  'Renumeração': { 
    icon: <FileEdit className="h-3.5 w-3.5" />, 
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20'
  },
  'Vide': { 
    icon: <Eye className="h-3.5 w-3.5" />, 
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10 border-slate-500/20'
  },
  'Vigência': { 
    icon: <Calendar className="h-3.5 w-3.5" />, 
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20'
  },
};

export const AlteracoesTimeline = ({ tableName, onArtigoClick }: AlteracoesTimelineProps) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  const [showAll, setShowAll] = useState(false);

  const { data: alteracoes, isLoading } = useQuery({
    queryKey: ['alteracoes-timeline', tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('*')
        .eq('tabela_lei', tableName)
        .order('ano_alteracao', { ascending: false, nullsFirst: false })
        .order('data_alteracao', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return (data as unknown) as Alteracao[];
    },
    enabled: !!tableName
  });

  // Extrair anos únicos
  const anosDisponiveis = useMemo(() => {
    if (!alteracoes) return [];
    const anos = new Set<number>();
    alteracoes.forEach(a => {
      if (a.ano_alteracao) anos.add(a.ano_alteracao);
    });
    return Array.from(anos).sort((a, b) => b - a);
  }, [alteracoes]);

  // Extrair tipos únicos
  const tiposDisponiveis = useMemo(() => {
    if (!alteracoes) return [];
    return [...new Set(alteracoes.map(a => a.tipo_alteracao))].sort();
  }, [alteracoes]);

  // Filtrar alterações
  const alteracoesFiltradas = useMemo(() => {
    if (!alteracoes) return [];
    
    return alteracoes.filter(a => {
      if (filtroTipo !== 'todos' && a.tipo_alteracao !== filtroTipo) return false;
      if (filtroAno !== 'todos' && a.ano_alteracao?.toString() !== filtroAno) return false;
      return true;
    });
  }, [alteracoes, filtroTipo, filtroAno]);

  // Limitar exibição
  const alteracoesExibidas = showAll ? alteracoesFiltradas : alteracoesFiltradas.slice(0, 20);

  const getConfig = (tipo: string) => {
    return TIPO_CONFIG[tipo] || { 
      icon: <FileEdit className="h-3.5 w-3.5" />, 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50 border-muted'
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!alteracoes || alteracoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-medium text-muted-foreground">Nenhuma alteração encontrada</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Esta lei ainda não teve seu histórico extraído ou não possui alterações registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filtros */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tiposDisponiveis.map(tipo => (
              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filtroAno} onValueChange={setFiltroAno}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {anosDisponiveis.map(ano => (
              <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="ml-auto text-xs text-muted-foreground">
          {alteracoesFiltradas.length} alterações
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {alteracoesExibidas.map((alteracao, index) => {
              const config = getConfig(alteracao.tipo_alteracao);
              
              return (
                <motion.div
                  key={alteracao.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-shadow border ${config.bgColor}`}
                    onClick={() => onArtigoClick?.(alteracao.numero_artigo)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Ícone do tipo */}
                        <div className={`mt-0.5 ${config.color}`}>
                          {config.icon}
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-medium">
                              Art. {alteracao.numero_artigo}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs ${config.color}`}>
                              {alteracao.tipo_alteracao}
                            </Badge>
                          </div>
                          
                          {alteracao.lei_alteradora && (
                            <p className="text-xs text-muted-foreground truncate">
                              {alteracao.lei_alteradora}
                            </p>
                          )}
                          
                          {(alteracao.ano_alteracao || alteracao.data_alteracao) && (
                            <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {alteracao.data_alteracao 
                                ? new Date(alteracao.data_alteracao).toLocaleDateString('pt-BR')
                                : alteracao.ano_alteracao}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Botão Ver Mais */}
          {alteracoesFiltradas.length > 20 && !showAll && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowAll(true)}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver mais {alteracoesFiltradas.length - 20} alterações
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
