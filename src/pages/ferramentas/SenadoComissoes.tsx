import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ComissaoSenadoCard } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Building2, ArrowLeft, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SenadoComissoes = () => {
  const navigate = useNavigate();
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchComissoes();
  }, []);

  const fetchComissoes = async () => {
    setLoading(true);
    try {
      // Primeiro tenta buscar do cache no Supabase
      const { data: cached, error: cacheError } = await supabase
        .from('senado_comissoes')
        .select('*')
        .order('sigla');

      if (!cacheError && cached && cached.length > 0) {
        console.log(`Carregando ${cached.length} comissões do cache`);
        const comissoesFormatadas = cached.map(c => ({
          codigo: c.codigo,
          sigla: c.sigla,
          nome: c.nome,
          tipo: c.tipo,
          casa: c.casa,
          dataCriacao: c.data_criacao,
          dataExtincao: c.data_extincao,
          ativa: c.ativa,
          participantes: c.participantes,
        }));
        setComissoes(comissoesFormatadas);
        setLoading(false);
        
        // Verificar se precisa atualizar em background
        const cacheAge = Date.now() - new Date(cached[0].updated_at).getTime();
        const cacheMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
        
        if (cacheAge > cacheMaxAge) {
          console.log('Cache antigo, atualizando em background...');
          syncFromAPI(false);
        }
        return;
      }

      // Se não tem cache, busca da API
      await syncFromAPI(true);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast.error('Erro ao carregar comissões');
      setLoading(false);
    }
  };

  const syncFromAPI = async (showLoading = true) => {
    if (showLoading) setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-comissoes-senado', {
        body: { forceRefresh: true }
      });

      if (error) throw error;
      
      const comissoesData = data?.comissoes || [];
      setComissoes(comissoesData);
      
      if (!showLoading) {
        toast.success(`${comissoesData.length} comissões atualizadas`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar comissões:', error);
      if (showLoading) {
        toast.error('Erro ao carregar comissões da API');
      }
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const comissoesFiltradas = comissoes.filter(c => {
    if (!filtroTipo || filtroTipo === "all") return true;
    if (filtroTipo === "ativas") return c.ativa;
    if (filtroTipo === "extintas") return !c.ativa;
    return c.tipo?.toLowerCase().includes(filtroTipo.toLowerCase());
  });

  const handleComissaoClick = (codigo: string) => {
    navigate(`/ferramentas/senado/comissao/${codigo}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ferramentas/senado')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="bg-purple-500/20 rounded-xl p-2">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Comissões</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Carregando...' : `${comissoesFiltradas.length} comissões`}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => syncFromAPI(true)}
            disabled={syncing}
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filtro */}
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ativas">Somente Ativas</SelectItem>
            <SelectItem value="extintas">Extintas</SelectItem>
            <SelectItem value="permanente">Permanentes</SelectItem>
            <SelectItem value="temporaria">Temporárias</SelectItem>
            <SelectItem value="mista">Mistas (CN)</SelectItem>
          </SelectContent>
        </Select>

        {/* Lista */}
        {loading ? (
          <SkeletonList count={10} />
        ) : (
          <div className="space-y-3">
            {comissoesFiltradas.map((comissao, index) => (
              <ComissaoSenadoCard 
                key={comissao.codigo || index} 
                comissao={comissao} 
                index={index}
                onClick={() => handleComissaoClick(comissao.codigo)}
              />
            ))}
            
            {comissoesFiltradas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comissão encontrada
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SenadoComissoes;
