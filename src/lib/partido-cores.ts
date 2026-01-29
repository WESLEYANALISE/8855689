// Cores dinâmicas por partido político brasileiro
export const CORES_PARTIDOS: Record<string, { bg: string; text: string; border: string }> = {
  'PT': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  'PL': { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-600/40' },
  'UNIÃO': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  'PP': { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
  'MDB': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
  'PSD': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
  'REPUBLICANOS': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' },
  'PSB': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  'PSOL': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  'PSDB': { bg: 'bg-blue-400/20', text: 'text-blue-300', border: 'border-blue-400/40' },
  'PDT': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40' },
  'PODE': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  'AVANTE': { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-600/40' },
  'CIDADANIA': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
  'PCdoB': { bg: 'bg-red-600/20', text: 'text-red-500', border: 'border-red-600/40' },
  'PV': { bg: 'bg-green-600/20', text: 'text-green-500', border: 'border-green-600/40' },
  'REDE': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  'NOVO': { bg: 'bg-orange-400/20', text: 'text-orange-300', border: 'border-orange-400/40' },
  'SOLIDARIEDADE': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
  'PRD': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
};

// Lista de todos os partidos disponíveis
export const PARTIDOS_LISTA = [
  'AVANTE', 'CIDADANIA', 'MDB', 'NOVO', 'PCdoB', 'PDT', 'PL', 'PODE', 'PP', 'PRD',
  'PSB', 'PSD', 'PSDB', 'PSOL', 'PT', 'PV', 'REDE', 'REPUBLICANOS', 'SOLIDARIEDADE', 'UNIÃO'
];

// Lista de todas as UFs brasileiras
export const UFS_LISTA = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

// Função para obter cor do partido com fallback
export const getCorPartido = (partido: string) => {
  return CORES_PARTIDOS[partido] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
};
