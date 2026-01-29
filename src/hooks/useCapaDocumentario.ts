import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CapasDB extends DBSchema {
  capas: {
    key: string;
    value: {
      id: string;
      url: string;
      blob: Blob;
      timestamp: number;
    };
  };
}

const DB_NAME = 'documentarios-capas-db';
const DB_VERSION = 1;
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 dias

let dbPromise: Promise<IDBPDatabase<CapasDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CapasDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('capas')) {
          db.createObjectStore('capas');
        }
      },
    });
  }
  return dbPromise;
};

interface UseCapaDocumentarioResult {
  capaUrl: string | null;
  isLoading: boolean;
  preload: () => void;
}

export const useCapaDocumentario = (
  id: string,
  capaWebp: string | null | undefined,
  thumbnailYoutube: string | null | undefined
): UseCapaDocumentarioResult => {
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prioridade: capa_webp > cache local > thumbnail YouTube
  const urlToUse = capaWebp || thumbnailYoutube;
  const cacheKey = `capa_${id}`;

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadCapa = async () => {
      if (!urlToUse) {
        setIsLoading(false);
        return;
      }

      try {
        const db = await getDB();
        const cached = await db.get('capas', cacheKey);

        // Se tem cache válido E a URL não mudou, usa o cache
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.url === urlToUse) {
          objectUrl = URL.createObjectURL(cached.blob);
          setCapaUrl(objectUrl);
          setIsLoading(false);
          return;
        }
        
        // Se a URL mudou, invalida o cache antigo
        if (cached && cached.url !== urlToUse) {
          await db.delete('capas', cacheKey);
        }

        // Busca a imagem nova
        const response = await fetch(urlToUse);
        if (!response.ok) throw new Error('Falha ao carregar imagem');
        
        const blob = await response.blob();
        
        // Salva no cache
        await db.put('capas', {
          id,
          url: urlToUse,
          blob,
          timestamp: Date.now(),
        }, cacheKey);

        objectUrl = URL.createObjectURL(blob);
        setCapaUrl(objectUrl);
      } catch (error) {
        console.error('Erro ao carregar capa:', error);
        // Fallback para URL direta
        setCapaUrl(urlToUse);
      } finally {
        setIsLoading(false);
      }
    };

    loadCapa();

    // Cleanup object URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, urlToUse, cacheKey]);

  const preload = useCallback(async () => {
    if (!urlToUse) return;

    try {
      const db = await getDB();
      const cached = await db.get('capas', cacheKey);
      
      // Se não tem cache, pré-carrega
      if (!cached) {
        const response = await fetch(urlToUse);
        if (response.ok) {
          const blob = await response.blob();
          await db.put('capas', {
            id,
            url: urlToUse,
            blob,
            timestamp: Date.now(),
          }, cacheKey);
        }
      }
    } catch (error) {
      console.error('Erro ao pré-carregar capa:', error);
    }
  }, [id, urlToUse, cacheKey]);

  return { capaUrl, isLoading, preload };
};

// Função para invalidar cache de uma capa específica
export const invalidateCapaCache = async (docId: string) => {
  try {
    const db = await getDB();
    const cacheKey = `capa_${docId}`;
    await db.delete('capas', cacheKey);
  } catch (error) {
    console.error('Erro ao invalidar cache da capa:', error);
  }
};

// Função para pré-carregar múltiplas capas em background
export const preloadCapas = async (
  documentarios: Array<{ id: string; capa_webp?: string | null; thumbnail?: string | null }>
) => {
  const db = await getDB();
  
  for (const doc of documentarios.slice(0, 50)) { // Limite de 50 por vez
    const urlToUse = doc.capa_webp || doc.thumbnail;
    if (!urlToUse) continue;

    const cacheKey = `capa_${doc.id}`;
    const cached = await db.get('capas', cacheKey);
    
    // Invalida se a URL mudou (nova capa gerada)
    if (cached && cached.url !== urlToUse) {
      await db.delete('capas', cacheKey);
    }
    
    const currentCached = await db.get('capas', cacheKey);
    if (!currentCached) {
      try {
        const response = await fetch(urlToUse);
        if (response.ok) {
          const blob = await response.blob();
          await db.put('capas', {
            id: doc.id,
            url: urlToUse,
            blob,
            timestamp: Date.now(),
          }, cacheKey);
        }
      } catch {
        // Ignora erros silenciosamente
      }
    }
  }
};
