import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TermoJuridico {
  termo: string;
  definicao: string;
}

export interface ChatMessage {
  id: string; // ID único estável para evitar problemas de scroll/re-render
  role: "user" | "assistant";
  content: string;
  termos?: TermoJuridico[]; // Termos jurídicos extraídos pela IA
  isStreaming?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

type ChatMode = "study" | "realcase" | "recommendation" | "psychologist" | "tcc" | "refutacao" | "aula";

interface UseStreamingChatOptions {
  mode: ChatMode;
  responseLevel: 'basic' | 'complete' | 'deep';
  linguagemMode: 'descomplicado' | 'tecnico';
}

export const useStreamingChat = (options: UseStreamingChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearChat = useCallback(() => {
    setMessages([]);
    setUploadedFiles([]);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (
    userMessage: string, 
    files?: UploadedFile[], 
    extractedText?: string,
    streamMode: 'chat' | 'analyze' = 'chat'
  ) => {
    if (!userMessage.trim() && !files?.length) return;

    // Adicionar mensagem do usuário IMEDIATAMENTE com ID único
    const userMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: "user", 
      content: userMessage 
    };
    
    // Criar mensagem do assistente IMEDIATAMENTE com cursor e ID único
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = { 
      id: assistantMsgId, 
      role: "assistant", 
      content: "", 
      isStreaming: true 
    };
    
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/chat-professora`,
        {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Usar streaming SSE para resposta em tempo real
            'Accept': 'text/event-stream',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
            'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'}`
          },
          body: JSON.stringify({
            messages: allMessages,
            files: files || uploadedFiles,
            mode: streamMode === 'analyze' ? 'analyze' : options.mode,
            extractedText,
            responseLevel: options.responseLevel,
            linguagemMode: options.linguagemMode
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        const result = await response.json();
        const text = result?.data || result?.content || result?.generatedText || '';
        // Pegar termos jurídicos se existirem (gerados pela API)
        const termos = result?.termos || [];
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = { 
              ...newMessages[lastIndex], // Preservar ID
              role: 'assistant', 
              content: text, 
              termos: termos,
              isStreaming: false 
            };
          }
          return newMessages;
        });
      } else {
        // Streaming SSE
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || 
                           parsed.choices?.[0]?.delta?.content || 
                           '';
              
              if (delta) {
                accumulatedContent += delta;
                
                // Atualizar mensagem TOKEN POR TOKEN
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    newMessages[lastIndex] = { 
                      ...newMessages[lastIndex], // Preservar ID
                      role: 'assistant', 
                      content: accumulatedContent, 
                      isStreaming: true 
                    };
                  }
                  return newMessages;
                });
              }
            } catch {
              // Ignorar linhas que não são JSON válido
            }
          }
        }

        // Finalizar streaming
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = { 
              ...newMessages[lastIndex], // Preservar ID
              role: 'assistant', 
              content: accumulatedContent, 
              isStreaming: false 
            };
          }
          return newMessages;
        });
      }

      setUploadedFiles([]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Streaming abortado pelo usuário');
      } else {
        console.error('Erro no chat:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = { 
              ...newMessages[lastIndex], // Preservar ID
              role: 'assistant', 
              content: 'Desculpe, ocorreu um erro. Tente novamente.', 
              isStreaming: false 
            };
          }
          return newMessages;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, options, uploadedFiles]);

  return {
    messages,
    isStreaming,
    uploadedFiles,
    setUploadedFiles,
    sendMessage,
    clearChat,
    stopStreaming
  };
};
