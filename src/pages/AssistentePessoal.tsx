import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle, Clock, Sparkles, Brain } from "lucide-react";

export default function AssistentePessoal() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5511940432865', '_blank');
  };

  const beneficios = [
    {
      icon: Brain,
      titulo: "Inteligência Artificial Avançada",
      descricao: "Assistente jurídica com IA preparada para responder suas dúvidas"
    },
    {
      icon: Clock,
      titulo: "Disponível 24/7",
      descricao: "Tire suas dúvidas a qualquer momento, de onde estiver"
    },
    {
      icon: Sparkles,
      titulo: "Respostas Personalizadas",
      descricao: "Orientações adaptadas ao seu nível de conhecimento"
    },
    {
      icon: CheckCircle,
      titulo: "Suporte Completo",
      descricao: "Ajuda com estudos, pesquisas e orientações jurídicas"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-10 h-10 text-green-600" />
            <h1 className="text-4xl font-bold">Assistente Pessoal Jurídica</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sua assistente jurídica no WhatsApp para te ajudar com dúvidas, estudos e orientações no dia a dia
          </p>
        </div>

        {/* Video de Demonstração com nome Evelyn */}
        <Card className="overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/HlE9u1c_MPQ"
              title="Evelyn - Assistente Pessoal"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>

        {/* CTA Logo abaixo do vídeo */}
        <Card className="p-6 text-center bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <h3 className="text-xl font-bold mb-2">Conheça a Evelyn!</h3>
          <p className="text-muted-foreground mb-4">
            Clique no botão abaixo e fale com a assistente pelo WhatsApp
          </p>
          <Button 
            size="lg" 
            onClick={handleWhatsAppClick} 
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com a Evelyn
          </Button>
        </Card>

        {/* Benefícios */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6">Por que usar a Evelyn?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beneficios.map((beneficio, index) => {
              const Icon = beneficio.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{beneficio.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{beneficio.descricao}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* O que a Assistente pode fazer */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">O que a Evelyn pode fazer por você?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Tirar dúvidas sobre conceitos jurídicos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Ajudar na compreensão de artigos e leis</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Sugerir materiais de estudo e recursos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Orientar sobre processos e procedimentos jurídicos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Esclarecer termos técnicos do Direito</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
