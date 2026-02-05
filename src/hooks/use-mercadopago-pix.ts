import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PlanType = 'vitalicio';

interface PixData {
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
  ticketUrl: string;
  expiresAt: string;
  amount: number;
  planType: PlanType;
  planDays: number;
}

interface UseMercadoPagoPixReturn {
  pixData: PixData | null;
  loading: boolean;
  error: string | null;
  createPix: (userId: string, userEmail: string, planType: PlanType) => Promise<boolean>;
  copyPixCode: () => Promise<void>;
  reset: () => void;
}

export const useMercadoPagoPix = (): UseMercadoPagoPixReturn => {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPix = useCallback(async (
    userId: string, 
    userEmail: string, 
    planType: PlanType
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mercadopago-criar-pix', {
        body: { userId, userEmail, planType }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao criar pagamento PIX');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao gerar QR Code PIX');
      }

      setPixData({
        paymentId: data.paymentId,
        qrCodeBase64: data.qrCodeBase64,
        qrCode: data.qrCode,
        ticketUrl: data.ticketUrl,
        expiresAt: data.expiresAt,
        amount: data.amount,
        planType: data.planType,
        planDays: data.planDays
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Erro ao gerar PIX",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const copyPixCode = useCallback(async () => {
    if (!pixData?.qrCode) {
      toast({
        title: "Erro",
        description: "Código PIX não disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar",
      });
    } catch (err) {
      // Fallback para dispositivos que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = pixData.qrCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar",
      });
    }
  }, [pixData?.qrCode]);

  const reset = useCallback(() => {
    setPixData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    pixData,
    loading,
    error,
    createPix,
    copyPixCode,
    reset
  };
};
