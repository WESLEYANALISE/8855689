import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, XCircle, ArrowRightLeft, X, 
  Plus, Minus, Edit3, Volume2, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtigoAlterado {
  numero: string;
  conteudoAntigo: string;
  conteudoNovo: string;
  diferencas: string[];
  textoIdentico: boolean;
}

interface AudioAfetado {
  artigo: string;
  tipo: 'remover' | 'atualizar' | 'manter';
  urlAudio?: string;
  motivo: string;
}

interface ComparacaoResult {
  artigosNovos: Array<{ numero: string; conteudo: string }>;
  artigosRemovidos: Array<{ numero: string; conteudo: string }>;
  artigosAlterados: ArtigoAlterado[];
  audiosAfetados?: AudioAfetado[];
  estatisticas: {
    inclusoes: number;
    alteracoes: number;
    exclusoes: number;
    audiosRemover?: number;
  };
}

interface ModalComparacaoLeiProps {
  open: boolean;
  onClose: () => void;
  comparacao: ComparacaoResult;
  nomeLei: string;
}

export function ModalComparacaoLei({ open, onClose, comparacao, nomeLei }: ModalComparacaoLeiProps) {
  const [tabAtiva, setTabAtiva] = useState<'todos' | 'novos' | 'removidos' | 'alterados' | 'audios'>('todos');

  const totalAlteracoes = comparacao.estatisticas.inclusoes + comparacao.estatisticas.exclusoes + comparacao.estatisticas.alteracoes;
  const audiosParaRemover = comparacao.audiosAfetados?.filter(a => a.tipo === 'remover') || [];

  // Detectar tipo do item (artigo, capítulo, título, etc)
  const getTipoItem = (numero: string | null | undefined): { tipo: string; isTitulo: boolean } => {
    if (!numero) return { tipo: 'Item', isTitulo: false };
    const lower = numero.toLowerCase();
    if (lower.startsWith('art')) return { tipo: 'Artigo', isTitulo: false };
    if (lower.includes('capítulo')) return { tipo: 'Capítulo', isTitulo: true };
    if (lower.includes('título')) return { tipo: 'Título', isTitulo: true };
    if (lower.includes('livro')) return { tipo: 'Livro', isTitulo: true };
    if (lower.includes('seção')) return { tipo: 'Seção', isTitulo: true };
    if (lower.includes('parte')) return { tipo: 'Parte', isTitulo: true };
    return { tipo: 'Item', isTitulo: false };
  };

  // Renderizar preview em estilo tabela como vai ficar no banco
  const renderPreviewTabela = (
    items: Array<{ numero: string; conteudo: string }>,
    tipo: 'novo' | 'removido'
  ) => {
    const isNovo = tipo === 'novo';
    
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {isNovo ? (
            <>
              <Plus className="h-12 w-12 mx-auto mb-3 text-green-500/30" />
              <p className="text-lg font-medium">Nenhum item novo</p>
            </>
          ) : (
            <>
              <Minus className="h-12 w-12 mx-auto mb-3 text-red-500/30" />
              <p className="text-lg font-medium">Nenhum item removido</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header da tabela */}
        <div className={cn(
          "grid grid-cols-[120px_1fr] text-xs font-semibold uppercase tracking-wide",
          isNovo ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
        )}>
          <div className="p-3 border-r border-border/50">Número</div>
          <div className="p-3">Conteúdo</div>
        </div>
        
        {/* Linhas da tabela */}
        {items.map((item, index) => {
          const { tipo: tipoItem, isTitulo } = getTipoItem(item.numero);
          
          return (
            <div 
              key={`${tipo}-${index}`}
              className={cn(
                "grid grid-cols-[120px_1fr] border-t border-border/30",
                isNovo ? "bg-green-500/5 hover:bg-green-500/10" : "bg-red-500/5 hover:bg-red-500/10",
                isTitulo && "font-semibold"
              )}
            >
              {/* Coluna do número */}
              <div className={cn(
                "p-3 border-r border-border/30 flex flex-col gap-1",
                isTitulo ? "bg-muted/30" : ""
              )}>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-mono text-[10px] w-fit",
                    isNovo ? "border-green-500/50 text-green-600" : "border-red-500/50 text-red-600"
                  )}
                >
                  {item.numero}
                </Badge>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded w-fit",
                  isNovo ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                )}>
                  {tipoItem} {isNovo ? 'adicionado' : 'removido'}
                </span>
              </div>
              
              {/* Coluna do conteúdo */}
              <div className={cn(
                "p-3 text-sm",
                !isNovo && "line-through opacity-60"
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {item.conteudo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar itens alterados em tabela
  const renderAlteradosTabela = () => {
    if (comparacao.artigosAlterados.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Edit3 className="h-12 w-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-lg font-medium">Nenhum item alterado</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_1fr] text-xs font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-600">
          <div className="p-3 border-r border-border/50">Número</div>
          <div className="p-3 border-r border-border/50 flex items-center gap-2">
            <XCircle className="h-3 w-3" /> Antes
          </div>
          <div className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" /> Depois
          </div>
        </div>
        
        {/* Linhas */}
        {comparacao.artigosAlterados.map((artigo, index) => {
          const { tipo: tipoItem } = getTipoItem(artigo.numero);
          
          return (
            <div 
              key={`alterado-${index}`}
              className="grid grid-cols-[120px_1fr_1fr] border-t border-border/30 bg-amber-500/5 hover:bg-amber-500/10"
            >
              {/* Coluna do número */}
              <div className="p-3 border-r border-border/30 flex flex-col gap-1">
                <Badge variant="outline" className="font-mono text-[10px] w-fit border-amber-500/50 text-amber-600">
                  {artigo.numero}
                </Badge>
                <span className="text-[9px] px-1.5 py-0.5 rounded w-fit bg-amber-500/20 text-amber-600">
                  {tipoItem} alterado
                </span>
              </div>
              
              {/* Coluna ANTES */}
              <div className="p-3 border-r border-border/30 text-sm bg-red-500/5">
                <p className="whitespace-pre-wrap leading-relaxed line-through opacity-60">
                  {artigo.conteudoAntigo}
                </p>
              </div>
              
              {/* Coluna DEPOIS */}
              <div className="p-3 text-sm bg-green-500/5">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {artigo.conteudoNovo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar áudios que serão removidos
  const renderAudiosAfetados = () => {
    if (audiosParaRemover.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Volume2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-lg font-medium">Nenhum áudio será removido</p>
          <p className="text-sm">Todos os áudios existentes serão mantidos</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_auto] text-xs font-semibold uppercase tracking-wide bg-red-500/20 text-red-600">
          <div className="p-3 border-r border-border/50">Artigo</div>
          <div className="p-3 border-r border-border/50">Motivo</div>
          <div className="p-3">Ação</div>
        </div>
        
        {/* Linhas */}
        {audiosParaRemover.map((audio, index) => (
          <div 
            key={`audio-${index}`}
            className="grid grid-cols-[120px_1fr_auto] border-t border-border/30 bg-red-500/5 hover:bg-red-500/10"
          >
            <div className="p-3 border-r border-border/30 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="font-mono text-[10px] border-red-500/50 text-red-600">
                {audio.artigo}
              </Badge>
            </div>
            <div className="p-3 border-r border-border/30 text-sm text-muted-foreground">
              {audio.motivo}
            </div>
            <div className="p-3 flex items-center">
              <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-600">
                <Trash2 className="h-3 w-3" />
                Remover
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header fixo */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Comparação de Versões
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{nomeLei}</p>
            </div>
            
            {/* Estatísticas resumidas */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                <Plus className="h-3.5 w-3.5 text-green-500" />
                <span className="text-sm font-semibold text-green-600">{comparacao.estatisticas.inclusoes}</span>
                <span className="text-xs text-green-600/70">novos</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Edit3 className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm font-semibold text-amber-600">{comparacao.estatisticas.alteracoes}</span>
                <span className="text-xs text-amber-600/70">alterados</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                <Minus className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-semibold text-red-600">{comparacao.estatisticas.exclusoes}</span>
                <span className="text-xs text-red-600/70">removidos</span>
              </div>
              {audiosParaRemover.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                  <Volume2 className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">{audiosParaRemover.length}</span>
                  <span className="text-xs text-red-600/70">áudios</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={tabAtiva} onValueChange={(v) => setTabAtiva(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b shrink-0 bg-muted/30">
            <TabsList className="h-9">
              <TabsTrigger value="todos" className="text-xs gap-1.5">
                Todas as Alterações
                <Badge variant="secondary" className="text-[10px] px-1.5">{totalAlteracoes}</Badge>
              </TabsTrigger>
              <TabsTrigger value="novos" className="text-xs gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Novos
                <Badge variant="secondary" className="text-[10px] px-1.5 bg-green-500/20 text-green-600">
                  {comparacao.estatisticas.inclusoes}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="alterados" className="text-xs gap-1.5">
                <ArrowRightLeft className="h-3 w-3 text-amber-500" />
                Alterados
                <Badge variant="secondary" className="text-[10px] px-1.5 bg-amber-500/20 text-amber-600">
                  {comparacao.estatisticas.alteracoes}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="removidos" className="text-xs gap-1.5">
                <XCircle className="h-3 w-3 text-red-500" />
                Removidos
                <Badge variant="secondary" className="text-[10px] px-1.5 bg-red-500/20 text-red-600">
                  {comparacao.estatisticas.exclusoes}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="audios" className="text-xs gap-1.5">
                <Volume2 className="h-3 w-3 text-red-500" />
                Áudios Afetados
                <Badge variant="secondary" className="text-[10px] px-1.5 bg-red-500/20 text-red-600">
                  {audiosParaRemover.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="todos" className="h-full m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6 space-y-6">
                  {totalAlteracoes === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                      <p className="text-lg font-medium">Nenhuma alteração detectada</p>
                      <p className="text-sm">A lei está idêntica à versão atual</p>
                    </div>
                  ) : (
                    <>
                      {/* Novos */}
                      {comparacao.artigosNovos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Itens Novos ({comparacao.artigosNovos.length})
                          </h3>
                          {renderPreviewTabela(comparacao.artigosNovos, 'novo')}
                        </div>
                      )}
                      
                      {/* Alterados */}
                      {comparacao.artigosAlterados.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            Itens Alterados ({comparacao.artigosAlterados.length})
                          </h3>
                          {renderAlteradosTabela()}
                        </div>
                      )}
                      
                      {/* Removidos */}
                      {comparacao.artigosRemovidos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Minus className="h-4 w-4" />
                            Itens Removidos ({comparacao.artigosRemovidos.length})
                          </h3>
                          {renderPreviewTabela(comparacao.artigosRemovidos, 'removido')}
                        </div>
                      )}

                      {/* Áudios afetados */}
                      {audiosParaRemover.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Áudios que Serão Removidos ({audiosParaRemover.length})
                          </h3>
                          {renderAudiosAfetados()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="novos" className="h-full m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6">
                  {renderPreviewTabela(comparacao.artigosNovos, 'novo')}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alterados" className="h-full m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6">
                  {renderAlteradosTabela()}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="removidos" className="h-full m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6">
                  {renderPreviewTabela(comparacao.artigosRemovidos, 'removido')}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="audios" className="h-full m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6">
                  {renderAudiosAfetados()}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {totalAlteracoes} alterações detectadas
            {audiosParaRemover.length > 0 && ` • ${audiosParaRemover.length} áudios serão removidos`}
          </p>
          <Button onClick={onClose} variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
