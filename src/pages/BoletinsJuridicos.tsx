import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Newspaper, Scale, Briefcase, Building, Play, Calendar, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Slide {
  imagem_url: string;
  titulo: string;
}

interface Boletim {
  id: string;
  tipo: string;
  data: string;
  total_noticias: number;
  texto_resumo?: string;
  url_audio_abertura?: string;
  slides?: Slide[];
  created_at: string;
}

const useCountdown = () => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 50, 0, 0);
      
      // Se já passou das 21:50 hoje, próximo é amanhã
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}min`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}min ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
};

const BoletinsJuridicos = () => {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const [activeTab, setActiveTab] = useState<"direito" | "concurso" | "politica">("direito");
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasBoletimHoje = boletins.some(b => b.data === today);

  useEffect(() => {
    fetchBoletins();
  }, [activeTab]);

  const fetchBoletins = async () => {
    setLoading(true);
    try {
      let data: Boletim[] = [];
      
      if (activeTab === "direito") {
        const { data: result, error } = await supabase
          .from('resumos_diarios')
          .select('id, tipo, data, total_noticias, texto_resumo, url_audio_abertura, slides, created_at')
          .in('tipo', ['direito', 'juridica'])
          .order('data', { ascending: false })
          .limit(30);

        if (error) throw error;
        data = (result || []).map(item => ({
          ...item,
          slides: Array.isArray(item.slides) ? (item.slides as unknown as Slide[]) : []
        }));
      } else {
        const { data: result, error } = await supabase
          .from('resumos_diarios')
          .select('id, tipo, data, total_noticias, texto_resumo, url_audio_abertura, slides, created_at')
          .eq('tipo', activeTab)
          .order('data', { ascending: false })
          .limit(30);

        if (error) throw error;
        data = (result || []).map(item => ({
          ...item,
          slides: Array.isArray(item.slides) ? (item.slides as unknown as Slide[]) : []
        }));
      }
      
      setBoletins(data);
    } catch (error) {
      console.error('Erro ao buscar boletins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "direito":
        return <Scale className="w-4 h-4" />;
      case "concurso":
        return <Briefcase className="w-4 h-4" />;
      case "politica":
        return <Building className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  const getCapaUrl = (boletim: Boletim) => {
    // Usar a primeira imagem dos slides como capa
    if (boletim.slides && boletim.slides.length > 0 && boletim.slides[0].imagem_url) {
      return boletim.slides[0].imagem_url;
    }
    return null;
  };

  const formatData = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dataStr;
    }
  };

  const formatDiaSemana = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "EEEE", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const handleBoletimClick = (boletim: Boletim) => {
    // Rota correta é /resumo-do-dia/:tipo
    const tipoParam = boletim.tipo === 'juridica' ? 'juridica' : boletim.tipo;
    navigate(`/resumo-do-dia/${tipoParam}?data=${boletim.data}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Boletins Jurídicos</h1>
            <p className="text-sm text-muted-foreground">
              Resumos diários de notícias por categoria
            </p>
          </div>
        </div>

        {/* Contagem regressiva */}
        {!hasBoletimHoje && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-slide-down">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Próximo boletim de {activeTab === "direito" ? "Direito" : activeTab === "concurso" ? "Concursos" : "Política"}</p>
                  <p className="text-xs text-muted-foreground">
                    Será gerado em <span className="font-bold text-primary">{countdown}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs de categoria */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="direito" 
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Scale className="w-4 h-4" />
              <span>Direito</span>
            </TabsTrigger>
            <TabsTrigger 
              value="concurso" 
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Briefcase className="w-4 h-4" />
              <span>Concursos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="politica" 
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building className="w-4 h-4" />
              <span>Política</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : boletins.length === 0 ? (
              <Card className="border-dashed animate-slide-down">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  {getTabIcon(activeTab)}
                  <h3 className="mt-4 font-semibold text-foreground">Nenhum boletim disponível</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Os boletins de {activeTab === "direito" ? "Direito" : activeTab === "concurso" ? "Concursos" : "Política"} serão gerados automaticamente às 21h50.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {boletins.map((boletim, index) => {
                  const capaUrl = getCapaUrl(boletim);
                  return (
                    <Card 
                      key={boletim.id}
                      className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md overflow-hidden animate-slide-down"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleBoletimClick(boletim)}
                    >
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Thumbnail/Capa */}
                          <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-muted relative overflow-hidden">
                            {capaUrl ? (
                              <img 
                                src={capaUrl} 
                                alt={`Capa do boletim de ${formatData(boletim.data)}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                  {getTabIcon(activeTab)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 p-3 md:p-4 flex flex-col justify-between">
                            <div>
                              <p className="font-semibold text-foreground capitalize">
                                {formatDiaSemana(boletim.data)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatData(boletim.data)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm font-medium text-foreground">
                                {boletim.total_noticias} notícias
                              </p>
                              {boletim.url_audio_abertura && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  Com áudio
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default BoletinsJuridicos;
