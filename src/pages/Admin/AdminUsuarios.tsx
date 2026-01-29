import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Trash2, Ban, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Usuario {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
}

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [acaoDialogo, setAcaoDialogo] = useState<"excluir" | "banir" | null>(null);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Usuario[];
    },
  });

  const gerenciarUsuarioMutation = useMutation({
    mutationFn: async ({ acao, usuario }: { acao: "excluir" | "banir"; usuario: Usuario }) => {
      const { data, error } = await supabase.functions.invoke("admin-gerenciar-usuario", {
        body: {
          acao,
          userId: usuario.id,
          email: usuario.email,
          telefone: usuario.telefone,
          motivo: acao === "banir" ? "Banido pelo administrador" : undefined,
          banidoPor: "Admin",
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success(
        variables.acao === "banir" 
          ? "Usuário banido com sucesso" 
          : "Usuário excluído com sucesso"
      );
      setUsuarioSelecionado(null);
      setAcaoDialogo(null);
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const usuariosFiltrados = usuarios?.filter((u) => {
    const termo = busca.toLowerCase();
    return (
      u.nome?.toLowerCase().includes(termo) ||
      u.email?.toLowerCase().includes(termo) ||
      u.telefone?.includes(termo)
    );
  });

  const handleAcao = (usuario: Usuario, acao: "excluir" | "banir") => {
    setUsuarioSelecionado(usuario);
    setAcaoDialogo(acao);
  };

  const confirmarAcao = () => {
    if (usuarioSelecionado && acaoDialogo) {
      gerenciarUsuarioMutation.mutate({ acao: acaoDialogo, usuario: usuarioSelecionado });
    }
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
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Usuários</h1>
              <p className="text-sm text-muted-foreground">
                {usuarios?.length || 0} usuários cadastrados
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
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
                className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {usuario.nome || "Sem nome"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {usuario.telefone || "Sem telefone"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastrado em: {new Date(usuario.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcao(usuario, "excluir")}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAcao(usuario, "banir")}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Banir
                  </Button>
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

      {/* Diálogo de confirmação */}
      <AlertDialog open={!!acaoDialogo} onOpenChange={() => setAcaoDialogo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acaoDialogo === "banir" ? "Banir usuário?" : "Excluir usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acaoDialogo === "banir" ? (
                <>
                  O usuário <strong>{usuarioSelecionado?.nome || usuarioSelecionado?.email}</strong> será
                  removido e não poderá se cadastrar novamente com este email ou telefone.
                </>
              ) : (
                <>
                  O usuário <strong>{usuarioSelecionado?.nome || usuarioSelecionado?.email}</strong> será
                  removido permanentemente. Ele poderá se cadastrar novamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarAcao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={gerenciarUsuarioMutation.isPending}
            >
              {gerenciarUsuarioMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : acaoDialogo === "banir" ? (
                "Banir"
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsuarios;
