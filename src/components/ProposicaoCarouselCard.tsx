import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
interface ProposicaoCarouselCardProps {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  tituloGeradoIA?: string;
  ementa: string;
  autorNome?: string;
  autorFoto?: string;
  dataApresentacao?: string;
  onClick: () => void;
}

const ProposicaoCarouselCard = ({
  siglaTipo,
  numero,
  ano,
  tituloGeradoIA,
  ementa,
  autorNome,
  autorFoto,
  dataApresentacao,
  onClick,
}: ProposicaoCarouselCardProps) => {
  // Limpar "Senado Federal -" do nome
  const nomeAutorLimpo = autorNome?.replace(/^Senado Federal\s*-\s*/i, '').trim();
  
  // Formatar data
  const dataFormatada = dataApresentacao ? new Date(dataApresentacao).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;
  const [foto, setFoto] = useState<string | undefined>(autorFoto || undefined);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Não buscar foto se já tem, se não tem nome, ou se é do Senado Federal
      if (foto || !autorNome || autorNome.startsWith('Senado Federal')) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('buscar-deputados', {
          body: { nome: autorNome }
        });
        if (!error) {
          const url = (data as any)?.deputados?.[0]?.urlFoto as string | undefined;
          if (url && !cancelled) setFoto(url);
        }
      } catch (_) {
        // silencioso
      }
    };
    run();
    return () => { cancelled = true; };
  }, [autorNome, foto]);

  return (
    <Card
      onClick={onClick}
      className="flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_18%] min-w-0 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl border border-border hover:border-accent/50 shadow-lg bg-card"
    >
      {/* Foto do autor */}
      <div className="aspect-square relative bg-secondary overflow-hidden">
        {foto ? (
          <img
            src={foto}
            alt={nomeAutorLimpo || 'Autor'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Erro ao carregar foto do autor:', {
                nome: nomeAutorLimpo,
                url: foto
              });
              setFoto(undefined);
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
            <User className="w-24 h-24 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {nomeAutorLimpo && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-medium text-sm drop-shadow-lg">
              Por: {nomeAutorLimpo}
            </p>
          </div>
        )}
      </div>
      
      {/* Conteúdo abaixo da foto */}
      <div className="p-3 space-y-2">
        {/* Badge da PL logo após a foto */}
        <Badge 
          variant="secondary" 
          className="bg-destructive text-destructive-foreground font-bold text-xs px-2 py-0.5 w-fit"
        >
          {siglaTipo} {numero}/{ano}
        </Badge>
        
        {/* Ementa truncada em 2 linhas */}
        <p className="text-foreground text-xs leading-snug line-clamp-2">
          {ementa}
        </p>
        
        {dataFormatada && (
          <p className="text-muted-foreground text-[10px]">
            {dataFormatada}
          </p>
        )}
      </div>
    </Card>
  );
};

export default ProposicaoCarouselCard;