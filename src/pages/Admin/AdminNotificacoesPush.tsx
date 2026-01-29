import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Send, Users, CheckCircle, XCircle, Loader2, Image, Link as LinkIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificacaoEnviada {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  imagem_url: string | null;
  total_enviados: number;
  total_sucesso: number;
  total_falha: number;
  created_at: string;
}

const AdminNotificacoesPush = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [link, setLink] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  
  const [totalDispositivos, setTotalDispositivos] = useState(0);
  const [historico, setHistorico] = useState<NotificacaoEnviada[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    try {
      // Contar dispositivos ativos
      const { count } = await supabase
        .from('dispositivos_fcm')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      setTotalDispositivos(count || 0);
      
      // Buscar histórico de notificações
      const { data } = await supabase
        .from('notificacoes_push_enviadas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setHistorico((data as NotificacaoEnviada[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const enviarNotificacao = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem",
        variant: "destructive"
      });
      return;
    }
    
    setEnviando(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('enviar-push-fcm', {
        body: {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          link: link.trim() || undefined,
          imagem_url: imagemUrl.trim() || undefined
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Notificação enviada!",
        description: data.mensagem || `${data.sucesso} de ${data.total} dispositivos receberam`,
      });
      
      // Limpar formulário
      setTitulo("");
      setMensagem("");
      setLink("");
      setImagemUrl("");
      
      // Recarregar dados
      carregarDados();
      
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notificações Push
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Envie notificações para todos os dispositivos registrados
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDispositivos}</p>
                <p className="text-sm text-muted-foreground">dispositivos registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nova Notificação</CardTitle>
            <CardDescription>
              Preencha os campos para enviar uma notificação push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Nova funcionalidade disponível!"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{titulo.length}/50</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                placeholder="Escreva a mensagem que será exibida na notificação..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{mensagem.length}/200</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link (opcional)
              </Label>
              <Input
                id="link"
                placeholder="Ex: /novidades ou https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">URL para abrir ao clicar na notificação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Imagem (opcional)
              </Label>
              <Input
                id="imagem"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">URL de uma imagem para exibir na notificação</p>
            </div>

            <Button 
              onClick={enviarNotificacao} 
              disabled={enviando || !titulo.trim() || !mensagem.trim()}
              className="w-full"
              size="lg"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {totalDispositivos} dispositivo{totalDispositivos !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Envios</CardTitle>
            <CardDescription>
              Últimas notificações enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historico.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma notificação enviada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {historico.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{notif.titulo}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatarData(notif.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {notif.total_sucesso}
                      </span>
                      {notif.total_falha > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" />
                          {notif.total_falha}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotificacoesPush;
