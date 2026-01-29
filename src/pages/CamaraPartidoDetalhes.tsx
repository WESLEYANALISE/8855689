import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag, Loader2, Play, Pause, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PartidoDetalhes {
  id: number;
  sigla: string;
  nome: string;
  url_logo?: string;
  conteudo_gerado?: string;
  url_capa?: string;
  url_audio?: string;
  gerado_em?: string;
}

const CamaraPartidoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [partido, setPartido] = useState<PartidoDetalhes | null>(
    (location.state as any)?.partido || null
  );
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      carregarPartido();
    }
  }, [id]);

  const carregarPartido = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Buscar dados do cache
      const { data: cacheData } = await supabase
        .from('cache_camara_deputados')
        .select('dados')
        .eq('tipo_cache', 'partido_conteudo')
        .eq('chave_cache', `partido_${id}`)
        .maybeSingle();

      if (cacheData?.dados) {
        const dadosPartido = cacheData.dados as unknown as PartidoDetalhes;
        setPartido(prev => ({ ...prev, ...dadosPartido }));
        
        // Se não tem conteúdo gerado, gerar automaticamente
        if (!dadosPartido.conteudo_gerado) {
          await gerarConteudo();
        }
      } else if (partido) {
        // Se não tem cache mas tem dados do state, gerar conteúdo
        await gerarConteudo();
      }
    } catch (error) {
      console.error('Erro ao carregar partido:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarConteudo = async () => {
    if (!partido || gerando) return;
    
    setGerando(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-partido', {
        body: {
          partidoId: partido.id,
          sigla: partido.sigla,
          nome: partido.nome
        }
      });

      if (error) throw error;

      if (data) {
        const partidoAtualizado = {
          ...partido,
          conteudo_gerado: data.conteudo,
          url_capa: data.url_capa,
          url_audio: data.url_audio,
          gerado_em: new Date().toISOString()
        };
        
        setPartido(partidoAtualizado);

        // Salvar no cache
        await supabase
          .from('cache_camara_deputados')
          .upsert({
            tipo_cache: 'partido_conteudo',
            chave_cache: `partido_${partido.id}`,
            dados: partidoAtualizado,
            total_registros: 1,
            expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }, { onConflict: 'tipo_cache,chave_cache' });

        toast({
          title: "Conteúdo gerado!",
          description: "O artigo sobre o partido foi criado com sucesso."
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar conteúdo:', error);
      toast({
        title: "Erro ao gerar conteúdo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGerando(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current || !partido?.url_audio) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading && !partido) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 text-center">
        <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold">Partido não encontrado</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header com capa */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Capa do partido */}
        {partido.url_capa && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
            <img 
              src={partido.url_capa} 
              alt={partido.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Botão de áudio */}
            {partido.url_audio && (
              <button
                onClick={toggleAudio}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center shadow-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Info do partido */}
        <div className="flex items-center gap-4">
          {partido.url_logo ? (
            <img 
              src={partido.url_logo} 
              alt={partido.sigla}
              className="w-16 h-16 rounded-xl object-contain bg-white p-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {partido.sigla.substring(0, 2)}
              </span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{partido.sigla}</h1>
            <p className="text-muted-foreground">{partido.nome}</p>
          </div>
        </div>
      </motion.div>

      {/* Áudio escondido */}
      {partido.url_audio && (
        <audio 
          ref={audioRef}
          src={partido.url_audio}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Conteúdo */}
      {gerando ? (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Gerando conteúdo...</h3>
            <p className="text-sm text-muted-foreground">
              Buscando informações na Wikipedia e criando o artigo
            </p>
          </CardContent>
        </Card>
      ) : partido.conteudo_gerado ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-purple-400 mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-purple-400 mt-6 mb-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-purple-300 mt-4 mb-2">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-foreground/90 mb-4 leading-relaxed">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-purple-400 font-semibold">{children}</strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-500 pl-4 my-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground/90">{children}</li>
                    ),
                  }}
                >
                  {partido.conteudo_gerado}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Conteúdo não disponível</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Clique abaixo para gerar o artigo sobre este partido
            </p>
            <Button onClick={gerarConteudo} className="bg-purple-600 hover:bg-purple-700">
              Gerar Conteúdo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CamaraPartidoDetalhes;
