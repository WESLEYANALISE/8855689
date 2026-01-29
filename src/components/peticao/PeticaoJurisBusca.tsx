import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Loader2, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  FileText,
  X,
  Plus,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface JurisprudenciaItem {
  id: string;
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  ementaCompleta?: string;
  relator?: string;
  link: string;
  fonte: string;
}

interface PeticaoJurisBuscaProps {
  areaDireito: string;
  tipoPeticao: string;
  descricaoCaso: string;
  jurisprudenciasSelecionadas: JurisprudenciaItem[];
  onJurisprudenciasChange: (juris: JurisprudenciaItem[]) => void;
  onInserirCitacao: (citacao: string) => void;
}

const fontesTribunais = [
  { id: 'stf', nome: 'STF', descricao: 'Supremo Tribunal Federal' },
  { id: 'stj', nome: 'STJ', descricao: 'Superior Tribunal de Justiça' },
  { id: 'datajud', nome: 'DataJud', descricao: 'Todos os tribunais' },
  { id: 'tjsp', nome: 'TJSP', descricao: 'Tribunal de Justiça de SP' },
  { id: 'tjmg', nome: 'TJMG', descricao: 'Tribunal de Justiça de MG' },
  { id: 'tjrj', nome: 'TJRJ', descricao: 'Tribunal de Justiça do RJ' },
];

export const formatarCitacaoABNT = (juris: JurisprudenciaItem): string => {
  const partes = [];
  
  partes.push(`"${juris.ementa.substring(0, 300)}${juris.ementa.length > 300 ? '...' : ''}"`);
  partes.push(`(${juris.tribunal}`);
  if (juris.numeroProcesso) partes.push(`- ${juris.numeroProcesso}`);
  if (juris.relator) partes.push(`- Rel. ${juris.relator}`);
  if (juris.orgaoJulgador) partes.push(`- ${juris.orgaoJulgador}`);
  if (juris.dataJulgamento) partes.push(`- j. ${juris.dataJulgamento}`);
  
  return partes.join(' ') + ')';
};

export const PeticaoJurisBusca = ({
  areaDireito,
  tipoPeticao,
  descricaoCaso,
  jurisprudenciasSelecionadas,
  onJurisprudenciasChange,
  onInserirCitacao,
}: PeticaoJurisBuscaProps) => {
  const [termoBusca, setTermoBusca] = useState("");
  const [fonteSelecionada, setFonteSelecionada] = useState("datajud");
  const [resultados, setResultados] = useState<JurisprudenciaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscandoAuto, setIsBuscandoAuto] = useState(false);
  const [jurisDetalhe, setJurisDetalhe] = useState<JurisprudenciaItem | null>(null);
  const [modoAtivo, setModoAtivo] = useState<'automatico' | 'manual'>('automatico');

  const buscarAutomatico = async () => {
    setIsBuscandoAuto(true);
    try {
      // Construir termo de busca baseado no caso
      const termoAuto = `${areaDireito} ${tipoPeticao} ${descricaoCaso.substring(0, 100)}`;
      
      const { data, error } = await supabase.functions.invoke("buscar-jurisprudencia-datajud", {
        body: { 
          termo: termoAuto,
          tribunal: 'todos',
          limite: 5
        },
      });

      if (error) throw error;

      const jurisFormatadas: JurisprudenciaItem[] = (data?.resultados || []).map((j: any, idx: number) => ({
        id: `auto-${idx}-${Date.now()}`,
        numeroProcesso: j.numero || j.numeroProcesso || '',
        tribunal: j.tribunal || 'Tribunal não identificado',
        orgaoJulgador: j.orgaoJulgador || j.orgao || '',
        dataJulgamento: j.dataJulgamento || j.data || '',
        ementa: j.ementa || j.texto || '',
        relator: j.relator || '',
        link: j.link || j.url || '#',
        fonte: 'DataJud (Automático)',
      }));

      setResultados(jurisFormatadas);
      
      if (jurisFormatadas.length === 0) {
        toast({
          title: "Nenhum resultado encontrado",
          description: "Tente buscar manualmente com outros termos",
        });
      } else {
        toast({
          title: `${jurisFormatadas.length} jurisprudências encontradas`,
          description: "Selecione as que deseja incluir na petição",
        });
      }
    } catch (error) {
      console.error("Erro na busca automática:", error);
      toast({
        title: "Erro na busca",
        description: "Tente novamente ou busque manualmente",
        variant: "destructive",
      });
    } finally {
      setIsBuscandoAuto(false);
    }
  };

  const buscarManual = async () => {
    if (!termoBusca.trim()) {
      toast({
        title: "Digite um termo de busca",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let functionName = "buscar-jurisprudencia-datajud";
      
      // Escolher função baseado na fonte
      switch (fonteSelecionada) {
        case 'stf':
          functionName = "buscar-stf-browserless";
          break;
        case 'stj':
          functionName = "buscar-stj-browserless";
          break;
        case 'tjsp':
          functionName = "buscar-jurisprudencia-esaj";
          break;
        case 'tjmg':
          functionName = "buscar-jurisprudencia-tjmg";
          break;
        case 'tjrj':
          functionName = "buscar-jurisprudencia-tjrj";
          break;
        default:
          functionName = "buscar-jurisprudencia-datajud";
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          termo: termoBusca,
          limite: 10
        },
      });

      if (error) throw error;

      const jurisFormatadas: JurisprudenciaItem[] = (data?.resultados || data?.jurisprudencias || []).map((j: any, idx: number) => ({
        id: `manual-${idx}-${Date.now()}`,
        numeroProcesso: j.numero || j.numeroProcesso || '',
        tribunal: j.tribunal || fonteSelecionada.toUpperCase(),
        orgaoJulgador: j.orgaoJulgador || j.orgao || '',
        dataJulgamento: j.dataJulgamento || j.data || '',
        ementa: j.ementa || j.texto || '',
        ementaCompleta: j.ementaCompleta,
        relator: j.relator || '',
        link: j.link || j.url || '#',
        fonte: fonteSelecionada.toUpperCase(),
      }));

      setResultados(jurisFormatadas);
      
      if (jurisFormatadas.length === 0) {
        toast({
          title: "Nenhum resultado encontrado",
          description: "Tente outros termos de busca",
        });
      }
    } catch (error) {
      console.error("Erro na busca manual:", error);
      toast({
        title: "Erro na busca",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelecao = (juris: JurisprudenciaItem) => {
    const jaSelecionada = jurisprudenciasSelecionadas.some(j => j.id === juris.id);
    
    if (jaSelecionada) {
      onJurisprudenciasChange(jurisprudenciasSelecionadas.filter(j => j.id !== juris.id));
    } else {
      onJurisprudenciasChange([...jurisprudenciasSelecionadas, juris]);
    }
  };

  const inserirCitacao = (juris: JurisprudenciaItem) => {
    const citacao = formatarCitacaoABNT(juris);
    onInserirCitacao(citacao);
    toast({
      title: "Citação inserida!",
      description: "Formatada no padrão ABNT",
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold">Jurisprudências</h2>
        <p className="text-sm text-muted-foreground">
          Busque e selecione jurisprudências para fundamentar sua petição
        </p>
      </div>

      <Tabs value={modoAtivo} onValueChange={(v) => setModoAtivo(v as 'automatico' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automatico">
            <Sparkles className="w-4 h-4 mr-2" />
            Busca Automática
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Search className="w-4 h-4 mr-2" />
            Busca Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automatico" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Sparkles className="w-12 h-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold">Busca Inteligente</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Com base no seu caso ({areaDireito}, {tipoPeticao}), 
                    vamos buscar jurisprudências relevantes automaticamente.
                  </p>
                </div>
                <Button 
                  onClick={buscarAutomatico} 
                  disabled={isBuscandoAuto}
                  className="w-full md:w-auto"
                >
                  {isBuscandoAuto ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Buscar Automaticamente
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Seletor de fonte */}
              <div className="flex flex-wrap gap-2">
                {fontesTribunais.map((fonte) => (
                  <Button
                    key={fonte.id}
                    variant={fonteSelecionada === fonte.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFonteSelecionada(fonte.id)}
                  >
                    {fonte.nome}
                  </Button>
                ))}
              </div>

              {/* Campo de busca */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite termos de busca..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarManual()}
                />
                <Button onClick={buscarManual} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Resultados ({resultados.length})</span>
              {jurisprudenciasSelecionadas.length > 0 && (
                <Badge variant="secondary">
                  {jurisprudenciasSelecionadas.length} selecionadas
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {resultados.map((juris) => {
                  const selecionada = jurisprudenciasSelecionadas.some(j => j.id === juris.id);
                  
                  return (
                    <Card 
                      key={juris.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selecionada 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30'
                      }`}
                      onClick={() => toggleSelecao(juris)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={selecionada}
                            onCheckedChange={() => toggleSelecao(juris)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary">{juris.tribunal}</Badge>
                                  <Badge variant="outline" className="text-xs">{juris.fonte}</Badge>
                                </div>
                                <p className="font-semibold text-sm mt-1">{juris.numeroProcesso}</p>
                                {juris.relator && (
                                  <p className="text-xs text-muted-foreground">Rel. {juris.relator}</p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setJurisDetalhe(juris);
                                  }}
                                >
                                  Ver mais
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm line-clamp-3 text-muted-foreground">
                              {juris.ementa}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  inserirCitacao(juris);
                                }}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Inserir Citação
                              </Button>
                              {juris.link && juris.link !== '#' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(juris.link, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Fonte
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Jurisprudências já selecionadas */}
      {jurisprudenciasSelecionadas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Jurisprudências Selecionadas ({jurisprudenciasSelecionadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {jurisprudenciasSelecionadas.map((juris) => (
                <Badge 
                  key={juris.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1"
                >
                  <span className="text-xs">
                    {juris.tribunal} - {juris.numeroProcesso.substring(0, 20)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    onClick={() => toggleSelecao(juris)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet de detalhes */}
      <Sheet open={!!jurisDetalhe} onOpenChange={() => setJurisDetalhe(null)}>
        <SheetContent className="sm:max-w-xl">
          {jurisDetalhe && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge>{jurisDetalhe.tribunal}</Badge>
                  {jurisDetalhe.numeroProcesso}
                </SheetTitle>
                <SheetDescription>
                  {jurisDetalhe.orgaoJulgador} • {jurisDetalhe.dataJulgamento}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-200px)] mt-4 pr-4">
                <div className="space-y-4">
                  {jurisDetalhe.relator && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Relator</h4>
                      <p className="text-sm text-muted-foreground">{jurisDetalhe.relator}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Ementa</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {jurisDetalhe.ementaCompleta || jurisDetalhe.ementa}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        inserirCitacao(jurisDetalhe);
                        setJurisDetalhe(null);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Inserir Citação
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!jurisprudenciasSelecionadas.some(j => j.id === jurisDetalhe.id)) {
                          toggleSelecao(jurisDetalhe);
                        }
                        setJurisDetalhe(null);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Selecionar
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
