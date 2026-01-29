import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TutorialViewer } from '@/components/tutorial/TutorialViewer';

interface PassoTutorial {
  ordem: number;
  titulo: string;
  descricao: string;
  screenshot_url: string;
  anotacoes: Array<{
    tipo: 'retangulo' | 'seta' | 'circulo';
    posicao?: { x: number; y: number; largura: number; altura: number };
    de?: { x: number; y: number };
    para?: { x: number; y: number };
    cor: string;
  }>;
}

interface Tutorial {
  id: number;
  secao: string;
  titulo: string;
  descricao: string | null;
  passos: PassoTutorial[];
}

export default function TutorialPage() {
  const { secao } = useParams<{ secao: string }>();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTutorial() {
      if (!secao) {
        setError('Seção não especificada');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('tutoriais_app')
        .select('*')
        .eq('secao', secao)
        .eq('ativo', true)
        .single();

      if (fetchError) {
        setError('Tutorial não encontrado');
      } else if (data) {
        // Parse passos if it's a string
        const passos = typeof data.passos === 'string' 
          ? JSON.parse(data.passos) 
          : data.passos;
        
        setTutorial({
          ...data,
          passos: Array.isArray(passos) ? passos : []
        } as Tutorial);
      }
      setLoading(false);
    }

    fetchTutorial();
  }, [secao]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">{error || 'Tutorial não encontrado'}</p>
        <Button variant="outline" onClick={() => navigate('/tutoriais')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Tutoriais
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tutoriais')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate">
            {tutorial.titulo}
          </h1>
        </div>
      </motion.div>

      {/* Tutorial Viewer */}
      <div className="py-6">
        {tutorial.passos.length > 0 ? (
          <TutorialViewer
            titulo={tutorial.titulo}
            passos={tutorial.passos}
            onClose={() => navigate('/tutoriais')}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Este tutorial ainda não possui passos configurados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
