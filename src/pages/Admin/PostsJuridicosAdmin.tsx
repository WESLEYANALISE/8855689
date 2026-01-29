import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Wand2, Image, Calendar, Save, Trash2, Eye, Send, RefreshCw, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { SeletorArtigo } from "@/components/posts-juridicos/SeletorArtigo";
import { CarrosselPost } from "@/components/posts-juridicos/CarrosselPost";
import { toast } from "sonner";

const PostsJuridicosAdmin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("criar");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Estado do novo post
  const [artigoSelecionado, setArtigoSelecionado] = useState<any>(null);
  const [titulo, setTitulo] = useState("");
  const [roteiro, setRoteiro] = useState<any>(null);
  const [imagens, setImagens] = useState<any[]>([]);
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false);
  const [gerandoImagens, setGerandoImagens] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estado do visualizador de imagens
  const [imagemModal, setImagemModal] = useState<{imagens: any[], indice: number} | null>(null);

  useEffect(() => {
    carregarPosts();
  }, []);

  const carregarPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts_juridicos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectArtigo = (artigo: any) => {
    setArtigoSelecionado(artigo);
    setTitulo(`${artigo.numero} - ${artigo.nomeLei}`);
    setRoteiro(null);
    setImagens([]);
  };

  const gerarRoteiro = async () => {
    if (!artigoSelecionado) {
      toast.error("Selecione um artigo primeiro");
      return;
    }

    setGerandoRoteiro(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-roteiro-carrossel", {
        body: {
          artigo: artigoSelecionado.numero,
          leiNome: artigoSelecionado.nomeLei,
          textoArtigo: artigoSelecionado.texto
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setRoteiro(data.roteiro);
      toast.success("Roteiro gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar roteiro:", err);
      toast.error("Erro ao gerar roteiro");
    } finally {
      setGerandoRoteiro(false);
    }
  };

  const gerarImagens = async () => {
    if (!roteiro?.slides) {
      toast.error("Gere o roteiro primeiro");
      return;
    }

    setGerandoImagens(true);
    toast.info("Gerando imagens... Isso pode levar alguns minutos");

    try {
      const { data, error } = await supabase.functions.invoke("gerar-imagens-carrossel", {
        body: {
          slides: roteiro.slides,
          leiNome: artigoSelecionado.nomeLei,
          artigo: artigoSelecionado.numero
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setImagens(data.imagens);
      toast.success(`${data.totalGeradas}/${data.totalSolicitadas} imagens geradas!`);
    } catch (err) {
      console.error("Erro ao gerar imagens:", err);
      toast.error("Erro ao gerar imagens");
    } finally {
      setGerandoImagens(false);
    }
  };

  const salvarPost = async (status: "rascunho" | "pronto" | "publicado") => {
    if (!artigoSelecionado || !titulo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from("posts_juridicos").insert({
        artigo_numero: artigoSelecionado.numero,
        lei_tabela: artigoSelecionado.tabela,
        titulo,
        roteiro: roteiro || {},
        imagens: imagens || [],
        texto_artigo: artigoSelecionado.texto,
        data_publicacao: dataPublicacao || new Date().toISOString().split('T')[0],
        status
      });

      if (error) throw error;

      toast.success(status === "publicado" ? "Post publicado!" : "Post salvo!");
      resetForm();
      carregarPosts();
      setTab("lista");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar post");
    } finally {
      setSalvando(false);
    }
  };

  const deletarPost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    try {
      const { error } = await supabase
        .from("posts_juridicos")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      toast.success("Post excluído");
      carregarPosts();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      toast.error("Erro ao excluir post");
    }
  };

  const atualizarStatus = async (postId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from("posts_juridicos")
        .update({ status: novoStatus })
        .eq("id", postId);

      if (error) throw error;
      toast.success("Status atualizado");
      carregarPosts();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar");
    }
  };

  const resetForm = () => {
    setArtigoSelecionado(null);
    setTitulo("");
    setRoteiro(null);
    setImagens([]);
    setDataPublicacao("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "publicado": return "bg-green-500/20 text-green-500";
      case "pronto": return "bg-blue-500/20 text-blue-500";
      default: return "bg-yellow-500/20 text-yellow-500";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Posts Jurídicos</h1>
            <p className="text-sm text-muted-foreground">Criar e gerenciar posts para Instagram</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criar">
              <Plus className="w-4 h-4 mr-2" />
              Criar Post
            </TabsTrigger>
            <TabsTrigger value="lista">
              <Eye className="w-4 h-4 mr-2" />
              Posts ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="space-y-6 mt-6">
            {/* Seleção de Artigo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Selecionar Artigo</CardTitle>
              </CardHeader>
              <CardContent>
                {artigoSelecionado ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{artigoSelecionado.nomeLei}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setArtigoSelecionado(null)}>
                          Trocar
                        </Button>
                      </div>
                      <h3 className="font-semibold text-foreground">{artigoSelecionado.numero}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {artigoSelecionado.texto}
                      </p>
                    </div>
                  </div>
                ) : (
                  <SeletorArtigo onSelect={handleSelectArtigo} />
                )}
              </CardContent>
            </Card>

            {/* Título */}
            {artigoSelecionado && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Título do Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Digite o título do post..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Gerar Roteiro */}
            {artigoSelecionado && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">3. Roteiro do Carrossel</CardTitle>
                  <Button onClick={gerarRoteiro} disabled={gerandoRoteiro} size="sm">
                    <Wand2 className={`w-4 h-4 mr-2 ${gerandoRoteiro ? 'animate-spin' : ''}`} />
                    {gerandoRoteiro ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {roteiro ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{roteiro.slides?.length || 0} slides</Badge>
                        <Button variant="ghost" size="sm" onClick={gerarRoteiro}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerar
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {roteiro.slides?.map((slide: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{slide.elemento_visual}</span>
                                <span className="text-xs text-muted-foreground">Slide {idx + 1}</span>
                              </div>
                              <h4 className="font-semibold text-sm">{slide.titulo}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{slide.texto}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {roteiro.hashtags && (
                        <p className="text-sm text-primary">{roteiro.hashtags.join(" ")}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Clique em "Gerar com IA" para criar o roteiro do carrossel
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gerar Imagens */}
            {roteiro && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">4. Imagens do Carrossel</CardTitle>
                  <Button onClick={gerarImagens} disabled={gerandoImagens} size="sm">
                    <Image className={`w-4 h-4 mr-2 ${gerandoImagens ? 'animate-pulse' : ''}`} />
                    {gerandoImagens ? "Gerando..." : "Gerar Imagens"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {imagens.length > 0 ? (
                    <div className="space-y-4">
                      <CarrosselPost slides={imagens} />
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {imagens.filter(i => i.url).length}/{imagens.length} imagens geradas
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={gerarImagens}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Clique em "Gerar Imagens" para criar o carrossel visual
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Agendar e Salvar */}
            {roteiro && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">5. Agendar Publicação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dataPublicacao}
                      onChange={(e) => setDataPublicacao(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => salvarPost("rascunho")}
                      disabled={salvando}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Rascunho
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => salvarPost("pronto")}
                      disabled={salvando}
                    >
                      Marcar como Pronto
                    </Button>
                    <Button
                      onClick={() => salvarPost("publicado")}
                      disabled={salvando}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publicar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lista" className="mt-6">
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map(post => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Prévia das imagens */}
                        {post.imagens && post.imagens.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {post.imagens.slice(0, 6).map((img: any, idx: number) => (
                              <button 
                                key={idx} 
                                onClick={() => img.url && setImagemModal({ imagens: post.imagens, indice: idx })}
                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer relative group"
                              >
                                {img.url ? (
                                  <>
                                    <img 
                                      src={img.url} 
                                      alt={`Slide ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="w-4 h-4 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    {idx + 1}
                                  </div>
                                )}
                              </button>
                            ))}
                            {post.imagens.length > 6 && (
                              <button 
                                onClick={() => setImagemModal({ imagens: post.imagens, indice: 6 })}
                                className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                              >
                                +{post.imagens.length - 6}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Info do post */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getStatusColor(post.status)}>
                                {post.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {post.artigo_numero}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm truncate">{post.titulo}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {post.imagens?.length || 0} imagens • {post.roteiro?.slides?.length || 0} slides
                            </p>
                            {post.data_publicacao && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📅 {new Date(post.data_publicacao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {post.status !== "publicado" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => atualizarStatus(post.id, "publicado")}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletarPost(post.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-muted-foreground">Nenhum post criado ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de visualização de imagens */}
        <Dialog open={!!imagemModal} onOpenChange={() => setImagemModal(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            {imagemModal && (
              <div className="relative">
                {/* Botão fechar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                  onClick={() => setImagemModal(null)}
                >
                  <X className="w-6 h-6" />
                </Button>

                {/* Imagem principal */}
                <div className="flex items-center justify-center min-h-[400px] p-8">
                  {imagemModal.imagens[imagemModal.indice]?.url ? (
                    <img
                      src={imagemModal.imagens[imagemModal.indice].url}
                      alt={`Slide ${imagemModal.indice + 1}`}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-white text-center">
                      <p>Imagem não disponível</p>
                    </div>
                  )}
                </div>

                {/* Navegação */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 ml-2"
                    disabled={imagemModal.indice === 0}
                    onClick={() => setImagemModal({ ...imagemModal, indice: imagemModal.indice - 1 })}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 mr-2"
                    disabled={imagemModal.indice >= imagemModal.imagens.length - 1}
                    onClick={() => setImagemModal({ ...imagemModal, indice: imagemModal.indice + 1 })}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </div>

                {/* Info do slide */}
                <div className="p-4 text-center text-white">
                  <p className="text-sm text-white/70">
                    Slide {imagemModal.indice + 1} de {imagemModal.imagens.length}
                  </p>
                  {imagemModal.imagens[imagemModal.indice]?.titulo && (
                    <p className="font-medium mt-1">{imagemModal.imagens[imagemModal.indice].titulo}</p>
                  )}
                </div>

                {/* Miniaturas */}
                <div className="flex justify-center gap-2 p-4 overflow-x-auto">
                  {imagemModal.imagens.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setImagemModal({ ...imagemModal, indice: idx })}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === imagemModal.indice ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      {img.url ? (
                        <img src={img.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs">{idx + 1}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PostsJuridicosAdmin;
