import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileDown, Sparkles, Search, ChevronRight, ArrowUp, Loader2, Scale, ImageIcon, BookOpen } from "lucide-react";

import { AudioPlayer } from "@/components/resumos/AudioPlayer";
import { ImageWithZoom } from "@/components/resumos/ImageWithZoom";
import { CachedImage } from "@/components/ui/cached-image";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceType } from "@/hooks/use-device-type";
import { useImagePreload } from "@/hooks/useImagePreload";
interface Resumo {
  id: number;
  subtema: string;
  conteudo: string;
  conteudo_gerado?: {
    markdown?: string;
    exemplos?: string;
    termos?: string;
    gerado_em?: string;
  };
  "ordem subtema": string;
  url_audio_resumo?: string | null;
  url_audio_exemplos?: string | null;
  url_audio_termos?: string | null;
  url_imagem_resumo?: string | null;
  url_imagem_exemplo_1?: string | null;
  url_imagem_exemplo_2?: string | null;
  url_imagem_exemplo_3?: string | null;
  url_pdf?: string | null;
}
const ResumosProntosView = () => {
  const {
    area,
    tema
  } = useParams<{
    area: string;
    tema: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const {
    isDesktop
  } = useDeviceType();
  const [searchTerm, setSearchTerm] = useState("");
  const [resumoSelecionado, setResumoSelecionado] = useState<Resumo | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [resumosGerados, setResumosGerados] = useState<Map<number, any>>(new Map());
  const [gerandoResumoIds, setGerandoResumoIds] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [autoGeracaoIniciada, setAutoGeracaoIniciada] = useState(false);

  // Estados de áudio
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Estados de imagem
  const [imagemUrls, setImagemUrls] = useState<Map<string, string>>(new Map());
  const [loadingImagem, setLoadingImagem] = useState<Record<string, boolean>>({});
  const [gerandoTudo, setGerandoTudo] = useState(false);

  // Preload imagens do resumo selecionado
  const imagensParaPreload = useMemo(() => {
    if (!resumoSelecionado) return [];
    const id = resumoSelecionado.id;
    return [imagemUrls.get(`${id}-resumo`), imagemUrls.get(`${id}-exemplo1`), imagemUrls.get(`${id}-exemplo2`), imagemUrls.get(`${id}-exemplo3`)].filter(Boolean) as string[];
  }, [resumoSelecionado?.id, imagemUrls]);
  useImagePreload(imagensParaPreload);

  // Refs de áudio
  const audioResumoRef = useRef<HTMLAudioElement | null>(null);
  const audioExemplosRef = useRef<HTMLAudioElement | null>(null);
  const audioTermosRef = useRef<HTMLAudioElement | null>(null);
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gerenciar navegação de volta - quando subtema está selecionado no mobile
  const historyPushedRef = useRef(false);
  
  useEffect(() => {
    const handlePopState = () => {
      if (showMobilePreview && resumoSelecionado) {
        setShowMobilePreview(false);
        setResumoSelecionado(null);
        historyPushedRef.current = false;
      }
    };

    if (isMobile && showMobilePreview && resumoSelecionado && !historyPushedRef.current) {
      // Adicionar estado no histórico quando subtema é selecionado
      window.history.pushState({ subtemaView: true, resumoId: resumoSelecionado.id }, '');
      historyPushedRef.current = true;
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobile, showMobilePreview, resumoSelecionado]);

  useEffect(() => {
    const handleSelectResumo = (e: CustomEvent) => {
      const resumo = e.detail;
      setResumoSelecionado(resumo);
      if (!resumosGerados.has(resumo.id) && !gerandoResumoIds.has(resumo.id)) {
        gerarResumo(resumo);
      }
    };
    window.addEventListener('selectResumo' as any, handleSelectResumo);
    return () => window.removeEventListener('selectResumo' as any, handleSelectResumo);
  }, [resumosGerados, gerandoResumoIds]);

  // Registrar acesso ao resumo para métricas de "Em Alta"
  useEffect(() => {
    if (resumoSelecionado?.id) {
      const sessionId = sessionStorage.getItem('session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }
      
      supabase
        .from('resumos_acessos')
        .insert({ 
          resumo_id: resumoSelecionado.id,
          session_id: sessionId
        })
        .then(() => {});
    }
  }, [resumoSelecionado?.id]);
  const {
    data: resumos,
    isLoading
  } = useQuery({
    queryKey: ["resumos-subtemas", decodedArea, decodedTema],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("RESUMO").select("*").eq("area", decodedArea).eq("tema", decodedTema).not("subtema", "is", null).order("ordem subtema", {
        ascending: true
      });
      if (error) throw error;
      const gerados = new Map<number, any>();
      const urls = new Map<string, string>();
      const imgUrls = new Map<string, string>();
      
      // Encontrar primeiro resumo sem conteúdo gerado para gerar automaticamente
      let primeiroSemConteudo: Resumo | null = null;
      
      data.forEach((resumo: any) => {
        if (resumo.conteudo_gerado) {
          gerados.set(resumo.id, resumo.conteudo_gerado);
        } else if (!primeiroSemConteudo) {
          primeiroSemConteudo = resumo as Resumo;
        }
        // Carregar URLs de áudio existentes
        if (resumo.url_audio_resumo) {
          urls.set(`${resumo.id}-resumo`, resumo.url_audio_resumo);
        }
        if (resumo.url_audio_exemplos) {
          urls.set(`${resumo.id}-exemplos`, resumo.url_audio_exemplos);
        }
        if (resumo.url_audio_termos) {
          urls.set(`${resumo.id}-termos`, resumo.url_audio_termos);
        }
        // Carregar URLs de imagens existentes
        if (resumo.url_imagem_resumo) {
          imgUrls.set(`${resumo.id}-resumo`, resumo.url_imagem_resumo);
        }
        if (resumo.url_imagem_exemplo_1) {
          imgUrls.set(`${resumo.id}-exemplo1`, resumo.url_imagem_exemplo_1);
        }
        if (resumo.url_imagem_exemplo_2) {
          imgUrls.set(`${resumo.id}-exemplo2`, resumo.url_imagem_exemplo_2);
        }
        if (resumo.url_imagem_exemplo_3) {
          imgUrls.set(`${resumo.id}-exemplo3`, resumo.url_imagem_exemplo_3);
        }
      });
      
      setResumosGerados(gerados);
      setAudioUrls(urls);
      setImagemUrls(imgUrls);
      
      if (data.length > 0 && !resumoSelecionado) {
        // Selecionar o primeiro
        const primeiro = data[0] as Resumo;
        setResumoSelecionado(primeiro);
      }
      return data as Resumo[];
    }
  });
  const resumosFiltrados = useMemo(() => {
    if (!resumos) return [];
    return resumos.filter(resumo => resumo.subtema.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
      const ordemA = parseFloat(a["ordem subtema"] || "0");
      const ordemB = parseFloat(b["ordem subtema"] || "0");
      return ordemA - ordemB;
    });
  }, [resumos, searchTerm]);
  // Função para gerar um resumo individualmente
  const gerarResumoIndividual = async (resumo: Resumo): Promise<boolean> => {
    setGerandoResumoIds(prev => new Set(prev).add(resumo.id));
    try {
      const { data, error } = await supabase.functions.invoke("gerar-resumo-pronto", {
        body: {
          resumoId: resumo.id,
          area: decodedArea,
          tema: decodedTema,
          subtema: resumo.subtema,
          conteudo: resumo.conteudo
        }
      });
      if (error) throw error;
      setResumosGerados(prev => new Map(prev).set(resumo.id, {
        markdown: data.resumo,
        exemplos: data.exemplos,
        termos: data.termos
      }));
      return true;
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      return false;
    } finally {
      setGerandoResumoIds(prev => {
        const next = new Set(prev);
        next.delete(resumo.id);
        return next;
      });
    }
  };

  // Geração automática em lote (5 por vez)
  const gerarResumosEmLote = async (resumosParaGerar: Resumo[]) => {
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < resumosParaGerar.length; i += BATCH_SIZE) {
      const batch = resumosParaGerar.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(resumo => gerarResumoIndividual(resumo)));
    }
  };

  // Auto-geração quando entrar na página
  useEffect(() => {
    if (!resumos || resumos.length === 0 || autoGeracaoIniciada) return;
    
    const resumosSemGeracao = resumos.filter(r => !resumosGerados.has(r.id));
    if (resumosSemGeracao.length === 0) return;
    
    setAutoGeracaoIniciada(true);
    
    // Selecionar o primeiro resumo
    if (!resumoSelecionado && resumos.length > 0) {
      setResumoSelecionado(resumos[0]);
    }
    
    // Iniciar geração automática
    gerarResumosEmLote(resumosSemGeracao);
  }, [resumos, resumosGerados, autoGeracaoIniciada]);

  const gerarResumo = async (resumo: Resumo) => {
    if (gerandoResumoIds.has(resumo.id)) return;
    
    setGerandoResumoIds(prev => new Set(prev).add(resumo.id));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("gerar-resumo-pronto", {
        body: {
          resumoId: resumo.id,
          area: decodedArea,
          tema: decodedTema,
          subtema: resumo.subtema,
          conteudo: resumo.conteudo
        }
      });
      if (error) throw error;
      setResumosGerados(prev => new Map(prev).set(resumo.id, {
        markdown: data.resumo,
        exemplos: data.exemplos,
        termos: data.termos
      }));
      toast({
        title: data.fromCache ? "Resumo carregado!" : "Resumo gerado!",
        description: data.fromCache ? "Resumo carregado do cache" : "Resumo estruturado gerado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setGerandoResumoIds(prev => {
        const next = new Set(prev);
        next.delete(resumo.id);
        return next;
      });
    }
  };
  // ÁUDIO DESATIVADO - Função de geração de áudio removida temporariamente
  const gerarAudioResumo = async (tipo: 'resumo' | 'exemplos' | 'termos') => {
    console.log('🔇 Geração de áudio desativada temporariamente');
    return;
  };
  const stopAllAudios = () => {
    [audioResumoRef, audioExemplosRef, audioTermosRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setPlayingAudio(null);
  };
  const toggleAudio = (tipo: 'resumo' | 'exemplos' | 'termos') => {
    if (!resumoSelecionado) return;
    const audioKey = `${resumoSelecionado.id}-${tipo}`;
    const audioUrl = audioUrls.get(audioKey);
    if (!audioUrl) {
      gerarAudioResumo(tipo);
      return;
    }
    const refMap = {
      resumo: audioResumoRef,
      exemplos: audioExemplosRef,
      termos: audioTermosRef
    };
    const audioRef = refMap[tipo];
    if (playingAudio === tipo) {
      // Pausar
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudio(null);
    } else {
      // Parar outros e tocar este
      stopAllAudios();
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(tipo);
      }
    }
  };
  const handleAudioEnded = () => {
    setPlayingAudio(null);
  };
  const exportarPDF = async (resumo: Resumo) => {
    const resumoGerado = resumosGerados.get(resumo.id);
    if (!resumoGerado?.markdown) {
      toast({
        title: "Gere o resumo primeiro",
        description: "Aguarde a geração antes de exportar",
        variant: "destructive"
      });
      return;
    }

    // Verificar se já existe PDF em cache
    if (resumo.url_pdf) {
      window.open(resumo.url_pdf, '_blank');
      toast({
        title: "PDF aberto!",
        description: "Recuperado do cache."
      });
      return;
    }
    toast({
      title: "Gerando PDF...",
      description: "Aguarde, estamos criando o PDF profissional"
    });
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("exportar-resumo-pdf", {
        body: {
          resumo: resumoGerado.markdown,
          titulo: resumo.subtema,
          resumoId: resumo.id,
          area: area ? decodeURIComponent(area) : undefined,
          tema: tema ? decodeURIComponent(tema) : undefined,
          urlAudio: resumo.url_audio_resumo || audioUrls.get(`${resumo.id}-resumo`)
        }
      });
      if (error) throw error;
      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast({
          title: data.fromCache ? "PDF recuperado!" : "PDF gerado!",
          description: data.fromCache ? "Recuperado do cache." : "O PDF foi aberto em uma nova aba."
        });
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };
  const compartilharWhatsApp = (resumo: Resumo) => {
    const resumoGerado = resumosGerados.get(resumo.id);
    if (!resumoGerado?.markdown) {
      toast({
        title: "Gere o resumo primeiro",
        description: "Clique para gerar antes de compartilhar",
        variant: "destructive"
      });
      return;
    }
    const textoFormatado = formatForWhatsApp(resumoGerado.markdown);
    const cabecalho = `╔═══════════════════╗
📚 *RESUMO JURÍDICO*
╚═══════════════════╝

🎯 *Área:* ${decodedArea}
📖 *Tema:* ${decodedTema}
📝 *Subtema:* ${resumo.subtema}

━━━━━━━━━━━━━━━━━━━━`;
    const rodape = `━━━━━━━━━━━━━━━━━━━━

✨ _Gerado pelo Direito Premium_
📱 _Seu app de estudos jurídicos_`;
    const mensagem = `${cabecalho}\n\n${textoFormatado}\n\n${rodape}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
    toast({
      title: "Abrindo WhatsApp",
      description: "Resumo formatado com emojis e pronto para compartilhar!"
    });
  };
  const gerarImagem = async (tipo: 'resumo' | 'exemplo1' | 'exemplo2' | 'exemplo3') => {
    if (!resumoSelecionado) return;
    const resumoGerado = resumosGerados.get(resumoSelecionado.id);
    if (!resumoGerado) return;
    const imagemKey = `${resumoSelecionado.id}-${tipo}`;

    // Se já tem URL, não fazer nada
    if (imagemUrls.has(imagemKey)) return;

    // Se não tem imagem, gerar tudo de uma vez
    gerarTudoDeUmaVez();
  };

  // Função para gerar todas as imagens e áudios de uma vez
  const gerarTudoDeUmaVez = async () => {
    if (!resumoSelecionado) return;
    const resumoGerado = resumosGerados.get(resumoSelecionado.id);
    if (!resumoGerado) {
      toast({
        title: "Aguarde",
        description: "Primeiro aguarde a geração do conteúdo",
        variant: "destructive"
      });
      return;
    }
    setGerandoTudo(true);
    toast({
      title: "Gerando conteúdo...",
      description: "Gerando todas as imagens e áudios. Isso pode levar alguns segundos."
    });
    const promises: Promise<void>[] = [];

    // Gerar imagens (resumo + 3 exemplos)
    const tiposImagem: ('resumo' | 'exemplo1' | 'exemplo2' | 'exemplo3')[] = ['resumo', 'exemplo1', 'exemplo2', 'exemplo3'];
    for (const tipo of tiposImagem) {
      const imagemKey = `${resumoSelecionado.id}-${tipo}`;
      if (!imagemUrls.has(imagemKey)) {
        promises.push(gerarImagemAsync(tipo));
      }
    }

    // Áudios desativados temporariamente - geração apenas de imagens
    try {
      await Promise.all(promises);
      toast({
        title: "Tudo gerado!",
        description: "Todas as imagens e áudios foram gerados com sucesso."
      });
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      toast({
        title: "Parcialmente gerado",
        description: "Alguns itens podem não ter sido gerados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setGerandoTudo(false);
    }
  };

  // Versão async da geração de imagem para usar em paralelo
  const gerarImagemAsync = async (tipo: 'resumo' | 'exemplo1' | 'exemplo2' | 'exemplo3'): Promise<void> => {
    if (!resumoSelecionado) return;
    const resumoGerado = resumosGerados.get(resumoSelecionado.id);
    if (!resumoGerado) return;
    let conteudo = '';
    if (tipo === 'resumo') {
      conteudo = resumoGerado.markdown || resumoSelecionado.conteudo;
    } else {
      const exemplosText = resumoGerado.exemplos || '';
      const exemplos = exemplosText.split(/##\s*Exemplo\s*\d+/i).filter(Boolean);
      const idx = parseInt(tipo.replace('exemplo', '')) - 1;
      conteudo = exemplos[idx] || exemplosText;
    }
    if (!conteudo) return;
    setLoadingImagem(prev => ({
      ...prev,
      [tipo]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gerar-imagem-resumo', {
        body: {
          resumoId: resumoSelecionado.id,
          tipo,
          conteudo: conteudo.substring(0, 500),
          area: decodedArea,
          tema: decodedTema
        }
      });
      if (error) throw error;
      if (data?.url_imagem) {
        setImagemUrls(prev => new Map(prev).set(`${resumoSelecionado.id}-${tipo}`, data.url_imagem));
      }
    } finally {
      setLoadingImagem(prev => ({
        ...prev,
        [tipo]: false
      }));
    }
  };

  // ÁUDIO DESATIVADO - Função de geração de áudio removida temporariamente  
  const gerarAudioAsync = async (tipo: 'resumo' | 'exemplos' | 'termos'): Promise<void> => {
    console.log('🔇 Geração de áudio desativada temporariamente');
    return;
  };
  // 🔇 AUDIO/IMAGE DISABLED - Renderizar conteúdo SEM imagem (temporariamente)
  const renderImagemComPlayer = (tipo: 'resumo' | 'exemplos' | 'termos') => {
    // Imagem desativada temporariamente - retorna null
    return null;
  };
  // 🔇 AUDIO/IMAGE DISABLED - Renderizar exemplos SEM imagens (temporariamente)
  const renderExemplosComImagens = () => {
    if (!resumoSelecionado) return null;
    const resumoGerado = resumosGerados.get(resumoSelecionado.id);
    const exemplosText = resumoGerado?.exemplos || '';

    // Split by ## Exemplo headers
    const partes = exemplosText.split(/(?=##\s*Exemplo\s*\d+)/i).filter(Boolean);

    return <div className="space-y-6">
        {partes.map((parte, index) => {
        const exemploNum = index + 1;
        if (exemploNum > 3) return null;
        return <div key={exemploNum} className="space-y-3">
              {/* Texto do exemplo - IMAGEM DESATIVADA */}
              <div className="resumo-content resumo-markdown">
                <ReactMarkdown>{parte}</ReactMarkdown>
              </div>
            </div>;
      })}
      </div>;
  };

  if (isLoading) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>;
  }
  if (!resumos || resumos.length === 0) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
        <p className="text-center text-muted-foreground">
          Nenhum resumo encontrado para este tema
        </p>
      </div>;
  }

  // Mobile preview
  if (isMobile && showMobilePreview && resumoSelecionado) {
    return <div className="flex flex-col min-h-screen pb-20">
        {/* Hidden audio elements */}
        <audio ref={audioResumoRef} onEnded={handleAudioEnded} />
        <audio ref={audioExemplosRef} onEnded={handleAudioEnded} />
        <audio ref={audioTermosRef} onEnded={handleAudioEnded} />


        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-3 py-4">

            <div className="mb-4">
              {/* Breadcrumb com rota completa */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 flex-wrap">
                <span>{decodedArea}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{decodedTema}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{resumoSelecionado.subtema}</span>
              </div>
            </div>

            {resumosGerados.has(resumoSelecionado.id) && <div className="flex gap-2">
                <Button onClick={() => exportarPDF(resumoSelecionado)} variant="outline" className="flex-1" size="sm">
                  <FileDown className="w-4 h-4 mr-2 text-red-500" />
                  PDF
                </Button>
                <Button onClick={() => compartilharWhatsApp(resumoSelecionado)} variant="outline" className="flex-1" size="sm">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>
              </div>}
          </div>
        </div>

        <div className="p-4">
          {!resumosGerados.has(resumoSelecionado.id) ? <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-primary/10">
                    <span className="text-4xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{resumoSelecionado.subtema}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gerando resumo completo com IA...
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                      <span className="text-sm font-medium">Aguarde</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> : <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="exemplos">Exemplos</TabsTrigger>
                <TabsTrigger value="termos">Termos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resumo">
                <Card>
                  <CardContent className="p-4">
                    {renderImagemComPlayer('resumo')}
                    <div className="resumo-content resumo-markdown">
                      <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.markdown}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="exemplos">
                <Card>
                  <CardContent className="p-4">
                    {renderExemplosComImagens()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="termos">
                <Card>
                  <CardContent className="p-4">
                    <div className="resumo-content resumo-markdown">
                      <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.termos || "Gerando termos..."}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>}
        </div>
      </div>;
  }

  // Desktop/Tablet view (and mobile list view)
  return <div className="min-h-screen pb-20">
      {/* Hidden audio elements */}
      <audio ref={audioResumoRef} onEnded={handleAudioEnded} />
      <audio ref={audioExemplosRef} onEnded={handleAudioEnded} />
      <audio ref={audioTermosRef} onEnded={handleAudioEnded} />

      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-4 max-w-7xl mx-auto">
          <div className="mb-4">
            {/* Breadcrumb com rota */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 flex-wrap">
              <span>{decodedArea}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{decodedTema}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">{decodedTema}</h1>
          </div>

          {!isMobile && resumoSelecionado && resumosGerados.has(resumoSelecionado.id) && <div className="flex gap-2 mb-4">
              <Button onClick={() => exportarPDF(resumoSelecionado)} variant="outline" className="flex-1">
                <FileDown className="w-4 h-4 mr-2 text-red-500" />
                PDF
              </Button>
              <Button onClick={() => compartilharWhatsApp(resumoSelecionado)} variant="outline" className="flex-1">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
            </div>}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar subtema..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {!isDesktop && <div className={isMobile ? "w-full px-4 py-4" : "w-80 border-r px-3 py-4"}>
            {/* Label Conteúdo */}
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Conteúdo Programático</span>
            </div>
            
            {/* Lista no estilo OAB Trilhas */}
            <div className="space-y-2">
              {resumosFiltrados.map((resumo, index) => (
                <button
                  key={resumo.id}
                  onClick={() => {
                    setResumoSelecionado(resumo);
                    if (!resumosGerados.has(resumo.id) && !gerandoResumoIds.has(resumo.id)) {
                      gerarResumo(resumo);
                    }
                    if (isMobile) {
                      setShowMobilePreview(true);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-red-500/30 hover:bg-accent/30 transition-all duration-200 active:scale-[0.98] group ${
                    resumoSelecionado?.id === resumo.id && !isMobile ? "ring-2 ring-red-500 border-red-500/50" : ""
                  }`}
                >
                  {/* Ícone vermelho com badge */}
                  <div className="relative w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6 text-red-500" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md bg-red-600 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-500 transition-colors">
                      {resumo.subtema}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    {gerandoResumoIds.has(resumo.id) ? (
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>}

        {!isMobile && <div className={isDesktop ? "flex-1 p-6" : "flex-1 p-6"}>
            {resumoSelecionado ? !resumosGerados.has(resumoSelecionado.id) ? <Card>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="inline-flex p-4 rounded-full bg-primary/10">
                        <span className="text-4xl">📄</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{resumoSelecionado.subtema}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gerando resumo completo com IA...
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                          <span className="text-sm font-medium">Aguarde</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card> : <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="resumo">Resumo</TabsTrigger>
                    <TabsTrigger value="exemplos">Exemplos Práticos</TabsTrigger>
                    <TabsTrigger value="termos">Termos Chaves</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="resumo">
                    <Card>
                      <CardContent className="p-6">
                        {renderImagemComPlayer('resumo')}
                        <div className="resumo-content">
                          <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.markdown}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="exemplos">
                    <Card>
                      <CardContent className="p-6">
                        {renderExemplosComImagens()}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="termos">
                    <Card>
                      <CardContent className="p-6">
                        {/* 🔇 AUDIO/IMAGE DISABLED - AudioPlayer removido temporariamente */}
                        <div className="resumo-content">
                          <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.termos || "Gerando termos..."}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs> : <div className="text-center text-muted-foreground py-12">
                Selecione um subtema para visualizar
              </div>}
          </div>}
      </div>

      {showScrollTop && <Button className="fixed bottom-24 right-6 rounded-full w-12 h-12 p-0 shadow-lg z-50" onClick={() => window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })}>
          <ArrowUp className="w-5 h-5" />
        </Button>}
    </div>;
};
export default ResumosProntosView;