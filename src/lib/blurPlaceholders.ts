/**
 * Sistema de Blur Placeholders Base64 (10x10px WebP)
 * Permite transição suave de blur → imagem real
 */

// Blur placeholders pré-gerados por categoria/cor (10x10px WebP base64)
// Estes são placeholders genéricos que representam a cor dominante da categoria
export const BLUR_PLACEHOLDERS = {
  // Neutros
  dark: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/mD+YP5g/mD+YP5g/mD+YP5g/mD+YP5gAAAA',
  light: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O/N8AAP7+/9f/1//X/9f/1//X/9f/1//X/9f/1/8AAAA=',
  
  // Cores temáticas (tons escuros para combinar com o app)
  red: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/lD6UPpQ+lD6UPpQ+lD6UPpQ+lD6UAAAAA==',
  amber: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/eH94f3h/eH94f3h/eH94f3h/eH94fAAAAAA',
  blue: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/kD+QP5A/kD+QP5A/kD+QP5A/kD+QAAAAA==',
  green: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/jD+MP4w/jD+MP4w/jD+MP4w/jD+MAAAAA==',
  purple: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/nD+cP5w/nD+cP5w/nD+cP5w/nD+cAAAAA==',
  gold: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/dz93P3c/dz93P3c/dz93P3c/dz93PAAAA==',
  
  // Categorias específicas do app (cores dominantes)
  news: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/kj+SP5I/kj+SP5I/kj+SP5I/kj+SAAAAA==', // âmbar/vermelho
  library: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/dz93P3c/dz93P3c/dz93P3c/dz93PAAAA==', // dourado
  politics: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/lD6UPpQ+lD6UPpQ+lD6UPpQ+lD6UAAAAA==', // vermelho escuro
  documentary: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/kD+QP5A/kD+QP5A/kD+QP5A/kD+QAAAAA==', // azul escuro
  juridico: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/dz93P3c/dz93P3c/dz93P3c/dz93PAAAA==', // dourado
  
  // === NOVAS CATEGORIAS ===
  // Capas de livros (tom âmbar/marrom clássico)
  book: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/dj92P3Y/dj92P3Y/dj92P3Y/dj92PAAAA==',
  // Carreiras jurídicas (azul profissional)
  career: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/kj+SP5I/kj+SP5I/kj+SP5I/kj+SAAAAA==',
  // Cursos (vermelho educacional)
  course: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/lT6VPpU+lT6VPpU+lT6VPpU+lT6VAAAAA==',
  // Flashcards (roxo/magenta)
  flashcard: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/nD+cP5w/nD+cP5w/nD+cP5w/nD+cAAAAA==',
  // Resumos (laranja/vermelho)
  resume: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/lj+WP5Y/lj+WP5Y/lj+WP5Y/lj+WAAAAA==',
  // OAB (vermelho escuro)
  oab: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP78/lD6UPpQ+lD6UPpQ+lD6UPpQ+lD6UAAAAA==',
  // Estudos (dourado/âmbar)
  estudos: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP79/dz93P3c/dz93P3c/dz93P3c/dz93PAAAA==',
  // Hero banners (escuro dramático)
  hero: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJQBOgB6O+N8AAP7+/lD+UP5Q/lD+UP5Q/lD+UP5Q/lD+UAAAAA==',
} as const;

// Blur placeholders específicos para assets estáticos importantes
export const ASSET_BLURS: Record<string, string> = {
  // Cards políticos
  'politico-esquerda.png': BLUR_PLACEHOLDERS.red,
  'politico-centro.png': BLUR_PLACEHOLDERS.amber,
  'politico-direita.png': BLUR_PLACEHOLDERS.blue,
  
  // Hero banners
  'hero-banner-themis-advogado-v2.webp': BLUR_PLACEHOLDERS.gold,
  'themis-full.webp': BLUR_PLACEHOLDERS.gold,
  'hero-bibliotecas-office.webp': BLUR_PLACEHOLDERS.dark,
  'estudos-background.webp': BLUR_PLACEHOLDERS.dark,
  
  // Jornadas OAB/Estudos - CRÍTICAS
  'themis-estudos-background.webp': BLUR_PLACEHOLDERS.gold,
  'oab-aprovacao-hero.webp': BLUR_PLACEHOLDERS.red,
  'bg-areas-oab.webp': BLUR_PLACEHOLDERS.red,
  'oab-primeira-fase-aprovacao.webp': BLUR_PLACEHOLDERS.red,
};

export type BlurCategory = keyof typeof BLUR_PLACEHOLDERS;

/**
 * Gera um blur placeholder base64 a partir de uma cor hex
 * Cria um canvas 10x10px preenchido com a cor
 */
export function generateBlurFromColor(hexColor: string): string {
  // Fallback se não estivermos no browser
  if (typeof document === 'undefined') {
    return BLUR_PLACEHOLDERS.dark;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return BLUR_PLACEHOLDERS.dark;
    
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, 10, 10);
    
    return canvas.toDataURL('image/webp', 0.1);
  } catch {
    return BLUR_PLACEHOLDERS.dark;
  }
}

/**
 * Obtém o blur placeholder apropriado
 * Prioridade: blurDataURL customizado > asset específico > categoria > cor gerada > dark fallback
 */
export function getBlurPlaceholder(options: {
  src?: string | null;
  category?: BlurCategory;
  fallbackColor?: string;
  customBlur?: string;
}): string {
  const { src, category, fallbackColor, customBlur } = options;
  
  // 1. Blur customizado fornecido diretamente
  if (customBlur) {
    return customBlur;
  }
  
  // 2. Blur específico do asset
  if (src) {
    const fileName = src.split('/').pop();
    if (fileName && ASSET_BLURS[fileName]) {
      return ASSET_BLURS[fileName];
    }
  }
  
  // 3. Blur por categoria
  if (category && BLUR_PLACEHOLDERS[category]) {
    return BLUR_PLACEHOLDERS[category];
  }
  
  // 4. Gerar a partir de cor
  if (fallbackColor) {
    return generateBlurFromColor(fallbackColor);
  }
  
  // 5. Fallback escuro
  return BLUR_PLACEHOLDERS.dark;
}

/**
 * Mapa de cores de fallback por categoria (hex)
 * Usado para backgroundColor enquanto imagem carrega
 */
export const CATEGORY_FALLBACK_COLORS: Record<BlurCategory, string> = {
  dark: '#1e1e1e',
  light: '#f5f5f5',
  red: '#7f1d1d',
  amber: '#78350f',
  blue: '#1e3a8a',
  green: '#14532d',
  purple: '#581c87',
  gold: '#78350f',
  news: '#78350f',
  library: '#78350f',
  politics: '#7f1d1d',
  documentary: '#1e3a8a',
  juridico: '#78350f',
  // Novas categorias
  book: '#5c4033',
  career: '#1e3a5f',
  course: '#7f1d1d',
  flashcard: '#581c87',
  resume: '#9a3412',
  oab: '#7f1d1d',
  estudos: '#78350f',
  hero: '#1a1a1a',
};
