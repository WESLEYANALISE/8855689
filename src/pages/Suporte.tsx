import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Book, Scale, User, FileText, Gamepad2, HelpCircle } from "lucide-react";
import { SuporteChatModal } from "@/components/SuporteChatModal";

export default function Suporte() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const faqCategories = [
    {
      id: "aprendizado",
      title: "Aprendizado",
      icon: Book,
      questions: [
        {
          q: "Como acessar os cursos e videoaulas?",
          a: 'Acesse o menu "Aprender" e escolha entre Cursos, Videoaulas ou Audioaulas. Todo o conteúdo está organizado por área do Direito.'
        },
        {
          q: "Os flashcards são gratuitos?",
          a: "Sim! Todos os flashcards estão disponíveis gratuitamente. Acesse em Aprender > Flashcards."
        },
        {
          q: "Como funciona o plano de estudos personalizado?",
          a: "Na seção Ferramentas, você encontra o Gerador de Plano de Estudos. Responda algumas perguntas e receba um cronograma personalizado."
        }
      ]
    },
    {
      id: "ferramentas",
      title: "Ferramentas Jurídicas",
      icon: Scale,
      questions: [
        {
          q: "O Vade Mecum está atualizado?",
          a: "Sim! Nosso Vade Mecum é atualizado regularmente com as últimas alterações legislativas."
        },
        {
          q: "Como buscar jurisprudência?",
          a: 'Acesse "Jurisprudência" no menu e use os filtros por tribunal, área do direito e palavras-chave.'
        },
        {
          q: "Posso baixar os materiais para estudar offline?",
          a: "Alguns materiais como PDFs de resumos e petições podem ser salvos. Use o botão de download quando disponível."
        }
      ]
    },
    {
      id: "conta",
      title: "Conta e Acesso",
      icon: User,
      questions: [
        {
          q: "Como criar uma conta?",
          a: "Clique em 'Entrar' no menu e siga as instruções para criar sua conta com e-mail ou Google."
        },
        {
          q: "Esqueci minha senha, como recupero?",
          a: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas por e-mail."
        },
        {
          q: "Posso usar em mais de um dispositivo?",
          a: "Sim! Sua conta sincroniza automaticamente em todos os dispositivos."
        }
      ]
    },
    {
      id: "documentos",
      title: "Documentos e Petições",
      icon: FileText,
      questions: [
        {
          q: "Como gerar uma petição?",
          a: 'Acesse "Ferramentas" > "Advogado IA" e escolha o tipo de petição. Preencha os dados e a IA gerará o documento.'
        },
        {
          q: "Posso editar as petições geradas?",
          a: "Sim! Todas as petições podem ser editadas antes de exportar para PDF."
        },
        {
          q: "Os documentos são salvos automaticamente?",
          a: "Sim, seus documentos ficam disponíveis no histórico do Advogado IA."
        }
      ]
    },
    {
      id: "jogos",
      title: "Jogos e Simulações",
      icon: Gamepad2,
      questions: [
        {
          q: "Como funcionam as simulações de audiência?",
          a: "Escolha um caso, selecione provas e argumentos, e enfrente um advogado virtual. Você recebe feedback em tempo real da juíza."
        },
        {
          q: "Os jogos ajudam no aprendizado?",
          a: "Sim! Jogos como Forca, Stop e Palavras Cruzadas reforçam conceitos jurídicos de forma lúdica."
        },
        {
          q: "Posso repetir as simulações?",
          a: "Sim! Você pode jogar quantas vezes quiser para melhorar sua pontuação."
        }
      ]
    },
    {
      id: "outros",
      title: "Outros",
      icon: HelpCircle,
      questions: [
        {
          q: "O app funciona offline?",
          a: "Algumas funcionalidades exigem internet (IA, atualizações). Conteúdos baixados ficam disponíveis offline."
        },
        {
          q: "Como reportar um erro?",
          a: "Use o chat de suporte clicando no botão abaixo ou entre em contato pelo e-mail da equipe."
        },
        {
          q: "Vocês oferecem certificados?",
          a: "Atualmente não oferecemos certificados, mas estamos trabalhando nessa funcionalidade!"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Como podemos te ajudar?</h1>
          <p className="text-lg text-muted-foreground">
            Encontre respostas rápidas ou entre em contato com nosso suporte
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
                onClick={() => {
                  const element = document.getElementById(`faq-${category.id}`);
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{category.title}</h3>
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Perguntas Frequentes</h2>
          
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} id={`faq-${category.id}`} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            );
          })}
        </div>

        {/* Contact Support CTA */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Ainda precisa de ajuda?</h3>
          <p className="text-muted-foreground mb-6">
            Nossa equipe de suporte está pronta para te atender
          </p>
          <Button size="lg" onClick={() => setIsChatOpen(true)} className="gap-2">
            <MessageCircle className="w-5 h-5" />
            Falar com o Suporte
          </Button>
        </Card>
      </div>

      <SuporteChatModal open={isChatOpen} onOpenChange={setIsChatOpen} />
    </div>
  );
}
