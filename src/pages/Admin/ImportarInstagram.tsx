import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Instagram, Plus, Trash2, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PerfilSalvo {
  username: string;
  ultimaImportacao: string | null;
  totalImportados: number;
}

interface ImportacaoLog {
  perfil: string;
  quantidade: number;
  data: string;
  tipo: string;
}

const ImportarInstagram = () => {
  const navigate = useNavigate();
  const [novoUsername, setNovoUsername] = useState("");
  const [perfis, setPerfis] = useState<PerfilSalvo[]>([]);
  const [importando, setImportando] = useState<string | null>(null);
  const [logs, setLogs] = useState<ImportacaoLog[]>([]);
  const [stats, setStats] = useState({ total: 0, instagram: 0, reels: 0 });

  useEffect(() => {
    carregarPerfis();
    carregarStats();
  }, []);

  const carregarPerfis = () => {
    const saved = localStorage.getItem("instagram_perfis");
    if (saved) {
      setPerfis(JSON.parse(saved));
    } else {
      // Perfis jurídicos sugeridos
      const perfisPadrao: PerfilSalvo[] = [
        { username: "staboradas", ultimaImportacao: null, totalImportados: 0 },
        { username: "migaboradas", ultimaImportacao: null, totalImportados: 0 },
        { username: "migaboradas.trabalhista", ultimaImportacao: null, totalImportados: 0 },
        { username: "migaboradas.tributario", ultimaImportacao: null, totalImportados: 0 },
        { username: "migaboradas.civil", ultimaImportacao: null, totalImportados: 0 },
        { username: "migaboradas.penal", ultimaImportacao: null, totalImportados: 0 },
        { username: "direitosimplificado", ultimaImportacao: null, totalImportados: 0 },
        { username: "prof.lucaspavione", ultimaImportacao: null, totalImportados: 0 },
        { username: "dfrancisco.penalista", ultimaImportacao: null, totalImportados: 0 },
      ];
      setPerfis(perfisPadrao);
      localStorage.setItem("instagram_perfis", JSON.stringify(perfisPadrao));
    }

    const logsData = localStorage.getItem("instagram_logs");
    if (logsData) {
      setLogs(JSON.parse(logsData));
    }
  };

  const carregarStats = async () => {
    const { count: total } = await supabase
      .from("posts_juridicos")
      .select("*", { count: "exact", head: true });

    const { count: instagram } = await supabase
      .from("posts_juridicos")
      .select("*", { count: "exact", head: true })
      .eq("fonte", "instagram");

    const { count: reels } = await supabase
      .from("posts_juridicos")
      .select("*", { count: "exact", head: true })
      .eq("tipo_midia", "reel");

    setStats({
      total: total || 0,
      instagram: instagram || 0,
      reels: reels || 0,
    });
  };

  const salvarPerfis = (novos: PerfilSalvo[]) => {
    setPerfis(novos);
    localStorage.setItem("instagram_perfis", JSON.stringify(novos));
  };

  const adicionarPerfil = () => {
    if (!novoUsername.trim()) return;

    const username = novoUsername.replace("@", "").trim().toLowerCase();
    if (perfis.some((p) => p.username === username)) {
      toast.error("Perfil já adicionado");
      return;
    }

    const novos = [...perfis, { username, ultimaImportacao: null, totalImportados: 0 }];
    salvarPerfis(novos);
    setNovoUsername("");
    toast.success(`Perfil @${username} adicionado`);
  };

  const removerPerfil = (username: string) => {
    const novos = perfis.filter((p) => p.username !== username);
    salvarPerfis(novos);
    toast.success(`Perfil @${username} removido`);
  };

  const importarPosts = async (username: string, tipo: "posts" | "reels" = "posts") => {
    setImportando(`${username}-${tipo}`);
    
    try {
      const { data, error } = await supabase.functions.invoke("apify-instagram-posts", {
        body: {
          usernames: [username],
          resultsLimit: 20,
          tipo,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Importados ${data.total} ${tipo} de @${username}`);

        // Atualizar perfil
        const novos = perfis.map((p) =>
          p.username === username
            ? {
                ...p,
                ultimaImportacao: new Date().toISOString(),
                totalImportados: p.totalImportados + data.total,
              }
            : p
        );
        salvarPerfis(novos);

        // Adicionar log
        const novoLog: ImportacaoLog = {
          perfil: username,
          quantidade: data.total,
          data: new Date().toISOString(),
          tipo,
        };
        const novosLogs = [novoLog, ...logs].slice(0, 20);
        setLogs(novosLogs);
        localStorage.setItem("instagram_logs", JSON.stringify(novosLogs));

        carregarStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error(`Erro ao importar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setImportando(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Instagram className="h-6 w-6 text-pink-500" />
            <h1 className="text-xl font-bold">Importar do Instagram</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total de Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-pink-500">{stats.instagram}</div>
              <div className="text-sm text-muted-foreground">Do Instagram</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-500">{stats.reels}</div>
              <div className="text-sm text-muted-foreground">Reels</div>
            </CardContent>
          </Card>
        </div>

        {/* Adicionar perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Perfil</CardTitle>
            <CardDescription>
              Adicione perfis jurídicos do Instagram para importar posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="@migaboradas"
                value={novoUsername}
                onChange={(e) => setNovoUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarPerfil()}
              />
              <Button onClick={adicionarPerfil}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de perfis */}
        <Card>
          <CardHeader>
            <CardTitle>Perfis Salvos</CardTitle>
            <CardDescription>
              Clique em "Importar" para buscar os últimos posts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {perfis.map((perfil) => (
              <div
                key={perfil.username}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">@{perfil.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {perfil.ultimaImportacao
                        ? `Última: ${new Date(perfil.ultimaImportacao).toLocaleDateString("pt-BR")}`
                        : "Nunca importado"}
                      {perfil.totalImportados > 0 && ` • ${perfil.totalImportados} importados`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarPosts(perfil.username, "reels")}
                    disabled={importando !== null}
                  >
                    {importando === `${perfil.username}-reels` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reels"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => importarPosts(perfil.username, "posts")}
                    disabled={importando !== null}
                  >
                    {importando === `${perfil.username}-posts` ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removerPerfil(perfil.username)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {perfis.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum perfil adicionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.tipo === "reels" ? "secondary" : "default"}>
                      {log.tipo}
                    </Badge>
                    <span>@{log.perfil}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{log.quantidade} posts</span>
                    <span>•</span>
                    <span>{new Date(log.data).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Botão ver posts */}
        <Button className="w-full" onClick={() => navigate("/posts-juridicos")}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Ver Posts Jurídicos
        </Button>
      </div>
    </div>
  );
};

export default ImportarInstagram;
