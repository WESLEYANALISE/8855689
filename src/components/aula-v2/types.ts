// Types for the new interactive lesson system v2 - ENHANCED

export interface TermoDefinicao {
  termo: string;
  definicao: string;
}

export interface TopicoDetalhe {
  titulo: string;
  detalhe: string;
}

// For tabela slides
export interface TabelaData {
  cabecalhos: string[];
  linhas: string[][];
}

// For linha_tempo slides
export interface EtapaTimeline {
  titulo: string;
  descricao: string;
}

// For mapa_mental slides
export interface ConceitoMental {
  central: string;
  relacionados: string[];
}

export interface SlideContent {
  tipo: 'texto' | 'termos' | 'explicacao' | 'atencao' | 'exemplo' | 'quickcheck' | 'caso' | 'introducao'
    | 'storytelling'      // Narrativa envolvente com personagens
    | 'tabela'            // Tabela comparativa
    | 'linha_tempo'       // Evolução histórica/etapas/procedimentos
    | 'mapa_mental'       // Conceitos relacionados
    | 'dica_estudo'       // Dica de memorização
    | 'resumo_visual'     // Resumo com pontos principais
    | 'resumo';           // Alias para resumo_visual
  titulo?: string;
  conteudo: string;
  icone?: string;
  
  // For termos slides
  termos?: TermoDefinicao[];
  
  // For explicacao slides with detailed topics
  topicos?: TopicoDetalhe[];
  
  // For exemplo slides
  contexto?: string; // e.g., "Situação cotidiana" or "Jurisprudência"
  
  // For quickcheck slides
  pergunta?: string;
  opcoes?: string[];
  resposta?: number;
  feedback?: string;
  
  // For storytelling slides
  personagem?: string;   // "Maria", "João", "Pedro"
  narrativa?: string;
  
  // For tabela slides
  tabela?: TabelaData;
  
  // For linha_tempo slides
  etapas?: EtapaTimeline[];
  
  // For mapa_mental slides
  conceitos?: ConceitoMental[];
  
  // For dica_estudo slides
  tecnica?: string;      // "Mnemônico", "Associação", "Visualização"
  dica?: string;
  
  // For resumo_visual slides
  pontos?: string[];
  
  // Image fields for storytelling and exemplo slides
  imagemUrl?: string;      // URL da imagem gerada
  imagemLoading?: boolean; // Se está carregando a imagem
}

export interface Secao {
  id: number;
  tipo: 'caput' | 'inciso' | 'paragrafo' | 'alinea' | 'item';
  trechoOriginal: string;
  titulo?: string;
  slides: SlideContent[];
}

export interface AtividadesFinais {
  matching: Array<{ termo: string; definicao: string }>;
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
    fonte?: string;
  }>;
}

export interface AulaEstruturaV2 {
  versao: 2;
  titulo: string;
  tempoEstimado: string;
  area?: string;
  descricao?: string;
  objetivos: string[];
  secoes: Secao[];
  atividadesFinais: AtividadesFinais;
  provaFinal: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
    tempoLimite?: number;
  }>;
  aulaId?: string;
  cached?: boolean;
  // Image cache
  imagensCache?: Record<string, string>; // key: "secaoId-slideIndex", value: imageUrl
  // Audio cache
  audiosCache?: Record<string, string>; // key: "secaoId-slideIndex", value: audioUrl
}

export type EtapaAulaV2 = 
  | 'loading' 
  | 'intro' 
  | 'secao' 
  | 'matching' 
  | 'flashcards' 
  | 'quiz' 
  | 'provaFinal' 
  | 'resultado';
