import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, FileText, AlertTriangle, CheckCircle, XCircle, Copy, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ArtigoExtraido {
  numero: string | null;
  texto: string;
  status: 'ok' | 'incompleto' | 'duplicado' | 'faltante';
}

interface EstatisticasExtracao {
  artigosBruto: number[];
  artigosExtraidos: number[];
  faltantes: number[];
  extras: number[];
  duplicados: string[];
  cobertura: number;
}

export default function ValidarArtigos() {
  const navigate = useNavigate();
  const [textoBruto, setTextoBruto] = useState("");
  const [textoFormatado, setTextoFormatado] = useState("");
  const [artigos, setArtigos] = useState<ArtigoExtraido[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasExtracao | null>(null);
  const [processando, setProcessando] = useState(false);
  const [artigoSelecionado, setArtigoSelecionado] = useState<number | null>(null);
  const textoBrutoRef = useRef<HTMLTextAreaElement>(null);

  // Extrair artigos do texto formatado
  const extrairArtigos = useCallback((texto: string): ArtigoExtraido[] => {
    const resultado: ArtigoExtraido[] = [];
    const regex = /(?:^|\n)\s*Art\.?\s*(\d+[A-Z]?)[º°]?\s*[-–.]?\s*([^\n]*(?:\n(?!\s*Art\.).*)*)/gi;
    
    let match;
    const numerosVistos = new Map<string, number>();
    
    while ((match = regex.exec(texto)) !== null) {
      const numero = match[1];
      const textoArtigo = match[2]?.trim() || '';
      
      // Rastrear duplicados
      const count = (numerosVistos.get(numero) || 0) + 1;
      numerosVistos.set(numero, count);
      
      resultado.push({
        numero: `Art. ${numero}`,
        texto: `Art. ${numero}º ${textoArtigo}`,
        status: count > 1 ? 'duplicado' : 'ok'
      });
    }
    
    return resultado;
  }, []);

  // Contar artigos no texto bruto
  const contarArtigosBruto = useCallback((texto: string): number[] => {
    const regex = /\bArt\.?\s*(\d+)[º°ª]?\s*[-–.]/gi;
    const numeros = new Set<number>();
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const num = parseInt(match[1]);
      if (num > 0 && num < 1000) {
        numeros.add(num);
      }
    }
    
    return Array.from(numeros).sort((a, b) => a - b);
  }, []);

  // Processar textos
  const processarTextos = useCallback(() => {
    if (!textoBruto.trim()) {
      toast.error("Cole o texto bruto primeiro");
      return;
    }

    setProcessando(true);

    try {
      // Contar artigos no bruto
      const artigosBruto = contarArtigosBruto(textoBruto);
      
      // Extrair artigos do formatado (ou do bruto se não houver formatado)
      const textoParaExtrair = textoFormatado.trim() || textoBruto;
      const artigosExtraidos = extrairArtigos(textoParaExtrair);
      
      // Números extraídos
      const numerosExtraidos = new Set<number>();
      const duplicados: string[] = [];
      const mapOcorrencias = new Map<number, number>();
      
      for (const artigo of artigosExtraidos) {
        if (artigo.numero) {
          const match = artigo.numero.match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            numerosExtraidos.add(num);
            
            const count = (mapOcorrencias.get(num) || 0) + 1;
            mapOcorrencias.set(num, count);
            
            if (count > 1) {
              duplicados.push(`Art. ${num} (${count}x)`);
            }
          }
        }
      }
      
      // Faltantes
      const faltantes: number[] = [];
      for (const num of artigosBruto) {
        if (!numerosExtraidos.has(num)) {
          faltantes.push(num);
        }
      }
      
      // Extras
      const artigosBrutoSet = new Set(artigosBruto);
      const extras: number[] = [];
      for (const num of numerosExtraidos) {
        if (!artigosBrutoSet.has(num)) {
          extras.push(num);
        }
      }
      
      // Atualizar status dos artigos
      const artigosComStatus = artigosExtraidos.map(artigo => {
        if (artigo.status === 'duplicado') return artigo;
        
        // Verificar se texto está incompleto
        const texto = artigo.texto;
        if (texto.length < 50 || !/[.;:)\]]$/.test(texto.trim())) {
          return { ...artigo, status: 'incompleto' as const };
        }
        
        return artigo;
      });
      
      // Adicionar artigos faltantes
      for (const num of faltantes) {
        artigosComStatus.push({
          numero: `Art. ${num}`,
          texto: '[ARTIGO NÃO ENCONTRADO NO TEXTO FORMATADO]',
          status: 'faltante'
        });
      }
      
      // Ordenar por número
      artigosComStatus.sort((a, b) => {
        const numA = a.numero ? parseInt(a.numero.match(/(\d+)/)?.[1] || '0') : 9999;
        const numB = b.numero ? parseInt(b.numero.match(/(\d+)/)?.[1] || '0') : 9999;
        return numA - numB;
      });
      
      setArtigos(artigosComStatus);
      setEstatisticas({
        artigosBruto,
        artigosExtraidos: Array.from(numerosExtraidos).sort((a, b) => a - b),
        faltantes,
        extras,
        duplicados: Array.from(new Set(duplicados)),
        cobertura: artigosBruto.length > 0 
          ? (numerosExtraidos.size / artigosBruto.length) * 100 
          : 100
      });
      
      toast.success(`Processado: ${artigosExtraidos.length} artigos extraídos`);
    } catch (error) {
      toast.error("Erro ao processar textos");
      console.error(error);
    } finally {
      setProcessando(false);
    }
  }, [textoBruto, textoFormatado, contarArtigosBruto, extrairArtigos]);

  // Localizar artigo no texto bruto
  const localizarNoBruto = useCallback((numeroArtigo: string) => {
    if (!textoBrutoRef.current) return;
    
    const match = numeroArtigo.match(/(\d+)/);
    if (!match) return;
    
    const regex = new RegExp(`Art\\.?\\s*${match[1]}[º°]?`, 'i');
    const resultado = textoBruto.match(regex);
    
    if (resultado && resultado.index !== undefined) {
      setArtigoSelecionado(parseInt(match[1]));
      textoBrutoRef.current.focus();
      textoBrutoRef.current.setSelectionRange(resultado.index, resultado.index + resultado[0].length);
      
      // Scroll para a posição
      const linhaAtePosicao = textoBruto.substring(0, resultado.index).split('\n').length;
      const alturaLinha = 20;
      textoBrutoRef.current.scrollTop = (linhaAtePosicao - 5) * alturaLinha;
      
      toast.info(`Localizado: ${numeroArtigo}`);
    } else {
      toast.warning(`${numeroArtigo} não encontrado no texto bruto`);
    }
  }, [textoBruto]);

  // Copiar artigos faltantes
  const copiarFaltantes = useCallback(() => {
    if (!estatisticas?.faltantes.length) {
      toast.info("Nenhum artigo faltante");
      return;
    }
    
    const texto = estatisticas.faltantes.join(', ');
    navigator.clipboard.writeText(texto);
    toast.success("Artigos faltantes copiados!");
  }, [estatisticas]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'incompleto':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'duplicado':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'faltante':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/10 border-green-500/30';
      case 'incompleto':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'duplicado':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'faltante':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-muted';
    }
  };

  // Contagem por status
  const contagem = {
    ok: artigos.filter(a => a.status === 'ok').length,
    incompleto: artigos.filter(a => a.status === 'incompleto').length,
    duplicado: artigos.filter(a => a.status === 'duplicado').length,
    faltante: artigos.filter(a => a.status === 'faltante').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Validar Extração de Artigos</h1>
              <p className="text-sm text-muted-foreground">
                Compare texto bruto com texto formatado para identificar problemas
              </p>
            </div>
            <Button onClick={processarTextos} disabled={processando}>
              {processando ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Processar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Texto Bruto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto Bruto (Original)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textoBrutoRef}
                placeholder="Cole aqui o texto bruto da lei (HTML/Markdown original)..."
                className="min-h-[300px] font-mono text-xs"
                value={textoBruto}
                onChange={(e) => setTextoBruto(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Texto Formatado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Texto Formatado (Processado)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Cole aqui o texto após formatação com IA (opcional - se vazio, usa o bruto)..."
                className="min-h-[300px] font-mono text-xs"
                value={textoFormatado}
                onChange={(e) => setTextoFormatado(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estatísticas de Extração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{estatisticas.artigosBruto.length}</div>
                  <div className="text-xs text-muted-foreground">No texto bruto</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{estatisticas.artigosExtraidos.length}</div>
                  <div className="text-xs text-muted-foreground">Extraídos</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <div className="text-2xl font-bold text-red-500">{estatisticas.faltantes.length}</div>
                  <div className="text-xs text-muted-foreground">Faltantes</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10">
                  <div className="text-2xl font-bold text-orange-500">{estatisticas.duplicados.length}</div>
                  <div className="text-xs text-muted-foreground">Duplicados</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cobertura</span>
                  <span className="font-medium">{estatisticas.cobertura.toFixed(1)}%</span>
                </div>
                <Progress value={estatisticas.cobertura} className="h-2" />
              </div>

              {estatisticas.faltantes.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Artigos Faltantes:</span>
                    <Button variant="ghost" size="sm" onClick={copiarFaltantes}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {estatisticas.faltantes.slice(0, 20).join(', ')}
                    {estatisticas.faltantes.length > 20 && ` ... e mais ${estatisticas.faltantes.length - 20}`}
                  </p>
                </div>
              )}

              {estatisticas.extras.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span className="text-sm font-medium">Artigos Extras (possíveis referências):</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {estatisticas.extras.slice(0, 10).join(', ')}
                    {estatisticas.extras.length > 10 && ` ... e mais ${estatisticas.extras.length - 10}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de Artigos */}
        {artigos.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Artigos Extraídos</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-500/10">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {contagem.ok}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-500/10">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {contagem.incompleto}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-500/10">
                    {contagem.duplicado} dup
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10">
                    <XCircle className="w-3 h-3 mr-1" />
                    {contagem.faltante}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {artigos.map((artigo, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getStatusColor(artigo.status)} ${
                        artigoSelecionado && artigo.numero?.includes(String(artigoSelecionado)) 
                          ? 'ring-2 ring-primary' 
                          : ''
                      }`}
                      onClick={() => artigo.numero && localizarNoBruto(artigo.numero)}
                    >
                      <div className="flex items-start gap-2">
                        {getStatusIcon(artigo.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{artigo.numero || 'Sem número'}</span>
                            <Badge variant="outline" className="text-[10px] px-1">
                              {artigo.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {artigo.texto.substring(0, 200)}
                            {artigo.texto.length > 200 && '...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
