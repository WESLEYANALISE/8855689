import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { JuristaArtigoCompleto } from "@/components/JuristaArtigoCompleto";
import { FloatingProfessoraButton } from "@/components/FloatingProfessoraButton";
import { ProfessoraChatModal } from "@/components/ProfessoraChatModal";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
interface HistoriaData {
  periodo: string;
  titulo?: string;
  ano_inicio?: number;
  ano_fim?: number;
  conteudo_melhorado: any;
  imagens: string[];
  marcos_importantes: any[];
}
const MeuBrasilHistoriaView = () => {
  const {
    periodo
  } = useParams<{
    periodo: string;
  }>();
  const navigate = useNavigate();
  const [historia, setHistoria] = useState<HistoriaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Carregando artigo...");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const periodoDecodificado = periodo ? decodeURIComponent(periodo) : "";
  useEffect(() => {
    if (periodoDecodificado) {
      carregarHistoria();
    }
  }, [periodoDecodificado]);
  const carregarHistoria = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Verificando cache...");

      // 1. Verificar se já existe na tabela meu_brasil_historia
      const {
        data: cached,
        error: cacheError
      } = await supabase.from('meu_brasil_historia').select('*').eq('periodo', periodoDecodificado).single();
      if (cached && cached.conteudo_melhorado) {
        console.log('✅ História encontrada no cache');
        setHistoria({
          periodo: cached.periodo,
          titulo: cached.titulo,
          ano_inicio: cached.ano_inicio,
          ano_fim: cached.ano_fim,
          conteudo_melhorado: cached.conteudo_melhorado,
          imagens: cached.imagens as string[] || [],
          marcos_importantes: cached.marcos_importantes as any[] || []
        });
        setLoading(false);
        return;
      }

      // 2. Se não existe, buscar da Wikipedia
      console.log('📡 Buscando informações...');
      setLoadingMessage("Preparando conteúdo...");
      const {
        data: wikiData,
        error: wikiError
      } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
        body: {
          action: 'article',
          titulo: periodoDecodificado,
          categoria: 'historia'
        }
      });
      if (wikiError) throw wikiError;

      // 3. Enriquecer com Gemini
      console.log('🤖 Enriquecendo com IA...');
      setLoadingMessage("Enriquecendo com IA educacional...");
      const {
        data: enrichData,
        error: enrichError
      } = await supabase.functions.invoke('enriquecer-conteudo-meu-brasil', {
        body: {
          tipo: 'historia',
          nome: periodoDecodificado,
          conteudo_original: wikiData,
          contexto: `História jurídica do Brasil`
        }
      });
      if (enrichError) throw enrichError;

      // 4. Salvar na tabela para cache futuro
      console.log('💾 Salvando no cache...');
      setLoadingMessage("Salvando...");
      const {
        error: saveError
      } = await supabase.from('meu_brasil_historia').upsert({
        periodo: periodoDecodificado,
        titulo: periodoDecodificado,
        conteudo_original: wikiData,
        conteudo_melhorado: enrichData.conteudo_melhorado,
        imagens: wikiData.imagens || [],
        marcos_importantes: []
      });
      if (saveError) {
        console.error('Erro ao salvar:', saveError);
      }

      // 5. Exibir
      setHistoria({
        periodo: periodoDecodificado,
        titulo: periodoDecodificado,
        conteudo_melhorado: enrichData.conteudo_melhorado,
        imagens: wikiData.imagens || [],
        marcos_importantes: []
      });
      toast.success('Artigo gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao carregar história:', error);
      toast.error(error.message || 'Erro ao carregar artigo histórico');

      // Fallback: tentar carregar só da Wikipedia sem enriquecimento
      try {
        setLoadingMessage("Carregando versão básica...");
        const {
          data: wikiData
        } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
          body: {
            action: 'article',
            titulo: periodoDecodificado,
            categoria: 'historia'
          }
        });
        if (wikiData) {
          setHistoria({
            periodo: periodoDecodificado,
            titulo: periodoDecodificado,
            conteudo_melhorado: {
              resumo_executivo: wikiData.conteudo || 'Conteúdo não disponível'
            },
            imagens: wikiData.imagens || [],
            marcos_importantes: []
          });
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };
  const compartilhar = async () => {
    if (!historia) return;
    const texto = `📚 *${historia.periodo}* - História Jurídica do Brasil\n\n${historia.conteudo_melhorado.resumo_executivo?.substring(0, 200)}...\n\n✨ Conheça mais no Direito Premium`;
    const textoFormatado = formatForWhatsApp(texto);
    const url = `https://wa.me/?text=${encodeURIComponent(textoFormatado)}`;
    window.open(url, "_blank");
    toast.success('Abrindo WhatsApp');
  };
  const exportarPDF = async () => {
    if (!historia) return;
    toast.info('Gerando PDF...', {
      description: 'Isso pode levar alguns segundos'
    });
    try {
      const conteudoCompleto = `
# ${historia.periodo}

${historia.ano_inicio && historia.ano_fim ? `**Período:** ${historia.ano_inicio} - ${historia.ano_fim}` : ''}

## Resumo

${historia.conteudo_melhorado.resumo_executivo || ''}

## Contexto Histórico

${historia.conteudo_melhorado.contexto_historico || ''}

## Marcos Importantes

${historia.conteudo_melhorado.marcos_importantes?.map((m: any) => `- **${m.ano}**: ${m.evento}`).join('\n') || ''}

## Legado

${historia.conteudo_melhorado.legado || ''}
      `;
      const {
        data,
        error
      } = await supabase.functions.invoke("exportar-pdf-educacional", {
        body: {
          conteudo: conteudoCompleto,
          titulo: historia.periodo,
          tipo: 'artigo-historia'
        }
      });
      if (error) throw error;
      const pdfBlob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(r => r.blob());
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${historia.periodo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF baixado!');
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    }
  };
  if (!periodo) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <p className="text-center text-muted-foreground">Período não especificado</p>
      </div>;
  }
  if (loading) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        
        <ContentGenerationLoader message={loadingMessage} />
      </div>;
  }
  if (!historia) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/meu-brasil/historia")} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Artigo não encontrado</p>
        </div>
      </div>;
  }
  return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button variant="ghost" size="sm" onClick={() => navigate("/meu-brasil/historia")} className="mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <JuristaArtigoCompleto nome={historia.periodo} categoria="História Jurídica" periodo={historia.ano_inicio && historia.ano_fim ? `${historia.ano_inicio} - ${historia.ano_fim}` : undefined} foto_url={historia.imagens?.[0]} conteudo_melhorado={historia.conteudo_melhorado} imagens={historia.imagens} links_relacionados={[]} onCompartilhar={compartilhar} onExportarPDF={exportarPDF} />

      {/* Botão flutuante da professora */}
      <FloatingProfessoraButton onClick={() => setIsChatOpen(true)} />

      {/* Modal do chat contextual */}
      <ProfessoraChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} contexto={{
      tipo: 'historia',
      nome: historia.periodo,
      resumo: historia.conteudo_melhorado.resumo_executivo
    }} />
    </div>;
};
export default MeuBrasilHistoriaView;