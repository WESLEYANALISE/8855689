import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  MessageCircle, 
  QrCode as QrCodeIcon, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Send, 
  Users, 
  MessageSquare,
  Settings,
  Loader2,
  Phone,
  Trash2,
  Plus,
  User,
  Eraser,
  UserMinus,
  RotateCcw,
  Copy,
  Link,
  CheckCircle,
  Search,
  Download,
  Ban,
  Smartphone,
  Bot,
  Webhook,
  Sparkles,
  MessageCircleHeart,
  BookOpen,
  Volume2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Conversa {
  id: string;
  telefone: string;
  status: string;
  created_at: string;
  updated_at: string;
  usuario_id?: string;
  usuario?: {
    nome: string | null;
    total_mensagens: number;
    foto_perfil: string | null;
  };
}

interface Mensagem {
  id: string;
  tipo: string;
  conteudo: string;
  remetente: string;
  created_at: string;
}

interface Usuario {
  id: string;
  telefone: string;
  nome: string | null;
  foto_perfil: string | null;
  total_mensagens: number;
  created_at: string;
  ultimo_contato: string | null;
  bloqueado?: boolean;
  autorizado?: boolean;
}

interface Config {
  id: string;
  instance_name: string;
  status: string;
  qr_code: string | null;
  pairing_code?: string | null;
  telefone_conectado: string | null;
  // Novas configurações avançadas
  limite_caracteres?: number;
  estilo_resposta?: string;
  nivel_detalhamento?: string;
  usar_nome?: boolean;
  saudacao_horario?: boolean;
  perguntar_nome_inicio?: boolean;
  recomendar_livros?: boolean;
  feedback_audio_interativo?: boolean;
}

export default function EvelynWhatsApp() {
  const navigate = useNavigate();
  // IMPORTANTE: Usar minúsculo para corresponder à instância no Railway
  const [instanceName, setInstanceName] = useState("evelyn");
  const [config, setConfig] = useState<Config | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [stats, setStats] = useState({ usuarios: 0, conversas: 0, mensagens: 0 });
  const [qrImageData, setQrImageData] = useState<string | null>(null);
  const [deletingConversa, setDeletingConversa] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [deletingUsuario, setDeletingUsuario] = useState<string | null>(null);
  const [togglingAutorizacao, setTogglingAutorizacao] = useState<string | null>(null);
  
  // Novos estados
  const [buscaConversa, setBuscaConversa] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [promptPersonalizado, setPromptPersonalizado] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Olá! Sou a Evelyn, assistente jurídica. Como posso ajudar?");
  
  // Estados de configuração avançada
  const [limiteCaracteres, setLimiteCaracteres] = useState(1000);
  const [estiloResposta, setEstiloResposta] = useState("didático");
  const [nivelDetalhamento, setNivelDetalhamento] = useState("normal");
  const [usarNome, setUsarNome] = useState(true);
  const [saudacaoHorario, setSaudacaoHorario] = useState(true);
  const [perguntarNomeInicio, setPerguntarNomeInicio] = useState(true);
  const [recomendarLivros, setRecomendarLivros] = useState(true);
  const [feedbackAudioInterativo, setFeedbackAudioInterativo] = useState(true);

  // URL do webhook
  const WEBHOOK_URL = "https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/webhook-evelyn";

  useEffect(() => {
    carregarConfig();
    carregarStats();
    carregarConversas();
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (conversaSelecionada) {
      carregarMensagens(conversaSelecionada);
    }
  }, [conversaSelecionada]);

  useEffect(() => {
    async function generateQrImage() {
      if (config?.qr_code && config.status !== 'conectado') {
        try {
          if (config.qr_code.startsWith('data:') || config.qr_code.length > 1000) {
            setQrImageData(config.qr_code.startsWith('data:') ? config.qr_code : `data:image/png;base64,${config.qr_code}`);
          } else {
            const dataUrl = await QRCode.toDataURL(config.qr_code, { 
              width: 256,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' }
            });
            setQrImageData(dataUrl);
          }
        } catch (error) {
          console.error('Erro ao gerar imagem do QR Code:', error);
          setQrImageData(null);
        }
      } else {
        setQrImageData(null);
      }
    }
    generateQrImage();
  }, [config?.qr_code, config?.status]);

  async function carregarConfig() {
    const { data } = await supabase
      .from('evelyn_config')
      .select('*')
      .eq('instance_name', instanceName)
      .maybeSingle();
    if (data) {
      setConfig(data as Config);
      if (data.welcome_message) setWelcomeMessage(data.welcome_message);
      if (data.personalidade) setPromptPersonalizado(data.personalidade);
      // Carregar configurações avançadas
      if (data.limite_caracteres) setLimiteCaracteres(data.limite_caracteres);
      if (data.estilo_resposta) setEstiloResposta(data.estilo_resposta);
      if (data.nivel_detalhamento) setNivelDetalhamento(data.nivel_detalhamento);
      if (data.usar_nome !== undefined) setUsarNome(data.usar_nome);
      if (data.saudacao_horario !== undefined) setSaudacaoHorario(data.saudacao_horario);
      if (data.perguntar_nome_inicio !== undefined) setPerguntarNomeInicio(data.perguntar_nome_inicio);
      if (data.recomendar_livros !== undefined) setRecomendarLivros(data.recomendar_livros);
      if (data.feedback_audio_interativo !== undefined) setFeedbackAudioInterativo(data.feedback_audio_interativo);
    }
  }

  async function carregarStats() {
    const [usuarios, conversas, mensagens] = await Promise.all([
      supabase.from('evelyn_usuarios').select('id', { count: 'exact', head: true }),
      supabase.from('evelyn_conversas').select('id', { count: 'exact', head: true }),
      supabase.from('evelyn_mensagens').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      usuarios: usuarios.count || 0,
      conversas: conversas.count || 0,
      mensagens: mensagens.count || 0,
    });
  }

  async function carregarConversas() {
    const { data } = await supabase
      .from('evelyn_conversas')
      .select(`*, usuario:evelyn_usuarios(nome, total_mensagens, foto_perfil)`)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversas(data as any);
  }

  async function carregarUsuarios() {
    const { data } = await supabase
      .from('evelyn_usuarios')
      .select('*')
      .order('ultimo_contato', { ascending: false })
      .limit(100);
    if (data) setUsuarios(data as Usuario[]);
  }

  // Toggle autorização de usuário
  async function toggleAutorizacao(usuario: Usuario) {
    setTogglingAutorizacao(usuario.id);
    try {
      const novoStatus = !usuario.autorizado;
      const { error } = await supabase
        .from('evelyn_usuarios')
        .update({ autorizado: novoStatus })
        .eq('id', usuario.id);
      
      if (error) throw error;
      
      // Atualizar lista local
      setUsuarios(prev => prev.map(u => 
        u.id === usuario.id ? { ...u, autorizado: novoStatus } : u
      ));
      
      toast.success(novoStatus ? 'Usuário autorizado!' : 'Usuário desautorizado!');
    } catch (error: any) {
      console.error('Erro ao alterar autorização:', error);
      toast.error('Erro ao alterar autorização');
    } finally {
      setTogglingAutorizacao(null);
    }
  }

  // Excluir usuário completamente (simula usuário novo)
  async function excluirUsuarioCompleto(usuario: Usuario) {
    setDeletingUsuario(usuario.id);
    try {
      // 1. Buscar conversas do usuário
      const { data: conversasUsuario } = await supabase
        .from('evelyn_conversas')
        .select('id')
        .eq('telefone', usuario.telefone);
      
      // 2. Deletar mensagens das conversas
      if (conversasUsuario && conversasUsuario.length > 0) {
        for (const conv of conversasUsuario) {
          await supabase.from('evelyn_mensagens').delete().eq('conversa_id', conv.id);
        }
      }
      
      // 3. Deletar conversas
      await supabase.from('evelyn_conversas').delete().eq('telefone', usuario.telefone);
      
      // 4. Deletar mapeamento de LID
      await supabase.from('evelyn_lid_mapping').delete().eq('telefone', usuario.telefone);
      
      // 5. Deletar memória do usuário (se existir) - usar as any por tabela não tipada
      await (supabase.from as any)('evelyn_memoria_usuario').delete().eq('user_id', usuario.id);
      
      // 6. Deletar progresso do usuário (se existir) - usar as any por tabela não tipada
      await (supabase.from as any)('evelyn_progresso_usuario').delete().eq('user_id', usuario.id);
      
      // 7. Finalmente, deletar o usuário
      const { error } = await supabase
        .from('evelyn_usuarios')
        .delete()
        .eq('id', usuario.id);
      
      if (error) throw error;
      
      // Atualizar listas
      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
      setConversas(prev => prev.filter(c => c.telefone !== usuario.telefone));
      await carregarStats();
      
      toast.success('Usuário excluído! Será tratado como novo na próxima mensagem.');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setDeletingUsuario(null);
    }
  }

  async function carregarMensagens(conversaId: string) {
    const { data } = await supabase
      .from('evelyn_mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true });
    if (data) setMensagens(data);
  }

  async function executarAcao(action: string) {
    setLoadingAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('gerenciar-instancia-evelyn', {
        body: { action, instanceName }
      });
      if (error) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
      await carregarConfig();
      
      // Verificar se realmente tem QR Code antes de mostrar sucesso
      if (action === 'conectar' || action === 'forcar-reconexao' || action === 'criar') {
        // Recarregar config para pegar dados atualizados
        const { data: updatedConfig } = await supabase
          .from('evelyn_config')
          .select('qr_code, status')
          .eq('instance_name', instanceName)
          .maybeSingle();
        
        if (updatedConfig?.qr_code || data?.qr_code) {
          toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        } else if (updatedConfig?.status === 'conectado') {
          toast.success("WhatsApp já está conectado!");
        } else {
          toast.warning("Instância preparada, mas QR Code não foi gerado. Tente novamente.");
        }
      } else {
        toast.success(`Ação "${action}" executada com sucesso!`);
      }
      return data;
    } catch (error: any) {
      console.error('Erro na ação:', error);
      toast.error(error.message || 'Erro ao executar ação');
    } finally {
      setLoadingAction(null);
    }
  }

  async function criarInstancia() { await executarAcao('criar'); }
  async function conectar() { await executarAcao('conectar'); }
  async function verificarStatus() { await executarAcao('status'); }
  async function desconectar() { await executarAcao('desconectar'); }
  async function configurarWebhook() {
    const result = await executarAcao('configurar-webhook');
    if (result) toast.success('Webhook configurado com sucesso!');
  }
  async function forcarReconexao() {
    const result = await executarAcao('forcar-reconexao');
    if (result) {
      toast.success('Reconexão forçada! Escaneie o novo QR Code.');
    }
  }

  async function copiarWebhookUrl() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setWebhookCopied(true);
      toast.success('URL copiada!');
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = WEBHOOK_URL;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setWebhookCopied(true);
      toast.success('URL copiada!');
      setTimeout(() => setWebhookCopied(false), 2000);
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  async function limparConversa(conversaId: string) {
    setDeletingConversa(true);
    try {
      await supabase.from('evelyn_mensagens').delete().eq('conversa_id', conversaId);
      await supabase.from('evelyn_conversas').update({ contexto: [] }).eq('id', conversaId);
      setMensagens([]);
      toast.success('Conversa limpa!');
    } catch (error) {
      toast.error('Erro ao limpar conversa');
    } finally {
      setDeletingConversa(false);
    }
  }

  // Zerar conversa completamente - faz a Evelyn tratar como usuário novo
  async function zerarConversa(conversa: Conversa) {
    setDeletingConversa(true);
    try {
      // 1. Deletar todas as mensagens
      await supabase.from('evelyn_mensagens').delete().eq('conversa_id', conversa.id);
      
      // 2. Resetar contexto e flags da conversa
      await supabase.from('evelyn_conversas')
        .update({ 
          contexto: [], 
          aguardando_nome: null,
          aguardando_confirmacao: null,
          quiz_atual: null,
          tema_atual: null
        })
        .eq('id', conversa.id);
      
      // 3. Resetar contador de mensagens do usuário (faz parecer novo)
      if (conversa.usuario_id) {
        await supabase.from('evelyn_usuarios')
          .update({ 
            total_mensagens: 0,
            nome: null // Remove o nome para a Evelyn perguntar novamente
          })
          .eq('id', conversa.usuario_id);
      }
      
      setMensagens([]);
      await carregarConversas();
      await carregarUsuarios();
      toast.success('Conversa zerada! A Evelyn tratará como usuário novo.');
    } catch (error) {
      console.error('Erro ao zerar conversa:', error);
      toast.error('Erro ao zerar conversa');
    } finally {
      setDeletingConversa(false);
    }
  }

  async function excluirContato(conversa: Conversa) {
    setDeletingConversa(true);
    try {
      const { data: conversasUsuario } = await supabase
        .from('evelyn_conversas').select('id').eq('telefone', conversa.telefone);
      if (conversasUsuario) {
        for (const conv of conversasUsuario) {
          await supabase.from('evelyn_mensagens').delete().eq('conversa_id', conv.id);
        }
      }
      await supabase.from('evelyn_conversas').delete().eq('telefone', conversa.telefone);
      if (conversa.usuario_id) {
        await supabase.from('evelyn_usuarios').delete().eq('id', conversa.usuario_id);
      }
      await supabase.from('evelyn_lid_mapping').delete().eq('lid', conversa.telefone);
      setConversaSelecionada(null);
      setMensagens([]);
      await carregarConversas();
      await carregarStats();
      await carregarUsuarios();
      toast.success('Contato excluído!');
    } catch (error) {
      toast.error('Erro ao excluir contato');
    } finally {
      setDeletingConversa(false);
    }
  }

  async function salvarConfiguracoesIA() {
    if (!config?.id) {
      toast.error('Nenhuma instância configurada');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('evelyn_config')
        .update({
          welcome_message: welcomeMessage,
          personalidade: promptPersonalizado,
          limite_caracteres: limiteCaracteres,
          estilo_resposta: estiloResposta,
          nivel_detalhamento: nivelDetalhamento,
          usar_nome: usarNome,
          saudacao_horario: saudacaoHorario,
          perguntar_nome_inicio: perguntarNomeInicio,
          recomendar_livros: recomendarLivros,
          feedback_audio_interativo: feedbackAudioInterativo,
        })
        .eq('id', config.id);
      if (error) throw error;
      toast.success('Configurações de IA salvas!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtros
  const conversasFiltradas = conversas.filter(c => 
    !buscaConversa || 
    c.telefone.includes(buscaConversa) || 
    c.usuario?.nome?.toLowerCase().includes(buscaConversa.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter(u =>
    !buscaUsuario ||
    u.telefone.includes(buscaUsuario) ||
    u.nome?.toLowerCase().includes(buscaUsuario.toLowerCase())
  );

  const conversaAtual = conversas.find(c => c.id === conversaSelecionada);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Compacto */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 py-3 md:px-4 md:py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => navigate('/ferramentas')}>
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <MessageCircle className="h-4 w-4 md:h-6 md:w-6" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-bold">Evelyn WhatsApp</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Chatbot jurídico com IA</p>
              </div>
            </div>
            {/* Status Badge Mobile */}
            <div className="ml-auto flex items-center gap-2">
              <Badge 
                variant={config?.status === 'conectado' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {config?.status === 'conectado' ? (
                  <><Wifi className="h-3 w-3 mr-1" />On</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" />Off</>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Stats Compactos - Em linha */}
        <div className="flex items-center gap-2 md:gap-4 mb-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border shrink-0">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{stats.usuarios}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">usuários</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border shrink-0">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{stats.conversas}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">conversas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border shrink-0">
            <Send className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">{stats.mensagens}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">mensagens</span>
          </div>
        </div>

        <Tabs defaultValue="conectar" className="space-y-4">
          {/* Tabs Responsivas - Só ícones no mobile */}
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="conectar" className="py-2 px-2 md:px-4">
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Conectar</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden"><p>Conectar</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="conversas" className="py-2 px-2 md:px-4">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Conversas</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden"><p>Conversas</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="usuarios" className="py-2 px-2 md:px-4">
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Usuários</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden"><p>Usuários</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="config" className="py-2 px-2 md:px-4">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Config</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden"><p>Configurações</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          {/* Tab Conectar - Simplificada, só QR Code */}
          <TabsContent value="conectar" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <QrCodeIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Conectar WhatsApp
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Escaneie o QR Code para conectar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                {qrImageData && config?.status !== 'conectado' && (
                  <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-dashed">
                    <img 
                      src={qrImageData} 
                      alt="QR Code WhatsApp"
                      className="w-48 h-48 md:w-64 md:h-64 rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      WhatsApp {'>'} Dispositivos Conectados {'>'} Conectar
                    </p>
                  </div>
                )}

                {/* Pairing Code */}
                {config?.pairing_code && config.status !== 'conectado' && (
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Ou digite o código:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl md:text-3xl font-mono font-bold tracking-[0.3em] md:tracking-[0.5em] text-primary">
                        {config.pairing_code}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(config.pairing_code || '');
                          toast.success('Código copiado!');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mensagem de Conectado */}
                {config?.status === 'conectado' && (
                  <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Wifi className="h-12 w-12 text-green-500" />
                    <div className="text-center">
                      <p className="font-medium text-green-600">WhatsApp Conectado!</p>
                      {config.telefone_conectado && (
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {config.telefone_conectado}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-2">
                  {!config && (
                    <Button onClick={criarInstancia} disabled={!!loadingAction} size="sm" className="flex-1">
                      {loadingAction === 'criar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Criar Instância
                    </Button>
                  )}
                  
                  {config && config.status !== 'conectado' && (
                    <>
                      <Button onClick={conectar} disabled={!!loadingAction} size="sm" className="flex-1">
                        {loadingAction === 'conectar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCodeIcon className="h-4 w-4 mr-1" />}
                        {config.qr_code ? 'Atualizar QR' : 'Gerar QR Code'}
                      </Button>
                      <Button onClick={forcarReconexao} disabled={!!loadingAction} size="sm" variant="outline" className="flex-1">
                        {loadingAction === 'forcar-reconexao' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                        Forçar Reconexão
                      </Button>
                    </>
                  )}

                  {config && config.status === 'conectado' && (
                    <Button onClick={desconectar} disabled={!!loadingAction} size="sm" variant="destructive" className="flex-1">
                      {loadingAction === 'desconectar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WifiOff className="h-4 w-4 mr-1" />}
                      Desconectar
                    </Button>
                  )}
                </div>

                {/* Botão de verificar status */}
                <Button onClick={verificarStatus} disabled={!!loadingAction} size="sm" variant="ghost" className="w-full">
                  {loadingAction === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Verificar Status
                </Button>

                {/* Requisitos */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <h4 className="font-medium text-amber-600 text-sm mb-1">⚠️ Requisitos</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Evolution API configurada no Railway</li>
                    <li>• Secrets: EVOLUTION_API_URL e EVOLUTION_API_KEY</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Conversas - Com Busca */}
          <TabsContent value="conversas">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Lista de Conversas */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversa..."
                      value={buscaConversa}
                      onChange={(e) => setBuscaConversa(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] md:h-[500px]">
                    {conversasFiltradas.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        {buscaConversa ? 'Nenhum resultado' : 'Nenhuma conversa'}
                      </p>
                    ) : (
                      conversasFiltradas.map((conversa) => (
                        <button
                          key={conversa.id}
                          onClick={() => navigate(`/ferramentas/evelyn-whatsapp/conversa/${conversa.id}`)}
                          className="w-full p-3 text-left border-b hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={conversa.usuario?.foto_perfil || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {conversa.usuario?.nome || conversa.telefone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatarData(conversa.updated_at)}
                              </p>
                            </div>
                            <Badge variant={conversa.status === 'ativa' ? 'default' : 'secondary'} className="text-[10px] h-5">
                              {conversa.status}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Mensagens */}
              <Card className="lg:col-span-2">
                <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    {conversaSelecionada && conversaAtual ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conversaAtual?.usuario?.foto_perfil || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{conversaAtual?.usuario?.nome || conversaAtual?.telefone}</p>
                          <p className="text-xs text-muted-foreground">{conversaAtual?.telefone}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
                    )}
                  </div>
                  
                  {conversaSelecionada && conversaAtual && (
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingConversa}>
                            <Eraser className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apagar todas as mensagens desta conversa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => limparConversa(conversaSelecionada)}>
                              Limpar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" disabled={deletingConversa}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Zerar conversa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apaga todas as mensagens, remove o nome do usuário e reseta o contexto. A Evelyn tratará como se fosse um usuário novo (vai perguntar o nome novamente).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => zerarConversa(conversaAtual)}
                              className="bg-orange-500 text-white hover:bg-orange-600"
                            >
                              Zerar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingConversa}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Excluir permanentemente o contato e todas as mensagens.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => excluirContato(conversaAtual)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[350px] md:h-[450px]">
                    {!conversaSelecionada ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Selecione uma conversa
                      </p>
                    ) : mensagens.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma mensagem
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {mensagens.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.remetente === 'evelyn' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
                                msg.remetente === 'evelyn'
                                  ? 'bg-muted'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                              <p className="text-[10px] opacity-70 mt-1">
                                {formatarData(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Usuários - Lista Completa */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">Usuários</CardTitle>
                    <CardDescription className="text-xs">{stats.usuarios} usuários cadastrados</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário..."
                      value={buscaUsuario}
                      onChange={(e) => setBuscaUsuario(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] md:h-[500px]">
                  {usuariosFiltrados.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      {buscaUsuario ? 'Nenhum resultado' : 'Nenhum usuário'}
                    </p>
                  ) : (
                    <div className="divide-y">
                      {usuariosFiltrados.map((usuario) => (
                        <div key={usuario.id} className="p-3 flex items-center gap-2 sm:gap-3 hover:bg-muted/30">
                          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                            <AvatarImage src={usuario.foto_perfil || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{usuario.nome || 'Sem nome'}</p>
                              <Badge 
                                variant={usuario.autorizado ? 'default' : 'secondary'}
                                className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                              >
                                {usuario.autorizado ? '✓ Autorizado' : 'Pendente'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{usuario.telefone}</p>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className="text-sm font-medium">{usuario.total_mensagens}</p>
                            <p className="text-[10px] text-muted-foreground">msgs</p>
                          </div>
                          
                          {/* Toggle de Autorização */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="shrink-0">
                                  <Switch
                                    checked={usuario.autorizado ?? false}
                                    onCheckedChange={() => toggleAutorizacao(usuario)}
                                    disabled={togglingAutorizacao === usuario.id}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{usuario.autorizado ? 'Desautorizar' : 'Autorizar'} usuário</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {/* Botão de Exclusão */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                disabled={deletingUsuario === usuario.id}
                              >
                                {deletingUsuario === usuario.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário completamente?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    Esta ação irá remover <strong>{usuario.nome || usuario.telefone}</strong> e todos os dados associados:
                                  </p>
                                  <ul className="list-disc list-inside text-sm">
                                    <li>Todas as conversas e mensagens</li>
                                    <li>Memória e progresso de estudos</li>
                                    <li>Mapeamentos de identificação</li>
                                  </ul>
                                  <p className="font-medium text-foreground">
                                    A Evelyn tratará como usuário novo na próxima mensagem.
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => excluirUsuarioCompleto(usuario)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir Completamente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Config - Agora com Status da Conexão */}
          <TabsContent value="config" className="space-y-4">
            {/* Seção: Status da Conexão (movida da tab Conectar) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {config?.status === 'conectado' ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {config?.status === 'conectado' ? 'Conectado' : 
                         config?.status === 'conectando' ? 'Aguardando...' : 'Desconectado'}
                      </p>
                      {config?.telefone_conectado && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {config.telefone_conectado}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={config?.status === 'conectado' ? 'default' : 'secondary'} className="text-xs">
                    {config?.instance_name || instanceName}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={verificarStatus} disabled={!!loadingAction}>
                    {loadingAction === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Verificar
                  </Button>
                  {config?.status === 'conectado' && (
                    <>
                      <Button variant="outline" size="sm" onClick={configurarWebhook} disabled={!!loadingAction}>
                        {loadingAction === 'configurar-webhook' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4 mr-1" />}
                        Config Webhook
                      </Button>
                      <Button variant="destructive" size="sm" onClick={desconectar} disabled={!!loadingAction}>
                        {loadingAction === 'desconectar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WifiOff className="h-4 w-4 mr-1" />}
                        Desconectar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seção: Webhook */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded border overflow-x-auto">
                    {WEBHOOK_URL}
                  </code>
                  <Button variant="outline" size="sm" onClick={copiarWebhookUrl}>
                    {webhookCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Configuração manual:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Eventos: <code className="bg-muted px-1 rounded">MESSAGES_UPSERT</code>, <code className="bg-muted px-1 rounded">CONNECTION_UPDATE</code></li>
                    <li>Webhook by Events: Desativado</li>
                    <li>Webhook Base64: Ativado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Seção: Personalização da IA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Personalização da IA
                </CardTitle>
                <CardDescription className="text-xs">Configure o comportamento da Evelyn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mensagens Básicas */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageCircleHeart className="h-4 w-4" />
                    Mensagens
                  </h4>
                  <div className="space-y-2">
                    <Label className="text-sm">Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Olá! Sou a Evelyn..."
                      className="h-20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Instruções Personalizadas</Label>
                    <Textarea
                      value={promptPersonalizado}
                      onChange={(e) => setPromptPersonalizado(e.target.value)}
                      placeholder="Adicione instruções específicas para a IA..."
                      className="h-24 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: "Sempre mencione que o usuário pode consultar um advogado"
                    </p>
                  </div>
                </div>

                {/* Controles de Resposta */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Comportamento da Resposta
                  </h4>
                  
                  {/* Limite de Caracteres */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Limite de Caracteres</Label>
                      <span className="text-sm font-medium text-primary">{limiteCaracteres}</span>
                    </div>
                    <Slider
                      value={[limiteCaracteres]}
                      onValueChange={([value]) => setLimiteCaracteres(value)}
                      min={200}
                      max={2000}
                      step={100}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tamanho máximo das respostas (200-2000 caracteres)
                    </p>
                  </div>

                  {/* Estilo de Resposta */}
                  <div className="space-y-2">
                    <Label className="text-sm">Estilo de Resposta</Label>
                    <Select value={estiloResposta} onValueChange={setEstiloResposta}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="didático">📚 Didático - Explicativo e acessível</SelectItem>
                        <SelectItem value="formal">👔 Formal - Linguagem técnica</SelectItem>
                        <SelectItem value="informal">💬 Informal - Descontraído</SelectItem>
                        <SelectItem value="técnico">⚖️ Técnico - Jurídico avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nível de Detalhamento */}
                  <div className="space-y-2">
                    <Label className="text-sm">Nível de Detalhamento</Label>
                    <Select value={nivelDetalhamento} onValueChange={setNivelDetalhamento}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resumido">📋 Resumido - Direto ao ponto</SelectItem>
                        <SelectItem value="normal">📝 Normal - Equilibrado</SelectItem>
                        <SelectItem value="detalhado">📖 Detalhado - Com exemplos</SelectItem>
                        <SelectItem value="muito_detalhado">📚 Muito Detalhado - Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Interações Personalizadas */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personalização de Interações
                  </h4>
                  
                  <div className="grid gap-4">
                    {/* Perguntar Nome no Início */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Perguntar Nome no Início</Label>
                        <p className="text-xs text-muted-foreground">Evelyn se apresenta e pergunta o nome</p>
                      </div>
                      <Switch 
                        checked={perguntarNomeInicio} 
                        onCheckedChange={setPerguntarNomeInicio}
                      />
                    </div>

                    {/* Usar Nome nas Respostas */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Chamar pelo Nome</Label>
                        <p className="text-xs text-muted-foreground">Usar o nome do usuário nas respostas</p>
                      </div>
                      <Switch 
                        checked={usarNome} 
                        onCheckedChange={setUsarNome}
                      />
                    </div>

                    {/* Saudação por Horário */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Saudação por Horário</Label>
                        <p className="text-xs text-muted-foreground">Bom dia/tarde/noite automático</p>
                      </div>
                      <Switch 
                        checked={saudacaoHorario} 
                        onCheckedChange={setSaudacaoHorario}
                      />
                    </div>
                  </div>
                </div>

                {/* Funcionalidades Especiais */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Funcionalidades Especiais
                  </h4>
                  
                  <div className="grid gap-4">
                    {/* Feedback de Áudio */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Volume2 className="h-3 w-3" />
                          Feedback de Áudio Interativo
                        </Label>
                        <p className="text-xs text-muted-foreground">"Calma, estou escutando..." antes de processar</p>
                      </div>
                      <Switch 
                        checked={feedbackAudioInterativo} 
                        onCheckedChange={setFeedbackAudioInterativo}
                      />
                    </div>

                    {/* Recomendar Livros */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Recomendar Livros</Label>
                        <p className="text-xs text-muted-foreground">Sugerir PDFs relacionados ao tema</p>
                      </div>
                      <Switch 
                        checked={recomendarLivros} 
                        onCheckedChange={setRecomendarLivros}
                      />
                    </div>
                  </div>
                </div>

                <Button size="sm" onClick={salvarConfiguracoesIA} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Todas as Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Seção: Instância */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Instância
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Nome da Instância</Label>
                  <Input 
                    value={instanceName} 
                    onChange={(e) => setInstanceName(e.target.value)}
                    placeholder="evelyn-principal"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm mb-2">Secrets Necessários</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <code className="bg-muted px-1 rounded">EVOLUTION_API_URL</code></li>
                    <li>• <code className="bg-muted px-1 rounded">EVOLUTION_API_KEY</code></li>
                    <li>• <code className="bg-muted px-1 rounded">GEMINI_KEY_1</code>, <code className="bg-muted px-1 rounded">GEMINI_KEY_2</code>, <code className="bg-muted px-1 rounded">GEMINI_KEY_3</code></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
