import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Image, FileText, Volume2, ArrowLeft, ChevronUp, BookOpen, X, ChevronRight, Scale } from 'lucide-react';
import { MultiAudioPlayer } from '@/components/resumos/MultiAudioPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Imagem de fundo do Blog Jurídico (optimized)
import heroBlogJuridico from "@/assets/hero-blog-juridico-opt.webp";

interface Obra {
  titulo: string;
  tituloOriginal?: string;
  ano?: string;
  relevanciaJuridica?: string;
}

interface Artigo {
  id: number;
  categoria: string;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  topicos: string[] | null;
  conteudo_gerado: string | null;
  url_capa: string | null;
  url_audio: string | null;
  termo_wikipedia: string | null;
  fonte: string | null;
  imagem_wikipedia: string | null;
}

type EtapaGeracao = 'idle' | 'texto' | 'capa' | 'audio' | 'concluido';

// Categorias que usam Wikipedia
const CATEGORIAS_WIKIPEDIA = ['curiosidades', 'filosofos', 'iniciando', 'casos', 'historia', 'termos'];

const BloggerJuridicoArtigo = () => {
  const { categoria, ordem } = useParams<{ categoria: string; ordem: string }>();
  const navigate = useNavigate();
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [loading, setLoading] = useState(true);
  const [etapaGeracao, setEtapaGeracao] = useState<EtapaGeracao>('idle');
  const [progressoGeral, setProgressoGeral] = useState(0);
  const [progressoAudio, setProgressoAudio] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingCapa, setIsGeneratingCapa] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(17);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Estados para aba de Obras (apenas para filósofos)
  const [activeTab, setActiveTab] = useState<'artigo' | 'obras'>('artigo');
  const [obras, setObras] = useState<Obra[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [resumoObra, setResumoObra] = useState<string | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  
  // Estados para geração em lote de resumos
  const [isGeneratingAllResumos, setIsGeneratingAllResumos] = useState(false);
  const [resumosGerados, setResumosGerados] = useState<Map<string, string>>(new Map());
  const [resumosProgress, setResumosProgress] = useState({ current: 0, total: 0 });

  // Detectar scroll para mostrar botão de voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aumentarFonte = () => {
    setFontSize(prev => Math.min(prev + 2, 28));
  };

  const diminuirFonte = () => {
    setFontSize(prev => Math.max(prev - 2, 14));
  };

  // Carregar obras do filósofo
  const carregarObras = async () => {
    if (!artigo || categoria !== 'filosofos' || obras.length > 0) return;
    
    const nomeFilosofo = artigo.termo_wikipedia || artigo.titulo.split(' e ')[0].split(':')[0].trim();
    
    // Primeiro: buscar diretamente do cache (instantâneo)
    try {
      const { data: cacheObras } = await supabase
        .from('obras_filosofos_cache')
        .select('obras')
        .eq('filosofo', nomeFilosofo)
        .maybeSingle();
      
      if (cacheObras?.obras) {
        setObras(cacheObras.obras as unknown as Obra[]);
        return; // Cache encontrado, não precisa chamar Edge Function
      }
    } catch (cacheError) {
      console.error('Erro ao verificar cache:', cacheError);
    }
    
    // Se não tem cache, chamar Edge Function com loading
    setLoadingObras(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-obras-filosofo', {
        body: { filosofo: nomeFilosofo }
      });
      
      if (error) throw error;
      if (data?.obras) {
        setObras(data.obras);
      }
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
    } finally {
      setLoadingObras(false);
    }
  };

  // Gerar todos os resumos em paralelo
  const gerarTodosResumos = async (obrasLista: Obra[]) => {
    if (!artigo || obrasLista.length === 0) return;
    
    const nomeFilosofo = artigo.termo_wikipedia || artigo.titulo.split(' e ')[0].split(':')[0].trim();
    
    // Verificar quais obras já têm cache
    const novoResumosMap = new Map<string, string>();
    const obrasParaGerar: Obra[] = [];
    
    // Buscar todos os caches existentes
    try {
      const { data: cachesExistentes } = await supabase
        .from('obras_filosofos_resumos')
        .select('titulo_obra, resumo')
        .eq('filosofo', nomeFilosofo);
      
      if (cachesExistentes) {
        cachesExistentes.forEach(cache => {
          novoResumosMap.set(cache.titulo_obra, cache.resumo);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar caches:', error);
    }
    
    // Identificar obras que precisam gerar
    obrasLista.forEach(obra => {
      if (!novoResumosMap.has(obra.titulo)) {
        obrasParaGerar.push(obra);
      }
    });
    
    setResumosGerados(novoResumosMap);
    
    // Se todas já estão em cache, não precisa gerar
    if (obrasParaGerar.length === 0) {
      setResumosProgress({ current: obrasLista.length, total: obrasLista.length });
      return;
    }
    
    setIsGeneratingAllResumos(true);
    setResumosProgress({ current: novoResumosMap.size, total: obrasLista.length });
    
    // Gerar todos os resumos em paralelo (dispara todos ao mesmo tempo)
    const promessas = obrasParaGerar.map(async (obra) => {
      try {
        const { data, error } = await supabase.functions.invoke('gerar-resumo-obra', {
          body: { 
            filosofo: nomeFilosofo,
            obra: obra.titulo,
            ano: obra.ano
          }
        });
        
        if (!error && data?.resumo) {
          return { titulo: obra.titulo, resumo: data.resumo };
        }
        return null;
      } catch (error) {
        console.error(`Erro ao gerar resumo para ${obra.titulo}:`, error);
        return null;
      }
    });
    
    // Processar resultados conforme forem chegando
    let completados = novoResumosMap.size;
    for (const promessa of promessas) {
      promessa.then((resultado) => {
        if (resultado) {
          novoResumosMap.set(resultado.titulo, resultado.resumo);
          setResumosGerados(new Map(novoResumosMap));
        }
        completados++;
        setResumosProgress({ current: completados, total: obrasLista.length });
        
        // Verificar se terminou
        if (completados >= obrasLista.length) {
          setIsGeneratingAllResumos(false);
        }
      });
    }
    
    // Aguardar todas finalizarem (background continua mesmo se sair)
    Promise.all(promessas).then(() => {
      setIsGeneratingAllResumos(false);
      setResumosProgress({ current: obrasLista.length, total: obrasLista.length });
    });
  };

  // Selecionar obra e mostrar resumo do cache
  const selecionarObra = (obra: Obra) => {
    setSelectedObra(obra);
    const resumoCache = resumosGerados.get(obra.titulo);
    setResumoObra(resumoCache || null);
    
    // Se não tem resumo no Map mas está gerando, aguardar
    if (!resumoCache && isGeneratingAllResumos) {
      setLoadingResumo(true);
    } else {
      setLoadingResumo(false);
    }
  };

  // Atualizar resumo quando o Map for atualizado
  useEffect(() => {
    if (selectedObra && isGeneratingAllResumos) {
      const resumoCache = resumosGerados.get(selectedObra.titulo);
      if (resumoCache) {
        setResumoObra(resumoCache);
        setLoadingResumo(false);
      }
    }
  }, [resumosGerados, selectedObra, isGeneratingAllResumos]);

  // Carregar obras quando mudar para a aba de obras
  useEffect(() => {
    if (activeTab === 'obras' && artigo && categoria === 'filosofos') {
      carregarObras();
    }
  }, [activeTab, artigo, categoria]);

  // Iniciar geração de todos os resumos quando obras forem carregadas
  useEffect(() => {
    if (obras.length > 0 && activeTab === 'obras' && artigo && categoria === 'filosofos') {
      gerarTodosResumos(obras);
    }
  }, [obras, activeTab, artigo, categoria]);

  useEffect(() => {
    if (categoria && ordem) {
      carregarArtigo();
      setActiveTab('artigo');
      setObras([]);
      setSelectedObra(null);
      setResumoObra(null);
    }
  }, [categoria, ordem]);

  // Parse URL de áudio do banco (pode ser string única ou JSON array)
  const parseAudioUrls = (urlAudio: string | null): string[] => {
    if (!urlAudio) return [];
    
    // Tentar parsear como JSON (array de URLs)
    if (urlAudio.startsWith('[')) {
      try {
        const parsed = JSON.parse(urlAudio);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Se falhar, tratar como URL única
      }
    }
    
    // URL única
    return [urlAudio];
  };

  const carregarArtigo = async () => {
    setLoading(true);
    setAudioUrls([]);
    setProgressoAudio('');
    try {
      const { data, error } = await supabase
        .from('BLOGGER_JURIDICO')
        .select('*')
        .eq('categoria', categoria)
        .eq('ordem', parseInt(ordem!))
        .single();

      if (error) throw error;
      setArtigo(data);

      // Se já tem url_audio salva, usar diretamente
      if (data.url_audio) {
        console.log('[BloggerJuridico] Usando URL de áudio existente:', data.url_audio);
        const urls = parseAudioUrls(data.url_audio);
        setAudioUrls(urls);
      }

      // Verificar se precisa gerar conteúdo
      if (!data.conteudo_gerado) {
        await gerarConteudoCompleto(data);
      }
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      console.error('Erro ao carregar o artigo');
    } finally {
      setLoading(false);
    }
  };

  // Converter base64 para URL de áudio
  const base64ToAudioUrl = (base64: string): string => {
    const audioBlob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], {
      type: 'audio/mp3'
    });
    return URL.createObjectURL(audioBlob);
  };

  const gerarConteudoCompleto = async (artigoData: Artigo) => {
    setEtapaGeracao('texto');
    setProgressoGeral(10);
    try {
      const isWikipedia = CATEGORIAS_WIKIPEDIA.includes(artigoData.categoria);
      
      // 1. Gerar texto
      // Gerar texto silenciosamente
      
      const functionName = isWikipedia ? 'gerar-conteudo-blogger-wikipedia' : 'gerar-conteudo-blogger';
      
      const { data: textoData, error: textoError } = await supabase.functions.invoke(functionName, {
        body: {
          categoria: artigoData.categoria,
          ordem: artigoData.ordem,
          titulo: artigoData.titulo,
          topicos: artigoData.topicos,
          termo_wikipedia: artigoData.termo_wikipedia
        }
      });

      if (textoError) throw textoError;
      
      setArtigo(prev => prev ? { 
        ...prev, 
        conteudo_gerado: textoData.conteudo,
        imagem_wikipedia: textoData.imagem_wikipedia || prev.imagem_wikipedia
      } : null);
      
      setProgressoGeral(40);

      // 2. Gerar capa (somente se não veio imagem da Wikipedia)
      if (!textoData.imagem_wikipedia) {
        setEtapaGeracao('capa');
        // Gerar capa silenciosamente
        const { data: capaData, error: capaError } = await supabase.functions.invoke('gerar-capa-blogger', {
          body: {
            categoria: artigoData.categoria,
            ordem: artigoData.ordem,
            titulo: artigoData.titulo
          }
        });

        if (!capaError && capaData?.url_capa) {
          setArtigo(prev => prev ? { ...prev, url_capa: capaData.url_capa } : null);
        }
      } else {
        // Usar imagem da Wikipedia como capa
        setArtigo(prev => prev ? { ...prev, url_capa: textoData.imagem_wikipedia } : null);
      }
      
      setProgressoGeral(100);
      setEtapaGeracao('concluido');
      setProgressoAudio('');
      console.log('Conteúdo gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      console.error('Erro ao gerar conteúdo:', error);
      setEtapaGeracao('idle');
      setProgressoAudio('');
    }
  };

  // Gerar áudio com Google TTS via Edge Function
  const gerarAudioArtigo = async () => {
    if (!artigo?.conteudo_gerado) return;
    
    setIsGeneratingAudio(true);
    setProgressoAudio('Gerando narração...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-narracao', {
        body: {
          texto: artigo.conteudo_gerado,
          categoria: artigo.categoria,
          ordem: artigo.ordem
        }
      });
      
      if (error) throw error;
      
      if (data?.audioUrls) {
        setAudioUrls(data.audioUrls);
        setArtigo(prev => prev ? { 
          ...prev, 
          url_audio: data.audioUrls.length > 1 ? JSON.stringify(data.audioUrls) : data.audioUrls[0] 
        } : null);
      } else if (data?.audioUrl) {
        setAudioUrls([data.audioUrl]);
        setArtigo(prev => prev ? { ...prev, url_audio: data.audioUrl } : null);
      }
      
      console.log('Narração gerada com sucesso');
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
    } finally {
      setIsGeneratingAudio(false);
      setProgressoAudio('');
    }
  };

  const gerarCapaArtigo = async () => {
    if (!artigo) return;
    setIsGeneratingCapa(true);
    try {
      // Gerar capa silenciosamente
      const { data: capaData, error: capaError } = await supabase.functions.invoke('gerar-capa-blogger', {
        body: {
          categoria: artigo.categoria,
          ordem: artigo.ordem,
          titulo: artigo.titulo
        }
      });
      if (capaError) throw capaError;
      if (capaData?.url_capa) {
        setArtigo(prev => prev ? { ...prev, url_capa: capaData.url_capa } : null);
        console.log('Capa gerada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao gerar capa:', error);
      console.error('Erro ao gerar capa:', error);
    } finally {
      setIsGeneratingCapa(false);
    }
  };

  const getCategoriaColor = (cat: string) => {
    const cores: Record<string, string> = {
      advogado: 'from-blue-600 to-blue-800',
      prf: 'from-yellow-600 to-yellow-800',
      pf: 'from-slate-700 to-slate-900',
      juiz: 'from-purple-600 to-purple-800',
      delegado: 'from-red-600 to-red-800',
      curiosidades: 'from-amber-500 to-orange-600',
      filosofos: 'from-indigo-500 to-violet-600',
      iniciando: 'from-emerald-500 to-teal-600',
      casos: 'from-rose-500 to-red-600',
      historia: 'from-stone-500 to-stone-700',
      termos: 'from-cyan-500 to-blue-600'
    };
    return cores[cat] || 'from-blue-600 to-blue-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-foreground font-medium">Carregando...</span>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando artigo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!artigo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Artigo não encontrado</p>
          <Button onClick={() => navigate('/blogger-juridico')} className="bg-orange-600 hover:bg-orange-700">Voltar</Button>
        </div>
      </div>
    );
  }

  // Mostrar botão de gerar capa se url_capa estiver vazio (mesmo se tiver imagem da Wikipedia)
  const imagemCapa = artigo.url_capa;
  const imagemExibida = artigo.url_capa || artigo.imagem_wikipedia;

  return (
    <div className="min-h-screen bg-background">
      {/* Conteúdo principal */}
      <div className="relative z-10">
        {/* Header com botão voltar */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-foreground font-medium truncate">{artigo.titulo}</span>
            </div>
          </div>
        </header>
      {/* Progresso de Geração */}
      {etapaGeracao !== 'idle' && etapaGeracao !== 'concluido' && (
        <div className="container mx-auto px-4 py-4">
          <Card className="bg-card/50 border-border/50 p-4">
            <div className="flex items-center gap-4 mb-3">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              <span className="text-foreground font-medium">
                {etapaGeracao === 'texto' && 'Gerando conteúdo do artigo...'}
                {etapaGeracao === 'capa' && 'Criando imagem de capa...'}
                {etapaGeracao === 'audio' && (progressoAudio || 'Gerando narração...')}
              </span>
            </div>
            <Progress value={progressoGeral} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> Texto
              </span>
              <span className="flex items-center gap-1">
                <Image className="w-3 h-3" /> Capa
              </span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Áudio
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Capa */}
      <div className="container mx-auto px-4 py-4">
        {imagemCapa ? (
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
            <img 
              src={imagemExibida || ''} 
              alt={artigo.titulo} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Esconde a imagem quebrada e mostra gradiente
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add('bg-gradient-to-br', getCategoriaColor(artigo.categoria));
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        ) : (
          <Card 
            className="h-48 md:h-64 rounded-2xl bg-card/50 border-border/50 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-card/70 transition-colors"
            onClick={() => gerarCapaArtigo()}
          >
            {isGeneratingCapa ? (
              <>
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-3" />
                <p className="text-muted-foreground text-sm">Gerando capa...</p>
              </>
            ) : (
              <>
                <Image className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-2">Sem imagem de capa</p>
                <Button variant="outline" size="sm" className="bg-orange-600/20 border-orange-500/50 text-orange-400 hover:bg-orange-600/30">
                  Gerar Capa
                </Button>
              </>
            )}
          </Card>
        )}
      </div>

      {/* Título e Info */}
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {artigo.titulo}
        </h1>
        {artigo.descricao_curta && <p className="text-muted-foreground mb-4">{artigo.descricao_curta}</p>}
        
        {/* Tags */}
        {artigo.topicos && artigo.topicos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {artigo.topicos.map((topico, i) => (
              <span 
                key={i} 
                className={`text-xs px-3 py-1 bg-gradient-to-r ${getCategoriaColor(artigo.categoria)} text-white rounded-full`}
              >
                {topico}
              </span>
            ))}
          </div>
        )}

        {/* Player de Áudio */}
        <div className="mb-4">
          {isGeneratingAudio && progressoAudio && (
            <p className="text-sm text-orange-400 mb-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progressoAudio}
            </p>
          )}
          <MultiAudioPlayer 
            audioUrls={audioUrls} 
            onGenerate={gerarAudioArtigo} 
            isLoading={isGeneratingAudio} 
            label={audioUrls.length > 1 ? `Ouvir narração (${audioUrls.length} partes)` : "Ouvir narração"} 
          />
        </div>

        {/* Tabs de alternância - apenas para filósofos */}
        {categoria === 'filosofos' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setActiveTab('artigo'); setSelectedObra(null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'artigo'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                  : 'bg-card/50 text-muted-foreground hover:bg-card/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              Artigo
            </button>
            <button
              onClick={() => setActiveTab('obras')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'obras'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                  : 'bg-card/50 text-muted-foreground hover:bg-card/70'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Obras
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo baseado na aba selecionada */}
      <div className="container mx-auto pb-12 px-[5px]">
        {activeTab === 'artigo' ? (
          // Conteúdo do Artigo
          artigo.conteudo_gerado ? (
            <Card className="bg-card/30 border-border/30 p-6 md:p-8 px-[16px]">
              <article className="prose prose-invert prose-slate max-w-none" style={{ fontSize: `${fontSize}px` }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4" style={{ fontSize: `${fontSize + 8}px` }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mt-6 mb-3" style={{ fontSize: `${fontSize + 4}px` }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" style={{ fontSize: `${fontSize + 2}px` }}>{children}</h3>,
                    p: ({ children }) => <p className="text-muted-foreground mb-4 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 text-muted-foreground mb-4 space-y-2" style={{ fontSize: `${fontSize}px` }}>{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 text-muted-foreground mb-4 space-y-2" style={{ fontSize: `${fontSize}px` }}>{children}</ol>,
                    li: ({ children }) => <li className="text-muted-foreground [&>p]:inline [&>p]:m-0" style={{ fontSize: `${fontSize}px` }}>{children}</li>,
                    strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-orange-500 pl-4 italic text-muted-foreground my-4" style={{ fontSize: `${fontSize}px` }}>
                        {children}
                      </blockquote>
                    )
                  }}
                >
                  {artigo.conteudo_gerado}
                </ReactMarkdown>
              </article>
            </Card>
          ) : (
            <Card className="bg-card/30 border-border/30 p-8 text-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Gerando conteúdo...</p>
            </Card>
          )
        ) : (
          // Aba de Obras
          <div className="space-y-4">
            {selectedObra ? (
              // Mostrar resumo da obra selecionada
              <div>
                <button
                  onClick={() => { setSelectedObra(null); setResumoObra(null); }}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors px-3 py-1.5 rounded-lg hover:bg-card/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Voltar para lista de obras</span>
                </button>
                
                <Card className="bg-card/30 border-border/30 p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">{selectedObra.titulo}</h2>
                    {selectedObra.tituloOriginal && selectedObra.tituloOriginal !== selectedObra.titulo && (
                      <p className="text-muted-foreground italic text-sm mb-2">{selectedObra.tituloOriginal}</p>
                    )}
                    {selectedObra.ano && (
                      <span className="text-xs px-2 py-1 bg-orange-600/30 text-orange-300 rounded-full">{selectedObra.ano}</span>
                    )}
                  </div>
                  
                  {loadingResumo ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Gerando resumo detalhado...</p>
                      <p className="text-muted-foreground/70 text-sm mt-2">Isso pode levar alguns segundos</p>
                    </div>
                  ) : resumoObra ? (
                    <article className="prose prose-invert prose-slate max-w-none" style={{ fontSize: `${fontSize}px` }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4" style={{ fontSize: `${fontSize + 8}px` }}>{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mt-6 mb-3" style={{ fontSize: `${fontSize + 4}px` }}>{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-semibold text-orange-300 mt-4 mb-2" style={{ fontSize: `${fontSize + 2}px` }}>{children}</h3>,
                          p: ({ children }) => <p className="text-muted-foreground mb-4 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 text-muted-foreground mb-4 space-y-2" style={{ fontSize: `${fontSize}px` }}>{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 text-muted-foreground mb-4 space-y-2" style={{ fontSize: `${fontSize}px` }}>{children}</ol>,
                          li: ({ children }) => <li className="text-muted-foreground [&>p]:inline [&>p]:m-0" style={{ fontSize: `${fontSize}px` }}>{children}</li>,
                          strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-orange-500 pl-4 italic text-muted-foreground my-4 bg-orange-950/20 py-2 rounded-r" style={{ fontSize: `${fontSize}px` }}>
                              {children}
                            </blockquote>
                          )
                        }}
                      >
                        {resumoObra}
                      </ReactMarkdown>
                    </article>
                  ) : null}
                </Card>
              </div>
            ) : (
              // Lista de obras
              <>
                {loadingObras ? (
                  <Card className="bg-card/30 border-border/30 p-8 text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando obras...</p>
                  </Card>
                ) : obras.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 mb-3">
                      <p className="text-muted-foreground text-xs">{obras.length} obras encontradas</p>
                      {isGeneratingAllResumos && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
                          <span className="text-xs text-orange-400">
                            Gerando {resumosProgress.current}/{resumosProgress.total}
                          </span>
                        </div>
                      )}
                      {!isGeneratingAllResumos && resumosProgress.total > 0 && (
                        <span className="text-xs text-green-400">
                          ✓ {resumosProgress.current} resumos prontos
                        </span>
                      )}
                    </div>
                    {obras.map((obra, index) => (
                      <Card 
                        key={index}
                        onClick={() => selecionarObra(obra)}
                        className="bg-card/30 border-border/30 p-3 cursor-pointer hover:bg-card/50 transition-all group h-[72px]"
                      >
                        <div className="flex items-center gap-3 h-full">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center border border-orange-500/30">
                              <Scale className="w-5 h-5 text-orange-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground font-medium text-sm group-hover:text-orange-300 transition-colors truncate">
                              {obra.titulo}
                            </h3>
                            {obra.tituloOriginal && obra.tituloOriginal !== obra.titulo && (
                              <p className="text-muted-foreground/70 text-xs italic truncate">{obra.tituloOriginal}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {obra.ano && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-card/50 text-muted-foreground rounded flex-shrink-0">
                                  {obra.ano}
                                </span>
                              )}
                              {obra.relevanciaJuridica && (
                                <p className="text-muted-foreground text-xs truncate">{obra.relevanciaJuridica}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 transition-colors flex-shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-card/30 border-border/30 p-8 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma obra encontrada</p>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Navegação entre artigos */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex gap-4">
          {artigo.ordem > 1 && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/blogger-juridico/${artigo.categoria}/${artigo.ordem - 1}`)} 
              className="flex-1 bg-card/50 border-border text-muted-foreground hover:bg-card/70"
            >
              ← Artigo {artigo.ordem - 1}
            </Button>
          )}
          {artigo.ordem < 20 && (
            <Button 
              onClick={() => navigate(`/blogger-juridico/${artigo.categoria}/${artigo.ordem + 1}`)} 
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 text-white"
            >
              Artigo {artigo.ordem + 1} →
            </Button>
          )}
        </div>
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-2 z-50">
        {/* Botão de scroll ao topo */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-lg flex items-center justify-center transition-all animate-fade-in"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
        
        {/* Controles de fonte */}
        <div className="flex flex-col bg-card/90 backdrop-blur-sm rounded-full shadow-lg border border-border/50 overflow-hidden">
          <button
            onClick={aumentarFonte}
            className="w-12 h-10 flex items-center justify-center text-foreground hover:bg-card/70 transition-colors border-b border-border/50"
            aria-label="Aumentar fonte"
          >
            <span className="font-bold text-sm">A+</span>
          </button>
          <button
            onClick={diminuirFonte}
            className="w-12 h-10 flex items-center justify-center text-foreground hover:bg-card/70 transition-colors"
            aria-label="Diminuir fonte"
          >
            <span className="font-bold text-xs">A-</span>
          </button>
        </div>
      </div>
      </div> {/* Fecha relative z-10 */}
    </div>
  );
};

export default BloggerJuridicoArtigo;
