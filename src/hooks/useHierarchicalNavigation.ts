import { useNavigate, useLocation } from "react-router-dom";

// Mapeamento hierárquico completo - cada rota aponta para seu destino anterior
export const getHierarchicalDestination = (pathname: string, search: string): string => {
  const params = new URLSearchParams(search);

  // ===== VADE MECUM =====
  if (pathname === "/vade-mecum/busca") return "/vade-mecum";
  if (pathname === "/vade-mecum/sobre") return "/vade-mecum";
  if (pathname === "/vade-mecum") return "/";
  if (pathname.startsWith("/codigo/")) return "/codigos";
  if (pathname === "/codigos") return "/";
  if (pathname === "/constituicao") return "/";
  if (pathname.startsWith("/estatuto/")) return "/estatutos";
  if (pathname === "/estatutos") return "/";
  if (pathname.startsWith("/sumula/")) return "/sumulas";
  if (pathname === "/sumulas") return "/";

  // ===== PREVIDENCIÁRIO =====
  if (pathname.startsWith("/lei-previdenciaria/")) return "/previdenciario";
  if (pathname === "/previdenciario") return "/";

  // ===== LEGISLAÇÃO PENAL =====
  if (pathname.startsWith("/lei-penal/")) return "/legislacao-penal-especial";
  if (pathname === "/legislacao-penal-especial") return "/";

  // ===== SIMULADOS =====
  if (pathname.startsWith("/simulados/tjsp/")) return "/simulados/tjsp";
  if (pathname === "/simulados/tjsp") return "/simulados";
  if (pathname.startsWith("/simulados/")) return "/simulados";
  if (pathname === "/simulados") return "/";

  // ===== LEIS ORDINÁRIAS =====
  if (pathname.startsWith("/leis-ordinarias/")) return "/vade-mecum";
  if (pathname === "/leis-ordinarias") return "/vade-mecum";

  // ===== FLASHCARDS (hierárquico com parâmetros) =====
  if (pathname === "/flashcards/artigos-lei/estudar") {
    const codigo = params.get("codigo");
    if (codigo) return `/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`;
    return "/flashcards/artigos-lei";
  }
  if (pathname === "/flashcards/artigos-lei/temas") return "/flashcards/artigos-lei";
  if (pathname === "/flashcards/artigos-lei") return "/flashcards";
  if (pathname === "/flashcards/estudar") {
    const area = params.get("area");
    if (area) return `/flashcards/temas?area=${encodeURIComponent(area)}`;
    return "/flashcards/areas";
  }
  if (pathname === "/flashcards/temas") return "/flashcards/areas";
  if (pathname === "/flashcards/areas") return "/"; // Vai direto para início (evita loop com redirect /flashcards -> /flashcards/areas)
  if (pathname === "/flashcards") return "/";

  // ===== CURSOS =====
  if (pathname === "/cursos/aula") {
    const area = params.get("area");
    const modulo = params.get("modulo");
    if (area && modulo) return `/cursos/aulas?area=${encodeURIComponent(area)}&modulo=${encodeURIComponent(modulo)}`;
    return "/cursos/aulas";
  }
  if (pathname === "/cursos/aulas") {
    const area = params.get("area");
    if (area) return `/cursos/modulos?area=${encodeURIComponent(area)}`;
    return "/cursos/modulos";
  }
  if (pathname === "/cursos/modulos") return "/cursos";
  if (pathname === "/cursos") return "/";

  // ===== VIDEOAULAS =====
  if (pathname === "/videoaulas/player") {
    const area = params.get("area");
    if (area) return `/videoaulas/area/${encodeURIComponent(area)}`;
    return "/videoaulas";
  }
  if (pathname.startsWith("/videoaulas/area/")) return "/videoaulas";
  if (pathname.match(/^\/videoaulas\/[^/]+$/)) return "/videoaulas";
  if (pathname === "/videoaulas") return "/";

  // ===== AUDIOAULAS =====
  if (pathname.match(/^\/audioaulas\/[^/]+$/)) return "/audioaulas";
  if (pathname === "/audioaulas") return "/";

  // ===== PLANO DE ESTUDOS =====
  if (pathname === "/plano-estudos/resultado") return "/plano-estudos";
  if (pathname === "/plano-estudos") return "/";

  // ===== PROFESSORA =====
  if (pathname === "/professora-juridica") return "/";
  if (pathname === "/professora") return "/";

  // ===== RESUMOS JURÍDICOS =====
  if (pathname.startsWith("/resumos-juridicos/prontos/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 5) return `/resumos-juridicos/prontos/${parts[2]}/${parts[3]}`;
    if (parts.length >= 4) return `/resumos-juridicos/prontos/${parts[2]}`;
    if (parts.length >= 3) return "/resumos-juridicos/prontos";
  }
  if (pathname === "/resumos-juridicos/prontos") return "/resumos-juridicos";
  if (pathname === "/resumos-juridicos") return "/";

  // ===== RESUMOS ARTIGOS DE LEI =====
  if (pathname === "/resumos-artigos-lei/view") {
    const codigo = params.get("codigo");
    if (codigo) return `/resumos-artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`;
    return "/resumos-artigos-lei";
  }
  if (pathname === "/resumos-artigos-lei/temas") return "/resumos-artigos-lei/codigos";
  if (pathname === "/resumos-artigos-lei/codigos") return "/resumos-artigos-lei";
  if (pathname === "/resumos-artigos-lei") return "/";

  // ===== MAPA MENTAL =====
  if (pathname.startsWith("/mapa-mental/area/")) return "/mapa-mental";
  if (pathname === "/mapa-mental") return "/";

  // ===== QUESTÕES POR ARTIGO DE LEI =====
  if (pathname === "/questoes/artigos-lei/resolver") {
    const codigo = params.get("codigo");
    if (codigo) return `/questoes/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`;
    return "/questoes/artigos-lei";
  }
  if (pathname === "/questoes/artigos-lei/temas") {
    const codigo = params.get("codigo");
    // Determinar categoria baseada no código
    const codigosLista = ["cp", "cc", "cpc", "cpp", "clt", "cdc", "ctn", "ctb", "ce", "cpm", "cppm", "ccom", "cdm", "ca", "cba", "cbt"];
    const estatutosLista = ["eca", "estatuto-oab", "estatuto-idoso", "estatuto-cidade", "estatuto-pcd", "estatuto-torcedor", "estatuto-desarmamento", "estatuto-igualdade-racial"];
    const previdenciarioLista = ["lei-previdenciaria-custeio", "lei-previdenciaria-beneficios"];
    const sumulas = codigo?.startsWith("sumula-") || codigo?.includes("sumula");
    const legislacaoPenal = ["lep", "lcp", "lmp", "ld", "loc", "lld", "lit", "lch", "lt", "laa", "lje", "ljec", "led", "pac", "drogas", "maria-da-penha", "crimes-hediondos", "tortura", "organizacoes-criminosas", "lavagem-dinheiro", "interceptacao-telefonica", "abuso-autoridade", "juizados-especiais-criminais", "estatuto-desarmamento", "lei-drogas", "lei-crimes-hediondos", "lei-maria-penha", "lei-tortura", "lei-abuso-autoridade", "lei-organizacoes-criminosas", "lei-lavagem-dinheiro", "lei-interceptacao-telefonica", "lei-juizados-especiais", "pacote-anticrime"];
    
    if (codigo === "cf") return "/questoes/artigos-lei";
    if (codigosLista.includes(codigo || "")) return "/questoes/artigos-lei/codigos";
    if (estatutosLista.includes(codigo || "")) return "/questoes/artigos-lei/estatutos";
    if (previdenciarioLista.includes(codigo || "")) return "/questoes/artigos-lei/previdenciario";
    if (sumulas) return "/questoes/artigos-lei/sumulas";
    if (legislacaoPenal.includes(codigo || "")) return "/questoes/artigos-lei/legislacao-penal";
    return "/questoes/artigos-lei";
  }
  if (pathname === "/questoes/artigos-lei/codigos") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei/estatutos") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei/legislacao-penal") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei/previdenciario") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei/sumulas") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei/gerar") return "/questoes/artigos-lei";
  if (pathname === "/questoes/artigos-lei") return "/ferramentas/questoes";

  // ===== FERRAMENTAS =====
  if (pathname === "/analisar/resultado") return "/analisar";
  if (pathname === "/analisar") return "/ferramentas";
  if (pathname === "/advogado/modelos") return "/advogado";
  if (pathname === "/advogado/criar") return "/advogado";
  if (pathname === "/advogado") return "/ferramentas";
  if (pathname.startsWith("/dicionario/")) return "/dicionario";
  if (pathname === "/dicionario") return "/ferramentas";
  if (pathname === "/pesquisar") return "/ferramentas";
  if (pathname === "/ferramentas/questoes/resolver") return "/ferramentas/questoes/temas";
  if (pathname === "/ferramentas/questoes/temas") return "/ferramentas/questoes";
  if (pathname === "/ferramentas/questoes") return "/";
  if (pathname.match(/^\/ferramentas\/simulados\/[^/]+\/resultado$/)) {
    const parts = pathname.split("/");
    return `/ferramentas/simulados/${parts[3]}`;
  }
  if (pathname.match(/^\/ferramentas\/simulados\/[^/]+\/resolver$/)) {
    const parts = pathname.split("/");
    return `/ferramentas/simulados/${parts[3]}`;
  }
  if (pathname.match(/^\/ferramentas\/simulados\/[^/]+$/)) return "/ferramentas/simulados";
  if (pathname === "/ferramentas/simulados") return "/ferramentas";
  if (pathname === "/ferramentas") return "/";

  // ===== BIBLIOTECAS =====
  if (pathname.match(/^\/biblioteca-[^/]+\/[^/]+\/aula$/)) {
    const parts = pathname.split("/");
    return `/${parts[1]}/${parts[2]}`;
  }
  if (pathname.match(/^\/biblioteca-[^/]+\/[^/]+$/) && !pathname.endsWith("/aula")) {
    const parts = pathname.split("/");
    return `/${parts[1]}`;
  }
  if (pathname.match(/^\/biblioteca-[^/]+$/)) return "/bibliotecas";
  if (pathname === "/bibliotecas") return "/";

  // ===== SIMULADOS =====
  if (pathname === "/simulados/resultado") return "/simulados/realizar";
  if (pathname === "/simulados/realizar") return "/simulados";
  if (pathname === "/simulados/exames") return "/simulados";
  if (pathname === "/simulados/personalizado") return "/simulados";
  if (pathname === "/simulados/tjsp") return "/simulados";
  if (pathname.startsWith("/simulados/")) return "/simulados";
  if (pathname === "/simulados") return "/";

  // ===== OAB =====
  if (pathname.match(/^\/oab\/o-que-estudar\/[^/]+$/)) return "/oab/o-que-estudar";
  if (pathname === "/oab/o-que-estudar") return "/oab";
  if (pathname === "/oab-funcoes") return "/oab";
  if (pathname.startsWith("/oab/")) return "/oab";
  if (pathname === "/oab") return "/";

  // ===== JURIFLIX =====
  if (pathname.match(/^\/juriflix\/[^/]+$/)) return "/juriflix";
  if (pathname === "/juriflix") return "/";

  // ===== JOGOS JURÍDICOS =====
  if (pathname.match(/^\/jogos-juridicos\/[^/]+\/jogar$/)) {
    const parts = pathname.split("/");
    return `/jogos-juridicos/${parts[2]}/config`;
  }
  if (pathname.match(/^\/jogos-juridicos\/[^/]+\/config$/)) return "/jogos-juridicos";
  if (pathname.match(/^\/jogos-juridicos\/[^/]+$/)) return "/jogos-juridicos";
  if (pathname === "/jogos-juridicos") return "/";

  // ===== SIMULAÇÃO JURÍDICA =====
  if (pathname.startsWith("/simulacao-juridica/audiencia/")) return "/simulacao-juridica/escolha-caso";
  if (pathname === "/simulacao-juridica/escolha-caso") return "/simulacao-juridica/areas";
  if (pathname.match(/^\/simulacao-juridica\/temas\/[^/]+$/)) {
    const parts = pathname.split("/");
    return `/simulacao-juridica/escolha-estudo/${parts[3]}`;
  }
  if (pathname.match(/^\/simulacao-juridica\/artigos\/[^/]+$/)) {
    const parts = pathname.split("/");
    return `/simulacao-juridica/escolha-estudo/${parts[3]}`;
  }
  if (pathname.match(/^\/simulacao-juridica\/escolha-estudo\/[^/]+$/)) return "/simulacao-juridica/areas";
  if (pathname === "/simulacao-juridica/areas") return "/simulacao-juridica/modo";
  if (pathname === "/simulacao-juridica/modo") return "/simulacao-juridica";
  if (pathname.startsWith("/simulacao-juridica/")) return "/simulacao-juridica";
  if (pathname === "/simulacao-juridica") return "/";

  // ===== INICIANDO DIREITO =====
  if (pathname.match(/^\/iniciando-direito\/[^/]+\/aula\/[^/]+$/)) {
    const parts = pathname.split("/");
    return `/iniciando-direito/${parts[2]}/temas`;
  }
  if (pathname.match(/^\/iniciando-direito\/[^/]+\/temas$/)) {
    const parts = pathname.split("/");
    return `/iniciando-direito/${parts[2]}/sobre`;
  }
  if (pathname.match(/^\/iniciando-direito\/[^/]+\/sobre$/)) return "/iniciando-direito/todos";
  if (pathname === "/iniciando-direito/todos") return "/";
  if (pathname.match(/^\/iniciando-direito\/[^/]+$/)) return "/iniciando-direito/todos";
  if (pathname === "/iniciando-direito") return "/";

  // ===== MEU BRASIL =====
  if (pathname.match(/^\/meu-brasil\/artigo\/[^/]+$/)) return "/meu-brasil";
  if (pathname.match(/^\/meu-brasil\/jurista\/[^/]+$/)) return "/meu-brasil/juristas";
  if (pathname === "/meu-brasil/juristas") return "/meu-brasil";
  if (pathname.match(/^\/meu-brasil\/historia\/[^/]+$/)) return "/meu-brasil/historia";
  if (pathname === "/meu-brasil/historia") return "/meu-brasil";
  if (pathname.startsWith("/meu-brasil/")) return "/meu-brasil";
  if (pathname === "/meu-brasil") return "/";

  // ===== CÂMARA DOS DEPUTADOS =====
  if (pathname.startsWith("/camara-deputados/ranking/")) return "/politica";
  if (pathname.match(/^\/camara-deputados\/deputado\/\d+$/)) return "/politica";
  if (pathname.startsWith("/camara-deputados/")) return "/politica";
  if (pathname === "/camara-deputados") return "/politica";
  
  // ===== POLÍTICA =====
  if (pathname.match(/^\/politica\/rankings\/[^/]+$/)) return "/politica/rankings";
  if (pathname === "/politica/rankings") return "/politica";
  if (pathname.startsWith("/politica/")) return "/politica";
  if (pathname === "/politica") return "/";

  // ===== ELEIÇÕES =====
  if (pathname.startsWith("/eleicoes/")) return "/eleicoes";
  if (pathname === "/eleicoes") return "/";

  // ===== JURISPRUDÊNCIA =====
  if (pathname.match(/^\/jurisprudencia\/detalhes\/[^/]+$/)) return "/jurisprudencia/resultados";
  if (pathname === "/jurisprudencia/resultados") return "/jurisprudencia";
  if (pathname.match(/^\/jurisprudencia\/temas\/[^/]+$/)) return "/jurisprudencia/temas";
  if (pathname === "/jurisprudencia/temas") return "/jurisprudencia";
  if (pathname.startsWith("/jurisprudencia/")) return "/jurisprudencia";
  if (pathname === "/jurisprudencia") return "/";
  if (pathname === "/buscar-jurisprudencia") return "/jurisprudencia";

  // ===== NOTÍCIAS JURÍDICAS =====
  if (pathname.match(/^\/noticias-juridicas\/[^/]+$/)) return "/noticias-juridicas";
  if (pathname === "/noticias-juridicas") return "/";

  // ===== RANKING FACULDADES =====
  if (pathname.match(/^\/ranking-faculdades\/[^/]+$/)) return "/ranking-faculdades";
  if (pathname === "/ranking-faculdades") return "/";

  // ===== BLOGGER JURÍDICO =====
  if (pathname.match(/^\/blogger-juridico\/[^/]+\/[^/]+$/)) return "/blogger-juridico/artigos";
  if (pathname === "/blogger-juridico/artigos") return "/blogger-juridico";
  if (pathname.startsWith("/blogger-juridico/")) return "/blogger-juridico";
  if (pathname === "/blogger-juridico") return "/";

  // ===== OUTRAS ROTAS =====
  if (pathname === "/em-alta") return "/";
  if (pathname === "/novidades") return "/";
  if (pathname === "/suporte") return "/";
  if (pathname === "/ajuda") return "/";
  if (pathname === "/processo") return "/";

  // ===== FALLBACK - SEMPRE VOLTA PARA INÍCIO =====
  return "/";
};

// Títulos para exibição no botão voltar
export const getPreviousPageTitle = (pathname: string, search: string): string => {
  const destination = getHierarchicalDestination(pathname, search);
  
  const titleMap: Record<string, string> = {
    "/": "Início",
    "/em-alta": "Em Alta",
    "/vade-mecum": "Vade Mecum",
    "/codigos": "Códigos & Leis",
    "/estatutos": "Estatutos",
    "/sumulas": "Súmulas",
    "/previdenciario": "Previdenciário",
    "/legislacao-penal-especial": "Legislação Penal",
    "/leis-ordinarias": "Leis Ordinárias",
    
    "/flashcards": "Flashcards",
    "/flashcards/areas": "Áreas",
    "/flashcards/temas": "Temas",
    "/flashcards/artigos-lei": "Artigos de Lei",
    "/flashcards/artigos-lei/temas": "Temas",
    "/cursos": "Cursos",
    "/cursos/modulos": "Módulos",
    "/cursos/aulas": "Aulas",
    "/videoaulas": "Videoaulas",
    "/audioaulas": "Audioaulas",
    "/plano-estudos": "Plano de Estudos",
    "/resumos-juridicos": "Resumos Jurídicos",
    "/resumos-juridicos/prontos": "Resumos por Matéria",
    "/resumos-artigos-lei": "Resumos Artigos",
    "/resumos-artigos-lei/codigos": "Códigos",
    "/mapa-mental": "Mapa Mental",
    
    // Questões por Artigo de Lei
    "/questoes/artigos-lei": "Questões por Artigo",
    "/questoes/artigos-lei/codigos": "Códigos e Leis",
    "/questoes/artigos-lei/estatutos": "Estatutos",
    "/questoes/artigos-lei/legislacao-penal": "Legislação Penal",
    "/questoes/artigos-lei/previdenciario": "Previdenciário",
    "/questoes/artigos-lei/sumulas": "Súmulas",
    
    "/ferramentas": "Ferramentas",
    "/analisar": "Analisar",
    "/advogado": "Advogado",
    "/dicionario": "Dicionário",
    "/ferramentas/questoes": "Questões",
    "/ferramentas/questoes/temas": "Temas",
    "/ferramentas/simulados": "Simulados",
    "/bibliotecas": "Bibliotecas",
    "/simulados": "Simulados",
    "/simulados/realizar": "Realizar Simulado",
    "/oab": "OAB",
    "/oab/o-que-estudar": "O que Estudar",
    "/juriflix": "JuriFlix",
    "/jogos-juridicos": "Jogos Jurídicos",
    "/simulacao-juridica": "Simulação Jurídica",
    "/simulacao-juridica/modo": "Modo",
    "/simulacao-juridica/areas": "Áreas",
    "/simulacao-juridica/escolha-caso": "Escolha de Caso",
    "/iniciando-direito": "Iniciando Direito",
    "/iniciando-direito/todos": "Cursos",
    "/meu-brasil": "Meu Brasil",
    "/meu-brasil/juristas": "Juristas",
    "/meu-brasil/historia": "História",
    "/camara-deputados": "Política",
    "/politica": "Política",
    "/politica/rankings": "Rankings",
    "/eleicoes": "Eleições",
    "/jurisprudencia": "Jurisprudência",
    "/jurisprudencia/resultados": "Resultados",
    "/jurisprudencia/temas": "Temas",
    "/noticias-juridicas": "Notícias Jurídicas",
    "/ranking-faculdades": "Ranking Faculdades",
    "/blogger-juridico": "Blogger Jurídico",
    "/blogger-juridico/artigos": "Artigos",
  };

  if (titleMap[destination]) return titleMap[destination];

  // Títulos dinâmicos baseados em padrões
  if (destination.startsWith("/questoes/artigos-lei/temas")) return "Artigos";
  if (destination.startsWith("/flashcards/artigos-lei/temas")) return "Temas";
  if (destination.startsWith("/flashcards/temas")) return "Temas";
  if (destination.startsWith("/cursos/aulas")) return "Aulas";
  if (destination.startsWith("/cursos/modulos")) return "Módulos";
  if (destination.startsWith("/videoaulas/area/")) return "Área";
  if (destination.startsWith("/resumos-juridicos/prontos/")) {
    const parts = destination.split("/").filter(Boolean);
    if (parts.length >= 4) return decodeURIComponent(parts[3]);
    if (parts.length >= 3) return decodeURIComponent(parts[2]);
  }
  if (destination.startsWith("/biblioteca-")) {
    const parts = destination.split("/").filter(Boolean);
    if (parts.length >= 2) return "Livro";
    return "Biblioteca";
  }
  if (destination.startsWith("/ferramentas/simulados/")) return "Simulado";
  if (destination.startsWith("/jogos-juridicos/")) return "Jogo";
  if (destination.startsWith("/simulacao-juridica/escolha-estudo/")) return "Escolha de Estudo";
  if (destination.startsWith("/iniciando-direito/")) {
    if (destination.includes("/temas")) return "Temas";
    if (destination.includes("/sobre")) return "Sobre";
    return "Área";
  }

  return "Início";
};

// Hook principal para navegação hierárquica
export const useHierarchicalNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const backDestination = getHierarchicalDestination(location.pathname, location.search);
  const backTitle = getPreviousPageTitle(location.pathname, location.search);

  const goBack = () => {
    navigate(backDestination);
  };

  return {
    goBack,
    backDestination,
    backTitle,
  };
};
