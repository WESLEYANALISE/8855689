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
 * Verifica se a narração de um artigo é permitida para usuários gratuitos.
 * Apenas artigos 1 a 5 são liberados para não-premium.
 */
export function isNarrationAllowed(numeroArtigo: string, isPremium: boolean): boolean {
  // Premium sempre tem acesso
  if (isPremium) return true;
  return isArticleInFreeRange(numeroArtigo);
}

/**
 * Verifica se recursos do artigo (favoritar, grifo, anotações, recursos) são permitidos
 * Apenas artigos 1 a 5 são liberados para não-premium.
 */
export function isArticleFeatureAllowed(numeroArtigo: string, isPremium: boolean): boolean {
  // Premium sempre tem acesso
  if (isPremium) return true;
  return isArticleInFreeRange(numeroArtigo);
}

/**
 * Retorna mensagem de bloqueio para narração premium
 */
export function getNarrationBlockedMessage(): { title: string; description: string } {
  return {
    title: "Narração Premium",
    description: "A narração de artigos a partir do 6º é exclusiva para assinantes. Faça upgrade para ouvir todos os artigos!"
  };
}

/**
 * Retorna mensagem de bloqueio para recursos premium
 */
export function getFeatureBlockedMessage(feature: 'favorito' | 'grifo' | 'anotacao' | 'recurso' | 'explicacao' | 'exemplo' | 'termos'): { title: string; description: string } {
  const messages: Record<string, { title: string; description: string }> = {
    favorito: {
      title: "Favoritos Premium",
      description: "Salvar artigos a partir do 6º nos favoritos é exclusivo para assinantes. Faça upgrade para organizar seus estudos!"
    },
    grifo: {
      title: "Grifos Premium",
      description: "Destacar artigos a partir do 6º é exclusivo para assinantes. Faça upgrade para marcar os pontos mais importantes!"
    },
    anotacao: {
      title: "Anotações Premium",
      description: "Adicionar anotações em artigos a partir do 6º é exclusivo para assinantes. Faça upgrade para fazer suas anotações!"
    },
    recurso: {
      title: "Recursos Premium",
      description: "Recursos interativos de artigos a partir do 6º são exclusivos para assinantes. Faça upgrade para acesso completo!"
    },
    explicacao: {
      title: "Explicação Premium",
      description: "A explicação de artigos a partir do 6º é exclusiva para assinantes. Faça upgrade para acessar todas as explicações!"
    },
    exemplo: {
      title: "Exemplos Premium",
      description: "Os exemplos de artigos a partir do 6º são exclusivos para assinantes. Faça upgrade para ver todos os exemplos práticos!"
    },
    termos: {
      title: "Termos Premium",
      description: "Os termos técnicos de artigos a partir do 6º são exclusivos para assinantes. Faça upgrade para acesso completo!"
    }
  };
  return messages[feature] || messages.recurso;
}
