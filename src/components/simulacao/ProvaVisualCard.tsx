import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Camera, ClipboardList, ZoomIn } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProvaVisualCardProps {
  prova: {
    nome: string;
    descricao: string;
    tipo: "documental" | "pericial" | "fotografia";
    relevancia: "alta" | "media" | "baixa";
    pontos: number;
    imagem_url?: string;
  };
  index: number;
}

const ProvaVisualCard = ({ prova, index }: ProvaVisualCardProps) => {
  const [zoomOpen, setZoomOpen] = useState(false);

  const iconMap = {
    documental: FileText,
    pericial: ClipboardList,
    fotografia: Camera,
  };

  const Icon = iconMap[prova.tipo] || FileText;

  const relevanciaColors = {
    alta: "bg-red-500/20 text-red-300 border-red-500/30",
    media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    baixa: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="bg-gray-800/60 border-amber-500/30 hover:border-amber-500/60 transition-all group">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Imagem da prova */}
              {prova.imagem_url ? (
                <div 
                  className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border-2 border-amber-500/30 cursor-pointer group-hover:border-amber-500/60 transition-all"
                  onClick={() => setZoomOpen(true)}
                >
                  <img 
                    src={prova.imagem_url} 
                    alt={prova.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-gray-700/50 border-2 border-gray-600 flex items-center justify-center">
                  <Icon className="w-12 h-12 text-gray-500" />
                </div>
              )}

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-white text-sm line-clamp-2">{prova.nome}</h4>
                  <Badge className={`${relevanciaColors[prova.relevancia]} flex-shrink-0 text-xs`}>
                    {prova.relevancia}
                  </Badge>
                </div>

                <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 mb-3">
                  {prova.descricao}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{prova.tipo}</span>
                  </div>
                  <div className="text-amber-400 font-semibold">
                    +{prova.pontos} pts
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl bg-gray-900 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{prova.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {prova.imagem_url && (
              <img 
                src={prova.imagem_url} 
                alt={prova.nome}
                className="w-full rounded-lg border border-amber-500/30"
              />
            )}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 text-sm leading-relaxed">{prova.descricao}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProvaVisualCard;
