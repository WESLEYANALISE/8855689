import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSearch, Mic, HelpCircle, FileCheck, Settings, Image, History, ImageIcon, ScrollText, FlaskConical, Scale, Sparkles, Instagram, Eye, BookOpen, Bell, FolderSync, ScanText, Users, Activity, MessageCircle, PlayCircle, Search, Briefcase, Newspaper, CreditCard, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminHub = () => {
  const navigate = useNavigate();

  const ferramentasAdmin = [
    {
      id: "base-conhecimento-oab",
      title: "Base Conhecimento OAB",
      description: "Gerenciar PDFs de referência para geração de conteúdo IA",
      icon: Database,
      route: "/admin/base-conhecimento-oab",
      color: "text-emerald-500",
    },
    {
      id: "boletins-juridicos",
      title: "Boletins Jurídicos",
      description: "Visualizar e disparar boletins via WhatsApp",
      icon: Newspaper,
      route: "/admin/boletins",
      color: "text-orange-500",
    },
    {
      id: "evelyn-whatsapp",
      title: "Evelyn WhatsApp",
      description: "Gerenciar chatbot jurídico com IA no WhatsApp",
      icon: MessageCircle,
      route: "/ferramentas/evelyn-whatsapp",
      color: "text-green-500",
    },
    {
      id: "evelyn-usuarios",
      title: "Usuários Evelyn",
      description: "Ver todos os usuários cadastrados no WhatsApp",
      icon: MessageCircle,
      route: "/admin/evelyn-usuarios",
      color: "text-green-400",
    },
    {
      id: "evelyn-metricas",
      title: "Métricas Evelyn",
      description: "Dashboard de uso e conversão da assistente WhatsApp",
      icon: Activity,
      route: "/admin/evelyn-metricas",
      color: "text-violet-500",
    },
    {
      id: "tutoriais",
      title: "Tutoriais do App",
      description: "Aprenda a usar todas as funcionalidades",
      icon: PlayCircle,
      route: "/tutoriais",
      color: "text-cyan-500",
    },
    {
      id: "atualizar-lei",
      title: "Atualizar Leis",
      description: "Central de extração de legislação",
      icon: BookOpen,
      route: "/ferramentas/atualizar-lei",
      color: "text-emerald-500",
    },
    {
      id: "raspar-questoes",
      title: "Raspar Questões",
      description: "Extrair questões do QConcursos",
      icon: Search,
      route: "/ferramentas/raspar-questoes",
      color: "text-rose-500",
    },
    {
      id: "concursos-abertos",
      title: "Concursos Abertos",
      description: "Últimas notícias de concursos públicos",
      icon: Briefcase,
      route: "/ferramentas/concursos-abertos",
      color: "text-amber-500",
    },
    {
      id: "usuarios",
      title: "Usuários App",
      description: "Gerenciar usuários cadastrados, excluir ou banir",
      icon: Users,
      route: "/admin/usuarios",
      color: "text-blue-500",
    },
    {
      id: "assinaturas",
      title: "Assinaturas",
      description: "Visualizar métricas de assinaturas e pagamentos",
      icon: CreditCard,
      route: "/admin/assinaturas",
      color: "text-amber-500",
    },
    {
      id: "geracao-central",
      title: "Central de Geração IA",
      description: "Gerenciar geração de conteúdo e áudio com IA",
      icon: Sparkles,
      route: "/admin/geracao",
      color: "text-primary",
    },
    {
      id: "sincronizar-peticoes",
      title: "Sincronizar Petições",
      description: "Sincronizar modelos de petições do Google Drive",
      icon: FolderSync,
      route: "/admin/sincronizar-peticoes",
      color: "text-teal-500",
    },
    {
      id: "extracao-peticoes",
      title: "Extração de Petições",
      description: "Extrair texto das petições para banco de conhecimento da IA",
      icon: ScanText,
      route: "/admin/extracao-peticoes",
      color: "text-orange-500",
    },
    {
      id: "posts-juridicos",
      title: "Posts Jurídicos",
      description: "Criar e gerenciar posts estilo Instagram",
      icon: Instagram,
      route: "/admin/posts-juridicos",
      color: "text-pink-500",
    },
    {
      id: "infograficos",
      title: "Infográficos",
      description: "Transforme texto jurídico em diagramas visuais com IA",
      icon: Image,
      route: "/ferramentas/infograficos",
      color: "text-cyan-500",
    },
    {
      id: "atualizacao-lei-final",
      title: "Atualização de Lei Final",
      description: "Formate, valide e popule tabelas de leis",
      icon: ScrollText,
      route: "/ferramentas/atualizacao-lei-final",
      color: "text-emerald-500",
    },
    {
      id: "converter-imagens",
      title: "Converter Imagens",
      description: "Converta PNG/JPG para WebP em lote",
      icon: ImageIcon,
      route: "/ferramentas/converter-imagens",
      color: "text-violet-500",
    },
    {
      id: "jurisprudencias-teste",
      title: "Jurisprudências Teste",
      description: "Ambiente de testes para busca de jurisprudências",
      icon: FlaskConical,
      route: "/ferramentas/jurisprudencias-teste",
      color: "text-rose-500",
    },
    {
      id: "diario-oficial",
      title: "Diário Oficial",
      description: "Busca em diários oficiais de 4.000+ municípios",
      icon: ScrollText,
      route: "/diario-oficial",
      color: "text-amber-500",
    },
    {
      id: "corpus927",
      title: "Corpus 927",
      description: "Jurisprudência consolidada dos tribunais superiores",
      icon: Scale,
      route: "/jurisprudencia-corpus927",
      color: "text-indigo-500",
    },
    {
      id: "novas-leis",
      title: "Novas Leis",
      description: "Acompanhe as leis ordinárias mais recentes",
      icon: Sparkles,
      route: "/novas-leis",
      color: "text-lime-500",
    },
    {
      id: "monitoramento-leis",
      title: "Monitoramento de Leis",
      description: "Detectar automaticamente alterações legislativas no Planalto",
      icon: Eye,
      route: "/admin/monitoramento-leis",
      color: "text-cyan-500",
    },
    {
      id: "historico-leis",
      title: "Histórico de Leis",
      description: "Extrair e gerenciar histórico de alterações das leis",
      icon: History,
      route: "/admin/historico-leis",
      color: "text-amber-500",
    },
    {
      id: "geracao-fundos",
      title: "Geração de Fundos",
      description: "Gerar imagens de fundo personalizadas com IA (Nano Banana)",
      icon: Image,
      route: "/admin/geracao-fundos",
      color: "text-purple-500",
    },
    {
      id: "raspar-leis",
      title: "Raspar Leis",
      description: "Extrair artigos de leis do Planalto para o banco de dados",
      icon: FileSearch,
      route: "/admin/raspar-leis",
      color: "text-blue-500",
    },
    {
      id: "narracao-artigos",
      title: "Narração de Artigos",
      description: "Gerenciar áudios de narração dos artigos do Vade Mecum",
      icon: Mic,
      route: "/admin/narracao",
      color: "text-green-500",
    },
    {
      id: "gerar-questoes",
      title: "Gerar Questões",
      description: "Gerar questões automáticas para os artigos",
      icon: HelpCircle,
      route: "/admin/gerar-questoes",
      color: "text-purple-500",
    },
    {
      id: "verificar-ocr",
      title: "Verificar OCR",
      description: "Verificar e corrigir textos extraídos por OCR",
      icon: FileCheck,
      route: "/admin/verificar-ocr",
      color: "text-orange-500",
    },
    {
      id: "gerar-tutoriais",
      title: "Gerar Tutoriais",
      description: "Criar tutoriais automáticos para o app",
      icon: Settings,
      route: "/admin/gerar-tutoriais",
      color: "text-pink-500",
    },
    {
      id: "leitura-dinamica",
      title: "Leitura Dinâmica",
      description: "Importar livros em PDF para leitura dinâmica",
      icon: BookOpen,
      route: "/admin/leitura-dinamica",
      color: "text-amber-500",
    },
    {
      id: "notificacoes-push",
      title: "Notificações Push",
      description: "Enviar notificações para dispositivos móveis",
      icon: Bell,
      route: "/admin/notificacoes-push",
      color: "text-red-500",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/ferramentas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Administração</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ferramentas de gestão e manutenção do sistema
            </p>
          </div>
        </div>

        {/* Lista de Ferramentas Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ferramentasAdmin.map((ferramenta) => {
            const Icon = ferramenta.icon;
            return (
              <button
                key={ferramenta.id}
                onClick={() => navigate(ferramenta.route)}
                className="bg-card border border-border rounded-xl p-4 text-left transition-all hover:bg-muted/50 hover:scale-[1.02] flex flex-col gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${ferramenta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    {ferramenta.title}
                  </h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  {ferramenta.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminHub;
