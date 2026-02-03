/**
 * Destaca automaticamente termos-chave no conteúdo:
 * - Números (ex: 5.000, 25.000)
 * - Preços/valores monetários (ex: R$ 5.000, R$25.000)
 * - Leis e artigos (ex: Lei nº 9.504/97, Art. 5º, LC 64/90)
 * - Idades (ex: 18 anos, 35 anos de idade)
 * - Datas importantes (ex: 15 de agosto, 2024)
 * - Porcentagens (ex: 50%, 10,5%)
 * - Prazos (ex: 30 dias, 90 dias úteis)
 */

// Regex patterns para diferentes tipos de termos
const patterns = {
  // Valores monetários: R$ 5.000,00 ou R$5000 ou 5.000 reais
  monetario: /R\$\s*[\d.,]+(?:\s*(?:mil|milhão|milhões|bilhão|bilhões))?|[\d.,]+\s*(?:reais|mil reais|milhão|milhões)/gi,
  
  // Referências completas a leis (ex: "artigo 73 da Lei nº 9.504/1997")
  referenciaLeiCompleta: /(?:art(?:igo)?\.?\s*\d+[ºo°]?\s*(?:,?\s*(?:§|parágrafo)\s*\d+[ºo°]?)?\s*)?(?:d[ao]\s+)?(?:Lei(?:\s+Complementar)?|LC|Decreto(?:-Lei)?|EC|Emenda\s+Constitucional|MP|Medida\s+Provisória|Resolução|Portaria|IN|Instrução\s+Normativa|Código\s+(?:Civil|Penal|Eleitoral|Tributário))\s*(?:n[ºo°.]?\s*)?[\d.]+(?:\/\d{2,4})?/gi,
  
  // Leis isoladas: Lei nº 9.504/97, LC 64/90
  legislacao: /(?:Lei(?:\s+Complementar)?|LC|Decreto(?:-Lei)?|EC|Emenda\s+Constitucional|MP|Medida\s+Provisória|Resolução|Portaria|IN|Instrução\s+Normativa)\s*(?:n[ºo°.]?\s*)?[\d.]+(?:\/\d{2,4})?/gi,
  
  // Artigos e parágrafos isolados: Art. 5º, § 1º
  artigos: /Art(?:igo)?\.?\s*\d+[ºo°]?(?:\s*,?\s*(?:§|parágrafo)\s*\d+[ºo°]?)?|§\s*\d+[ºo°]?|(?:inciso|alínea)\s+[IVXLCDM]+/gi,
  
  // Códigos e estatutos
  codigos: /CF(?:\/\d{2,4})?|CPP|CPC|CP|CC|CLT|CDC|CTN|CTB|ECA|Estatuto\s+(?:da\s+)?(?:Criança|Idoso|OAB|Advocacia)/gi,
  
  // Datas: 15 de agosto de 2024, 01/01/2024, 1º de janeiro
  data: /\d{1,2}\s*(?:de\s+)?(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?|\d{1,2}[ºo°]?\s+de\s+\w+(?:\s+de\s+\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  
  // Idades: 18 anos, 35 anos de idade, idade mínima de 21 anos
  idade: /\d+\s*anos?\s*(?:de\s+idade)?|idade\s+(?:mínima|máxima)\s+(?:de\s+)?\d+(?:\s*anos)?/gi,
  
  // Prazos: 30 dias, 90 dias úteis, prazo de 15 dias
  prazo: /(?:prazo\s+(?:de\s+)?)?(?:\d+)\s*(?:dias?|meses?|horas?)(?:\s+úteis)?(?:\s+(?:corridos|consecutivos))?/gi,
  
  // Porcentagens: 50%, 10,5%
  porcentagem: /\d+(?:[.,]\d+)?%/g,
  
  // Valores numéricos grandes com pontos/vírgulas (ex: 5.000, 25.000)
  numeros: /\b\d{1,3}(?:\.\d{3})+(?:,\d{2})?\b|\b\d+(?:,\d{2})\b/g,
  
  // Multas e penalidades
  multa: /multa\s+(?:de\s+)?(?:R\$\s*)?[\d.,]+(?:\s*a\s*(?:R\$\s*)?[\d.,]+)?/gi,
};

// Combinar todos os patterns em um único regex (ordem importa: mais específicos primeiro)
const createCombinedPattern = () => {
  const allPatterns = [
    patterns.referenciaLeiCompleta.source, // Mais específico primeiro
    patterns.monetario.source,
    patterns.legislacao.source,
    patterns.artigos.source,
    patterns.codigos.source,
    patterns.data.source,
    patterns.idade.source,
    patterns.prazo.source,
    patterns.porcentagem.source,
    patterns.numeros.source,
    patterns.multa.source,
  ];
  
  return new RegExp(`(${allPatterns.join('|')})`, 'gi');
};

/**
 * Processa texto e retorna HTML com termos destacados
 */
export function highlightKeyTerms(text: string): string {
  if (!text) return '';
  
  const combinedPattern = createCombinedPattern();
  
  // Substituir matches com span destacado
  return text.replace(combinedPattern, (match) => {
    // Não destacar números muito pequenos isolados (1, 2, 3...)
    if (/^\d{1,2}$/.test(match.trim())) {
      return match;
    }
    
    return `<mark class="key-term">${match}</mark>`;
  });
}

/**
 * CSS classes para o destaque (adicionar ao index.css ou usar inline)
 */
export const keyTermStyles = `
  .key-term {
    background: linear-gradient(120deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.3) 100%);
    color: hsl(var(--primary));
    font-weight: 600;
    padding: 0.1em 0.3em;
    border-radius: 0.25em;
    border-bottom: 2px solid hsl(var(--primary) / 0.5);
  }
`;
