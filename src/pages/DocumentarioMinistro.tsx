import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Film, RefreshCw, Clock, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContentGenerationLoader } from '@/components/ContentGenerationLoader';
import { DocumentarioPlayer } from '@/components/documentario/DocumentarioPlayer';

interface Cena {
  ordem: number;
  titulo: string;
  texto_narrado: string;
  url_audio?: string;
  imagem_url: string;
  imagem_descricao: string;
  duracao?: number;
}

interface Documentario {
  ministro_nome: string;
  cenas: Cena[];
  duracao_total: number;
  status: string;
}

const DocumentarioMinistro = () => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const [documentario, setDocumentario] = useState<Documentario | null>(null);
  const [verificandoCache, setVerificandoCache] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  const [gerando, setGerando] = useState(false);

  const nomeDecodificado = nome ? decodeURIComponent(nome) : '';

  useEffect(() => {
    if (nomeDecodificado) {
      carregarDocumentario();
    }
  }, [nomeDecodificado]);

  const carregarDocumentario = async () => {
    try {
      setVerificandoCache(true);

      const { data: cached } = await supabase
        .from('documentarios_ministros')
        .select('*')
        .eq('ministro_nome', nomeDecodificado)
        .maybeSingle();

      if (cached && cached.status === 'pronto' && cached.cenas) {
        const cenasRaw = Array.isArray(cached.cenas) ? cached.cenas : [];
        
        if (cenasRaw.length > 0) {
          const cenas: Cena[] = cenasRaw.map((c: any) => ({
            ordem: c.ordem || 0,
            titulo: c.titulo || '',
            texto_narrado: c.texto_narrado || '',
            url_audio: c.url_audio,
            imagem_url: c.imagem_url || '',
            imagem_descricao: c.imagem_descricao || '',
            duracao: c.duracao
          }));
          
          setDocumentario({
            ministro_nome: cached.ministro_nome,
            cenas,
            duracao_total: cached.duracao_total || 0,
            status: cached.status || 'pronto'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar documentário:', error);
    } finally {
      setVerificandoCache(false);
    }
  };

  const gerarDocumentario = async (forcar = false) => {
    try {
      setGerando(true);
      setLoadingMessage('Buscando informações na Wikipedia...');

      toast.info('Gerando documentário...', {
        description: 'Isso pode levar alguns minutos',
        duration: 10000
      });

      const mensagens = [
        'Buscando informações na Wikipedia...',
        'Pesquisando imagens no Wikimedia Commons...',
        'Criando roteiro narrativo com IA...',
        'Gerando narração com voz natural...',
        'Sincronizando cenas...',
        'Finalizando documentário...'
      ];

      let msgIndex = 0;
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % mensagens.length;
        setLoadingMessage(mensagens[msgIndex]);
      }, 5000);

      const { data, error } = await supabase.functions.invoke('gerar-documentario-ministro', {
        body: { 
          ministro_nome: nomeDecodificado,
          forcar_regenerar: forcar
        }
      });

      clearInterval(interval);

      if (error) throw error;

      if (data?.documentario) {
        setDocumentario({
          ministro_nome: data.documentario.ministro_nome,
          cenas: data.documentario.cenas || [],
          duracao_total: data.documentario.duracao_total || 0,
          status: 'pronto'
        });
        toast.success('Documentário gerado com sucesso!');
      } else {
        throw new Error('Documentário não foi gerado corretamente');
      }

    } catch (error: any) {
      console.error('Erro ao gerar documentário:', error);
      toast.error(error.message || 'Erro ao gerar documentário');
    } finally {
      setGerando(false);
    }
  };

  const formatDuracao = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-3 py-4 max-w-5xl mx-auto pb-20">
      {/* Header - Aparece instantaneamente */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        {documentario && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => gerarDocumentario(true)}
            disabled={gerando}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${gerando ? 'animate-spin' : ''}`} />
            Regenerar
          </Button>
        )}
      </div>

      {/* Título - Aparece instantaneamente */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Film className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{nomeDecodificado}</h1>
        </div>
        <p className="text-muted-foreground">
          Documentário narrado com imagens reais
        </p>
      </div>

      {/* Gerando */}
      {gerando && (
        <div className="mb-6">
          <ContentGenerationLoader message={loadingMessage} />
        </div>
      )}

      {/* Verificando cache - Skeleton leve */}
      {verificandoCache && !gerando && (
        <Card className="border-dashed animate-pulse">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full mb-4" />
            <div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Player ou botão para gerar */}
      {!gerando && !verificandoCache && documentario && documentario.cenas.length > 0 ? (
        <div className="space-y-6">
          <DocumentarioPlayer 
            cenas={documentario.cenas} 
            ministroNome={documentario.ministro_nome}
          />

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuracao(documentario.duracao_total)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Film className="w-4 h-4" />
              <span>{documentario.cenas.length} cenas</span>
            </div>
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span>Imagens reais do Wikimedia</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Capítulos</h3>
            <div className="grid gap-2">
              {documentario.cenas.map((cena, index) => (
                <Card key={index} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={cena.imagem_url || '/placeholder.svg'}
                        alt={cena.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cena.ordem}. {cena.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cena.texto_narrado?.substring(0, 80)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ~{cena.duracao || 30}s
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : !gerando && !verificandoCache && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Film className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Documentário não gerado
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Clique abaixo para gerar um documentário narrado sobre {nomeDecodificado} 
              com imagens reais do Wikimedia Commons e narração por IA.
            </p>
            <Button onClick={() => gerarDocumentario()} size="lg">
              <Film className="w-5 h-5 mr-2" />
              Gerar Documentário
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentarioMinistro;
