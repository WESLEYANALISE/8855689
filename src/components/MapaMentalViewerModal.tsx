import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, Loader2, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MapaMentalViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  numeroArtigo: string;
  codigoNome: string;
  onRetry?: () => void;
  error?: string | null;
}

export const MapaMentalViewerModal = ({
  isOpen,
  onClose,
  imageUrl,
  isLoading,
  numeroArtigo,
  codigoNome,
  onRetry,
  error,
}: MapaMentalViewerModalProps) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa-mental-art-${numeroArtigo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Mapa mental baixado!");
    } catch (err) {
      toast.error("Erro ao baixar imagem");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 bg-card rounded-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Mapa Mental</h3>
                <p className="text-xs text-muted-foreground">Art. {numeroArtigo} - {codigoNome}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {imageUrl && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    className="hover:bg-accent/20"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    className="hover:bg-accent/20"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="hover:bg-accent/20 text-green-400"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-accent/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Gerando Mapa Mental...</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    A IA está criando um infográfico visual do artigo
                  </p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Erro ao gerar</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
                </div>
                {onRetry && (
                  <Button onClick={onRetry} variant="outline" className="mt-2">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                )}
              </div>
            )}

            {imageUrl && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              >
                <img
                  src={imageUrl}
                  alt={`Mapa Mental - Art. ${numeroArtigo}`}
                  className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
                  onError={() => toast.error("Erro ao carregar imagem")}
                />
              </motion.div>
            )}
          </div>

          {/* Footer with download button */}
          {imageUrl && !isLoading && (
            <div className="p-4 border-t border-border flex justify-center">
              <Button
                onClick={handleDownload}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Mapa Mental
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
