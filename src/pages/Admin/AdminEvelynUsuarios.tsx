import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Search, Loader2, CheckCircle, XCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface EvelynUsuario {
  id: string;
  nome: string | null;
  telefone: string;
  foto_perfil: string | null;
  autorizado: boolean;
  ativo: boolean;
  total_mensagens: number;
  created_at: string;
  ultimo_contato: string | null;
  periodo_teste_expirado: boolean;
}

const AdminEvelynUsuarios = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["admin-evelyn-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evelyn_usuarios")
        .select("id, nome, telefone, foto_perfil, autorizado, ativo, total_mensagens, created_at, ultimo_contato, periodo_teste_expirado")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EvelynUsuario[];
    },
  });

  const usuariosFiltrados = usuarios?.filter((u) => {
    const termo = busca.toLowerCase();
    return (
      u.nome?.toLowerCase().includes(termo) ||
      u.telefone?.includes(termo)
    );
  });

  const formatarTelefone = (telefone: string) => {
    // Remove o 55 do início se existir
    const semPais = telefone.startsWith("55") ? telefone.slice(2) : telefone;
    // Formata como (XX) XXXXX-XXXX
    if (semPais.length === 11) {
      return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`;
    }
    if (semPais.length === 10) {
      return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 6)}-${semPais.slice(6)}`;
    }
    return telefone;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-500" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Usuários Evelyn</h1>
              <p className="text-sm text-muted-foreground">
                {usuarios?.length || 0} usuários no WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {usuariosFiltrados?.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={usuario.foto_perfil || undefined} />
                  <AvatarFallback className="bg-green-500/20 text-green-500">
                    {usuario.nome?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground truncate">
                      {usuario.nome || "Sem nome"}
                    </p>
                    {usuario.autorizado ? (
                      <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Autorizado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                        <XCircle className="h-3 w-3 mr-1" />
                        Não autorizado
                      </Badge>
                    )}
                    {usuario.periodo_teste_expirado && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                        <Crown className="h-3 w-3 mr-1" />
                        Teste expirado
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    📱 {formatarTelefone(usuario.telefone)}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>💬 {usuario.total_mensagens} mensagens</span>
                    <span>📅 {new Date(usuario.created_at).toLocaleDateString("pt-BR")}</span>
                    {usuario.ultimo_contato && (
                      <span>⏱️ Último: {new Date(usuario.ultimo_contato).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {usuariosFiltrados?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvelynUsuarios;
