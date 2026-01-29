import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para separar titulo e complemento
function separarTituloComplemento(topicoCompleto: string): { titulo: string; complemento: string | null } {
  // Encontrar o primeiro ponto final seguido de espaço ou fim da string
  const match = topicoCompleto.match(/^([^.]+\.)\s*(.*)?$/);
  
  if (match) {
    const titulo = match[1].replace(/\.$/, '').trim(); // Remove o ponto final do título
    const complemento = match[2]?.trim() || null;
    return { titulo, complemento };
  }
  
  // Se não houver ponto, o texto todo é o título
  return { titulo: topicoCompleto.trim(), complemento: null };
}

// Dados extraídos OFICIALMENTE do sistema Jupiter da USP - 1º Semestre
const DISCIPLINAS_SEMESTRE_1 = [
  {
    codigo: "DCV0125",
    nome: "Teoria Geral do Direito Privado I",
    nome_ingles: "Introduction to Private Law I",
    departamento: "Direito Civil",
    semestre: 1,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0125&codcur=2014&codhab=104",
    ementa: "Estudo dos conceitos fundamentais do Direito Privado, incluindo a teoria das pessoas, bens e fatos jurídicos.",
    objetivos: "Proporcionar ao aluno os fundamentos teóricos do Direito Privado, capacitando-o a compreender as categorias jurídicas fundamentais.",
    // Tópicos oficiais do Jupiter USP - cada string é o tópico completo
    topicos_usp: [
      "Etimologia das palavras direito e jus. Vários sentidos da palavra direito.",
      "Noção inicial de norma jurídica e suas diferenças com normas religiosas e morais.",
      "Norma jurídica e lei. Definição e caracteres da lei. A positivação. O preceito.",
      "Direito objetivo. Divisão do direito objetivo. Ramos do direito.",
      "Hierarquia das leis. Constitucionalidade e justiça da lei.",
      "Interpretação da lei.",
      "Lacunas da lei. Meios de integração. Analogia. Equidade.",
      "Formas de expressão do direito: Costumes, Doutrina e Jurisprudência. Princípios gerais.",
      "Vigência e eficácia da lei. Eficácia da lei no tempo. Vacatio legis.",
      "Eficácia da lei no espaço. O mar territorial.",
      "Conflito de leis. Irretroatividade. Teoria do direito adquirido.",
      "Codificação. Os microssistemas. Código Civil brasileiro.",
      "O Direito Civil e o Direito Empresarial. Unificação do direito privado.",
      "Pessoa e personalidade. Conceito filosófico e jurídico de pessoa.",
      "Pessoa, personalidade, capacidade jurídica, capacidade de fato. Legitimidade.",
      "Pessoa natural. Início da personalidade. Nascituro. Teorias natalista e concepcionista.",
      "Fim da pessoa natural. Morte presumida. Comoriência. Transplante.",
      "Incapacidade absoluta e relativa. Representação e assistência. Emancipação.",
      "Pessoa Jurídica. Noção e classificação. Entes não personalizados.",
      "Elementos constitutivos das PJ de direito privado. O registro.",
      "Sociedades empresárias e não-empresárias. Sociedade de advogados.",
      "Associações. Espécies de associação.",
      "Fundações: conceito, instituição, estrutura.",
      "Extinção das pessoas jurídicas de direito privado.",
      "Domicílio. Domicílio das pessoas naturais e jurídicas. Espécies.",
      "Natureza jurídica e quadro geral dos direitos de personalidade.",
      "Sexualidade e direitos da personalidade. Transexualismo.",
      "Direitos da personalidade e inovações tecnológicas.",
      "A relação jurídica e o objeto. Noção de patrimônio.",
      "Classificação de bens. Bens considerados em si mesmos.",
      "Bens móveis e imóveis. Espécies de bens imóveis.",
      "Bens simples e compostos. Bens singulares e coletivos.",
      "Bens principais e acessórios. Frutos, produtos, pertenças, benfeitorias.",
      "Os bens em relação aos sujeitos. Bens públicos e particulares. Bem ambiental.",
      "Bem de família. Histórico, conceito, espécies. Lei nº 8.009/90.",
      "Direitos registráveis e não registráveis. Registro dos bens."
    ]
  },
  {
    codigo: "DCV0127",
    nome: "Direito Romano Atual I",
    nome_ingles: "Current Roman Law I",
    departamento: "Direito Civil",
    semestre: 1,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0127&codcur=2014&codhab=104",
    ementa: "Estudo das instituições fundamentais do Direito Romano e sua influência no Direito Civil contemporâneo.",
    objetivos: "Fornecer ao aluno conhecimento sobre as fontes históricas do Direito Privado ocidental.",
    topicos_usp: [
      "Introdução ao estudo do direito romano. Importância para o direito atual.",
      "Periodização histórica de Roma e do direito romano. Fontes do direito romano.",
      "A Lei das XII Tábuas. Importância e conteúdo.",
      "O ius civile e o ius gentium. Distinções fundamentais.",
      "O papel do pretor romano. Direito pretoriano e equidade.",
      "O Corpus Iuris Civilis. Estrutura e importância para a tradição jurídica.",
      "Pessoa e capacidade no Direito Romano. Requisitos da personalidade.",
      "Status libertatis, civitatis e familiae. Capitis deminutio.",
      "A família romana e a patria potestas. Pater familias.",
      "O matrimônio romano. Espécies e efeitos jurídicos.",
      "A propriedade romana: dominium ex iure Quiritium. Características.",
      "Modos de aquisição da propriedade. Originários e derivados.",
      "Posse e suas espécies no direito romano. Elementos e efeitos.",
      "Direitos reais sobre coisa alheia. Iura in re aliena.",
      "Servidões prediais rústicas e urbanas. Conceito e classificação.",
      "Usufruto e direitos análogos. Uso e habitação.",
      "Obrigações no Direito Romano. Conceito e estrutura.",
      "Fontes das obrigações. Contrato, delito, quase-contrato e quase-delito.",
      "Contratos romanos típicos. Reais, consensuais, verbais e literais.",
      "Responsabilidade contratual e extracontratual em Roma.",
      "Delitos privados romanos. Furtum, damnum iniuria datum, iniuria.",
      "Ações e procedimentos no direito romano. Actio e exceptio.",
      "Legis actiones. O processo mais antigo.",
      "Processo formular. Estrutura e funcionamento.",
      "Cognitio extra ordinem. A última fase processual.",
      "Herança e sucessão no Direito Romano. Hereditas e bonorum possessio.",
      "Testamento romano. Formas e capacidade testamentária.",
      "Legados e fideicomissos. Distinções e evolução.",
      "Recepção do Direito Romano no Brasil e nos países de tradição romano-germânica."
    ]
  },
  {
    codigo: "DEF0113",
    nome: "Economia Política",
    nome_ingles: "Political Economy",
    departamento: "Direito Econômico e Financeiro",
    semestre: 1,
    carga_horaria: 30,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DEF0113&codcur=2014&codhab=104",
    ementa: "Introdução aos conceitos fundamentais da Economia e sua relação com o Direito.",
    objetivos: "Capacitar o aluno a compreender os fenômenos econômicos e sua regulação jurídica.",
    topicos_usp: [
      "Conceito de Economia e Economia Política. Objeto e método da ciência econômica.",
      "Escassez e escolha racional. O problema econômico fundamental.",
      "Sistemas econômicos: capitalismo, socialismo e economia mista.",
      "O mercado e seus mecanismos. Agentes econômicos.",
      "Oferta e demanda. Leis fundamentais.",
      "Equilíbrio de mercado. Formação de preços.",
      "Elasticidade-preço da demanda e da oferta. Conceito e aplicações.",
      "Teoria do consumidor. Utilidade e preferências.",
      "Teoria da firma. Custos de produção e maximização de lucros.",
      "Estruturas de mercado. Concorrência e concentração.",
      "Concorrência perfeita e imperfeita. Características.",
      "Monopólio e oligopólio. Poder de mercado.",
      "Macroeconomia: conceitos básicos. Variáveis macroeconômicas.",
      "PIB e renda nacional. Contabilidade social.",
      "Inflação e desemprego. Conceitos e relações.",
      "Política monetária. Instrumentos e objetivos.",
      "Política fiscal. Receitas, despesas e dívida pública.",
      "O Estado na economia. Falhas de mercado e intervenção estatal.",
      "Regulação econômica e Direito. Interface entre economia e ordenamento jurídico."
    ]
  },
  {
    codigo: "DES0125",
    nome: "Teoria Geral do Estado I",
    nome_ingles: "General Theory of the State I",
    departamento: "Direito do Estado",
    semestre: 1,
    carga_horaria: 30,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DES0125&codcur=2014&codhab=104",
    ementa: "Estudo das teorias sobre a origem, natureza e finalidade do Estado.",
    objetivos: "Proporcionar ao aluno compreensão crítica sobre o fenômeno estatal.",
    topicos_usp: [
      "Ciência política e Teoria Geral do Estado. Objeto e método.",
      "O poder e suas manifestações. Poder político e poder social.",
      "Conceito de Estado. Evolução histórica do conceito.",
      "Elementos constitutivos do Estado. Povo, território, soberania e finalidade.",
      "Povo, população e nação. Distinções fundamentais.",
      "Território e suas dimensões. Limites e fronteiras.",
      "Soberania. Conceito, características e teorias.",
      "Teorias sobre a origem do Estado. Justificação do poder político.",
      "Contratualismo: Hobbes e o Estado absoluto. O Leviatã.",
      "Contratualismo: Locke e o Estado liberal. Propriedade e consentimento.",
      "Contratualismo: Rousseau e a vontade geral. Soberania popular.",
      "Teorias organicistas do Estado. O Estado como organismo.",
      "Teorias marxistas do Estado. Luta de classes e superestrutura.",
      "Fins do Estado. Estado mínimo e Estado intervencionista.",
      "Estado liberal clássico. Características e fundamentos.",
      "Estado social e welfare state. Direitos sociais e prestações estatais.",
      "Estado democrático de direito. Constitucionalismo contemporâneo.",
      "Formas de Estado. Unitário, federal e regional.",
      "Estado unitário. Centralização e desconcentração.",
      "Estado federal. Características e exemplos.",
      "Confederação. Distinção em relação à federação.",
      "Formas de governo. Monarquia e república.",
      "Monarquia: características, espécies e evolução histórica.",
      "República: características e fundamentos.",
      "Sistemas de governo. Presidencialismo e parlamentarismo."
    ]
  },
  {
    codigo: "DFD0117",
    nome: "Introdução ao Estudo do Direito I",
    nome_ingles: "Introduction to the Study of Law I",
    departamento: "Filosofia e Teoria Geral do Direito",
    semestre: 1,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0117&codcur=2014&codhab=104",
    ementa: "Estudo dos conceitos fundamentais da Ciência do Direito.",
    objetivos: "Introduzir o aluno às categorias fundamentais do pensamento jurídico.",
    topicos_usp: [
      "O que é Direito. Diferentes concepções e definições.",
      "Direito e moral. Critérios de distinção.",
      "Direito e ética. Fundamentação axiológica.",
      "Direito natural e direito positivo. O jusnaturalismo e o positivismo.",
      "Fontes do Direito. Conceito e classificação.",
      "Lei como fonte do Direito. Espécies normativas.",
      "Processo legislativo brasileiro. Fases e espécies de leis.",
      "Costume jurídico. Elementos e classificação.",
      "Jurisprudência como fonte do Direito. Precedentes e súmulas.",
      "Doutrina jurídica. Papel na construção do Direito.",
      "Princípios gerais do Direito. Funções e exemplos.",
      "Analogia como meio de integração. Requisitos e limites.",
      "Equidade. Conceito e aplicação.",
      "Norma jurídica: estrutura lógica. Hipótese e consequência.",
      "Sanção jurídica. Conceito e espécies.",
      "Vigência e eficácia das normas. Distinções fundamentais.",
      "Conflito de normas no tempo. Direito intertemporal.",
      "Conflito de normas no espaço. Direito internacional privado.",
      "Interpretação do Direito. Conceito e importância.",
      "Métodos de interpretação. Gramatical, lógico, sistemático, histórico e teleológico.",
      "Integração do Direito. Autointegração e heterointegração.",
      "Lacunas do ordenamento jurídico. Espécies e formas de colmatação.",
      "Ordenamento jurídico: conceito e características. Unidade, coerência e completude.",
      "Validade, vigência e eficácia. Planos distintos da norma.",
      "Hierarquia das normas. Pirâmide normativa de Kelsen.",
      "Ramos do Direito. Critérios de classificação.",
      "Direito público e direito privado. Distinção clássica.",
      "Direito interno e internacional. Relações e conflitos.",
      "Relação jurídica. Conceito e elementos.",
      "Sujeito de direito. Pessoa e personalidade jurídica.",
      "Objeto do direito. Bens jurídicos.",
      "Fato jurídico. Conceito e classificação."
    ]
  },
  {
    codigo: "DFD0119",
    nome: "Metodologia do Estudo do Direito",
    nome_ingles: "Methodology of Legal Studies",
    departamento: "Filosofia e Teoria Geral do Direito",
    semestre: 1,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0119&codcur=2014&codhab=104",
    ementa: "Estudo dos métodos e técnicas de pesquisa e estudo do Direito.",
    objetivos: "Capacitar o aluno para o estudo sistemático e a pesquisa jurídica.",
    topicos_usp: [
      "Metodologia científica: conceitos básicos. Ciência e método.",
      "Conhecimento científico e senso comum. Critérios de demarcação.",
      "Ciência do Direito: objeto e método. Especificidades do conhecimento jurídico.",
      "Dogmática jurídica. Conceito e função.",
      "Teoria do Direito. Objeto e relação com a dogmática.",
      "Filosofia do Direito. Questões fundamentais.",
      "Sociologia do Direito. Direito e sociedade.",
      "História do Direito. Perspectiva histórica do fenômeno jurídico.",
      "Técnicas de estudo jurídico. Organização e planejamento.",
      "Leitura e fichamento de textos jurídicos. Técnicas de anotação.",
      "Análise de legislação. Métodos de estudo das normas.",
      "Análise de jurisprudência. Estudo de casos e precedentes.",
      "Análise de doutrina. Leitura crítica de textos doutrinários.",
      "Pesquisa jurídica: tipos. Qualitativa e quantitativa.",
      "Pesquisa bibliográfica. Fontes e métodos.",
      "Pesquisa documental. Análise de documentos jurídicos.",
      "Pesquisa de campo. Entrevistas e observação.",
      "Projeto de pesquisa jurídica. Estrutura e elementos.",
      "Redação jurídica. Clareza, precisão e correção.",
      "Estrutura de trabalhos acadêmicos. Monografias, artigos e dissertações.",
      "Citação e referências segundo ABNT. Normas técnicas.",
      "Argumentação jurídica. Lógica e retórica.",
      "Raciocínio jurídico. Dedução, indução e abdução.",
      "Hermenêutica jurídica. Interpretação e compreensão do Direito."
    ]
  }
];

// Dados extraídos OFICIALMENTE do sistema Jupiter da USP - 2º Semestre
const DISCIPLINAS_SEMESTRE_2 = [
  {
    codigo: "DCV0126",
    nome: "Teoria Geral do Direito Privado II",
    nome_ingles: "Introduction to Private Law II",
    departamento: "Direito Civil",
    semestre: 2,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0126&codcur=2014&codhab=104",
    ementa: "Estudo dos fatos jurídicos, teoria do negócio jurídico, atos ilícitos e tutela dos direitos.",
    objetivos: "Aprofundar o estudo das categorias fundamentais do Direito Privado, com foco nos fatos jurídicos e na teoria do negócio jurídico.",
    topicos_usp: [
      // Parte I - Fatos Jurídicos
      "Noção de fato jurídico. A hipótese legal e o suporte fático.",
      "Classificação dos fatos jurídicos. Fatos naturais e humanos.",
      "Atos-fatos jurídicos. Conceito e exemplos.",
      // Parte II - Teoria do Negócio Jurídico
      "Negócio jurídico: conceito e evolução histórica. Autonomia privada.",
      "Teorias sobre o negócio jurídico. Teoria da vontade e teoria da declaração.",
      "Classificação dos negócios jurídicos. Unilaterais, bilaterais e plurilaterais.",
      "Negócios inter vivos e mortis causa. Distinções fundamentais.",
      "Negócios gratuitos e onerosos. Critérios de distinção.",
      "Negócios principais e acessórios. Relação de dependência.",
      "Plano da existência do negócio jurídico. Elementos constitutivos.",
      "Manifestação de vontade. Formas de expressão.",
      "Silêncio como manifestação de vontade. Requisitos e efeitos.",
      "Reserva mental. Conceito e consequências jurídicas.",
      "Agente capaz. Capacidade de fato e legitimação.",
      "Objeto do negócio jurídico. Requisitos: licitude, possibilidade e determinabilidade.",
      "Forma do negócio jurídico. Liberdade de forma e exceções.",
      "Plano da validade do negócio jurídico. Requisitos de validade.",
      "Nulidade e anulabilidade. Distinções fundamentais.",
      "Causas de nulidade absoluta. Hipóteses legais.",
      "Simulação. Conceito, espécies e efeitos.",
      "Causas de anulabilidade. Hipóteses legais.",
      "Erro ou ignorância. Conceito e espécies.",
      "Erro substancial e erro acidental. Critérios de distinção.",
      "Erro de direito e erro de fato. Admissibilidade.",
      "Dolo. Conceito e espécies: dolus bonus e dolus malus.",
      "Dolo essencial e dolo acidental. Efeitos distintos.",
      "Coação. Conceito e requisitos. Coação física e moral.",
      "Estado de perigo. Conceito e requisitos legais.",
      "Lesão. Conceito, requisitos e efeitos.",
      "Fraude contra credores. Pressupostos: eventus damni e consilium fraudis.",
      "Ação pauliana. Natureza jurídica e legitimidade.",
      "Convalidação dos negócios anuláveis. Confirmação e decadência.",
      "Plano da eficácia do negócio jurídico. Elementos acidentais.",
      "Condição. Conceito e classificação.",
      "Condições suspensiva e resolutiva. Efeitos distintos.",
      "Condições lícitas e ilícitas. Condições perplexas.",
      "Termo. Conceito e espécies: termo inicial e final.",
      "Termo certo e incerto. Critérios de distinção.",
      "Encargo ou modo. Conceito e natureza jurídica.",
      "Representação. Conceito e espécies: legal e voluntária.",
      "Procuração. Forma e substabelecimento.",
      "Mandato aparente e autocontratação. Limites.",
      "Interpretação do negócio jurídico. Regras legais e doutrinárias.",
      "Boa-fé objetiva na interpretação. Função interpretativa.",
      // Parte III - Atos Ilícitos
      "Ato ilícito. Conceito e pressupostos.",
      "Responsabilidade civil subjetiva. Culpa em sentido amplo.",
      "Abuso de direito. Conceito e caracterização.",
      "Responsabilidade objetiva. Fundamentos e hipóteses.",
      "Excludentes de ilicitude. Legítima defesa, estado de necessidade, exercício regular de direito.",
      // Parte IV - Tutela dos Direitos
      "Prescrição. Conceito e fundamentos.",
      "Prazos prescricionais. Regras gerais e especiais.",
      "Causas de impedimento, suspensão e interrupção da prescrição.",
      "Decadência. Conceito e distinção da prescrição.",
      "Prazos decadenciais legais e convencionais."
    ]
  },
  {
    codigo: "DCV0128",
    nome: "História do Direito I",
    nome_ingles: "History of Law I",
    departamento: "Direito Civil",
    semestre: 2,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DCV0128&codcur=2014&codhab=104",
    ementa: "Estudo da evolução histórica dos sistemas jurídicos ocidentais, com ênfase no sistema romano-germânico-canônico e na Common Law.",
    objetivos: "Proporcionar ao aluno compreensão da formação histórica dos grandes sistemas jurídicos contemporâneos.",
    topicos_usp: [
      "Introdução à História do Direito. Objeto, método e importância.",
      "Direito e história. Historicidade do fenômeno jurídico.",
      "Sistemas jurídicos contemporâneos. Famílias jurídicas.",
      "Sistema romano-germânico-canônico. Características gerais.",
      "Antiguidade: formação do direito romano. Fases e fontes.",
      "O Corpus Iuris Civilis de Justiniano. Estrutura e importância.",
      "Queda do Império Romano do Ocidente. Fragmentação jurídica.",
      "Idade Média: pluralismo jurídico. Direito canônico, feudal e consuetudinário.",
      "Direito canônico. Fontes e influência na tradição jurídica.",
      "O renascimento do direito romano. Glosadores e comentadores.",
      "Escola de Bolonha. Irnerius e a redescoberta do Corpus Iuris.",
      "Ius commune europeu. Formação e características.",
      "Idade Moderna: centralização política e unificação jurídica.",
      "Humanismo jurídico. Mos gallicus e mos italicus.",
      "Escola do Direito Natural. Grotius, Pufendorf, Thomasius.",
      "Iluminismo jurídico. Racionalismo e codificação.",
      "Idade Contemporânea: as grandes codificações.",
      "Código Civil francês de 1804. Napoleão e o Code Civil.",
      "Código Civil alemão de 1900. BGB e pandectismo.",
      "Escola Histórica do Direito. Savigny e o Volksgeist.",
      "Common Law. Origens e características fundamentais.",
      "Formação do sistema inglês. Tribunais reais e equity.",
      "Writ system e case law. Precedentes vinculantes."
    ]
  },
  {
    codigo: "DES0126",
    nome: "Teoria Geral do Estado II",
    nome_ingles: "General Theory of the State II",
    departamento: "Direito do Estado",
    semestre: 2,
    carga_horaria: 30,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DES0126&codcur=2014&codhab=104",
    ementa: "Estudo da democracia, sistemas eleitorais e partidários, e tendências do Estado contemporâneo.",
    objetivos: "Aprofundar o estudo do Estado com ênfase na democracia e nas formas de participação política.",
    topicos_usp: [
      "Estado e democracia. Evolução histórica do conceito de democracia.",
      "Democracia antiga e moderna. Distinções fundamentais.",
      "Democracia direta. Conceito e instrumentos.",
      "Democracia semidireta. Referendo, plebiscito e iniciativa popular.",
      "Democracia representativa. Mandato e representação política.",
      "Sufrágio. Conceito, natureza jurídica e espécies.",
      "Sufrágio universal e restrito. Evolução histórica.",
      "Voto. Características: direto, secreto, igual e periódico.",
      "Sistemas eleitorais. Conceito e classificação.",
      "Sistema majoritário. Espécies e características.",
      "Sistema proporcional. Quociente eleitoral e partidário.",
      "Sistema misto. Experiências comparadas.",
      "Partidos políticos. Conceito e funções.",
      "Sistemas partidários. Unipartidarismo, bipartidarismo e pluripartidarismo.",
      "Grupos de pressão e lobby. Conceito e regulamentação.",
      "Tendências do Estado contemporâneo. Globalização e soberania.",
      "Estado regulador. Agências reguladoras.",
      "Crise do Estado-nação. Supranacionalidade.",
      "O futuro do Estado. Perspectivas e desafios."
    ]
  },
  {
    codigo: "DFD0118",
    nome: "Introdução ao Estudo do Direito II",
    nome_ingles: "Introduction to the Study of Law II",
    departamento: "Filosofia e Teoria Geral do Direito",
    semestre: 2,
    carga_horaria: 60,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=DFD0118&codcur=2014&codhab=104",
    ementa: "Aprofundamento do estudo do ordenamento jurídico, fontes, interpretação e teorias jurídicas contemporâneas.",
    objetivos: "Consolidar a compreensão das categorias fundamentais do Direito e introduzir as principais teorias jurídicas contemporâneas.",
    topicos_usp: [
      // Unidade 1 - Norma e Ordenamento
      "Norma jurídica: estrutura e funções. Revisão e aprofundamento.",
      "Ordenamento jurídico como sistema. Coerência e completude.",
      "Unidade do ordenamento. Norma fundamental.",
      "Hierarquia normativa. Critérios de resolução de conflitos.",
      "Critério hierárquico, cronológico e da especialidade.",
      // Unidade 2 - Fontes do Direito
      "Fontes do Direito: revisão sistemática. Classificações.",
      "Constituição como fonte suprema. Supremacia constitucional.",
      "Lei em sentido formal e material. Espécies normativas.",
      "Regulamentos e atos normativos secundários. Limites.",
      "Costumes, jurisprudência e doutrina. Papel no ordenamento.",
      "Princípios como fonte normativa. Eficácia e aplicabilidade.",
      // Unidade 3 - Consistência e Completude
      "Antinomias jurídicas. Conceito e classificação.",
      "Critérios de solução de antinomias. Hierárquico, cronológico, especialidade.",
      "Antinomias de segundo grau. Conflitos entre critérios.",
      "Lacunas do ordenamento. Conceito e espécies.",
      "Integração do Direito. Analogia, costumes e princípios gerais.",
      // Unidade 4 - Interpretação
      "Interpretação jurídica. Conceito e natureza.",
      "Métodos tradicionais de interpretação. Gramatical, lógico, sistemático, histórico, teleológico.",
      "Nova hermenêutica. Hermenêutica filosófica e concretização.",
      "Interpretação conforme a Constituição. Técnicas.",
      "Limites da interpretação. Texto e norma.",
      // Unidade 5 - Teorias Jurídicas Contemporâneas
      "Positivismo jurídico. Kelsen e a Teoria Pura do Direito.",
      "Normativismo kelseniano. Norma fundamental e escalonamento.",
      "Hart e o conceito de Direito. Regras primárias e secundárias.",
      "Pós-positivismo. Reaproximação entre Direito e moral.",
      "Dworkin e os princípios. Distinção entre regras e princípios.",
      "Alexy e a teoria dos direitos fundamentais. Proporcionalidade.",
      // Unidade 6 - Moralidade do Direito
      "Direito e moral. Debate contemporâneo.",
      "Teorias do mínimo ético. Hart e Fuller.",
      "Moralidade interna do Direito. Lon Fuller."
    ]
  },
  {
    codigo: "FSL0117",
    nome: "Introdução à Sociologia para Faculdade de Direito",
    nome_ingles: "Introduction to Sociology for Law School",
    departamento: "Filosofia e Teoria Geral do Direito",
    semestre: 2,
    carga_horaria: 30,
    url_jupiter: "https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=FSL0117&codcur=2014&codhab=104",
    ementa: "Introdução ao conhecimento sociológico e aos clássicos da Sociologia, com ênfase na relação entre sociedade e Direito.",
    objetivos: "Proporcionar ao aluno conhecimento dos fundamentos da Sociologia e sua aplicação ao estudo do Direito.",
    topicos_usp: [
      "Contexto sócio-histórico de constituição do conhecimento sociológico. Modernidade e ciência.",
      "A Sociologia como conhecimento científico historicamente situado. Objeto e método.",
      "Positivismo e sociologia. Auguste Comte e a física social.",
      "Émile Durkheim e as possibilidades de integração social. Fato social.",
      "Consciência coletiva e solidariedade. Mecânica e orgânica.",
      "Anomia e Direito em Durkheim. Função social do Direito.",
      "Karl Marx e as contradições da formação social capitalista. Materialismo histórico.",
      "Classes sociais e luta de classes. Infraestrutura e superestrutura.",
      "Direito e ideologia em Marx. Crítica ao direito burguês.",
      "Max Weber e os efeitos da racionalização. Ação social e tipos ideais.",
      "Dominação e legitimidade. Tradicional, carismática e racional-legal.",
      "Burocracia e Direito em Weber. Racionalidade formal.",
      "Sociologia do Direito. Objeto e abordagens.",
      "Direito e controle social. Funções sociais do Direito.",
      "Tendências recentes do pensamento sociológico. Bourdieu, Habermas, Luhmann.",
      "Sociologia jurídica contemporânea. Novos objetos e métodos."
    ]
  }
];

// Combina todos os semestres
const TODAS_DISCIPLINAS = [...DISCIPLINAS_SEMESTRE_1, ...DISCIPLINAS_SEMESTRE_2];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const resultados = [];

    for (const disciplina of TODAS_DISCIPLINAS) {
      // Inserir/atualizar disciplina
      const { data: disciplinaData, error: disciplinaError } = await supabase
        .from("faculdade_disciplinas")
        .upsert({
          codigo: disciplina.codigo,
          nome: disciplina.nome,
          nome_ingles: disciplina.nome_ingles,
          departamento: disciplina.departamento,
          semestre: disciplina.semestre,
          carga_horaria: disciplina.carga_horaria,
          url_jupiter: disciplina.url_jupiter,
          ementa: disciplina.ementa,
          objetivos: disciplina.objetivos,
          conteudo_programatico: disciplina.topicos_usp.join("\n"),
          ativo: true
        }, { onConflict: "codigo" })
        .select()
        .single();

      if (disciplinaError) {
        console.error(`Erro ao inserir disciplina ${disciplina.codigo}:`, disciplinaError);
        continue;
      }

      // Processar tópicos - separar titulo e complemento
      const topicosParaInserir = disciplina.topicos_usp.map((topicoCompleto, index) => {
        const { titulo, complemento } = separarTituloComplemento(topicoCompleto);
        return {
          disciplina_id: disciplinaData.id,
          ordem: index + 1,
          titulo,
          complemento,
          status: "pendente"
        };
      });

      // Deletar tópicos existentes da disciplina
      await supabase
        .from("faculdade_topicos")
        .delete()
        .eq("disciplina_id", disciplinaData.id);

      const { error: topicosError } = await supabase
        .from("faculdade_topicos")
        .insert(topicosParaInserir);

      if (topicosError) {
        console.error(`Erro ao inserir tópicos de ${disciplina.codigo}:`, topicosError);
      }

      resultados.push({
        codigo: disciplina.codigo,
        nome: disciplina.nome,
        topicos_inseridos: topicosParaInserir.length,
        exemplo_topico: topicosParaInserir[0] ? {
          titulo: topicosParaInserir[0].titulo,
          complemento: topicosParaInserir[0].complemento
        } : null
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Seed do 1º semestre concluído com tópicos oficiais da USP",
        disciplinas: resultados,
        total_disciplinas: resultados.length,
        total_topicos: resultados.reduce((acc, r) => acc + r.topicos_inseridos, 0)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro no seed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
