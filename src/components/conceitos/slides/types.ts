// Tipos para o sistema de Slides Interativos de Conceitos

export interface CollapsibleItem {
  titulo: string;
  conteudo: string;
  icone?: string;
}

export interface EtapaTimeline {
  titulo: string;
  descricao: string;
}

export interface TermoDefinicao {
  termo: string;
  definicao: string;
}

export interface TabelaData {
  cabecalhos: string[];
  linhas: string[][];
}

export interface ConceitoSlide {
  tipo: 
    | 'introducao'      // Slide de abertura com título e objetivos
    | 'texto'           // Texto explicativo simples
    | 'termos'          // Lista de termos e definições
    | 'explicacao'      // Explicação detalhada com tópicos
    | 'collapsible'     // Menu suspenso interativo
    | 'linha_tempo'     // Timeline/etapas
    | 'tabela'          // Tabela comparativa
    | 'atencao'         // Ponto de atenção importante
    | 'dica'            // Dica de estudo/memorização
    | 'caso'            // Caso prático/exemplo
    | 'resumo'          // Resumo com pontos principais
    | 'quickcheck';     // Mini-quiz rápido
  
  titulo: string;
  conteudo: string;
  icone?: string;
  
  // Para tipo 'collapsible' (menu suspenso)
  collapsibleItems?: CollapsibleItem[];
  
  // Para tipo 'linha_tempo'
  etapas?: EtapaTimeline[];
  
  // Para tipo 'termos'
  termos?: TermoDefinicao[];
  
  // Para tipo 'tabela'
  tabela?: TabelaData;
  
  // Para tipo 'quickcheck'
  pergunta?: string;
  opcoes?: string[];
  resposta?: number;
  feedback?: string;
  
  // Para tipo 'resumo'
  pontos?: string[];
  
  // Imagem do slide
  imagemPrompt?: string;  // Prompt para gerar a imagem (usado no batch)
  imagemUrl?: string;     // URL após geração
  imagemLoading?: boolean; // Se está carregando
}

export interface ConceitoSecao {
  id: number;
  titulo: string;
  slides: ConceitoSlide[];
}

export interface ConceitoSlidesData {
  versao: number;
  titulo: string;
  tempoEstimado?: string;
  area?: string;
  objetivos?: string[];
  secoes: ConceitoSecao[];
  imagensParaBatch?: Array<{
    slideId: string;
    prompt: string;
  }>;
}

// Props compartilhadas para os componentes de slide
export interface SlideCardProps {
  slide: ConceitoSlide;
  isActive?: boolean;
  onInteraction?: () => void;
}

// Estado do viewer
export interface SlidesViewerState {
  secaoAtual: number;
  slideAtual: number;
  slidesVisitados: Set<string>;
  interacoesRealizadas: Set<string>;
}
