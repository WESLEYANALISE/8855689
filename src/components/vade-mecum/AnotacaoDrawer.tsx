import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Save, Trash2, Loader2, X } from 'lucide-react';
import { useArtigoAnotacoes } from '@/hooks/useArtigoAnotacoes';

interface AnotacaoDrawerProps {
  open: boolean;
  onClose: () => void;
  tabelaCodigo: string;
  numeroArtigo: string;
  artigoId: number;
  codeName: string;
}

export const AnotacaoDrawer = ({
  open,
  onClose,
  tabelaCodigo,
  numeroArtigo,
  artigoId,
  codeName
}: AnotacaoDrawerProps) => {
  const {
    anotacao,
    isLoading,
    saveAnotacao,
    deleteAnotacao,
    isSaving,
    isDeleting,
    hasAnotacao
  } = useArtigoAnotacoes({
    tabelaCodigo,
    numeroArtigo,
    artigoId
  });

  const [texto, setTexto] = useState('');

  // Sincronizar com anotação do banco
  useEffect(() => {
    if (open) {
      setTexto(anotacao);
    }
  }, [open, anotacao]);

  const handleSave = () => {
    saveAnotacao(texto);
  };

  const handleDelete = () => {
    deleteAnotacao();
    setTexto('');
  };

  const hasChanges = texto !== anotacao;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <StickyNote className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <DrawerTitle className="text-lg">Anotações</DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  Art. {numeroArtigo} - {codeName}
                </p>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              placeholder="Escreva suas anotações sobre este artigo..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-[200px] resize-none text-base leading-relaxed"
              autoFocus
            />
          )}
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <div className="flex gap-3 w-full">
            {hasAnotacao && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || isDeleting || !hasChanges}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Anotação
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AnotacaoDrawer;
