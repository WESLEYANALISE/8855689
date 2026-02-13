import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveToInstantCache, getFromInstantCache, preloadImages } from '@/hooks/useInstantCache';

// Imagens locais do Hero Banner
import heroBannerThemisAdvogado from '@/assets/hero-banner-themis-advogado-v2.webp';
import heroBannerThemisChorando from '@/assets/hero-banner-themis-chorando.webp';
import heroBannerTribunal from '@/assets/hero-banner-tribunal.webp';
import heroVadeMecumPlanalto from '@/assets/hero-vademecum-planalto.webp';
import themisFull from '@/assets/themis-full.webp';
import heroBibliotecas from '@/assets/hero-bibliotecas-office.webp';
import heroNoticias from '@/assets/hero-noticias.webp';

// Imagens dos cards de orientação política
import politicoEsquerda from '@/assets/politico-esquerda.webp';
import politicoCentro from '@/assets/politico-centro.webp';
import politicoDireita from '@/assets/politico-direita.webp';

// Imagem da página de assinatura (WebP otimizada)
import assinaturaHero from '@/assets/assinatura-hero.webp';


// Capas horizontais dos modais de planos (WebP)
import assinaturaMensalHorizontal from '@/assets/assinatura-mensal-horizontal.webp';
import assinaturaTrimestralHorizontal from '@/assets/assinatura-trimestral-horizontal.webp';
import assinaturaVitalicioHorizontal from '@/assets/assinatura-vitalicio-horizontal.webp';

// Configuração das tabelas a pré-carregar
interface PreloadConfig {
  cacheKey: string;
  table: string;
  select: string;
  limit: number;
  orderBy?: { column: string; ascending: boolean };
  imageColumns?: string[];
}

const PRELOAD_CONFIGS: PreloadConfig[] = [
  // Prioridade 1: Notícias (aparecem na home)
  {
    cacheKey: 'noticias-politicas-instant',
    table: 'noticias_politicas_cache',
    select: 'id,titulo,fonte,imagem_url,imagem_url_webp,data_publicacao,url,espectro,processado',
    limit: 10,
    orderBy: { column: 'data_publicacao', ascending: false },
    imageColumns: ['imagem_url_webp', 'imagem_url'],
  },
  {
    cacheKey: 'noticias-juridicas-home',
    table: 'noticias_juridicas_cache',
    select: 'id,titulo,fonte,imagem,imagem_webp,data_publicacao,link',
    limit: 10,
    orderBy: { column: 'data_publicacao', ascending: false },
    imageColumns: ['imagem_webp', 'imagem'],
  },
  
  // Prioridade 2: Capas das bibliotecas (carrossel principal)
  {
    cacheKey: 'capas-biblioteca-v2',
    table: 'CAPA-BIBILIOTECA',
    select: 'id,Biblioteca,capa',
    limit: 15,
    imageColumns: ['capa'],
  },
  
  // Prioridade 3: Resumos diários - carrossel de boletins
  {
    cacheKey: 'resumos-diarios-carousel',
    table: 'resumos_diarios',
    select: 'id,data,total_noticias,slides,tipo',
    limit: 30,
    orderBy: { column: 'data', ascending: false },
  },
  
  // Prioridade 4: Leis push 2025 (resenha diária)
  {
    cacheKey: 'leis-push-2025-home',
    table: 'leis_push_2025',
    select: 'id,numero_lei,ementa,data_publicacao,tipo_ato',
    limit: 15,
    orderBy: { column: 'data_publicacao', ascending: false },
  },
  
  // Prioridade 5: Cursos
  {
    cacheKey: 'cursos-home-v2',
    table: 'CURSOS-APP',
    select: 'id,tema,"capa-aula","descricao-aula",area,ordem',
    limit: 50,
    orderBy: { column: 'ordem', ascending: true },
    imageColumns: ['capa-aula'],
  },
  
  // Prioridade 6: Carreiras jurídicas
  {
    cacheKey: 'carreiras-capas-home',
    table: 'carreiras_capas',
    select: 'id,carreira,url_capa',
    limit: 15,
    imageColumns: ['url_capa'],
  },
  
  // Prioridade 7: Blogger jurídico - TODAS as capas
  {
    cacheKey: 'blogger-juridico-home',
    table: 'BLOGGER_JURIDICO',
    select: 'id,titulo,categoria,url_capa,imagem_wikipedia,descricao_curta,ordem,topicos,conteudo_gerado,termo_wikipedia,fonte',
    limit: 100,
    orderBy: { column: 'ordem', ascending: true },
    imageColumns: ['url_capa', 'imagem_wikipedia'],
  },
  
  // Prioridade 8: Documentários jurídicos (JuriFlix)
  {
    cacheKey: 'documentarios-juridicos-cache',
    table: 'documentarios_juridicos',
    select: 'id,video_id,titulo,descricao,thumbnail,capa_webp,duracao,publicado_em,canal_nome,categoria',
    limit: 50,
    orderBy: { column: 'publicado_em', ascending: false },
    imageColumns: ['capa_webp', 'thumbnail'],
  },
  
  // Prioridade 9: Biblioteca Política
  {
    cacheKey: 'biblioteca-politica-all',
    table: 'BIBLIOTECA-POLITICA',
    select: 'id,area,livro,autor,link,imagem,sobre,beneficios',
    limit: 50,
    orderBy: { column: 'id', ascending: true },
    imageColumns: ['imagem'],
  },
  
  // ============= NOVAS TABELAS PARA CACHE AGRESSIVO =============
  
  // Prioridade 10: Súmulas vinculantes (Vade Mecum)
  {
    cacheKey: 'sumulas-vinculantes-all',
    table: 'SUMULAS-VINCULANTES',
    select: 'id,"Número","Conteúdo",Tema',
    limit: 100,
    orderBy: { column: 'id', ascending: true },
  },
  
  // Prioridade 11: Audioaulas
  {
    cacheKey: 'audioaulas-all',
    table: 'AUDIO-AULA',
    select: 'id,titulo,area,tema,sequencia,imagem_miniatura,url_audio',
    limit: 100,
    orderBy: { column: 'sequencia', ascending: true },
    imageColumns: ['imagem_miniatura'],
  },
  
  // Prioridade 12: Flashcards áreas
  {
    cacheKey: 'flashcards-areas-cache',
    table: 'flashcards_areas',
    select: 'id,area,icone,cor,ordem',
    limit: 30,
    orderBy: { column: 'ordem', ascending: true },
  },
  
  // Prioridade 13: Bibliotecas de estudo
  {
    cacheKey: 'biblioteca-estudos-all',
    table: 'BIBLIOTECA-ESTUDOS',
    select: 'id,Tema,"Capa-livro",Área,url_capa_gerada',
    limit: 60,
    orderBy: { column: 'id', ascending: true },
    imageColumns: ['Capa-livro', 'url_capa_gerada'],
  },
  
  // Prioridade 14: Biblioteca OAB
  {
    cacheKey: 'biblioteca-oab-all',
    table: 'BIBILIOTECA-OAB',
    select: 'id,Tema,"Capa-livro",Área',
    limit: 50,
    orderBy: { column: 'id', ascending: true },
    imageColumns: ['Capa-livro'],
  },
  
  // Prioridade 15: Biblioteca Clássicos
  {
    cacheKey: 'biblioteca-classicos-all',
    table: 'BIBLIOTECA-CLASSICOS',
    select: 'id,livro,imagem,area,autor,sobre',
    limit: 50,
    orderBy: { column: 'id', ascending: true },
    imageColumns: ['imagem'],
  },
  
  // Prioridade 16: Aulas interativas
  {
    cacheKey: 'aulas-interativas-all',
    table: 'aulas_interativas',
    select: 'id,titulo,area,tema,descricao',
    limit: 50,
    orderBy: { column: 'created_at', ascending: false },
  },
  
  // Prioridade 17: Blogger político
  {
    cacheKey: 'blogger-politico-all',
    table: 'blogger_politico',
    select: 'id,titulo,categoria,url_capa,descricao_curta,conteudo_gerado',
    limit: 50,
    orderBy: { column: 'id', ascending: false },
    imageColumns: ['url_capa'],
  },
];

// URLs das imagens dos planos de assinatura (Supabase Storage)
const SUPABASE_URL = "https://yehsmflblncybwzxhdhy.supabase.co";
const BUCKET_NAME = "gerador-imagens";
const ASSINATURA_PLAN_IMAGES = [
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/assinatura-mensal-permanente.png`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/assinatura-trimestral-permanente.png`,
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/assinatura-vitalicio-permanente.png`,
];

// Imagens locais críticas (Hero banners + cards políticos + assinatura)
const LOCAL_HERO_IMAGES = [
  heroBannerThemisAdvogado,
  heroBannerThemisChorando,
  heroBannerTribunal,
  heroVadeMecumPlanalto,
  themisFull,
  heroBibliotecas,
  heroNoticias,
  // Cards de orientação política
  politicoEsquerda,
  politicoCentro,
  politicoDireita,
  // Assinatura hero
  assinaturaHero,
  // Capas horizontais dos modais de planos
  assinaturaMensalHorizontal,
  assinaturaTrimestralHorizontal,
  assinaturaVitalicioHorizontal,
];

let hasPreloaded = false;

async function preloadTableData(config: PreloadConfig): Promise<string[]> {
  const imageUrls: string[] = [];
  
  try {
    // Verifica se já tem cache válido
    const cached = await getFromInstantCache<any[]>(config.cacheKey);
    if (cached && !cached.isStale && cached.data.length > 0) {
      // Extrai URLs de imagens do cache
      if (config.imageColumns) {
        cached.data.forEach((item: any) => {
          config.imageColumns!.forEach(col => {
            const url = item[col];
            if (url && typeof url === 'string') {
              imageUrls.push(url);
            }
          });
        });
      }
      return imageUrls;
    }

    // Busca dados frescos
    let query = supabase
      .from(config.table as any)
      .select(config.select)
      .limit(config.limit);

    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`[HomePreloader] Erro ao carregar ${config.table}:`, error.message);
      return imageUrls;
    }

    if (data && data.length > 0) {
      // Salva no cache
      await saveToInstantCache(config.cacheKey, data);

      // Extrai URLs de imagens
      if (config.imageColumns) {
        data.forEach((item: any) => {
          config.imageColumns!.forEach(col => {
            const url = item[col];
            if (url && typeof url === 'string') {
              imageUrls.push(url);
            }
          });
        });
      }
    }

    return imageUrls;
  } catch (err) {
    console.warn(`[HomePreloader] Falha silenciosa em ${config.table}`);
    return imageUrls;
  }
}

// Função especial para extrair imagens dos slides dos resumos diários
async function extractSlidesImages(): Promise<string[]> {
  const imageUrls: string[] = [];
  
  try {
    const cached = await getFromInstantCache<any[]>('resumos-diarios-carousel');
    const data = cached?.data || [];
    
    data.forEach((resumo: any) => {
      if (resumo.slides && Array.isArray(resumo.slides)) {
        resumo.slides.forEach((slide: any) => {
          if (slide.imagem_url && typeof slide.imagem_url === 'string') {
            imageUrls.push(slide.imagem_url);
          }
        });
      }
    });
  } catch (err) {
    console.warn('[HomePreloader] Erro ao extrair imagens dos slides:', err);
  }
  
  return imageUrls;
}

// Função para pré-carregar áudio
function preloadAudio(url: string) {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  audio.load();
}

// Função para pré-carregar vídeo
function preloadVideo(url: string) {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.src = url;
  video.load();
}

// Cache global para áudios persuasivos do PremiumFloatingCard
export const persuasiveAudioCache = new Map<string, { frase: string; audioBase64: string }>();

// Pré-carrega todos os 10 áudios persuasivos
async function preloadPersuasiveAudios() {
  console.log('🎙️ [HomePreloader] Iniciando pré-carregamento de áudios persuasivos...');
  
  const promises = Array.from({ length: 10 }, async (_, i) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-frase-assinatura');
      if (error) {
        console.warn(`[HomePreloader] Erro áudio ${i + 1}:`, error.message);
        return;
      }
      if (data?.audioBase64 && data?.frase && !persuasiveAudioCache.has(data.frase)) {
        persuasiveAudioCache.set(data.frase, data);
      }
    } catch (err) {
      console.warn(`[HomePreloader] Falha áudio ${i + 1}`);
    }
  });
  
  await Promise.all(promises);
  console.log(`✅ [HomePreloader] ${persuasiveAudioCache.size} áudios persuasivos carregados`);
}

async function runPreload() {
  if (hasPreloaded) return;
  hasPreloaded = true;

  const startTime = performance.now();
  console.log('🚀 [HomePreloader] Iniciando pré-carregamento da Home...');

  try {
    // 1. Pré-carregar imagens locais do Hero + assinatura imediatamente
    preloadImages(LOCAL_HERO_IMAGES);
    
    // Removido: pré-carregamento agressivo de áudio/vídeo
    // Agora carrega apenas quando necessário para economizar banda
    
    // 4. Pré-carregar imagens dos planos de assinatura do Storage
    preloadImages(ASSINATURA_PLAN_IMAGES);
    
    // 5. Capas horizontais já incluídas em LOCAL_HERO_IMAGES

    // 5. Buscar todos os dados em paralelo
    const allImageUrls: string[] = [];
    const results = await Promise.all(
      PRELOAD_CONFIGS.map(config => preloadTableData(config))
    );

    // Consolidar todas as URLs de imagens
    results.forEach(urls => {
      allImageUrls.push(...urls);
    });

    // 6. Extrair imagens dos slides dos boletins (prioridade alta)
    const slidesImages = await extractSlidesImages();
    allImageUrls.push(...slidesImages);

    // 7. Pré-carregar imagens do Supabase (aumentado para 250 para cache agressivo)
    const uniqueUrls = [...new Set(allImageUrls)].slice(0, 250);
    if (uniqueUrls.length > 0) {
      await preloadImages(uniqueUrls);
    }

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ [HomePreloader] Concluído em ${elapsed}ms - ${PRELOAD_CONFIGS.length} tabelas, ${uniqueUrls.length} imagens`);
  } catch (err) {
    console.warn('[HomePreloader] Erro durante pré-carregamento:', err);
  }
}

/**
 * Hook que pré-carrega todos os dados e imagens da Home
 * enquanto o usuário está na tela de login.
 * 
 * Executa em background usando requestIdleCallback para
 * não impactar a experiência de login.
 */
export const useHomePreloader = () => {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Usar requestIdleCallback para não bloquear a UI do login
    const startPreload = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => runPreload(), { timeout: 2000 });
      } else {
        // Fallback para browsers sem suporte
        setTimeout(runPreload, 100);
      }
    };

    startPreload();
  }, []);
};

// Exportar para uso manual se necessário
export { runPreload as preloadHomeData };
