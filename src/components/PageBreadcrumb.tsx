import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mapeamento de rotas para nomes legíveis
const routeNames: Record<string, string> = {
  '/': 'Início',
  '/vade-mecum': 'Vade Mecum',
  '/vade-mecum/legislacao': 'Legislação',
  '/cursos': 'Cursos',
  '/videoaulas': 'Videoaulas',
  '/audioaulas': 'Audioaulas',
  '/flashcards': 'Flashcards',
  '/mapa-mental': 'Mapas Mentais',
  '/plano-estudos': 'Plano de Estudos',
  '/simulacao-juridica': 'Simulação Jurídica',
  '/ferramentas': 'Ferramentas',
  '/noticias-juridicas': 'Notícias Jurídicas',
  '/novidades': 'Novidades',
  '/constituicao': 'Constituição',
  '/codigos': 'Códigos & Leis',
  '/estatutos': 'Estatutos',
  '/sumulas': 'Súmulas',
  '/previdenciario': 'Previdenciário',
  '/legislacao-penal-especial': 'Lei Penal Especial',
  '/oab': 'Preparação OAB',
  '/biblioteca-oab': 'Biblioteca OAB',
  '/biblioteca-classicos': 'Clássicos',
  '/biblioteca-estudos': 'Estudos',
  '/biblioteca-portugues': 'Português',
  '/biblioteca-pesquisa-cientifica': 'Pesquisa Científica',
  '/biblioteca-faculdade': 'Biblioteca III',
  '/biblioteca-lideranca': 'Liderança',
  '/biblioteca-oratoria': 'Oratória',
  '/biblioteca-fora-da-toga': 'Fora da Toga',
  '/assistente-pessoal': 'Assistente Pessoal',
  '/dicionario': 'Dicionário Jurídico',
  '/juriflix': 'JuriFlix',
  '/ranking-faculdades': 'Ranking Faculdades',
  '/resumos-juridicos': 'Resumos Jurídicos',
  '/blogger-juridico': 'Blog Jurídico',
  '/custos-judiciais': 'Custos Judiciais',
  '/aprender': 'Aprender',
  '/politica': 'Política',
  '/politica/noticias': 'Notícias Políticas',
  '/em-alta': 'Em Alta',
  '/ajuda': 'Ajuda',
  '/pesquisar': 'Pesquisar',
  '/resumo-do-dia': 'Boletim',
};

// Mapeamento de rotas pai
const routeParents: Record<string, string> = {
  '/cursos': '/',
  '/videoaulas': '/',
  '/audioaulas': '/',
  '/flashcards': '/',
  '/mapa-mental': '/',
  '/plano-estudos': '/',
  '/simulacao-juridica': '/',
  '/noticias-juridicas': '/ferramentas',
  '/dicionario': '/ferramentas',
  '/juriflix': '/ferramentas',
  '/ranking-faculdades': '/ferramentas',
  '/resumos-juridicos': '/ferramentas',
  '/blogger-juridico': '/ferramentas',
  '/custos-judiciais': '/ferramentas',
  '/assistente-pessoal': '/ferramentas',
  '/biblioteca-classicos': '/biblioteca-faculdade',
  '/biblioteca-estudos': '/biblioteca-faculdade',
  '/biblioteca-portugues': '/biblioteca-faculdade',
  '/biblioteca-pesquisa-cientifica': '/biblioteca-faculdade',
  '/biblioteca-oratoria': '/biblioteca-faculdade',
  '/biblioteca-lideranca': '/bibliotecas',
  '/biblioteca-fora-da-toga': '/bibliotecas',
  '/biblioteca-oab': '/bibliotecas',
  '/biblioteca-faculdade': '/bibliotecas',
  '/bibliotecas': '/',
  '/constituicao': '/vade-mecum',
  '/codigos': '/vade-mecum/legislacao',
  '/estatutos': '/vade-mecum/legislacao',
  '/sumulas': '/vade-mecum/legislacao',
  '/legislacao-penal-especial': '/vade-mecum/legislacao',
  '/previdenciario': '/vade-mecum/legislacao',
  '/vade-mecum/legislacao': '/vade-mecum',
  '/politica/noticias': '/politica',
};

interface BreadcrumbItem {
  label: string;
  path: string;
}

function buildBreadcrumb(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Início', path: '/' }];
  
  if (pathname === '/') return items;
  
  // Encontrar a rota base
  const basePath = Object.keys(routeNames).find(route => 
    pathname === route || pathname.startsWith(route + '/')
  ) || pathname;
  
  // Adicionar pais primeiro
  let currentPath = basePath;
  const parents: BreadcrumbItem[] = [];
  
  while (routeParents[currentPath]) {
    const parentPath = routeParents[currentPath];
    if (routeNames[parentPath]) {
      parents.unshift({ label: routeNames[parentPath], path: parentPath });
    }
    currentPath = parentPath;
  }
  
  items.push(...parents);
  
  // Adicionar rota atual
  if (routeNames[basePath]) {
    items.push({ label: routeNames[basePath], path: basePath });
  } else {
    // Para rotas dinâmicas, usar o último segmento
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      items.push({ label: decodeURIComponent(lastSegment), path: pathname });
    }
  }
  
  return items;
}

interface PageBreadcrumbProps {
  customTitle?: string;
  backPath?: string;
}

export function PageBreadcrumb({ customTitle, backPath }: PageBreadcrumbProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const breadcrumbs = buildBreadcrumb(location.pathname);
  
  // Determinar o caminho de volta
  const goBack = () => {
    if (backPath) {
      navigate(backPath);
    } else if (breadcrumbs.length > 1) {
      navigate(breadcrumbs[breadcrumbs.length - 2].path);
    } else {
      navigate('/');
    }
  };
  
  // Não mostrar breadcrumb na página inicial
  if (location.pathname === '/') return null;
  
  return (
    <div className="border-b border-border/30 bg-card/30 py-3">
      <div className="max-w-7xl mx-auto px-8 flex items-center gap-4">
        {/* Botão Voltar */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goBack}
          className="flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm overflow-x-auto">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isFirst = index === 0;
            
            return (
              <div key={item.path} className="flex items-center gap-1.5 flex-shrink-0">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                
                {isLast ? (
                  <span className="text-foreground font-medium truncate max-w-[200px]">
                    {customTitle || item.label}
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {isFirst && <Home className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
