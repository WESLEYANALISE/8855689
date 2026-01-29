import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Clock, BookMarked, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SemanaData } from "@/lib/planoEstudosParser";

interface PlanoEstudosAccordionProps {
  semanas: SemanaData[];
}

export const PlanoEstudosAccordion = ({ semanas }: PlanoEstudosAccordionProps) => {
  if (!semanas || semanas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum cronograma encontrado</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3" defaultValue="semana-1">
      {semanas.map((semana) => (
        <AccordionItem 
          key={semana.semana} 
          value={`semana-${semana.semana}`}
          className="border-0 rounded-xl overflow-hidden bg-card shadow-md"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]>div>.badge]:bg-primary [&[data-state=open]>div>.badge]:text-primary-foreground">
            <div className="flex items-center gap-3 w-full">
              <Badge 
                variant="secondary" 
                className="badge shrink-0 font-bold transition-colors"
              >
                Semana {semana.semana}
              </Badge>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="font-semibold text-foreground truncate w-full">
                  {semana.titulo || `Conteúdo da Semana ${semana.semana}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {semana.dias.length > 0 ? `${semana.dias.length} dias de estudo` : "Ver detalhes"}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-4 pt-0">
            {semana.dias.length > 0 ? (
              <div className="space-y-3 mt-3">
                {semana.dias.map((dia, idx) => (
                  <div 
                    key={idx}
                    className="bg-muted/40 rounded-lg p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{dia.dia}</span>
                      {dia.cargaHoraria && (
                        <Badge variant="outline" className="ml-auto text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          {dia.cargaHoraria}
                        </Badge>
                      )}
                    </div>
                    
                    {dia.topicos && dia.topicos.length > 0 ? (
                      <div className="space-y-2 pl-10">
                        {dia.topicos.map((topico, tidx) => (
                          <div key={tidx} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 min-w-[80px]">
                              <Clock className="w-3 h-3" />
                              <span>{topico.horario}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {topico.titulo}
                              </p>
                              {topico.descricao && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {topico.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-10">
                        Conteúdo do dia não especificado
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 bg-muted/30 rounded-lg p-4 text-muted-foreground text-sm">
                Detalhes da semana não disponíveis
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
