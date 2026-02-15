import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Mapeamento hierárquico completo - cada rota aponta para seu destino anterior
const getHierarchicalDestination = (pathname: string, search: string): string => {
  const params = new URLSearchParams(search);

  // ===== LEIS / EXPLICAÇÕES =====
  if (pathname === "/leis/explicacoes") return "/?tab=leis";

  // ===== VADE MECUM =====
  if (pathname === "/vade-mecum/busca") return "/?tab=leis";
  if (pathname === "/vade-mecum/sobre") return "/?tab=leis";
  if (pathname === "/vade-mecum/resenha-diaria") return "/?tab=leis";
  if (pathname === "/vade-mecum/push-legislacao") return "/?tab=leis";
  if (pathname === "/vade-mecum") return "/?tab=leis";
  if (pathname.startsWith("/codigo/")) return "/codigos";
  if (pathname === "/codigos") return "/?tab=leis";
  if (pathname === "/constituicao") return "/?tab=leis";
  if (pathname.startsWith("/estatuto/")) return "/estatutos";
  if (pathname === "/estatutos") return "/?tab=leis";
  if (pathname.startsWith("/sumula/")) return "/sumulas";
  if (pathname === "/sumulas") return "/?tab=leis";

  // ===== PREVIDENCIÁRIO =====
  if (pathname.startsWith("/lei-previdenciaria/")) return "/previdenciario";
  if (pathname === "/previdenciario") return "/?tab=leis";

  // ===== LEGISLAÇÃO PENAL =====
  if (pathname.startsWith("/lei-penal/")) return "/legislacao-penal-especial";
  if (pathname === "/legislacao-penal-especial") return "/?tab=leis";

  // ===== LEIS ORDINÁRIAS =====
  if (pathname.startsWith("/leis-ordinarias/")) return "/leis-ordinarias";
  if (pathname === "/leis-ordinarias") return "/?tab=leis";

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
  if (pathname === "/flashcards/areas") return "/flashcards";
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
  
  // Resumos de Artigos de Lei - View (visualização de artigo)
  if (pathname === "/resumos-juridicos/artigos-lei/view") {
    const codigo = params.get("codigo");
    if (codigo) return `/resumos-juridicos/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`;
    return "/resumos-juridicos/artigos-lei";
  }
  
  // Resumos de Artigos de Lei - Temas (lista de artigos)
  if (pathname === "/resumos-juridicos/artigos-lei/temas") {
    const codigo = params.get("codigo");
    const estatutosLista = ["eca", "estatuto-idoso", "estatuto-oab", "estatuto-pcd", "estatuto-igualdade", "estatuto-cidade", "estatuto-torcedor"];
    const codigosLista = ["cp", "cc", "cpc", "cpp", "clt", "cdc", "ctn", "ctb", "ce", "cpm", "cppm", "ccom", "cdm", "ca", "cba", "cbt"];
    const sumulas = codigo?.startsWith("sumula") || codigo?.includes("sumula") || codigo?.includes("enunciado");
    const legislacaoPenal = ["lep", "lcp", "drogas", "maria-da-penha", "crimes-hediondos", "tortura", "organizacoes-criminosas", "lavagem-dinheiro", "interceptacao-telefonica", "abuso-autoridade", "juizados-especiais-criminais", "estatuto-desarmamento"];
    const previdenciario = ["lei-beneficios", "lei-custeio"];
    
    if (codigo === "cf") return "/resumos-juridicos/artigos-lei";
    if (estatutosLista.includes(codigo || "")) return "/resumos-juridicos/artigos-lei/estatutos";
    if (codigosLista.includes(codigo || "")) return "/resumos-juridicos/artigos-lei/codigos";
    if (sumulas) return "/resumos-juridicos/artigos-lei/sumulas";
    if (legislacaoPenal.includes(codigo || "")) return "/resumos-juridicos/artigos-lei/legislacao-penal";
    if (previdenciario.includes(codigo || "")) return "/resumos-juridicos/artigos-lei/previdenciario";
    return "/resumos-juridicos/artigos-lei";
  }
  if (pathname === "/resumos-juridicos/artigos-lei/estatutos") return "/resumos-juridicos/artigos-lei";
  if (pathname === "/resumos-juridicos/artigos-lei/codigos") return "/resumos-juridicos/artigos-lei";
  if (pathname === "/resumos-juridicos/artigos-lei/sumulas") return "/resumos-juridicos/artigos-lei";
  if (pathname === "/resumos-juridicos/artigos-lei/legislacao-penal") return "/resumos-juridicos/artigos-lei";
  if (pathname === "/resumos-juridicos/artigos-lei/previdenciario") return "/resumos-juridicos/artigos-lei";
  if (pathname === "/resumos-juridicos/artigos-lei") return "/resumos-juridicos";
  
  if (pathname === "/resumos-juridicos") return "/";

  // ===== MAPA MENTAL =====
  if (pathname.startsWith("/mapa-mental/area/")) return "/mapa-mental";
  if (pathname === "/mapa-mental") return "/";

  // ===== QUESTÕES POR ARTIGO DE LEI =====
  if (pathname === "/questoes/artigos-lei/resolver") {
    const codigo = params.get("codigo");
    if (codigo) return `/questoes/artigos-lei/temas?codigo=${encodeURIComponent(codigo)}`;
    return "/ferramentas/questoes";
  }
  if (pathname === "/questoes/artigos-lei/temas") {
    // Sempre voltar para o hub de questões centralizado
    return "/ferramentas/questoes";
  }
  if (pathname === "/questoes/artigos-lei/codigos") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei/estatutos") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei/legislacao-penal") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei/previdenciario") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei/sumulas") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei/gerar") return "/ferramentas/questoes";
  if (pathname === "/questoes/artigos-lei") return "/ferramentas/questoes";

  // ===== FERRAMENTAS =====
  if (pathname === "/analisar/resultado") return "/analisar";
  if (pathname === "/analisar") return "/ferramentas";
  if (pathname === "/advogado/modelos") return "/advogado";
  if (pathname === "/advogado/criar") return "/advogado";
  if (pathname === "/advogado") return "/";
  if (pathname.startsWith("/dicionario/")) return "/dicionario";
  if (pathname === "/dicionario") return "/ferramentas";
  if (pathname === "/pesquisar") return "/";
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
  // Simulado escrevente resolver (ex: /ferramentas/simulados/escrevente/2023/resolver)
  if (pathname.match(/^\/ferramentas\/simulados\/escrevente\/\d+\/resolver$/)) {
    const parts = pathname.split("/");
    return `/ferramentas/simulados/escrevente/${parts[4]}`;
  }
  // Simulado escrevente dashboard por ano (ex: /ferramentas/simulados/escrevente/2023)
  if (pathname.match(/^\/ferramentas\/simulados\/escrevente\/\d+$/)) {
    return "/ferramentas/simulados/escrevente";
  }
  if (pathname === "/ferramentas/simulados/escrevente") return "/simulados";
  if (pathname.match(/^\/ferramentas\/simulados\/[^/]+$/)) return "/ferramentas/simulados";
  if (pathname === "/ferramentas/simulados") return "/simulados";
  if (pathname === "/ferramentas") return "/";

  // ===== BIBLIOTECAS =====
  // /biblioteca-*/:livroId/aula -> /biblioteca-*/:livroId
  if (pathname.match(/^\/biblioteca-[^/]+\/[^/]+\/aula$/)) {
    const parts = pathname.split("/");
    return `/${parts[1]}/${parts[2]}`;
  }
  // /biblioteca-*/:livroId -> /biblioteca-*
  if (pathname.match(/^\/biblioteca-[^/]+\/[^/]+$/) && !pathname.endsWith("/aula")) {
    const parts = pathname.split("/");
    return `/${parts[1]}`;
  }
  // /biblioteca-* -> /bibliotecas
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

  // ===== FACULDADE =====
  // Tópicos da faculdade voltam para a página inicial de semestres
  if (pathname.match(/^\/faculdade\/topico\/\d+$/)) return "/faculdade";
  if (pathname.match(/^\/faculdade\/disciplina\/[^/]+$/)) return "/faculdade";
  if (pathname === "/faculdade") return "/?tab=iniciante";

  // ===== AULAS / ÁREAS DO DIREITO =====
  if (pathname.match(/^\/aulas\/area\/[^/]+\/materia\/[^/]+$/)) {
    const parts = pathname.split("/");
    return `/aulas/area/${parts[3]}`;
  }
  if (pathname.match(/^\/aulas\/area\/[^/]+$/)) return "/?tab=jornada";

  // ===== OAB =====
  // OAB está dentro da aba 'jornada' (Estudos), não é aba separada
  if (pathname.match(/^\/oab\/o-que-estudar\/[^/]+$/)) return "/oab/o-que-estudar";
  if (pathname === "/oab/o-que-estudar") return "/?tab=jornada";
  if (pathname === "/oab-funcoes") return "/?tab=jornada";
  if (pathname === "/oab/primeira-fase") return "/?tab=jornada";
  if (pathname === "/oab/segunda-fase") return "/?tab=jornada";
  if (pathname.startsWith("/oab/")) return "/?tab=jornada";
  if (pathname === "/oab") return "/?tab=jornada";

  // ===== JURIFLIX =====
  if (pathname.match(/^\/juriflix\/[^/]+$/)) return "/juriflix";
  if (pathname === "/juriflix") return "/?tab=iniciante";

  // ===== REDAÇÃO =====
  if (pathname.match(/^\/redacao\/conteudo\/\d+$/)) {
    return "/redacao";
  }
  if (pathname.match(/^\/redacao\/[^/]+$/)) return "/redacao";
  if (pathname === "/redacao") return "/?tab=iniciante";

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
  // IMPORTANTE: /politica SEMPRE volta para "/" (Início), não para /em-alta
  if (pathname.match(/^\/politica\/noticias\/\d+$/)) return "/politica/noticias";
  if (pathname.match(/^\/politica\/rankings\/[^/]+$/)) return "/politica/rankings";
  if (pathname === "/politica/rankings") return "/politica";
  if (pathname.startsWith("/politica/")) return "/politica";
  if (pathname === "/politica") return "/";

  // ===== ELEIÇÕES =====
  if (pathname.startsWith("/eleicoes/")) return "/eleicoes";
  if (pathname === "/eleicoes") return "/";

  // ===== NOTÍCIAS JURÍDICAS =====
  if (pathname.match(/^\/noticias-juridicas\/[^/]+$/)) return "/noticias-juridicas";
  if (pathname === "/noticias-juridicas") return "/";

  // ===== RANKING FACULDADES =====
  if (pathname.match(/^\/ranking-faculdades\/[^/]+$/)) return "/ranking-faculdades";
  if (pathname === "/ranking-faculdades") return "/";

  // ===== BLOGGER JURÍDICO =====
  if (pathname.match(/^\/blogger-juridico\/[^/]+\/[^/]+$/)) return "/blogger-juridico/artigos";
  if (pathname === "/blogger-juridico/artigos") return "/";
  if (pathname.startsWith("/blogger-juridico/")) return "/";
  if (pathname === "/blogger-juridico") return "/";

  // ===== AUDIÊNCIAS =====
  if (pathname.match(/^\/ferramentas\/audiencias\/[^/]+$/)) return "/ferramentas/audiencias";
  if (pathname === "/ferramentas/audiencias") return "/?tab=iniciante";

  // ===== FERRAMENTAS =====
  if (pathname === "/jurisprudencia-corpus927") {
    const view = params.get("view");
    if (view === "lista-categoria") return "/jurisprudencia-corpus927?view=resultados";
    if (view === "resultados") return "/jurisprudencia-corpus927?view=busca";
    if (view === "busca") return "/jurisprudencia-corpus927";
    return "/ferramentas";
  }
  if (pathname === "/ferramentas") return "/";

  // ===== MEUS PAGAMENTOS =====
  if (pathname === "/meus-pagamentos") return "/perfil";

  // ===== CARREIRAS JURÍDICAS =====
  if (pathname.match(/^\/estudo-carreira\/[^/]+$/)) return "/";
  if (pathname === "/carreiras-juridicas") return "/";

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
const getPreviousPageTitle = (pathname: string, search: string): string => {
  const destination = getHierarchicalDestination(pathname, search);
  
  // Mapeamento de destinos para títulos
  const titleMap: Record<string, string> = {
    "/": "Início",
    "/?tab=leis": "Leis",
    "/vade-mecum": "Vade Mecum",
    "/codigos": "Códigos & Leis",
    "/estatutos": "Estatutos",
    "/sumulas": "Súmulas",
    "/previdenciario": "Previdenciário",
    "/legislacao-penal-especial": "Legislação Penal",
    "/leis-ordinarias": "Leis Ordinárias",
    
    "/faculdade": "Faculdade",
    "/?tab=iniciante": "Início",
    
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
    "/resumos-juridicos/artigos-lei": "Resumos de Artigos",
    "/resumos-juridicos/artigos-lei/estatutos": "Estatutos",
    "/resumos-juridicos/artigos-lei/codigos": "Códigos e Leis",
    "/resumos-juridicos/artigos-lei/sumulas": "Súmulas",
    "/resumos-juridicos/artigos-lei/legislacao-penal": "Legislação Penal",
    "/resumos-juridicos/artigos-lei/previdenciario": "Previdenciário",
    "/mapa-mental": "Mapa Mental",
    
    // Questões por Artigo de Lei
    "/questoes/artigos-lei": "Questões por Artigo",
    "/questoes/artigos-lei/codigos": "Códigos e Leis",
    "/questoes/artigos-lei/estatutos": "Estatutos",
    "/questoes/artigos-lei/legislacao-penal": "Legislação Penal",
    "/questoes/artigos-lei/previdenciario": "Previdenciário",
    "/questoes/artigos-lei/sumulas": "Súmulas",
    
    "/ferramentas": "Ferramentas",
    "/jurisprudencia-corpus927": "Corpus 927",
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
    "/meu-brasil": "Meu Brasil",
    "/meu-brasil/juristas": "Juristas",
    "/meu-brasil/historia": "História",
    "/camara-deputados": "Câmara dos Deputados",
    "/politica": "Política",
    "/politica/noticias": "Notícias Políticas",
    "/em-alta": "Em Alta",
    "/eleicoes": "Eleições",
    "/noticias-juridicas": "Notícias Jurídicas",
    "/ranking-faculdades": "Ranking Faculdades",
    "/blogger-juridico": "Blogger Jurídico",
    "/blogger-juridico/artigos": "Artigos",
  };

  // Verifica título direto
  if (titleMap[destination]) return titleMap[destination];

  // Títulos dinâmicos baseados em padrões
  if (destination.startsWith("/resumos-juridicos/artigos-lei/temas")) {
    // Extrair código da query e mostrar nome da área
    const urlParams = new URLSearchParams(destination.split("?")[1] || "");
    const codigo = urlParams.get("codigo");
    const areaNames: Record<string, string> = {
      "cf": "Constituição Federal",
      "cp": "Código Penal",
      "cc": "Código Civil",
      "cpc": "Processo Civil",
      "cpp": "Processo Penal",
      "cdc": "Código do Consumidor",
      "clt": "CLT",
      "ctn": "Código Tributário",
      "ctb": "Código de Trânsito",
      "ce": "Código Eleitoral",
      "cpm": "Código Penal Militar",
      "cppm": "Processo Penal Militar",
      "eca": "ECA",
      "estatuto-idoso": "Estatuto do Idoso",
      "estatuto-oab": "Estatuto da OAB",
      "estatuto-pcd": "Estatuto da PCD",
      "estatuto-igualdade": "Igualdade Racial",
      "estatuto-cidade": "Estatuto da Cidade",
      "estatuto-torcedor": "Estatuto do Torcedor",
      "lep": "Lei de Execução Penal",
      "lcp": "Contravenções Penais",
      "drogas": "Lei de Drogas",
      "maria-da-penha": "Maria da Penha",
      "crimes-hediondos": "Crimes Hediondos",
      "tortura": "Lei de Tortura",
      "organizacoes-criminosas": "Organizações Criminosas",
      "lavagem-dinheiro": "Lavagem de Dinheiro",
      "interceptacao-telefonica": "Interceptação Telefônica",
      "abuso-autoridade": "Abuso de Autoridade",
      "juizados-especiais-criminais": "Juizados Especiais",
      "estatuto-desarmamento": "Desarmamento",
      "lei-beneficios": "Lei de Benefícios",
      "lei-custeio": "Lei de Custeio",
    };
    return areaNames[codigo || ""] || "Artigos";
  }
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
    const bibliotecaNames: Record<string, string> = {
      "/biblioteca-classicos": "Clássicos",
      "/biblioteca-oab": "OAB",
      "/biblioteca-lideranca": "Liderança",
      "/biblioteca-oratoria": "Oratória",
      "/biblioteca-estudos": "Estudos",
      "/biblioteca-fora-toga": "Fora da Toga",
    };
    return bibliotecaNames[destination] || "Biblioteca";
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

const getPageTitle = (pathname: string): string => {
  if (pathname === "/") return "";
  if (pathname === "/vade-mecum") return "Vade Mecum";
  if (pathname === "/constituicao") return "Constituição Federal";
  if (pathname === "/codigos") return "Códigos & Leis";
  if (pathname.startsWith("/codigo/")) return "Códigos & Leis";
  if (pathname === "/estatutos") return "Estatutos";
  if (pathname.startsWith("/estatuto/")) return "Estatutos";
  if (pathname === "/sumulas") return "Súmulas";
  if (pathname.startsWith("/sumula/")) return "Súmulas";
  if (pathname === "/legislacao-penal-especial") return "Legislação Penal";
  if (pathname.startsWith("/lei-penal/")) return "Legislação Penal";
  if (pathname === "/leis-ordinarias") return "Leis Ordinárias";
  if (pathname.startsWith("/leis-ordinarias/")) return "Leis Ordinárias";
  if (pathname === "/previdenciario") return "Previdenciário";
  if (pathname.startsWith("/lei-previdenciaria/")) return "Previdenciário";
  if (pathname === "/aprender") return "";
  if (pathname === "/professora-juridica") return "Estudar";
  if (pathname === "/professora") return "Estudar";
  if (pathname === "/cursos") return "Estudar";
  if (pathname.startsWith("/cursos/")) return "Cursos";
  if (pathname === "/videoaulas") return "Estudar";
  if (pathname.startsWith("/videoaulas/")) return "Videoaulas";
  if (pathname === "/flashcards") return "Estudar";
  if (pathname.startsWith("/flashcards/")) return "Flashcards";
  if (pathname === "/resumos-juridicos") return "Estudar";
  if (pathname === "/plano-estudos") return "Estudar";
  if (pathname === "/bibliotecas") return "Bibliotecas";
  if (pathname.startsWith("/biblioteca-")) return "Bibliotecas";
  if (pathname === "/ferramentas") return "Ferramentas";
  if (pathname === "/pesquisar") return "Ferramentas";
  if (pathname === "/dicionario") return "Ferramentas";
  if (pathname === "/simulados") return "Simulados";
  if (pathname.startsWith("/simulados/")) return "Simulados";
  if (pathname === "/oab") return "OAB";
  if (pathname.startsWith("/oab/")) return "OAB";
  if (pathname === "/noticias-juridicas") return "Notícias Jurídicas";
  if (pathname.startsWith("/noticias-juridicas/")) return "Notícias Jurídicas";
  if (pathname === "/novidades") return "Novidades";
  return "";
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isResumosPage = location.pathname.startsWith("/resumos-juridicos");
  const isCategoriasTopicoPage = location.pathname.startsWith("/categorias/topico");
  const pageTitle = getPageTitle(location.pathname);

  // Hide header on pages that have their own navigation
  if (isResumosPage || isCategoriasTopicoPage) return null;

  // HOME LAYOUT
  if (isHome) {
    return (
      <header className="relative w-full overflow-hidden z-20 bg-transparent">
        <div className="relative flex h-16 md:h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-2">
            <img src="/logo.webp" alt="Juridiquê - Estudos Jurídicos" className="w-10 h-10 md:w-8 md:h-8 rounded-lg object-cover" loading="eager" fetchPriority="high" decoding="sync" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight font-playfair">
                JURIDIQUÊ
              </span>
              <span className="text-[10px] text-white/70 tracking-widest uppercase -mt-1">
                Estudos Jurídicos
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // INTERNAL PAGES LAYOUT
  const previousPageTitle = getPreviousPageTitle(location.pathname, location.search);
  
  const handleBackNavigation = () => {
    const destination = getHierarchicalDestination(location.pathname, location.search);
    
    // Passa state especial quando voltando para /vade-mecum de subcategorias
    if (destination === "/vade-mecum") {
      navigate(destination, { state: { fromSubcategory: true } });
    } else {
      navigate(destination);
    }
    
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  
  return (
    <header className="w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center justify-between px-4 gap-3 max-w-7xl mx-auto">
        {/* Back Button com Breadcrumb de 1 nível */}
        <button 
          onClick={handleBackNavigation} 
          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-all hover:scale-105 border border-border/50 hover:border-border flex-shrink-0 group" 
          aria-label={`Voltar para ${previousPageTitle}`}
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5] flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Voltar</span>
            <span className="text-sm font-semibold truncate max-w-[100px]">{previousPageTitle}</span>
          </div>
        </button>
        
        {/* Page Title - centralizado */}
        {pageTitle && (
          <h1 className="text-base font-bold text-foreground truncate flex-1 text-center">
            {pageTitle}
          </h1>
        )}
        
      </div>
    </header>
  );
};
