import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

interface SuporteChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuporteChatModal = ({ open, onOpenChange }: SuporteChatModalProps) => {
  const [loading, setLoading] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Suporte Direito Premium</h2>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src="https://tawk.to/chat/6334e74154f06e12d8976e15/1ge3aemji"
          className="w-full h-full border-0"
          title="Chat de Suporte"
          allow="microphone"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};
