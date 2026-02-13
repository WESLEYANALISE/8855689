/**
 * Utilitário para gerar URLs de imagens otimizadas
 * Usa o Supabase Image Transform para imagens do Storage
 * ou retorna a URL original para uso com lazy loading
 */

// Presets de tamanho (espelhando a edge function)
export const IMAGE_PRESETS = {
  'thumb': { width: 100, height: 56 },
  'carousel-sm': { width: 144, height: 81 },
  'carousel': { width: 200, height: 113 },
  'sidebar': { width: 200, height: 100 },
  'card-xs': { width: 200, height: 113 },
  'card-sm': { width: 240, height: 135 },
  'card': { width: 300, height: 169 },
  'card-lg': { width: 400, height: 225 },
  'mobile': { width: 480, height: 270 },
  'tablet': { width: 640, height: 360 },
  'desktop': { width: 848, height: 477 },
  // Capas de livros (biblioteca de estudos)
  'livro-card': { width: 96, height: 128 },
  'livro-card-2x': { width: 192, height: 256 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

/**
 * Verifica se a URL é do Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage') || url.includes('supabase.in/storage');
}

/**
 * Gera URL otimizada usando Supabase Image Transform
 * Funciona apenas para imagens no Supabase Storage
 * 
 * @param url URL original da imagem
 * @param preset Preset de tamanho ou dimensões customizadas
 * @returns URL com parâmetros de transform ou URL original
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  preset: ImagePreset | { width: number; height: number }
): string {
  if (!url) return '';
  
  // Se não é do Supabase Storage, retorna original
  if (!isSupabaseStorageUrl(url)) {
    return url;
  }
  
  // Obter dimensões do preset
  const dimensions = typeof preset === 'string' 
    ? IMAGE_PRESETS[preset] 
    : preset;
  
  try {
    const urlObj = new URL(url);
    
    // Adicionar parâmetros de transform do Supabase
    urlObj.searchParams.set('width', dimensions.width.toString());
    urlObj.searchParams.set('height', dimensions.height.toString());
    urlObj.searchParams.set('resize', 'cover');
    urlObj.searchParams.set('quality', '75');
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Gera srcset para imagens responsivas
 * 
 * @param url URL original da imagem
 * @param sizes Array de presets para o srcset
 * @returns String srcset para uso em <img>
 */
export function getImageSrcSet(
  url: string | undefined | null,
  sizes: ImagePreset[]
): string {
  if (!url || !isSupabaseStorageUrl(url)) return '';
  
  return sizes
    .map(preset => {
      const optimizedUrl = getOptimizedImageUrl(url, preset);
      const width = IMAGE_PRESETS[preset].width;
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Retorna as dimensões para um preset
 */
export function getPresetDimensions(preset: ImagePreset): { width: number; height: number } {
  return IMAGE_PRESETS[preset];
}
