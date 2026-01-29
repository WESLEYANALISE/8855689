import { Suspense, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import {
  FlashcardsSkeleton,
  CursosSkeleton,
  NoticiasSkeleton,
  SimulacaoSkeleton,
  BibliotecaSkeleton,
  JogosSkeleton,
  VideoaulasSkeleton,
  FerramentasSkeleton,
  PesquisarSkeleton,
  MapaMentalSkeleton,
} from '@/components/skeletons';

interface ContextualSuspenseProps {
  children: ReactNode;
}

// Mapeia rotas para skeletons específicos
const getSkeletonForRoute = (pathname: string) => {
  // Flashcards
  if (pathname.includes('/flashcards')) {
    return <FlashcardsSkeleton />;
  }
  
  // Cursos
  if (pathname.includes('/cursos') || pathname.includes('/curso')) {
    return <CursosSkeleton />;
  }
  
  // Notícias
  if (pathname.includes('/noticias') || pathname.includes('/noticia')) {
    return <NoticiasSkeleton />;
  }
  
  // Simulação
  if (pathname.includes('/simulacao') || pathname.includes('/simulados')) {
    return <SimulacaoSkeleton />;
  }
  
  // Biblioteca
  if (pathname.includes('/biblioteca') || pathname.includes('/bibliotecas')) {
    return <BibliotecaSkeleton />;
  }
  
  // Jogos
  if (pathname.includes('/jogos') || pathname.includes('/jogo')) {
    return <JogosSkeleton />;
  }
  
  // Videoaulas
  if (pathname.includes('/videoaulas') || pathname.includes('/videoaula') || pathname.includes('/juriflix')) {
    return <VideoaulasSkeleton />;
  }
  
  // Ferramentas
  if (pathname.includes('/ferramentas') || pathname.includes('/ferramenta')) {
    return <FerramentasSkeleton />;
  }
  
  // Pesquisar
  if (pathname.includes('/pesquisar') || pathname.includes('/busca')) {
    return <PesquisarSkeleton />;
  }
  
  // Mapa Mental
  if (pathname.includes('/mapa-mental')) {
    return <MapaMentalSkeleton />;
  }
  
  // Resumos
  if (pathname.includes('/resumos') || pathname.includes('/resumo')) {
    return <MapaMentalSkeleton />;
  }
  
  // Audioaulas
  if (pathname.includes('/audioaulas')) {
    return <VideoaulasSkeleton />;
  }
  
  // Default - PageLoader genérico
  return <PageLoader />;
};

/**
 * Componente Suspense que mostra skeletons contextuais
 * baseado na rota atual, em vez de um loader genérico
 */
export const ContextualSuspense = ({ children }: ContextualSuspenseProps) => {
  const location = useLocation();
  const skeleton = getSkeletonForRoute(location.pathname);
  
  return (
    <Suspense fallback={skeleton}>
      {children}
    </Suspense>
  );
};

export default ContextualSuspense;
