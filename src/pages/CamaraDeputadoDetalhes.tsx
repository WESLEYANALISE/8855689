import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, Phone, User, MapPin, Flag, Building2, GraduationCap, 
  Calendar, Users, Briefcase, BadgeCheck, DoorOpen, TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { DespesaCard } from "@/components/DespesaCard";
import { GraficoEvolucaoGastos } from "@/components/GraficoEvolucaoGastos";

const CACHE_KEY = 'cache_deputado_detalhes';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

const CamaraDeputadoDetalhes = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [deputado, setDeputado] = useState<any>(null);
  const [despesas, setDespesas] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const carregarDetalhes = async () => {
    // Cache-first: verificar localStorage
    const cacheKey = `${CACHE_KEY}_${id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isValid = Date.now() - timestamp < CACHE_DURATION;
      
      if (isValid && data) {
        setDeputado(data);
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "detalhes-deputado",
        { body: { idDeputado: id } }
      );

      if (error) throw error;
      
      setDeputado(data.deputado);
      
      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: data.deputado,
        timestamp: Date.now()
      }));
    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarDespesas = async () => {
    if (!id) return;
    
    setLoadingDespesas(true);
    try {
      const anoAtual = new Date().getFullYear();
      const { data, error } = await supabase.functions.invoke(
        "deputado-despesas",
        { body: { idDeputado: id, ano: anoAtual } }
      );

      if (error) throw error;
      setDespesas(data.despesas || []);
    } catch (error: any) {
      console.error("Erro ao carregar despesas:", error);
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingDespesas(false);
    }
  };

  if (loading) {
    return <ContentGenerationLoader message="Carregando dados do deputado..." />;
  }

  if (!deputado) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <p className="text-center text-muted-foreground">Deputado não encontrado</p>
      </div>
    );
  }

  const status = deputado.ultimoStatus;
  const gabinete = status?.gabinete;

  return (
    <div className="px-3 py-2 max-w-4xl mx-auto pb-20 space-y-3">
      {/* Card Principal */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {status?.urlFoto ? (
              <img
                src={status.urlFoto}
                alt={deputado.nomeCivil}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-tight">{deputado.nomeCivil}</h1>
              <p className="text-sm text-muted-foreground">{status?.nomeEleitoral}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                  <Flag className="w-3 h-3" />
                  {status?.siglaPartido}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  {status?.siglaUf}
                </span>
                {status?.situacao && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    <BadgeCheck className="w-3 h-3" />
                    {status.situacao}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-amber-400 mb-2">Contato</h2>
          
          <div className="grid grid-cols-1 gap-2 text-sm">
            {gabinete?.email && (
              <a href={`mailto:${gabinete.email}`} className="flex items-center gap-2 hover:text-amber-400">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="truncate">{gabinete.email}</span>
              </a>
            )}
            {gabinete?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>{gabinete.telefone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gabinete */}
      {gabinete && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-amber-400 mb-2">Gabinete</h2>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {gabinete.predio && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Prédio</p>
                    <p className="font-medium">{gabinete.predio}</p>
                  </div>
                </div>
              )}
              {gabinete.andar && (
                <div className="flex items-start gap-2">
                  <DoorOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Andar</p>
                    <p className="font-medium">{gabinete.andar}º</p>
                  </div>
                </div>
              )}
              {gabinete.sala && (
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sala</p>
                    <p className="font-medium">{gabinete.sala}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Pessoais */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-amber-400 mb-2">Informações Pessoais</h2>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {deputado.dataNascimento && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Nascimento</p>
                  <p className="font-medium">{new Date(deputado.dataNascimento).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}
            {deputado.municipioNascimento && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Naturalidade</p>
                  <p className="font-medium">{deputado.municipioNascimento}/{deputado.ufNascimento}</p>
                </div>
              </div>
            )}
            {deputado.escolaridade && (
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Escolaridade</p>
                  <p className="font-medium">{deputado.escolaridade}</p>
                </div>
              </div>
            )}
            {deputado.sexo && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Sexo</p>
                  <p className="font-medium">{deputado.sexo === 'F' ? 'Feminino' : 'Masculino'}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mandato */}
      {status?.condicaoEleitoral && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-amber-400 mb-2">Mandato</h2>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Condição</p>
                <p className="font-medium">{status.condicaoEleitoral}</p>
              </div>
              {status.idLegislatura && (
                <div>
                  <p className="text-xs text-muted-foreground">Legislatura</p>
                  <p className="font-medium">{status.idLegislatura}ª</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolução de Gastos */}
      {id && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400">Evolução de Gastos</h2>
            </div>
            <GraficoEvolucaoGastos politicoId={id} tipo="deputado" />
          </CardContent>
        </Card>
      )}

      {/* Despesas */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-400">Despesas ({new Date().getFullYear()})</h2>
            {despesas.length === 0 && !loadingDespesas && (
              <Button 
                onClick={carregarDespesas} 
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 h-7 text-xs"
              >
                Ver Despesas
              </Button>
            )}
          </div>
          
          {loadingDespesas && <ContentGenerationLoader message="Carregando..." />}
          
          {despesas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Total: <span className="text-amber-400 font-semibold">
                  {despesas.reduce((sum, d) => sum + d.valorLiquido, 0).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </span>
              </p>
              {despesas.slice(0, 10).map((despesa, index) => (
                <DespesaCard key={index} despesa={despesa} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CamaraDeputadoDetalhes;
