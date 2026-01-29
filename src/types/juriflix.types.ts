export interface JuriFlixTituloEnriquecido {
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
  
  // Campos enriquecidos do TMDB
  tmdb_id?: number | null;
  tipo_tmdb?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  titulo_original?: string | null;
  popularidade?: number | null;
  votos_count?: number | null;
  elenco?: Array<{
    nome: string;
    personagem: string;
    foto: string | null;
  }> | null;
  diretor?: string | null;
  generos?: string[] | null;
  duracao?: number | null;
  orcamento?: number | null;
  bilheteria?: number | null;
  tagline?: string | null;
  idioma_original?: string | null;
  videos?: Array<{
    chave: string;
    nome: string;
    tipo: string;
    site: string;
    url: string;
  }> | null;
  onde_assistir?: {
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string | null;
      display_priority?: number;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string | null;
      display_priority?: number;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string | null;
      display_priority?: number;
    }>;
    link?: string | null;
  } | null;
  similares?: Array<{
    tmdb_id: number;
    titulo: string;
    poster: string | null;
  }> | null;
  ultima_atualizacao?: string | null;
}