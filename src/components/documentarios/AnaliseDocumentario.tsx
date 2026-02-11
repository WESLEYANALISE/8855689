import { useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { 
  BookOpen, 
  Target, 
  Scale, 
  Lightbulb, 
  Link2, 
  Info,
  Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnaliseDocumentarioProps {
  analise: string;
}

interface SecaoAnalise {
  titulo: string;
  icone: React.ReactNode;
  conteudo: string;
  cor: string;
}

// Função fora do componente para evitar problemas de hoisting
const mapearSecao = (titulo: string, conteudo: string): SecaoAnalise => {
  const tituloLower = titulo.toLowerCase();
  
  if (tituloLower.includes('sobre') || tituloLower.includes('documentário')) {
    return {
      titulo: 'Sobre o Documentário',
      icone: <Play className="w-4 h-4" />,
      conteudo,
      cor: 'amber'
    };
  }
  if (tituloLower.includes('temas') || tituloLower.includes('principais')) {
    return {
      titulo: 'Temas Principais',
      icone: <Target className="w-4 h-4" />,
      conteudo,
      cor: 'blue'
    };
  }
  if (tituloLower.includes('relevância') || tituloLower.includes('jurídica')) {
    return {
      titulo: 'Relevância Jurídica',
      icone: <Scale className="w-4 h-4" />,
      conteudo,
      cor: 'purple'
    };
  }
  if (tituloLower.includes('aprender') || tituloLower.includes('vai aprender')) {
    return {
      titulo: 'O Que Você Vai Aprender',
      icone: <Lightbulb className="w-4 h-4" />,
      conteudo,
      cor: 'green'
    };
  }
  if (tituloLower.includes('áreas') || tituloLower.includes('relacionadas')) {
    return {
      titulo: 'Áreas do Direito Relacionadas',
      icone: <Link2 className="w-4 h-4" />,
      conteudo,
      cor: 'rose'
    };
  }
  
  return {
    titulo,
    icone: <Info className="w-4 h-4" />,
    conteudo,
    cor: 'slate'
  };
};

const AnaliseDocumentario = ({ analise }: AnaliseDocumentarioProps) => {
  // Parsear o markdown e extrair seções
  const secoes = useMemo(() => {
    const resultado: SecaoAnalise[] = [];
    
    const linhas = analise.split('\n');
    let secaoAtual: { titulo: string; conteudo: string[] } | null = null;
    
    for (const linha of linhas) {
      const matchTitulo = linha.match(/^##\s*(.+)$/);
      const matchEmoji = linha.match(/^(📺|🎯|📚|💡|🔗)\s*(.+)$/);
      
      if (matchTitulo || matchEmoji) {
        if (secaoAtual && secaoAtual.conteudo.length > 0) {
          resultado.push(mapearSecao(secaoAtual.titulo, secaoAtual.conteudo.join('\n')));
        }
        
        const titulo = matchTitulo ? matchTitulo[1] : (matchEmoji ? matchEmoji[2] : '');
        secaoAtual = { titulo: titulo.replace(/^[📺🎯📚💡🔗]\s*/, ''), conteudo: [] };
      } else if (secaoAtual) {
        secaoAtual.conteudo.push(linha);
      }
    }
    
    if (secaoAtual && secaoAtual.conteudo.length > 0) {
      resultado.push(mapearSecao(secaoAtual.titulo, secaoAtual.conteudo.join('\n')));
    }
    
    return resultado;
  }, [analise]);

  const renderConteudo = (conteudo: string) => {
    const linhas = conteudo.split('\n').filter(l => l.trim());
    
    return linhas.map((linha, idx) => {
      const textoLimpo = linha
        .replace(/^\*\s*/, '')
        .replace(/^\-\s*/, '')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>');
      
      if (linha.trim().startsWith('*') || linha.trim().startsWith('-')) {
        return (
          <li 
            key={idx} 
            className="text-sm text-muted-foreground leading-relaxed ml-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(textoLimpo) }}
          />
        );
      }
      
      if (textoLimpo.trim()) {
        return (
          <p 
            key={idx} 
            className="text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(textoLimpo) }}
          />
        );
      }
      
      return null;
    });
  };

  const getCorClasses = (cor: string) => {
    const cores: Record<string, { border: string; bg: string; text: string; badge: string }> = {
      amber: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', badge: 'border-amber-500/50 text-amber-500' },
      blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', badge: 'border-blue-500/50 text-blue-500' },
      purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', badge: 'border-purple-500/50 text-purple-500' },
      green: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500', badge: 'border-green-500/50 text-green-500' },
      rose: { border: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', badge: 'border-rose-500/50 text-rose-500' },
      slate: { border: 'border-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-500', badge: 'border-slate-500/50 text-slate-500' },
    };
    return cores[cor] || cores.slate;
  };

  if (secoes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-xl p-4 border-l-4 border-amber-500">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {analise}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {secoes.map((secao, idx) => {
        const cores = getCorClasses(secao.cor);
        
        return (
          <div 
            key={idx}
            className={`bg-card rounded-xl p-4 border-l-4 ${cores.border} transition-colors`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full ${cores.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={cores.text}>{secao.icone}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground flex-1">
                {secao.titulo}
              </h3>
              <Badge variant="outline" className={`text-xs ${cores.badge}`}>
                {idx + 1}/{secoes.length}
              </Badge>
            </div>
            
            <div className="space-y-2 pl-9">
              {renderConteudo(secao.conteudo)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnaliseDocumentario;
