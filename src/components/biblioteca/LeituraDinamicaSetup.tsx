import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Link2, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  BookOpen,
  ArrowRight
} from "lucide-react";

interface LeituraDinamicaSetupProps {
  isOpen: boolean;
  onClose: () => void;
  livroId: number;
  tituloLivro: string;
  downloadUrl?: string;
  onComplete: () => void;
}

type Etapa = 'url' | 'extraindo' | 'analisando' | 'formatando' | 'revisando' | 'concluido';

const LeituraDinamicaSetup = ({ 
  isOpen, 
  onClose, 
  livroId, 
  tituloLivro, 
  downloadUrl,
  onComplete 
}: LeituraDinamicaSetupProps) => {
  const [url, setUrl] = useState(downloadUrl || "");
  const [etapa, setEtapa] = useState<Etapa>('url');
  const [progresso, setProgresso] = useState(0);
  const [paginasProcessadas, setPaginasProcessadas] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [paginasFormatadas, setPaginasFormatadas] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capitulosDetectados, setCapitulosDetectados] = useState(0);
  const [capituloAtual, setCapituloAtual] = useState(0);
  const [totalCapitulos, setTotalCapitulos] = useState(0);
  const [percentualPreservado, setPercentualPreservado] = useState(0);
  const [capitulosRevisados, setCapitulosRevisados] = useState(0);

  const validarUrlDrive = (url: string): { valido: boolean; erro?: string } => {
    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      return { valido: false, erro: 'URL inválida. Use um link do Google Drive.' };
    }
    if (url.includes('/folders/')) {
      return { valido: false, erro: 'URL de pasta não suportada. Use a URL direta do arquivo PDF.' };
    }
    if (!url.includes('/d/') && !url.includes('id=')) {
      return { valido: false, erro: 'Formato de URL inválido. Use uma URL de arquivo do Google Drive.' };
    }
    return { valido: true };
  };

  // Verificar progresso real no banco de dados
  const verificarProgressoBanco = async (): Promise<number> => {
    try {
      const { count } = await supabase
        .from('BIBLIOTECA-LEITURA-DINAMICA')
        .select('Pagina', { count: 'exact', head: true })
        .eq('Titulo da Obra', tituloLivro);
      return count || 0;
    } catch {
      return 0;
    }
  };

  const extrairTexto = async () => {
    const validacao = validarUrlDrive(url);
    if (!validacao.valido) {
      toast.error(validacao.erro || "URL inválida");
      setErro(validacao.erro || "URL inválida");
      return;
    }

    setEtapa('extraindo');
    setErro(null);
    setIsProcessing(true);
    setProgresso(1);
    setPaginasProcessadas(0);

    // Referência mutável para o total de páginas (atualizado pela API)
    let totalDetectadoRef = 0;
    let pollingAtivo = true;
    
    // Polling agressivo a cada 1 segundo para atualizar progresso em tempo real
    const pollInterval = setInterval(async () => {
      if (!pollingAtivo) return;
      
      try {
        const paginasNoBanco = await verificarProgressoBanco();
        console.log(`[Polling] Páginas no banco: ${paginasNoBanco}, Total: ${totalDetectadoRef}`);
        
        if (paginasNoBanco > 0) {
          setPaginasProcessadas(paginasNoBanco);
          
          if (totalDetectadoRef > 0) {
            const progressoReal = Math.min(95, Math.round((paginasNoBanco / totalDetectadoRef) * 100));
            setProgresso(progressoReal);
          } else {
            // Se ainda não sabemos o total, mostrar progresso baseado nas páginas
            setProgresso(Math.min(50, paginasNoBanco));
          }
        }
      } catch (e) {
        console.error('[Polling] Erro:', e);
      }
    }, 1000); // Verificar a cada 1 segundo

    try {
      let paginaAtual = 1;
      let continuar = true;
      let tentativasErro = 0;
      const MAX_TENTATIVAS = 5;

      while (continuar) {
        try {
          console.log(`Chamando Edge Function para páginas a partir de ${paginaAtual}...`);
          
          const response = await supabase.functions.invoke('processar-pdf-leitura-dinamica', {
            body: {
              tituloLivro,
              pdfUrl: url,
              paginaInicial: paginaAtual,
              paginaFinal: totalDetectadoRef > 0 ? totalDetectadoRef : undefined
            }
          });

          tentativasErro = 0;

          if (response.error) {
            console.error('Erro na resposta:', response.error);
            throw new Error(response.error.message || 'Erro ao processar PDF');
          }

          const data = response.data;

          if (!data.success) {
            throw new Error(data.error || 'Erro ao processar PDF');
          }

          // Atualizar total detectado
          if (data.totalPaginas > 0 && totalDetectadoRef === 0) {
            totalDetectadoRef = data.totalPaginas;
            setTotalPaginas(data.totalPaginas);
            console.log(`Total de páginas detectado: ${totalDetectadoRef}`);
          }

          // Atualizar progresso com dados da resposta
          setPaginasProcessadas(data.paginaAtual);
          const progressoAtual = totalDetectadoRef > 0 
            ? Math.min(95, (data.paginaAtual / totalDetectadoRef) * 100)
            : Math.min(50, data.paginaAtual);
          setProgresso(progressoAtual);

          console.log(`Progresso: ${data.paginaAtual}/${totalDetectadoRef} (${Math.round(progressoAtual)}%)`);

          if (data.temMais && data.proximaPagina) {
            paginaAtual = data.proximaPagina;
            await new Promise(r => setTimeout(r, 300));
          } else {
            continuar = false;
            console.log('Extração completa!');
          }
        } catch (batchError: any) {
          tentativasErro++;
          console.error(`Erro no lote (tentativa ${tentativasErro}/${MAX_TENTATIVAS}):`, batchError);
          
          // Verificar progresso real no banco mesmo com erro
          const paginasNoBanco = await verificarProgressoBanco();
          if (paginasNoBanco > paginaAtual) {
            // Já processou mais páginas, ajustar próxima página
            paginaAtual = paginasNoBanco + 1;
            console.log(`Recuperando: banco tem ${paginasNoBanco} páginas, continuando de ${paginaAtual}`);
            tentativasErro = 0;
            continue;
          }
          
          if (tentativasErro >= MAX_TENTATIVAS) {
            throw new Error(`Falha após ${MAX_TENTATIVAS} tentativas: ${batchError.message}`);
          }
          
          await new Promise(r => setTimeout(r, 2000 * tentativasErro));
        }
      }

      pollingAtivo = false;
      clearInterval(pollInterval);
      
      setProgresso(100);
      toast.success(`${totalDetectadoRef} páginas extraídas!`);
      
      await analisarEstrutura();
      
    } catch (error: any) {
      pollingAtivo = false;
      clearInterval(pollInterval);
      
      console.error('Erro ao extrair:', error);
      setErro(error.message || 'Erro ao processar PDF');
      setEtapa('url');
      toast.error(error.message || 'Erro ao processar PDF');
      setIsProcessing(false);
    }
  };

  const analisarEstrutura = async () => {
    setEtapa('analisando');
    setProgresso(0);
    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('analisar-estrutura-livro', {
        body: { tituloLivro }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.success && data.estrutura) {
        setCapitulosDetectados(data.estrutura.capitulos?.length || 0);
        setTotalPaginas(data.totalPaginas);
        console.log(`Estrutura analisada: ${data.estrutura.capitulos?.length} capítulos`);
      }

      setProgresso(100);
      
      // Iniciar formatação automaticamente
      await formatarPaginas();
      
    } catch (error: any) {
      console.error('Erro ao analisar:', error);
      // Continuar para formatação mesmo com erro na análise
      await formatarPaginas();
    }
  };

  const formatarPaginas = async () => {
    setEtapa('formatando');
    setProgresso(0);
    setCapituloAtual(1);
    setIsProcessing(true);

    let pollingAtivo = true;
    let ultimoCapituloDetectado = 0;

    try {
      // Primeiro, buscar o índice para saber quantos capítulos há
      const { data: indiceData } = await supabase
        .from('leitura_livros_indice')
        .select('indice_capitulos')
        .eq('livro_titulo', tituloLivro)
        .single();

      const indiceCapitulos = indiceData?.indice_capitulos;
      const numCapitulos = Array.isArray(indiceCapitulos) ? indiceCapitulos.length : 1;
      setTotalCapitulos(numCapitulos);

      // Polling mais frequente (1 segundo) para verificar progresso real
      const pollInterval = setInterval(async () => {
        if (!pollingAtivo) return;
        
        try {
          // Contar quantos capítulos únicos já foram formatados
          const { data: paginasData } = await supabase
            .from('leitura_paginas_formatadas')
            .select('capitulo_titulo')
            .eq('livro_titulo', tituloLivro);
          
          if (paginasData && paginasData.length > 0) {
            // Contar capítulos únicos já formatados (completos no banco)
            const capitulosUnicos = new Set(paginasData.map(p => p.capitulo_titulo));
            const capitulosFormatados = capitulosUnicos.size;
            
            // Se há mais capítulos no banco do que antes, atualizar UI
            if (capitulosFormatados > ultimoCapituloDetectado) {
              ultimoCapituloDetectado = capitulosFormatados;
              // Mostrar o próximo capítulo em processamento (atual + 1)
              setCapituloAtual(Math.min(capitulosFormatados + 1, numCapitulos));
              setPaginasFormatadas(paginasData.length);
              
              const progressoReal = Math.min(95, Math.round((capitulosFormatados / numCapitulos) * 100));
              setProgresso(progressoReal);
              
              console.log(`[Polling formatação] ${capitulosFormatados}/${numCapitulos} capítulos concluídos, processando ${capitulosFormatados + 1}`);
            }
          }
        } catch (e) {
          console.error('[Polling formatação] Erro:', e);
        }
      }, 1000); // Verificar a cada 1 segundo (mais frequente)

      const response = await supabase.functions.invoke('formatar-paginas-livro', {
        body: { tituloLivro }
      });

      // Parar polling
      pollingAtivo = false;
      clearInterval(pollInterval);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      setPaginasFormatadas(data.paginasFormatadas || 0);
      setCapituloAtual(numCapitulos);
      
      // Se houve revisão, mostrar etapa de revisão
      if (data.revisao) {
        setEtapa('revisando');
        setPercentualPreservado(data.revisao.percentualPreservado || 0);
        setCapitulosRevisados(data.revisao.capitulosRevisados || 0);
        
        // Aguardar para mostrar resultado da revisão
        await new Promise(r => setTimeout(r, 2500));
      }
      
      setProgresso(100);
      setEtapa('concluido');
      toast.success(`Livro formatado: ${data.capitulosProcessados || numCapitulos} capítulos!`);
      
      // Aguardar e abrir o reader
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } catch (error: any) {
      pollingAtivo = false;
      console.error('Erro ao formatar:', error);
      setErro(error.message || 'Erro ao formatar páginas');
      toast.error(error.message || 'Erro ao formatar');
      // Mesmo com erro, permitir abrir o reader
      setEtapa('concluido');
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetar = () => {
    setEtapa('url');
    setUrl("");
    setProgresso(0);
    setPaginasProcessadas(0);
    setTotalPaginas(0);
    setPaginasFormatadas(0);
    setCapitulosDetectados(0);
    setCapituloAtual(0);
    setTotalCapitulos(0);
    setPercentualPreservado(0);
    setCapitulosRevisados(0);
    setErro(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Configurar Leitura Dinâmica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            <strong>{tituloLivro}</strong>
          </p>

          {etapa === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link do Google Drive
                </label>
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  O PDF deve estar configurado como "Qualquer pessoa com o link pode visualizar"
                </p>
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {erro}
                </div>
              )}

              <Button 
                onClick={extrairTexto} 
                disabled={!url.trim() || isProcessing}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Processar Livro
              </Button>
            </div>
          )}

          {etapa === 'extraindo' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                </div>
              </div>
              <div>
                <p className="font-medium">Extraindo texto com Mistral OCR...</p>
                <p className="text-sm text-muted-foreground">
                  {progresso > 50 
                    ? 'Quase lá! Finalizando extração...'
                    : 'OCR de alta precisão (pode levar até 60s)'
                  }
                </p>
              </div>
              <Progress value={progresso} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Processamento em lote único
                </span>
                <span className="font-medium text-purple-400">
                  {Math.round(progresso)}%
                </span>
              </div>
            </div>
          )}

          {etapa === 'analisando' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <BookOpen className="w-12 h-12 animate-pulse text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Analisando estrutura do livro...</p>
                <p className="text-sm text-muted-foreground">
                  Identificando capítulos e removendo páginas desnecessárias
                </p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {etapa === 'formatando' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Sparkles className="w-12 h-12 animate-pulse text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Formatando por capítulo...</p>
                <p className="text-sm text-muted-foreground">
                  {totalCapitulos > 0 
                    ? `Processando capítulo ${capituloAtual || 1} de ${totalCapitulos}`
                    : capitulosDetectados > 0 
                      ? `${capitulosDetectados} capítulos detectados`
                      : 'Preparando formatação...'
                  }
                </p>
              </div>
              <Progress value={totalCapitulos > 0 ? (capituloAtual / totalCapitulos) * 100 : progresso} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Formatação por capítulo garante parágrafos completos
              </p>
            </div>
          )}

          {etapa === 'revisando' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <CheckCircle2 className="w-12 h-12 text-green-500 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-medium">🔍 Revisando integridade do conteúdo...</p>
                <p className="text-sm text-muted-foreground">
                  {percentualPreservado > 0 
                    ? `${percentualPreservado}% do texto preservado`
                    : 'Comparando original x formatado'
                  }
                </p>
              </div>
              {capitulosRevisados > 0 && (
                <p className="text-xs text-amber-500">
                  ⚡ {capitulosRevisados} capítulo(s) reformatado(s) automaticamente
                </p>
              )}
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {etapa === 'concluido' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-lg">Tudo pronto!</p>
                <p className="text-sm text-muted-foreground">
                  {paginasFormatadas > 0 
                    ? `${paginasFormatadas} páginas formatadas`
                    : 'Abrindo leitura dinâmica...'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeituraDinamicaSetup;
