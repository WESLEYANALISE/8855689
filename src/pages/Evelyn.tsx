import { useState, useEffect } from "react";
import { MessageCircle, Mic, FileText, BookOpen, Video, Brain, Scale, Sparkles, Check, User, ArrowRight, ExternalLink, Play, Settings, Edit, RefreshCw, Calendar, GraduationCap, Trophy, Crown, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cadastrarUsuarioEvelyn, PerfilEvelyn } from "@/lib/api/evelynApi";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput } from "@/components/PhoneInput";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

const funcionalidades = [
  {
    icon: MessageCircle,
    titulo: "Tirar Dúvidas Jurídicas",
    descricao: "Pergunte sobre qualquer área do Direito"
  },
  {
    icon: Mic,
    titulo: "Transcrever Áudios",
    descricao: "Envie áudios e receba transcrição + resposta"
  },
  {
    icon: FileText,
    titulo: "Analisar Documentos",
    descricao: "Envie PDFs e imagens para análise"
  },
  {
    icon: Scale,
    titulo: "Consultar Artigos de Lei",
    descricao: "Busca artigos com narração em áudio"
  },
  {
    icon: Brain,
    titulo: "Quiz",
    descricao: "Estude com questões interativas"
  },
  {
    icon: Video,
    titulo: "Vídeo-aulas",
    descricao: "Receba vídeos sobre o tema"
  },
  {
    icon: BookOpen,
    titulo: "Livros e PDFs",
    descricao: "Biblioteca com +490 materiais"
  },
  {
    icon: Sparkles,
    titulo: "Fazer Petições",
    descricao: "Ajuda a criar documentos jurídicos"
  }
];

// Funções da Evelyn para o carrossel com ícones
const funcoesCarrossel = [
  { icon: MessageCircle, titulo: "Tirar Dúvidas Jurídicas" },
  { icon: Mic, titulo: "Transcrever Áudios" },
  { icon: FileText, titulo: "Analisar PDFs e Documentos" },
  { icon: Scale, titulo: "Consultar Artigos de Lei" },
  { icon: Brain, titulo: "Quiz e Questões" },
  { icon: Video, titulo: "Enviar Vídeo-aulas" },
  { icon: BookOpen, titulo: "Acessar +490 Livros" },
  { icon: Sparkles, titulo: "Fazer Petições com IA" },
];

const WHATSAPP_NUMBER = "5511940432865"; // Número da Evelyn
const VIDEO_ID = "HlE9u1c_MPQ";
const VIDEO_URL = `https://www.youtube.com/embed/${VIDEO_ID}`;
const THUMBNAIL_URL = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

// Opções de perfil - apenas 2 (igual ao cadastro)
const opcoesPerfil = [
  { 
    value: 'estudante' as PerfilEvelyn, 
    label: 'Estudante de Direito', 
    icon: GraduationCap,
    descricao: 'Cursando faculdade de Direito'
  },
  { 
    value: 'concurseiro' as PerfilEvelyn, 
    label: 'Concurseiro', 
    icon: Trophy,
    descricao: 'Estudando para concursos públicos'
  }
];

// Atualizações/novidades da Evelyn
const atualizacoesEvelyn = [
  {
    data: "27/01/2026",
    titulo: "Flashcards por áudio",
    descricao: "Agora você pode estudar flashcards ouvindo. A Evelyn narra as perguntas e respostas!"
  },
  {
    data: "20/01/2026",
    titulo: "Análise de PDFs melhorada",
    descricao: "Envie documentos mais complexos - agora com suporte a imagens dentro de PDFs."
  },
  {
    data: "15/01/2026",
    titulo: "Quiz por matéria",
    descricao: "Escolha a área do Direito e receba questões específicas para treinar."
  },
  {
    data: "10/01/2026",
    titulo: "Resumo do dia",
    descricao: "Receba as principais notícias jurídicas resumidas no WhatsApp."
  }
];

const Evelyn = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState<PerfilEvelyn | null>(null);
  const [loading, setLoading] = useState(false);
  const [cadastrado, setCadastrado] = useState(false);
  const [currentPropositoIndex, setCurrentPropositoIndex] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasProfilePhone, setHasProfilePhone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Fetch profile data if user is logged in
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoaded(true);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nome, telefone')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.nome) setNome(data.nome);
          if (data.telefone) {
            setTelefone(data.telefone);
            setHasProfilePhone(true);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoaded(true);
      }
    };
    
    fetchProfile();
  }, [user]);

  // Carrossel infinito de funções - mais lento (5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPropositoIndex((prev) => (prev + 1) % funcoesCarrossel.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 2) {
      toast.error("Digite seu nome completo");
      return;
    }
    
    if (telefone.replace(/\D/g, '').length < 10) {
      toast.error("Digite um telefone válido");
      return;
    }

    if (!perfil) {
      toast.error("Selecione seu perfil");
      return;
    }
    
    setLoading(true);
    
    try {
      const resultado = await cadastrarUsuarioEvelyn(nome.trim(), telefone, perfil);
      toast.success(resultado.message);
      setCadastrado(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const abrirWhatsApp = () => {
    const mensagem = encodeURIComponent("Olá Evelyn! 👋");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensagem}`, '_blank');
  };

  

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-500/30">
            <MessageCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Evelyn</h1>
            <p className="text-muted-foreground">Sua Assistente Jurídica no WhatsApp</p>
          </div>
        </div>

        {/* Menu Principal com Tabs */}
        <Tabs defaultValue="acessar" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="acessar" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <MessageCircle className="w-4 h-4 mr-2" />
              Acessar
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="atualizacoes" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizações
            </TabsTrigger>
          </TabsList>

          {/* Aba Acessar Agora */}
          <TabsContent value="acessar" className="space-y-6">
            {/* Vídeo de Apresentação - antes do botão */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Conheça a Evelyn
              </h2>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 shadow-xl ring-1 ring-white/10">
                {videoPlaying ? (
                  <iframe
                    src={`${VIDEO_URL}?autoplay=1`}
                    title="Apresentação Evelyn"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="w-full h-full relative group cursor-pointer"
                  >
                    <img
                      src={THUMBNAIL_URL}
                      alt="Apresentação Evelyn"
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Botão Acessar */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Tire dúvidas, analise documentos, estude com flashcards e muito mais. 
                Tudo pelo WhatsApp, 24 horas por dia!
              </p>
              
              {isPremium ? (
                <Button 
                  onClick={abrirWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg px-6 py-3 h-12"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Acessar agora
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/assinatura')}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg px-6 py-3 h-12"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Seja Premium para acessar
                    <Lock className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Funcionalidade exclusiva para assinantes Premium
                  </p>
                </div>
              )}
            </div>

            {/* Carrossel de Funções com Ícones */}
            <div className="overflow-hidden py-4">
              <div className="relative h-16 flex items-center justify-center">
                <div className="absolute flex items-center gap-3">
                  {(() => {
                    const funcao = funcoesCarrossel[currentPropositoIndex];
                    const IconComponent = funcao.icon;
                    return (
                      <>
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-lg font-medium text-green-400">
                          {funcao.titulo}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Indicadores do carrossel */}
              <div className="flex justify-center gap-1.5 mt-3">
                {funcoesCarrossel.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      index === currentPropositoIndex 
                        ? "bg-green-400 w-4" 
                        : "bg-green-400/30"
                    }`}
                  />
                ))}
              </div>
            </div>


            {/* Funcionalidades */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                O que a Evelyn faz
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {funcionalidades.map((func) => (
                  <Card key={func.titulo} className="h-full hover:border-green-500/30 transition-colors">
                    <CardContent className="p-3 text-center space-y-2">
                      <div className="mx-auto w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <func.icon className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xs font-medium text-foreground leading-tight">{func.titulo}</h3>
                      <p className="text-xs text-muted-foreground leading-tight">{func.descricao}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Cadastro</h3>
                </div>
                
                {cadastrado ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Cadastro Realizado!</h3>
                      <p className="text-sm text-muted-foreground">Agora é só conversar com a Evelyn no WhatsApp</p>
                    </div>
                    <Button 
                      onClick={abrirWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar no WhatsApp
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : hasProfilePhone && !isEditing ? (
                  <div className="space-y-4 py-2">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Esse é seu número cadastrado. Selecione seu perfil e clique em "Usar esse número".
                      </p>
                    </div>
                    
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="font-medium">{nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">WhatsApp</p>
                          <p className="font-medium">
                            +{telefone.slice(0, 2)} ({telefone.slice(2, 4)}) {telefone.slice(4, 9)}-{telefone.slice(9)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Seleção de perfil */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Seu perfil
                      </Label>
                      <RadioGroup 
                        value={perfil || ''} 
                        onValueChange={(v) => setPerfil(v as PerfilEvelyn)}
                        className="grid grid-cols-1 gap-2"
                      >
                        {opcoesPerfil.map((op) => (
                          <div 
                            key={op.value}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              perfil === op.value 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-border hover:border-green-500/30 hover:bg-green-500/5'
                            }`}
                            onClick={() => setPerfil(op.value)}
                          >
                            <RadioGroupItem value={op.value} id={`profile-${op.value}`} />
                            <op.icon className={`w-5 h-5 ${perfil === op.value ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{op.label}</p>
                              <p className="text-xs text-muted-foreground">{op.descricao}</p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCadastro}
                        disabled={loading || !perfil}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading ? "Liberando..." : "Usar esse número"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="border-green-500/30 hover:bg-green-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {hasProfilePhone 
                        ? "Informe o novo número para a Evelyn"
                        : "Informe seu nome e telefone para liberar o acesso"
                      }
                    </p>
                    
                    <form onSubmit={handleCadastro} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-config" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Nome completo
                        </Label>
                        <Input
                          id="nome-config"
                          placeholder="Digite seu nome"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Telefone (WhatsApp)
                        </Label>
                        <PhoneInput
                          value={telefone}
                          onChange={(_, fullNumber) => setTelefone(fullNumber)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Seu perfil
                        </Label>
                        <RadioGroup 
                          value={perfil || ''} 
                          onValueChange={(v) => setPerfil(v as PerfilEvelyn)}
                          className="grid grid-cols-1 gap-2"
                        >
                          {opcoesPerfil.map((op) => (
                            <div 
                              key={op.value}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                perfil === op.value 
                                  ? 'border-green-500 bg-green-500/10' 
                                  : 'border-border hover:border-green-500/30 hover:bg-green-500/5'
                              }`}
                              onClick={() => setPerfil(op.value)}
                            >
                              <RadioGroupItem value={op.value} id={op.value} />
                              <op.icon className={`w-5 h-5 ${perfil === op.value ? 'text-green-400' : 'text-muted-foreground'}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{op.label}</p>
                                <p className="text-xs text-muted-foreground">{op.descricao}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      <div className="flex gap-2">
                        {hasProfilePhone && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="border-green-500/30"
                          >
                            Voltar
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={loading}
                        >
                          {loading ? (
                            "Cadastrando..."
                          ) : (
                            <>
                              Solicitar Acesso
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Atualizações */}
          <TabsContent value="atualizacoes" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Novidades da Evelyn</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Confira as últimas atualizações e melhorias da sua assistente jurídica:
                </p>
                
                <div className="space-y-3">
                  {atualizacoesEvelyn.map((atualizacao, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{atualizacao.data}</span>
                      </div>
                      <h4 className="font-medium text-foreground">{atualizacao.titulo}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{atualizacao.descricao}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Evelyn;
