import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Book, Scale, User, FileText, HelpCircle, Mail, Copy, Video, Headphones, BookOpen, FileQuestion, GraduationCap, Gavel, TrendingUp, Brain, Sparkles } from "lucide-react";
import { EmailSupportModal } from "@/components/EmailSupportModal";
import { FAQSearch } from "@/components/FAQSearch";
import { AppStatisticsCard } from "@/components/AppStatisticsCard";
import { useAppStatistics } from "@/hooks/useAppStatistics";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Ajuda() {
  const navigate = useNavigate();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    statistics,
    isLoading
  } = useAppStatistics();
  const copyEmail = () => {
    navigator.clipboard.writeText("wn7corporation@gmail.com");
    toast.success("E-mail copiado!");
  };
  const faqCategories = [{
    id: "funcionalidades",
    title: "Funcionalidades",
    icon: Book,
    questions: [{
      q: "A Professora funciona 24 horas?",
      a: "Sim! A Professora está disponível 24 horas por dia, 7 dias por semana para tirar suas dúvidas e ajudar nos seus estudos."
    }, {
      q: "Posso acessar pelo computador?",
      a: "Sim! O Direito Premium pode ser acessado tanto pelo celular quanto pelo computador, tablet ou qualquer dispositivo com internet."
    }, {
      q: "Se eu pagar, tenho acesso para sempre?",
      a: "Sim! O pagamento é único e você terá acesso vitalício a todo o conteúdo e atualizações futuras."
    }, {
      q: "Serve para concurso, OAB e faculdade?",
      a: "Sim! O conteúdo foi desenvolvido para atender estudantes de Direito em todas as etapas: faculdade, preparação para OAB e concursos públicos."
    }, {
      q: "As leis são atualizadas?",
      a: "Sim! Nosso conteúdo é atualizado regularmente com as últimas alterações legislativas e jurisprudenciais."
    }]
  }, {
    id: "conteudo",
    title: "Conteúdo",
    icon: Scale,
    questions: [{
      q: "Como acessar os cursos e videoaulas?",
      a: 'Acesse o menu "Faculdade" e escolha entre Cursos, Videoaulas ou Audioaulas. Todo o conteúdo está organizado por área do Direito.'
    }, {
      q: "Os flashcards são gratuitos?",
      a: "Sim! Todos os flashcards estão disponíveis gratuitamente. Acesse em Faculdade > Flashcards."
    }, {
      q: "O Vade Mecum está atualizado?",
      a: "Sim! Nosso Vade Mecum é atualizado regularmente com as últimas alterações legislativas."
    }, {
      q: "Posso baixar os materiais para estudar offline?",
      a: "Alguns materiais como PDFs de resumos podem ser salvos. Use o botão de download quando disponível."
    }]
  }, {
    id: "outros",
    title: "Outros",
    icon: HelpCircle,
    questions: [{
      q: "O app funciona offline?",
      a: "Algumas funcionalidades exigem internet (IA, atualizações). Conteúdos baixados ficam disponíveis offline."
    }, {
      q: "Como reportar um erro?",
      a: "Use o chat de suporte clicando no botão 'Falar com Suporte' ou entre em contato pelo e-mail da equipe."
    }, {
      q: "Como funciona o plano de estudos personalizado?",
      a: "Na seção Ferramentas, você encontra o Gerador de Plano de Estudos. Responda algumas perguntas e receba um cronograma personalizado."
    }]
  }];
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(faq => faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || faq.a.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(category => category.questions.length > 0);
  const statisticsCards = [{
    icon: BookOpen,
    title: "Flashcards",
    value: statistics.flashcards,
    color: "bg-blue-500"
  }, {
    icon: Video,
    title: "Videoaulas",
    value: statistics.videoaulas,
    color: "bg-red-500"
  }, {
    icon: Headphones,
    title: "Audioaulas",
    value: statistics.audioaulas,
    color: "bg-purple-500"
  }, {
    icon: Book,
    title: "Livros no Total",
    value: statistics.livrosTotal,
    color: "bg-green-500"
  }, {
    icon: FileText,
    title: "Resumos Jurídicos",
    value: statistics.resumos,
    color: "bg-orange-500"
  }, {
    icon: FileQuestion,
    title: "Questões OAB",
    value: statistics.questoesOAB,
    color: "bg-yellow-500"
  }, {
    icon: GraduationCap,
    title: "Aulas de Cursos",
    value: statistics.cursosAulas,
    color: "bg-indigo-500"
  }, {
    icon: Gavel,
    title: "Casos de Simulação",
    value: statistics.casosSimulacao,
    color: "bg-pink-500"
  }, {
    icon: Sparkles,
    title: "Funções do App",
    value: statistics.funcoesApp,
    color: "bg-teal-500",
    onClick: () => navigate("/numeros-detalhes?tipo=funcoes")
  }, {
    icon: Brain,
    title: "Mapas Mentais",
    value: statistics.mapasMentais,
    color: "bg-violet-500",
    onClick: () => navigate("/numeros-detalhes?tipo=mapas")
  }];
  return <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas, entre em contato ou veja nossos números
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="suporte" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Suporte
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="numeros" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Números
            </TabsTrigger>
          </TabsList>

          {/* Aba Suporte */}
          <TabsContent value="suporte" className="space-y-6 mt-6">
            <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Fale com Nossa Equipe</h2>
              <p className="text-muted-foreground mb-6">
                Estamos prontos para te ajudar com qualquer dúvida
              </p>
              <Button size="lg" onClick={() => setIsEmailModalOpen(true)} className="gap-2">
                <Mail className="w-5 h-5" />
                Iniciar Suporte
              </Button>
            </Card>
          </TabsContent>

          {/* Aba FAQ */}
          <TabsContent value="faq" className="space-y-6 mt-6">
            <FAQSearch value={searchTerm} onChange={setSearchTerm} />

            {filteredCategories.length === 0 ? <Card className="p-12 text-center">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">
                  Nenhuma pergunta encontrada para "{searchTerm}"
                </p>
              </Card> : <div className="space-y-6">
                {filteredCategories.map(category => {
              const Icon = category.icon;
              return <Card key={category.id} className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">{category.title}</h3>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, index) => <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>)}
                      </Accordion>
                    </Card>;
            })}
              </div>}
          </TabsContent>

          {/* Aba App em Números */}
          <TabsContent value="numeros" className="space-y-6 mt-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold mb-2">Direito Premium em Números</h2>
                <p className="text-muted-foreground">
                  Todo esse conteúdo está disponível para você estudar e aprender
                </p>
              </div>
            </Card>

            {isLoading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => <Card key={i} className="p-6">
                    <div className="flex flex-col items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </Card>)}
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {statisticsCards.map((card, index) => <AppStatisticsCard key={card.title} icon={card.icon} title={card.title} value={card.value} color={card.color} delay={index * 100} onClick={card.onClick} />)}
              </div>}

            {!isLoading && <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Detalhes da Biblioteca</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-3 bg-muted/50 rounded">
                    <span>Biblioteca de Estudos</span>
                    <span className="font-bold">{statistics.livrosEstudos} livros</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded">
                    <span>Fora da Toga</span>
                    <span className="font-bold">{statistics.livrosForaDaToga} livros</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded">
                    <span>Clássicos</span>
                    <span className="font-bold">{statistics.livrosClassicos} livros</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded">
                    <span>Liderança</span>
                    <span className="font-bold">{statistics.livrosLideranca} livros</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded">
                    <span>Oratória</span>
                    <span className="font-bold">{statistics.livrosOratoria} livros</span>
                  </div>
                </div>
              </Card>}
          </TabsContent>
        </Tabs>
      </div>

      <EmailSupportModal open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen} />
    </div>;
}