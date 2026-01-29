import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import ExplicacaoNoticiaModal from "./ExplicacaoNoticiaModal";

interface NoticiaModalDetalhesProps {
  noticia: {
    id: string;
    titulo: string;
    descricao: string;
    link: string;
    imagem?: string;
    data?: string;
  };
  open: boolean;
  onClose: () => void;
}

const NoticiaModalDetalhes = ({ noticia, open, onClose }: NoticiaModalDetalhesProps) => {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);


  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold pr-8">
              {noticia.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="w-full h-[70vh] rounded-lg overflow-hidden bg-muted">
              <iframe
                src={noticia.link}
                className="w-full h-full border-0"
                title={noticia.titulo}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>

            {/* Botão de Análise */}
            <Button
              onClick={() => setExplicacaoAberta(true)}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ver Análise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Explicação */}
      <ExplicacaoNoticiaModal
        isOpen={explicacaoAberta}
        onClose={() => setExplicacaoAberta(false)}
        titulo={noticia.titulo}
        url={noticia.link}
      />
    </>
  );
};

export default NoticiaModalDetalhes;
