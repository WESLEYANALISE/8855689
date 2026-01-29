// Mapeamento de DDDs para estados brasileiros
export const DDD_ESTADO: Record<string, { estado: string; sigla: string; capital: string; lat: number; lng: number }> = {
  // São Paulo
  '11': { estado: 'São Paulo', sigla: 'SP', capital: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  '12': { estado: 'São Paulo', sigla: 'SP', capital: 'São José dos Campos', lat: -23.1896, lng: -45.8841 },
  '13': { estado: 'São Paulo', sigla: 'SP', capital: 'Santos', lat: -23.9608, lng: -46.3336 },
  '14': { estado: 'São Paulo', sigla: 'SP', capital: 'Bauru', lat: -22.3147, lng: -49.0608 },
  '15': { estado: 'São Paulo', sigla: 'SP', capital: 'Sorocaba', lat: -23.5015, lng: -47.4526 },
  '16': { estado: 'São Paulo', sigla: 'SP', capital: 'Ribeirão Preto', lat: -21.1775, lng: -47.8103 },
  '17': { estado: 'São Paulo', sigla: 'SP', capital: 'São José do Rio Preto', lat: -20.8113, lng: -49.3758 },
  '18': { estado: 'São Paulo', sigla: 'SP', capital: 'Presidente Prudente', lat: -22.1207, lng: -51.3882 },
  '19': { estado: 'São Paulo', sigla: 'SP', capital: 'Campinas', lat: -22.9099, lng: -47.0626 },
  
  // Rio de Janeiro
  '21': { estado: 'Rio de Janeiro', sigla: 'RJ', capital: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  '22': { estado: 'Rio de Janeiro', sigla: 'RJ', capital: 'Campos dos Goytacazes', lat: -21.7545, lng: -41.3244 },
  '24': { estado: 'Rio de Janeiro', sigla: 'RJ', capital: 'Petrópolis', lat: -22.5112, lng: -43.1779 },
  
  // Espírito Santo
  '27': { estado: 'Espírito Santo', sigla: 'ES', capital: 'Vitória', lat: -20.3155, lng: -40.3128 },
  '28': { estado: 'Espírito Santo', sigla: 'ES', capital: 'Cachoeiro de Itapemirim', lat: -20.8489, lng: -41.1128 },
  
  // Minas Gerais
  '31': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
  '32': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Juiz de Fora', lat: -21.7642, lng: -43.3496 },
  '33': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Governador Valadares', lat: -18.8509, lng: -41.9494 },
  '34': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Uberlândia', lat: -18.9186, lng: -48.2772 },
  '35': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Poços de Caldas', lat: -21.7877, lng: -46.5613 },
  '37': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Divinópolis', lat: -20.1397, lng: -44.8844 },
  '38': { estado: 'Minas Gerais', sigla: 'MG', capital: 'Montes Claros', lat: -16.7286, lng: -43.8618 },
  
  // Paraná
  '41': { estado: 'Paraná', sigla: 'PR', capital: 'Curitiba', lat: -25.4290, lng: -49.2710 },
  '42': { estado: 'Paraná', sigla: 'PR', capital: 'Ponta Grossa', lat: -25.0916, lng: -50.1668 },
  '43': { estado: 'Paraná', sigla: 'PR', capital: 'Londrina', lat: -23.3045, lng: -51.1696 },
  '44': { estado: 'Paraná', sigla: 'PR', capital: 'Maringá', lat: -23.4205, lng: -51.9333 },
  '45': { estado: 'Paraná', sigla: 'PR', capital: 'Foz do Iguaçu', lat: -25.5163, lng: -54.5854 },
  '46': { estado: 'Paraná', sigla: 'PR', capital: 'Francisco Beltrão', lat: -26.0785, lng: -53.0531 },
  
  // Santa Catarina
  '47': { estado: 'Santa Catarina', sigla: 'SC', capital: 'Joinville', lat: -26.3044, lng: -48.8487 },
  '48': { estado: 'Santa Catarina', sigla: 'SC', capital: 'Florianópolis', lat: -27.5954, lng: -48.5480 },
  '49': { estado: 'Santa Catarina', sigla: 'SC', capital: 'Chapecó', lat: -27.0963, lng: -52.6174 },
  
  // Rio Grande do Sul
  '51': { estado: 'Rio Grande do Sul', sigla: 'RS', capital: 'Porto Alegre', lat: -30.0346, lng: -51.2177 },
  '53': { estado: 'Rio Grande do Sul', sigla: 'RS', capital: 'Pelotas', lat: -31.7654, lng: -52.3376 },
  '54': { estado: 'Rio Grande do Sul', sigla: 'RS', capital: 'Caxias do Sul', lat: -29.1678, lng: -51.1794 },
  '55': { estado: 'Rio Grande do Sul', sigla: 'RS', capital: 'Santa Maria', lat: -29.6914, lng: -53.8008 },
  
  // Distrito Federal e Goiás
  '61': { estado: 'Distrito Federal', sigla: 'DF', capital: 'Brasília', lat: -15.7801, lng: -47.9292 },
  '62': { estado: 'Goiás', sigla: 'GO', capital: 'Goiânia', lat: -16.6869, lng: -49.2648 },
  '64': { estado: 'Goiás', sigla: 'GO', capital: 'Rio Verde', lat: -17.7923, lng: -50.9292 },
  
  // Mato Grosso
  '65': { estado: 'Mato Grosso', sigla: 'MT', capital: 'Cuiabá', lat: -15.5989, lng: -56.0949 },
  '66': { estado: 'Mato Grosso', sigla: 'MT', capital: 'Rondonópolis', lat: -16.4673, lng: -54.6372 },
  
  // Mato Grosso do Sul
  '67': { estado: 'Mato Grosso do Sul', sigla: 'MS', capital: 'Campo Grande', lat: -20.4697, lng: -54.6201 },
  
  // Acre
  '68': { estado: 'Acre', sigla: 'AC', capital: 'Rio Branco', lat: -9.9754, lng: -67.8249 },
  
  // Rondônia
  '69': { estado: 'Rondônia', sigla: 'RO', capital: 'Porto Velho', lat: -8.7619, lng: -63.9039 },
  
  // Bahia
  '71': { estado: 'Bahia', sigla: 'BA', capital: 'Salvador', lat: -12.9714, lng: -38.5014 },
  '73': { estado: 'Bahia', sigla: 'BA', capital: 'Ilhéus', lat: -14.7881, lng: -39.0462 },
  '74': { estado: 'Bahia', sigla: 'BA', capital: 'Juazeiro', lat: -9.4131, lng: -40.5030 },
  '75': { estado: 'Bahia', sigla: 'BA', capital: 'Feira de Santana', lat: -12.2664, lng: -38.9663 },
  '77': { estado: 'Bahia', sigla: 'BA', capital: 'Barreiras', lat: -12.1444, lng: -44.9904 },
  
  // Sergipe
  '79': { estado: 'Sergipe', sigla: 'SE', capital: 'Aracaju', lat: -10.9472, lng: -37.0731 },
  
  // Pernambuco
  '81': { estado: 'Pernambuco', sigla: 'PE', capital: 'Recife', lat: -8.0476, lng: -34.8770 },
  '87': { estado: 'Pernambuco', sigla: 'PE', capital: 'Petrolina', lat: -9.3858, lng: -40.5008 },
  
  // Alagoas
  '82': { estado: 'Alagoas', sigla: 'AL', capital: 'Maceió', lat: -9.6498, lng: -35.7089 },
  
  // Paraíba
  '83': { estado: 'Paraíba', sigla: 'PB', capital: 'João Pessoa', lat: -7.1153, lng: -34.8610 },
  
  // Rio Grande do Norte
  '84': { estado: 'Rio Grande do Norte', sigla: 'RN', capital: 'Natal', lat: -5.7945, lng: -35.2110 },
  
  // Ceará
  '85': { estado: 'Ceará', sigla: 'CE', capital: 'Fortaleza', lat: -3.7172, lng: -38.5433 },
  '88': { estado: 'Ceará', sigla: 'CE', capital: 'Juazeiro do Norte', lat: -7.2130, lng: -39.3152 },
  
  // Piauí
  '86': { estado: 'Piauí', sigla: 'PI', capital: 'Teresina', lat: -5.0920, lng: -42.8038 },
  '89': { estado: 'Piauí', sigla: 'PI', capital: 'Picos', lat: -7.0767, lng: -41.4672 },
  
  // Maranhão
  '98': { estado: 'Maranhão', sigla: 'MA', capital: 'São Luís', lat: -2.5391, lng: -44.2829 },
  '99': { estado: 'Maranhão', sigla: 'MA', capital: 'Imperatriz', lat: -5.5267, lng: -47.4913 },
  
  // Pará
  '91': { estado: 'Pará', sigla: 'PA', capital: 'Belém', lat: -1.4558, lng: -48.4902 },
  '93': { estado: 'Pará', sigla: 'PA', capital: 'Santarém', lat: -2.4412, lng: -54.7281 },
  '94': { estado: 'Pará', sigla: 'PA', capital: 'Marabá', lat: -5.3683, lng: -49.1177 },
  
  // Amazonas
  '92': { estado: 'Amazonas', sigla: 'AM', capital: 'Manaus', lat: -3.1190, lng: -60.0217 },
  '97': { estado: 'Amazonas', sigla: 'AM', capital: 'Coari', lat: -4.0850, lng: -63.1411 },
  
  // Roraima
  '95': { estado: 'Roraima', sigla: 'RR', capital: 'Boa Vista', lat: 2.8235, lng: -60.6758 },
  
  // Amapá
  '96': { estado: 'Amapá', sigla: 'AP', capital: 'Macapá', lat: 0.0356, lng: -51.0705 },
  
  // Tocantins
  '63': { estado: 'Tocantins', sigla: 'TO', capital: 'Palmas', lat: -10.1689, lng: -48.3317 },
};

/**
 * Extrai o DDD de um telefone no formato brasileiro
 * Ex: "5511991890603" → "11"
 */
export function extrairDDD(telefone: string): string | null {
  if (!telefone) return null;
  
  const cleaned = telefone.replace(/\D/g, '');
  
  // Telefone com código do país (55)
  if (cleaned.startsWith('55') && cleaned.length >= 4) {
    return cleaned.substring(2, 4);
  }
  
  // Telefone sem código do país
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return cleaned.substring(0, 2);
  }
  
  return null;
}

/**
 * Obtém informações do estado baseado no DDD
 */
export function getEstadoPorDDD(ddd: string) {
  return DDD_ESTADO[ddd] || null;
}

/**
 * Obtém estado do usuário baseado no telefone
 */
export function getEstadoPorTelefone(telefone: string) {
  const ddd = extrairDDD(telefone);
  if (!ddd) return null;
  return getEstadoPorDDD(ddd);
}
