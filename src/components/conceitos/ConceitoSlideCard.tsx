import { motion } from "framer-motion";
import { 
  BookOpen, 
  Lightbulb, 
  AlertTriangle, 
  Briefcase, 
  Target, 
  Table2,
  Sparkles,
  FileText
} from "lucide-react";
import { ConceitoSlide } from "@/lib/markdown-to-slides";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ConceitoSlideCardProps {
  slide: ConceitoSlide;
  fontSize?: number;
}

const iconMap: Record<string, any> = {
  introducao: BookOpen,
  conteudo: FileText,
  destaque: Target,
  tabela: Table2,
  dica: Lightbulb,
  atencao: AlertTriangle,
  caso: Briefcase,
  resumo: Sparkles,
  titulo_secao: BookOpen
};

const colorMap: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
  introducao: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: 'text-primary',
    gradient: 'from-primary/20 to-primary/5'
  },
  conteudo: {
    bg: 'bg-muted/30',
    border: 'border-border',
    icon: 'text-foreground',
    gradient: 'from-muted/50 to-transparent'
  },
  destaque: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    icon: 'text-violet-500',
    gradient: 'from-violet-500/20 to-violet-500/5'
  },
  tabela: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-cyan-500/5'
  },
  dica: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    gradient: 'from-amber-500/20 to-amber-500/5'
  },
  atencao: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    gradient: 'from-red-500/20 to-red-500/5'
  },
  caso: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-500/5'
  },
  resumo: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: 'text-primary',
    gradient: 'from-primary/20 to-primary/5'
  },
  titulo_secao: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: 'text-primary',
    gradient: 'from-primary/20 to-primary/5'
  }
};

const getLabelForType = (tipo: ConceitoSlide['tipo']): string => {
  switch (tipo) {
    case 'introducao': return 'Introdução';
    case 'conteudo': return 'Conteúdo';
    case 'destaque': return 'Você Sabia?';
    case 'tabela': return 'Quadro Comparativo';
    case 'dica': return 'Dica';
    case 'atencao': return 'Atenção';
    case 'caso': return 'Caso Prático';
    case 'resumo': return 'Síntese';
    case 'titulo_secao': return 'Seção';
    default: return '';
  }
};

export const ConceitoSlideCard = ({ slide, fontSize = 16 }: ConceitoSlideCardProps) => {
  const Icon = iconMap[slide.tipo] || FileText;
  const colors = colorMap[slide.tipo] || colorMap.conteudo;
  const label = getLabelForType(slide.tipo);
  
  // Slide de título de seção (sem conteúdo, apenas título grande)
  if ((slide.tipo === 'titulo_secao' || slide.tipo === 'introducao' || slide.tipo === 'resumo') && !slide.conteudo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 flex flex-col items-center justify-center text-center p-6"
      >
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
          `bg-gradient-to-br ${colors.gradient}`
        )}>
          <Icon className={cn("w-10 h-10", colors.icon)} />
        </div>
        
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          {label}
        </p>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {slide.titulo}
        </h2>
      </motion.div>
    );
  }
  
  // Slide com conteúdo
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto"
    >
      {/* Header com ícone e label */}
      <div className="flex items-center gap-3 mb-5">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          colors.bg,
          "border",
          colors.border
        )}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          {slide.titulo && (
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">
              {slide.titulo}
            </h3>
          )}
        </div>
      </div>
      
      {/* Conteúdo */}
      <div 
        className={cn(
          "flex-1 rounded-2xl border p-5 md:p-6",
          colors.bg,
          colors.border
        )}
        style={{ fontSize: `${fontSize}px` }}
      >
        {slide.tipo === 'tabela' ? (
          <div className="overflow-x-auto">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <table className="w-full text-sm border-collapse">
                    {children}
                  </table>
                ),
                thead: ({ children }) => (
                  <thead className="bg-cyan-500/20">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-semibold border-b border-cyan-500/30 text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 border-b border-border/50 text-muted-foreground">
                    {children}
                  </td>
                )
              }}
            >
              {slide.conteudo}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {slide.conteudo}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ConceitoSlideCard;
