import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResultadoItem {
  id: string | number;
  titulo: string;
  subtitulo?: string;
  extra?: string;
  imagem?: string;
  route: string;
}

export interface CategoriaResultado {
  id: string;
  nome: string;
  icon: string;
  iconColor: string;
  count: number;
  preview: ResultadoItem[];
  allResults: ResultadoItem[];
  route: string;
}

interface CategoriaConfig {
  id: string;
  nome: string;
  icon: string;
  iconColor: string;
  tabelas: { nome: string; colunas: string[]; formatResult: (item: any, tabela: string) => ResultadoItem }[];
}

const CATEGORIAS_CONFIG: CategoriaConfig[] = [
  {
    id: 'artigos',
    nome: 'Artigos de Lei',
    icon: 'Scale',
    iconColor: 'text-purple-500',
    tabelas: [
      { nome: 'CF - Constituição Federal', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'Constituição Federal',
        route: `/constituicao?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CP - Código Penal', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'Código Penal',
        route: `/codigos/CP - Código Penal?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CC - Código Civil', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'Código Civil',
        route: `/codigos/CC - Código Civil?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CPC – Código de Processo Civil', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'CPC',
        route: `/codigos/CPC – Código de Processo Civil?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CPP – Código de Processo Penal', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'CPP',
        route: `/codigos/CPP – Código de Processo Penal?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CLT – Consolidação das Leis do Trabalho', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'CLT',
        route: `/codigos/CLT – Consolidação das Leis do Trabalho?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CTN – Código Tributário Nacional', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'CTN',
        route: `/codigos/CTN – Código Tributário Nacional?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'CDC – Código de Defesa do Consumidor', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item, tabela) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 100) + '...', extra: 'CDC',
        route: `/codigos/CDC – Código de Defesa do Consumidor?artigo=${item['Número do Artigo']}`
      })},
    ]
  },
  {
    id: 'videoaulas',
    nome: 'Videoaulas',
    icon: 'PlayCircle',
    iconColor: 'text-red-500',
    tabelas: [
      { nome: 'VIDEO AULAS-NOVO', colunas: ['titulo', 'area', 'categoria'], formatResult: (item) => ({
        id: item.id, titulo: item.titulo, subtitulo: item.area, extra: item.categoria, imagem: item.thumb,
        route: `/videoaulas/player?link=${encodeURIComponent(item.link || '')}&videoId=${item.id}`
      })}
    ]
  },
  {
    id: 'cursos',
    nome: 'Cursos',
    icon: 'GraduationCap',
    iconColor: 'text-blue-500',
    tabelas: [
      { nome: 'CURSOS', colunas: ['Tema', 'Area', 'Assunto'], formatResult: (item) => ({
        id: item.id, titulo: item.Tema, subtitulo: item.Area, extra: `M${item.Modulo} • A${item.Aula}`,
        route: `/cursos/aula?id=${item.id}`
      })}
    ]
  },
  {
    id: 'flashcards',
    nome: 'Flashcards',
    icon: 'Layers',
    iconColor: 'text-amber-500',
    tabelas: [
      { nome: 'FLASHCARDS', colunas: ['area', 'tema'], formatResult: (item) => ({
        id: `${item.area}-${item.tema}`, titulo: item.tema, subtitulo: item.area,
        route: `/flashcards/estudar?area=${encodeURIComponent(item.area)}&tema=${encodeURIComponent(item.tema)}`
      })}
    ]
  },
  {
    id: 'bibliotecas',
    nome: 'Bibliotecas',
    icon: 'BookOpen',
    iconColor: 'text-emerald-500',
    tabelas: [
      { nome: 'BIBLIOTECA-CLASSICOS', colunas: ['livro', 'autor', 'area'], formatResult: (item) => ({
        id: item.id, titulo: item.livro, subtitulo: item.autor, extra: 'Clássicos', imagem: item.imagem,
        route: `/biblioteca-classicos/${item.id}`
      })},
      { nome: 'BIBLIOTECA-ESTUDOS', colunas: ['Tema', 'Área'], formatResult: (item) => ({
        id: item.id, titulo: item.Tema, subtitulo: item['Área'], extra: 'Estudos', imagem: item['Capa-livro'],
        route: `/biblioteca-estudos/${item.id}`
      })},
      { nome: 'BIBILIOTECA-OAB', colunas: ['Tema', 'Área'], formatResult: (item) => ({
        id: item.id, titulo: item.Tema, subtitulo: item['Área'], extra: 'OAB', imagem: item['Capa-livro'],
        route: `/biblioteca-oab/${item.id}`
      })},
      { nome: 'BIBLIOTECA-FORA-DA-TOGA', colunas: ['livro', 'autor'], formatResult: (item) => ({
        id: item.id, titulo: item.livro, subtitulo: item.autor, extra: 'Fora da Toga', imagem: item['capa-livro'],
        route: `/biblioteca-fora-da-toga/${item.id}`
      })},
      { nome: 'BIBLIOTECA-LIDERANÇA', colunas: ['livro', 'autor'], formatResult: (item) => ({
        id: item.id, titulo: item.livro, subtitulo: item.autor, extra: 'Liderança', imagem: item.imagem,
        route: `/biblioteca-lideranca/${item.id}`
      })},
      { nome: 'BIBLIOTECA-ORATORIA', colunas: ['livro', 'autor'], formatResult: (item) => ({
        id: item.id, titulo: item.livro, subtitulo: item.autor, extra: 'Oratória', imagem: item.imagem,
        route: `/biblioteca-oratoria/${item.id}`
      })},
    ]
  },
  {
    id: 'blog',
    nome: 'Blog Jurídico',
    icon: 'Newspaper',
    iconColor: 'text-pink-500',
    tabelas: [
      { nome: 'BLOGGER_JURIDICO', colunas: ['titulo', 'categoria', 'descricao_curta'], formatResult: (item) => ({
        id: item.id, titulo: item.titulo, subtitulo: item.categoria, extra: item.descricao_curta?.substring(0, 80), imagem: item.url_capa,
        route: `/posts-juridicos?id=${item.id}`
      })}
    ]
  },
  {
    id: 'dicionario',
    nome: 'Dicionário Jurídico',
    icon: 'BookA',
    iconColor: 'text-cyan-500',
    tabelas: [
      { nome: 'DICIONARIO', colunas: ['Palavra', 'Significado'], formatResult: (item) => ({
        id: item.id, titulo: item.Palavra, subtitulo: item.Significado?.substring(0, 100) + '...',
        route: `/dicionario?termo=${encodeURIComponent(item.Palavra)}`
      })}
    ]
  },
  {
    id: 'mapas',
    nome: 'Mapas Mentais',
    icon: 'Brain',
    iconColor: 'text-violet-500',
    tabelas: [
      { nome: 'MAPA MENTAL', colunas: ['tema', 'area'], formatResult: (item) => ({
        id: item.id, titulo: item.tema, subtitulo: item.area, extra: `Mapa #${item.sequencia}`,
        route: `/mapa-mental/area/${encodeURIComponent(item.area)}`
      })}
    ]
  },
  {
    id: 'juriflix',
    nome: 'JuriFlix',
    icon: 'Film',
    iconColor: 'text-red-600',
    tabelas: [
      { nome: 'JURIFLIX', colunas: ['titulo', 'categoria', 'descricao'], formatResult: (item) => ({
        id: item.id, titulo: item.titulo, subtitulo: item.categoria, extra: item.ano, imagem: item.capa,
        route: `/juriflix/${item.id}`
      })}
    ]
  },
  {
    id: 'audioaulas',
    nome: 'Audioaulas',
    icon: 'Headphones',
    iconColor: 'text-orange-500',
    tabelas: [
      { nome: 'AUDIO-AULA', colunas: ['titulo', 'tema', 'area'], formatResult: (item) => ({
        id: item.id, titulo: item.titulo, subtitulo: item.tema, extra: item.area, imagem: item.imagem_miniatura,
        route: `/audioaulas/categoria/${encodeURIComponent(item.area || 'geral')}`
      })}
    ]
  },
  {
    id: 'simulados',
    nome: 'Simulados',
    icon: 'Target',
    iconColor: 'text-green-500',
    tabelas: [
      { nome: 'SIMULADO-OAB', colunas: ['area', 'tema'], formatResult: (item) => ({
        id: item.id, titulo: item.tema || item.area, subtitulo: 'Simulado OAB',
        route: `/simulados/realizar?tipo=oab`
      })},
    ]
  },
  {
    id: 'estatutos',
    nome: 'Estatutos',
    icon: 'Scroll',
    iconColor: 'text-amber-600',
    tabelas: [
      { nome: 'ECA – Estatuto da Criança e do Adolescente', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 80) + '...', extra: 'ECA',
        route: `/estatutos/ECA – Estatuto da Criança e do Adolescente?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'ESTATUTO – Estatuto do Idoso', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 80) + '...', extra: 'Idoso',
        route: `/estatutos/ESTATUTO – Estatuto do Idoso?artigo=${item['Número do Artigo']}`
      })},
    ]
  },
  {
    id: 'leis-especiais',
    nome: 'Leis Especiais',
    icon: 'Gavel',
    iconColor: 'text-rose-500',
    tabelas: [
      { nome: 'LEI 11340 - Lei Maria da Penha', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 80) + '...', extra: 'Maria da Penha',
        route: `/legislacao-penal/maria-da-penha?artigo=${item['Número do Artigo']}`
      })},
      { nome: 'LEI 12850 - Organizações Criminosas', colunas: ['Artigo', 'Número do Artigo'], formatResult: (item) => ({
        id: item.id, titulo: `Art. ${item['Número do Artigo']}`, subtitulo: item.Artigo?.substring(0, 80) + '...', extra: 'Org. Criminosas',
        route: `/legislacao-penal/organizacoes-criminosas?artigo=${item['Número do Artigo']}`
      })},
    ]
  },
  {
    id: 'sumulas',
    nome: 'Súmulas',
    icon: 'FileText',
    iconColor: 'text-indigo-500',
    tabelas: [
      { nome: 'SUMULAS-STF', colunas: ['enunciado', 'numero'], formatResult: (item) => ({
        id: item.id, titulo: `Súmula ${item.numero}`, subtitulo: item.enunciado?.substring(0, 100) + '...', extra: 'STF',
        route: `/sumulas/stf/${item.numero}`
      })},
      { nome: 'SUMULAS-STJ', colunas: ['enunciado', 'numero'], formatResult: (item) => ({
        id: item.id, titulo: `Súmula ${item.numero}`, subtitulo: item.enunciado?.substring(0, 100) + '...', extra: 'STJ',
        route: `/sumulas/stj/${item.numero}`
      })},
    ]
  },
];

export const useBuscaGlobal = (termo: string, enabled: boolean = true) => {
  const [resultados, setResultados] = useState<CategoriaResultado[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buscarCategoria = useCallback(async (config: CategoriaConfig, searchTerm: string): Promise<CategoriaResultado> => {
    const allResults: ResultadoItem[] = [];
    
    for (const tabela of config.tabelas) {
      try {
        // Build OR query for all columns
        const orConditions = tabela.colunas.map(col => `"${col}".ilike.%${searchTerm}%`).join(',');
        
        const { data, error } = await supabase
          .from(tabela.nome as any)
          .select('*')
          .or(orConditions)
          .limit(15);
        
        if (!error && data) {
          // Deduplicate by unique key for flashcards
          if (config.id === 'flashcards') {
            const seen = new Set<string>();
            const uniqueData = data.filter((item: any) => {
              const key = `${item.area}-${item.tema}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            allResults.push(...uniqueData.map((item: any) => tabela.formatResult(item, tabela.nome)));
          } else {
            allResults.push(...data.map((item: any) => tabela.formatResult(item, tabela.nome)));
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar em ${tabela.nome}:`, err);
      }
    }
    
    return {
      id: config.id,
      nome: config.nome,
      icon: config.icon,
      iconColor: config.iconColor,
      count: allResults.length,
      preview: allResults.slice(0, 3),
      allResults,
      route: `/pesquisar/categoria/${config.id}?q=${encodeURIComponent(searchTerm)}`
    };
  }, []);

  const buscar = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setResultados([]);
      setTotalResults(0);
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      // Buscar em todas as categorias em paralelo
      const promises = CATEGORIAS_CONFIG.map(config => buscarCategoria(config, searchTerm.toLowerCase()));
      const results = await Promise.all(promises);
      
      // Filtrar apenas categorias com resultados e ordenar por contagem
      const filteredResults = results
        .filter(r => r.count > 0)
        .sort((a, b) => b.count - a.count);
      
      const total = filteredResults.reduce((sum, r) => sum + r.count, 0);
      
      setResultados(filteredResults);
      setTotalResults(total);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro na busca global:', err);
        setError('Erro ao realizar a busca');
      }
    } finally {
      setIsSearching(false);
    }
  }, [buscarCategoria]);

  useEffect(() => {
    if (!enabled || termo.length < 3) {
      setResultados([]);
      setTotalResults(0);
      return;
    }

    const timer = setTimeout(() => {
      buscar(termo);
    }, 300);

    return () => clearTimeout(timer);
  }, [termo, enabled, buscar]);

  return {
    resultados,
    isSearching,
    totalResults,
    error,
    refresh: () => buscar(termo)
  };
};

export const getCategoriaConfig = (categoriaId: string): CategoriaConfig | undefined => {
  return CATEGORIAS_CONFIG.find(c => c.id === categoriaId);
};

export { CATEGORIAS_CONFIG };
