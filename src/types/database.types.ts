export interface AudioAula {
  id: number;
  sequencia: number | null;
  area: string | null;
  tema: string | null;
  titulo: string | null;
  descricao: string | null;
  url_audio: string | null;
  imagem_miniatura: string | null;
  tag: string | null;
}

export interface JuriFlixTitulo {
  id: number;
  ano: number | null;
  tipo: string | null;
  nome: string | null;
  "link Video": string | null;
  sinopse: string | null;
  nota: string | null;
  plataforma: string | null;
  capa: string | null;
  beneficios: string | null;
  link: string | null;
  trailer: string | null;
}

export interface EstagioVaga {
  id: string;
  titulo: string;
  empresa: string;
  local: string | null;
  estado: string | null;
  descricao: string | null;
  area_direito: string | null;
  tipo_vaga: string | null;
  requisitos: string[] | null;
  beneficios: string | null;
  link_candidatura: string | null;
  remuneracao: string | null;
  carga_horaria: string | null;
  data_publicacao: string;
  ativo: boolean;
  origem: string;
  created_at: string;
}

export interface EstagioDica {
  id: string;
  titulo: string;
  categoria: string;
  conteudo: string;
  icone: string | null;
  ordem: number | null;
  created_at: string;
}

export interface AulaInterativa {
  id: string;
  area: string;
  tema: string;
  titulo: string;
  descricao: string | null;
  estrutura_completa: any;
  created_at: string;
  updated_at: string;
  visualizacoes: number;
  aproveitamento_medio: number | null;
}

export interface AulaProgresso {
  id: string;
  user_id: string;
  aula_id: string;
  modulo_atual: number;
  etapa_atual: string;
  progresso_percentual: number;
  nota_prova_final: number | null;
  concluida: boolean;
  tempo_total_minutos: number;
  created_at: string;
  updated_at: string;
}
