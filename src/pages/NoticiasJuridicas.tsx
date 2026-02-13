import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NoticiaCard from "@/components/NoticiaCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Newspaper, Search, X } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import HeroBackground from "@/components/HeroBackground";
import heroNoticias from "@/assets/noticias-juridicas-bg.webp";
import { useInstantCache } from "@/hooks/useInstantCache";

type FiltroCategoria = 'direito' | 'concurso' | 'politica';

interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
  analise_ia?: string;
  relevancia?: number;
}

const NoticiasJuridicas = () => {
  const navigate = useNavigate();
  const [dataAtiva, setDataAtiva] = useState<Date>(new Date());
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('direito');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  // Cache instantâneo para notícias jurídicas - busca direta do Supabase
  const { data: noticiasJuridicasRaw, isFetching: isRefreshingJuridicas, refresh: refreshJuridicas } = useInstantCache<Noticia[]>({
    cacheKey: 'noticias-juridicas-all-v3',
    queryFn: async () => {
      // Buscar últimos 14 dias para garantir que todas as datas apareçam
      const quatorzeDiasAtras = new Date();
      quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);
      const dataInicio = quatorzeDiasAtras.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('[NoticiasJuridicas] Buscando desde:', dataInicio);
      
      const { data, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('id, titulo, link, imagem, imagem_webp, fonte, categoria, data_publicacao, created_at, analise_ia, relevancia')
        .gte('data_publicacao', dataInicio)
        .order('data_publicacao', { ascending: false })
        .limit(500);
      
      if (error) {
        console.error('[NoticiasJuridicas] Erro:', error);
        throw error;
      }
      
      console.log('[NoticiasJuridicas] Total encontrado:', data?.length || 0);
      
      // Mapear para formato esperado
      return (data || []).map((noticia) => ({
        id: noticia.id.toString(),
        categoria: noticia.categoria || 'Direito',
        portal: noticia.fonte || 'Portal Jurídico',
        titulo: noticia.titulo,
        capa: noticia.imagem_webp || noticia.imagem || '',
        link: noticia.link,
        dataHora: noticia.data_publicacao || noticia.created_at || new Date().toISOString(),
        analise_ia: noticia.analise_ia,
        relevancia: noticia.relevancia || 50,
      }));
    },
    cacheDuration: 1 * 60 * 1000, // 1 minuto - cache curto
  });
  
  // Garantir que nunca é null
  const noticiasJuridicas = noticiasJuridicasRaw || [];

  // Cache instantâneo para notícias políticas - com ordenação correta
  const { data: noticiasPoliticasData, isFetching: isRefreshingPoliticas, refresh: refreshPoliticas } = useInstantCache<any[]>({
    cacheKey: 'noticias-politicas-instant-v2',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('*')
        .eq('processado', true)
        .order('data_publicacao', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    cacheDuration: 2 * 60 * 1000, // 2 minutos
    preloadImages: true,
    imageExtractor: (noticias) => (noticias || []).map((n: any) => n.imagem_url_webp || n.imagem_url).filter(Boolean),
  });
  
  // Garantir que nunca é null
  const noticiasPoliticasRaw = noticiasPoliticasData || [];

  // Cache instantâneo para notícias de concursos
  const { data: noticiasConcursosData, isFetching: isRefreshingConcursos, refresh: refreshConcursos } = useInstantCache<any[]>({
    cacheKey: 'noticias-concursos-all-v3',
    queryFn: async () => {
      const quatorzeDiasAtras = new Date();
      quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);
      const dataInicio = quatorzeDiasAtras.toISOString().split('T')[0];
      
      console.log('[NoticiasConcursos] Buscando desde:', dataInicio);
      
      const { data, error } = await supabase
        .from('noticias_concursos_cache')
        .select('id, titulo, link, imagem, imagem_webp, fonte, categoria, data_publicacao, created_at, analise_ia, conteudo_formatado')
        .gte('data_publicacao', dataInicio)
        .order('data_publicacao', { ascending: false })
        .limit(300);
      
      if (error) {
        console.error('[NoticiasConcursos] Erro:', error);
        throw error;
      }
      
      console.log('[NoticiasConcursos] Total encontrado:', data?.length || 0);
      return data || [];
    },
    cacheDuration: 1 * 60 * 1000,
  });

  const noticiasConcursosRaw = noticiasConcursosData || [];

  // Atualizar refs para uso no Realtime
  useEffect(() => {
    refreshConcursosRef.current = refreshConcursos;
    refreshPoliticasRef.current = refreshPoliticas;
  }, [refreshConcursos, refreshPoliticas]);

  // Mapear notícias de concursos para formato padrão
  const noticiasConcursos: Noticia[] = useMemo(() => 
    (noticiasConcursosRaw || []).map((n: any) => ({
      id: `concurso-${n.id}`,
      categoria: 'Concurso Público',
      portal: n.fonte || 'Portal de Concursos',
      titulo: n.titulo || '',
      capa: n.imagem_webp || n.imagem || '',
      link: n.link || '',
      dataHora: n.data_publicacao || n.created_at || new Date().toISOString(),
      analise_ia: n.analise_ia || '',
    })),
    [noticiasConcursosRaw]
  );

  // Mapear notícias políticas para formato padrão
  const noticiasPoliticas: Noticia[] = useMemo(() => 
    (noticiasPoliticasRaw || []).map((n: any) => ({
      id: n.id?.toString() || Math.random().toString(),
      categoria: 'Política',
      portal: n.fonte || 'Portal de Notícias',
      titulo: n.titulo || '',
      capa: n.imagem_url_webp || n.imagem_url || '',
      link: n.url || '',
      dataHora: n.data_publicacao || new Date().toISOString(),
      analise_ia: n.descricao || '',
    })),
    [noticiasPoliticasRaw]
  );

  const isRefreshing = isRefreshingJuridicas || isRefreshingPoliticas || isRefreshingConcursos;

  const noticiasFiltradas = useMemo(() => {
    // Combinar notícias jurídicas, políticas e de concursos
    let todasNoticias: Noticia[] = [...noticiasJuridicas, ...noticiasPoliticas, ...noticiasConcursos];

    if (todasNoticias.length === 0) return [];
    
    // Filtrar por data selecionada
    // Comparação por string YYYY-MM-DD para evitar conflitos de timezone
    const dataAtivaStr = format(dataAtiva, 'yyyy-MM-dd');
    let filtradas = todasNoticias.filter(n => {
      try {
        // Extrair apenas a parte da data (YYYY-MM-DD) da string ISO
        const dataNoticiaStr = n.dataHora.split('T')[0];
        return dataNoticiaStr === dataAtivaStr;
      } catch {
        return false;
      }
    });

    // Função para classificar categoria
    const getCategoriaTipo = (n: Noticia): 'direito' | 'concurso' | 'politica' => {
      const cat = n.categoria?.toLowerCase() || '';
      if (cat.includes('polític') || cat.includes('politic') || cat.includes('política')) return 'politica';
      if (cat.includes('concurso') || cat.includes('concursos')) return 'concurso';
      return 'direito'; // default para jurídicas (Direito, Civil, Penal, etc)
    };

    // Filtrar por categoria específica
    if (filtroCategoria === 'direito') {
      filtradas = filtradas.filter(n => getCategoriaTipo(n) === 'direito');
    } else if (filtroCategoria === 'concurso') {
      filtradas = filtradas.filter(n => getCategoriaTipo(n) === 'concurso');
    } else if (filtroCategoria === 'politica') {
      filtradas = filtradas.filter(n => getCategoriaTipo(n) === 'politica');
    }

    // Filtrar por termo de busca (título)
    if (termoBusca.trim()) {
      const termoNormalizado = termoBusca.toLowerCase().trim();
      filtradas = filtradas.filter(n => 
        n.titulo.toLowerCase().includes(termoNormalizado)
      );
    }

    // Ordenar por data (mais recentes primeiro)
    filtradas = [...filtradas].sort((a, b) => 
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );

    // Limitar a 30 notícias por categoria
    return filtradas.slice(0, 30);
  }, [noticiasJuridicas, noticiasPoliticas, noticiasConcursos, dataAtiva, filtroCategoria, termoBusca]);

  const handleNoticiaClick = (noticia: Noticia) => {
    // Notícias políticas devem ir para o componente correto que busca em noticias_politicas_cache
    const isPolitica = noticia.categoria?.toLowerCase().includes('polític') || 
                       noticia.categoria?.toLowerCase().includes('politic');
    
    if (isPolitica) {
      navigate(`/politica/noticias/${noticia.id}`, {
        state: { noticia }
      });
    } else {
      navigate(`/noticias-juridicas/${noticia.id}`, {
        state: { noticia }
      });
    }
  };

  const isHoje = isSameDay(dataAtiva, new Date());

  // Refs para controle de refresh
  const refreshConcursosRef = useRef<(() => Promise<void>) | null>(null);
  const refreshPoliticasRef = useRef<(() => Promise<void>) | null>(null);

  // Forçar refresh ao montar + Realtime para atualização automática
  useEffect(() => {
    // Refresh inicial de todas as categorias
    refreshJuridicas();
    
    // Supabase Realtime para notícias jurídicas
    const channelJuridicas = supabase
      .channel('noticias-juridicas-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_juridicas_cache'
      }, () => {
        console.log('[Realtime] Nova notícia jurídica detectada');
        refreshJuridicas();
      })
      .subscribe();

    // Supabase Realtime para notícias de concursos
    const channelConcursos = supabase
      .channel('noticias-concursos-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_concursos_cache'
      }, () => {
        console.log('[Realtime] Nova notícia de concurso detectada');
        refreshConcursosRef.current?.();
      })
      .subscribe();

    // Supabase Realtime para notícias políticas
    const channelPoliticas = supabase
      .channel('noticias-politicas-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_politicas_cache'
      }, () => {
        console.log('[Realtime] Nova notícia política detectada');
        refreshPoliticasRef.current?.();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelJuridicas);
      supabase.removeChannel(channelConcursos);
      supabase.removeChannel(channelPoliticas);
    };
  }, [refreshJuridicas]);

  // Gerar array dos últimos 7 dias
  const ultimosDias = useMemo(() => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      dias.push(subDays(new Date(), i));
    }
    return dias;
  }, []);

  const formatarLabelDia = (data: Date) => {
    if (isSameDay(data, new Date())) return "Hoje";
    return format(data, "dd/MM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen pb-4 bg-background relative">
      <HeroBackground imageSrc={heroNoticias} height="50vh" />
      
      <div className="relative z-10 animate-slide-in-from-bottom">
      {/* Header compacto */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Notícias Jurídicas</h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe os concursos públicos e notícias jurídicas
            </p>
          </div>
        </div>
      </div>

      {/* Menu de alternância de datas */}
      <div className="px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {ultimosDias.map((dia) => (
              <Button
                key={dia.toISOString()}
                onClick={() => setDataAtiva(dia)}
                variant={isSameDay(dia, dataAtiva) ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap text-xs ${
                  isSameDay(dia, dataAtiva) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted/50"
                }`}
              >
                {formatarLabelDia(dia)}
              </Button>
            ))}
          </div>
        </div>
      </div>


      {/* Busca por palavras-chave */}
      <div className="px-4 pb-3 max-w-6xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por palavras-chave..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10 pr-10 bg-muted/50 border-border"
          />
          {termoBusca && (
            <button
              onClick={() => setTermoBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Menu de filtro de categorias */}
      <div className="px-4 pb-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-2">
          {(['direito', 'concurso', 'politica'] as FiltroCategoria[]).map((filtro) => {
            const labels: Record<FiltroCategoria, string> = {
              direito: 'Direito',
              concurso: 'Concurso',
              politica: 'Política'
            };
            const isActive = filtroCategoria === filtro;
            return (
              <Button
                key={filtro}
                onClick={() => setFiltroCategoria(filtro)}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`w-full text-xs ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted/50"
                }`}
              >
                {labels[filtro]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Lista de Notícias */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-2">Erro ao carregar notícias</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Tente novamente mais tarde"}
            </p>
          </div>
        )}

        {!error && noticiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              Nenhuma notícia encontrada para {isHoje ? "hoje" : format(dataAtiva, "dd/MM", { locale: ptBR })}
            </p>
          </div>
        )}

        {!error && noticiasFiltradas.length > 0 && (
          <>
            <div className="mb-3 text-sm text-muted-foreground">
              {noticiasFiltradas.length} {noticiasFiltradas.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {noticiasFiltradas.map(noticia => (
                <NoticiaCard 
                  key={noticia.id} 
                  {...noticia} 
                  onClick={() => handleNoticiaClick(noticia)} 
                />
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default NoticiasJuridicas;
