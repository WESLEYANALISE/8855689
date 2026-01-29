import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Copy, 
  RefreshCw,
  Loader2,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface ArtigoExtraido {
  numero: string | null;
  texto: string;
  status: 'ok' | 'incompleto' | 'duplicado' | 'faltante' | 'citado';
}

interface EstatisticasExtracao {
  artigosBruto: number[];
  artigosExtraidos: number[];
  faltantes: number[];
  extras: number[];
  duplicados: string[];
  citados: number[];
  cobertura: number;
}

interface ValidacaoVisualArtigosProps {
  textoBruto: string;
  textoFormatado: string;
  onLocalizarArtigo?: (numeroArtigo: string, posicao: number) => void;
}

export default function ValidacaoVisualArtigos({ 
  textoBruto, 
  textoFormatado,
  onLocalizarArtigo 
}: ValidacaoVisualArtigosProps) {
  const [artigos, setArtigos] = useState<ArtigoExtraido[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasExtracao | null>(null);
  const [processando, setProcessando] = useState(false);
  const [artigoSelecionado, setArtigoSelecionado] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detectar se um artigo está entre aspas no texto bruto (é uma citação, não artigo real)
  const ehArtigoCitado = useCallback((numArtigo: number, texto: string): boolean => {
    // Regex para detectar qualquer tipo de aspas
    const ASPAS = '["\'\'""«»‹›]';
    
    // Procurar por Art. X entre aspas
    const regexCitado = new RegExp(
      `${ASPAS}[^${ASPAS}]*Art\\.?\\s*${numArtigo}[ºª°]?[^${ASPAS}]*${ASPAS}`,
      'i'
    );
    
    // Também verificar se está precedido por "seguinte art." ou "art. X:" (introdução de citação)
    const regexIntroducao = new RegExp(
      `seguinte\\s+art\\.?\\s*${numArtigo}[ºª°]?\\s*:|acrescida\\s+do\\s+(?:seguinte\\s+)?art\\.?\\s*${numArtigo}`,
      'i'
    );
    
    return regexCitado.test(texto) || regexIntroducao.test(texto);
  }, []);

  // Extrair artigos do texto formatado
  const extrairArtigos = useCallback((texto: string): ArtigoExtraido[] => {
    const resultado: ArtigoExtraido[] = [];
    const regex = /(?:^|\n)\s*Art\.?\s*(\d+[A-Z]?(?:-[A-Z])?)[º°ª]?\s*[-–.]?\s*([^\n]*(?:\n(?!\s*Art\.).*)*)/gi;
    
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

  // Contar artigos no texto bruto (excluindo citações)
  const contarArtigosBruto = useCallback((texto: string): { reais: number[]; citados: number[] } => {
    const regex = /\bArt\.?\s*(\d+)[º°ª]?\s*[-–.]/gi;
    const numerosReais = new Set<number>();
    const numerosCitados = new Set<number>();
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const num = parseInt(match[1]);
      if (num > 0 && num < 2000) {
        if (ehArtigoCitado(num, texto)) {
          numerosCitados.add(num);
        } else {
          numerosReais.add(num);
        }
      }
    }
    
    return {
      reais: Array.from(numerosReais).sort((a, b) => a - b),
      citados: Array.from(numerosCitados).sort((a, b) => a - b)
    };
  }, [ehArtigoCitado]);

  // Processar textos
  const processarTextos = useCallback(() => {
    if (!textoBruto.trim()) {
      toast.error("Texto bruto está vazio");
      return;
    }

    setProcessando(true);

    try {
      // Contar artigos no bruto (separando reais de citados)
      const { reais: artigosBruto, citados } = contarArtigosBruto(textoBruto);
      
      // Extrair artigos do formatado
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
      
      // Faltantes (artigos reais no bruto que não estão no formatado)
      const faltantes: number[] = [];
      for (const num of artigosBruto) {
        if (!numerosExtraidos.has(num)) {
          // Verificar se é um artigo citado (não é faltante real)
          if (!citados.includes(num)) {
            faltantes.push(num);
          }
        }
      }
      
      // Extras (artigos no formatado que não estão no bruto como reais)
      const artigosBrutoSet = new Set(artigosBruto);
      const extras: number[] = [];
      for (const num of numerosExtraidos) {
        if (!artigosBrutoSet.has(num) && !citados.includes(num)) {
          extras.push(num);
        }
      }
      
      // Atualizar status dos artigos
      const artigosComStatus = artigosExtraidos.map(artigo => {
        if (artigo.status === 'duplicado') return artigo;
        
        // Verificar se é um artigo citado
        const match = artigo.numero?.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (citados.includes(num)) {
            return { ...artigo, status: 'citado' as const };
          }
        }
        
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
        citados,
        cobertura: artigosBruto.length > 0 
          ? (numerosExtraidos.size / artigosBruto.length) * 100 
          : 100
      });
      
      toast.success(`Validação concluída: ${artigosExtraidos.length} artigos analisados`);
    } catch (error) {
      toast.error("Erro ao processar textos");
      console.error(error);
    } finally {
      setProcessando(false);
    }
  }, [textoBruto, textoFormatado, contarArtigosBruto, extrairArtigos]);

  // Localizar artigo no texto bruto
  const localizarNoBruto = useCallback((numeroArtigo: string) => {
    const match = numeroArtigo.match(/(\d+)/);
    if (!match) return;
    
    const num = parseInt(match[1]);
    const regex = new RegExp(`Art\\.?\\s*${num}[º°ª]?`, 'i');
    const resultado = textoBruto.match(regex);
    
    if (resultado && resultado.index !== undefined) {
      setArtigoSelecionado(num);
      
      if (onLocalizarArtigo) {
        onLocalizarArtigo(numeroArtigo, resultado.index);
      }
      
      toast.info(`Localizado: ${numeroArtigo}`);
    } else {
      toast.warning(`${numeroArtigo} não encontrado no texto bruto`);
    }
  }, [textoBruto, onLocalizarArtigo]);

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
      case 'citado':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/10 border-l-4 border-green-500';
      case 'incompleto':
        return 'bg-yellow-500/10 border-l-4 border-yellow-500';
      case 'duplicado':
        return 'bg-orange-500/10 border-l-4 border-orange-500';
      case 'faltante':
        return 'bg-red-500/10 border-l-4 border-red-500';
      case 'citado':
        return 'bg-blue-500/10 border-l-4 border-blue-500';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'incompleto': return 'Incompleto';
      case 'duplicado': return 'Duplicado';
      case 'faltante': return 'Faltante';
      case 'citado': return 'Citação';
      default: return status;
    }
  };

  // Contagem por status
  const contagem = {
    ok: artigos.filter(a => a.status === 'ok').length,
    incompleto: artigos.filter(a => a.status === 'incompleto').length,
    duplicado: artigos.filter(a => a.status === 'duplicado').length,
    faltante: artigos.filter(a => a.status === 'faltante').length,
    citado: artigos.filter(a => a.status === 'citado').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4" />
          Validação Visual de Artigos
        </h3>
        <Button onClick={processarTextos} disabled={processando} size="sm">
          {processando ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Validar
        </Button>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Estatísticas de Extração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
              <div className="text-center p-2 rounded-lg bg-muted">
                <div className="text-lg font-bold">{estatisticas.artigosBruto.length}</div>
                <div className="text-[10px] text-muted-foreground">No texto bruto</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <div className="text-lg font-bold">{estatisticas.artigosExtraidos.length}</div>
                <div className="text-[10px] text-muted-foreground">Extraídos</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/10">
                <div className="text-lg font-bold text-red-500">{estatisticas.faltantes.length}</div>
                <div className="text-[10px] text-muted-foreground">Faltantes</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-orange-500/10">
                <div className="text-lg font-bold text-orange-500">{estatisticas.duplicados.length}</div>
                <div className="text-[10px] text-muted-foreground">Duplicados</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-500/10">
                <div className="text-lg font-bold text-blue-500">{estatisticas.citados.length}</div>
                <div className="text-[10px] text-muted-foreground">Citações</div>
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
              <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Artigos Faltantes:</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={copiarFaltantes}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {estatisticas.faltantes.slice(0, 15).join(', ')}
                  {estatisticas.faltantes.length > 15 && ` ... e mais ${estatisticas.faltantes.length - 15}`}
                </p>
              </div>
            )}

            {estatisticas.citados.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <span className="text-xs font-medium">Artigos Citados (entre aspas, não são artigos reais):</span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {estatisticas.citados.slice(0, 10).join(', ')}
                  {estatisticas.citados.length > 10 && ` ... e mais ${estatisticas.citados.length - 10}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Artigos */}
      {artigos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Artigos Extraídos</CardTitle>
              <div className="flex gap-1">
                <Badge variant="outline" className="bg-green-500/10 text-[10px] h-5">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {contagem.ok}
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 text-[10px] h-5">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {contagem.incompleto}
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-[10px] h-5">
                  {contagem.duplicado} dup
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-[10px] h-5">
                  <XCircle className="w-3 h-3 mr-1" />
                  {contagem.faltante}
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-[10px] h-5">
                  {contagem.citado} cit
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1" ref={scrollRef}>
                {artigos.map((artigo, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded cursor-pointer transition-colors hover:bg-muted/50 ${getStatusColor(artigo.status)} ${
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
                          <span className="font-medium text-xs">{artigo.numero || 'Sem número'}</span>
                          <Badge variant="outline" className="text-[9px] px-1 h-4">
                            {getStatusLabel(artigo.status)}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {artigo.texto.substring(0, 150)}
                          {artigo.texto.length > 150 && '...'}
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

      {/* Mensagem quando não há artigos */}
      {!artigos.length && !processando && (
        <div className="text-center text-muted-foreground text-sm py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Clique em "Validar" para analisar os artigos</p>
        </div>
      )}
    </div>
  );
}
