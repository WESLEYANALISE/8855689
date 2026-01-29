import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
}

interface UseAutoNarracaoGenerationOptions {
  articles: Article[];
  isLoading: boolean;
  tableName: string;
  updateArticle?: (id: number, updates: Partial<Article>) => void;
  enabled?: boolean;
}

interface UseAutoNarracaoGenerationReturn {
  isGeneratingNarracoes: boolean;
  currentGeneratingArtigo: string | null;
  generatedNarracoesCount: number;
  totalNarracoesToGenerate: number;
  artigosComNarracao: Set<number>;
}

export const useAutoNarracaoGeneration = ({
  articles,
  isLoading,
  tableName,
  updateArticle,
  enabled = true
}: UseAutoNarracaoGenerationOptions): UseAutoNarracaoGenerationReturn => {
  const [isGeneratingNarracoes, setIsGeneratingNarracoes] = useState(false);
  const [currentGeneratingArtigo, setCurrentGeneratingArtigo] = useState<string | null>(null);
  const [generatedNarracoesCount, setGeneratedNarracoesCount] = useState(0);
  const [totalNarracoesToGenerate, setTotalNarracoesToGenerate] = useState(0);
  const [artigosComNarracao, setArtigosComNarracao] = useState<Set<number>>(new Set());
  const narracaoGenerationStartedRef = useRef(false);
  const initialCheckDoneRef = useRef(false);
  const lastTableNameRef = useRef<string>("");

  // Reset quando tableName muda
  useEffect(() => {
    if (tableName !== lastTableNameRef.current) {
      lastTableNameRef.current = tableName;
      narracaoGenerationStartedRef.current = false;
      initialCheckDoneRef.current = false;
      setArtigosComNarracao(new Set());
      setIsGeneratingNarracoes(false);
      setCurrentGeneratingArtigo(null);
      setGeneratedNarracoesCount(0);
      setTotalNarracoesToGenerate(0);
    }
  }, [tableName]);

  // Inicializar set de artigos com narração - APENAS UMA VEZ
  useEffect(() => {
    // Só faz a verificação inicial se ainda não foi feita E se tem artigos
    if (initialCheckDoneRef.current || articles.length === 0) return;
    
    const withNarration = new Set<number>();
    articles.forEach(art => {
      if (art["Narração"] && art["Narração"].trim() !== "") {
        withNarration.add(art.id);
      }
    });
    
    setArtigosComNarracao(withNarration);
    initialCheckDoneRef.current = true;
    
    console.log(`[useAutoNarracaoGeneration] ✅ Verificação inicial: ${withNarration.size}/${articles.length} já têm narração`);
  }, [articles]);

  // Função para gerar narração de um artigo com retry automático
  const generateNarracaoForArtigo = useCallback(async (article: Article, maxRetries = 3): Promise<boolean> => {
    const numeroArtigo = article["Número do Artigo"];
    if (!numeroArtigo || !article["Artigo"]) return false;

    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        setCurrentGeneratingArtigo(`${numeroArtigo}${attempt > 1 ? ` (tentativa ${attempt})` : ''}`);
        
        const { data, error } = await supabase.functions.invoke('gerar-narracao-vademecum', {
          body: {
            tableName,
            numeroArtigo,
            textoArtigo: article["Artigo"],
            articleId: article.id,
          }
        });

        if (error) {
          console.error(`Erro ao gerar narração para Art. ${numeroArtigo} (tentativa ${attempt}/${maxRetries}):`, error);
          
          if (attempt < maxRetries) {
            console.log(`⏳ Aguardando 8s antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
            continue;
          }
          return false;
        }

        if (data?.success) {
          setArtigosComNarracao(prev => new Set([...prev, article.id]));
          // Atualizar artigo no array e sincronizar com cache IndexedDB
          if (data.audioUrl && updateArticle) {
            updateArticle(article.id, { "Narração": data.audioUrl } as Partial<Article>);
          }
          setGeneratedNarracoesCount(prev => prev + 1);
          console.log(`✅ Narração gerada para Art. ${numeroArtigo}`);
          return true;
        }

        // Se não teve sucesso mas também não teve erro, tentar novamente
        if (attempt < maxRetries) {
          console.log(`⚠️ Art. ${numeroArtigo} não gerou sucesso, tentando novamente...`);
          await new Promise(resolve => setTimeout(resolve, 8000));
          continue;
        }
        
        return false;
      } catch (err) {
        console.error(`Erro ao gerar narração para Art. ${numeroArtigo} (tentativa ${attempt}/${maxRetries}):`, err);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Aguardando 8s antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, 8000));
          continue;
        }
        return false;
      }
    }
    
    return false;
  }, [tableName, updateArticle]);

  // Iniciar geração automática de narrações - APENAS SE VERIFICAÇÃO INICIAL FOI FEITA
  useEffect(() => {
    // Aguardar verificação inicial ser concluída
    if (!initialCheckDoneRef.current) return;
    if (!enabled || isLoading || narracaoGenerationStartedRef.current || articles.length === 0) return;

    // Filtrar artigos que têm número e não têm narração
    const artigosFaltando = articles
      .filter(a => 
        a["Número do Artigo"] && 
        a["Número do Artigo"].trim() !== "" &&
        a["Artigo"] &&
        !artigosComNarracao.has(a.id)
      )
      .sort((a, b) => {
        const numA = parseInt((a["Número do Artigo"] || "0").replace(/\D/g, '')) || 0;
        const numB = parseInt((b["Número do Artigo"] || "0").replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    if (artigosFaltando.length === 0) {
      console.log(`[useAutoNarracaoGeneration] ✅ Todos os ${articles.length} artigos já têm narração - nada a fazer`);
      return;
    }

    // Marcar como iniciado ANTES de começar
    narracaoGenerationStartedRef.current = true;
    console.log(`[useAutoNarracaoGeneration] 🎙️ Iniciando geração de ${artigosFaltando.length} narrações para ${tableName}`);
    setIsGeneratingNarracoes(true);
    setTotalNarracoesToGenerate(artigosFaltando.length);
    setGeneratedNarracoesCount(0);

    const generateAll = async () => {
      for (const artigo of artigosFaltando) {
        await generateNarracaoForArtigo(artigo);
        // Pausa de 6 segundos entre requisições (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
      
      setIsGeneratingNarracoes(false);
      setCurrentGeneratingArtigo(null);
      toast.success(`Narrações concluídas! ${artigosFaltando.length} artigos processados.`);
    };

    generateAll();
  }, [enabled, isLoading, articles, artigosComNarracao, tableName, generateNarracaoForArtigo]);

  return {
    isGeneratingNarracoes,
    currentGeneratingArtigo,
    generatedNarracoesCount,
    totalNarracoesToGenerate,
    artigosComNarracao
  };
};
