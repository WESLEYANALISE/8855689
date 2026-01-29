import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown,
  Volume2,
  ArrowRight,
  RefreshCw,
  Copy,
  Eye
} from 'lucide-react';

interface ArtigoExistente {
  id: number;
  "Número do Artigo": string | null;
  Artigo: string;
  Narração?: string | null;
}

interface ArtigoNovo {
  "Número do Artigo": string | null;
  Artigo: string;
  ordem_artigo?: number;
}

interface ComparacaoItem {
  numeroArtigo: string | null;
  artigoExistente: ArtigoExistente | null;
  artigoNovo: ArtigoNovo | null;
  similaridade: number;
  diferencas: string[];
  status: 'igual' | 'modificado' | 'novo' | 'removido';
  temAudio: boolean;
}

interface ComparacaoArtigosProps {
  artigosExistentes: ArtigoExistente[];
  artigosNovos: ArtigoNovo[];
  onAplicarMudancas?: (artigos: ArtigoNovo[], artigosModificados: ComparacaoItem[]) => void;
}

// Função para calcular similaridade entre dois textos (por caracteres)
function calcularSimilaridade(texto1: string, texto2: string): number {
  if (!texto1 && !texto2) return 100;
  if (!texto1 || !texto2) return 0;

  const t1 = texto1.toLowerCase().trim();
  const t2 = texto2.toLowerCase().trim();

  if (t1 === t2) return 100;

  // Algoritmo de Levenshtein simplificado para textos grandes
  const maxLen = Math.max(t1.length, t2.length);
  if (maxLen === 0) return 100;

  // Para textos muito grandes, usar amostragem
  if (maxLen > 5000) {
    // Comparar primeiros 500, últimos 500 e alguns do meio
    const amostra1 = t1.slice(0, 500) + t1.slice(-500);
    const amostra2 = t2.slice(0, 500) + t2.slice(-500);
    return calcularSimilaridadeLevenshtein(amostra1, amostra2);
  }

  return calcularSimilaridadeLevenshtein(t1, t2);
}

function calcularSimilaridadeLevenshtein(s1: string, s2: string): number {
  if (s1 === s2) return 100;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 100;

  // Para strings muito diferentes em tamanho, calcular de forma mais eficiente
  const diffTamanho = Math.abs(len1 - len2) / maxLen;
  if (diffTamanho > 0.5) {
    // Se a diferença de tamanho é maior que 50%, similaridade é baixa
    return Math.round((1 - diffTamanho) * 50);
  }

  // Contar caracteres em comum na mesma posição
  let iguais = 0;
  const minLen = Math.min(len1, len2);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) iguais++;
  }

  return Math.round((iguais / maxLen) * 100);
}

// Função para identificar as diferenças entre dois textos
function identificarDiferencas(texto1: string, texto2: string): string[] {
  if (!texto1 || !texto2) return [];
  
  const diferencas: string[] = [];
  
  // Dividir em palavras
  const palavras1 = texto1.split(/\s+/);
  const palavras2 = texto2.split(/\s+/);
  
  // Encontrar palavras adicionadas/removidas
  const set1 = new Set(palavras1.map(p => p.toLowerCase()));
  const set2 = new Set(palavras2.map(p => p.toLowerCase()));
  
  const removidas = palavras1.filter(p => !set2.has(p.toLowerCase())).slice(0, 10);
  const adicionadas = palavras2.filter(p => !set1.has(p.toLowerCase())).slice(0, 10);
  
  if (removidas.length > 0) {
    diferencas.push(`Removido: ${removidas.join(', ')}`);
  }
  if (adicionadas.length > 0) {
    diferencas.push(`Adicionado: ${adicionadas.join(', ')}`);
  }
  
  // Verificar diferença de tamanho
  const diffTamanho = texto2.length - texto1.length;
  if (Math.abs(diffTamanho) > 10) {
    if (diffTamanho > 0) {
      diferencas.push(`+${diffTamanho} caracteres`);
    } else {
      diferencas.push(`${diffTamanho} caracteres`);
    }
  }
  
  return diferencas;
}

// Função para gerar texto com highlights de diferenças
function gerarDiffHighlight(textoBase: string, textoComparacao: string, tipo: 'atual' | 'novo'): React.ReactNode[] {
  if (!textoBase || !textoComparacao) {
    return [<span key="0">{textoBase || ''}</span>];
  }

  const palavrasBase = textoBase.split(/(\s+)/);
  const palavrasComp = textoComparacao.toLowerCase().split(/\s+/);
  const setComp = new Set(palavrasComp);

  const resultado: React.ReactNode[] = [];
  let key = 0;

  for (const palavra of palavrasBase) {
    // Se for espaço, mantém como está
    if (/^\s+$/.test(palavra)) {
      resultado.push(<span key={key++}>{palavra}</span>);
      continue;
    }

    const palavraLower = palavra.toLowerCase().replace(/[.,;:!?"()]/g, '');
    const existeNoOutro = setComp.has(palavraLower);

    if (!existeNoOutro && palavraLower.length > 2) {
      // Palavra não existe no outro texto - destacar
      if (tipo === 'atual') {
        // Vermelho/laranja para palavras que só existem no atual
        resultado.push(
          <span 
            key={key++} 
            className="bg-red-500/40 text-red-200 px-0.5 rounded"
            title="Só existe no atual"
          >
            {palavra}
          </span>
        );
      } else {
        // Verde para palavras que só existem no novo
        resultado.push(
          <span 
            key={key++} 
            className="bg-green-500/40 text-green-200 px-0.5 rounded"
            title="Só existe no novo"
          >
            {palavra}
          </span>
        );
      }
    } else {
      resultado.push(<span key={key++}>{palavra}</span>);
    }
  }

  return resultado;
}

export default function ComparacaoArtigos({
  artigosExistentes,
  artigosNovos,
  onAplicarMudancas,
}: ComparacaoArtigosProps) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'modificados' | 'novos' | 'removidos'>('todos');
  
  // Criar mapa de artigos existentes por número
  const mapaExistentes = useMemo(() => {
    const mapa = new Map<string, ArtigoExistente>();
    for (const artigo of artigosExistentes) {
      if (artigo["Número do Artigo"]) {
        mapa.set(artigo["Número do Artigo"], artigo);
      }
    }
    return mapa;
  }, [artigosExistentes]);

  // Comparar artigos
  const comparacoes = useMemo((): ComparacaoItem[] => {
    const resultado: ComparacaoItem[] = [];
    const numerosProcessados = new Set<string>();

    // Processar artigos novos
    for (const novo of artigosNovos) {
      const numero = novo["Número do Artigo"];
      if (!numero) continue;
      
      numerosProcessados.add(numero);
      const existente = mapaExistentes.get(numero);

      if (existente) {
        // Artigo existe - comparar
        const similaridade = calcularSimilaridade(existente.Artigo, novo.Artigo);
        const status = similaridade >= 99 ? 'igual' : 'modificado';
        const diferencas = status === 'modificado' 
          ? identificarDiferencas(existente.Artigo, novo.Artigo)
          : [];

        resultado.push({
          numeroArtigo: numero,
          artigoExistente: existente,
          artigoNovo: novo,
          similaridade,
          diferencas,
          status,
          temAudio: !!existente.Narração,
        });
      } else {
        // Artigo novo
        resultado.push({
          numeroArtigo: numero,
          artigoExistente: null,
          artigoNovo: novo,
          similaridade: 0,
          diferencas: ['Artigo novo'],
          status: 'novo',
          temAudio: false,
        });
      }
    }

    // Processar artigos removidos (existem no DB mas não nos novos)
    for (const existente of artigosExistentes) {
      const numero = existente["Número do Artigo"];
      if (!numero || numerosProcessados.has(numero)) continue;

      resultado.push({
        numeroArtigo: numero,
        artigoExistente: existente,
        artigoNovo: null,
        similaridade: 0,
        diferencas: ['Artigo removido'],
        status: 'removido',
        temAudio: !!existente.Narração,
      });
    }

    // Ordenar por número do artigo
    return resultado.sort((a, b) => {
      const numA = parseInt(a.numeroArtigo?.replace(/[^\d]/g, '') || '0');
      const numB = parseInt(b.numeroArtigo?.replace(/[^\d]/g, '') || '0');
      return numA - numB;
    });
  }, [artigosNovos, artigosExistentes, mapaExistentes]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const iguais = comparacoes.filter(c => c.status === 'igual').length;
    const modificados = comparacoes.filter(c => c.status === 'modificado').length;
    const novos = comparacoes.filter(c => c.status === 'novo').length;
    const removidos = comparacoes.filter(c => c.status === 'removido').length;
    const comAudio = comparacoes.filter(c => c.temAudio).length;
    const audiosAfetados = comparacoes.filter(c => c.temAudio && (c.status === 'modificado' || c.status === 'removido')).length;

    return { iguais, modificados, novos, removidos, comAudio, audiosAfetados };
  }, [comparacoes]);

  // Filtrar comparações
  const comparacoesFiltradas = useMemo(() => {
    if (filtroStatus === 'todos') return comparacoes;
    if (filtroStatus === 'modificados') return comparacoes.filter(c => c.status === 'modificado');
    if (filtroStatus === 'novos') return comparacoes.filter(c => c.status === 'novo');
    if (filtroStatus === 'removidos') return comparacoes.filter(c => c.status === 'removido');
    return comparacoes;
  }, [comparacoes, filtroStatus]);

  const toggleExpandido = (numero: string) => {
    setExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(numero)) novo.delete(numero);
      else novo.add(numero);
      return novo;
    });
  };

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'igual': return 'text-green-500';
      case 'modificado': return 'text-amber-500';
      case 'novo': return 'text-blue-500';
      case 'removido': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getBgStatus = (status: string) => {
    switch (status) {
      case 'igual': return 'bg-green-500/10 border-green-500/30';
      case 'modificado': return 'bg-amber-500/10 border-amber-500/30';
      case 'novo': return 'bg-blue-500/10 border-blue-500/30';
      case 'removido': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-muted/50';
    }
  };

  const getIconStatus = (status: string) => {
    switch (status) {
      case 'igual': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'modificado': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'novo': return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'removido': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Comparação com Dados Existentes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`text-center p-2 rounded-lg border transition-colors ${
              filtroStatus === 'todos' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="text-lg font-bold">{comparacoes.length}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </button>
          <button
            onClick={() => setFiltroStatus('modificados')}
            className={`text-center p-2 rounded-lg border transition-colors ${
              filtroStatus === 'modificados' ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="text-lg font-bold text-amber-500">{estatisticas.modificados}</div>
            <div className="text-[10px] text-muted-foreground">Modificados</div>
          </button>
          <button
            onClick={() => setFiltroStatus('novos')}
            className={`text-center p-2 rounded-lg border transition-colors ${
              filtroStatus === 'novos' ? 'border-blue-500 bg-blue-500/10' : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="text-lg font-bold text-blue-500">{estatisticas.novos}</div>
            <div className="text-[10px] text-muted-foreground">Novos</div>
          </button>
          <button
            onClick={() => setFiltroStatus('removidos')}
            className={`text-center p-2 rounded-lg border transition-colors ${
              filtroStatus === 'removidos' ? 'border-red-500 bg-red-500/10' : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="text-lg font-bold text-red-500">{estatisticas.removidos}</div>
            <div className="text-[10px] text-muted-foreground">Removidos</div>
          </button>
        </div>

        {/* Alerta de áudios afetados */}
        {estatisticas.audiosAfetados > 0 && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-start gap-2">
            <Volume2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-sm text-amber-600">
                {estatisticas.audiosAfetados} áudio(s) podem ser afetados
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Artigos com narração que foram modificados ou removidos
              </div>
            </div>
          </div>
        )}

        {/* Resumo de iguais */}
        {estatisticas.iguais > 0 && filtroStatus === 'todos' && (
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{estatisticas.iguais} artigos iguais (100% similaridade) — não serão alterados</span>
            </div>
          </div>
        )}

        {/* Lista de comparações */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-2">
            {comparacoesFiltradas
              .filter(c => filtroStatus === 'todos' ? c.status !== 'igual' : true)
              .map((comp) => (
                <Collapsible
                  key={comp.numeroArtigo || 'sem-numero'}
                  open={expandidos.has(comp.numeroArtigo || '')}
                  onOpenChange={() => toggleExpandido(comp.numeroArtigo || '')}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${getBgStatus(comp.status)}`}
                    >
                      <div className="flex items-center gap-2">
                        {getIconStatus(comp.status)}
                        <span className="font-mono text-sm font-medium">
                          {comp.numeroArtigo || 'Sem número'}
                        </span>
                        
                        {/* Badge de similaridade */}
                        {comp.status === 'modificado' && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              comp.similaridade >= 90 ? 'border-green-500 text-green-600' :
                              comp.similaridade >= 70 ? 'border-amber-500 text-amber-600' :
                              'border-red-500 text-red-600'
                            }`}
                          >
                            {comp.similaridade}%
                          </Badge>
                        )}

                        {/* Badge de status */}
                        <Badge variant="outline" className={`text-[9px] ${getCorStatus(comp.status)}`}>
                          {comp.status === 'igual' && 'Igual'}
                          {comp.status === 'modificado' && 'Modificado'}
                          {comp.status === 'novo' && 'Novo'}
                          {comp.status === 'removido' && 'Removido'}
                        </Badge>

                        {/* Ícone de áudio */}
                        {comp.temAudio && (
                          <span title="Tem narração">
                            <Volume2 className="h-3.5 w-3.5 text-purple-500 ml-auto" />
                          </span>
                        )}

                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandidos.has(comp.numeroArtigo || '') ? 'rotate-180' : ''
                        }`} />
                      </div>

                      {/* Preview das diferenças */}
                      {comp.diferencas.length > 0 && (
                        <div className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
                          {comp.diferencas[0]}
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg border space-y-3">
                      {/* Barra de similaridade */}
                      {comp.status === 'modificado' && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Similaridade</span>
                            <span className={`font-medium ${
                              comp.similaridade >= 90 ? 'text-green-500' :
                              comp.similaridade >= 70 ? 'text-amber-500' :
                              'text-red-500'
                            }`}>{comp.similaridade}%</span>
                          </div>
                          <Progress 
                            value={comp.similaridade} 
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Lista de diferenças */}
                      {comp.diferencas.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Diferenças:</span>
                          {comp.diferencas.map((diff, i) => (
                            <div key={i} className="text-xs p-1.5 bg-background rounded border">
                              {diff}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comparação lado a lado com highlights */}
                      {comp.status === 'modificado' && comp.artigoExistente && comp.artigoNovo && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-red-500 uppercase">Atual (Supabase)</span>
                            <div className="text-[10px] p-2 bg-red-500/5 border border-red-500/20 rounded max-h-48 overflow-auto leading-relaxed">
                              {gerarDiffHighlight(
                                comp.artigoExistente.Artigo.substring(0, 1000),
                                comp.artigoNovo.Artigo,
                                'atual'
                              )}
                              {comp.artigoExistente.Artigo.length > 1000 && <span className="text-muted-foreground">...</span>}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-green-500 uppercase">Novo (Raspado)</span>
                            <div className="text-[10px] p-2 bg-green-500/5 border border-green-500/20 rounded max-h-48 overflow-auto leading-relaxed">
                              {gerarDiffHighlight(
                                comp.artigoNovo.Artigo.substring(0, 1000),
                                comp.artigoExistente.Artigo,
                                'novo'
                              )}
                              {comp.artigoNovo.Artigo.length > 1000 && <span className="text-muted-foreground">...</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Artigo novo */}
                      {comp.status === 'novo' && comp.artigoNovo && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-blue-500 uppercase">Conteúdo do novo artigo</span>
                          <div className="text-[10px] p-2 bg-blue-500/5 border border-blue-500/20 rounded max-h-32 overflow-auto">
                            {comp.artigoNovo.Artigo.substring(0, 500)}
                            {comp.artigoNovo.Artigo.length > 500 && '...'}
                          </div>
                        </div>
                      )}

                      {/* Artigo removido */}
                      {comp.status === 'removido' && comp.artigoExistente && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-red-500 uppercase">Artigo que será removido</span>
                          <div className="text-[10px] p-2 bg-red-500/5 border border-red-500/20 rounded max-h-32 overflow-auto">
                            {comp.artigoExistente.Artigo.substring(0, 500)}
                            {comp.artigoExistente.Artigo.length > 500 && '...'}
                          </div>
                          {comp.temAudio && (
                            <div className="text-[10px] text-amber-600 flex items-center gap-1">
                              <Volume2 className="h-3 w-3" />
                              Este artigo tem narração que será perdida!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </div>
        </ScrollArea>

        {/* Ações */}
        {onAplicarMudancas && (estatisticas.modificados > 0 || estatisticas.novos > 0 || estatisticas.removidos > 0) && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const lista = comparacoesFiltradas
                  .filter(c => c.status !== 'igual')
                  .map(c => `${c.numeroArtigo}: ${c.status} (${c.similaridade}%)`)
                  .join('\n');
                navigator.clipboard.writeText(lista);
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copiar Lista
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAplicarMudancas(artigosNovos, comparacoes.filter(c => c.status !== 'igual'))}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Aplicar Mudanças ({estatisticas.modificados + estatisticas.novos})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
