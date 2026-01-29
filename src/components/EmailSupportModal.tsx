import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, Upload, X, AlertCircle, MessageCircle, Lightbulb, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface EmailSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailSupportModal = ({ open, onOpenChange }: EmailSupportModalProps) => {
  const [assunto, setAssunto] = useState<string>("bug");
  const [mensagem, setMensagem] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);

  const assuntosDisponiveis = [
    { 
      value: "bug", 
      label: "🐛 Reportar Bug", 
      icon: AlertCircle,
      description: "Problemas técnicos ou erros no aplicativo"
    },
    { 
      value: "duvida", 
      label: "❓ Dúvida", 
      icon: MessageCircle,
      description: "Perguntas sobre funcionalidades"
    },
    { 
      value: "sugestao", 
      label: "💡 Sugestão", 
      icon: Lightbulb,
      description: "Ideias para melhorar o app"
    },
    { 
      value: "feedback", 
      label: "💬 Feedback", 
      icon: MessageSquare,
      description: "Comentários gerais sobre o app"
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 3 - imagens.length);
      setImagens([...imagens, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
    }
  };

  const removeImagem = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
    toast.info("Imagem removida");
  };

  const handleEnviar = () => {
    if (!mensagem.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }

    const assuntoSelecionado = assuntosDisponiveis.find(a => a.value === assunto);
    const subjectText = `[${assuntoSelecionado?.label.replace(/[^\w\s]/gi, '')}] - Direito Premium`;
    
    let bodyText = mensagem;
    
    if (imagens.length > 0) {
      bodyText += `\n\n---\nObs: ${imagens.length} imagem(ns) anexada(s) (por favor, anexe as imagens manualmente no seu cliente de e-mail)`;
    }

    const mailtoLink = `mailto:wn7corporation@gmail.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
    
    window.location.href = mailtoLink;
    
    toast.success("Abrindo seu cliente de e-mail...");
    
    // Resetar formulário após breve delay
    setTimeout(() => {
      setMensagem("");
      setImagens([]);
      setAssunto("bug");
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-6 h-6 text-primary" />
            Contato por E-mail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Assunto */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Assunto</Label>
            <RadioGroup value={assunto} onValueChange={setAssunto} className="gap-3">
              {assuntosDisponiveis.map((tipo) => {
                const Icon = tipo.icon;
                return (
                  <div key={tipo.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={tipo.value} id={tipo.value} className="mt-1" />
                    <Label
                      htmlFor={tipo.value}
                      className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-0.5 text-primary" />
                        <div>
                          <div className="font-semibold mb-1">{tipo.label}</div>
                          <div className="text-sm text-muted-foreground">{tipo.description}</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Mensagem */}
          <div className="space-y-3">
            <Label htmlFor="mensagem" className="text-base font-semibold">
              Mensagem
            </Label>
            <Textarea
              id="mensagem"
              placeholder="Descreva detalhadamente sua questão, bug ou sugestão..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {mensagem.length} caracteres
            </p>
          </div>

          {/* Upload de Imagens */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Imagens (opcional - até 3)
            </Label>
            
            {imagens.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imagens.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImagem(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 truncate">{img.name}</p>
                  </div>
                ))}
              </div>
            )}

            {imagens.length < 3 && (
              <div>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para adicionar imagens
                  </span>
                </Label>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Você pode anexar capturas de tela ou fotos para ilustrar melhor sua questão
            </p>
          </div>

          {/* Nota sobre imagens */}
          {imagens.length > 0 && (
            <div className="p-4 bg-accent/20 border border-accent/50 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Nota:</strong> As imagens serão mencionadas no e-mail. Por favor, anexe-as manualmente ao enviar o e-mail pelo seu cliente de e-mail.
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleEnviar}
            >
              <Mail className="w-4 h-4" />
              Abrir E-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
