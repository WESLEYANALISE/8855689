// Converte texto em CAIXA ALTA para capitalização adequada
const toTitleCase = (text: string): string => {
  // Palavras que devem ficar em minúscula (exceto quando são a primeira palavra)
  const lowercaseWords = new Set([
    'a', 'ao', 'aos', 'as', 'à', 'às',
    'da', 'das', 'de', 'do', 'dos',
    'e', 'em', 'na', 'nas', 'no', 'nos',
    'o', 'os', 'ou', 'para', 'pela', 'pelas',
    'pelo', 'pelos', 'por', 'sobre', 'um', 'uma'
  ]);

  const words = text.split(/\s+/);
  
  return words.map((word, index) => {
    // Remove pontuação para checar a palavra
    const cleanWord = word.replace(/[,;:\.\(\)]/g, '');
    
    // Se é um número romano (I, II, III, IV, V, etc), mantém maiúsculo
    if (/^[IVXLCDM]+$/i.test(cleanWord)) {
      return cleanWord.toUpperCase();
    }
    
    // Primeira palavra sempre capitalizada
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Se é uma palavra pequena, mantém minúscula
    if (lowercaseWords.has(cleanWord.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Caso contrário, capitaliza primeira letra
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

// Formata parênteses legais com cores e estilos baseados no tipo
const formatParentheses = (text: string, hideAnnotations: boolean = false): string => {
  // Padrões que NÃO devem ser formatados (frações, tempo, medidas)
  const ignorePatterns = [
    /\([^)]*(?:um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|1|2|3|4|5|6|7|8|9|10)\s*(?:terço|terços|quarto|quartos|quinto|quintos|sexto|sextos|metade|por cento|%|anos?|meses?|dias?|horas?)[^)]*\)/gi,
    /\(\s*\d+[^)]*\)/gi, // Parênteses que começam com número
  ];

  // Verificar se o texto dentro do parêntese deve ser ignorado
  const shouldIgnore = (match: string): boolean => {
    return ignorePatterns.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(match);
    });
  };

  // Padrões e cores para cada tipo de marcação legal
  const patterns: Array<{ regex: RegExp; className: string; hideable?: boolean }> = [
    // Revogado - vermelho/rosa, tamanho normal, sempre visível
    { regex: /\(Revogad[oa][^)]*\)/gi, className: 'text-red-400 italic', hideable: false },
    // Vetado - cinza, tamanho normal, sempre visível
    { regex: /\(Vetad[oa][^)]*\)/gi, className: 'text-gray-400 italic', hideable: false },
    // Incluído - verde, menor, ocultável
    { regex: /\(Incluíd[oa][^)]*\)/gi, className: 'text-emerald-400 italic text-[0.85em]', hideable: true },
    // Redação dada - laranja/amarelo, menor, ocultável
    { regex: /\(Redação[^)]*\)/gi, className: 'text-amber-400 italic text-[0.85em]', hideable: true },
    // Renumerado - ciano, menor, ocultável
    { regex: /\(Renumerad[oa][^)]*\)/gi, className: 'text-cyan-400 italic text-[0.85em]', hideable: true },
    // Vigência - azul/roxo, menor, ocultável
    { regex: /\(Vigência[^)]*\)/gi, className: 'text-violet-400 italic text-[0.85em]', hideable: true },
    // Vide - azul claro, menor, ocultável
    { regex: /\(Vide[^)]*\)/gi, className: 'text-sky-400 italic text-[0.85em]', hideable: true },
    // Expressão suprimida - rosa, menor, ocultável
    { regex: /\(Expressão suprimida[^)]*\)/gi, className: 'text-pink-400 italic text-[0.85em]', hideable: true },
    // Outros parênteses genéricos com referência a Lei/Decreto - amarelo claro, menor, ocultável
    { regex: /\((?=.*(?:Lei|Decreto|LC|EC|MP|Emenda)[^)]*)[^)]+\)/gi, className: 'text-amber-300/80 italic text-[0.85em]', hideable: true },
  ];

  let result = text;
  
  for (const { regex, className, hideable } of patterns) {
    result = result.replace(regex, (match) => {
      // Verificar se deve ser ignorado (frações, tempo, etc.)
      if (shouldIgnore(match)) {
        return match; // Retorna sem formatação
      }
      
      // Se é ocultável e está no modo oculto, esconde
      if (hideable && hideAnnotations) {
        return `<span class="${className} legal-annotation hidden">${match}</span>`;
      }
      
      return `<span class="${className}${hideable ? ' legal-annotation' : ''}">${match}</span>`;
    });
  }
  
  return result;
};

// Formata texto da Constituição aplicando estilos específicos
export const formatTextWithUppercase = (text: string, hideAnnotations: boolean = false): string => {
  if (!text) return "";
  
  // Normalizar quebras de linha múltiplas LOGO NO INÍCIO
  let result = text.replace(/\n{2,}/g, '\n\n');
  
  // Remover quebras de linha dentro de parênteses (nunca deve quebrar)
  result = result.replace(/\(([^)]*)\)/g, (match, content) => {
    const cleanContent = content.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    return `(${cleanContent})`;
  });
  
  // Normalizar quebras de linha desnecessárias dentro de frases
  // Substitui quebra de linha simples seguida de letra minúscula ou pontuação por espaço
  result = result.replace(/\n(?=[a-záàâãéèêíïóôõöúç,;:])/g, ' ');
  
  // Aplicar destaque amarelo e negrito a "Art. X" (artigo + número)
  // IMPORTANTE: Só para "Art." maiúsculo - "art." minúsculo é referência, não artigo
  result = result.replace(/(Art\.\s*\d+[º°]?(?:-[A-Z])?)/g, '<strong class="font-bold text-amber-300">$1</strong>');
  
  // Aplicar espaçamento duplo e negrito amarelo a "Parágrafo único"
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)(Parágrafo único\.?)/gim, '$1\n\n<strong class="font-bold text-amber-300">$2</strong>');
  // Caso já tenha \n\n antes, só adiciona negrito amarelo
  result = result.replace(/(\n\n)(Parágrafo único\.?)(?!<)/gi, '$1<strong class="font-bold text-amber-300">$2</strong>');
  
  // Aplicar espaçamento duplo e negrito amarelo a parágrafos (§)
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)(§\s*\d+º)/gm, '$1\n\n<strong class="font-bold text-amber-300">$2</strong>');
  // Caso já tenha \n\n antes, só adiciona negrito amarelo
  result = result.replace(/(\n\n)(§\s*\d+º)(?!<)/g, '$1<strong class="font-bold text-amber-300">$2</strong>');
  
  // Aplicar espaçamento duplo e negrito a incisos romanos (I, II, III, etc)
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)([IVXLCDM]+)\s*[-–—]\s*/gm, '$1\n\n<strong class="font-bold">$2</strong> - ');
  // Caso já tenha \n\n antes, só adiciona negrito
  result = result.replace(/(\n\n)([IVXLCDM]+)\s*[-–—](?!\s*<)/g, '$1<strong class="font-bold">$2</strong> - ');
  
  // Aplicar espaçamento duplo e negrito a alíneas (a), b), c))
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)\s*([a-z])\)\s*/gm, '$1\n\n<strong class="font-bold">$2)</strong> ');
  // Caso já tenha \n\n antes, só adiciona negrito
  result = result.replace(/(\n\n)\s*([a-z])\)(?!\s*<)/g, '$1<strong class="font-bold">$2)</strong> ');
  
  // Identificar e marcar títulos
  const lines = result.split('\n');
  const processedLines = lines.map((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Ignora linhas vazias ou muito curtas
    if (!trimmedLine || trimmedLine.length < 3) return line;
    
    // NÃO aplicar se a linha começa com §, números romanos seguidos de -, ou alíneas
    if (/^(§|\d+º|[IVXLCDM]+\s*[-–—]|[a-z]\))/.test(trimmedLine)) {
      return line;
    }
    
    // NÃO aplicar se é o artigo em si (começa com "Art.")
    if (/^Art\./.test(trimmedLine)) {
      return line;
    }
    
    // Verificar se a PRÓXIMA linha não-vazia começa com "Art." - isso indica que esta linha é um título do artigo
    let nextNonEmptyLine = '';
    for (let i = lineIndex + 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        nextNonEmptyLine = lines[i].trim();
        break;
      }
    }
    
    // Se a próxima linha começa com "Art.", esta linha é um título do artigo
    if (nextNonEmptyLine && /^Art\./i.test(nextNonEmptyLine)) {
      // Aplicar destaque amarelo vivo e negrito ao título
      return `<span class="text-amber-300 font-bold">${trimmedLine}</span>`;
    }
    
    // Para títulos principais em CAIXA ALTA (sem "Art." acima)
    const hasArticleAbove = lines.slice(0, lineIndex).some(l => /^Art\./i.test(l.trim()));
    if (!hasArticleAbove) {
      // Contar palavras em CAIXA ALTA
      const words = trimmedLine.split(/\s+/);
      const upperWords = words.filter(word => 
        /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\-\(\),;:\.0-9]+$/.test(word.replace(/[,;:\.\(\)]/g, ''))
      );
      
      // Se mais de 70% das palavras estão em caixa alta E tem pelo menos 2 palavras, é um título
      if (upperWords.length >= 2 && (upperWords.length / words.length) > 0.7) {
        const titleText = toTitleCase(trimmedLine);
        return `<span class="text-amber-300 font-bold">${titleText}</span>`;
      }
    }
    
    return line;
  });
  
  result = processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Normaliza múltiplas quebras para apenas dupla
  
  // Aplicar formatação de parênteses legais com cores
  result = formatParentheses(result, hideAnnotations);
  
  // Envolve o texto completo sem forçar tamanho de fonte (herda do container)
  return `<div class="font-normal">${result}</div>`;
};
