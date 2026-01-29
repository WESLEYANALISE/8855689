import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Plus,
  User,
  Users,
  BookOpen,
  Scale,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DadosParteCompleto, gerarQualificacaoABNT } from './PeticaoPartesDados';
import { JurisprudenciaItem, formatarCitacaoABNT } from './PeticaoJurisBusca';

interface PeticaoEditorWYSIWYGProps {
  conteudo: string;
  onConteudoChange: (conteudo: string) => void;
  dadosAutor?: DadosParteCompleto;
  dadosReu?: DadosParteCompleto;
  dadosAdvogado?: {
    nome: string;
    oabNumero: string;
    oabEstado: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  jurisprudencias?: JurisprudenciaItem[];
}

const MenuButton = ({ 
  onClick, 
  active = false, 
  disabled = false,
  children,
  title
}: { 
  onClick: () => void; 
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0",
      active && "bg-muted"
    )}
  >
    {children}
  </Button>
);

export const PeticaoEditorWYSIWYG = ({
  conteudo,
  onConteudoChange,
  dadosAutor,
  dadosReu,
  dadosAdvogado,
  jurisprudencias = [],
}: PeticaoEditorWYSIWYGProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Digite o conteúdo da petição aqui...',
      }),
    ],
    content: conteudo,
    onUpdate: ({ editor }) => {
      onConteudoChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 font-serif',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const inserirTexto = (texto: string) => {
    editor.chain().focus().insertContent(texto + '\n\n').run();
  };

  const inserirSecao = (titulo: string) => {
    editor.chain()
      .focus()
      .insertContent(`<p><strong>${titulo.toUpperCase()}</strong></p><p></p>`)
      .run();
  };

  const inserirCitacao = (texto: string) => {
    editor.chain()
      .focus()
      .insertContent(`<blockquote><p>${texto}</p></blockquote><p></p>`)
      .run();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Editor da Petição</CardTitle>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Inserir
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Inserir na Petição</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                  <div className="space-y-4">
                    {/* Seções */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Seções
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['DOS FATOS', 'DO DIREITO', 'DOS PEDIDOS', 'DA PRELIMINAR', 'DO MÉRITO', 'DA CONCLUSÃO'].map((secao) => (
                          <Button
                            key={secao}
                            variant="outline"
                            size="sm"
                            onClick={() => inserirSecao(secao)}
                            className="text-xs"
                          >
                            {secao}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Dados do Autor */}
                    {dadosAutor && dadosAutor.nome && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Qualificação do Autor
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto py-2"
                          onClick={() => inserirTexto(gerarQualificacaoABNT(dadosAutor))}
                        >
                          <span className="line-clamp-2 text-xs">
                            {dadosAutor.nome}
                          </span>
                        </Button>
                      </div>
                    )}

                    {/* Dados do Réu */}
                    {dadosReu && (dadosReu.nome || dadosReu.razaoSocial) && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Qualificação do Réu
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto py-2"
                          onClick={() => inserirTexto(gerarQualificacaoABNT(dadosReu))}
                        >
                          <span className="line-clamp-2 text-xs">
                            {dadosReu.nome || dadosReu.razaoSocial}
                          </span>
                        </Button>
                      </div>
                    )}

                    {/* Dados do Advogado */}
                    {dadosAdvogado && dadosAdvogado.nome && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          Advogado
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto py-2"
                          onClick={() => inserirTexto(
                            `${dadosAdvogado.nome}, inscrito na OAB/${dadosAdvogado.oabEstado} sob nº ${dadosAdvogado.oabNumero}`
                          )}
                        >
                          <span className="line-clamp-2 text-xs">
                            {dadosAdvogado.nome} - OAB/{dadosAdvogado.oabEstado} {dadosAdvogado.oabNumero}
                          </span>
                        </Button>
                      </div>
                    )}

                    <Separator />

                    {/* Jurisprudências */}
                    {jurisprudencias.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Jurisprudências Selecionadas
                        </h4>
                        <div className="space-y-2">
                          {jurisprudencias.map((juris) => (
                            <Button
                              key={juris.id}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start h-auto py-2"
                              onClick={() => inserirCitacao(formatarCitacaoABNT(juris))}
                            >
                              <span className="line-clamp-2 text-xs">
                                {juris.tribunal} - {juris.numeroProcesso}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <div className="border-b px-2 py-1 flex flex-wrap items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Sublinhado"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Centralizar"
          >
            <AlignCenter className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Alinhar à direita"
          >
            <AlignRight className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justificar"
          >
            <AlignJustify className="w-4 h-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </MenuButton>
          
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="w-4 h-4" />
          </MenuButton>
        </div>

        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="bg-card">
              <EditorContent editor={editor} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Estilos customizados para o editor */}
      <style>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1.5rem;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        .ProseMirror p {
          text-align: justify;
          text-indent: 1.25cm;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          text-indent: 0;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .ProseMirror blockquote {
          margin-left: 4cm;
          padding-left: 0;
          border-left: none;
          font-size: 0.875rem;
          line-height: 1.15;
          text-indent: 0;
        }
        
        .ProseMirror blockquote p {
          text-indent: 0;
          margin-bottom: 0.25rem;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin-left: 2rem;
        }
        
        .ProseMirror li {
          text-indent: 0;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
