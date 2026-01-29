export interface Article {
  id: number;
  "Número do Artigo"?: string | null;
  [key: string]: any;
}

/**
 * Normaliza o número do artigo para permitir ordenação correta.
 * Suporta artigos com sufixos (55-A, 191-B, etc)
 * 
 * @param num - Número do artigo (ex: "191", "55-A", "100-B")
 * @returns Número normalizado para ordenação
 */
export function normalizeArticleNumber(num: string | null | undefined): number {
  if (!num) return 999999;
  
  // Remove espaços, º, ª e converte para maiúsculas
  let cleaned = num.trim().toUpperCase();
  
  // Remove º e ª
  cleaned = cleaned.replace(/[ºª]/g, '');
  
  // Remove pontos que são separadores de milhar (1.041 → 1041)
  cleaned = cleaned.replace(/\./g, '');
  
  // Regex para capturar: número base + sufixo opcional (A, B, etc) com ou sem hífen
  const match = cleaned.match(/^(\d+)(?:-?([A-Z]))?/);
  if (!match) return 999999;
  
  const base = parseInt(match[1], 10);
  const suffix = match[2] ? match[2].charCodeAt(0) - 64 : 0; // A=1, B=2, etc
  
  // Retorna número que preserva ordem: 55, 55.001 (55-A), 55.002 (55-B), 56
  return base + (suffix * 0.001);
}

/**
 * Ordena artigos pelo número do artigo de forma numérica.
 * Suporta artigos com sufixos (55-A, 191-B, etc)
 */
export function sortArticles<T extends Article>(articles: T[]): T[] {
  return [...articles].sort((a, b) => {
    const numA = normalizeArticleNumber(a["Número do Artigo"]);
    const numB = normalizeArticleNumber(b["Número do Artigo"]);
    return numA - numB;
  });
}
