import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { JuristaArtigoCompleto } from "@/components/JuristaArtigoCompleto";
import { FloatingProfessoraButton } from "@/components/FloatingProfessoraButton";
import { ProfessoraChatModal } from "@/components/ProfessoraChatModal";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface JuristaData {
  nome: string;
  categoria: string;
  periodo: string;
  area: string;
  foto_url?: string;
  conteudo_melhorado: any;
  imagens: string[];
  links_relacionados: string[];
}

const MeuBrasilJuristaView = () => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const [jurista, setJurista] = useState<JuristaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Carregando artigo...");
  const [isFavorito, setIsFavorito] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const nomeDecodificado = nome ? decodeURIComponent(nome) : "";

  useEffect(() => {
    if (nomeDecodificado) {
      carregarJurista();
      verificarFavorito();
    }
  }, [nomeDecodificado]);

  const verificarFavorito = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('wikipedia_favoritos')
        .select('id')
        .eq('user_id', user.id)
        .eq('titulo', nomeDecodificado)
        .eq('categoria', 'jurista')
        .single();

      setIsFavorito(!!data);
    } catch (error) {
      // Não é favorito
    }
  };

  const carregarJurista = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Verificando cache...");

      // 1. Verificar se já existe na tabela meu_brasil_juristas
      const { data: cached, error: cacheError } = await supabase
        .from('meu_brasil_juristas')
        .select('*')
        .eq('nome', nomeDecodificado)
        .single();

      if (cached && cached.conteudo_melhorado) {
        console.log('✅ Jurista encontrado no cache');
        setJurista({
          nome: cached.nome,
          categoria: cached.categoria,
          periodo: cached.periodo,
          area: cached.area,
          foto_url: cached.foto_url,
          conteudo_melhorado: cached.conteudo_melhorado,
          imagens: (cached.imagens as string[]) || [],
          links_relacionados: (cached.links_relacionados as string[]) || []
        });
        setLoading(false);
        return;
      }

      // 2. Se não existe, buscar da Wikipedia
      console.log('📡 Buscando informações...');
      setLoadingMessage("Preparando conteúdo...");

      const { data: wikiData, error: wikiError } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
        body: {
          action: 'article',
          titulo: nomeDecodificado,
          categoria: 'jurista'
        }
      });

      if (wikiError) throw wikiError;

      // 3. Enriquecer com Gemini
      console.log('🤖 Enriquecendo com IA...');
      setLoadingMessage("Enriquecendo com IA educacional...");

      const { data: enrichData, error: enrichError } = await supabase.functions.invoke('enriquecer-conteudo-meu-brasil', {
        body: {
          tipo: 'jurista',
          nome: nomeDecodificado,
          conteudo_original: wikiData,
          contexto: `Jurista brasileiro`
        }
      });

      if (enrichError) throw enrichError;

      // 4. Salvar na tabela para cache futuro
      console.log('💾 Salvando no cache...');
      setLoadingMessage("Salvando...");

      const { error: saveError } = await supabase
        .from('meu_brasil_juristas')
        .upsert({
          nome: nomeDecodificado,
          categoria: 'jurista',
          periodo: '',
          area: '',
          foto_url: wikiData.foto_url || wikiData.imagens?.[0] || null,
          conteudo_original: wikiData,
          conteudo_melhorado: enrichData.conteudo_melhorado,
          imagens: wikiData.imagens || [],
          links_relacionados: wikiData.links_relacionados || []
        });

      if (saveError) {
        console.error('Erro ao salvar:', saveError);
        // Não bloquear a exibição se falhar o cache
      }

      // 5. Exibir
      setJurista({
        nome: nomeDecodificado,
        categoria: 'jurista',
        periodo: '',
        area: '',
        foto_url: wikiData.foto_url || wikiData.imagens?.[0],
        conteudo_melhorado: enrichData.conteudo_melhorado,
        imagens: wikiData.imagens || [],
        links_relacionados: wikiData.links_relacionados || []
      });

      toast.success('Artigo gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao carregar jurista:', error);
      toast.error(error.message || 'Erro ao carregar artigo do jurista');
      
      // Fallback: tentar carregar só da Wikipedia sem enriquecimento
      try {
        setLoadingMessage("Carregando versão básica...");
        const { data: wikiData } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
          body: {
            action: 'article',
            titulo: nomeDecodificado,
            categoria: 'jurista'
          }
        });

        if (wikiData) {
          setJurista({
            nome: nomeDecodificado,
            categoria: 'jurista',
            periodo: '',
            area: '',
            foto_url: wikiData.foto_url || wikiData.imagens?.[0],
            conteudo_melhorado: {
              resumo_executivo: wikiData.conteudo || 'Conteúdo não disponível'
            },
            imagens: wikiData.imagens || [],
            links_relacionados: wikiData.links_relacionados || []
          });
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login para adicionar favoritos');
        return;
      }

      if (isFavorito) {
        await supabase
          .from('wikipedia_favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('titulo', nomeDecodificado);
        
        setIsFavorito(false);
        toast.success('Removido dos favoritos');
      } else {
        await supabase
          .from('wikipedia_favoritos')
          .insert({
            user_id: user.id,
            titulo: nomeDecodificado,
            categoria: 'jurista'
          });
        
        setIsFavorito(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error);
      toast.error('Erro ao gerenciar favorito');
    }
  };

  const compartilhar = async () => {
    if (!jurista) return;

    const texto = `📚 *${jurista.nome}* - Jurista Brasileiro\n\n${jurista.conteudo_melhorado.resumo_executivo?.substring(0, 200)}...\n\n✨ Conheça mais no Direito Premium`;
    const textoFormatado = formatForWhatsApp(texto);
    const url = `https://wa.me/?text=${encodeURIComponent(textoFormatado)}`;
    
    window.open(url, "_blank");
    toast.success('Abrindo WhatsApp');
  };

  const exportarPDF = async () => {
    if (!jurista) return;

    toast.info('Gerando PDF...', { description: 'Isso pode levar alguns segundos' });

    try {
      const conteudoCompleto = `
# ${jurista.nome}

${jurista.periodo ? `**Período:** ${jurista.periodo}` : ''}
${jurista.area ? `**Área:** ${jurista.area}` : ''}

## Resumo

${jurista.conteudo_melhorado.resumo_executivo || ''}

## Relevância Jurídica

${jurista.conteudo_melhorado.relevancia_juridica || ''}

## Principais Contribuições

${jurista.conteudo_melhorado.principais_contribuicoes?.map((c: string) => `- ${c}`).join('\n') || ''}

## Legado

${jurista.conteudo_melhorado.legado || ''}
      `;

      const { data, error } = await supabase.functions.invoke("exportar-pdf-educacional", {
        body: {
          conteudo: conteudoCompleto,
          titulo: jurista.nome,
          tipo: 'artigo-jurista'
        }
      });

      if (error) throw error;
      
      const pdfBlob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(r => r.blob());
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${jurista.nome.replace(/\s+/g, '_')}.pdf`;
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

  if (!nome) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <p className="text-center text-muted-foreground">Jurista não especificado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/meu-brasil/juristas")}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <ContentGenerationLoader message={loadingMessage} />
      </div>
    );
  }

  if (!jurista) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/meu-brasil/juristas")}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Artigo não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/meu-brasil/juristas")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/meu-brasil/documentario/${encodeURIComponent(jurista.nome)}`)}
        >
          <Film className="w-4 h-4 mr-2" />
          Documentário
        </Button>
      </div>

      <JuristaArtigoCompleto
        nome={jurista.nome}
        categoria={jurista.categoria}
        periodo={jurista.periodo}
        area={jurista.area}
        foto_url={jurista.foto_url}
        conteudo_melhorado={jurista.conteudo_melhorado}
        imagens={jurista.imagens}
        links_relacionados={jurista.links_relacionados}
        isFavorito={isFavorito}
        onToggleFavorito={toggleFavorito}
        onCompartilhar={compartilhar}
        onExportarPDF={exportarPDF}
      />

      {/* Botão flutuante da professora */}
      <FloatingProfessoraButton onClick={() => setIsChatOpen(true)} />

      {/* Modal do chat contextual */}
      <ProfessoraChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        contexto={{
          tipo: 'jurista',
          nome: jurista.nome,
          resumo: jurista.conteudo_melhorado.resumo_executivo
        }}
      />
    </div>
  );
};

export default MeuBrasilJuristaView;
