import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Play, Sparkles, Clock, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ResumoDoDiaCardProps {
  tipo: 'politica' | 'juridica';
  dataAtiva?: Date;
}

export default function ResumoDoDiaCard({ tipo, dataAtiva }: ResumoDoDiaCardProps) {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState<{ total_noticias: number; data: string; url_audio_abertura?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  // Determinar se a data ativa é hoje
  const hoje = new Date();
  const dataParaBuscar = dataAtiva || hoje;
  const isHoje = isSameDay(dataParaBuscar, hoje);

  useEffect(() => {
    fetchResumo();
  }, [tipo, dataAtiva]);

  const fetchResumo = async () => {
    setLoading(true);
    try {
      // Ajustar para fuso de Brasília
      const dataAjustada = new Date(dataParaBuscar);
      dataAjustada.setHours(dataAjustada.getHours() - 3);
      const dataString = dataAjustada.toISOString().split('T')[0];

      const { data: result, error } = await supabase
        .from('resumos_diarios')
        .select('total_noticias, data, url_audio_abertura')
        .eq('tipo', tipo)
        .eq('data', dataString)
        .single();

      if (!error && result) {
        setResumo(result);
      } else {
        setResumo(null);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      setResumo(null);
    } finally {
      setLoading(false);
    }
  };

  const gerarResumoManual = async () => {
    if (gerando) return;
    
    setGerando(true);
    try {
      // Ajustar para fuso de Brasília
      const dataAjustada = new Date(dataParaBuscar);
      dataAjustada.setHours(dataAjustada.getHours() - 3);
      const dataString = dataAjustada.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('gerar-resumo-diario', {
        body: { tipo, data: dataString, forceRegenerate: true }
      });

      if (error) {
        console.error('Erro na função:', error);
        throw error;
      }

      if (data?.success) {
        toast.success("Resumo gerado com sucesso!");
        await fetchResumo();
      } else {
        const mensagem = data?.message || "Tente novamente mais tarde";
        const isNoNews = mensagem.toLowerCase().includes('nenhuma notícia');
        toast.error(isNoNews ? "Sem notícias para este dia" : "Erro ao gerar resumo", { 
          description: isNoNews 
            ? "Ainda não há notícias suficientes. Tente outro dia ou aguarde mais notícias." 
            : mensagem 
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      const isTimeout = error?.message?.includes('timeout') || error?.message?.includes('Failed to fetch');
      toast.error(isTimeout ? "Tempo limite excedido" : "Erro ao gerar resumo", { 
        description: isTimeout 
          ? "A geração demora alguns minutos. Tente novamente ou escolha outra data."
          : "Tente novamente mais tarde" 
      });
    } finally {
      setGerando(false);
    }
  };

  const handleClick = () => {
    if (isHoje && !resumo) {
      toast.info("O resumo de hoje será gerado às 22h", {
        description: "Volte mais tarde para ouvir as principais notícias do dia!"
      });
      return;
    }
    
    if (!resumo && !isHoje) {
      // Gerar resumo manualmente para dias passados
      gerarResumoManual();
      return;
    }
    
    if (resumo) {
      const dataParam = resumo.data;
      navigate(`/resumo-do-dia/${tipo}?data=${dataParam}`);
    }
  };

  // Se está carregando, mostrar skeleton
  if (loading) {
    return (
      <div className="w-full p-4 rounded-2xl border bg-muted/30 border-muted/40 flex items-center gap-4 animate-pulse">
        <div className="w-14 h-14 rounded-xl bg-muted/50" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-muted/50 rounded mb-2" />
          <div className="h-4 w-48 bg-muted/40 rounded" />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted/50" />
      </div>
    );
  }

  // Determinar estados visuais
  const isDisabled = isHoje && !resumo;
  const podeGerar = !isHoje && !resumo;
  const labelData = isHoje ? "de Hoje" : format(dataParaBuscar, "dd/MM", { locale: ptBR });

  return (
    <button
      onClick={handleClick}
      disabled={gerando}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all",
        "flex items-center gap-4 text-left group",
        isDisabled 
          ? "bg-muted/30 border-muted/40 opacity-60 cursor-default"
          : podeGerar
            ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40"
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/40"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform",
        isDisabled 
          ? "bg-muted/40" 
          : podeGerar
            ? "bg-amber-500/20 group-hover:scale-105"
            : "bg-primary/20 group-hover:scale-105"
      )}>
        {gerando ? (
          <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
        ) : isDisabled ? (
          <Clock className="w-7 h-7 text-muted-foreground" />
        ) : podeGerar ? (
          <RefreshCw className="w-7 h-7 text-amber-500" />
        ) : (
          <Mic className="w-7 h-7 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn(
            "font-semibold",
            isDisabled ? "text-muted-foreground" : "text-foreground"
          )}>
            Resumo {labelData}
          </h3>
          <Sparkles className={cn(
            "w-4 h-4",
            isDisabled ? "text-muted-foreground/50" : "text-amber-500"
          )} />
        </div>
        <p className="text-sm text-muted-foreground">
          {gerando 
            ? "Gerando resumo..."
            : isDisabled 
              ? "Será gerado às 22h" 
              : podeGerar
                ? "Clique para gerar resumo"
                : `${resumo?.total_noticias || 0} notícias ${tipo === 'politica' ? 'políticas' : 'jurídicas'} narradas`
          }
        </p>
      </div>

      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform",
        isDisabled 
          ? "bg-muted/40" 
          : podeGerar
            ? "bg-amber-500 group-hover:scale-110"
            : "bg-primary group-hover:scale-110"
      )}>
        {podeGerar ? (
          <RefreshCw className={cn(
            "w-5 h-5",
            gerando ? "animate-spin" : "",
            "text-white"
          )} />
        ) : (
          <Play className={cn(
            "w-5 h-5 ml-0.5",
            isDisabled ? "text-muted-foreground" : "text-primary-foreground"
          )} />
        )}
      </div>
    </button>
  );
}