// Mapa de Perguntas Frequentes com contexto direcionado
// Usado para identificar e responder FAQs de forma otimizada

export interface FAQMatch {
  pergunta: string;
  contexto: string;
  areasRelacionadas: string[];
  artigos?: string[];
}

export const FAQ_MAP: Record<string, FAQMatch> = {
  // === DIREITO PENAL ===
  "legitima defesa": {
    pergunta: "O que é legítima defesa?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre LEGÍTIMA DEFESA:
- Definição técnica completa (Art. 25 do CP)
- Requisitos: agressão atual/iminente, injusta, uso moderado dos meios, defesa de direito próprio ou de terceiro
- Excludentes de ilicitude relacionadas
- Legítima defesa real vs putativa
- Excesso na legítima defesa (doloso e culposo)
- Exemplo prático com caso concreto
- Jurisprudência relevante do STJ/STF`,
    areasRelacionadas: ["Direito Penal", "Excludentes de Ilicitude"],
    artigos: ["Art. 25 do CP"]
  },
  
  "dolo e culpa": {
    pergunta: "Qual a diferença entre dolo e culpa?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre DOLO E CULPA:
- Dolo direto (Art. 18, I, CP): vontade de produzir o resultado
- Dolo eventual: assume o risco de produzir
- Culpa consciente: prevê mas não aceita
- Culpa inconsciente: não prevê mas era previsível
- Modalidades: negligência, imprudência, imperícia
- Diferença prática entre dolo eventual e culpa consciente
- Exemplos claros de cada tipo
- Como isso afeta a pena`,
    areasRelacionadas: ["Direito Penal", "Teoria do Crime"],
    artigos: ["Art. 18 do CP"]
  },
  
  "crimes hediondos": {
    pergunta: "O que são crimes hediondos?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre CRIMES HEDIONDOS:
- Lei 8.072/90 - Lei dos Crimes Hediondos
- Rol taxativo dos crimes hediondos
- Equiparados: tortura, tráfico, terrorismo
- Vedações: anistia, graça, indulto, fiança
- Regime de cumprimento de pena
- Progressão de regime (frações atuais)
- Alterações recentes pela Lei 13.964/19 (Pacote Anticrime)`,
    areasRelacionadas: ["Direito Penal", "Execução Penal"],
    artigos: ["Lei 8.072/90"]
  },
  
  "principio legalidade": {
    pergunta: "O que é o princípio da legalidade penal?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre PRINCÍPIO DA LEGALIDADE:
- Nullum crimen, nulla poena sine lege
- Previsão constitucional (Art. 5º, XXXIX, CF)
- Previsão no Código Penal (Art. 1º)
- Desdobramentos: anterioridade, taxatividade, escrita, estrita
- Proibição da analogia in malam partem
- Irretroatividade da lei penal mais grave
- Retroatividade benéfica (lex mitior)`,
    areasRelacionadas: ["Direito Penal", "Princípios"],
    artigos: ["Art. 5º, XXXIX, CF", "Art. 1º do CP"]
  },

  // === DIREITO CONSTITUCIONAL ===
  "clausulas petreas": {
    pergunta: "O que são cláusulas pétreas?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre CLÁUSULAS PÉTREAS:
- Definição: núcleo imodificável da Constituição
- Previsão: Art. 60, §4º da CF/88
- Rol das cláusulas pétreas:
  * Forma federativa de Estado
  * Voto direto, secreto, universal e periódico
  * Separação dos Poderes
  * Direitos e garantias individuais
- Tendentes a abolir vs simples modificação
- Cláusulas pétreas implícitas
- Limites ao poder constituinte derivado`,
    areasRelacionadas: ["Direito Constitucional", "Poder Constituinte"],
    artigos: ["Art. 60, §4º, CF"]
  },
  
  "controle constitucionalidade": {
    pergunta: "O que é controle de constitucionalidade?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre CONTROLE DE CONSTITUCIONALIDADE:
- Controle difuso (incidental, concreto): qualquer juiz
- Controle concentrado (abstrato): STF
- ADI - Ação Direta de Inconstitucionalidade
- ADC - Ação Declaratória de Constitucionalidade
- ADPF - Arguição de Descumprimento de Preceito Fundamental
- ADO - Ação Direta de Inconstitucionalidade por Omissão
- Legitimados ativos (Art. 103, CF)
- Efeitos das decisões (erga omnes, ex tunc/ex nunc, vinculante)
- Modulação de efeitos`,
    areasRelacionadas: ["Direito Constitucional"],
    artigos: ["Art. 102, I, CF", "Art. 103, CF"]
  },
  
  "direitos fundamentais": {
    pergunta: "O que são direitos fundamentais?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre DIREITOS FUNDAMENTAIS:
- Conceito e características (universalidade, historicidade, inalienabilidade, etc.)
- Gerações/dimensões dos direitos fundamentais
- Direitos individuais (Art. 5º, CF)
- Direitos sociais (Art. 6º, CF)
- Direitos políticos
- Eficácia horizontal dos direitos fundamentais
- Aplicabilidade imediata (Art. 5º, §1º)
- Tratados de direitos humanos (Art. 5º, §3º)`,
    areasRelacionadas: ["Direito Constitucional", "Direitos Humanos"],
    artigos: ["Art. 5º, CF", "Art. 6º, CF"]
  },
  
  "principios fundamentais": {
    pergunta: "Quais são os princípios fundamentais da CF?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre PRINCÍPIOS FUNDAMENTAIS:
- Fundamentos da República (Art. 1º, CF): soberania, cidadania, dignidade, valores sociais, pluralismo
- Separação dos Poderes (Art. 2º)
- Objetivos fundamentais (Art. 3º)
- Princípios das relações internacionais (Art. 4º)
- Diferença entre fundamentos, objetivos e princípios
- Aplicação prática desses princípios`,
    areasRelacionadas: ["Direito Constitucional"],
    artigos: ["Art. 1º a 4º, CF"]
  },

  // === DIREITO CIVIL ===
  "usucapiao": {
    pergunta: "O que é usucapião?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre USUCAPIÃO:
- Conceito: modo originário de aquisição da propriedade
- Requisitos gerais: posse, tempo, ânimo de dono
- Modalidades:
  * Extraordinária (Art. 1.238, CC): 15 anos ou 10 anos com moradia/trabalho
  * Ordinária (Art. 1.242, CC): 10 anos com justo título e boa-fé
  * Especial urbana (Art. 183, CF): 5 anos, até 250m²
  * Especial rural (Art. 191, CF): 5 anos, até 50 hectares
  * Familiar (Art. 1.240-A, CC): 2 anos
- Usucapião extrajudicial (Lei 13.105/15)
- Bens que podem e não podem ser usucapidos`,
    areasRelacionadas: ["Direito Civil", "Direitos Reais"],
    artigos: ["Arts. 1.238 a 1.244, CC", "Arts. 183 e 191, CF"]
  },
  
  "responsabilidade civil": {
    pergunta: "O que é responsabilidade civil?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre RESPONSABILIDADE CIVIL:
- Conceito: obrigação de reparar o dano
- Elementos: conduta, dano, nexo causal, culpa (quando subjetiva)
- Responsabilidade SUBJETIVA (Art. 186, CC): exige culpa
- Responsabilidade OBJETIVA (Art. 927, parágrafo único, CC): independe de culpa
- Teoria do risco
- Excludentes: culpa exclusiva da vítima, caso fortuito, força maior
- Dano moral e material
- Lucros cessantes e danos emergentes
- Responsabilidade contratual vs extracontratual`,
    areasRelacionadas: ["Direito Civil", "Responsabilidade Civil"],
    artigos: ["Arts. 186, 187, 927, CC"]
  },
  
  "pessoa fisica juridica": {
    pergunta: "Qual a diferença entre pessoa física e jurídica?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre PESSOA FÍSICA E JURÍDICA:
- Pessoa Natural/Física: ser humano
  * Início da personalidade (Art. 2º, CC)
  * Capacidade de direito e de fato
  * Incapacidade absoluta e relativa
- Pessoa Jurídica: ente abstrato
  * Tipos: direito público e privado (Art. 40, CC)
  * Constituição: contrato social, estatuto
  * Teoria da desconsideração (Art. 50, CC)
  * Responsabilidade da pessoa jurídica`,
    areasRelacionadas: ["Direito Civil", "Parte Geral"],
    artigos: ["Arts. 1º a 78, CC"]
  },
  
  "direitos personalidade": {
    pergunta: "O que são direitos da personalidade?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre DIREITOS DA PERSONALIDADE:
- Conceito: direitos inerentes à pessoa humana
- Características: intransmissíveis, irrenunciáveis, imprescritíveis
- Rol exemplificativo (Arts. 11 a 21, CC)
- Direito ao nome, imagem, honra, intimidade, vida privada
- Proteção do corpo humano
- Direitos post mortem
- Dano moral por violação`,
    areasRelacionadas: ["Direito Civil", "Direitos Fundamentais"],
    artigos: ["Arts. 11 a 21, CC"]
  },

  // === DIREITO ADMINISTRATIVO ===
  "principios administrativo": {
    pergunta: "Quais são os princípios do Direito Administrativo?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre PRINCÍPIOS DO DIREITO ADMINISTRATIVO:
- LIMPE (Art. 37, caput, CF):
  * Legalidade
  * Impessoalidade
  * Moralidade
  * Publicidade
  * Eficiência
- Princípios implícitos:
  * Supremacia do interesse público
  * Indisponibilidade do interesse público
  * Razoabilidade e proporcionalidade
  * Autotutela (Súmula 473, STF)
  * Segurança jurídica
- Aplicação prática de cada princípio`,
    areasRelacionadas: ["Direito Administrativo"],
    artigos: ["Art. 37, CF"]
  },
  
  "licitacao": {
    pergunta: "O que é licitação?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre LICITAÇÃO:
- Conceito: procedimento para contratar com a Administração
- Nova Lei de Licitações: Lei 14.133/2021
- Princípios específicos
- Modalidades da nova lei:
  * Pregão
  * Concorrência
  * Concurso
  * Leilão
  * Diálogo competitivo
- Critérios de julgamento
- Dispensa e inexigibilidade
- Fases do procedimento`,
    areasRelacionadas: ["Direito Administrativo", "Contratos Públicos"],
    artigos: ["Lei 14.133/2021"]
  },
  
  "atos administrativos": {
    pergunta: "O que são atos administrativos?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre ATOS ADMINISTRATIVOS:
- Conceito: manifestação unilateral de vontade da Administração
- Elementos/requisitos: competência, finalidade, forma, motivo, objeto
- Atributos: presunção de legitimidade, imperatividade, autoexecutoriedade, tipicidade
- Classificações: vinculado x discricionário
- Espécies: normativos, ordinatórios, negociais, enunciativos, punitivos
- Extinção: anulação, revogação, cassação, caducidade
- Convalidação de atos`,
    areasRelacionadas: ["Direito Administrativo"],
    artigos: ["Art. 37, CF", "Lei 9.784/99"]
  },
  
  "justica federal": {
    pergunta: "Qual a competência da Justiça Federal?",
    contexto: `RESPONDA ESPECIFICAMENTE sobre COMPETÊNCIA DA JUSTIÇA FEDERAL:
- Previsão: Art. 109, CF
- Competência ratione personae (em razão da pessoa):
  * União como parte
  * Autarquias e empresas públicas federais
- Competência ratione materiae (em razão da matéria):
  * Crimes políticos e infrações penais contra a União
  * Habeas corpus em matéria federal
  * Mandados de segurança contra atos federais
- Competência territorial
- Execuções fiscais federais
- Causas previdenciárias`,
    areasRelacionadas: ["Direito Constitucional", "Direito Processual"],
    artigos: ["Art. 109, CF"]
  }
};

// Normaliza texto para comparação (remove acentos, minúsculas)
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Detecta se a pergunta corresponde a uma FAQ
export function detectarFAQ(pergunta: string): FAQMatch | null {
  const perguntaNorm = normalizarTexto(pergunta);
  
  // Busca direta por correspondência de palavras-chave
  for (const [chave, faq] of Object.entries(FAQ_MAP)) {
    const chaveNorm = normalizarTexto(chave);
    const palavrasChave = chaveNorm.split(' ');
    
    // Contar quantas palavras-chave estão presentes na pergunta
    let matches = 0;
    for (const palavra of palavrasChave) {
      if (perguntaNorm.includes(palavra)) {
        matches++;
      }
    }
    
    // Se todas as palavras-chave estão presentes, é match
    const similarity = matches / palavrasChave.length;
    if (similarity >= 0.8) {
      console.log(`📌 FAQ detectada: "${chave}" (${Math.round(similarity * 100)}% match)`);
      return faq;
    }
  }
  
  // Busca secundária por correspondência na pergunta original do FAQ
  for (const [chave, faq] of Object.entries(FAQ_MAP)) {
    const faqPerguntaNorm = normalizarTexto(faq.pergunta);
    
    // Verificar se a pergunta do usuário é similar à pergunta FAQ
    const palavrasFaq = faqPerguntaNorm.split(' ').filter(p => p.length > 3);
    const palavrasUsuario = perguntaNorm.split(' ').filter(p => p.length > 3);
    
    let matches = 0;
    for (const palavra of palavrasFaq) {
      if (palavrasUsuario.some(p => p.includes(palavra) || palavra.includes(p))) {
        matches++;
      }
    }
    
    const similarity = palavrasFaq.length > 0 ? matches / palavrasFaq.length : 0;
    if (similarity >= 0.6) {
      console.log(`📌 FAQ detectada por pergunta similar: "${chave}" (${Math.round(similarity * 100)}% match)`);
      return faq;
    }
  }
  
  return null;
}
