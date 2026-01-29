import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, CheckCircle, AlertCircle, Lightbulb, Book, ArrowLeft, Home, Loader2, Video, BookOpen, Brain, Play, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PontuacaoBar } from "@/components/simulacao/PontuacaoBar";
import { ShareResultModal } from "@/components/simulacao/ShareResultModal";

const SimulacaoFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState<any>(null);
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [livros, setLivros] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [mostrarShareModal, setMostrarShareModal] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      if (!id) return;

      const { data: partidaData, error: partidaError } = await supabase
        .from('SIMULACAO_PARTIDAS')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (partidaError) throw partidaError;
      setPartida(partidaData);

      const { data: casoData, error: casoError } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('id', partidaData.caso_id)
        .single();

      if (casoError) throw casoError;
      setCaso(casoData);

      // Buscar materiais de estudo relacionados
      await buscarMateriaisEstudo(casoData.area, casoData.tema);
    } catch (error: any) {
      console.error('Erro ao carregar feedback:', error);
      toast.error('Erro ao carregar feedback');
    } finally {
      setLoading(false);
    }
  };

  const buscarMateriaisEstudo = async (area: string, tema: string) => {
    try {
      console.log('🔍 Buscando materiais para área:', area, 'tema:', tema);

      // Buscar livros
      const { data: livrosData } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('*')
        .eq('Área', area)
        .limit(3);
      
      if (livrosData) setLivros(livrosData);

      // Buscar vídeos
      const { data: videosData } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*')
        .eq('area', area)
        .limit(3);
      
      if (videosData) setVideos(videosData);

      // Buscar flashcards
      const { data: flashcardsData } = await supabase
        .from('FLASHCARDS_GERADOS' as any)
        .select('*')
        .eq('area', area)
        .eq('tema', tema)
        .limit(10);
      
      if (flashcardsData) setFlashcards(flashcardsData);

      // CRÍTICO: Buscar artigos da tabela correta
      if (caso?.tabela_artigos && caso?.artigos_ids?.length > 0) {
        console.log('📚 Buscando artigos da tabela:', caso.tabela_artigos);
        
        const { data: artigosData, error: artigosError } = await supabase
          .from(caso.tabela_artigos)
          .select('*')
          .in('id', caso.artigos_ids);

        if (artigosError) {
          console.error('Erro ao buscar artigos:', artigosError);
        } else if (artigosData) {
          console.log('✅ Artigos encontrados:', artigosData.length);
          // Armazenar artigos para exibição (você pode adicionar um estado para isso)
        }
      } else if (caso?.artigos_relacionados) {
        // Fallback: usar artigos que já estão no caso (formato antigo)
        console.log('⚠️ Usando artigos do formato antigo');
      }
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!partida || !caso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800/90 border-red-500/30">
          <CardContent className="p-8 text-center">
            <p className="text-red-400 mb-4">Dados não encontrados</p>
            <Button onClick={() => navigate("/simulacao-juridica")}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pontuacaoMaxima = 100;
  const resultado = partida.deferido ? 'DEFERIDO' : 'INDEFERIDO';
  const deferimentoParcial = partida.pontuacao_final >= 50 && partida.pontuacao_final < 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/simulacao-juridica")}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar ao Início
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Feedback Completo
          </h1>
          <p className="text-gray-300">{caso.titulo_caso}</p>
        </div>

        {/* Resultado Principal */}
        <Card className={`border-2 mb-8 animate-fade-in ${
          partida.deferido 
            ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50' 
            : deferimentoParcial
            ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/50'
            : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/50'
        }`}>
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <Scale className="w-12 h-12 text-amber-500" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">SENTENÇA</h2>
                <p className={`text-xl font-bold ${
                  partida.deferido ? 'text-green-400' : deferimentoParcial ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {deferimentoParcial ? 'DEFERIMENTO PARCIAL' : resultado}
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                {partida.sentenca_recebida}
              </p>
            </div>

            <PontuacaoBar pontuacao={partida.pontuacao_final} pontuacaoMaxima={pontuacaoMaxima} />
          </CardContent>
        </Card>

        {/* Timeline de Escolhas */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Scale className="w-6 h-6 text-amber-500" />
              Suas Escolhas
            </h3>
            
            <div className="space-y-6">
              {partida.argumentacoes_escolhidas?.map((arg: any, index: number) => (
                <div key={index} className="border-l-4 border-amber-500/50 pl-6 relative">
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-amber-500">
                        Fase {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          arg.forca === 'forte' ? 'bg-green-500/20 text-green-400' :
                          arg.forca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {arg.forca}
                        </span>
                        <span className="text-amber-500 font-bold">+{arg.pontos} pts</span>
                      </div>
                    </div>
                    <p className="text-gray-200 text-sm">{arg.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* O que você acertou */}
        {partida.acertos && partida.acertos.length > 0 && (
          <Card className="bg-gray-800/90 border-green-500/30 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                O que você acertou
              </h3>
              
              <div className="space-y-3">
                {partida.acertos.map((acerto: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-200">{acerto}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* O que poderia melhorar */}
        {partida.erros && partida.erros.length > 0 && (
          <Card className="bg-gray-800/90 border-yellow-500/30 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                O que poderia melhorar
              </h3>
              
              <div className="space-y-3">
                {partida.erros.map((erro: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-200">{erro}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dicas para próxima */}
        {partida.sugestoes_melhoria && partida.sugestoes_melhoria.length > 0 && (
          <Card className="bg-gray-800/90 border-blue-500/30 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-blue-500" />
                Dicas para próxima
              </h3>
              
              <div className="space-y-3">
                {partida.sugestoes_melhoria.map((dica: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-200">{dica}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estude mais sobre este tema - EXPANDIDO */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Book className="w-7 h-7 text-purple-500" />
              Estude mais sobre este tema
            </h3>
            <p className="text-gray-300 mb-6">
              Aprofunde seus conhecimentos com materiais selecionados sobre {caso?.tema}
            </p>
            
            <div className="space-y-6">
              {/* Artigos do Vade Mecum */}
              {caso?.artigos_relacionados?.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Artigos do Vade Mecum
                  </h4>
                  <div className="space-y-2">
                    {caso.artigos_relacionados.slice(0, 5).map((artigo: any, index: number) => (
                      <div key={index} className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/60 transition-all">
                        <p className="text-sm font-bold text-white mb-1">{artigo['Número do Artigo'] || `Artigo ${index + 1}`}</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{artigo.Artigo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Livros Relacionados */}
              {livros.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Livros Recomendados
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {livros.map((livro: any, index: number) => (
                      <div key={index} className="bg-blue-500/10 rounded-lg overflow-hidden border border-blue-500/30 hover:border-blue-500/60 transition-all group cursor-pointer" onClick={() => navigate(`/biblioteca-estudos/livro/${livro.id}`)}>
                        {livro['Capa-livro'] && (
                          <div className="h-48 overflow-hidden bg-gray-900">
                            <img 
                              src={livro['Capa-livro']} 
                              alt={livro.Tema}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h5 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{livro.Tema}</h5>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{livro.Sobre}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/biblioteca-estudos/livro/${livro.id}`);
                              }}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              Ver Livro
                            </Button>
                            {livro.Download && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(livro.Download, '_blank');
                                }}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              >
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vídeoaulas */}
              {videos.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Vídeoaulas
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {videos.map((video: any, index: number) => {
                      const videoId = video.link?.includes('youtube.com') || video.link?.includes('youtu.be')
                        ? video.link.split('v=')[1]?.split('&')[0] || video.link.split('/').pop()
                        : null;
                      const thumbnail = videoId 
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : null;

                      return (
                        <div key={index} className="bg-red-500/10 rounded-lg overflow-hidden border border-red-500/30 hover:border-red-500/60 transition-all group cursor-pointer" onClick={() => video.link && window.open(video.link, '_blank')}>
                          <div className="aspect-video bg-gray-900 relative overflow-hidden">
                            {thumbnail ? (
                              <img 
                                src={thumbnail} 
                                alt={video.categoria}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-red-900/30 flex items-center justify-center">
                                <Video className="w-12 h-12 text-red-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h5 className="font-bold text-white mb-1 group-hover:text-red-400 transition-colors break-words">{video.categoria}</h5>
                            <p className="text-xs text-gray-400 mb-3">{video.area}</p>
                            {video.link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(video.link, '_blank');
                                }}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full"
                              >
                                <Video className="mr-2 w-4 h-4" />
                                Assistir Vídeo
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {flashcards.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Flashcards para Memorização
                  </h4>
                  <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/30">
                    <p className="text-white mb-4">
                      <span className="text-2xl font-bold text-green-400">{flashcards.length}</span> flashcards disponíveis sobre {caso?.tema}
                    </p>
                    <Button
                      onClick={() => navigate(`/flashcards/estudar?area=${caso?.area}&tema=${caso?.tema}`)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Brain className="mr-2 w-4 h-4" />
                      Estudar com Flashcards
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botão Compartilhar Resultado */}
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 mb-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-6 text-center">
            <Share2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Compartilhe seu resultado!
            </h3>
            <p className="text-gray-300 mb-4">
              Mostre para seus amigos como você se saiu nesta simulação
            </p>
            <Button
              size="lg"
              onClick={() => setMostrarShareModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8"
            >
              <Share2 className="mr-2 w-5 h-5" />
              Compartilhar no WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Botões finais - Maiores e mais responsivos */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Button
            size="lg"
            onClick={() => navigate("/simulacao-juridica/areas")}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-6 text-base md:text-lg font-bold shadow-lg hover:scale-105 transition-all"
          >
            Jogar Novamente
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 py-6 text-base md:text-lg font-bold hover:scale-105 transition-all"
          >
            <Home className="mr-2 w-5 h-5" />
            Voltar ao Início
          </Button>
        </div>
        
        {/* Modal de Compartilhamento */}
        <ShareResultModal
          open={mostrarShareModal}
          onClose={() => setMostrarShareModal(false)}
          partida={partida}
          caso={caso}
        />
      </div>
    </div>
  );
};

export default SimulacaoFeedback;
