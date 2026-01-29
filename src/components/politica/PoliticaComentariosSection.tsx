import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComentarios } from "@/hooks/usePoliticaComentarios";
import { ComentarioForm } from "./ComentarioForm";
import { ComentarioItem } from "./ComentarioItem";
import { MessageCircle, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface PoliticaComentariosSectionProps {
  artigoId: number;
}

type SortOption = 'recent' | 'popular';

export const PoliticaComentariosSection = ({ artigoId }: PoliticaComentariosSectionProps) => {
  const { data: comentarios, isLoading } = useComentarios(artigoId);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const sortedComentarios = [...(comentarios || [])].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalComentarios = (comentarios || []).reduce((acc, c) => {
    return acc + 1 + (c.respostas?.length || 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Discussão
              {totalComentarios > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalComentarios} {totalComentarios === 1 ? 'comentário' : 'comentários'})
                </span>
              )}
            </CardTitle>

            {totalComentarios > 1 && (
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Mais recentes
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Mais curtidos
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Form para novo comentário */}
          <ComentarioForm artigoId={artigoId} />

          {/* Separador */}
          {totalComentarios > 0 && (
            <div className="border-t border-border/50" />
          )}

          {/* Lista de comentários */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedComentarios.length > 0 ? (
            <div className="space-y-6">
              {sortedComentarios.map((comentario) => (
                <ComentarioItem
                  key={comentario.id}
                  comentario={comentario}
                  artigoId={artigoId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Seja o primeiro a comentar!
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Compartilhe sua opinião sobre este tema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
