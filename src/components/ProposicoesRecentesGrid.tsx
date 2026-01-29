import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

const ProposicoesRecentesGrid = () => {
  const navigate = useNavigate();

  const { data: proposicoes, isLoading } = useQuery({
    queryKey: ['proposicoes-recentes'],
    queryFn: async () => {
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('cache_proposicoes_recentes')
        .select('*')
        .eq('sigla_tipo', 'PL')
        .gte('data_apresentacao', dataHoje)
        .order('ordem_cache', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Atualizar a cada 5 minutos
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="md:text-lg text-foreground font-normal text-base">Projetos de Lei Recentes</h2>
        </div>
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 md:gap-4 md:grid md:grid-cols-[repeat(4.5,minmax(0,1fr))]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse min-w-[45%] md:min-w-0">
              <div className="bg-muted rounded-xl aspect-square mb-2" />
              <div className="bg-muted h-4 rounded w-3/4 mb-2" />
              <div className="bg-muted h-3 rounded w-full mb-1" />
              <div className="bg-muted h-3 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
      </div>
    );
  }

  if (!proposicoes || proposicoes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="md:text-lg text-foreground font-normal text-base">Projetos de Lei Recentes</h2>
        <button 
          onClick={() => navigate("/camara-deputados/proposicoes")} 
          className="text-accent font-medium flex items-center text-sm md:text-xs"
        >
          Ver todas <span className="text-lg md:text-base ml-0.5">›</span>
        </button>
      </div>
      
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 md:gap-4 md:grid md:grid-cols-[repeat(4.5,minmax(0,1fr))]">
          {proposicoes.map((proposicao: any) => {
          const nomeAutorLimpo = proposicao.autor_principal_nome?.replace(/^Senado Federal\s*-\s*/i, '').trim();
          const dataFormatada = proposicao.data_apresentacao 
            ? new Date(proposicao.data_apresentacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            : null;

          return (
            <Card
              key={proposicao.id_proposicao}
              onClick={() => navigate(`/camara-deputados/proposicao/${proposicao.id_proposicao}`)}
              className="overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl border border-border hover:border-accent/50 shadow-lg bg-card min-w-[45%] md:min-w-0"
            >
              {/* Foto do autor */}
              <div className="aspect-square relative bg-secondary overflow-hidden">
                {proposicao.autor_principal_foto ? (
                  <img
                    src={proposicao.autor_principal_foto}
                    alt={nomeAutorLimpo || 'Autor'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const parent = target.parentElement;
                      target.style.display = 'none';
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center bg-muted';
                        fallback.innerHTML = '<svg class="w-24 h-24 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <User className="w-16 md:w-24 h-16 md:h-24 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {nomeAutorLimpo && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                    <p className="text-white font-medium text-xs md:text-sm drop-shadow-lg line-clamp-1">
                      Por: {nomeAutorLimpo}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Conteúdo abaixo da foto */}
              <div className="p-3 md:p-4 space-y-2">
                {/* Badge da PL */}
                <Badge 
                  variant="secondary" 
                  className="bg-destructive text-destructive-foreground font-bold text-xs px-2 py-0.5 w-fit"
                >
                  {proposicao.sigla_tipo} {proposicao.numero}/{proposicao.ano}
                </Badge>
                
                {/* Título gerado por IA ou Ementa truncada */}
                <p className="text-foreground text-xs md:text-sm leading-relaxed line-clamp-3">
                  {proposicao.titulo_gerado_ia || proposicao.ementa}
                </p>
                
                {dataFormatada && (
                  <p className="text-muted-foreground text-xs">
                    {dataFormatada}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default ProposicoesRecentesGrid;
