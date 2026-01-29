import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Play, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Scale,
  Gavel,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BuscaSemanticaAudiencias } from "@/components/audiencias/BuscaSemanticaAudiencias";
import { UltimasAudienciasCarousel } from "@/components/audiencias/UltimasAudienciasCarousel";

interface Canal {
  id: string;
  tribunal: string;
  nome: string;
  ativo: boolean;
}

interface Video {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  publicado_em: string | null;
  status: string;
  canais_audiencias: Canal;
  audiencias_analises: Array<{
    id: string;
    resumo: string | null;
    temas_principais: string[];
    termos_chave: string[];
  }>;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pendente: { label: "Pendente", icon: <Clock className="w-3 h-3" />, color: "bg-yellow-500/10 text-yellow-500" },
  analisando: { label: "Analisando", icon: <Loader2 className="w-3 h-3 animate-spin" />, color: "bg-blue-500/10 text-blue-500" },
  concluido: { label: "Analisado", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-green-500/10 text-green-500" },
  erro: { label: "Erro", icon: <AlertCircle className="w-3 h-3" />, color: "bg-red-500/10 text-red-500" }
};

const tribunalIcons: Record<string, React.ReactNode> = {
  STF: <Scale className="w-3.5 h-3.5" />,
  STJ: <Gavel className="w-3.5 h-3.5" />,
  TST: <Building2 className="w-3.5 h-3.5" />,
  TSE: <Building2 className="w-3.5 h-3.5" />,
  CNJ: <Building2 className="w-3.5 h-3.5" />,
  default: <Building2 className="w-3.5 h-3.5" />
};

// Tribunais permitidos (excluindo TV Justiça)
const TRIBUNAIS_PERMITIDOS = ['CNJ', 'STF', 'STJ', 'TSE', 'TST'];

// Função para verificar se é uma sessão de julgamento
const isSessao = (titulo: string): boolean => {
  const tituloLower = titulo.toLowerCase();
  return (
    tituloLower.includes('sessão') ||
    tituloLower.includes('sessao') ||
    tituloLower.includes('plenária') ||
    tituloLower.includes('plenario') ||
    tituloLower.includes('julgamento') ||
    tituloLower.includes('turma') ||
    tituloLower.includes('corte especial') ||
    tituloLower.includes('órgão especial') ||
    tituloLower.includes('orgao especial') ||
    tituloLower.includes('sdi-')
  );
};

export default function Audiencias() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [tribunalFiltro, setTribunalFiltro] = useState<string>("todos");
  const [sincronizando, setSincronizando] = useState(false);

  // Buscar canais (excluindo TV Justiça)
  const { data: canais } = useQuery({
    queryKey: ['canais-audiencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canais_audiencias')
        .select('*')
        .eq('ativo', true)
        .in('tribunal', TRIBUNAIS_PERMITIDOS)
        .order('tribunal');
      
      if (error) throw error;
      return data as Canal[];
    }
  });

  // Obter canal_id do tribunal filtrado
  const canalIdFiltrado = canais?.find(c => c.tribunal === tribunalFiltro)?.id || null;

  // Buscar vídeos com análises (apenas sessões)
  const { data: videos, isLoading, refetch } = useQuery({
    queryKey: ['audiencias-videos', tribunalFiltro, busca],
    queryFn: async () => {
      // Se houver filtro por tribunal, primeiro buscar o canal_id
      let canalId: string | null = null;
      if (tribunalFiltro !== 'todos') {
        const { data: canalData } = await supabase
          .from('canais_audiencias')
          .select('id')
          .eq('tribunal', tribunalFiltro)
          .maybeSingle();
        canalId = canalData?.id || null;
      }

      let query = supabase
        .from('audiencias_videos')
        .select(`
          *,
          canais_audiencias!inner(id, tribunal, nome, ativo),
          audiencias_analises(id, resumo, temas_principais, termos_chave)
        `)
        .in('canais_audiencias.tribunal', TRIBUNAIS_PERMITIDOS)
        .order('publicado_em', { ascending: false })
        .limit(100);

      // Filtrar por canal_id diretamente
      if (canalId) {
        query = query.eq('canal_id', canalId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar apenas sessões de julgamento
      let resultado = (data as Video[]).filter(v => isSessao(v.titulo));
      
      // Filtrar por busca
      if (busca) {
        const termoBusca = busca.toLowerCase();
        resultado = resultado.filter(v => 
          v.titulo.toLowerCase().includes(termoBusca) ||
          v.audiencias_analises?.some(a => 
            a.termos_chave?.some(t => t.toLowerCase().includes(termoBusca)) ||
            a.temas_principais?.some(t => t.toLowerCase().includes(termoBusca))
          )
        );
      }

      return resultado;
    }
  });

  const sincronizarVideos = async () => {
    setSincronizando(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-videos-canais-tribunais', {
        body: { maxResults: 15 }
      });

      if (error) throw error;

      if (data.novosVideos > 0) {
        toast.success(`${data.novosVideos} novos vídeos encontrados!`);
        refetch();
      } else {
        toast.info("Nenhum vídeo novo encontrado");
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error("Erro ao sincronizar vídeos");
    } finally {
      setSincronizando(false);
    }
  };

  const analisarVideo = async (videoId: string) => {
    try {
      toast.loading("Iniciando análise...", { id: `analise-${videoId}` });
      
      const { data, error } = await supabase.functions.invoke('analisar-audiencia-video', {
        body: { videoDbId: videoId }
      });

      if (error) throw error;

      toast.success("Análise concluída!", { id: `analise-${videoId}` });
      refetch();
    } catch (error) {
      console.error('Erro ao analisar:', error);
      toast.error("Erro ao analisar vídeo", { id: `analise-${videoId}` });
    }
  };

  const tribunaisUnicos = TRIBUNAIS_PERMITIDOS;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-4 py-4 space-y-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground truncate">Sessões dos Tribunais</h1>
            <p className="text-xs text-muted-foreground">
              Julgamentos com análise IA
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={sincronizarVideos}
            disabled={sincronizando}
            className="shrink-0"
          >
            {sincronizando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Carrossel de últimas audiências */}
        <UltimasAudienciasCarousel />

        {/* Busca semântica + normal */}
        <div className="flex gap-2">
          <BuscaSemanticaAudiencias />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sessão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Filtro por tribunal - compacto */}
        <Tabs value={tribunalFiltro} onValueChange={setTribunalFiltro}>
          <TabsList className="w-full justify-start overflow-x-auto h-9 p-1">
            <TabsTrigger value="todos" className="text-xs px-3 h-7">Todos</TabsTrigger>
            {tribunaisUnicos.map(tribunal => (
              <TabsTrigger key={tribunal} value={tribunal} className="text-xs px-3 h-7">
                {tribunal}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Lista de vídeos - cards compactos */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : videos?.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma sessão encontrada</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-3"
                onClick={sincronizarVideos}
              >
                Buscar sessões
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {videos?.map(video => {
                const status = statusConfig[video.status] || statusConfig.pendente;
                const analise = video.audiencias_analises?.[0];
                const tribunalIcon = tribunalIcons[video.canais_audiencias?.tribunal] || tribunalIcons.default;

                return (
                  <div 
                    key={video.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/ferramentas/audiencias/${video.id}`)}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail compacta */}
                      <div className="relative flex-shrink-0 w-28 sm:w-32 h-16 sm:h-20 rounded-lg overflow-hidden bg-muted">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Info compacta */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                              {video.titulo}
                            </h3>
                            <Badge className={`${status.color} flex items-center gap-1 shrink-0 text-[10px] px-1.5 py-0.5`}>
                              {status.icon}
                              <span className="hidden sm:inline">{status.label}</span>
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            {tribunalIcon}
                            {video.canais_audiencias?.tribunal}
                          </span>
                          {video.publicado_em && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(video.publicado_em), "dd MMM yyyy", { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Resumo preview - apenas em telas maiores */}
                        {analise?.resumo && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">
                            {analise.resumo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
