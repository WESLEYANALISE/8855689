import { GitBranch, Brain, ArrowRightLeft, Clock, Database, PieChart, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DiagramType = 'flowchart' | 'mindmap' | 'sequence' | 'timeline' | 'er' | 'pie' | 'class';

interface DiagramOption {
  id: DiagramType;
  label: string;
  description: string;
  icon: React.ElementType;
  exemplo: string;
}

const diagramOptions: DiagramOption[] = [
  {
    id: 'flowchart',
    label: 'Fluxograma',
    description: 'Processos e procedimentos',
    icon: GitBranch,
    exemplo: 'Fases do processo civil'
  },
  {
    id: 'mindmap',
    label: 'Mapa Mental',
    description: 'Conceitos e ramificações',
    icon: Brain,
    exemplo: 'Requisitos de um crime'
  },
  {
    id: 'sequence',
    label: 'Sequência',
    description: 'Comunicação entre partes',
    icon: ArrowRightLeft,
    exemplo: 'Citação → Contestação'
  },
  {
    id: 'timeline',
    label: 'Linha do Tempo',
    description: 'Eventos cronológicos',
    icon: Clock,
    exemplo: 'Prazos processuais'
  },
  {
    id: 'er',
    label: 'Relacionamento',
    description: 'Entidades e relações',
    icon: Database,
    exemplo: 'Partes no processo'
  },
  {
    id: 'pie',
    label: 'Pizza',
    description: 'Distribuição e estatísticas',
    icon: PieChart,
    exemplo: 'Tipos de recursos'
  },
  {
    id: 'class',
    label: 'Estrutura',
    description: 'Classes e categorias',
    icon: Boxes,
    exemplo: 'Tipos de contratos'
  }
];

interface DiagramTypeSelectorProps {
  selected: DiagramType;
  onSelect: (type: DiagramType) => void;
  disabled?: boolean;
}

export const DiagramTypeSelector = ({ selected, onSelect, disabled }: DiagramTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {diagramOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selected === option.id;
        
        return (
          <Button
            key={option.id}
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'h-auto flex-col items-start p-3 gap-1 text-left transition-all',
              isSelected && 'ring-2 ring-primary ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => onSelect(option.id)}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 w-full">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="font-medium text-sm">{option.label}</span>
            </div>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {option.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export { diagramOptions };
