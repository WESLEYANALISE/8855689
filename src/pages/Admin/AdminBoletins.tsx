import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Newspaper, Send, Eye, Calendar, FileText, Loader2, CheckCircle, XCircle, Image, Volume2, Users, User, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvelynUsuario {
  telefone: string;
  nome: string | null;
  foto_perfil: string | null;
  autorizado: boolean;
}

interface Slide {
  titulo?: string;
  subtitulo?: string;
  resumo_curto?: string;
  imagem_url?: string;
  url_audio?: string;
  texto_narrado?: string;
}

interface ResumoDiario {
  id: string;
  tipo: string;
  data: string;
  slides: Slide[] | null;
  texto_resumo: string | null;
  url_audio: string | null;
  url_audio_abertura: string | null;
  url_audio_fechamento: string | null;
  total_noticias: number | null;
  created_at: string;
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  juridica: { label: "Direito", color: "bg-blue-500" },
  politica: { label: "Política", color: "bg-purple-500" },
  concurso: { label: "Concursos", color: "bg-green-500" },
};

const AdminBoletins = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [boletimSelecionado, setBoletimSelecionado] = useState<ResumoDiario | null>(null);
  const [modalPreview, setModalPreview] = useState(false);
  const [modalDisparo, setModalDisparo] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<string>("texto");
  const [modoEnvio, setModoEnvio] = useState<"todos" | "selecionados">("todos");
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [buscaUsuario, setBuscaUsuario] = useState("");

  // Buscar boletins
  const { data: boletins, isLoading } = useQuery({
    queryKey: ["admin-boletins", tipoFiltro],
    queryFn: async () => {
      let query = supabase
        .from("resumos_diarios")
        .select("*")
        .order("data", { ascending: false })
        .limit(50);

      if (tipoFiltro !== "todos") {
        query = query.eq("tipo", tipoFiltro);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ResumoDiario[];
    },
  });

  // Buscar total de usuários que receberão
  const { data: totalUsuarios } = useQuery({
    queryKey: ["evelyn-usuarios-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("evelyn_usuarios")
        .select("*", { count: "exact", head: true })
        .eq("autorizado", true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Buscar lista de usuários para seleção
  const { data: usuariosLista } = useQuery({
    queryKey: ["evelyn-usuarios-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evelyn_usuarios")
        .select("telefone, nome, foto_perfil, autorizado")
        .eq("autorizado", true)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as EvelynUsuario[];
    },
  });

  // Filtrar usuários pela busca
  const usuariosFiltrados = usuariosLista?.filter(u => 
    u.nome?.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
    u.telefone.includes(buscaUsuario)
  ) || [];

  // Mutation para disparar boletim
  const dispararMutation = useMutation({
    mutationFn: async ({ boletimId, tipoEnvio, telefones }: { boletimId: string; tipoEnvio: string; telefones?: string[] }) => {
      const { data, error } = await supabase.functions.invoke("enviar-boletim-whatsapp", {
        body: { boletim_id: boletimId, tipo_envio: tipoEnvio, telefones },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Boletim enviado para ${data.enviados} usuários!`);
      setModalDisparo(false);
      setUsuariosSelecionados([]);
      setModoEnvio("todos");
      queryClient.invalidateQueries({ queryKey: ["admin-boletins"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const handleDisparo = () => {
    if (!boletimSelecionado) return;
    dispararMutation.mutate({
      boletimId: boletimSelecionado.id,
      tipoEnvio,
      telefones: modoEnvio === "selecionados" ? usuariosSelecionados : undefined,
    });
  };

  const toggleUsuario = (telefone: string) => {
    setUsuariosSelecionados(prev => 
      prev.includes(telefone) 
        ? prev.filter(t => t !== telefone)
        : [...prev, telefone]
    );
  };

  const selecionarTodos = () => {
    if (usuariosFiltrados.length === usuariosSelecionados.length) {
      setUsuariosSelecionados([]);
    } else {
      setUsuariosSelecionados(usuariosFiltrados.map(u => u.telefone));
    }
  };

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 13) {
      return `(${numeros.slice(2, 4)}) ${numeros.slice(4, 9)}-${numeros.slice(9)}`;
    }
    return telefone;
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const getSlides = (boletim: ResumoDiario): Slide[] => {
    if (!boletim.slides) return [];
    if (Array.isArray(boletim.slides)) return boletim.slides;
    return [];
  };

  const getDataBoletim = (boletim: ResumoDiario): string => {
    return boletim.data || boletim.created_at;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Boletins Jurídicos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize e dispare boletins via WhatsApp
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {totalUsuarios} usuários ativos
          </Badge>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={tipoFiltro === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setTipoFiltro("todos")}
          >
            Todos
          </Button>
          {Object.entries(tipoConfig).map(([tipo, config]) => (
            <Button
              key={tipo}
              variant={tipoFiltro === tipo ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoFiltro(tipo)}
            >
              {config.label}
            </Button>
          ))}
        </div>

        {/* Lista de Boletins */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !boletins || boletins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum boletim encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boletins.map((boletim) => {
              const slides = getSlides(boletim);
              const config = tipoConfig[boletim.tipo] || { label: boletim.tipo, color: "bg-gray-500" };
              const primeiroSlide = slides[0];

              return (
                <div
                  key={boletim.id}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-lg"
                >
                  {/* Preview da imagem */}
                  <div className="relative h-40 bg-muted">
                    {primeiroSlide?.imagem_url ? (
                      <img
                        src={primeiroSlide.imagem_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className={`absolute top-2 left-2 ${config.color}`}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatarData(getDataBoletim(boletim))}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Image className="h-4 w-4 text-blue-500" />
                        <span>{slides.length} slides</span>
                      </div>
                      {boletim.url_audio_abertura && (
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-4 w-4 text-green-500" />
                          <span>Áudio</span>
                        </div>
                      )}
                      {boletim.total_noticias && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-orange-500" />
                          <span>{boletim.total_noticias} notícias</span>
                        </div>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setBoletimSelecionado(boletim);
                          setModalPreview(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setBoletimSelecionado(boletim);
                          setModalDisparo(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Disparar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Preview */}
      <Dialog open={modalPreview} onOpenChange={setModalPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Boletim</DialogTitle>
          </DialogHeader>
          {boletimSelecionado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={tipoConfig[boletimSelecionado.tipo]?.color || "bg-gray-500"}>
                  {tipoConfig[boletimSelecionado.tipo]?.label || boletimSelecionado.tipo}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatarData(getDataBoletim(boletimSelecionado))}
                </span>
              </div>

              {/* Slides */}
              <div className="space-y-4">
                {getSlides(boletimSelecionado).map((slide, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-4">
                      {slide.imagem_url && (
                        <img
                          src={slide.imagem_url}
                          alt={`Slide ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold">{slide.titulo || `Slide ${index + 1}`}</h4>
                        {slide.subtitulo && (
                          <p className="text-sm text-muted-foreground">{slide.subtitulo}</p>
                        )}
                        {slide.resumo_curto && (
                          <p className="text-sm mt-2">{slide.resumo_curto}</p>
                        )}
                      </div>
                    </div>
                    {slide.url_audio && (
                      <audio controls className="w-full mt-2">
                        <source src={slide.url_audio} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                ))}
              </div>

              {/* Texto completo */}
              {boletimSelecionado.texto_resumo && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold mb-2">Texto Completo</h4>
                  <p className="text-sm whitespace-pre-wrap">{boletimSelecionado.texto_resumo}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Disparo */}
      <Dialog open={modalDisparo} onOpenChange={(open) => {
        setModalDisparo(open);
        if (!open) {
          setUsuariosSelecionados([]);
          setModoEnvio("todos");
          setBuscaUsuario("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Disparar Boletim via WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha como e para quem enviar o boletim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Modo de envio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Destinatários</Label>
              <RadioGroup value={modoEnvio} onValueChange={(v) => setModoEnvio(v as "todos" | "selecionados")}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Todos os usuários</span>
                      <Badge variant="secondary" className="ml-auto">{totalUsuarios}</Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="selecionados" id="selecionados" />
                  <Label htmlFor="selecionados" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Selecionar usuários</span>
                      {usuariosSelecionados.length > 0 && (
                        <Badge className="ml-auto">{usuariosSelecionados.length}</Badge>
                      )}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Lista de usuários */}
            {modoEnvio === "selecionados" && (
              <div className="space-y-2 border rounded-lg p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    {usuariosFiltrados.length} usuários encontrados
                  </span>
                  <Button variant="ghost" size="sm" onClick={selecionarTodos}>
                    {usuariosFiltrados.length === usuariosSelecionados.length ? "Desmarcar todos" : "Selecionar todos"}
                  </Button>
                </div>

                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {usuariosFiltrados.map((usuario) => (
                      <div
                        key={usuario.telefone}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                        onClick={() => toggleUsuario(usuario.telefone)}
                      >
                        <Checkbox
                          checked={usuariosSelecionados.includes(usuario.telefone)}
                          onCheckedChange={() => toggleUsuario(usuario.telefone)}
                        />
                        {usuario.foto_perfil ? (
                          <img src={usuario.foto_perfil} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {usuario.nome || "Usuário"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatarTelefone(usuario.telefone)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Tipo de envio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Formato do envio</Label>
              <RadioGroup value={tipoEnvio} onValueChange={setTipoEnvio}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="texto" id="texto" />
                  <Label htmlFor="texto" className="flex-1 cursor-pointer">
                    <div className="font-medium">Texto Completo</div>
                    <div className="text-sm text-muted-foreground">
                      Envia resumo formatado em texto
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="imagens" id="imagens" />
                  <Label htmlFor="imagens" className="flex-1 cursor-pointer">
                    <div className="font-medium">Slides com Imagens</div>
                    <div className="text-sm text-muted-foreground">
                      Envia cada slide como imagem com legenda
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="audio" id="audio" />
                  <Label htmlFor="audio" className="flex-1 cursor-pointer">
                    <div className="font-medium">Áudio de Abertura</div>
                    <div className="text-sm text-muted-foreground">
                      Envia apenas o áudio narrado de abertura
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg border-primary bg-primary/5">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="flex-1 cursor-pointer">
                    <div className="font-medium flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" />
                      Vídeo Resumo
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Envia o vídeo completo do resumo do dia
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setModalDisparo(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDisparo} 
              disabled={dispararMutation.isPending || (modoEnvio === "selecionados" && usuariosSelecionados.length === 0)}
            >
              {dispararMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {modoEnvio === "todos" ? totalUsuarios : usuariosSelecionados.length}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBoletins;
