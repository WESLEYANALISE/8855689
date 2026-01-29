import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, Briefcase, Volume2, VolumeX, Play, Check, FileText, Image, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArtigoCarreira {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  pdf_url: string | null;
  texto_ocr: string | null;
  conteudo_gerado: string | null;
  url_capa: string | null;
  url_audio: string | null;
  topicos: string[] | null;
}

interface OabCarreiraArtigoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo: ArtigoCarreira;
}

type EtapaProcessamento = 'idle' | 'ocr' | 'artigo' | 'capa' | 'narracao' | 'concluido';

interface StatusEtapa {
  ocr: 'pendente' | 'processando' | 'concluido' | 'erro';
  artigo: 'pendente' | 'processando' | 'concluido' | 'erro';
  capa: 'pendente' | 'processando' | 'concluido' | 'erro';
  narracao: 'pendente' | 'processando' | 'concluido' | 'erro';
}

export const OabCarreiraArtigoModal = ({ 
  open, 
  onOpenChange, 
  artigo: artigoInicial 
}: OabCarreiraArtigoModalProps) => {
  const [artigo, setArtigo] = useState<ArtigoCarreira>(artigoInicial);
  const [conteudo, setConteudo] = useState<string | null>(artigoInicial.conteudo_gerado);
  const [processando, setProcessando] = useState(false);
  const [gerandoNarracao, setGerandoNarracao] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<EtapaProcessamento>('idle');
  const [statusEtapas, setStatusEtapas] = useState<StatusEtapa>({
    ocr: artigoInicial.texto_ocr ? 'concluido' : 'pendente',
    artigo: artigoInicial.conteudo_gerado ? 'concluido' : 'pendente',
    capa: artigoInicial.url_capa ? 'concluido' : 'pendente',
    narracao: artigoInicial.url_audio ? 'concluido' : 'pendente',
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Atualizar estado quando artigo inicial mudar
  useEffect(() => {
    setArtigo(artigoInicial);
    setConteudo(artigoInicial.conteudo_gerado);
    setStatusEtapas({
      ocr: artigoInicial.texto_ocr ? 'concluido' : 'pendente',
      artigo: artigoInicial.conteudo_gerado ? 'concluido' : 'pendente',
      capa: artigoInicial.url_capa ? 'concluido' : 'pendente',
      narracao: artigoInicial.url_audio ? 'concluido' : 'pendente',
    });
  }, [artigoInicial]);

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const processarCompleto = async () => {
    setProcessando(true);
    
    try {
      // Etapa 1: OCR (se necessário)
      if (!artigo.texto_ocr) {
        setEtapaAtual('ocr');
        setStatusEtapas(prev => ({ ...prev, ocr: 'processando' }));
        
        const urlRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,})\/(view|preview)/;
        const urlValida = artigo.pdf_url && urlRegex.test(artigo.pdf_url);
        
        let pdfUrlFinal = artigo.pdf_url;
        
        if (!urlValida) {
          const pdfUrl = prompt(
            `A URL do PDF para "${artigo.titulo}" está inválida.\n\n` +
            `Por favor, copie a URL de compartilhamento do arquivo PDF no Google Drive.\n\n` +
            `Formato esperado:\nhttps://drive.google.com/file/d/ARQUIVO_ID/view`
          );
          
          if (!pdfUrl) {
            setStatusEtapas(prev => ({ ...prev, ocr: 'erro' }));
            toast.error("URL do PDF é obrigatória");
            setProcessando(false);
            return;
          }
          
          pdfUrlFinal = pdfUrl;
        }
        
        const { data: ocrData, error: ocrError } = await supabase.functions.invoke('processar-pdf-carreira-oab', {
          body: { ordem: artigo.ordem, pdfUrl: pdfUrlFinal }
        });

        if (ocrError || !ocrData?.success) {
          setStatusEtapas(prev => ({ ...prev, ocr: 'erro' }));
          throw new Error(ocrData?.error || 'Erro no OCR');
        }
        
        setStatusEtapas(prev => ({ ...prev, ocr: 'concluido' }));
        setArtigo(prev => ({ ...prev, texto_ocr: 'processado' }));
      } else {
        setStatusEtapas(prev => ({ ...prev, ocr: 'concluido' }));
      }

      // Etapa 2: Gerar Artigo
      setEtapaAtual('artigo');
      setStatusEtapas(prev => ({ ...prev, artigo: 'processando' }));
      
      const { data: artigoData, error: artigoError } = await supabase.functions.invoke('gerar-artigo-carreira-oab', {
        body: { ordem: artigo.ordem }
      });

      if (artigoError || !artigoData?.success) {
        setStatusEtapas(prev => ({ ...prev, artigo: 'erro' }));
        throw new Error(artigoData?.error || 'Erro ao gerar artigo');
      }
      
      setConteudo(artigoData.conteudo);
      setStatusEtapas(prev => ({ ...prev, artigo: 'concluido' }));
      setArtigo(prev => ({ ...prev, conteudo_gerado: artigoData.conteudo }));

      // Etapa 3: Gerar Capa
      if (!artigo.url_capa) {
        setEtapaAtual('capa');
        setStatusEtapas(prev => ({ ...prev, capa: 'processando' }));
        
        const { data: capaData, error: capaError } = await supabase.functions.invoke('gerar-capa-carreira-oab', {
          body: { ordem: artigo.ordem, titulo: artigo.titulo }
        });

        if (capaError || !capaData?.imagem_url) {
          setStatusEtapas(prev => ({ ...prev, capa: 'erro' }));
          console.error('Erro ao gerar capa:', capaError);
        } else {
          setStatusEtapas(prev => ({ ...prev, capa: 'concluido' }));
          setArtigo(prev => ({ ...prev, url_capa: capaData.imagem_url }));
        }
      } else {
        setStatusEtapas(prev => ({ ...prev, capa: 'concluido' }));
      }

      setEtapaAtual('concluido');
      toast.success("Processamento concluído!");

    } catch (error) {
      console.error('Erro no processamento:', error);
      toast.error("Erro no processamento", {
        description: error instanceof Error ? error.message : "Tente novamente"
      });
    } finally {
      setProcessando(false);
    }
  };

  const gerarNarracao = async () => {
    setGerandoNarracao(true);
    setStatusEtapas(prev => ({ ...prev, narracao: 'processando' }));
    
    try {
      toast.info("Gerando narração...", {
        description: "Isso pode levar alguns segundos"
      });

      const { data: narracaoData, error: narracaoError } = await supabase.functions.invoke('gerar-narracao-carreira-oab', {
        body: { ordem: artigo.ordem }
      });

      if (narracaoError || !narracaoData?.url_audio) {
        setStatusEtapas(prev => ({ ...prev, narracao: 'erro' }));
        throw new Error(narracaoData?.error || 'Erro ao gerar narração');
      }

      setStatusEtapas(prev => ({ ...prev, narracao: 'concluido' }));
      setArtigo(prev => ({ ...prev, url_audio: narracaoData.url_audio }));
      
      toast.success("Narração gerada com sucesso!", {
        description: narracaoData.partes > 1 ? `Gerado em ${narracaoData.partes} partes` : undefined
      });

    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      toast.error("Erro ao gerar narração", {
        description: error instanceof Error ? error.message : "Tente novamente"
      });
    } finally {
      setGerandoNarracao(false);
    }
  };

  const toggleAudio = () => {
    if (!artigo.url_audio) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(artigo.url_audio);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const renderEtapaIcon = (status: 'pendente' | 'processando' | 'concluido' | 'erro') => {
    switch (status) {
      case 'processando':
        return <Loader2 className="w-4 h-4 animate-spin text-amber-500" />;
      case 'concluido':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'erro':
        return <span className="text-red-500 text-xs">✕</span>;
      default:
        return <span className="w-4 h-4 rounded-full border border-muted-foreground/30" />;
    }
  };

  if (!open) return null;

  const precisaProcessar = !artigo.texto_ocr || !conteudo;

  return (
    <div className="fixed inset-0 bg-neutral-900 z-[100] flex flex-col">
      {/* Header fixo */}
      <div className="shrink-0 bg-neutral-900 border-b border-white/10 px-4 pt-3 pb-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10 rounded-full bg-black hover:bg-neutral-800 shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {artigo.titulo}
          </h2>
          <p className="text-muted-foreground text-xs">Aula {artigo.ordem}</p>
        </div>
        {artigo.url_audio && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className="h-10 w-10 rounded-full bg-black hover:bg-neutral-800 shrink-0"
          >
            {isPlaying ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </Button>
        )}
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-safe">
        {/* Capa do artigo */}
        {artigo.url_capa && (
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={artigo.url_capa}
              alt={artigo.titulo}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Título */}
        <div className="flex items-start gap-3">
          <div className="bg-amber-900/30 rounded-xl p-2.5 shadow-lg">
            <Briefcase className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {artigo.titulo}
            </h1>
            <p className="text-amber-400/70 text-sm mt-1">Aula {artigo.ordem} • Carreira do Advogado</p>
          </div>
        </div>

        {/* Botão de Narração (quando tem conteúdo mas não tem áudio) */}
        {conteudo && !artigo.url_audio && !gerandoNarracao && (
          <div className="bg-amber-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-amber-600/20 rounded-full p-2">
              <Music className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Narração em áudio</p>
              <p className="text-xs text-muted-foreground">Ouça a aula enquanto faz outras coisas</p>
            </div>
            <Button
              onClick={gerarNarracao}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              Gerar
            </Button>
          </div>
        )}

        {/* Loading de narração */}
        {gerandoNarracao && (
          <div className="bg-amber-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-amber-600/20 rounded-full p-2">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Gerando narração...</p>
              <p className="text-xs text-muted-foreground">Textos longos são divididos em partes</p>
            </div>
          </div>
        )}

        {/* Estado sem conteúdo - Botão de Processar */}
        {precisaProcessar && !processando && (
          <div className="text-center py-8 space-y-4">
            <div className="bg-amber-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-amber-500/60" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Conteúdo em preparação</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Clique para processar o PDF e gerar a aula completa.
              </p>
              <Button
                onClick={processarCompleto}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                <Play className="w-4 h-4" />
                Processar Conteúdo
              </Button>
            </div>
          </div>
        )}

        {/* Indicador de progresso durante processamento */}
        {processando && (
          <div className="bg-neutral-800/50 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-center mb-4">
              Processando Aula...
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {renderEtapaIcon(statusEtapas.ocr)}
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${statusEtapas.ocr === 'processando' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  Extraindo texto do PDF (OCR)
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {renderEtapaIcon(statusEtapas.artigo)}
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${statusEtapas.artigo === 'processando' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  Gerando explicação com IA
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {renderEtapaIcon(statusEtapas.capa)}
                <Image className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${statusEtapas.capa === 'processando' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  Gerando capa ilustrativa
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do artigo */}
        {!processando && conteudo && (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-amber-300 mt-6 mb-3 border-b border-amber-500/20 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-foreground mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="text-muted-foreground space-y-1.5 my-3 ml-4 list-disc">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-muted-foreground space-y-1.5 my-3 ml-4 list-decimal">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-muted-foreground">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="text-foreground font-semibold">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-amber-500/50 pl-4 my-4 italic text-muted-foreground bg-amber-500/5 py-2 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded text-sm">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 -mx-4 px-4">
                    <table className="min-w-full border-collapse text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-amber-900/30 text-amber-300">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-white/10">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-white/5">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-muted-foreground">
                    {children}
                  </td>
                ),
              }}
            >
              {conteudo}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default OabCarreiraArtigoModal;
