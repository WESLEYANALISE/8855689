import { useState, useEffect } from "react";
import { X, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VideoAulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  artigo: string;
  numeroArtigo: string;
}

const VideoAulaModal = ({ isOpen, onClose, videoUrl, artigo, numeroArtigo }: VideoAulaModalProps) => {
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  const handleSendQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user" as const, content: question };
    setChatMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `Você é um assistente jurídico especialista. O estudante está analisando o seguinte artigo:\n\nArt. ${numeroArtigo}\n${artigo}\n\nResponda às perguntas de forma clara, didática e objetiva sobre este artigo.`
              },
              ...chatMessages,
              userMessage
            ]
          })
        }
      );

      if (!response.ok) throw new Error('Falha ao enviar pergunta');

      const data = await response.json();
      const assistantMessage = { role: "assistant" as const, content: data.message };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar pergunta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua pergunta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">Vídeo Aula</h2>
            <p className="text-sm text-muted-foreground">Art. {numeroArtigo}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video */}
          {videoId && (
            <div className="aspect-video w-full bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="Vídeo Aula"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Article */}
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-accent mb-3">Art. {numeroArtigo}</h3>
            <p className="text-foreground/90 whitespace-pre-line leading-relaxed font-legal text-base">
              {artigo}
            </p>
          </div>

          {/* Chat with Professor */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
              <span>💬</span> Assistente Jurídico
            </h3>
            
            {/* Chat Messages */}
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Faça uma pergunta sobre este artigo
                </p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-accent/20 ml-8"
                        : "bg-secondary mr-8"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1 text-accent">
                      {msg.role === "user" ? "Você" : "Assistente"}
                    </p>
                    <p className="text-foreground/90 text-sm whitespace-pre-line font-legal">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Digite sua pergunta sobre este artigo..."
                className="flex-1 min-h-[60px] font-legal"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
              />
              <Button
                onClick={handleSendQuestion}
                disabled={loading || !question.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAulaModal;
