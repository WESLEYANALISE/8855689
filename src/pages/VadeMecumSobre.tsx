import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, GraduationCap, Briefcase, Users, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const VadeMecumSobre = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen pb-20 px-4 py-6 max-w-3xl mx-auto">
      {/* Botão Voltar */}
      

      {/* Título Principal */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="bg-accent/10 rounded-full p-2">
            <Scale className="w-7 h-7 text-accent" />
          </div>
          Sobre o Vade Mecum Elite
        </h1>
      </div>

      <div className="space-y-8">
        {/* O que é? */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-foreground">O que é?</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Vade Mecum Elite é sua ferramenta completa de consulta jurídica digital, 
            reunindo a Constituição Federal, códigos essenciais, leis especiais, 
            estatutos e súmulas dos principais tribunais do Brasil. Com interface intuitiva 
            e sistema de busca avançada, você tem acesso rápido e organizado a toda 
            legislação brasileira necessária para seus estudos e prática profissional.
          </p>
        </div>

        {/* Exemplo Prático */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-foreground">
            <BookOpen className="w-6 h-6 text-accent" />
            Exemplo Prático
          </h2>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Cenário:</strong> Você está estudando Direito Penal e precisa 
                consultar rapidamente o artigo 121 do Código Penal (homicídio).
                <br /><br />
                <strong className="text-foreground">Com o Vade Mecum Elite:</strong> Digite "art 121 CP" na busca 
                e tenha acesso instantâneo ao artigo completo, seus parágrafos, incisos e 
                todas as informações necessárias, sem precisar folhear páginas físicas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Para quem é? */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Users className="w-6 h-6 text-accent" />
            Para quem é?
          </h2>
          <div className="grid gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/10 rounded-full p-3 flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Concurseiros</h3>
                    <p className="text-sm text-muted-foreground">
                      Estude para concursos públicos com acesso rápido a todas as leis 
                      cobradas em provas. Pesquise artigos específicos e tenha a legislação 
                      sempre à mão durante seus estudos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/10 rounded-full p-3 flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Estudantes de Direito</h3>
                    <p className="text-sm text-muted-foreground">
                      Consulte leis e artigos durante suas aulas, trabalhos acadêmicos e 
                      preparação para provas. Tenha sempre à disposição o material jurídico 
                      necessário para sua formação.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 rounded-full p-3 flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Advogados e Profissionais</h3>
                    <p className="text-sm text-muted-foreground">
                      Consulte rapidamente a legislação durante atendimentos, elaboração de 
                      peças processuais e audiências. Tenha um Vade Mecum sempre atualizado 
                      no seu bolso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default VadeMecumSobre;