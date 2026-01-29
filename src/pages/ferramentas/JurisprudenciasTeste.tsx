import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Scale, Loader2, ExternalLink, Globe, Building2 } from "lucide-react";
import { JurisprudenciaLoadingAnimation } from "@/components/jurisprudencia/JurisprudenciaLoadingAnimation";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JurisprudenciaDrawerEsaj from "@/components/jurisprudencia/JurisprudenciaDrawerEsaj";

// Tribunais estaduais com sistemas de jurisprudência (Browserless)
const TRIBUNAIS_ESTADUAIS = [
  { value: 'TJSP', label: 'TJSP - São Paulo', sistema: 'e-SAJ', funcional: true, funcao: 'buscar-jurisprudencia-browserless', aviso: '' },
  { value: 'TJMG', label: 'TJMG - Minas Gerais', sistema: 'Browserless', funcional: true, funcao: 'buscar-jurisprudencia-tjmg-browserless', aviso: '' },
  { value: 'TJRJ', label: 'TJRJ - Rio de Janeiro', sistema: 'Browserless', funcional: true, funcao: 'buscar-jurisprudencia-tjrj-browserless', aviso: '' },
  { value: 'TJPR', label: 'TJPR - Paraná', sistema: 'Browserless', funcional: true, funcao: 'buscar-jurisprudencia-tjpr-browserless', aviso: '' },
  { value: 'TJCE', label: 'TJCE - Ceará', sistema: 'Browserless', funcional: true, funcao: 'buscar-jurisprudencia-tjce-browserless', aviso: '' },
];

interface JurisprudenciaResult {
  id: string;
  numeroProcesso: string;
  classe: { nome: string; codigo: number } | string;
  assuntos?: string;
  assuntosLista?: { nome: string; codigo: number }[];
  dataJulgamento?: string;
  dataPublicacao?: string;
  dataAjuizamento?: string;
  orgaoJulgadorNome?: string;
  orgaoJulgador?: string;
  relator: string;
  ementa: string;
  ementaOriginal?: string;
  tribunal: string;
  grau?: string;
  textoCompleto?: string;
  comarca?: string;
  dataRegistro?: string;
  linkInteiroTeor?: string;
  fonte?: string;
  tema?: string;
  tese?: string;
}

interface ResultadoBusca {
  resultados: JurisprudenciaResult[];
  total: number;
  pagina?: number;
  paginasBuscadas?: number;
  tamanho?: number;
  tribunal?: string;
  fonte: string;
  termo?: string;
  urlOriginal?: string;
  avisoTribunal?: string;
  linkDireto?: string;
}

type FonteBusca = "estaduais" | "stf" | "stj";

const JurisprudenciasTeste = () => {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [tribunalEstadual, setTribunalEstadual] = useState("TJSP");
  const [fonte, setFonte] = useState<FonteBusca>("estaduais");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [tempoResposta, setTempoResposta] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JurisprudenciaResult | null>(null);
  const [etapasLoading, setEtapasLoading] = useState<string[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Gerenciar etapas de loading
  useEffect(() => {
    if (loading) {
      setEtapasLoading(['Verificando cache local...']);
      
      const t1 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Conectando ao tribunal...']), 1200);
      const t2 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Executando busca nos servidores...']), 2500);
      const t3 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Extraindo dados das ementas...']), 4000);
      const t4 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Processando resultados...']), 6000);
      const t5 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Ordenando por data...']), 8000);
      const t6 = setTimeout(() => setEtapasLoading(prev => [...prev, 'Finalizando...']), 10000);
      
      timeoutsRef.current = [t1, t2, t3, t4, t5, t6];
    } else {
      // Limpar timeouts quando loading terminar
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];
      setEtapasLoading([]);
    }

    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [loading]);

  const buscarTribunalEstadual = async () => {
    const tribunal = TRIBUNAIS_ESTADUAIS.find(t => t.value === tribunalEstadual);
    const funcao = tribunal?.funcao || 'buscar-jurisprudencia-esaj';
    
    const { data, error } = await supabase.functions.invoke(funcao, {
      body: { termo, pagina: 1, limite: 100, tribunal: tribunalEstadual }
    });
    if (error) throw error;
    return data;
  };

  const buscarSTF = async () => {
    const { data, error } = await supabase.functions.invoke("buscar-stf-browserless", {
      body: { termo, pagina: 1 }
    });
    if (error) throw error;
    return data;
  };

  const buscarSTJ = async () => {
    const { data, error } = await supabase.functions.invoke("buscar-stj-browserless", {
      body: { termo, pagina: 1 }
    });
    if (error) throw error;
    return data;
  };

  // Função para parsear data em diferentes formatos
  const parseDataJulgamento = (dataStr?: string): Date | null => {
    if (!dataStr) return null;
    try {
      // Formato DD/MM/YYYY
      if (dataStr.includes('/')) {
        const [dia, mes, ano] = dataStr.split('/').map(Number);
        return new Date(ano, mes - 1, dia);
      }
      // Formato ISO
      return new Date(dataStr);
    } catch {
      return null;
    }
  };

  // Verificar cache no Supabase
  const verificarCache = async (termoP: string, tribunalP: string): Promise<ResultadoBusca | null> => {
    const cacheKey = `${tribunalP}_${termoP.toLowerCase().trim()}`;
    const { data } = await supabase
      .from('jurisprudencias_cache')
      .select('dados, expira_em')
      .eq('cache_key', cacheKey)
      .single();
    
    if (data && data.expira_em && new Date(data.expira_em) > new Date()) {
      console.log('📦 Usando cache para:', cacheKey);
      return data.dados as unknown as ResultadoBusca;
    }
    return null;
  };

  // Salvar no cache
  const salvarCache = async (termoP: string, tribunalP: string, dados: ResultadoBusca) => {
    const cacheKey = `${tribunalP}_${termoP.toLowerCase().trim()}`;
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24); // Cache de 24h
    
    try {
      await supabase.from('jurisprudencias_cache').upsert({
        cache_key: cacheKey,
        termo: termoP.toLowerCase().trim(),
        tribunal: tribunalP,
        dados: dados as any,
        updated_at: new Date().toISOString(),
        expira_em: expiraEm.toISOString()
      }, { onConflict: 'cache_key' });
      console.log('💾 Cache salvo para:', cacheKey);
    } catch (err) {
      console.warn('Falha ao salvar cache:', err);
    }
  };

  const buscar = async () => {
    if (!termo.trim()) {
      toast.error("Digite um termo de busca");
      return;
    }

    setLoading(true);
    setResultado(null);
    const inicio = Date.now();

    // Determinar tribunal atual
    const tribunalAtual = fonte === 'estaduais' ? tribunalEstadual : fonte.toUpperCase();

    try {
      // Verificar cache primeiro
      const cacheData = await verificarCache(termo, tribunalAtual);
      if (cacheData) {
        setTempoResposta(Date.now() - inicio);
        setResultado(cacheData);
        toast.success(`${cacheData.total || cacheData.resultados?.length || 0} resultados (do cache)`);
        return;
      }

      let data;
      switch (fonte) {
        case "estaduais":
          data = await buscarTribunalEstadual();
          break;
        case "stf":
          data = await buscarSTF();
          break;
        case "stj":
          data = await buscarSTJ();
          break;
      }
      
      setTempoResposta(Date.now() - inicio);

      if (data.error) {
        if (data.tribunalIndisponivel) {
          toast.warning(data.error);
          setTribunalEstadual('TJSP');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      // Ordenar resultados por data mais recente
      if (data.resultados && data.resultados.length > 0) {
        data.resultados.sort((a: JurisprudenciaResult, b: JurisprudenciaResult) => {
          const dateA = parseDataJulgamento(a.dataJulgamento);
          const dateB = parseDataJulgamento(b.dataJulgamento);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        });
      }

      setResultado(data);
      
      // Salvar no cache
      await salvarCache(termo, tribunalAtual, data);
      
      if (data.avisoTribunal) {
        toast.warning(data.avisoTribunal.substring(0, 100) + '...', {
          duration: 8000,
        });
      } else {
        toast.success(`${data.total || data.resultados?.length || 0} resultados encontrados`);
      }
    } catch (error: any) {
      console.error("Erro na busca:", error);
      toast.error(error.message || "Erro ao buscar jurisprudências");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return "N/A";
    try {
      if (dataStr.includes('/')) return dataStr;
      return new Date(dataStr).toLocaleDateString("pt-BR");
    } catch {
      return dataStr;
    }
  };

  const getClasseNome = (classe: any) => {
    if (!classe) return 'N/A';
    if (typeof classe === 'string') return decodeHtmlEntities(classe);
    return classe.nome || 'N/A';
  };

  const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ndash;/g, '\u2013')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&aacute;/gi, 'á')
      .replace(/&agrave;/gi, 'à')
      .replace(/&atilde;/gi, 'ã')
      .replace(/&acirc;/gi, 'â')
      .replace(/&eacute;/gi, 'é')
      .replace(/&egrave;/gi, 'è')
      .replace(/&ecirc;/gi, 'ê')
      .replace(/&iacute;/gi, 'í')
      .replace(/&igrave;/gi, 'ì')
      .replace(/&icirc;/gi, 'î')
      .replace(/&oacute;/gi, 'ó')
      .replace(/&ograve;/gi, 'ò')
      .replace(/&otilde;/gi, 'õ')
      .replace(/&ocirc;/gi, 'ô')
      .replace(/&uacute;/gi, 'ú')
      .replace(/&ugrave;/gi, 'ù')
      .replace(/&ucirc;/gi, 'û')
      .replace(/&ccedil;/gi, 'ç')
      .replace(/&Aacute;/g, 'Á')
      .replace(/&Agrave;/g, 'À')
      .replace(/&Atilde;/g, 'Ã')
      .replace(/&Acirc;/g, 'Â')
      .replace(/&Eacute;/g, 'É')
      .replace(/&Egrave;/g, 'È')
      .replace(/&Ecirc;/g, 'Ê')
      .replace(/&Iacute;/g, 'Í')
      .replace(/&Igrave;/g, 'Ì')
      .replace(/&Icirc;/g, 'Î')
      .replace(/&Oacute;/g, 'Ó')
      .replace(/&Ograve;/g, 'Ò')
      .replace(/&Otilde;/g, 'Õ')
      .replace(/&Ocirc;/g, 'Ô')
      .replace(/&Uacute;/g, 'Ú')
      .replace(/&Ugrave;/g, 'Ù')
      .replace(/&Ucirc;/g, 'Û')
      .replace(/&Ccedil;/g, 'Ç')
      .replace(/&ordf;/gi, 'ª')
      .replace(/&ordm;/gi, 'º')
      .replace(/&ntilde;/gi, 'ñ')
      .replace(/&Ntilde;/g, 'Ñ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
  };

  const getFonteBadgeColor = (fonte: string) => {
    if (fonte.includes('STF')) return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
    if (fonte.includes('STJ')) return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
    if (fonte.includes('e-SAJ') || fonte.includes('TJ')) return 'bg-green-500/20 text-green-600 dark:text-green-400';
    return 'bg-muted text-muted-foreground';
  };

  const getTribunalSelecionado = () => {
    return TRIBUNAIS_ESTADUAIS.find(t => t.value === tribunalEstadual);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ferramentas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Busca de Jurisprudência</h1>
            <p className="text-sm text-muted-foreground">Pesquise ementas e acórdãos de tribunais brasileiros</p>
          </div>
        </div>

        {/* Tabs de fonte */}
        <Tabs value={fonte} onValueChange={(v) => setFonte(v as FonteBusca)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="estaduais" className="flex items-center gap-1 text-xs md:text-sm">
              <Globe className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Tribunais Estaduais</span>
              <span className="md:hidden">TJs</span>
            </TabsTrigger>
            <TabsTrigger value="stf" className="flex items-center gap-1 text-xs md:text-sm">
              <Building2 className="h-3 w-3 md:h-4 md:w-4" />
              <span>STF</span>
            </TabsTrigger>
            <TabsTrigger value="stj" className="flex items-center gap-1 text-xs md:text-sm">
              <Building2 className="h-3 w-3 md:h-4 md:w-4" />
              <span>STJ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estaduais" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-600 dark:text-green-400">
                  <strong>Tribunais Estaduais:</strong> Busca direta nos sistemas dos tribunais. 
                  Retorna <strong>ementa completa</strong>, relator, órgão julgador e link para inteiro teor.
                  <br />
                  <span className="text-xs opacity-80">Atualmente: {TRIBUNAIS_ESTADUAIS.length} tribunais disponíveis</span>
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">Termo de busca</label>
                  <Input
                    placeholder="Ex: dano moral consumidor, revisão contratual..."
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                  />
                </div>
                <div className="w-full md:w-64">
                  <label className="text-sm font-medium text-foreground mb-1 block">Tribunal</label>
                  <Select value={tribunalEstadual} onValueChange={setTribunalEstadual}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIBUNAIS_ESTADUAIS.map(t => (
                        <SelectItem key={t.value} value={t.value} disabled={!t.funcional}>
                          <div className="flex items-center gap-2">
                            <span className={!t.funcional ? 'opacity-50' : ''}>{t.label}</span>
                            <span className={`text-xs ${t.funcional ? 'text-muted-foreground' : 'text-amber-500'}`}>
                              {t.funcional ? `(${t.sistema})` : '(Em desenvolvimento)'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={buscar} disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando no {tribunalEstadual}...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Buscar no {tribunalEstadual}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stf" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>STF:</strong> Portal de jurisprudência do Supremo Tribunal Federal.
                  Retorna <strong>ementa, relator, tema de repercussão geral</strong> e link para inteiro teor.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">Termo de busca</label>
                  <Input
                    placeholder="Ex: repercussão geral, ADI, liberdade de expressão..."
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                  />
                </div>
              </div>

              <Button onClick={buscar} disabled={loading} className="w-full md:w-auto bg-amber-600 hover:bg-amber-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando no STF...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Buscar no STF
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stj" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>STJ:</strong> SCON do Superior Tribunal de Justiça.
                  Retorna <strong>ementa, relator, tema repetitivo</strong> e link para inteiro teor.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">Termo de busca</label>
                  <Input
                    placeholder="Ex: repetitivo, REsp, responsabilidade civil..."
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                  />
                </div>
              </div>

              <Button onClick={buscar} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando no STJ...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Buscar no STJ
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Métricas */}
        {resultado && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{resultado.total}</p>
              <p className="text-xs text-muted-foreground">Total encontrado</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{resultado.resultados?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Exibindo</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{tempoResposta}ms</p>
              <p className="text-xs text-muted-foreground">Tempo de resposta</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">{resultado.fonte}</p>
              <p className="text-xs text-muted-foreground">Fonte</p>
            </div>
          </div>
        )}

        {/* URL original (debug) */}
        {resultado?.urlOriginal && (
          <div className="bg-muted/30 rounded-lg p-2">
            <a 
              href={resultado.urlOriginal} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Ver no site original
            </a>
          </div>
        )}

        {/* Aviso de tribunal com problemas */}
        {resultado?.avisoTribunal && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>⚠️ Aviso:</strong> {resultado.avisoTribunal}
            </p>
            {resultado.linkDireto && (
              <a 
                href={resultado.linkDireto} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Acessar sistema diretamente
              </a>
            )}
          </div>
        )}

        {/* Animação de Loading */}
        {loading && (
          <div className="bg-card border border-border rounded-xl p-4">
            <JurisprudenciaLoadingAnimation etapas={etapasLoading} />
          </div>
        )}

        {/* Resultados */}
        {!loading && resultado && resultado.resultados && resultado.resultados.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Resultados ({resultado.resultados.length} de {resultado.total})
            </h2>

            {resultado.resultados.map((juris, index) => (
              <button
                key={juris.id || index}
                onClick={() => {
                  setSelectedItem(juris);
                  setDrawerOpen(true);
                }}
                className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/30 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded">
                        {juris.tribunal}
                      </span>
                      {/* Data de julgamento em destaque */}
                      {juris.dataJulgamento && (
                        <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                          📅 {formatarData(juris.dataJulgamento)}
                        </span>
                      )}
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">
                        {getClasseNome(juris.classe)}
                      </span>
                      {juris.grau && (
                        <span className="text-xs text-muted-foreground">{juris.grau}</span>
                      )}
                      {juris.fonte && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getFonteBadgeColor(juris.fonte)}`}>
                          {juris.fonte}
                        </span>
                      )}
                      {juris.tema && (
                        <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded">
                          {juris.tema}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {juris.numeroProcesso}
                    </p>
                    {/* Relator */}
                    {juris.relator && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="text-foreground/70">Rel.:</span> {decodeHtmlEntities(juris.relator)}
                      </p>
                    )}
                    {/* Mostrar preview da ementa se disponível */}
                    {juris.ementa && juris.ementa.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {decodeHtmlEntities(juris.ementa)}
                      </p>
                    )}
                    {!juris.ementa && juris.assuntos && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {decodeHtmlEntities(juris.assuntos)}
                      </p>
                    )}
                    {/* Mostrar tese se disponível */}
                    {juris.tese && (
                      <p className="text-xs text-primary/80 mt-1 line-clamp-2 italic">
                        Tese: {decodeHtmlEntities(juris.tese)}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sem resultados */}
        {!loading && resultado && (!resultado.resultados || resultado.resultados.length === 0) && (
          <div className="text-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma jurisprudência encontrada</p>
          </div>
        )}
      </div>

      {/* Drawer para exibir detalhes */}
      <JurisprudenciaDrawerEsaj
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};

export default JurisprudenciasTeste;
