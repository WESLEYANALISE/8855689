import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TutorialConfig {
  secao: string;
  titulo: string;
  descricao: string;
  icone: string;
  url: string;
}

const TUTORIAIS_PREDEFINIDOS: TutorialConfig[] = [
  {
    secao: 'codigo_penal',
    titulo: 'Código Penal',
    descricao: 'Aprenda a navegar pelo Código Penal, buscar artigos, ouvir narrações e muito mais',
    icone: 'Scale',
    url: '/vade-mecum/codigos/cp' // Main article list page
  },
  {
    secao: 'codigo_civil',
    titulo: 'Código Civil',
    descricao: 'Como usar o Código Civil: busca, narrações, termos e questões',
    icone: 'BookOpen',
    url: '/vade-mecum/codigos/cc' // Main article list page
  },
  {
    secao: 'flashcards',
    titulo: 'Flashcards',
    descricao: 'Estude com flashcards interativos e melhore sua memorização',
    icone: 'GraduationCap',
    url: '/flashcards'
  },
  {
    secao: 'professora',
    titulo: 'Chat Professora',
    descricao: 'Converse com a professora virtual para tirar dúvidas jurídicas',
    icone: 'HelpCircle',
    url: '/chat-professora'
  },
  {
    secao: 'simulados',
    titulo: 'Simulados',
    descricao: 'Pratique com simulados de concursos e OAB',
    icone: 'FileText',
    url: '/ferramentas/simulados'
  },
  {
    secao: 'vade_mecum',
    titulo: 'Vade Mecum',
    descricao: 'Navegue pelos códigos, estatutos, leis especiais e ordinárias',
    icone: 'BookMarked',
    url: '/vade-mecum'
  }
];

export default function AdminGerarTutoriais() {
  const navigate = useNavigate();
  const [gerando, setGerando] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, { sucesso: boolean; mensagem: string }>>({});
  const [customUrl, setCustomUrl] = useState('');
  const [customSecao, setCustomSecao] = useState('');

  const gerarTutorial = async (config: TutorialConfig) => {
    setGerando(config.secao);
    
    try {
      // Get base URL from current location
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${config.url}`;

      const { data, error } = await supabase.functions.invoke('gerar-tutorial-screenshots', {
        body: {
          secao: config.secao,
          url: fullUrl,
          titulo: config.titulo,
          descricao: config.descricao,
          icone: config.icone
        }
      });

      if (error) throw error;

      if (data.success) {
        setResultados(prev => ({
          ...prev,
          [config.secao]: {
            sucesso: true,
            mensagem: `${data.passos_gerados} passos gerados`
          }
        }));
        toast.success(`Tutorial "${config.titulo}" gerado com sucesso!`);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao gerar tutorial:', error);
      setResultados(prev => ({
        ...prev,
        [config.secao]: {
          sucesso: false,
          mensagem: error instanceof Error ? error.message : 'Erro ao gerar'
        }
      }));
      toast.error(`Erro ao gerar tutorial "${config.titulo}"`);
    } finally {
      setGerando(null);
    }
  };

  const gerarTodos = async () => {
    for (const config of TUTORIAIS_PREDEFINIDOS) {
      await gerarTutorial(config);
    }
    toast.success('Todos os tutoriais foram processados!');
  };

  const gerarCustom = async () => {
    if (!customUrl || !customSecao) {
      toast.error('Preencha a seção e URL');
      return;
    }

    await gerarTutorial({
      secao: customSecao,
      titulo: customSecao.charAt(0).toUpperCase() + customSecao.slice(1).replace(/_/g, ' '),
      descricao: `Tutorial para ${customSecao}`,
      icone: 'HelpCircle',
      url: customUrl
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Gerar Tutoriais</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info */}
        <div className="bg-primary/10 rounded-xl p-4 text-sm text-primary">
          <p>
            Este painel gera tutoriais automaticamente usando screenshots e análise de IA.
            O processo pode levar alguns segundos por tutorial.
          </p>
        </div>

        {/* Generate all button */}
        <Button
          onClick={gerarTodos}
          disabled={gerando !== null}
          className="w-full"
        >
          {gerando ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Gerar Todos os Tutoriais
        </Button>

        {/* Predefined tutorials */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Tutoriais Disponíveis</h2>
          
          {TUTORIAIS_PREDEFINIDOS.map((config) => {
            const resultado = resultados[config.secao];
            const isGerando = gerando === config.secao;

            return (
              <motion.div
                key={config.secao}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{config.titulo}</h3>
                  <p className="text-xs text-muted-foreground truncate">{config.url}</p>
                  {resultado && (
                    <p className={`text-xs mt-1 ${resultado.sucesso ? 'text-green-500' : 'text-red-500'}`}>
                      {resultado.mensagem}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {resultado?.sucesso && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {resultado && !resultado.sucesso && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gerarTutorial(config)}
                    disabled={gerando !== null}
                  >
                    {isGerando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : resultado ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      'Gerar'
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Custom tutorial */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-semibold text-foreground">Tutorial Personalizado</h2>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="secao">Nome da Seção</Label>
              <Input
                id="secao"
                value={customSecao}
                onChange={(e) => setCustomSecao(e.target.value)}
                placeholder="ex: minha_funcionalidade"
              />
            </div>
            <div>
              <Label htmlFor="url">URL da Página</Label>
              <Input
                id="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="ex: /minha-pagina"
              />
            </div>
            <Button
              variant="outline"
              onClick={gerarCustom}
              disabled={gerando !== null || !customUrl || !customSecao}
              className="w-full"
            >
              {gerando === customSecao ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Gerar Tutorial Personalizado'
              )}
            </Button>
          </div>
        </div>

        {/* View tutorials button */}
        <Button
          variant="outline"
          onClick={() => navigate('/tutoriais')}
          className="w-full"
        >
          Ver Tutoriais Gerados
        </Button>
      </div>
    </div>
  );
}
