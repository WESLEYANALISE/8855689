import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface AlteracaoRecente {
  id: number;
  tabela_lei: string;
  nome_amigavel: string;
  alteracoes_detectadas: number;
  ultima_alteracao_detectada: string;
}

export default function AlteracoesRecentes() {
  const navigate = useNavigate();

  const { data: alteracoes, isLoading } = useQuery({
    queryKey: ['alteracoes-legislativas-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoramento_leis')
        .select('id, tabela_lei, nome_amigavel, alteracoes_detectadas, ultima_alteracao_detectada')
        .eq('status', 'com_alteracoes')
        .order('ultima_alteracao_detectada', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as AlteracaoRecente[];
    },
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  if (isLoading) {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardContent className="py-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  if (!alteracoes || alteracoes.length === 0) {
    return null;
  }

  const totalAlteracoes = alteracoes.reduce((acc, a) => acc + a.alteracoes_detectadas, 0);

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Alterações Legislativas</h3>
              <p className="text-xs text-muted-foreground">
                {totalAlteracoes} alterações detectadas
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            {alteracoes.length} leis
          </Badge>
        </div>

        <div className="space-y-2">
          {alteracoes.slice(0, 3).map(alt => (
            <div 
              key={alt.id}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {alt.nome_amigavel || alt.tabela_lei}
                </p>
                {alt.ultima_alteracao_detectada && (
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alt.ultima_alteracao_detectada), { 
                      locale: ptBR, 
                      addSuffix: true 
                    })}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">
                +{alt.alteracoes_detectadas}
              </Badge>
            </div>
          ))}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-3 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
          onClick={() => navigate('/alteracoes-legislativas')}
        >
          Ver todas as alterações
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
