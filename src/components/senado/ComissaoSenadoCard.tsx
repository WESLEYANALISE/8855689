import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Calendar, Building2, ChevronRight } from "lucide-react";

interface ComissaoSenadoCardProps {
  comissao: {
    codigo?: string;
    sigla?: string;
    nome?: string;
    tipo?: string;
    casa?: string;
    ativa?: boolean;
    participantes?: number;
    dataCriacao?: string;
    dataExtincao?: string;
    // Campos da API de senador-comissoes
    cargo?: string;
    dataInicio?: string;
    dataFim?: string;
    titular?: string;
  };
  index?: number;
  onClick?: () => void;
  variant?: 'default' | 'senador'; // Variante para exibição em página de senador
}

export const ComissaoSenadoCard = ({ comissao, index = 0, onClick, variant = 'default' }: ComissaoSenadoCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Determinar se está ativa baseado nos campos disponíveis
  const isAtiva = comissao.ativa !== undefined ? comissao.ativa : (!comissao.dataExtincao && !comissao.dataFim);
  
  // Determinar cor baseada no tipo
  const getTipoColor = () => {
    const tipo = comissao.tipo?.toLowerCase() || '';
    if (tipo.includes('permanente')) return 'bg-blue-500/20 text-blue-400';
    if (tipo.includes('temporária') || tipo.includes('temporaria')) return 'bg-orange-500/20 text-orange-400';
    if (tipo.includes('mista') || comissao.casa === 'CN') return 'bg-purple-500/20 text-purple-400';
    if (tipo.includes('parlamentar')) return 'bg-green-500/20 text-green-400';
    return 'bg-muted text-muted-foreground';
  };
  
  return (
    <div className="animate-fade-in">
      <Card 
        className="bg-card border-border hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Header com sigla e status */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {comissao.sigla && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-bold">
                    {comissao.sigla}
                  </span>
                )}
                {isAtiva !== undefined && (
                  isAtiva ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Ativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                      <XCircle className="w-3 h-3" />
                      Extinta
                    </span>
                  )
                )}
                {comissao.casa && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    {comissao.casa === 'SF' ? 'Senado' : comissao.casa === 'CN' ? 'Congresso' : comissao.casa}
                  </span>
                )}
              </div>
              
              {/* Nome da comissão */}
              <p className="text-sm font-medium text-foreground mt-2 leading-tight">
                {comissao.nome || 'Nome não disponível'}
              </p>
              
              {/* Cargo do senador na comissão (para variante senador) */}
              {variant === 'senador' && comissao.cargo && (
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    comissao.cargo.toLowerCase().includes('presidente') 
                      ? 'bg-green-500/20 text-green-400'
                      : comissao.cargo.toLowerCase().includes('vice')
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                  {comissao.cargo}
                  </span>
                  {comissao.titular !== undefined && (
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      String(comissao.titular) === 'Sim' || String(comissao.titular) === 'true'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {String(comissao.titular) === 'Sim' || String(comissao.titular) === 'true' ? 'Titular' : 'Suplente'}
                    </span>
                  )}
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                {comissao.tipo && (
                  <span className={`px-2 py-1 rounded ${getTipoColor()}`}>
                    {comissao.tipo}
                  </span>
                )}
                {comissao.participantes !== undefined && comissao.participantes > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                    <Users className="w-3 h-3" />
                    <span>{comissao.participantes} membros</span>
                  </div>
                )}
                
                {/* Data de início/fim ou criação */}
                {(comissao.dataInicio || comissao.dataCriacao) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(comissao.dataInicio || comissao.dataCriacao)}
                      {comissao.dataFim && ` - ${formatDate(comissao.dataFim)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Arrow indicator */}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-400 transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
