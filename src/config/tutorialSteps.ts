import { Step } from 'react-joyride';

export interface TutorialConfig {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  rota: string;
  steps: Step[];
}

export const tutorialSteps: Record<string, TutorialConfig> = {
  'pagina-inicial': {
    id: 'pagina-inicial',
    titulo: 'Página Inicial',
    descricao: 'Conheça as principais funcionalidades do app',
    icone: 'Home',
    rota: '/',
    steps: [
      {
        target: '[data-tutorial="busca-principal"]',
        title: '🔍 Busca Rápida',
        content: 'A busca inteligente do app permite encontrar qualquer conteúdo jurídico em segundos.\n\n📌 O que você pode buscar:\n• Artigos de leis (ex: "Art. 121 CP")\n• Termos jurídicos (ex: "habeas corpus")\n• Súmulas (ex: "Súmula 301")\n• Qualquer funcionalidade do app\n\n💡 Dica: Digite apenas palavras-chave como "furto" ou "prisão" para ver todos os resultados relacionados.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="em-alta"]',
        title: '🔥 Em Alta',
        content: 'Acesso rápido às funcionalidades mais utilizadas pelos estudantes de Direito.\n\n📌 O que você encontra aqui:\n• Vade Mecum - Todos os códigos e leis atualizados\n• Questões - Pratique com questões de concursos\n• Cursos - Videoaulas organizadas por tema\n• Blog Jurídico - Guias para carreiras jurídicas\n\n💡 Dica: Use o Vade Mecum diariamente para estudar artigos e o Blog para conhecer as carreiras.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="estudos"]',
        title: '📚 Estudos',
        content: 'Ferramentas completas para potencializar seus estudos jurídicos.\n\n📌 Funcionalidades disponíveis:\n• Flashcards - Memorize conceitos com repetição espaçada\n• Resumos - Resumos prontos de todas as áreas\n• Bibliotecas - Acervo de livros jurídicos\n• Mapa Mental - Visualize conexões entre temas\n• Plano de Estudos - Organize sua rotina\n• Videoaulas - Aprenda assistindo\n\n💡 Dica: Combine Flashcards + Questões para fixar melhor o conteúdo!',
        placement: 'top',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="cursos"]',
        title: '🎓 Cursos em Destaque',
        content: 'Videoaulas gratuitas para dominar o Direito do básico ao avançado.\n\n📌 O que você aprende:\n• Direito Constitucional, Penal, Civil e mais\n• Aulas organizadas por módulos\n• Conteúdo atualizado para concursos\n• Acompanhe seu progresso\n\n💡 Como usar: Escolha uma área, assista às aulas em ordem e faça questões após cada módulo para fixar.',
        placement: 'top',
        disableBeacon: true,
      },
    ]
  },
  
  'vade-mecum': {
    id: 'vade-mecum',
    titulo: 'Vade Mecum',
    descricao: 'Aprenda a navegar pelos códigos e leis',
    icone: 'Scale',
    rota: '/vade-mecum',
    steps: [
      {
        target: '[data-tutorial="busca-lei"]',
        title: '🔍 Buscar Lei',
        content: 'Encontre qualquer artigo ou lei instantaneamente.\n\n📌 Formas de pesquisar:\n• Por número: "Art. 121" ou apenas "121"\n• Por palavra-chave: "homicídio", "furto"\n• Por lei: "13.869" ou "13869" (ambos funcionam)\n• Por súmula: "Súmula Vinculante 11"\n\n💡 Exemplo prático: Digite "prescrição" para ver todos os artigos sobre prescrição em qualquer código.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="categoria-codigos"]',
        title: '📘 Códigos e Leis',
        content: 'Acesse os principais códigos brasileiros completos e atualizados.\n\n📌 Códigos disponíveis:\n• Código Penal (CP)\n• Código Civil (CC)\n• Código de Processo Penal (CPP)\n• Código de Processo Civil (CPC)\n• CLT, CTB, CDC e muitos outros\n\n💡 Dica: Cada artigo tem narração em áudio, explicação simplificada e questões relacionadas. Aproveite!',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="categoria-estatutos"]',
        title: '📗 Estatutos',
        content: 'Legislação especial organizada por tema.\n\n📌 Estatutos incluídos:\n• ECA - Estatuto da Criança e Adolescente\n• Estatuto do Idoso\n• Estatuto da Pessoa com Deficiência\n• Estatuto do Desarmamento\n• Estatuto da Igualdade Racial\n\n💡 Exemplo: No ECA, você encontra artigos sobre medidas socioeducativas, guarda, adoção e muito mais.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="categoria-leis"]',
        title: '📕 Leis Ordinárias',
        content: 'Leis federais importantes para concursos e prática jurídica.\n\n📌 Leis disponíveis:\n• Lei de Improbidade Administrativa\n• LGPD - Proteção de Dados\n• Lei de Licitações\n• Lei de Responsabilidade Fiscal\n• Lei de Acesso à Informação\n\n💡 Como estudar: Leia o artigo, ouça a narração e depois teste seu conhecimento com as questões.',
        placement: 'top',
        disableBeacon: true,
      },
    ]
  },
  
  'codigo-penal': {
    id: 'codigo-penal',
    titulo: 'Código Penal',
    descricao: 'Funcionalidades dentro de um código',
    icone: 'Gavel',
    rota: '/vade-mecum/codigos/cp',
    steps: [
      {
        target: '[data-tutorial="busca-artigo"]',
        title: '🔍 Buscar Artigo',
        content: 'Encontre rapidamente qualquer artigo do código.\n\n📌 Como pesquisar:\n• Por número: "121", "155", "157"\n• Por crime: "homicídio", "furto", "roubo"\n• Por pena: "reclusão", "detenção"\n\n💡 Exemplo: Digite "estelionato" para ir direto ao Art. 171 e crimes relacionados.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="contador-artigos"]',
        title: '📊 Contadores',
        content: 'Acompanhe o conteúdo disponível no código.\n\n📌 Informações exibidas:\n• Total de artigos do código\n• Artigos com narração em áudio\n• Seu progresso de leitura\n\n💡 Dica: Artigos com 🔊 possuem áudio - ótimo para estudar no transporte ou academia!',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="lista-artigos"]',
        title: '📜 Lista de Artigos',
        content: 'Navegue pelos artigos e explore todo o conteúdo.\n\n📌 Ao clicar em um artigo você pode:\n• Ler o texto completo da lei\n• Ouvir a narração em áudio\n• Ver explicação simplificada\n• Consultar termos jurídicos\n• Resolver questões de concurso\n\n💡 Exemplo prático: Clique no Art. 121 (Homicídio), leia o artigo, ouça o áudio e depois resolva as questões para fixar.',
        placement: 'top',
        disableBeacon: true,
      },
    ]
  },
  
  'flashcards': {
    id: 'flashcards',
    titulo: 'Flashcards',
    descricao: 'Como usar os flashcards de estudo',
    icone: 'Sparkles',
    rota: '/flashcards',
    steps: [
      {
        target: '[data-tutorial="categorias-flashcards"]',
        title: '📚 Tipos de Flashcards',
        content: 'Escolha o formato ideal para seu estudo.\n\n📌 Opções disponíveis:\n• Artigos da Lei - Cards com artigos do Vade Mecum\n• Áreas do Direito - Cards por matéria (Penal, Civil, etc.)\n• Complete a Lei - Preencha lacunas nos artigos\n\n💡 Como usar: Comece pelos "Artigos da Lei" do código que você está estudando. Revise diariamente para memorização de longo prazo.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="lista-temas"]',
        title: '📋 Escolher Tema',
        content: 'Selecione a matéria ou código para estudar.\n\n📌 Temas disponíveis:\n• Código Penal, Civil, Constitucional\n• Estatutos e Leis Especiais\n• Direito Administrativo, Tributário\n• E muito mais!\n\n💡 Exemplo prático: Está estudando Direito Penal? Selecione "Código Penal", escolha 20 cards e estude por 15 minutos. Repita amanhã os cards que errou.',
        placement: 'top',
        disableBeacon: true,
      },
    ]
  },

  'ferramentas': {
    id: 'ferramentas',
    titulo: 'Ferramentas',
    descricao: 'Conheça todas as ferramentas disponíveis',
    icone: 'Wrench',
    rota: '/ferramentas',
    steps: [
      {
        target: '[data-tutorial="ferramenta-calculadoras"]',
        title: '🧮 Calculadoras Jurídicas',
        content: 'Ferramentas práticas para o dia a dia jurídico.\n\n📌 Calculadoras disponíveis:\n• Prazos processuais\n• Correção monetária\n• Honorários advocatícios\n• Prescrição e decadência\n\n💡 Exemplo: Precisa calcular um prazo? Informe a data inicial e o tipo de prazo (dias úteis/corridos) e o app calcula automaticamente.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="ferramenta-questoes"]',
        title: '❓ Questões de Concurso',
        content: 'Pratique com questões reais de provas anteriores.\n\n📌 O que você encontra:\n• Questões por tema/matéria\n• Questões por artigo de lei\n• Gabarito comentado\n• Estatísticas de desempenho\n\n💡 Como usar: Estude um tema no Vade Mecum, depois resolva questões sobre aquele tema. Revise os erros para não repetir!',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="ferramenta-simulados"]',
        title: '📝 Simulados',
        content: 'Teste seus conhecimentos em provas completas.\n\n📌 Tipos de simulados:\n• Por concurso (OAB, Magistratura, etc.)\n• Por matéria específica\n• Personalizados\n\n💡 Dica: Faça um simulado semanal para treinar tempo de prova e identificar pontos fracos. Revise as questões erradas no dia seguinte.',
        placement: 'bottom',
        disableBeacon: true,
      },
    ]
  },

  'resumos': {
    id: 'resumos',
    titulo: 'Resumos Jurídicos',
    descricao: 'Como navegar pelos resumos',
    icone: 'FileText',
    rota: '/resumos-juridicos',
    steps: [
      {
        target: '[data-tutorial="areas-resumos"]',
        title: '📂 Áreas do Direito',
        content: 'Resumos organizados por área para facilitar seus estudos.\n\n📌 Áreas disponíveis:\n• Direito Constitucional\n• Direito Penal e Processo Penal\n• Direito Civil e Processo Civil\n• Direito Administrativo\n• Direito do Trabalho\n• E muitas outras!\n\n💡 Como usar: Escolha a área, depois o tema específico. Use os resumos para revisão rápida antes de provas.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tutorial="busca-resumos"]',
        title: '🔍 Buscar Tema',
        content: 'Encontre resumos específicos rapidamente.\n\n📌 O que você pode buscar:\n• Nome do tema: "Direitos Fundamentais"\n• Instituto jurídico: "Prescrição"\n• Área: "Penal"\n\n💡 Exemplo prático: Precisa revisar contratos? Digite "contratos" e veja todos os resumos relacionados: formação, extinção, espécies, etc.',
        placement: 'bottom',
        disableBeacon: true,
      },
    ]
  },
};

export const getTutorialById = (id: string): TutorialConfig | undefined => {
  return tutorialSteps[id];
};

export const getAllTutorials = (): TutorialConfig[] => {
  return Object.values(tutorialSteps);
};
