import { useState, useRef, useEffect } from "react";
import { Volume2, Loader2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatAudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

// Converter PCM para WAV
const pcmToWav = (pcmData: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Blob => {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV Header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM data
  const wavData = new Uint8Array(buffer);
  wavData.set(pcmData, 44);

  return new Blob([wavData], { type: 'audio/wav' });
};

export const ChatAudioPlayer = ({ text, autoPlay = false }: ChatAudioPlayerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (autoPlay && text && !audioUrl && !isLoading) {
      generateAudio();
    }
  }, [autoPlay, text]);

  const generateAudio = async () => {
    if (isLoading || !text.trim()) return;
    
    setIsLoading(true);
    setError(false);

    try {
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[-•]\s/g, '')
        .trim();

      if (cleanText.length < 10) {
        setError(true);
        return;
      }

      const truncatedText = cleanText.substring(0, 4000);

      const { data, error: fnError } = await supabase.functions.invoke('gerar-audio-professora', {
        body: { text: truncatedText }
      });

      if (fnError) throw fnError;

      if (data?.audioBase64) {
        // Decodificar base64 para Uint8Array
        const byteCharacters = atob(data.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const audioData = new Uint8Array(byteNumbers);
        
        // Criar blob com o tipo correto (WAV direto da API TTS)
        const mimeType = data.mimeType || 'audio/wav';
        const blob = new Blob([audioData], { type: mimeType });
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setError(true);
          setIsPlaying(false);
        };
        
        await audio.play();
        setIsPlaying(true);
      } else {
        throw new Error('Áudio não retornado');
      }
    } catch (err) {
      console.error('Erro ao gerar áudio:', err);
      setError(true);
      toast.error('Não foi possível gerar o áudio');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) {
      generateAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClick = () => {
    if (audioUrl) {
      togglePlayPause();
    } else {
      generateAudio();
    }
  };

  if (error) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="gap-1.5 text-muted-foreground opacity-50"
      >
        <VolumeX className="w-4 h-4" />
        <span className="text-xs">Indisponível</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Gerando...</span>
        </>
      ) : isPlaying ? (
        <>
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span className="text-xs animate-pulse">Narrando...</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Ouvir</span>
        </>
      )}
    </Button>
  );
};
