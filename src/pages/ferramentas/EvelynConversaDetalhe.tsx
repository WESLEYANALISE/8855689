import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Phone, User, Loader2, MoreVertical, File, Mic } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Mensagem {
  id: string;
  remetente: string;
  tipo: string;
  conteudo: string;
  metadata: any;
  created_at: string;
  processado?: boolean;
}

interface Conversa {
  id: string;
  telefone: string;
  status: string;
  contexto: any;
  instance_name: string;
  usuario?: {
    nome: string | null;
    foto_perfil: string | null;
  };
}

export default function EvelynConversaDetalhe() {
  const { conversaId } = useParams<{ conversaId: string }>();
  const navigate = useNavigate();
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    if (!conversaId) return;

    const carregarDados = async () => {
      setLoading(true);
      try {
        // Buscar conversa com dados do usuário
        const { data: conversaData, error: conversaError } = await supabase
          .from("evelyn_conversas")
          .select(`
            *,
            evelyn_usuarios (
              nome,
              foto_perfil
            )
          `)
          .eq("id", conversaId)
          .single();

        if (conversaError) throw conversaError;
        
        // Mapear dados do usuário
        const conversaComUsuario = {
          ...conversaData,
          usuario: conversaData.evelyn_usuarios
        };
        setConversa(conversaComUsuario);

        const { data: mensagensData, error: mensagensError } = await supabase
          .from("evelyn_mensagens")
          .select("*")
          .eq("conversa_id", conversaId)
          .order("created_at", { ascending: true });

        if (mensagensError) throw mensagensError;
        setMensagens(mensagensData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar conversa");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [conversaId]);

  // Supabase Realtime para novas mensagens
  useEffect(() => {
    if (!conversaId) return;

    const channel = supabase
      .channel(`mensagens-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evelyn_mensagens',
          filter: `conversa_id=eq.${conversaId}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const novaMensagem = payload.new as Mensagem;
          setMensagens(prev => {
            if (prev.some(m => m.id === novaMensagem.id)) return prev;
            return [...prev, novaMensagem];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversaId]);

  const enviarMensagemManual = async () => {
    if (!novaMensagem.trim() || !conversa) return;

    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke("evelyn-enviar-mensagem", {
        body: {
          instanceName: conversa.instance_name,
          telefone: conversa.telefone,
          mensagem: novaMensagem,
          conversaId: conversaId
        }
      });

      if (error) throw error;

      setNovaMensagem("");
      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "HH:mm", { locale: ptBR });
  };

  const renderizarMensagem = (msg: Mensagem) => {
    const isEntrada = msg.remetente === 'usuario';
    
    return (
      <div
        key={msg.id}
        className={cn(
          "flex mb-2",
          isEntrada ? "justify-start" : "justify-end"
        )}
      >
        <div
          className={cn(
            "max-w-[80%] rounded-lg px-3 py-2 shadow-sm",
            isEntrada 
              ? "bg-muted text-foreground rounded-bl-none" 
              : "bg-primary text-primary-foreground rounded-br-none"
          )}
        >
          {msg.tipo === 'audio' && (
            <div className="flex flex-col gap-1 mb-1">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="text-sm">Áudio</span>
              </div>
              {msg.metadata?.transcricao && (
                <div className="text-xs italic opacity-80 bg-background/20 rounded px-2 py-1">
                  🎤 "{msg.metadata.transcricao}"
                </div>
              )}
            </div>
          )}
          
          {msg.tipo === 'documento' && (
            <div className="flex items-center gap-2 mb-1">
              <File className="h-4 w-4" />
              <span className="text-sm">{msg.metadata?.fileName || 'Documento'}</span>
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">
            {msg.conteudo}
          </p>
          
          <div className={cn(
            "text-[10px] mt-1 flex justify-end gap-1",
            isEntrada ? "text-muted-foreground" : "text-primary-foreground/70"
          )}>
            {formatarData(msg.created_at)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversa) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-muted-foreground">Conversa não encontrada</p>
        <Button onClick={() => navigate("/ferramentas/evelyn-whatsapp")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 p-3 border-b bg-card shadow-sm">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/ferramentas/evelyn-whatsapp")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          {conversa.usuario?.foto_perfil && (
            <AvatarImage 
              src={conversa.usuario.foto_perfil} 
              alt={conversa.usuario?.nome || conversa.telefone}
            />
          )}
          <AvatarFallback className="bg-primary/10">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">
            {conversa.usuario?.nome || conversa.telefone}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {conversa.usuario?.nome ? conversa.telefone : conversa.status}
          </p>
        </div>
        
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {mensagens.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda
            </div>
          ) : (
            mensagens.map(renderizarMensagem)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensagemManual();
              }
            }}
            disabled={enviando}
            className="flex-1"
          />
          <Button 
            onClick={enviarMensagemManual}
            disabled={!novaMensagem.trim() || enviando}
            size="icon"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
