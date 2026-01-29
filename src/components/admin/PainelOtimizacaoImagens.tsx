import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Image, Zap, Database, TrendingDown, Play, Settings, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PresetInfo {
  name: string;
  width: number;
  height: number;
  description: string;
}

// Presets atualizados com tamanhos menores para cada contexto
const PRESETS: PresetInfo[] = [
  { name: 'thumb', width: 100, height: 56, description: 'Miniaturas 16:9' },
  { name: 'carousel-sm', width: 144, height: 81, description: 'Carrossel boletins' },
  { name: 'carousel', width: 200, height: 113, description: 'Carrossel padrão' },
  { name: 'sidebar', width: 200, height: 100, description: 'Sidebar 2:1' },
  { name: 'card-xs', width: 200, height: 113, description: 'Card extra pequeno' },
  { name: 'card-sm', width: 240, height: 135, description: 'Card notícias carrossel' },
  { name: 'card', width: 300, height: 169, description: 'Card médio' },
  { name: 'card-lg', width: 400, height: 225, description: 'Card grande' },
  { name: 'mobile', width: 480, height: 270, description: 'Mobile geral' },
  { name: 'tablet', width: 640, height: 360, description: 'Tablet' },
  { name: 'desktop', width: 848, height: 477, description: 'Desktop' },
  { name: 'logo-sm', width: 64, height: 64, description: 'Logos pequenos' },
  { name: 'logo-md', width: 128, height: 128, description: 'Logos médios' },
  { name: 'logo-lg', width: 256, height: 256, description: 'Logos grandes' },
];

interface OtimizacaoResult {
  success: boolean;
  urlWebp?: string;
  fromCache?: boolean;
  tamanhoOriginal?: number;
  tamanhoFinal?: number;
  economia?: number;
  preset?: string;
  error?: string;
}

interface Estatisticas {
  totalImagens: number;
  economiaTotal: number;
  tamanhoOriginalTotal: number;
  tamanhoFinalTotal: number;
  porPreset: Record<string, number>;
}

export default function PainelOtimizacaoImagens() {
  const [urlImagem, setUrlImagem] = useState('');
  const [presetSelecionado, setPresetSelecionado] = useState('mobile');
  const [larguraCustom, setLarguraCustom] = useState('');
  const [alturaCustom, setAlturaCustom] = useState('');
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<OtimizacaoResult | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(false);
  
  // Processamento em lote
  const [tabela, setTabela] = useState('noticias_juridicas_cache');
  const [limite, setLimite] = useState('10');
  const [processandoLote, setProcessandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState(0);
  const [resultadosLote, setResultadosLote] = useState<string[]>([]);

  const otimizarImagem = async () => {
    if (!urlImagem) {
      toast.error('Informe a URL da imagem');
      return;
    }

    setProcessando(true);
    setResultado(null);

    try {
      const payload: Record<string, unknown> = {
        imageUrl: urlImagem,
      };

      if (presetSelecionado === 'custom') {
        payload.width = parseInt(larguraCustom);
        payload.height = parseInt(alturaCustom);
      } else {
        payload.preset = presetSelecionado;
      }

      const { data, error } = await supabase.functions.invoke('otimizar-imagem', {
        body: payload,
      });

      if (error) throw error;

      setResultado(data);
      
      if (data.success) {
        toast.success(`Imagem otimizada! Economia: ${data.economia}%`);
      } else {
        toast.error(data.error || 'Erro ao otimizar');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao processar imagem');
      setResultado({ success: false, error: String(err) });
    } finally {
      setProcessando(false);
    }
  };

  const carregarEstatisticas = async () => {
    setCarregandoStats(true);
    try {
      const { data, error } = await supabase
        .from('cache_imagens_webp')
        .select('tamanho_original, tamanho_webp, preset');

      if (error) throw error;

      const stats: Estatisticas = {
        totalImagens: data.length,
        economiaTotal: 0,
        tamanhoOriginalTotal: 0,
        tamanhoFinalTotal: 0,
        porPreset: {},
      };

      data.forEach((item) => {
        if (item.tamanho_original) stats.tamanhoOriginalTotal += item.tamanho_original;
        if (item.tamanho_webp) stats.tamanhoFinalTotal += item.tamanho_webp;
        if (item.preset) {
          stats.porPreset[item.preset] = (stats.porPreset[item.preset] || 0) + 1;
        }
      });

      stats.economiaTotal = stats.tamanhoOriginalTotal - stats.tamanhoFinalTotal;

      setEstatisticas(stats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setCarregandoStats(false);
    }
  };

  const processarLote = async () => {
    setProcessandoLote(true);
    setProgressoLote(0);
    setResultadosLote([]);

    try {
      // Buscar imagens sem WebP otimizado
      let query;
      if (tabela === 'noticias_juridicas_cache') {
        query = supabase
          .from('noticias_juridicas_cache')
          .select('id, imagem')
          .is('imagem_webp', null)
          .not('imagem', 'is', null)
          .limit(parseInt(limite));
      } else {
        query = supabase
          .from('noticias_politicas_cache')
          .select('id, imagem_url')
          .is('imagem_url_webp', null)
          .not('imagem_url', 'is', null)
          .limit(parseInt(limite));
      }

      const { data: imagens, error } = await query;
      if (error) throw error;

      if (!imagens || imagens.length === 0) {
        toast.info('Nenhuma imagem pendente encontrada');
        setProcessandoLote(false);
        return;
      }

      const total = imagens.length;
      let processadas = 0;
      const logs: string[] = [];

      for (const item of imagens) {
        const imageUrl = tabela === 'noticias_juridicas_cache' 
          ? item.imagem 
          : item.imagem_url;

        try {
          logs.push(`[${processadas + 1}/${total}] Processando: ${imageUrl?.substring(0, 50)}...`);
          setResultadosLote([...logs]);

          const { data: result, error: fnError } = await supabase.functions.invoke('otimizar-imagem', {
            body: {
              imageUrl,
              preset: 'mobile',
            },
          });

          if (fnError) throw fnError;

          if (result.success) {
            // Atualizar tabela com URL otimizada
            if (tabela === 'noticias_juridicas_cache') {
              await supabase
                .from('noticias_juridicas_cache')
                .update({ imagem_webp: result.urlWebp })
                .eq('id', item.id);
            } else {
              await supabase
                .from('noticias_politicas_cache')
                .update({ imagem_url_webp: result.urlWebp })
                .eq('id', item.id);
            }

            logs.push(`  ✅ Economia: ${result.economia}% (${formatBytes(result.tamanhoOriginal)} → ${formatBytes(result.tamanhoFinal)})`);
          } else {
            logs.push(`  ❌ Erro: ${result.error}`);
          }
        } catch (err) {
          logs.push(`  ❌ Erro: ${String(err)}`);
        }

        processadas++;
        setProgressoLote((processadas / total) * 100);
        setResultadosLote([...logs]);
      }

      toast.success(`Processamento concluído! ${processadas}/${total} imagens`);
    } catch (err) {
      console.error('Erro no lote:', err);
      toast.error('Erro ao processar lote');
    } finally {
      setProcessandoLote(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Image className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Otimização de Imagens</h1>
          <p className="text-muted-foreground">Comprimir, redimensionar e converter para WebP</p>
        </div>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual" className="gap-2">
            <Zap className="h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="lote" className="gap-2">
            <Database className="h-4 w-4" />
            Em Lote
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2" onClick={carregarEstatisticas}>
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab Individual */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={urlImagem}
                  onChange={(e) => setUrlImagem(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Preset de Tamanho</Label>
                <Select value={presetSelecionado} onValueChange={setPresetSelecionado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({p.width}x{p.height}) - {p.description}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="font-medium">custom</span>
                      <span className="text-muted-foreground ml-2">Dimensões personalizadas</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {presetSelecionado === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Largura (px)</Label>
                    <Input
                      type="number"
                      placeholder="640"
                      value={larguraCustom}
                      onChange={(e) => setLarguraCustom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (px)</Label>
                    <Input
                      type="number"
                      placeholder="360"
                      value={alturaCustom}
                      onChange={(e) => setAlturaCustom(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button onClick={otimizarImagem} disabled={processando} className="w-full">
                {processando ? 'Processando...' : 'Otimizar Imagem'}
              </Button>
            </CardContent>
          </Card>

          {resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {resultado.success ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <span className="text-red-500">❌</span>
                  )}
                  Resultado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultado.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Original</p>
                        <p className="text-2xl font-bold">{formatBytes(resultado.tamanhoOriginal)}</p>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Otimizado</p>
                        <p className="text-2xl font-bold text-green-500">{formatBytes(resultado.tamanhoFinal)}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        📉 Economia: {resultado.economia}%
                      </Badge>
                      {resultado.fromCache && (
                        <Badge variant="outline" className="ml-2">
                          Cache
                        </Badge>
                      )}
                    </div>

                    {resultado.urlWebp && (
                      <div className="space-y-2">
                        <Label>URL Otimizada</Label>
                        <div className="flex gap-2">
                          <Input value={resultado.urlWebp} readOnly />
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(resultado.urlWebp!);
                              toast.success('URL copiada!');
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <img
                            src={resultado.urlWebp}
                            alt="Preview"
                            className="max-w-full max-h-64 rounded-lg border"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-500">{resultado.error}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Lote */}
        <TabsContent value="lote" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Processamento em Lote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tabela</Label>
                  <Select value={tabela} onValueChange={setTabela}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noticias_juridicas_cache">Notícias Jurídicas</SelectItem>
                      <SelectItem value="noticias_politicas_cache">Notícias Políticas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Limite</Label>
                  <Input
                    type="number"
                    value={limite}
                    onChange={(e) => setLimite(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={processarLote}
                disabled={processandoLote}
                className="w-full gap-2"
              >
                <Play className="h-4 w-4" />
                {processandoLote ? 'Processando...' : 'Iniciar Processamento'}
              </Button>

              {processandoLote && (
                <div className="space-y-2">
                  <Progress value={progressoLote} />
                  <p className="text-sm text-center text-muted-foreground">
                    {progressoLote.toFixed(0)}%
                  </p>
                </div>
              )}

              {resultadosLote.length > 0 && (
                <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {resultadosLote.join('\n')}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas do Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carregandoStats ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : estatisticas ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Imagens</p>
                      <p className="text-3xl font-bold">{estatisticas.totalImagens}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Tamanho Original</p>
                      <p className="text-3xl font-bold">{formatBytes(estatisticas.tamanhoOriginalTotal)}</p>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tamanho Final</p>
                      <p className="text-3xl font-bold text-green-500">{formatBytes(estatisticas.tamanhoFinalTotal)}</p>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Economia Total</p>
                      <p className="text-3xl font-bold text-primary">{formatBytes(estatisticas.economiaTotal)}</p>
                    </div>
                  </div>

                  {Object.keys(estatisticas.porPreset).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Por Preset</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(estatisticas.porPreset).map(([preset, count]) => (
                          <Badge key={preset} variant="secondary">
                            {preset}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={carregarEstatisticas} variant="outline" className="w-full">
                  Carregar Estatísticas
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
