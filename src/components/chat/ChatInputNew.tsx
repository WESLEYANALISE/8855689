import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Image, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UploadedFile } from "@/hooks/useStreamingChat";

interface ChatInputProps {
  onSend: (message: string, files?: UploadedFile[], extractedText?: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onExtractPdf: (file: File) => Promise<string>;
}

export const ChatInputNew = ({ 
  onSend, 
  isStreaming, 
  onStop,
  uploadedFiles,
  onFilesChange,
  onExtractPdf
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() && !uploadedFiles.length) return;
    if (isStreaming) return;
    
    onSend(input.trim(), uploadedFiles);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File, type: 'image' | 'pdf') => {
    setIsProcessingFile(true);
    setShowAttachMenu(false);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploaded: UploadedFile = {
        name: file.name,
        type: file.type,
        data: base64
      };

      onFilesChange([...uploadedFiles, uploaded]);

      // Para PDFs, extrair texto e enviar automaticamente
      if (type === 'pdf') {
        const extractedText = await onExtractPdf(file);
        onSend(`📎 PDF anexado: ${file.name}`, [uploaded], extractedText);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-red-900/30 bg-[#1a0a0a] p-4 pb-6 relative z-20">
      {/* Arquivos anexados */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {uploadedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm"
            >
              {file.type.includes('image') ? (
                <Image className="w-4 h-4 text-blue-500" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              <span className="max-w-32 truncate">{file.name}</span>
              <button 
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Botão de anexo */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={isStreaming || isProcessingFile}
            className="h-12 w-12 text-white/60 hover:text-white hover:bg-white/10"
          >
            {isProcessingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>

          {showAttachMenu && (
            <div className="absolute bottom-14 left-0 bg-neutral-800 border border-white/10 rounded-lg shadow-lg p-2 min-w-40 z-50">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 rounded-md text-sm text-white/80"
              >
                <Image className="w-4 h-4 text-blue-400" />
                Imagem
              </button>
              <button
                onClick={() => pdfInputRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 rounded-md text-sm text-white/80"
              >
                <FileText className="w-4 h-4 text-red-400" />
                PDF
              </button>
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, 'image');
              e.target.value = '';
            }}
          />
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, 'pdf');
              e.target.value = '';
            }}
          />
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta..."
          className="flex-1 min-h-[52px] max-h-32 resize-none bg-white/20 border-white/40 text-white placeholder:text-white/60 focus-visible:ring-red-500/60 focus-visible:border-red-500/60 text-base shadow-inner"
          rows={1}
          disabled={isStreaming}
        />

        {/* Botão enviar/parar */}
        <Button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!input.trim() && !uploadedFiles.length && !isStreaming}
          size="icon"
          className={cn(
            "h-12 w-12",
            isStreaming 
              ? "bg-destructive hover:bg-destructive/90" 
              : "bg-red-800 hover:bg-red-700"
          )}
        >
          {isStreaming ? (
            <X className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
