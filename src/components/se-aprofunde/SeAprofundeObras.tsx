import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Loader2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Obra {
  id: string;
  titulo: string;
  ano: number | null;
  editora: string | null;
  descricao: string | null;
  capa_url: string | null;
  link_compra: string | null;
  membro: {
    nome: string;
    foto_url: string | null;
  } | null;
}

interface SeAprofundeObrasProps {
  instituicao: string;
  config: {
    nome: string;
    sigla: string;
    cor: string;
    corBg: string;
  };
}

const SeAprofundeObras = ({ instituicao, config }: SeAprofundeObrasProps) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObras();
  }, [instituicao]);

  const fetchObras = async () => {
    try {
      // Primeiro buscar os membros da instituição
      const { data: membros, error: membrosError } = await supabase
        .from("aprofundamento_membros")
        .select("id")
        .eq("instituicao", instituicao);

      if (membrosError) throw membrosError;

      if (!membros || membros.length === 0) {
        setObras([]);
        setLoading(false);
        return;
      }

      const membroIds = membros.map(m => m.id);

      // Buscar obras desses membros
      const { data, error } = await supabase
        .from("aprofundamento_obras")
        .select(`
          *,
          membro:aprofundamento_membros(nome, foto_url)
        `)
        .in("membro_id", membroIds)
        .order("ano", { ascending: false });

      if (error) throw error;
      setObras(data || []);
    } catch (error) {
      console.error("Erro ao buscar obras:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className={`w-12 h-12 mx-auto mb-4 ${config.cor} opacity-50`} />
        <p className="text-muted-foreground">
          Nenhuma obra cadastrada ainda para membros do {config.sigla}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          As obras serão adicionadas em breve
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {obras.length} {obras.length === 1 ? "obra publicada" : "obras publicadas"}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {obras.map((obra, index) => (
          <motion.div
            key={obra.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover:scale-[1.02] transition-all border-border/50 hover:border-primary/30"
              onClick={() => obra.link_compra && window.open(obra.link_compra, '_blank')}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Capa */}
                  <div className={`w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 ${config.corBg}`}>
                    {obra.capa_url ? (
                      <img 
                        src={obra.capa_url} 
                        alt={obra.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className={`w-6 h-6 ${config.cor}`} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                      {obra.titulo}
                    </h3>
                    
                    {obra.membro && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                          {obra.membro.foto_url ? (
                            <img 
                              src={obra.membro.foto_url}
                              alt={obra.membro.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 m-1 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {obra.membro.nome}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {obra.ano && (
                        <span className={`text-xs ${config.cor}`}>
                          {obra.ano}
                        </span>
                      )}
                      {obra.editora && (
                        <span className="text-xs text-muted-foreground">
                          • {obra.editora}
                        </span>
                      )}
                    </div>
                  </div>

                  {obra.link_compra && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {obra.descricao && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                    {obra.descricao}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SeAprofundeObras;
