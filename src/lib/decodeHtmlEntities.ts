/**
 * Decodifica entidades HTML e corrige caracteres quebrados de encoding
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  // Primeiro, tentar decodificar entidades HTML usando DOMParser
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    let decoded = doc.documentElement.textContent || text;
    
    // Corrigir caracteres comuns de encoding quebrado
    decoded = decoded
      .replace(/�/g, '')
      .replace(/\uFFFD/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Entidades HTML numéricas comuns
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      // Entidades HTML nomeadas comuns
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&hellip;/g, '…')
      .trim();
    
    return decoded;
  } catch {
    // Fallback: apenas limpar caracteres problemáticos
    return text
      .replace(/�/g, '')
      .replace(/\uFFFD/g, '')
      .trim();
  }
}
