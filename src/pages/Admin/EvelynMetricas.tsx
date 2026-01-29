import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Activity, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatedBarChart } from "@/components/estatisticas/AnimatedBarChart";
import { AnimatedPieChart } from "@/components/estatisticas/AnimatedPieChart";
import { TrendChart } from "@/components/estatisticas/TrendChart";

interface DadosDiarios {
  data: string;
  mensagens_usuario: number;
  mensagens_evelyn: number;
}

interface MetricasGerais {
  totalUsuarios: number;
  totalMensagens: number;
  usuariosAtivosHoje: number;
  taxaConversao: number;
  assinantes: number;
}

interface TipoMensagem {
  nome: string;
  quantidade: number;
  cor: string;
}

export default function EvelynMetricas() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [metricas, setMetricas] = useState<MetricasGerais>({
    totalUsuarios: 0,
    totalMensagens: 0,
    usuariosAtivosHoje: 0,
    taxaConversao: 0,
    assinantes: 0,
  });
  const [mensagensPorDia, setMensagensPorDia] = useState<DadosDiarios[]>([]);
  const [novosPorDia, setNovosPorDia] = useState<{ nome: string; valor: number; cor: string }[]>([]);
  const [tiposMensagem, setTiposMensagem] = useState<TipoMensagem[]>([]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Total de usuários Evelyn
      const { count: totalUsuarios } = await supabase
        .from("evelyn_usuarios")
        .select("*", { count: "exact", head: true });

      // Total de mensagens
      const { count: totalMensagens } = await supabase
        .from("evelyn_mensagens")
        .select("*", { count: "exact", head: true });

      // Assinantes ativos
      const { count: assinantes } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "authorized");

      // Usuários ativos hoje (conversas com mensagens hoje)
      const hoje = new Date().toISOString().split("T")[0];
      const { data: conversasHoje } = await supabase
        .from("evelyn_mensagens")
        .select("conversa_id")
        .gte("created_at", `${hoje}T00:00:00`)
        .eq("remetente", "usuario");
      
      const conversasUnicas = new Set(conversasHoje?.map(m => m.conversa_id) || []);

      // Calcular taxa de conversão
      const taxa = totalUsuarios && totalUsuarios > 0 
        ? ((assinantes || 0) / totalUsuarios) * 100 
        : 0;

      setMetricas({
        totalUsuarios: totalUsuarios || 0,
        totalMensagens: totalMensagens || 0,
        usuariosAtivosHoje: conversasUnicas.size,
        taxaConversao: Math.round(taxa * 10) / 10,
        assinantes: assinantes || 0,
      });

      // Mensagens por dia (últimos 30 dias)
      const { data: mensagens } = await supabase
        .from("evelyn_mensagens")
        .select("created_at, remetente")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

      const mensagensPorData: Record<string, { usuario: number; evelyn: number }> = {};
      mensagens?.forEach((m) => {
        const data = m.created_at.split("T")[0];
        if (!mensagensPorData[data]) {
          mensagensPorData[data] = { usuario: 0, evelyn: 0 };
        }
        if (m.remetente === "usuario") {
          mensagensPorData[data].usuario++;
        } else {
          mensagensPorData[data].evelyn++;
        }
      });

      const dadosTrend = Object.entries(mensagensPorData).map(([data, valores]) => ({
        data,
        mensagens_usuario: valores.usuario,
        mensagens_evelyn: valores.evelyn,
      }));
      setMensagensPorDia(dadosTrend);

      // Novos usuários por dia (últimos 7 dias)
      const { data: usuarios } = await supabase
        .from("evelyn_usuarios")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const novosPorData: Record<string, number> = {};
      usuarios?.forEach((u) => {
        const data = u.created_at.split("T")[0];
        novosPorData[data] = (novosPorData[data] || 0) + 1;
      });

      const cores = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(199, 89%, 48%)", "hsl(0, 72%, 51%)"];
      const dadosNovos = Object.entries(novosPorData).map(([data, valor], i) => ({
        nome: new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        valor,
        cor: cores[i % cores.length],
      }));
      setNovosPorDia(dadosNovos);

      // Tipos de mensagem
      const { data: tiposData } = await supabase
        .from("evelyn_mensagens")
        .select("tipo")
        .eq("remetente", "usuario");

      const contagem: Record<string, number> = {};
      tiposData?.forEach((m) => {
        const tipo = m.tipo || "texto";
        contagem[tipo] = (contagem[tipo] || 0) + 1;
      });

      const coresTipos: Record<string, string> = {
        texto: "hsl(var(--primary))",
        audio: "hsl(142, 76%, 36%)",
        imagem: "hsl(38, 92%, 50%)",
        documento: "hsl(280, 65%, 60%)",
      };

      const dadosTipos = Object.entries(contagem).map(([tipo, quantidade]) => ({
        nome: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        quantidade,
        cor: coresTipos[tipo] || "hsl(var(--muted))",
      }));
      setTiposMensagem(dadosTipos);

    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const dadosTrendFormatados = mensagensPorDia.map((d) => ({
    mes: new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    novos: d.mensagens_usuario,
    baixados: d.mensagens_evelyn,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Métricas da Evelyn</h1>
              <p className="text-xs text-muted-foreground">Análise de uso e conversão</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${carregando ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Usuários</span>
            </div>
            <p className="text-2xl font-bold">{metricas.totalUsuarios}</p>
            <p className="text-xs text-muted-foreground mt-1">{metricas.assinantes} assinantes</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Mensagens</span>
            </div>
            <p className="text-2xl font-bold">{metricas.totalMensagens}</p>
            <p className="text-xs text-muted-foreground mt-1">total trocadas</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Ativos Hoje</span>
            </div>
            <p className="text-2xl font-bold">{metricas.usuariosAtivosHoje}</p>
            <p className="text-xs text-muted-foreground mt-1">usuários</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Conversão</span>
            </div>
            <p className="text-2xl font-bold">{metricas.taxaConversao}%</p>
            <p className="text-xs text-muted-foreground mt-1">para assinantes</p>
          </Card>
        </div>

        {/* Gráfico de Mensagens por Dia */}
        {dadosTrendFormatados.length > 0 && (
          <TrendChart
            data={dadosTrendFormatados}
            titulo="Mensagens por Dia"
            subtitulo="Últimos 30 dias - Usuário vs Evelyn"
          />
        )}

        {/* Grid de gráficos menores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Novos Usuários */}
          {novosPorDia.length > 0 && (
            <AnimatedBarChart
              data={novosPorDia}
              titulo="Novos Usuários"
              subtitulo="Últimos 7 dias"
            />
          )}

          {/* Tipos de Mensagem */}
          {tiposMensagem.length > 0 && (
            <AnimatedPieChart
              data={tiposMensagem}
              titulo="Tipos de Mensagem"
              subtitulo="Distribuição por formato"
            />
          )}
        </div>
      </div>
    </div>
  );
}
