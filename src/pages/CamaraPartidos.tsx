import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flag, Search, Loader2, ChevronRight, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Partido {
  id: number;
  sigla: string;
  nome: string;
  url_logo?: string;
  conteudo_gerado?: string;
  url_capa?: string;
  url_audio?: string;
}

const CamaraPartidos = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    carregarPartidos();
  }, []);

  const carregarPartidos = async () => {
    setLoading(true);
    try {
      // Primeiro tentar cache local
      const { data: cacheData } = await supabase
        .from('cache_camara_deputados')
        .select('dados')
        .eq('tipo_cache', 'partidos_blog')
        .eq('chave_cache', 'lista_completa')
        .gt('expira_em', new Date().toISOString())
        .maybeSingle();

      if (cacheData?.dados && Array.isArray(cacheData.dados)) {
        setPartidos(cacheData.dados as unknown as Partido[]);
        setLoading(false);
        return;
      }

      // Buscar da API
      const { data, error } = await supabase.functions.invoke('buscar-partidos');
      
      if (error) throw error;
      
      const partidosData = (data?.partidos || []).map((p: any) => ({
        id: p.id,
        sigla: p.sigla,
        nome: p.nome,
        url_logo: p.urlLogo || null,
      }));

      setPartidos(partidosData);

      // Salvar em cache
      await supabase
        .from('cache_camara_deputados')
        .upsert({
          tipo_cache: 'partidos_blog',
          chave_cache: 'lista_completa',
          dados: partidosData,
          total_registros: partidosData.length,
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'tipo_cache,chave_cache' });

    } catch (error: any) {
      console.error('Erro ao carregar partidos:', error);
      toast({
        title: "Erro ao carregar partidos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const partidosFiltrados = partidos.filter(p => 
    p.sigla.toLowerCase().includes(busca.toLowerCase()) ||
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirPartido = (partido: Partido) => {
    navigate(`/camara-deputados/partidos/${partido.id}`, {
      state: { partido }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header com gradiente roxo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/50 via-neutral-950/80 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 px-4 pt-6 pb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Partidos Políticos</h1>
                <p className="text-sm text-neutral-400">
                  {partidos.length} partidos registrados
                </p>
              </div>
            </div>

            {/* Campo de busca estilizado */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                placeholder="Buscar por sigla ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-12 h-12 bg-neutral-900/80 border-white/10 text-white placeholder:text-neutral-500 focus:border-purple-500/50 rounded-xl"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de partidos */}
      <div className="px-4 pb-24 max-w-4xl mx-auto -mt-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : partidosFiltrados.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 mb-3 px-1">
              {partidosFiltrados.length} partido{partidosFiltrados.length !== 1 ? 's' : ''} encontrado{partidosFiltrados.length !== 1 ? 's' : ''}
            </p>
            
            {partidosFiltrados.map((partido, index) => (
              <motion.div
                key={partido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card
                  className="cursor-pointer bg-neutral-900/80 backdrop-blur-sm border-white/5 hover:border-purple-500/30 transition-all duration-300 group overflow-hidden"
                  onClick={() => abrirPartido(partido)}
                >
                  {/* Linha decorativa no topo */}
                  <div className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <CardContent className="p-4 flex items-center gap-4">
                    {partido.url_logo ? (
                      <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 p-1.5 ring-1 ring-white/20">
                        <img 
                          src={partido.url_logo} 
                          alt={partido.sigla}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                        <span className="text-lg font-bold text-purple-400">
                          {partido.sigla.substring(0, 2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors">{partido.sigla}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-1">{partido.nome}</p>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-neutral-900/80 border-white/5">
            <CardContent className="p-8 text-center">
              <Flag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Nenhum partido encontrado</h3>
              <p className="text-sm text-neutral-500">
                Tente buscar por outra sigla ou nome
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CamaraPartidos;
