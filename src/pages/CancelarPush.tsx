import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CancelarPush() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Link inválido. Token não fornecido.');
      return;
    }

    const cancelarInscricao = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('cancelar-push', {
          body: { token }
        });

        if (error) throw error;

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Inscrição cancelada com sucesso');
          setEmail(data.email || '');
        } else {
          throw new Error(data.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.error('Erro ao cancelar:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro ao cancelar inscrição');
      }
    };

    cancelarInscricao();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Processando...</h2>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto cancelamos sua inscrição.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Inscrição Cancelada</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {message}
              </p>
              {email && (
                <p className="text-sm text-muted-foreground mb-6">
                  E-mail: <strong>{email}</strong>
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-6">
                Você não receberá mais e-mails do Push de Legislação.
              </p>
              <Button onClick={() => navigate('/')} className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Erro</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {message}
              </p>
              <Button onClick={() => navigate('/')} className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
