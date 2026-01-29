import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ExternalLink, Download, FileText, BookOpen, X, ZoomIn, ZoomOut } from "lucide-react";

interface TCCPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  titulo: string;
  textoFormatado?: string | null;
}

const TCCPDFViewer = ({ isOpen, onClose, pdfUrl, titulo, textoFormatado }: TCCPDFViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pdf" | "texto">("pdf");
  const [zoom, setZoom] = useState(100);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold line-clamp-1 pr-8">
              {titulo}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pdf" | "texto")} className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pdf" className="gap-2">
                <FileText className="h-4 w-4" />
                PDF Original
              </TabsTrigger>
              {textoFormatado && (
                <TabsTrigger value="texto" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Leitura Formatada
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === "pdf" && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {pdfUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(pdfUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Original
                  </Button>
                </>
              )}
            </div>
          </div>

          <TabsContent value="pdf" className="flex-1 m-0 relative">
            {loading && pdfUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Carregando PDF...</p>
                </div>
              </div>
            )}
            
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#zoom=${zoom}`}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                title={titulo}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">PDF não disponível</p>
                </div>
              </div>
            )}
          </TabsContent>

          {textoFormatado && (
            <TabsContent value="texto" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-6 max-w-3xl mx-auto">
                  <article className="prose prose-sm dark:prose-invert max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-foreground leading-relaxed"
                      style={{ fontSize: "1rem", lineHeight: "1.8" }}
                    >
                      {textoFormatado}
                    </div>
                  </article>
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TCCPDFViewer;
