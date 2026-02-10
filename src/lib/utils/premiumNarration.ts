/**
 * Códigos/leis que são totalmente gratuitos (todos os artigos liberados)
 */
const FREE_LAW_CODES = [
  'CF/88',
  'Constituição Federal',
  'Código Civil',
  'Código Penal',
];

function isFreeLaw(codeName?: string): boolean {
  if (!codeName) return false;
  return FREE_LAW_CODES.some(code => 
    codeName.toLowerCase() === code.toLowerCase()
  );
}

/**
 * Extrai o número inicial do artigo (ex: "1º", "2", "3-A" -> 1, 2, 3)
 */
function extractArticleNumber(numeroArtigo: string): number | null {
  const match = numeroArtigo.match(/^(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Verifica se um artigo está no range gratuito (1-5)
 */
export function isArticleInFreeRange(numeroArtigo: string): boolean {
  const numero = extractArticleNumber(numeroArtigo);
  if (numero === null) return false;
  return numero >= 1 && numero <= 5;
}

/**
 * Verifica se a narração de um artigo é permitida.
 * - Premium sempre tem acesso
 * - Leis gratuitas (CF, CC, CP) liberam todos os artigos
 * - Outras leis: apenas artigos 1 a 5 para não-premium
 */
export function isNarrationAllowed(numeroArtigo: string, isPremium: boolean, codeName?: string): boolean {
  if (isPremium) return true;
  if (isFreeLaw(codeName)) return true;
  return isArticleInFreeRange(numeroArtigo);
}

/**
 * Verifica se recursos do artigo (favoritar, grifo, anotações, explicação, exemplos, termos) são permitidos.
 * - Premium sempre tem acesso
 * - Leis gratuitas (CF, CC, CP) liberam todos os artigos
 * - Outras leis: apenas artigos 1 a 5 para não-premium
 */
export function isArticleFeatureAllowed(numeroArtigo: string, isPremium: boolean, codeName?: string): boolean {
  if (isPremium) return true;
  if (isFreeLaw(codeName)) return true;
  return isArticleInFreeRange(numeroArtigo);
}

/**
 * Retorna mensagem de bloqueio para narração premium
 */
export function getNarrationBlockedMessage(): { title: string; description: string } {
  return {
    title: "Narração Premium",
    description: "A narração deste artigo é exclusiva para assinantes. Faça upgrade para ouvir todos os artigos!"
  };
}

/**
 * Retorna mensagem de bloqueio para recursos premium
 */
export function getFeatureBlockedMessage(feature: 'favorito' | 'grifo' | 'anotacao' | 'recurso' | 'explicacao' | 'exemplo' | 'termos'): { title: string; description: string } {
  const messages: Record<string, { title: string; description: string }> = {
    favorito: {
      title: "Favoritos Premium",
      description: "Salvar este artigo nos favoritos é exclusivo para assinantes. Faça upgrade para organizar seus estudos!"
    },
    grifo: {
      title: "Grifos Premium",
      description: "Destacar este artigo é exclusivo para assinantes. Faça upgrade para marcar os pontos mais importantes!"
    },
    anotacao: {
      title: "Anotações Premium",
      description: "Adicionar anotações neste artigo é exclusivo para assinantes. Faça upgrade para fazer suas anotações!"
    },
    recurso: {
      title: "Recursos Premium",
      description: "Recursos interativos deste artigo são exclusivos para assinantes. Faça upgrade para acesso completo!"
    },
    explicacao: {
      title: "Explicação Premium",
      description: "A explicação deste artigo é exclusiva para assinantes. Faça upgrade para acessar todas as explicações!"
    },
    exemplo: {
      title: "Exemplos Premium",
      description: "Os exemplos deste artigo são exclusivos para assinantes. Faça upgrade para ver todos os exemplos práticos!"
    },
    termos: {
      title: "Termos Premium",
      description: "Os termos técnicos deste artigo são exclusivos para assinantes. Faça upgrade para acesso completo!"
    }
  };
  return messages[feature] || messages.recurso;
}
