import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle2, PlayCircle, StopCircle, Volume2, Image as ImageIcon, AlertCircle, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTableFromCodigo } from "@/lib/codigoMappings";
import { toast } from "sonner";
import { imageQueue, useImageQueue } from "@/lib/imageQueue";
import { audioQueue, useAudioQueue } from "@/lib/audioQueue";

interface Artigo {
  id: number;
  "Número do Artigo": string | null;
  Artigo: string | null;
}

type FaseAtual = 'idle' | 'texto' | 'imagens' | 'audios' | 'concluido';

interface ProgressoFase {
  processados: number;
  total: number;
  atual?: string;
}

const QuestoesArtigosLeiGerar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo") || "cf";

  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [artigosComTexto, setArtigosComTexto] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado das 3 fases
  const [faseAtual, setFaseAtual] = useState<FaseAtual>('idle');
  const [progressoTexto, setProgressoTexto] = useState<ProgressoFase>({ processados: 0, total: 0 });
  const [progressoImagens, setProgressoImagens] = useState<ProgressoFase>({ processados: 0, total: 0 });
  const [progressoAudios, setProgressoAudios] = useState<ProgressoFase>({ processados: 0, total: 0 });
  
  const [logs, setLogs] = useState<string[]>([]);

  const abortRef = useRef(false);
  const tableName = getTableFromCodigo(codigo);
  const displayName = tableName.split(" - ")[0] || tableName;

  // Callback para log de imagem processada individualmente
  const handleImageProcessed = useCallback((item: any, success: boolean, error?: string) => {
    if (item.area === tableName) {
      if (success) {
        addLog(`🖼️ ✅ Imagem gerada: Art. ${item.tema} - Questão #${item.questaoId}`);
      } else {
        addLog(`🖼️ ❌ Erro imagem: Art. ${item.tema} - ${error || 'Erro desconhecido'}`);
      }
    }
  }, [tableName]);

  // Callback para log de áudio processado individualmente
  const handleAudioProcessed = useCallback((item: any, success: boolean, error?: string) => {
    if (item.area === tableName) {
      const tipoLabel = item.tipo === 'enunciado' ? 'Enunciado' : 
                        item.tipo === 'comentario' ? 'Comentário' : 'Exemplo';
      if (success) {
        addLog(`🔊 ✅ ${tipoLabel} gerado: Questão #${item.questaoId}`);
      } else {
        addLog(`🔊 ❌ Erro ${tipoLabel.toLowerCase()}: Questão #${item.questaoId} - ${error || 'Erro desconhecido'}`);
      }
    }
  }, [tableName]);

  // Hooks para monitorar status das filas em tempo real COM eventos individuais
  const imageQueueStatus = useImageQueue(handleImageProcessed);
  const audioQueueStatus = useAudioQueue(handleAudioProcessed);

  // Extrair número do artigo
  const extractArtigoNumber = (artigo: string | null): string => {
    if (!artigo) return "";
    const match = artigo.match(/Art\.?\s*(\d+[\w°-]*)/i);
    return match ? match[1] : artigo;
  };

  // Limpar logs e detectar filas ao montar/mudar de área
  useEffect(() => {
    // Limpar logs ao trocar de área
    setLogs([]);
    
    const imageStatus = imageQueue.getStatus();
    const audioStatus = audioQueue.getStatus();
    
    if (imageStatus.isProcessing || audioStatus.isProcessing || imageStatus.queueLength > 0 || audioStatus.queueLength > 0) {
      setIsProcessing(true);
      setFaseAtual('texto');
      addLog(`📍 Monitorando área: ${displayName}`);
      addLog(`🔄 Filas globais ativas: ${imageStatus.queueLength} imagens, ${audioStatus.queueLength} áudios`);
    }
  }, [tableName, displayName]);

  // Atualizar estado de processamento baseado nas filas
  useEffect(() => {
    if (imageQueueStatus.isProcessing || imageQueueStatus.queueLength > 0) {
      setIsProcessing(true);
      setFaseAtual('texto');
    }
    if (audioQueueStatus.isProcessing || audioQueueStatus.queueLength > 0) {
      setIsProcessing(true);
      setFaseAtual('texto');
    }
  }, [imageQueueStatus.isProcessing, imageQueueStatus.queueLength, audioQueueStatus.isProcessing, audioQueueStatus.queueLength]);

  // Buscar artigos e verificar status
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar artigos
        const { data: artigosData, error: artigosError } = await supabase
          .from(tableName as any)
          .select('id, "Número do Artigo", Artigo')
          .not("Número do Artigo", "is", null)
          .order("id", { ascending: true });

        if (artigosError) throw artigosError;
        setArtigos((artigosData as unknown as Artigo[]) || []);

        // Buscar TODAS as questões com paginação
        let allQuestoes: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from("QUESTOES_ARTIGOS_LEI")
            .select("artigo, id, url_audio_enunciado, url_audio_comentario, url_audio_exemplo, url_imagem_exemplo, comentario, exemplo_pratico")
            .eq("area", tableName)
            .range(offset, offset + pageSize - 1);

          if (error) break;
          if (!data || data.length === 0) break;
          allQuestoes = [...allQuestoes, ...data];
          if (data.length < pageSize) break;
          offset += pageSize;
        }

        if (allQuestoes.length > 0) {
          const artigosComQuestoes = new Set(allQuestoes.map(q => q.artigo));
          setArtigosComTexto(artigosComQuestoes);
          
          // Contar total de cada tipo
          let totalImagens = 0;
          let imagensCompletas = 0;
          let totalAudios = 0;
          let audiosCompletos = 0;
          
          allQuestoes.forEach(q => {
            // Imagens
            if (q.exemplo_pratico) {
              totalImagens++;
              if (q.url_imagem_exemplo) imagensCompletas++;
            }
            // Áudios
            totalAudios++; // enunciado sempre existe
            if (q.url_audio_enunciado) audiosCompletos++;
            if (q.comentario) {
              totalAudios++;
              if (q.url_audio_comentario) audiosCompletos++;
            }
            if (q.exemplo_pratico) {
              totalAudios++;
              if (q.url_audio_exemplo) audiosCompletos++;
            }
          });

          setProgressoTexto({ 
            processados: artigosComQuestoes.size, 
            total: (artigosData as unknown as Artigo[])?.length || 0 
          });
          setProgressoImagens({ processados: imagensCompletas, total: totalImagens });
          setProgressoAudios({ processados: audiosCompletos, total: totalAudios });
        } else {
          setProgressoTexto({ 
            processados: 0, 
            total: (artigosData as unknown as Artigo[])?.length || 0 
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar artigos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  // Polling para atualizar progresso real do banco a cada 5 segundos quando em processamento
  useEffect(() => {
    if (!isProcessing) return;
    
    const updateProgressFromDb = async () => {
      try {
        // Buscar TODAS as questões com paginação
        let allQuestoes: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from("QUESTOES_ARTIGOS_LEI")
            .select("artigo, url_audio_enunciado, url_audio_comentario, url_audio_exemplo, url_imagem_exemplo, comentario, exemplo_pratico")
            .eq("area", tableName)
            .range(offset, offset + pageSize - 1);

          if (error) break;
          if (!data || data.length === 0) break;
          allQuestoes = [...allQuestoes, ...data];
          if (data.length < pageSize) break;
          offset += pageSize;
        }

        if (allQuestoes.length > 0) {
          const artigosUnicos = new Set(allQuestoes.map(q => q.artigo));
          
          let totalImagens = 0;
          let imagensCompletas = 0;
          let totalAudios = 0;
          let audiosCompletos = 0;
          
          allQuestoes.forEach(q => {
            if (q.exemplo_pratico) {
              totalImagens++;
              if (q.url_imagem_exemplo) imagensCompletas++;
            }
            totalAudios++;
            if (q.url_audio_enunciado) audiosCompletos++;
            if (q.comentario) {
              totalAudios++;
              if (q.url_audio_comentario) audiosCompletos++;
            }
            if (q.exemplo_pratico) {
              totalAudios++;
              if (q.url_audio_exemplo) audiosCompletos++;
            }
          });

          setProgressoTexto(prev => ({ ...prev, processados: artigosUnicos.size }));
          setProgressoImagens({ processados: imagensCompletas, total: totalImagens });
          setProgressoAudios({ processados: audiosCompletos, total: totalAudios });
        }
      } catch (error) {
        console.error("Erro ao atualizar progresso:", error);
      }
    };

    const interval = setInterval(updateProgressFromDb, 5000);
    return () => clearInterval(interval);
  }, [isProcessing, tableName]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev.slice(0, 99)]);
  }, []);

  // Mínimo de questões garantido - a IA decide o total real
  const MINIMO_QUESTOES = 15;

  // ===== FASE 1: GERAR TODOS OS TEXTOS (um artigo por vez) =====
  const processarFase1Texto = async () => {
    setFaseAtual('texto');
    addLog("📝 FASE 1: Iniciando geração de textos...");

    // Filtrar artigos que ainda não têm questões
    const artigosPendentes = artigos.filter(a => {
      const numero = extractArtigoNumber(a["Número do Artigo"]);
      return !artigosComTexto.has(numero);
    });

    if (artigosPendentes.length === 0) {
      addLog("✅ FASE 1: Todos os artigos já possuem questões");
      return;
    }

    const totalArtigosProcessar = artigosPendentes.length;
    addLog(`📦 ${totalArtigosProcessar} artigos pendentes para processar`);
    setProgressoTexto(prev => ({ ...prev, total: artigos.length }));

    let artigosProcessados = artigosComTexto.size;

    // Processar UM ARTIGO por vez
    for (let i = 0; i < artigosPendentes.length; i++) {
      if (abortRef.current) break;

      const artigo = artigosPendentes[i];
      const numeroArtigo = extractArtigoNumber(artigo["Número do Artigo"]);

      setProgressoTexto(prev => ({ 
        ...prev, 
        atual: `Art. ${numeroArtigo} (IA decidindo quantidade)` 
      }));
      addLog(`📝 Art. ${numeroArtigo}: Gerando questões (IA decide quantidade)...`);

      try {
        // Chamar edge function para ESTE ARTIGO apenas
        const { data, error } = await supabase.functions.invoke("gerar-questoes-artigo", {
          body: {
            content: artigo.Artigo || '',
            numeroArtigo,
            area: tableName,
          },
        });

        if (error) throw error;

        // Se veio do cache
        if (data?.status === "cached") {
          addLog(`✅ Art. ${numeroArtigo}: Cache`);
          setArtigosComTexto(prev => new Set([...prev, numeroArtigo]));
          artigosProcessados++;
          setProgressoTexto(prev => ({ ...prev, processados: artigosProcessados }));
          continue;
        }

        // Polling: aguardar questões serem geradas (IA decide quantidade)
        let ultimoCount = 0;
        let tentativasSemProgresso = 0;
        const maxTentativasSemProgresso = 90; // 3 minutos (maior para dar tempo à IA criar mais questões)

        while (!abortRef.current) {
          await delay(2000);

          const { count } = await supabase
            .from("QUESTOES_ARTIGOS_LEI")
            .select("id", { count: "exact", head: true })
            .eq("area", tableName)
            .eq("artigo", numeroArtigo);

          const currentCount = count || 0;

          if (currentCount > ultimoCount) {
            tentativasSemProgresso = 0;
            ultimoCount = currentCount;
            setProgressoTexto(prev => ({ 
              ...prev, 
              atual: `Art. ${numeroArtigo} (${currentCount} questões geradas)` 
            }));
          } else {
            tentativasSemProgresso++;
          }

          // Completou: parou de crescer por 10 segundos E tem pelo menos o mínimo
          if (tentativasSemProgresso >= 5 && currentCount >= MINIMO_QUESTOES) {
            addLog(`✅ Art. ${numeroArtigo}: ${currentCount} questões (IA decidiu)`);
            setArtigosComTexto(prev => new Set([...prev, numeroArtigo]));
            artigosProcessados++;
            setProgressoTexto(prev => ({ ...prev, processados: artigosProcessados }));
            break;
          }

          // Timeout (3 minutos sem progresso)
          if (tentativasSemProgresso >= maxTentativasSemProgresso) {
            addLog(`⚠️ Art. ${numeroArtigo}: Timeout (${currentCount} questões)`);
            if (currentCount > 0) {
              setArtigosComTexto(prev => new Set([...prev, numeroArtigo]));
              artigosProcessados++;
              setProgressoTexto(prev => ({ ...prev, processados: artigosProcessados }));
            }
            break;
          }
        }

        // Delay curto entre artigos
        await delay(500);

      } catch (error) {
        console.error(`Erro Art. ${numeroArtigo}:`, error);
        addLog(`❌ Art. ${numeroArtigo}: Erro - ${error}`);
        await delay(2000);
      }
    }

    addLog("✅ FASE 1 concluída: Todos os textos gerados");
  };

  // ===== FASE 2: GERAR TODAS AS IMAGENS =====
  const processarFase2Imagens = async () => {
    addLog("🖼️ FASE 2: Verificando imagens pendentes...");

    // Buscar TODAS as questões com paginação (sem limite de 1000)
    let questoesSemImagem: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("id, exemplo_pratico, artigo, url_imagem_exemplo")
        .eq("area", tableName)
        .not("exemplo_pratico", "is", null)
        .order("artigo", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        addLog("❌ Erro ao buscar questões para imagens");
        return;
      }
      
      if (!data || data.length === 0) break;
      questoesSemImagem = [...questoesSemImagem, ...data];
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Filtrar apenas as que REALMENTE não têm imagem
    const imagensPendentes = questoesSemImagem.filter(q => !q.url_imagem_exemplo);
    
    const total = imagensPendentes.length;
    const jaProcessadas = questoesSemImagem.length - total;
    
    setProgressoImagens({ processados: jaProcessadas, total: questoesSemImagem.length, atual: '' });
    
    if (total === 0) {
      addLog("✅ FASE 2: Todas as imagens já existem");
      return;
    }
    
    addLog(`🖼️ ${total} imagens para gerar (${jaProcessadas} já existem)`);

    let processadas = jaProcessadas;

    for (const questao of imagensPendentes) {
      if (abortRef.current) break;

      setProgressoImagens(prev => ({ ...prev, atual: `Art. ${questao.artigo}` }));

      // Adicionar à fila de imagens
      imageQueue.addToQueue({
        id: `questao-${questao.id}-${Date.now()}`,
        questaoId: questao.id,
        exemploTexto: questao.exemplo_pratico,
        area: tableName,
        tema: `Art. ${questao.artigo}`,
        tabela: "QUESTOES_ARTIGOS_LEI",
        priority: questao.id,
        onSuccess: () => {
          processadas++;
          setProgressoImagens(prev => ({ ...prev, processados: processadas }));
          addLog(`✅ Imagem ${processadas}/${questoesSemImagem.length} (Art. ${questao.artigo})`);
        },
        onError: (err) => {
          processadas++;
          setProgressoImagens(prev => ({ ...prev, processados: processadas }));
          addLog(`❌ Imagem falhou (Art. ${questao.artigo}): ${err}`);
        },
      });
    }

    // Aguardar todas as imagens serem processadas
    while (processadas < questoesSemImagem.length && !abortRef.current) {
      await delay(2000);
    }

    addLog("✅ FASE 2 concluída: Todas as imagens processadas");
  };

  // ===== FASE 3: GERAR TODOS OS ÁUDIOS (com fila paralela) =====
  const processarFase3Audios = async () => {
    addLog("🔊 FASE 3: Verificando áudios pendentes...");

    // Buscar TODAS as questões com paginação (sem limite de 1000)
    let todasQuestoes: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("id, enunciado, comentario, exemplo_pratico, artigo, url_audio_enunciado, url_audio_comentario, url_audio_exemplo")
        .eq("area", tableName)
        .order("artigo", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        addLog("❌ Erro ao buscar questões para áudios");
        return;
      }
      
      if (!data || data.length === 0) break;
      todasQuestoes = [...todasQuestoes, ...data];
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    if (todasQuestoes.length === 0) {
      addLog("❌ Nenhuma questão encontrada para áudios");
      return;
    }

    // Calcular total possível e quantos já existem
    let totalPossivel = 0;
    let jaExistem = 0;
    let audiosPendentes: typeof todasQuestoes = [];

    todasQuestoes.forEach(q => {
      // Enunciado sempre existe
      totalPossivel++;
      if (q.url_audio_enunciado) jaExistem++;
      
      // Comentário se existir texto
      if (q.comentario) {
        totalPossivel++;
        if (q.url_audio_comentario) jaExistem++;
      }
      
      // Exemplo se existir texto
      if (q.exemplo_pratico) {
        totalPossivel++;
        if (q.url_audio_exemplo) jaExistem++;
      }
      
      // Adicionar à lista de pendentes se faltar algum áudio
      if (!q.url_audio_enunciado || (!q.url_audio_comentario && q.comentario) || (!q.url_audio_exemplo && q.exemplo_pratico)) {
        audiosPendentes.push(q);
      }
    });

    const audiosFaltando = totalPossivel - jaExistem;
    
    setProgressoAudios({ processados: jaExistem, total: totalPossivel, atual: '' });
    
    if (audiosFaltando === 0) {
      addLog("✅ FASE 3: Todos os áudios já existem");
      return;
    }
    
    addLog(`🔊 ${audiosFaltando} áudios para gerar (${jaExistem} já existem)`);

    let processados = jaExistem;
    audioQueue.resetProcessedCount();

    // Adicionar todos os áudios à fila
    for (const questao of audiosPendentes) {
      if (abortRef.current) break;

      // Áudio do enunciado
      if (!questao.url_audio_enunciado) {
        audioQueue.addToQueue({
          id: `enunciado-${questao.id}-${Date.now()}`,
          questaoId: questao.id,
          tipo: 'enunciado',
          texto: questao.enunciado,
          tabela: "QUESTOES_ARTIGOS_LEI",
          area: tableName, // Usado para priorização automática
          onSuccess: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados, atual: `Art. ${questao.artigo} - enunciado` }));
            addLog(`✅ Áudio ${processados}/${totalPossivel} (Art. ${questao.artigo} - enunciado)`);
          },
          onError: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados }));
            addLog(`❌ Áudio falhou (Art. ${questao.artigo} - enunciado)`);
          },
        });
      }

      // Áudio do comentário
      if (!questao.url_audio_comentario && questao.comentario) {
        audioQueue.addToQueue({
          id: `comentario-${questao.id}-${Date.now()}`,
          questaoId: questao.id,
          tipo: 'comentario',
          texto: `Explicação. ${questao.comentario}`,
          tabela: "QUESTOES_ARTIGOS_LEI",
          area: tableName, // Usado para priorização automática
          onSuccess: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados, atual: `Art. ${questao.artigo} - explicação` }));
            addLog(`✅ Áudio ${processados}/${totalPossivel} (Art. ${questao.artigo} - explicação)`);
          },
          onError: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados }));
            addLog(`❌ Áudio falhou (Art. ${questao.artigo} - explicação)`);
          },
        });
      }

      // Áudio do exemplo
      if (!questao.url_audio_exemplo && questao.exemplo_pratico) {
        audioQueue.addToQueue({
          id: `exemplo-${questao.id}-${Date.now()}`,
          questaoId: questao.id,
          tipo: 'exemplo',
          texto: `Exemplo prático. ${questao.exemplo_pratico}`,
          tabela: "QUESTOES_ARTIGOS_LEI",
          area: tableName, // Usado para priorização automática
          onSuccess: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados, atual: `Art. ${questao.artigo} - exemplo` }));
            addLog(`✅ Áudio ${processados}/${totalPossivel} (Art. ${questao.artigo} - exemplo)`);
          },
          onError: () => {
            processados++;
            setProgressoAudios(prev => ({ ...prev, processados }));
            addLog(`❌ Áudio falhou (Art. ${questao.artigo} - exemplo)`);
          },
        });
      }
    }

    // Aguardar todos os áudios serem processados
    while (processados < totalPossivel && !abortRef.current) {
      await delay(2000);
    }

    addLog("✅ FASE 3 concluída: Todos os áudios processados");
  };

  // ===== FLUXO PRINCIPAL: FASES 1 E 2 (ÁUDIOS PAUSADOS) =====
  const iniciarProcessamento = async () => {
    setIsProcessing(true);
    abortRef.current = false;
    setLogs([]);

    addLog("🚀 Iniciando 2 FASES EM PARALELO...");
    addLog("📝 Fase 1: Gerando textos | 🖼️ Fase 2: Gerando imagens | ⏸️ Fase 3: PAUSADA");
    setFaseAtual('texto'); // Indica processamento ativo

    // Executar apenas Fases 1 e 2 (áudios pausados)
    await Promise.all([
      processarFase1Texto(),
      processarFase2Imagens(),
      // processarFase3Audios() - PAUSADO
    ]);
    
    setFaseAtual('concluido');
    setIsProcessing(false);
    
    if (!abortRef.current) {
      toast.success("🎉 Fases 1 e 2 concluídas! (Áudios pausados)");
      addLog("🎉 PROCESSAMENTO COMPLETO! (Áudios pausados)");
    }
  };

  const pararProcessamento = () => {
    abortRef.current = true;
    setIsProcessing(false);
    addLog("⏹️ Processamento interrompido pelo usuário");
    toast.info("Processamento interrompido");
  };

  const getFaseStatus = (fase: 'texto' | 'imagens' | 'audios') => {
    // Fase 3 (áudios) sempre pausada
    if (fase === 'audios') return 'paused';
    
    if (faseAtual === 'concluido') return 'done';
    if (faseAtual === 'idle') return 'pending';
    // Fases 1 e 2 ficam ativas durante o processamento
    return 'active';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando artigos...</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => {
          if (isProcessing) {
            toast.info("A geração continua em segundo plano! Você pode voltar depois para acompanhar.", { duration: 4000 });
          }
          navigate(-1);
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Gerar Questões</h1>
          <p className="text-sm text-muted-foreground">{displayName}</p>
        </div>
      </div>

      {/* Indicador de 3 Fases */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {/* Fase 1: Texto */}
        <Card className={`transition-all ${
          getFaseStatus('texto') === 'active' ? 'ring-2 ring-primary bg-primary/10' : 
          getFaseStatus('texto') === 'done' ? 'bg-green-500/10' : 'bg-muted/50'
        }`}>
          <CardContent className="p-3 text-center">
            <Type className={`w-5 h-5 mx-auto mb-1 ${
              getFaseStatus('texto') === 'active' ? 'text-primary' : 
              getFaseStatus('texto') === 'done' ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <p className="text-xs font-medium mb-1">Fase 1</p>
            <p className="text-[10px] text-muted-foreground">Textos</p>
            <p className="text-sm font-bold mt-1">
              {progressoTexto.processados}/{progressoTexto.total}
            </p>
            {progressoTexto.atual && getFaseStatus('texto') === 'active' && (
              <p className="text-[10px] text-primary truncate">{progressoTexto.atual}</p>
            )}
          </CardContent>
        </Card>

        {/* Fase 2: Imagens */}
        <Card className={`transition-all ${
          getFaseStatus('imagens') === 'active' ? 'ring-2 ring-primary bg-primary/10' : 
          getFaseStatus('imagens') === 'done' ? 'bg-green-500/10' : 'bg-muted/50'
        }`}>
          <CardContent className="p-3 text-center">
            <ImageIcon className={`w-5 h-5 mx-auto mb-1 ${
              getFaseStatus('imagens') === 'active' ? 'text-primary' : 
              getFaseStatus('imagens') === 'done' ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <p className="text-xs font-medium mb-1">Fase 2</p>
            <p className="text-[10px] text-muted-foreground">Imagens</p>
            <p className="text-sm font-bold mt-1">
              {progressoImagens.processados}/{progressoImagens.total}
            </p>
            {progressoImagens.atual && getFaseStatus('imagens') === 'active' && (
              <p className="text-[10px] text-primary truncate">{progressoImagens.atual}</p>
            )}
          </CardContent>
        </Card>

        {/* Fase 3: Áudios - PAUSADA */}
        <Card className="transition-all bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-center">
            <Volume2 className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xs font-medium mb-1">Fase 3</p>
            <p className="text-[10px] text-amber-600 font-medium">⏸️ PAUSADA</p>
            <p className="text-sm font-bold mt-1 text-muted-foreground">
              {progressoAudios.processados}/{progressoAudios.total}
            </p>
            <p className="text-[10px] text-amber-600">Áudios desativados</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso Geral */}
      {faseAtual !== 'idle' && (
        <Card className="mb-6">
          <CardContent className="p-4">
            {faseAtual === 'texto' && (
              <Progress value={(progressoTexto.processados / Math.max(progressoTexto.total, 1)) * 100} className="h-2" />
            )}
            {faseAtual === 'imagens' && (
              <Progress value={(progressoImagens.processados / Math.max(progressoImagens.total, 1)) * 100} className="h-2" />
            )}
            {faseAtual === 'audios' && (
              <Progress value={(progressoAudios.processados / Math.max(progressoAudios.total, 1)) * 100} className="h-2" />
            )}
            {faseAtual === 'concluido' && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Todas as fases concluídas!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões de Controle */}
      <div className="flex gap-2 mb-6">
        {!isProcessing ? (
          <Button 
            className="flex-1" 
            onClick={iniciarProcessamento}
            disabled={artigos.length === 0}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Iniciar 3 Fases
          </Button>
        ) : (
          <Button 
            variant="destructive" 
            className="flex-1" 
            onClick={pararProcessamento}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Parar
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Processamento em 3 Fases:
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Type className="w-3 h-3" />
              <strong>Fase 1:</strong> Gerar todas as questões em texto
            </li>
            <li className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3" />
              <strong>Fase 2:</strong> Gerar todas as imagens
            </li>
            <li className="flex items-center gap-2">
              <Volume2 className="w-3 h-3" />
              <strong>Fase 3:</strong> Gerar todos os áudios
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Log de Processamento</h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto font-mono text-xs">
              {logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`py-0.5 ${
                    log.startsWith('✅') ? 'text-green-600' : 
                    log.startsWith('❌') ? 'text-destructive' :
                    log.startsWith('🚀') || log.startsWith('🎉') ? 'text-primary font-bold' :
                    'text-muted-foreground'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestoesArtigosLeiGerar;
