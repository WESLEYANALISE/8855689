import { supabase } from "@/integrations/supabase/client";

// ========== TYPES ==========

export interface Gazette {
  territory_id: string;
  territory_name: string;
  state_code: string;
  date: string;
  edition_number?: string;
  is_extra_edition: boolean;
  power: string;
  file_checksum?: string;
  file_path?: string;
  file_url?: string;
  scraped_at: string;
  created_at: string;
  txt_url?: string;
  excerpts?: string[];
  highlight_texts?: string[];
}

export interface GazettesResponse {
  total_gazettes: number;
  gazettes: Gazette[];
}

export interface City {
  territory_id: string;
  territory_name: string;
  state_code: string;
  publication_urls?: string[];
  level?: string;
}

export interface CitiesResponse {
  cities: City[];
}

export interface CompanyInfo {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_principal?: {
    codigo: string;
    descricao: string;
  };
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  capital_social?: number;
  porte?: string;
  natureza_juridica?: string;
}

export interface Partner {
  nome: string;
  cpf_cnpj?: string;
  qualificacao?: string;
  data_entrada?: string;
}

export interface Theme {
  name: string;
  slug: string;
  subthemes?: string[];
  entities?: string[];
}

export interface ThemeGazette extends Gazette {
  theme: string;
  subthemes?: string[];
  entities?: string[];
}

// ========== API FUNCTIONS ==========

async function callQueridoDiario(action: string, params: Record<string, any> = {}) {
  console.log(`📰 Chamando Querido Diário: ${action}`, params);
  
  const { data, error } = await supabase.functions.invoke('querido-diario', {
    body: { action, params }
  });

  if (error) {
    console.error('Erro na chamada:', error);
    throw new Error(error.message || 'Erro ao chamar API');
  }

  if (!data.success) {
    throw new Error(data.error || 'Erro desconhecido');
  }

  return data.data;
}

// ========== BUSCA EM DIÁRIOS ==========

export interface BuscarGazettesParams {
  territory_ids?: string[];
  querystring?: string;
  published_since?: string; // YYYY-MM-DD
  published_until?: string; // YYYY-MM-DD
  scraped_since?: string;
  scraped_until?: string;
  size?: number;
  offset?: number;
  sort_by?: 'descending_date' | 'ascending_date' | 'relevance';
}

export async function buscarDiarios(params: BuscarGazettesParams): Promise<GazettesResponse> {
  return await callQueridoDiario('buscar_gazettes', params);
}

// ========== BUSCA POR TEMA ==========

export interface BuscarPorTemaParams {
  theme: 'licitacao' | 'servidor_publico' | 'educacao' | 'saude' | 'transporte';
  territory_ids?: string[];
  subthemes?: string[];
  entities?: string[];
  published_since?: string;
  published_until?: string;
  size?: number;
  offset?: number;
}

export async function buscarPorTema(params: BuscarPorTemaParams): Promise<GazettesResponse> {
  return await callQueridoDiario('buscar_por_tema', params);
}

// ========== LISTAR TEMAS ==========

export async function listarTemas(): Promise<Theme[]> {
  return await callQueridoDiario('listar_temas');
}

// ========== BUSCAR CIDADES ==========

export async function buscarCidades(cityName: string): Promise<CitiesResponse> {
  return await callQueridoDiario('buscar_cidades', { city_name: cityName });
}

// ========== DETALHES DA CIDADE ==========

export async function detalhesCidade(territoryId: string): Promise<City> {
  return await callQueridoDiario('detalhes_cidade', { territory_id: territoryId });
}

// ========== CONSULTA CNPJ ==========

export async function consultarCnpj(cnpj: string): Promise<CompanyInfo | null> {
  return await callQueridoDiario('consultar_cnpj', { cnpj });
}

// ========== SÓCIOS DA EMPRESA ==========

export async function buscarSocios(cnpj: string): Promise<Partner[]> {
  const result = await callQueridoDiario('buscar_socios', { cnpj });
  return result?.partners || [];
}

// ========== AGREGADOS POR ESTADO ==========

export interface StateAggregates {
  state_code: string;
  total_cities: number;
  cities_with_gazettes: number;
  total_gazettes: number;
}

export async function agregadosEstado(stateCode: string): Promise<StateAggregates> {
  return await callQueridoDiario('agregados_estado', { state_code: stateCode });
}

// ========== HELPERS ==========

export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

export const ESTADOS_BRASIL = [
  { codigo: 'AC', nome: 'Acre' },
  { codigo: 'AL', nome: 'Alagoas' },
  { codigo: 'AP', nome: 'Amapá' },
  { codigo: 'AM', nome: 'Amazonas' },
  { codigo: 'BA', nome: 'Bahia' },
  { codigo: 'CE', nome: 'Ceará' },
  { codigo: 'DF', nome: 'Distrito Federal' },
  { codigo: 'ES', nome: 'Espírito Santo' },
  { codigo: 'GO', nome: 'Goiás' },
  { codigo: 'MA', nome: 'Maranhão' },
  { codigo: 'MT', nome: 'Mato Grosso' },
  { codigo: 'MS', nome: 'Mato Grosso do Sul' },
  { codigo: 'MG', nome: 'Minas Gerais' },
  { codigo: 'PA', nome: 'Pará' },
  { codigo: 'PB', nome: 'Paraíba' },
  { codigo: 'PR', nome: 'Paraná' },
  { codigo: 'PE', nome: 'Pernambuco' },
  { codigo: 'PI', nome: 'Piauí' },
  { codigo: 'RJ', nome: 'Rio de Janeiro' },
  { codigo: 'RN', nome: 'Rio Grande do Norte' },
  { codigo: 'RS', nome: 'Rio Grande do Sul' },
  { codigo: 'RO', nome: 'Rondônia' },
  { codigo: 'RR', nome: 'Roraima' },
  { codigo: 'SC', nome: 'Santa Catarina' },
  { codigo: 'SP', nome: 'São Paulo' },
  { codigo: 'SE', nome: 'Sergipe' },
  { codigo: 'TO', nome: 'Tocantins' },
];

export const TEMAS_DISPONIVEIS = [
  { slug: 'licitacao', nome: 'Licitações', icon: '📋' },
  { slug: 'servidor_publico', nome: 'Servidor Público', icon: '👤' },
  { slug: 'educacao', nome: 'Educação', icon: '📚' },
  { slug: 'saude', nome: 'Saúde', icon: '🏥' },
  { slug: 'transporte', nome: 'Transporte', icon: '🚌' },
];
