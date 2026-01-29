import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PontuacaoBar } from "@/components/simulacao/PontuacaoBar";
import { TypingIndicator } from "@/components/simulacao/TypingIndicator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import juizaAvatar from "@/assets/juiza-avatar.jpg";
import advogadoReuAvatar from "@/assets/advogado-reu-avatar.jpg";

interface Turno {
  ordem: number;
  tipo: 'juiza_abertura' | 'juiza_pergunta' | 'jogador_responde' | 'advogado_reu_refuta' | 'apresentacao_provas' | 'consideracoes_finais';
  texto?: string;
  respostas_possiveis?: any[];
  provas?: any[];
  completo: boolean;
}

interface Mensagem {
  tipo: 'juiza' | 'advogado_jogador' | 'advogado_reu' | 'sistema';
  texto: string;
  timestamp: Date;
  nome?: string;
}

const SimulacaoAudienciaNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [partida, setPartida] = useState<any>(null);
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turnoAtual, setTurnoAtual] = useState(0);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pontuacao, setPontuacao] = useState(0);
  const [typing, setTyping] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [escolhasRealizadas, setEscolhasRealizadas] = useState<any[]>([]);
  const [audienciaIniciada, setAudienciaIniciada] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, typing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

      // Restaurar estado se já iniciado
      if (partidaData.historico_mensagens && Array.isArray(partidaData.historico_mensagens) && partidaData.historico_mensagens.length > 0) {
        const mensagensRestauradas: Mensagem[] = (partidaData.historico_mensagens as any[]).map((m: any) => ({
          tipo: m.tipo || 'sistema',
          texto: m.texto || '',
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          nome: m.nome
        }));
        setMensagens(mensagensRestauradas);
        setPontuacao(partidaData.pontuacao_final || 0);
        setEscolhasRealizadas(Array.isArray(partidaData.argumentacoes_escolhidas) ? partidaData.argumentacoes_escolhidas : []);
        setTurnoAtual(Array.isArray(partidaData.argumentacoes_escolhidas) ? partidaData.argumentacoes_escolhidas.length : 0);
        setAudienciaIniciada(true);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar audiência');
    } finally {
      setLoading(false);
    }
  };

  const dividirTextoLongo = (texto: string, maxLength: number = 200): string[] => {
    if (texto.length <= maxLength) return [texto];
    
    const partes: string[] = [];
    let textoRestante = texto;
    
    while (textoRestante.length > 0) {
      if (textoRestante.length <= maxLength) {
        partes.push(textoRestante);
        break;
      }
      
      let pontoCorte = textoRestante.lastIndexOf('.', maxLength);
      if (pontoCorte === -1 || pontoCorte < maxLength / 2) {
        pontoCorte = textoRestante.lastIndexOf(' ', maxLength);
      }
      
      if (pontoCorte === -1) pontoCorte = maxLength;
      
      partes.push(textoRestante.substring(0, pontoCorte + 1).trim());
      textoRestante = textoRestante.substring(pontoCorte + 1).trim();
    }
    
    return partes;
  };

  const adicionarMensagem = (mensagem: Omit<Mensagem, 'timestamp'>) => {
    setMensagens(prev => [...prev, { ...mensagem, timestamp: new Date() }]);
  };
  
  const adicionarMensagemComAnimacao = async (mensagem: Omit<Mensagem, 'timestamp'>) => {
    const partes = dividirTextoLongo(mensagem.texto);
    
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) {
        await delay(800);
        setTyping(true);
        await delay(1000);
      }
      
      adicionarMensagem({
        ...mensagem,
        texto: partes[i]
      });
      
      if (i < partes.length - 1) {
        setTyping(false);
      }
    }
  };

  const iniciarAudiencia = async () => {
    if (!caso) {
      toast.error('Caso não carregado');
      return;
    }
    
    if (!caso.estrutura_audiencia?.turnos) {
      toast.error('Este caso precisa ser atualizado. Retornando...');
      await delay(2000);
      navigate('/simulacao-juridica');
      return;
    }
    
    setAudienciaIniciada(true);
    setTyping(true);
    await delay(2000);
    
    // SAUDAÇÃO DA JUÍZA
    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: `Bom dia. Sou a Juíza ${caso.nome_juiza || 'Ana Paula Costa'}. Daremos início à audiência referente ao caso: ${caso.titulo_caso}.`,
      nome: caso.nome_juiza || 'Juíza'
    });
    
    setTyping(false);
    await delay(1200);
    setTyping(true);
    await delay(1000);
    
    // APRESENTAÇÃO DO ADVOGADO DA RÉ
    await adicionarMensagemComAnimacao({
      tipo: 'advogado_reu',
      texto: `Presente, Excelência. ${caso.nome_advogado_reu || 'Dr. Carlos Santos'}, representando a parte contrária.`,
      nome: caso.nome_advogado_reu || 'Advogado da Defesa'
    });
    
    setTyping(false);
    await delay(1000);
    setTyping(true);
    await delay(1200);
    
    // CONTEXTO DO CASO
    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: caso.contexto_inicial || 'Vamos dar início à audiência.',
      nome: caso.nome_juiza || 'Juíza'
    });
    
    setTyping(false);
    await delay(1000);
    
    // INICIAR PRIMEIRO TURNO
    executarProximoTurno();
  };

  const executarProximoTurno = async () => {
    if (!caso?.estrutura_audiencia?.turnos) {
      console.error('Caso sem estrutura de audiência:', caso);
      toast.error('Este caso ainda não possui estrutura de audiência. Por favor, escolha outro caso.');
      await delay(2000);
      navigate('/simulacao-juridica');
      return;
    }
    
    const turnos = caso.estrutura_audiencia.turnos;
    if (turnoAtual >= turnos.length) {
      finalizarAudiencia();
      return;
    }

    const turno = turnos[turnoAtual];
    
    if (!turno) {
      console.error('Turno não encontrado:', turnoAtual, turnos);
      finalizarAudiencia();
      return;
    }
    
    setTyping(true);
    await delay(1000);

    switch (turno.tipo) {
      case 'juiza_pergunta':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: turno.texto || 'Advogado, como você responde?',
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(800);
        setMostrarOpcoes(true);
        break;

      case 'apresentacao_provas':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: turno.texto || 'Advogado, apresente suas provas.',
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(800);
        setMostrarOpcoes(true);
        break;

      case 'consideracoes_finais':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: turno.texto || 'Peço que ambas as partes façam suas considerações finais.',
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(1500);
        finalizarAudiencia();
        break;
        
      default:
        console.warn('Tipo de turno desconhecido:', turno.tipo);
        setTurnoAtual(prev => prev + 1);
        await delay(500);
        executarProximoTurno();
        break;
    }
  };

  const escolherResposta = async (resposta: any, turno: any) => {
    setMostrarOpcoes(false);
    
    // Adicionar resposta do jogador
    adicionarMensagem({
      tipo: 'advogado_jogador',
      texto: resposta.texto,
      nome: 'Você'
    });

    await delay(800);
    setTyping(true);
    await delay(1500);

    // Atualizar pontuação (pode ser positiva ou negativa)
    const novaPontuacao = pontuacao + resposta.pontos;
    setPontuacao(novaPontuacao);

    // Registrar escolha
    const novaEscolha = {
      turno: turnoAtual,
      texto: resposta.texto,
      pontos: resposta.pontos,
      forca: resposta.forca,
      artigos_citados: resposta.artigos_citados || []
    };
    setEscolhasRealizadas(prev => [...prev, novaEscolha]);

    // Advogado da ré refuta
    if (resposta.refutacao_adversario) {
      await adicionarMensagemComAnimacao({
        tipo: 'advogado_reu',
        texto: resposta.refutacao_adversario,
        nome: caso.nome_advogado_reu
      });
      
      setTyping(false);
      await delay(1000);
    }

    setTyping(false);
    
    // Salvar progresso
    await salvarProgresso(novaPontuacao, [...escolhasRealizadas, novaEscolha]);
    
    // Próximo turno
    setTurnoAtual(prev => prev + 1);
    await delay(800);
    executarProximoTurno();
  };

  const escolherProva = async (prova: any, turno: any) => {
    setMostrarOpcoes(false);
    
    adicionarMensagem({
      tipo: 'advogado_jogador',
      texto: `Apresento como prova: ${prova.nome}. ${prova.descricao}`,
      nome: 'Você'
    });

    const novaPontuacao = pontuacao + (prova.pontos || 0);
    setPontuacao(novaPontuacao);

    await delay(1200);
    setTyping(true);
    await delay(1000);

    // Juíza comenta a prova
    const comentarios = [
      'A prova foi juntada aos autos.',
      'Prova aceita.',
      'A prova será considerada.'
    ];
    adicionarMensagem({
      tipo: 'juiza',
      texto: comentarios[Math.floor(Math.random() * comentarios.length)],
      nome: caso.nome_juiza
    });

    setTyping(false);
    await salvarProgresso(novaPontuacao, escolhasRealizadas);
    
    setTurnoAtual(prev => prev + 1);
    await delay(1000);
    executarProximoTurno();
  };

  const salvarProgresso = async (novaPontuacao: number, escolhas: any[]) => {
    try {
      await supabase
        .from('SIMULACAO_PARTIDAS')
        .update({
          historico_mensagens: mensagens as any,
          pontuacao_final: novaPontuacao,
          argumentacoes_escolhidas: escolhas as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(id!));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const finalizarAudiencia = async () => {
    setTyping(true);
    await delay(2000);

    const pontuacaoFinal = pontuacao;
    const deferido = pontuacaoFinal >= 70;
    const deferimentoParcial = pontuacaoFinal >= 50 && pontuacaoFinal < 70;

    let resultado = deferido ? 'DEFERIDO' : (deferimentoParcial ? 'DEFERIMENTO PARCIAL' : 'INDEFERIDO');

    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: `Diante do exposto, decido: ${resultado}. ${caso.sentenca_esperada_merito || 'Sentença fundamentada nos autos.'}`,
      nome: caso.nome_juiza
    });

    setTyping(false);

    // Salvar resultado final
    await supabase
      .from('SIMULACAO_PARTIDAS')
      .update({
        pontuacao_final: pontuacaoFinal,
        deferido,
        sentenca_recebida: caso.sentenca_esperada_merito || 'Sentença padrão',
        acertos: caso.feedback_positivo || [],
        erros: caso.feedback_negativo || [],
        sugestoes_melhoria: caso.dicas || []
      })
      .eq('id', parseInt(id!));

    await delay(2000);
    navigate(`/simulacao-juridica/feedback/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  const turnoAtualData = caso?.estrutura_audiencia?.turnos?.[turnoAtual];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/simulacao-juridica")}
            className="text-gray-300 hover:text-white text-sm sm:text-base px-2 sm:px-4"
          >
            <ArrowLeft className="mr-1 sm:mr-2 w-4 h-4" />
            Sair
          </Button>
          
          <div className="flex items-center gap-2 text-amber-500">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-base">Audiência Virtual</span>
          </div>
        </div>

        {/* Card com informações do caso */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-sm sm:text-base line-clamp-2 leading-tight">{caso?.titulo_caso}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {caso?.area} • {caso?.tema}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso sobre Sistema de Pontuação */}
        {audienciaIniciada && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-3 sm:mb-4 animate-fade-in">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  <strong>Sistema de Pontuação:</strong> Cada escolha afeta sua pontuação. Respostas corretas ganham pontos, escolhas inadequadas podem descontar. Você precisa atingir a pontuação mínima para conseguir o deferimento do pedido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra de Pontuação */}
        <div className="mb-3 sm:mb-4">
          <PontuacaoBar pontuacao={pontuacao} pontuacaoMaxima={100} />
        </div>

        {/* Chat de Mensagens */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 p-2.5 sm:p-3 border-b border-amber-500/30">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              TRIBUNAL DE JUSTIÇA
            </h3>
          </div>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4 min-h-[250px] sm:min-h-[300px] max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {mensagens.length === 0 && !audienciaIniciada && (
                <div className="text-center py-12 text-gray-400">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Clique em "Iniciar Audiência" para começar</p>
                </div>
              )}
              
              {mensagens.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 animate-fade-in ${msg.tipo === 'advogado_jogador' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar à esquerda para juíza e advogado da ré */}
                  {msg.tipo !== 'advogado_jogador' && msg.tipo !== 'sistema' && (
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                      <AvatarImage 
                        src={msg.tipo === 'juiza' ? juizaAvatar : advogadoReuAvatar} 
                        className="object-cover"
                      />
                      <AvatarFallback className={`text-xs ${
                        msg.tipo === 'juiza' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {msg.tipo === 'juiza' ? 'J' : 'A'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] rounded-lg p-3 sm:p-4 animate-scale-in ${
                      msg.tipo === 'juiza'
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : msg.tipo === 'advogado_reu'
                        ? 'bg-red-500/20 border border-red-500/30'
                        : msg.tipo === 'advogado_jogador'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    {msg.nome && (
                      <p className="text-xs font-bold text-amber-500 mb-1">
                        {msg.nome}
                      </p>
                    )}
                    <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
                  </div>
                </div>
              ))}
              
              {typing && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Botão Iniciar */}
        {!audienciaIniciada && (
          <Button
            onClick={iniciarAudiencia}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 sm:py-6 text-sm sm:text-base animate-scale-in"
          >
            Iniciar Audiência
          </Button>
        )}

        {/* Opções de Resposta (SEM MOSTRAR PONTOS) */}
        {mostrarOpcoes && turnoAtualData && (
          <Card className="bg-gray-800/90 border-amber-500/30 animate-fade-in">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {turnoAtualData.tipo === 'juiza_pergunta' &&
                  turnoAtualData.respostas_possiveis?.map((resposta: any, index: number) => (
                    <Button
                      key={index}
                      onClick={() => escolherResposta(resposta, turnoAtualData)}
                      variant="outline"
                      className="w-full text-left h-auto py-3 sm:py-4 px-4 sm:px-6 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 transition-all justify-start animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-full">
                        <p className="text-white text-sm sm:text-base font-medium leading-relaxed">{resposta.texto}</p>
                      </div>
                    </Button>
                  ))}

                {turnoAtualData.tipo === 'apresentacao_provas' &&
                  turnoAtualData.provas?.map((prova: any, index: number) => (
                    <Button
                      key={index}
                      onClick={() => escolherProva(prova, turnoAtualData)}
                      variant="outline"
                      className="w-full text-left h-auto py-3 sm:py-4 px-4 sm:px-6 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 justify-start animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-full">
                        <p className="text-white text-sm sm:text-base font-semibold mb-1">{prova.nome}</p>
                        <p className="text-xs sm:text-sm text-gray-400">{prova.descricao}</p>
                      </div>
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SimulacaoAudienciaNew;
