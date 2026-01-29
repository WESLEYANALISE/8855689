import { useState, useEffect, useMemo } from 'react';
import { Calendar, Zap, FileText, FileCheck, ScrollText, BookOpen, Gavel, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface FiltrosNovasLeis {
  ano: number | null;
  mes: number | null;
  dia: number | null;
  status: 'todos' | 'pendente' | 'aprovado' | 'publicado';
  automacao: boolean;
}

// Categorias de fonte do Planalto (sem Leis Delegadas)
const CATEGORIAS = [
  { id: 'todas', label: 'Todas', icon: Layers },
  { id: 'decretos', label: 'Decretos', icon: FileText },
  { id: 'leis-ordinarias', label: 'Leis Ordinárias', icon: FileCheck },
  { id: 'leis-complementares', label: 'Leis Complementares', icon: ScrollText },
  { id: 'medidas-provisorias', label: 'Medidas Provisórias', icon: FileText },
  { id: 'projetos-lei', label: 'PL', icon: FileCheck },
  { id: 'plp', label: 'PLP', icon: ScrollText },
  { id: 'pec', label: 'PEC', icon: BookOpen },
] as const;

export type FontePlanalto = typeof CATEGORIAS[number]['id'];

interface NovasLeisSidebarProps {
  filtros: FiltrosNovasLeis;
  onFiltrosChange: (filtros: FiltrosNovasLeis) => void;
  totalLeis: number;
  refreshKey?: number;
  fonteSelecionada: FontePlanalto;
  onFonteChange: (fonte: FontePlanalto) => void;
  leis: Array<{ tipo_ato: string | null; data_publicacao: string | null; created_at: string }>;
}

interface AnoStats {
  ano: number;
  total: number;
}

interface MesStats {
  mes: number;
  nome: string;
  total: number;
}

const MESES = [
  { numero: 1, nome: 'Janeiro' },
  { numero: 2, nome: 'Fevereiro' },
  { numero: 3, nome: 'Março' },
  { numero: 4, nome: 'Abril' },
  { numero: 5, nome: 'Maio' },
  { numero: 6, nome: 'Junho' },
  { numero: 7, nome: 'Julho' },
  { numero: 8, nome: 'Agosto' },
  { numero: 9, nome: 'Setembro' },
  { numero: 10, nome: 'Outubro' },
  { numero: 11, nome: 'Novembro' },
  { numero: 12, nome: 'Dezembro' },
];

// Mapeamento de fonte para tipo de ato
const getTipoAtoPorFonte = (fonte: FontePlanalto): string | null => {
  if (fonte === 'todas') return null;
  
  const mapeamento: Record<Exclude<FontePlanalto, 'todas'>, string> = {
    'decretos': 'Decreto',
    'leis-ordinarias': 'Lei Ordinária',
    'leis-complementares': 'Lei Complementar',
    'medidas-provisorias': 'Medida Provisória',
    'projetos-lei': 'Projeto de Lei',
    'plp': 'Projeto de Lei Complementar',
    'pec': 'Emenda Constitucional',
  };
  return mapeamento[fonte] || null;
};

export function NovasLeisSidebar({ 
  filtros, 
  onFiltrosChange, 
  totalLeis, 
  refreshKey,
  fonteSelecionada,
  onFonteChange,
  leis
}: NovasLeisSidebarProps) {
  const [anosDisponiveis, setAnosDisponiveis] = useState<AnoStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAnos();
  }, [refreshKey]);

  const carregarAnos = async () => {
    setLoading(true);
    const anoAtual = new Date().getFullYear();
    const anosParaConsultar = [2025, 2024, 2023, 2022, 2021, 2020].filter(a => a <= anoAtual);
    const contagem: Record<number, number> = {};
    
    // Consultar cada tabela de ano
    for (const ano of anosParaConsultar) {
      try {
        const { count, error } = await supabase
          .from(`leis_push_${ano}` as any)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          contagem[ano] = count || 0;
        } else {
          contagem[ano] = 0;
        }
      } catch {
        contagem[ano] = 0;
      }
    }
    
    const anos = Object.entries(contagem)
      .map(([ano, total]) => ({ ano: parseInt(ano), total }))
      .sort((a, b) => b.ano - a.ano);
    
    setAnosDisponiveis(anos);
    setLoading(false);
  };

  // Calcular quantidade por categoria
  const categoriaStats = useMemo(() => {
    const stats: Record<string, number> = { todas: leis.length };
    
    leis.forEach(lei => {
      CATEGORIAS.forEach(cat => {
        if (cat.id !== 'todas') {
          const tipoAto = getTipoAtoPorFonte(cat.id);
          if (tipoAto && lei.tipo_ato === tipoAto) {
            stats[cat.id] = (stats[cat.id] || 0) + 1;
          }
        }
      });
    });
    
    return stats;
  }, [leis]);

  // Calcular quantidade por mês (quando ano selecionado)
  const mesesStats = useMemo((): MesStats[] => {
    if (!filtros.ano) return [];
    
    const tipoAtoFonte = getTipoAtoPorFonte(fonteSelecionada);
    
    const contagemMes: Record<number, number> = {};
    
    leis.forEach(lei => {
      // Filtrar por tipo de ato se necessário
      if (tipoAtoFonte && lei.tipo_ato !== tipoAtoFonte) return;
      
      const dataEfetiva = lei.data_publicacao || lei.created_at;
      if (dataEfetiva && typeof dataEfetiva === 'string') {
        const match = dataEfetiva.match(/^(\d{4})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1]);
          const mes = parseInt(match[2]);
          if (ano === filtros.ano) {
            contagemMes[mes] = (contagemMes[mes] || 0) + 1;
          }
        }
      }
    });
    
    return MESES.map(m => ({
      mes: m.numero,
      nome: m.nome,
      total: contagemMes[m.numero] || 0
    })).filter(m => m.total > 0);
  }, [leis, filtros.ano, fonteSelecionada]);

  const handleCategoriaClick = (categoriaId: FontePlanalto) => {
    onFonteChange(categoriaId);
  };

  const handleAnoClick = (ano: number) => {
    onFiltrosChange({
      ...filtros,
      ano: filtros.ano === ano ? null : ano,
      mes: null,
      dia: null
    });
  };

  const handleMesClick = (mes: number) => {
    onFiltrosChange({
      ...filtros,
      mes: filtros.mes === mes ? null : mes,
      dia: null
    });
  };

  const handleDiaClick = (dia: number) => {
    onFiltrosChange({
      ...filtros,
      dia: filtros.dia === dia ? null : dia
    });
  };

  const handleAutomacaoChange = (checked: boolean) => {
    onFiltrosChange({
      ...filtros,
      automacao: checked
    });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      ano: null,
      mes: null,
      dia: null,
      status: 'todos',
      automacao: false
    });
  };

  const temFiltrosAtivos = filtros.ano !== null || filtros.mes !== null || filtros.dia !== null;

  // Gerar dias do mês selecionado
  const getDiasDoMes = () => {
    if (!filtros.ano || !filtros.mes) return [];
    const ultimoDia = new Date(filtros.ano, filtros.mes, 0).getDate();
    return Array.from({ length: ultimoDia }, (_, i) => i + 1);
  };

  const diasDoMes = getDiasDoMes();

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Novas Leis</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {totalLeis} leis encontradas
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Automação */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-yellow-500" />
              Automação
            </div>
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <Label htmlFor="automacao" className="text-xs cursor-pointer">
                Processar automaticamente
              </Label>
              <Switch
                id="automacao"
                checked={filtros.automacao}
                onCheckedChange={handleAutomacaoChange}
              />
            </div>
          </div>

          <Separator />

          {/* Filtro por Categoria */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Categoria
            </div>
            <div className="space-y-1">
              {CATEGORIAS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={fonteSelecionada === id ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-between h-8"
                  onClick={() => handleCategoriaClick(id)}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {categoriaStats[id] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filtro por Ano */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Por Ano
            </div>
            {loading ? (
              <div className="text-xs text-muted-foreground">Carregando...</div>
            ) : (
              <div className="space-y-1">
                {anosDisponiveis.map(({ ano, total }) => (
                  <Button
                    key={ano}
                    variant={filtros.ano === ano ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-between h-8"
                    onClick={() => handleAnoClick(ano)}
                  >
                    <span>{ano}</span>
                    <Badge variant="secondary" className="text-xs">
                      {total}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por Mês (só aparece se ano selecionado) */}
          {filtros.ano && mesesStats.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Por Mês
                </div>
                <div className="space-y-1">
                  {mesesStats.map(({ mes, nome, total }) => (
                    <Button
                      key={mes}
                      variant={filtros.mes === mes ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-between h-8"
                      onClick={() => handleMesClick(mes)}
                    >
                      <span>{nome}</span>
                      <Badge variant="secondary" className="text-xs">
                        {total}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Filtro por Dia (só aparece se mês selecionado) */}
          {filtros.ano && filtros.mes && diasDoMes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Por Dia</div>
                <div className="grid grid-cols-7 gap-1">
                  {diasDoMes.map(dia => (
                    <Button
                      key={dia}
                      variant={filtros.dia === dia ? "default" : "ghost"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => handleDiaClick(dia)}
                    >
                      {dia}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {temFiltrosAtivos && (
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={limparFiltros}
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
