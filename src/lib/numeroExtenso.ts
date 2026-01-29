// Converter números por extenso para dígitos
const numerosExtenso: Record<string, string> = {
  'primeiro': '1',
  'primeira': '1',
  'segundo': '2',
  'segunda': '2',
  'terceiro': '3',
  'terceira': '3',
  'quarto': '4',
  'quarta': '4',
  'quinto': '5',
  'quinta': '5',
  'sexto': '6',
  'sexta': '6',
  'sétimo': '7',
  'setimo': '7',
  'sétima': '7',
  'setima': '7',
  'oitavo': '8',
  'oitava': '8',
  'nono': '9',
  'nona': '9',
  'décimo': '10',
  'decimo': '10',
  'décima': '10',
  'decima': '10',
  'um': '1',
  'dois': '2',
  'três': '3',
  'tres': '3',
  'quatro': '4',
  'cinco': '5',
  'seis': '6',
  'sete': '7',
  'oito': '8',
  'nove': '9',
  'dez': '10',
  'onze': '11',
  'doze': '12',
  'treze': '13',
  'quatorze': '14',
  'quinze': '15',
  'dezesseis': '16',
  'dezessete': '17',
  'dezoito': '18',
  'dezenove': '19',
  'vinte': '20',
};

/**
 * Extrai o número do artigo de uma query de busca
 * Converte números por extenso e remove palavras comuns
 */
export const extrairNumeroArtigo = (query: string): string | null => {
  if (!query) return null;
  
  const queryLower = query.toLowerCase().trim();
  
  // Se já for um número puro, retorna
  if (/^\d+$/.test(queryLower)) {
    return queryLower;
  }
  
  // Remover palavras como "artigo", "art", "art."
  const cleaned = queryLower
    .replace(/\bartigo\b/g, '')
    .replace(/\bart\.?\b/g, '')
    .trim();
  
  // Se depois de limpar sobrou um número, retorna
  if (/^\d+$/.test(cleaned)) {
    return cleaned;
  }
  
  // Tentar encontrar número por extenso
  for (const [extenso, numero] of Object.entries(numerosExtenso)) {
    if (cleaned.includes(extenso)) {
      return numero;
    }
  }
  
  // Tentar extrair número de qualquer parte da string
  const numeroMatch = cleaned.match(/\d+/);
  if (numeroMatch) {
    return numeroMatch[0];
  }
  
  return null;
};

/**
 * Gera variações de um número de artigo com símbolos de grau
 * Exemplo: "5" retorna ["5", "5°", "5º", "quinto"]
 * Exemplo: "5A" retorna ["5-A", "5°-A", "5º-A"]
 * Exemplo: "quinto" retorna ["5", "5°", "5º"]
 */
export const gerarVariacoesArtigo = (numeroBase: string): string[] => {
  if (!numeroBase) return [];
  
  const variacoes: string[] = [];
  
  // Detectar se tem letra (ex: 5A, 121A)
  const match = numeroBase.match(/^(\d+)([A-Za-z]?)$/);
  
  if (match) {
    const numero = match[1];
    const letra = match[2].toUpperCase();
    
    if (letra) {
      // Artigo com letra: 5-A, 5°-A, 5º-A
      variacoes.push(`${numero}-${letra}`);
      variacoes.push(`${numero}°-${letra}`);
      variacoes.push(`${numero}º-${letra}`);
    } else {
      // Artigo simples: 5, 5°, 5º
      variacoes.push(numero);
      variacoes.push(`${numero}°`);
      variacoes.push(`${numero}º`);
      
      // Adicionar ordinal se existir no mapa
      for (const [extenso, num] of Object.entries(numerosExtenso)) {
        if (num === numero) {
          // Adicionar variações ordinais também
          variacoes.push(extenso);
        }
      }
    }
  } else {
    // Fallback: retorna o número original
    variacoes.push(numeroBase);
  }
  
  return variacoes;
};

/**
 * Cria condições de busca otimizadas para artigos
 * Prioriza busca por número exato do artigo e gera variações
 * Também gera variações com sufixos (223-A, 223-B, etc)
 */
export const criarCondicoesBusca = (query: string) => {
  const numeroArtigo = extrairNumeroArtigo(query);
  const queryLower = query.toLowerCase().trim();
  const variacoes = numeroArtigo ? gerarVariacoesArtigo(numeroArtigo) : [];
  
  return {
    numeroArtigo,
    variacoes,
    queryOriginal: queryLower,
    // Se temos um número de artigo, priorizamos busca exata
    deveUsarBuscaExata: numeroArtigo !== null && numeroArtigo.length <= 3,
    // Padrão para buscar sufixos (ex: 223%)
    padraoBuscaSufixo: numeroArtigo ? `${numeroArtigo}%` : null,
  };
};
