import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Download, Copy, RefreshCw, Code, Eye, Sparkles, FileText } from 'lucide-react';
import { DiagramTypeSelector, DiagramType } from './DiagramTypeSelector';
import { InfographicPreview } from './InfographicPreview';
import { exportMermaidToPng, copyMermaidCode } from '@/utils/mermaidExport';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Templates profissionais prontos
const TEMPLATES: Record<string, { nome: string; tipo: DiagramType; texto: string }> = {
  processo_civil: {
    nome: 'Fases do Processo Civil',
    tipo: 'flowchart',
    texto: 'O processo civil possui as seguintes fases: petição inicial, citação do réu, contestação, réplica, instrução probatória com audiência, alegações finais e sentença.'
  },
  requisitos_crime: {
    nome: 'Requisitos do Crime',
    tipo: 'mindmap',
    texto: 'Os requisitos do crime são: fato típico (conduta, resultado, nexo causal, tipicidade), ilicitude (ausência de excludentes) e culpabilidade (imputabilidade, potencial consciência da ilicitude, exigibilidade de conduta diversa).'
  },
  partes_processo: {
    nome: 'Partes no Processo',
    tipo: 'er',
    texto: 'No processo temos: autor que move ação, réu que contesta, juiz que julga, advogados que representam as partes, e o Ministério Público que pode atuar como fiscal da lei.'
  },
  prazos: {
    nome: 'Prazos Processuais',
    tipo: 'timeline',
    texto: 'Prazos: citação 20 dias, contestação 15 dias, réplica 15 dias, especificação de provas 10 dias, audiência 30 dias, sentença 30 dias.'
  }
};

export const InfographicGenerator = () => {
  const [texto, setTexto] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<DiagramType>('flowchart');
  const [codigoMermaid, setCodigoMermaid] = useState('');
  const [codigoEditado, setCodigoEditado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const diagramRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const codigoAtual = modoEdicao ? codigoEditado : codigoMermaid;

  // Indicador de qualidade do texto
  const getQualidadeTexto = () => {
    const len = texto.trim().length;
    if (len < 10) return { label: 'Muito curto', color: 'destructive', percent: 10 };
    if (len < 50) return { label: 'Básico', color: 'warning', percent: 30 };
    if (len < 150) return { label: 'Bom', color: 'default', percent: 60 };
    if (len < 500) return { label: 'Ótimo', color: 'success', percent: 85 };
    return { label: 'Excelente', color: 'success', percent: 100 };
  };

  const qualidade = getQualidadeTexto();

  const gerarInfografico = async () => {
    if (!texto.trim() || texto.trim().length < 10) {
      toast({
        title: 'Texto muito curto',
        description: 'Por favor, insira pelo menos 10 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setCodigoMermaid('');
    setCodigoEditado('');
    setModoEdicao(false);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-infografico-mermaid', {
        body: { texto: texto.trim(), tipo: tipoSelecionado }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setCodigoMermaid(data.codigo);
      setCodigoEditado(data.codigo);
      setActiveTab('preview');
      
      toast({
        title: data.fallback ? 'Exemplo gerado' : 'Infográfico gerado!',
        description: data.fallback 
          ? 'Usamos um exemplo padrão. Tente refinar seu texto.'
          : 'O diagrama foi criado com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao gerar infográfico:', error);
      toast({
        title: 'Erro ao gerar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await exportMermaidToPng(diagramRef.current, `infografico-${tipoSelecionado}`, {
        scale: 2,
        watermark: 'Vade Mecum X',
        padding: 24
      });
      toast({
        title: 'Download iniciado',
        description: 'A imagem PNG está sendo baixada.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro no download',
        description: error.message || 'Não foi possível exportar a imagem.',
        variant: 'destructive'
      });
    }
  };

  const handleCopy = async () => {
    try {
      await copyMermaidCode(codigoAtual);
      toast({
        title: 'Código copiado!',
        description: 'O código Mermaid foi copiado para a área de transferência.'
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive'
      });
    }
  };

  const handleLimpar = () => {
    setTexto('');
    setCodigoMermaid('');
    setCodigoEditado('');
    setModoEdicao(false);
  };

  const aplicarEdicao = () => {
    setModoEdicao(false);
    setActiveTab('preview');
    toast({
      title: 'Alterações aplicadas',
      description: 'O diagrama foi atualizado.'
    });
  };

  const usarTemplate = (templateKey: string) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      setTexto(template.texto);
      setTipoSelecionado(template.tipo);
      toast({
        title: 'Template carregado',
        description: `"${template.nome}" pronto para gerar.`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            Gerador de Infográficos
          </CardTitle>
          <CardDescription className="text-sm">
            Transforme textos jurídicos em diagramas visuais profissionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Templates rápidos */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Templates prontos
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => usarTemplate(key)}
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {template.nome}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="texto-input" className="text-sm font-medium">
                Texto para transformar em diagrama
              </Label>
              <Badge 
                variant={qualidade.color === 'success' ? 'default' : qualidade.color === 'warning' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {qualidade.label}
              </Badge>
            </div>
            <Textarea
              id="texto-input"
              placeholder="Cole aqui um artigo de lei, conceito jurídico, procedimento, ou qualquer texto que deseja visualizar como diagrama...

Dica: Quanto mais detalhado o texto, melhor será o diagrama gerado."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-[140px] resize-y text-sm bg-background/50"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{texto.length} caracteres</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${qualidade.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Diagrama</Label>
            <DiagramTypeSelector
              selected={tipoSelecionado}
              onSelect={setTipoSelecionado}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={gerarInfografico}
              disabled={isLoading || texto.trim().length < 10}
              className="flex-1 h-11"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando diagrama...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Gerar Infográfico
                </>
              )}
            </Button>
            {codigoMermaid && (
              <Button variant="outline" onClick={handleLimpar} className="h-11">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {codigoAtual && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Resultado</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copiar
                </Button>
                <Button variant="default" size="sm" onClick={handleDownload} className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Baixar PNG
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-3">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="preview" className="text-sm flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Visualizar
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-sm flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    Código
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="preview" className="mt-0 p-4">
                <InfographicPreview 
                  codigo={codigoAtual}
                  tipo={tipoSelecionado}
                  onRef={(ref) => { (diagramRef as any).current = ref; }}
                />
              </TabsContent>
              
              <TabsContent value="code" className="mt-0 p-4">
                <div className="space-y-3">
                  <Textarea
                    value={codigoEditado}
                    onChange={(e) => {
                      setCodigoEditado(e.target.value);
                      setModoEdicao(true);
                    }}
                    className="font-mono text-sm min-h-[250px] bg-muted/30"
                    placeholder="Código Mermaid..."
                  />
                  {modoEdicao && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Edições pendentes
                      </span>
                      <Button onClick={aplicarEdicao} size="sm">
                        Aplicar e Visualizar
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
