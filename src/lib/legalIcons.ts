export const legalIcons = {
  // Áreas do direito
  'civil': '📜',
  'penal': '⚖️',
  'trabalhista': '👷',
  'trabalhist': '👷',
  'tributario': '💰',
  'tributário': '💰',
  'constitucional': '🏛️',
  'administrativo': '🏢',
  'empresarial': '💼',
  'consumidor': '🛒',
  'ambiental': '🌳',
  'eleitoral': '🗳️',
  'previdenciário': '👴',
  'previdenciario': '👴',
  'família': '👨‍👩‍👧',
  'familia': '👨‍👩‍👧',
  
  // Conceitos jurídicos
  'lei': '📖',
  'artigo': '📄',
  'jurisprudência': '⚖️',
  'jurisprudencia': '⚖️',
  'doutrina': '📚',
  'exemplo': '💡',
  'atenção': '⚠️',
  'atencao': '⚠️',
  'importante': '🔴',
  'dica': '💡',
  'nota': '📝',
  'código': '📋',
  'codigo': '📋',
  'súmula': '📌',
  'sumula': '📌',
  'petição': '📃',
  'peticao': '📃',
  'sentença': '⚖️',
  'sentenca': '⚖️',
  'processo': '⚙️',
  'prazo': '⏰',
  'contrato': '📝',
  'audiência': '👨‍⚖️',
  'audiencia': '👨‍⚖️',
  
  // Atores jurídicos
  'juiz': '👨‍⚖️',
  'advogado': '👔',
  'promotor': '🎓',
  'defensor': '🛡️',
  'réu': '🧑',
  'reu': '🧑',
  'autor': '✍️',
  'testemunha': '🗣️',
  
  // Conceitos processuais
  'inicial': '🚀',
  'citação': '📨',
  'citacao': '📨',
  'contestação': '📋',
  'contestacao': '📋',
  'prova': '🔍',
  'decisão': '✅',
  'decisao': '✅',
  'acórdão': '📜',
  'acordao': '📜',
  'recurso': '↗️',
  'execução': '💰',
  'execucao': '💰',
};

export const getIconForContext = (text: string): string => {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [key, icon] of Object.entries(legalIcons)) {
    const normalizedKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(normalizedKey)) {
      return icon;
    }
  }
  
  return '📌';
};
