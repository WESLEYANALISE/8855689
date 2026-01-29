import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Sparkles, FileQuestion, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import VideoPlayer from "@/components/VideoPlayer";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewer } from "@/components/QuizViewer";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { useToast } from "@/hooks/use-toast";
interface AulaData {
  area: string;
  modulo: number;
  aula: number;
  tema: string;
  assunto: string;
  video: string;
  conteudo: string;
  material: string;
}
interface Flashcard {
  front: string;
  back: string;
  exemplo?: string;
}
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}
const CursoAulaView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const id = searchParams.get("id");
  const [aula, setAula] = useState<AulaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"conteudo" | "flashcards" | "questoes">("conteudo");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [questoes, setQuestoes] = useState<QuizQuestion[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(false);
  const [questoesGenerated, setQuestoesGenerated] = useState(false);
  useEffect(() => {
    const fetchAula = async () => {
      if (!id) {
        navigate(-1);
        return;
      }
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from("CURSOS" as any).select("*").eq("id", parseInt(id)).single();
      if (error) {
        console.error("Erro ao buscar aula:", error);
        navigate(-1);
      } else if (data) {
        const aulaData = data as any;
        setAula({
          area: aulaData.Area || "",
          modulo: aulaData.Modulo || 0,
          aula: aulaData.Aula || 0,
          tema: aulaData.Tema || "",
          assunto: aulaData.Assunto || "",
          video: aulaData.video || "",
          conteudo: aulaData.conteudo || "",
          material: aulaData.material || ""
        });
      }
      setLoading(false);
    };
    fetchAula();
  }, [id, navigate]);
  const getVideoEmbedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("dropbox.com")) {
        const dropboxUrl = url.replace("?dl=0", "?raw=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
        return dropboxUrl;
      }
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };
  const gerarFlashcards = async () => {
    if (!aula || flashcardsGenerated) return;
    setLoadingFlashcards(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("gerar-flashcards", {
        body: {
          content: `${aula.assunto}\n\n${aula.conteudo}`
        }
      });
      if (error) throw error;
      setFlashcards(data.flashcards || []);
      setFlashcardsGenerated(true);
      toast({
        title: "Flashcards gerados!",
        description: "Use os flashcards para revisar o conteúdo da aula."
      });
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      toast({
        title: "Erro ao gerar flashcards",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoadingFlashcards(false);
    }
  };
  const gerarQuestoes = async () => {
    if (!aula || questoesGenerated) return;
    setLoadingQuestoes(true);
    try {
      const response = await fetch(`https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-questoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
        },
        body: JSON.stringify({
          artigo: `${aula.assunto}\n\n${aula.conteudo}`
        })
      });
      if (!response.ok) throw new Error('Falha na requisição');
      const text = await response.text();
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanedText);
      if (data.questions && Array.isArray(data.questions)) {
        setQuestoes(data.questions);
        setQuestoesGenerated(true);
        toast({
          title: "Questões geradas!",
          description: "Teste seus conhecimentos sobre a aula."
        });
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      toast({
        title: "Erro ao gerar questões",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoadingQuestoes(false);
    }
  };
  const handleTabChange = (value: string) => {
    setActiveTab(value as "conteudo" | "flashcards" | "questoes");
    if (value === "flashcards" && !flashcardsGenerated && !loadingFlashcards) {
      gerarFlashcards();
    } else if (value === "questoes" && !questoesGenerated && !loadingQuestoes) {
      gerarQuestoes();
    }
  };
  const handleExportPDF = async () => {
    if (!aula) return;
    setExportingPDF(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: {
          content: aula.conteudo,
          filename: `aula-${aula.area}-modulo${aula.modulo}-aula${aula.aula}`,
          title: `${aula.tema} - ${aula.assunto}`
        }
      });
      if (error) throw error;
      window.open(data.pdfUrl, '_blank');
      toast({
        title: "PDF gerado!",
        description: "O PDF foi aberto em uma nova aba. O link é válido por 24 horas."
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setExportingPDF(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>;
  }
  if (!aula) {
    return null;
  }
  return <div className="min-h-screen bg-background text-foreground pb-20 animate-fade-in">

      {/* Content */}
      <div className="max-w-6xl mx-auto py-8 animate-fade-in px-4 md:px-6">
        {/* Video */}
        {aula.video && <div className="mb-8">
            <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg">
              <div className="relative" style={{
            paddingBottom: "56.25%"
          }}>
                <div className="absolute inset-0">
                  <VideoPlayer src={getVideoEmbedUrl(aula.video)} autoPlay />
                </div>
              </div>
            </div>
          </div>}

        {/* Título e Descrição */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
            {aula.assunto}
          </h2>
          <p className="text-muted-foreground">
            Complete a aula utilizando os recursos didáticos abaixo
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-3">
            {aula.material && <Button onClick={() => window.open(aula.material, "_blank")} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Baixar Material
              </Button>}
            
            {aula.conteudo && <Button onClick={handleExportPDF} disabled={exportingPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {exportingPDF ? "Gerando PDF..." : "Exportar PDF"}
              </Button>}
          </div>
        </div>

        {/* Tabs de Conteúdo Didático */}
        {aula.conteudo && <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="conteudo" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Conteúdo</span>
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Flashcards</span>
              </TabsTrigger>
              <TabsTrigger value="questoes" className="gap-2">
                <FileQuestion className="w-4 h-4" />
                <span className="hidden sm:inline">Questões</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conteudo">
              <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
                <div className="p-8 md:p-12 px-[10px]">
                  <div className="prose prose-lg md:prose-xl max-w-none dark:prose-invert 
                    prose-headings:font-bold 
                    prose-headings:text-[hsl(var(--warning))] 
                    prose-headings:mb-8
                    prose-h1:text-4xl 
                    prose-h1:mb-10
                    prose-h1:border-b
                    prose-h1:border-accent/20
                    prose-h1:pb-4
                    prose-h2:text-3xl 
                    prose-h2:mb-8
                    prose-h2:mt-12
                    prose-h2:text-[hsl(var(--warning)/0.85)]
                    prose-h3:text-2xl 
                    prose-h3:mb-6
                    prose-h3:mt-10
                    prose-p:text-foreground/90 
                    prose-p:leading-[1.85] 
                    prose-p:mb-8
                    prose-p:text-lg
                    prose-a:text-accent
                    prose-a:no-underline
                    prose-a:hover:underline
                    prose-strong:text-[hsl(var(--warning))]
                    prose-strong:font-bold
                    prose-ul:my-8
                    prose-ul:space-y-3
                    prose-ol:my-8
                    prose-ol:space-y-3
                    prose-li:text-foreground/90
                    prose-li:leading-[1.85]
                    prose-li:text-lg
                    prose-blockquote:border-l-4
                    prose-blockquote:border-accent
                    prose-blockquote:pl-6
                    prose-blockquote:italic
                    prose-blockquote:text-foreground/80
                    prose-code:text-accent
                    prose-code:bg-muted
                    prose-code:px-2
                    prose-code:py-1
                    prose-code:rounded
                    prose-pre:bg-muted
                    prose-pre:p-6
                    prose-pre:rounded-xl
                    prose-pre:overflow-x-auto
                    prose-hr:border-border
                    prose-hr:my-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aula.conteudo}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flashcards">
              <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden min-h-[400px]">
                {loadingFlashcards ? <ContentGenerationLoader message="Gerando flashcards didáticos..." /> : flashcards.length > 0 ? <div className="p-6">
                    <div className="mb-4 text-center">
                      <h3 className="text-lg font-semibold mb-2">Flashcards para Revisão</h3>
                      <p className="text-sm text-muted-foreground">
                        Clique no card para ver a resposta. Use para memorizar conceitos importantes!
                      </p>
                    </div>
                    <FlashcardViewer flashcards={flashcards} />
                  </div> : <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">
                      Clique na aba para gerar flashcards automaticamente
                    </p>
                  </div>}
              </div>
            </TabsContent>

            <TabsContent value="questoes">
              <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden min-h-[400px]">
                {loadingQuestoes ? <ContentGenerationLoader message="Criando questões de prova..." /> : questoes.length > 0 ? <div className="p-6 px-0">
                    <div className="mb-6 text-center">
                      <h3 className="text-lg font-semibold mb-2">Teste seus Conhecimentos</h3>
                      <p className="text-sm text-muted-foreground">
                        Responda as questões para fixar o conteúdo da aula
                      </p>
                    </div>
                    <QuizViewer questions={questoes} />
                  </div> : <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">
                      Clique na aba para gerar questões automaticamente
                    </p>
                  </div>}
              </div>
            </TabsContent>
          </Tabs>}
      </div>
    </div>;
};
export default CursoAulaView;