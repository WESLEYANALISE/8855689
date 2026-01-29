import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Youtube, Eye, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';
import { usePoliticaDocumentarios, DocumentarioPolitico } from '@/hooks/usePoliticaDocumentarios';
import { DocumentarioThumbnail } from './DocumentarioThumbnail';

interface PoliticaDocumentariosProps {
  orientacao: OrientacaoPolitica;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const getOrientacaoColors = (orientacao: string) => {
  switch (orientacao) {
    case 'esquerda':
      return {
        border: 'border-red-500/30',
        bg: 'bg-red-950/40',
        hoverBg: 'hover:bg-red-950/60',
        badge: 'bg-red-500/20 text-red-400',
        glow: 'hover:shadow-red-500/20',
      };
    case 'centro':
      return {
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-950/40',
        hoverBg: 'hover:bg-yellow-950/60',
        badge: 'bg-yellow-500/20 text-yellow-400',
        glow: 'hover:shadow-yellow-500/20',
      };
    case 'direita':
      return {
        border: 'border-blue-500/30',
        bg: 'bg-blue-950/40',
        hoverBg: 'hover:bg-blue-950/60',
        badge: 'bg-blue-500/20 text-blue-400',
        glow: 'hover:shadow-blue-500/20',
      };
    default:
      return {
        border: 'border-border',
        bg: 'bg-card/50',
        hoverBg: 'hover:bg-card',
        badge: 'bg-muted text-muted-foreground',
        glow: 'hover:shadow-primary/10',
      };
  }
};

function DocumentarioSkeleton() {
  return (
    <Card className="overflow-hidden bg-card/50 border-border">
      <div className="flex gap-4 p-3">
        <Skeleton className="flex-shrink-0 w-32 h-20 md:w-40 md:h-24 rounded-lg" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2 mt-3" />
        </div>
      </div>
    </Card>
  );
}

export function PoliticaDocumentarios({ orientacao }: PoliticaDocumentariosProps) {
  const navigate = useNavigate();
  const { data: documentarios, isLoading, error } = usePoliticaDocumentarios(orientacao);
  const colors = getOrientacaoColors(orientacao);

  const handlePlay = (doc: DocumentarioPolitico & { id?: string }) => {
    // Se temos o ID do banco, navegar para a página dedicada
    if (doc.id) {
      navigate(`/politica/documentario/${doc.id}`);
    } else {
      // Fallback: abrir no YouTube
      window.open(`https://www.youtube.com/watch?v=${doc.videoId}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Documentários</h2>
        {!isLoading && documentarios && (
          <span className="text-xs text-muted-foreground ml-auto">
            {documentarios.length} vídeos
          </span>
        )}
        {isLoading && (
          <Loader2 className="w-4 h-4 ml-auto animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <DocumentarioSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <Film className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Erro ao carregar documentários</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tente novamente mais tarde</p>
        </div>
      )}

      {/* Lista de documentários */}
      {!isLoading && documentarios && documentarios.length > 0 && (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {documentarios.map((doc) => (
            <motion.div key={doc.videoId} variants={cardVariants}>
              <Card
                className={`overflow-hidden transition-all cursor-pointer group ${colors.bg} ${colors.border} ${colors.hoverBg} hover:shadow-lg ${colors.glow}`}
                onClick={() => handlePlay(doc)}
              >
                <div className="flex gap-4 p-3">
                  {/* Thumbnail com play e contador */}
                  <DocumentarioThumbnail
                    thumbnail={doc.thumbnail}
                    videoId={doc.videoId}
                    titulo={doc.titulo}
                    duracao={doc.duracao}
                    totalComentarios={(doc as any).total_comentarios}
                  />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-1">
                        {doc.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 hidden md:block">
                        {doc.descricao}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Youtube className="w-3 h-3 text-red-500" />
                        <span className="truncate max-w-[120px]">{doc.canal}</span>
                      </div>
                      {doc.visualizacoes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          <span>{doc.visualizacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && !error && (!documentarios || documentarios.length === 0) && (
        <div className="text-center py-12">
          <Film className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum documentário disponível</p>
        </div>
      )}
    </div>
  );
}
