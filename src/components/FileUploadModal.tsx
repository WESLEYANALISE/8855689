import { useState } from "react";
import { Camera, FileImage, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export const FileUploadModal = ({ open, onClose, onFileSelect }: FileUploadModalProps) => {
  const [selectedType, setSelectedType] = useState<"pdf" | "image" | "camera" | null>(null);

  const handleFileInput = (accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onFileSelect(file);
        onClose();
      }
    };
    input.click();
  };

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onFileSelect(file);
        onClose();
      }
    };
    input.click();
  };

  const options = [
    {
      id: "pdf",
      icon: FileText,
      label: "Enviar PDF",
      description: "Anexe um documento PDF",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      hoverBg: "hover:bg-red-500/20",
      onClick: () => handleFileInput("application/pdf"),
    },
    {
      id: "image",
      icon: FileImage,
      label: "Enviar Imagem",
      description: "Anexe uma foto da galeria",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      hoverBg: "hover:bg-blue-500/20",
      onClick: () => handleFileInput("image/*"),
    },
    {
      id: "camera",
      icon: Camera,
      label: "Tirar Foto",
      description: "Use a câmera do dispositivo",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      hoverBg: "hover:bg-green-500/20",
      onClick: handleCameraCapture,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
          <DialogDescription>
            Escolha como deseja enviar seu arquivo
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                  option.borderColor,
                  option.hoverBg,
                  "hover:scale-[1.02]"
                )}
              >
                <div className={cn("p-3 rounded-lg", option.bgColor)}>
                  <Icon className={cn("w-6 h-6", option.color)} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
