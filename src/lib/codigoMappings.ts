/**
 * Mapeamento Universal de Códigos - FONTE ÚNICA DA VERDADE
 * 
 * Este arquivo centraliza o mapeamento entre códigos curtos (slugs)
 * e nomes completos das tabelas do banco de dados.
 */

// Mapeamento: Código curto → Nome da Tabela
export const CODIGO_TO_TABLE: Record<string, string> = {
  // Códigos principais
  'cp': 'CP - Código Penal',
  'cpp': 'CPP – Código de Processo Penal',
  'cc': 'CC - Código Civil',
  'cpc': 'CPC – Código de Processo Civil',
  'cf': 'CF - Constituição Federal',
  'cdc': 'CDC – Código de Defesa do Consumidor',
  'clt': 'CLT - Consolidação das Leis do Trabalho',
  'ctn': 'CTN – Código Tributário Nacional',
  'ctb': 'CTB Código de Trânsito Brasileiro',
  'ce': 'CE – Código Eleitoral',
  'ca': 'CA - Código de Águas',
  'cba': 'CBA Código Brasileiro de Aeronáutica',
  'ccom': 'CCOM – Código Comercial',
  'cdm': 'CDM – Código de Minas',
  'cpm': 'CPM – Código Penal Militar',
  'cppm': 'CPPM – Código de Processo Penal Militar',
  'cbt': 'CBT Código Brasileiro de Telecomunicações',
  'cppenal': 'CPP – Código de Processo Penal', // Alias para compatibilidade
  
  // Novos Códigos
  'cflorestal': 'CF - Código Florestal',
  'ccaca': 'CC - Código de Caça',
  'cpesca': 'CP - Código de Pesca',
  'cpi': 'CPI - Código de Propriedade Industrial',
  'cdus': 'CDUS - Código de Defesa do Usuário',
  
  // Legislação Penal Especial - nomes corretos das tabelas
  'lep': 'Lei 7.210 de 1984 - Lei de Execução Penal',
  'lmp': 'Lei 11.340 de 2006 - Maria da Penha',
  'ld': 'Lei 11.343 de 2006 - Lei de Drogas',
  'loc': 'Lei 12.850 de 2013 - Organizações Criminosas',
  'lld': 'LLD - Lei de Lavagem de Dinheiro',
  'lit': 'Lei 9.296 de 1996 - Interceptação Telefônica',
  'lch': 'Lei 8.072 de 1990 - Crimes Hediondos',
  'lt': 'Lei 9.455 de 1997 - Tortura',
  'laa': 'Lei 13.869 de 2019 - Abuso de Autoridade',
  'lje': 'Lei 9.099 de 1995 - Juizados Especiais',
  'pac': 'Lei 13.964 de 2019 - Pacote Anticrime',
  'lced': 'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático',
  
  // Estatutos existentes
  'eca': 'ESTATUTO - ECA',
  'eab': 'ESTATUTO - OAB',
  'ei': 'ESTATUTO - IDOSO',
  'ec': 'ESTATUTO - CIDADE',
  'epd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
  'ede': 'ESTATUTO - DESARMAMENTO',
  'eir': 'ESTATUTO - IGUALDADE RACIAL',
  'etv': 'ESTATUTO - TORCEDOR',
  
  // Novos Estatutos - formato EST - Estatuto...
  'emilitares': 'EST - Estatuto dos Militares',
  'eterra': 'EST - Estatuto da Terra',
  'emigracao': 'EST - Estatuto da Migração',
  'ejuventude': 'EST - Estatuto da Juventude',
  'eindio': 'EST - Estatuto do Índio',
  'erefugiado': 'EST - Estatuto do Refugiado',
  'emetropole': 'EST - Estatuto da Metrópole',
  'edesporto': 'EST - Estatuto do Desporto',
  'empe': 'EST - Estatuto da MPE',
  'eseguranca': 'EST - Estatuto Segurança Privada',
  'emagisterio': 'EST - Estatuto Magistério Superior',
  'ecancer': 'EST - Estatuto Pessoa com Câncer',
  
  // Aliases de compatibilidade
  'oab': 'ESTATUTO - OAB',
  'idoso': 'ESTATUTO - IDOSO',
  'pcd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
  'racial': 'ESTATUTO - IGUALDADE RACIAL',
  'cidade': 'ESTATUTO - CIDADE',
  'torcedor': 'ESTATUTO - TORCEDOR',
  
  // Leis Ordinárias
  'lindb': 'LEI 4657 - LINDB',
  'mandadoseguranca': 'LEI 12016 - MANDADO DE SEGURANCA',
  'habeasdata': 'LEI 9507 - HABEAS DATA',
  'pregao': 'LEI 10520 - PREGAO',
  'marcocivilinternet': 'LEI 12965 - MARCO CIVIL INTERNET',
  'arbitragem': 'LEI 9307 - ARBITRAGEM',
  'inquilinato': 'LEI 8245 - INQUILINATO',
  'desapropriacao': 'LEI 3365 - DESAPROPRIACAO',
  'meioambiente': 'LEI 6938 - MEIO AMBIENTE',
  
  // Leis Especiais
  'falencia': 'LEI 11101 - RECUPERACAO FALENCIA',
  'crimesambientais': 'LEI 9605 - CRIMES AMBIENTAIS',
  'feminicidio': 'LEI 13104 - FEMINICIDIO',
  'antiterrorismo': 'LEI 13260 - ANTITERRORISMO',
  'crimesfinanceiro': 'LEI 7492 - CRIMES SISTEMA FINANCEIRO',
  'crimestributario': 'LEI 8137 - CRIMES ORDEM TRIBUTARIA',
  'fichalimpa': 'LC 135 - FICHA LIMPA',
  'crimesresponsabilidade': 'LEI 1079 - CRIMES RESPONSABILIDADE',
  'crimestransnacionais': 'LEI 5015 - CRIMES TRANSNACIONAIS'
};

// Mapeamento inverso: Nome da Tabela → Código curto
export const TABLE_TO_CODIGO: Record<string, string> = Object.entries(CODIGO_TO_TABLE)
  .reduce((acc, [key, value]) => {
    // Evitar duplicatas do alias 'cppenal'
    if (key !== 'cppenal' || !acc[value]) {
      acc[value] = key;
    }
    return acc;
  }, {} as Record<string, string>);

/**
 * Função helper para obter código curto a partir do nome da tabela
 * @param tableName Nome completo da tabela
 * @returns Código curto (ex: 'cp', 'cpp', 'cc')
 */
export function getCodigoFromTable(tableName: string): string {
  const codigo = TABLE_TO_CODIGO[tableName];
  if (!codigo) {
    console.warn(`⚠️ Código não encontrado para tabela: ${tableName}. Usando 'cp' como fallback.`);
    return 'cp';
  }
  return codigo;
}

/**
 * Função helper para obter nome da tabela a partir do código curto
 * @param codigo Código curto (ex: 'cp', 'cpp', 'cc')
 * @returns Nome completo da tabela
 */
export function getTableFromCodigo(codigo: string): string {
  const tableName = CODIGO_TO_TABLE[codigo];
  if (!tableName) {
    console.warn(`⚠️ Tabela não encontrada para código: ${codigo}. Usando 'CP - Código Penal' como fallback.`);
    return 'CP - Código Penal';
  }
  return tableName;
}
