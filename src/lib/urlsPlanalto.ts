// Mapeamento de tabelas de leis para URLs oficiais do Planalto
// Usado para raspagem automática de conteúdo

export interface LeiInfo {
  tableName: string;
  url: string;
  nome: string;
  status: 'vazia' | 'parcial' | 'completa';
}

// Mapeamento: Nome exato da tabela no Supabase => URL do Planalto
export const URLS_PLANALTO: Record<string, string> = {
  // ========================
  // CÓDIGOS PRINCIPAIS
  // ========================
  'CF - Constituição Federal': 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm',
  'CC - Código Civil': 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
  'CP - Código Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
  'CPC – Código de Processo Civil': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  'CPP – Código de Processo Penal': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
  'CLT - Consolidação das Leis do Trabalho': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm',
  'CTN – Código Tributário Nacional': 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm',
  'CDC – Código de Defesa do Consumidor': 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  'CE – Código Eleitoral': 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm',
  'CTB Código de Trânsito Brasileiro': 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  
  // ========================
  // CÓDIGOS MILITARES
  // ========================
  'CPM – Código Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm',
  'CPPM – Código de Processo Penal Militar': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002compilado.htm',
  
  // ========================
  // CÓDIGOS ESPECIAIS
  // ========================
  'CA - Código de Águas': 'https://www.planalto.gov.br/ccivil_03/decreto/d24643compilado.htm',
  'CBA Código Brasileiro de Aeronáutica': 'https://www.planalto.gov.br/ccivil_03/leis/l7565compilado.htm',
  'CBT Código Brasileiro de Telecomunicações': 'https://www.planalto.gov.br/ccivil_03/leis/l4117compilado.htm',
  'CC - Código de Caça': 'https://www.planalto.gov.br/ccivil_03/leis/L5197compilado.htm',
  'CCOM – Código Comercial': 'https://www.planalto.gov.br/ccivil_03/leis/lim/lim556compilado.htm',
  'CDM – Código de Minas': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del227compilado.htm',
  'CDUS - Código de Defesa do Usuário': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm',
  'CF - Código Florestal': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/L12651compilado.htm',
  'CP - Código de Pesca': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11959.htm',
  'CPI - Código de Propriedade Industrial': 'https://www.planalto.gov.br/ccivil_03/leis/l9279.htm',
  'LLD - Lei de Lavagem de Dinheiro': 'https://www.planalto.gov.br/ccivil_03/leis/l9613compilado.htm',

  // ========================
  // ESTATUTOS (formato ESTATUTO - NOME)
  // ========================
  'ESTATUTO - CIDADE': 'https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm',
  'ESTATUTO - DESARMAMENTO': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826compilado.htm',
  'ESTATUTO - ECA': 'https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm',
  'ESTATUTO - IDOSO': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm',
  'ESTATUTO - IGUALDADE RACIAL': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12288.htm',
  'ESTATUTO - OAB': 'https://www.planalto.gov.br/ccivil_03/leis/l8906compilado.htm',
  'ESTATUTO - PESSOA COM DEFICIÊNCIA': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
  'ESTATUTO - TORCEDOR': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.671compilado.htm',
  
  // ========================
  // ESTATUTOS (formato EST - Estatuto)
  // ========================
  'EST - Estatuto da Juventude': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm',
  'EST - Estatuto da Metrópole': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13089.htm',
  'EST - Estatuto da Migração': 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13445.htm',
  'EST - Estatuto da MPE': 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123compilado.htm',
  'EST - Estatuto da Terra': 'https://www.planalto.gov.br/ccivil_03/leis/l4504compilado.htm',
  'EST - Estatuto do Desporto': 'https://www.planalto.gov.br/ccivil_03/leis/l9615compilado.htm',
  'EST - Estatuto do Índio': 'https://www.planalto.gov.br/ccivil_03/leis/l6001.htm',
  'EST - Estatuto do Refugiado': 'https://www.planalto.gov.br/ccivil_03/leis/l9474.htm',
  'EST - Estatuto dos Militares': 'https://www.planalto.gov.br/ccivil_03/leis/l6880compilado.htm',
  'EST - Estatuto Magistério Superior': 'https://www.planalto.gov.br/ccivil_03/leis/l5540compilado.htm',
  'EST - Estatuto Pessoa com Câncer': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14238.htm',
  'EST - Estatuto Segurança Privada': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874compilado.htm',

  // ========================
  // LEIS PENAIS ESPECIAIS
  // ========================
  'Lei 11.340 de 2006 - Maria da Penha': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm',
  'Lei 11.343 de 2006 - Lei de Drogas': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343compilado.htm',
  'Lei 12.850 de 2013 - Organizações Criminosas': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm',
  'Lei 13.869 de 2019 - Abuso de Autoridade': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm',
  'Lei 13.964 de 2019 - Pacote Anticrime': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  'Lei 14.197 de 2021 - Crimes Contra o Estado Democrático': 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14197.htm',
  'Lei 7.210 de 1984 - Lei de Execução Penal': 'https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm',
  'Lei 8.072 de 1990 - Crimes Hediondos': 'https://www.planalto.gov.br/ccivil_03/leis/L8072compilada.htm',
  'Lei 9.099 de 1995 - Juizados Especiais': 'https://www.planalto.gov.br/ccivil_03/leis/l9099compilado.htm',
  'Lei 9.296 de 1996 - Interceptação Telefônica': 'https://www.planalto.gov.br/ccivil_03/leis/l9296.htm',
  'Lei 9.455 de 1997 - Tortura': 'https://www.planalto.gov.br/ccivil_03/leis/l9455.htm',
};

// Função para obter URL do Planalto para uma tabela
export function getUrlPlanalto(tableName: string): string | null {
  return URLS_PLANALTO[tableName] || null;
}

// Função para verificar se uma tabela tem URL mapeada
export function hasUrlPlanalto(tableName: string): boolean {
  return tableName in URLS_PLANALTO;
}

// Função para obter nome amigável da lei
export function getNomeAmigavel(tableName: string): string {
  // Já é amigável se começar com "Lei"
  if (tableName.startsWith('Lei ')) {
    return tableName.split(' - ')[1] || tableName;
  }
  // Estatutos
  if (tableName.startsWith('ESTATUTO - ')) {
    return tableName.replace('ESTATUTO - ', 'Est. ');
  }
  if (tableName.startsWith('EST - ')) {
    return tableName.replace('EST - Estatuto ', 'Est. ').replace('EST - ', '');
  }
  // Códigos
  return tableName;
}
