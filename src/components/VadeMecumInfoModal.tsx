import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scale, BookOpen, GraduationCap, Briefcase, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VadeMecumInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VadeMecumInfoModal = ({ isOpen, onClose }: VadeMecumInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="w-6 h-6 text-accent" />
            Sobre o Vade Mecum Elite
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">O que é?</h3>
            <p className="text-muted-foreground leading-relaxed">
              O Vade Mecum Elite é sua ferramenta completa de consulta jurídica digital, 
              reunindo a Constituição Federal, códigos essenciais, leis especiais, 
              estatutos e súmulas dos principais tribunais do Brasil. Com interface intuitiva 
              e sistema de busca avançada, você tem acesso rápido e organizado a toda 
              legislação brasileira necessária para seus estudos e prática profissional.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5 text-accent" />
              Exemplo Prático
            </h3>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4">
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

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-accent" />
              Para quem é?
            </h3>
            <div className="grid gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/10 rounded-full p-2">
                      <GraduationCap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Concurseiros</h4>
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
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 rounded-full p-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Estudantes de Direito</h4>
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
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500/10 rounded-full p-2">
                      <Briefcase className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Advogados e Profissionais</h4>
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
      </DialogContent>
    </Dialog>
  );
};

export default VadeMecumInfoModal;
