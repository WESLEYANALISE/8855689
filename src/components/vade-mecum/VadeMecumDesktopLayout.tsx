import { ReactNode, useState, useCallback, useMemo } from 'react';
import { ThreeColumnLayout } from '@/components/desktop/ThreeColumnLayout';
import { VadeMecumNavigationSidebar } from './VadeMecumNavigationSidebar';
import { VadeMecumArticlePanel } from './VadeMecumArticlePanel';
import { VadeMecumDetailPanel } from './VadeMecumDetailPanel';
import { useArticleNavigationShortcuts } from '@/hooks/useDesktopKeyboardShortcuts';

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração"?: string | null;
  "Comentario"?: string | null;
  "Aula"?: string | null;
}

interface VadeMecumDesktopLayoutProps {
  /** Nome da tabela no Supabase */
  tableName: string;
  /** Nome amigável do código */
  codeName: string;
  /** Subtítulo (número da lei) */
  lawNumber?: string;
  /** Lista de artigos */
  articles: Article[];
  /** Se está carregando */
  isLoading: boolean;
  /** Artigo selecionado */
  selectedArticle: Article | null;
  /** Callback ao selecionar artigo */
  onSelectArticle: (article: Article) => void;
  /** Callback ao fechar detalhe */
  onCloseDetail: () => void;
  /** Callback para tocar áudio */
  onPlayAudio?: (url: string, title: string) => void;
  /** Callback para abrir explicação */
  onOpenExplicacao?: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  /** Callback para abrir aula */
  onOpenAula?: (article: Article) => void;
  /** Callback para abrir termos */
  onOpenTermos?: (artigo: string, numeroArtigo: string) => void;
  /** Callback para abrir questões */
  onOpenQuestoes?: (artigo: string, numeroArtigo: string) => void;
  /** Callback para perguntar */
  onPerguntar?: (artigo: string, numeroArtigo: string) => void;
  /** Callback para aula artigo */
  onOpenAulaArtigo?: (artigo: string, numeroArtigo: string) => void;
  /** Callback para gerar flashcards */
  onGenerateFlashcards?: (artigo: string, numeroArtigo: string) => void;
  /** Se está carregando flashcards */
  loadingFlashcards?: boolean;
  /** Artigo alvo da busca */
  targetArticle?: string | null;
  /** Header customizado */
  header?: ReactNode;
}

export const VadeMecumDesktopLayout = ({
  tableName,
  codeName,
  lawNumber,
  articles,
  isLoading,
  selectedArticle,
  onSelectArticle,
  onCloseDetail,
  onPlayAudio,
  onOpenExplicacao,
  onOpenAula,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  onGenerateFlashcards,
  loadingFlashcards,
  targetArticle,
  header
}: VadeMecumDesktopLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  // Extrair estrutura hierárquica dos artigos na ordem cronológica (por id)
  // Divisores são registros sem número de artigo que marcam PARTE, TÍTULO, CAPÍTULO, etc.
  const structure = useMemo(() => {
    const sections: { name: string; articles: Article[]; startId: number }[] = [];
    let currentSection: { name: string; articles: Article[]; startId: number } | null = null;
    
    // Artigos já vêm ordenados por id (ordem cronológica da lei)
    articles.forEach(article => {
      const content = (article["Artigo"] || '').trim();
      const numero = article["Número do Artigo"];
      
      // Verificar se é um divisor estrutural (sem número de artigo e começa com palavra-chave)
      const isDivisor = !numero && /^(PARTE|LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s/i.test(content);
      
      if (isDivisor) {
        // Extrair nome completo do divisor (ex: "TÍTULO I\n\nDA QUALIFICAÇÃO" -> "TÍTULO I - DA QUALIFICAÇÃO")
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        let sectionName = lines[0];
        if (lines[1] && !lines[1].match(/^(Art\.|PARTE|LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)/i)) {
          sectionName += ' - ' + lines[1];
        }
        
        currentSection = { name: sectionName, articles: [], startId: article.id };
        sections.push(currentSection);
      } else if (numero) {
        // É um artigo normal
        if (!currentSection) {
          // Artigos antes do primeiro divisor - criar seção "Disposições Iniciais"
          currentSection = { name: 'Disposições Iniciais', articles: [], startId: 0 };
          sections.push(currentSection);
        }
        currentSection.articles.push(article);
      }
    });

    // Filtrar seções vazias e retornar na ordem cronológica
    return sections
      .filter(s => s.articles.length > 0)
      .map(s => ({
        name: s.name,
        articles: s.articles,
        count: s.articles.length
      }));
  }, [articles]);

  // Filtrar artigos
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filtrar por capítulo selecionado
    if (selectedChapter) {
      const chapter = structure.find(s => s.name === selectedChapter);
      if (chapter) {
        filtered = chapter.articles;
      }
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        const numero = (article["Número do Artigo"] || '').toLowerCase();
        const conteudo = (article["Artigo"] || '').toLowerCase();
        return numero.includes(query) || conteudo.includes(query);
      });
    }

    return filtered;
  }, [articles, searchQuery, selectedChapter, structure]);

  // Navegação por teclado
  const currentIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return filteredArticles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, filteredArticles]);

  const handlePrevious = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const newIndex = currentIndex <= 0 ? filteredArticles.length - 1 : currentIndex - 1;
    onSelectArticle(filteredArticles[newIndex]);
  }, [currentIndex, filteredArticles, onSelectArticle]);

  const handleNext = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const newIndex = currentIndex >= filteredArticles.length - 1 ? 0 : currentIndex + 1;
    onSelectArticle(filteredArticles[newIndex]);
  }, [currentIndex, filteredArticles, onSelectArticle]);

  // Atalhos de teclado
  useArticleNavigationShortcuts({
    onPrevious: handlePrevious,
    onNext: handleNext,
    onClose: onCloseDetail,
    enabled: !!selectedArticle
  });

  return (
    <div className="flex flex-col h-full">
      {header}
      
      <ThreeColumnLayout
        navigation={
          <VadeMecumNavigationSidebar
            codeName={codeName}
            structure={structure}
            selectedChapter={selectedChapter}
            onSelectChapter={setSelectedChapter}
            totalArticles={articles.length}
          />
        }
        content={
          <VadeMecumArticlePanel
            articles={filteredArticles}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedArticle={selectedArticle}
            onSelectArticle={onSelectArticle}
            codeName={codeName}
            totalCount={articles.length}
            targetArticle={targetArticle}
          />
        }
        detail={
          selectedArticle ? (
            <VadeMecumDetailPanel
              article={selectedArticle}
              codeName={codeName}
              tableName={tableName}
              onPlayAudio={onPlayAudio}
              onOpenExplicacao={onOpenExplicacao}
              onOpenAula={onOpenAula}
              onOpenTermos={onOpenTermos}
              onOpenQuestoes={onOpenQuestoes}
              onPerguntar={onPerguntar}
              onOpenAulaArtigo={onOpenAulaArtigo}
              onGenerateFlashcards={onGenerateFlashcards}
              loadingFlashcards={loadingFlashcards}
              onPrevious={handlePrevious}
              onNext={handleNext}
              currentIndex={currentIndex}
              totalCount={filteredArticles.length}
            />
          ) : undefined
        }
        showDetail={!!selectedArticle}
        detailTitle={selectedArticle ? `Art. ${selectedArticle["Número do Artigo"]}` : undefined}
        onCloseDetail={onCloseDetail}
        navDefaultWidth={22}
        detailDefaultWidth={42}
      />
    </div>
  );
};

export default VadeMecumDesktopLayout;
