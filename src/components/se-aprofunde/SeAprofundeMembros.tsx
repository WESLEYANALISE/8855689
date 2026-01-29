import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Membro {
  id: string;
  nome: string;
  nome_completo?: string | null;
  cargo?: string | null;
  foto_url?: string | null;
  biografia?: string | null;
  formacao?: string | null;
  carreira?: string | null;
  data_posse?: string | null;
  indicado_por?: string | null;
  decisoes_importantes?: string[] | null;
}

interface SeAprofundeMembrosProps {
  instituicao: string;
  config: {
    nome: string;
    sigla: string;
    cor: string;
    corBg: string;
  };
}

const SeAprofundeMembros = ({ instituicao, config }: SeAprofundeMembrosProps) => {
  const navigate = useNavigate();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembros();
  }, [instituicao]);

  const fetchMembros = async () => {
    try {
      setLoading(true);
      
      if (instituicao === 'stf') {
        // Buscar da tabela existente que já tem dados completos
        const { data, error } = await supabase
          .from("tres_poderes_ministros_stf")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (error) throw error;
        
        // Mapear para o formato esperado
        setMembros((data || []).map(m => ({
          id: m.id,
          nome: m.nome,
          nome_completo: m.nome_completo,
          foto_url: m.foto_wikipedia || m.foto_url,
          biografia: m.biografia,
          formacao: m.formacao,
          carreira: m.carreira,
          data_posse: m.data_posse,
          indicado_por: m.indicado_por,
          cargo: 'Ministro do STF',
          decisoes_importantes: m.decisoes_importantes
        })));
      } else if (instituicao === 'camara') {
        // Buscar deputados da API da Câmara
        const { data, error } = await supabase.functions.invoke('buscar-deputados', {
          body: { idLegislatura: 57 } // Legislatura atual
        });
        
        if (error) throw error;
        
        setMembros((data?.deputados || []).slice(0, 50).map((d: any) => ({
          id: d.id?.toString() || d.uri,
          nome: d.nome,
          nome_completo: d.nome,
          foto_url: d.urlFoto,
          cargo: `Deputado(a) Federal - ${d.siglaPartido}/${d.siglaUf}`,
          biografia: null
        })));
      } else if (instituicao === 'senado') {
        // Buscar senadores da API do Senado
        const { data, error } = await supabase.functions.invoke('buscar-senadores', {
          body: {}
        });
        
        if (error) throw error;
        
        setMembros((data?.senadores || []).map((s: any) => ({
          id: s.codigo?.toString() || s.id,
          nome: s.nome,
          nome_completo: s.nomeCompleto || s.nome,
          foto_url: s.foto,
          cargo: `Senador(a) - ${s.partido}/${s.uf}`,
          biografia: null
        })));
      } else {
        // Para STJ e Presidência, buscar da tabela aprofundamento_membros
        const { data, error } = await supabase
          .from("aprofundamento_membros")
          .select("*")
          .eq("instituicao", instituicao)
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (error) throw error;
        setMembros(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMembroClick = (membro: Membro) => {
    navigate(`/se-aprofunde/${instituicao}/membro/${membro.id}`, {
      state: { membro }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (membros.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className={`w-12 h-12 mx-auto mb-4 ${config.cor} opacity-50`} />
        <p className="text-muted-foreground">
          Nenhum membro cadastrado ainda para {config.sigla}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Os dados serão carregados em breve
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {membros.length} {membros.length === 1 ? "membro" : "membros"} {instituicao === 'stf' ? 'ativos' : ''}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {membros.map((membro, index) => (
          <motion.div
            key={membro.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover:scale-105 transition-all border-border/50 hover:border-primary/30"
              onClick={() => handleMembroClick(membro)}
            >
              <CardContent className="p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-muted">
                  {membro.foto_url ? (
                    <img 
                      src={membro.foto_url} 
                      alt={membro.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-xs text-foreground line-clamp-2">
                  {membro.nome}
                </h3>
                {membro.cargo && (
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                    {membro.cargo}
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

export default SeAprofundeMembros;
