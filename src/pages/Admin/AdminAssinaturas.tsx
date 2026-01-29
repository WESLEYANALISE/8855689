import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Clock, XCircle, DollarSign, Search, MousePointer, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  payment_method: string;
  amount: number;
  status: string;
  created_at: string;
  expiration_date: string | null;
  profiles?: {
    nome: string | null;
    email: string | null;
  } | null;
}

interface PlanAnalytics {
  id: string;
  plan_type: string;
  action: string;
  device: string | null;
  created_at: string;
}

const AdminAssinaturas = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPlano, setFiltroPlano] = useState<string>("todos");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");

  // Buscar assinaturas com dados do usuário
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      // Buscar subscriptions
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (subsError) throw subsError;

      // Buscar profiles dos usuários
      const userIds = [...new Set((subs || []).map(s => s.user_id).filter(Boolean))];
      let profilesMap: Record<string, { nome: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", userIds);
        
        (profiles || []).forEach((p) => {
          profilesMap[p.id] = { nome: p.nome, email: p.email };
        });
      }

      // Combinar dados
      return (subs || []).map(sub => ({
        ...sub,
        profiles: profilesMap[sub.user_id] || null,
      })) as Subscription[];
    },
  });

  // Buscar analytics de cliques
  const { data: analytics = [], isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-plan-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_click_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data || []) as PlanAnalytics[];
    },
  });

  // Calcular estatísticas
  const stats = {
    ativas: subscriptions.filter((s) => s.status === "authorized").length,
    pendentes: subscriptions.filter((s) => s.status === "pending").length,
    canceladas: subscriptions.filter((s) => s.status === "cancelled" || s.status === "rejected").length,
    receita: subscriptions
      .filter((s) => s.status === "authorized")
      .reduce((acc, s) => acc + (s.amount || 0), 0),
  };

  // Estatísticas de analytics
  const analyticsStats = {
    verMais: analytics.filter((a) => a.action === "view_more").length,
    abrirModal: analytics.filter((a) => a.action === "open_modal").length,
    selecionarPix: analytics.filter((a) => a.action === "select_pix").length,
    selecionarCartao: analytics.filter((a) => a.action === "select_card").length,
    mensal: analytics.filter((a) => a.plan_type === "mensal").length,
    vitalicio: analytics.filter((a) => a.plan_type === "vitalicio").length,
  };

  // Filtrar subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesBusca =
      !busca ||
      sub.profiles?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(busca.toLowerCase());
    
    const matchesStatus = filtroStatus === "todos" || sub.status === filtroStatus;
    const matchesPlano = filtroPlano === "todos" || sub.plan_type === filtroPlano;
    const matchesMetodo = filtroMetodo === "todos" || sub.payment_method === filtroMetodo;

    return matchesBusca && matchesStatus && matchesPlano && matchesMetodo;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      authorized: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Ativo" },
      pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pendente" },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", label: "Cancelado" },
      rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeitado" },
    };
    const { bg, text, label } = config[status] || { bg: "bg-zinc-500/20", text: "text-zinc-400", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Métricas e gestão de assinaturas premium
            </p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-emerald-500/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-emerald-500" />
                Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-2xl font-bold text-emerald-400">{stats.ativas}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-amber-500/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-2xl font-bold text-amber-400">{stats.pendentes}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-red-500/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-2xl font-bold text-red-400">{stats.canceladas}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-2xl font-bold text-primary">
                R$ {stats.receita.toFixed(2).replace(".", ",")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Cliques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                Ver Mais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-blue-400">{analyticsStats.verMais}</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-violet-500" />
                Abrir Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-violet-400">{analyticsStats.abrirModal}</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                Plano Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-cyan-400">{analyticsStats.mensal}</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Plano Vitalício
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-amber-400">{analyticsStats.vitalicio}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="authorized">Ativo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPlano} onValueChange={setFiltroPlano}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Planos</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="vitalicio">Vitalício</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Métodos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de assinaturas */}
        <Card>
          <CardContent className="p-0">
            {loadingSubscriptions ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando assinaturas...
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma assinatura encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Expira</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.profiles?.nome || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {sub.profiles?.email || "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {sub.plan_type}
                        </TableCell>
                        <TableCell className="uppercase text-xs">
                          {sub.payment_method}
                        </TableCell>
                        <TableCell>
                          R$ {(sub.amount || 0).toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(sub.created_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(sub.expiration_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAssinaturas;
