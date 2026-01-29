import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Monitor, Loader2, Zap, Download, Send } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof formSchema>;

const AcessoDesktop = () => {
  const { toast } = useToast();
  const [imagens, setImagens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('salvar-acesso-desktop', {
        body: { nome: data.nome, email: data.email }
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Você receberá o link de acesso no seu e-mail em breve.",
      });
      reset();
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar sua solicitação. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const carregarImagens = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("IMAGEM - DESKTOP" as any)
          .select("link")
          .order("Imagem", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          const links = data.map((item: any) => item.link).filter((link): link is string => Boolean(link));
          setImagens(links);
        }
      } catch (error) {
        console.error("Erro ao carregar imagens:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as imagens da plataforma"
        });
      } finally {
        setIsLoading(false);
      }
    };
    carregarImagens();
  }, [toast]);

  const slidesInfo = [
    { titulo: "Tela ampliada", descricao: "Estude com mais conforto em uma tela maior" },
    { titulo: "Multitarefas", descricao: "Abra múltiplas abas e organize seus estudos" },
    { titulo: "Produtividade máxima", descricao: "Recursos avançados para acelerar seu aprendizado" },
    { titulo: "Acesso completo", descricao: "Todas as funcionalidades em um só lugar" },
  ];

  return (
    <div className="min-h-screen bg-background px-3 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acesso Desktop</h1>
              <p className="text-sm text-muted-foreground">
                Solicite acesso à plataforma completa
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-2 border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : imagens.length > 0 ? (
              <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[Autoplay({ delay: 4000 }) as any]}
                className="w-full"
              >
                <CarouselContent>
                  {imagens.map((imagem, index) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full">
                        <div className="relative h-[250px] md:h-[350px] w-full">
                          <img
                            src={imagem}
                            alt={`Plataforma Desktop ${index + 1}`}
                            className="w-full h-full object-contain bg-secondary/20"
                            loading="eager"
                            decoding="async"
                          />
                        </div>
                        <div className="p-4 bg-gradient-to-t from-card to-transparent">
                          <h3 className="text-lg font-bold text-foreground">
                            {slidesInfo[index % slidesInfo.length].titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {slidesInfo[index % slidesInfo.length].descricao}
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma imagem disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de benefícios persuasiva */}
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/30">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            Potencialize seus estudos
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Acesse a versão completa no seu computador e aproveite uma experiência de estudo 
            superior: <span className="text-foreground font-medium">tela maior</span>, 
            <span className="text-foreground font-medium"> multitarefas</span>, 
            <span className="text-foreground font-medium"> navegação rápida</span> e 
            <span className="text-foreground font-medium"> todos os recursos</span> para 
            você conquistar sua aprovação.
          </p>
        </div>

        <Card className="border-2 border-border bg-card">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Solicitar Acesso
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome"
                  {...register("nome")}
                  className="bg-background"
                />
                {errors.nome && (
                  <p className="text-sm text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  {...register("email")}
                  className="bg-background"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Enviando..." : "Solicitar Acesso"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                O que você receberá
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Link de acesso exclusivo</li>
                <li>• Instruções de instalação</li>
                <li>• Suporte técnico prioritário</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcessoDesktop;
