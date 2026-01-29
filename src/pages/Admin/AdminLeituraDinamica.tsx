import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { 
  ArrowLeft, Upload, BookOpen, FileText, Loader2, CheckCircle, 
  XCircle, AlertCircle, Search, Database, Eye, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LivroClassico {
  id: number;
  livro: string;
  autor: string;
  imagem: string;
  download: string;
  paginasExtraidas?: number;
}

interface ProcessoStatus {
  fase: "idle" | "upload" | "ocr" | "formatando" | "concluido" | "erro";
  paginasProcessadas: number;
  totalPaginas: number;
  logs: string[];
  erro?: string;
}

const AdminLeituraDinamica = () => {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<LivroClassico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [livroSelecionado, setLivroSelecionado] = useState<LivroClassico | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processo, setProcesso] = useState<ProcessoStatus>({
    fase: "idle",
    paginasProcessadas: 0,
    totalPaginas: 0,
    logs: []
  });

  // Carregar livros da biblioteca
  useEffect(() => {
    carregarLivros();
  }, []);

  const carregarLivros = async () => {
    try {
      // Buscar livros da biblioteca
      const { data: livrosData, error: livrosError } = await supabase
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, livro, autor, imagem, download")
        .order("livro");

      if (livrosError) throw livrosError;

      // Buscar contagem de páginas já extraídas
      const { data: paginasData } = await supabase
        .from("BIBLIOTECA-LEITURA-DINAMICA")
        .select("\"Titulo da Obra\"");

      const paginasMap = new Map<string, number>();
      paginasData?.forEach((row: any) => {
        const titulo = row["Titulo da Obra"];
        if (titulo) {
          paginasMap.set(titulo, (paginasMap.get(titulo) || 0) + 1);
        }
      });

      const livrosComPaginas = (livrosData || []).map(livro => ({
        ...livro,
        paginasExtraidas: paginasMap.get(livro.livro) || 0
      }));

      setLivros(livrosComPaginas);
    } catch (error) {
      console.error("Erro ao carregar livros:", error);
      toast.error("Erro ao carregar livros");
    } finally {
      setCarregando(false);
    }
  };

  const livrosFiltrados = livros.filter(livro =>
    livro.livro?.toLowerCase().includes(busca.toLowerCase()) ||
    livro.autor?.toLowerCase().includes(busca.toLowerCase())
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdf = acceptedFiles.find(f => f.type === "application/pdf");
    if (pdf) {
      setPdfFile(pdf);
      addLog("📄 PDF selecionado: " + pdf.name);
    } else {
      toast.error("Selecione um arquivo PDF");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1
  });

  const addLog = (mensagem: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setProcesso(prev => ({
      ...prev,
      logs: [...prev.logs, `[${timestamp}] ${mensagem}`]
    }));
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const iniciarExtracao = async () => {
    if (!livroSelecionado || !pdfFile) {
      toast.error("Selecione um livro e um PDF");
      return;
    }

    setProcesso({
      fase: "upload",
      paginasProcessadas: 0,
      totalPaginas: 0,
      logs: []
    });

    try {
      // 1. Upload do PDF
      addLog("📤 Enviando PDF para o servidor...");
      const sanitizedName = sanitizeFileName(pdfFile.name);
      const fileName = `leitura-dinamica/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, pdfFile);

      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
      addLog("✅ Upload concluído");

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from("pdfs")
        .getPublicUrl(fileName);

      // 3. Iniciar extração OCR em background
      addLog("🔍 Iniciando extração OCR...");
      setProcesso(prev => ({ ...prev, fase: "ocr" }));

      const { data: ocrData, error: ocrError } = await supabase.functions.invoke("extrair-texto-pdf-paginas", {
        body: {
          pdfUrl: urlData.publicUrl,
          tituloLivro: livroSelecionado.livro
        }
      });

      if (ocrError) throw ocrError;
      if (!ocrData.success) throw new Error(ocrData.error);

      addLog("✅ Extração iniciada em background");
      addLog("📊 Acompanhando progresso...");

      // 4. Polling para acompanhar progresso
      let ultimoCount = 0;
      let semMudancas = 0;
      
      const pollingId = setInterval(async () => {
        try {
          const { count } = await supabase
            .from("BIBLIOTECA-LEITURA-DINAMICA")
            .select("*", { count: "exact", head: true })
            .eq("Titulo da Obra", livroSelecionado.livro);

          if (count && count > ultimoCount) {
            ultimoCount = count;
            semMudancas = 0;
            addLog(`📄 ${count} páginas extraídas`);
            setProcesso(prev => ({
              ...prev,
              paginasProcessadas: count,
              totalPaginas: count
            }));
          } else {
            semMudancas++;
          }

          // Se não houver mudanças por 30 segundos, assumir que terminou
          if (semMudancas >= 15 && ultimoCount > 0) {
            clearInterval(pollingId);
            addLog(`✅ Extração concluída: ${ultimoCount} páginas`);
            addLog("🎉 Pronto para formatar!");
            setProcesso(prev => ({
              ...prev,
              fase: "concluido",
              paginasProcessadas: ultimoCount,
              totalPaginas: ultimoCount
            }));
            carregarLivros(); // Atualizar lista
            toast.success(`${ultimoCount} páginas extraídas com sucesso!`);
          }
        } catch (e) {
          console.error("Erro no polling:", e);
        }
      }, 2000);

      // Timeout máximo de 10 minutos
      setTimeout(() => {
        clearInterval(pollingId);
        if (ultimoCount > 0 && processo.fase !== "concluido") {
          setProcesso(prev => ({ ...prev, fase: "concluido" }));
          addLog(`⏱️ Timeout - ${ultimoCount} páginas processadas`);
        }
      }, 600000);

    } catch (error: any) {
      console.error("Erro:", error);
      addLog(`❌ Erro: ${error.message}`);
      setProcesso(prev => ({ ...prev, fase: "erro", erro: error.message }));
      toast.error(error.message);
    }
  };

  const formatarPaginas = async () => {
    if (!livroSelecionado) return;

    setProcesso(prev => ({ ...prev, fase: "formatando", logs: [...prev.logs] }));
    addLog("📝 Iniciando formatação com IA...");

    try {
      const { data, error } = await supabase.functions.invoke("formatar-paginas-livro", {
        body: { tituloLivro: livroSelecionado.livro }
      });

      if (error) throw error;
      
      addLog(`✅ ${data.paginasFormatadas} páginas formatadas`);
      toast.success("Formatação concluída!");
      setProcesso(prev => ({ ...prev, fase: "concluido" }));
    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`);
      toast.error(error.message);
    }
  };

  const voltarParaLista = () => {
    setLivroSelecionado(null);
    setPdfFile(null);
    setProcesso({
      fase: "idle",
      paginasProcessadas: 0,
      totalPaginas: 0,
      logs: []
    });
  };

  // VIEW: Detalhes do livro selecionado
  if (livroSelecionado) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-6">
        <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={voltarParaLista}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                {livroSelecionado.livro}
              </h1>
              <p className="text-sm text-muted-foreground">
                {livroSelecionado.autor}
              </p>
            </div>
          </div>

          {/* Card do livro */}
          <div className="flex gap-4 bg-card border border-border rounded-xl p-4">
            <img 
              src={livroSelecionado.imagem} 
              alt={livroSelecionado.livro}
              className="w-20 h-28 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{livroSelecionado.livro}</h2>
              <p className="text-sm text-muted-foreground">{livroSelecionado.autor}</p>
              
              {livroSelecionado.paginasExtraidas && livroSelecionado.paginasExtraidas > 0 ? (
                <Badge variant="secondary" className="mt-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {livroSelecionado.paginasExtraidas} páginas extraídas
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sem texto extraído
                </Badge>
              )}
            </div>
          </div>

          {/* Dropzone para PDF */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : pdfFile 
                  ? "border-green-500 bg-green-500/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            {pdfFile ? (
              <>
                <FileText className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="font-medium text-foreground">{pdfFile.name}</p>
                <p className="text-sm text-muted-foreground">Clique para trocar</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium text-foreground">Arraste o PDF aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              </>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={iniciarExtracao}
              disabled={!pdfFile || processo.fase === "ocr" || processo.fase === "upload"}
              className="flex-1"
            >
              {processo.fase === "ocr" || processo.fase === "upload" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Extrair Texto (OCR)
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              onClick={formatarPaginas}
              disabled={!livroSelecionado.paginasExtraidas || processo.fase === "formatando"}
            >
              {processo.fase === "formatando" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Formatar
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          {processo.paginasProcessadas > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="text-foreground font-medium">
                  {processo.paginasProcessadas} páginas
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          )}

          {/* Logs */}
          {processo.logs.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Logs</h3>
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {processo.logs.map((log, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground font-mono">
                      {log}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW: Lista de livros
  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Leitura Dinâmica
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um livro para extrair o texto
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro ou autor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de livros */}
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2 pr-2">
              {livrosFiltrados.map(livro => (
                <div
                  key={livro.id}
                  onClick={() => setLivroSelecionado(livro)}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <img 
                    src={livro.imagem} 
                    alt={livro.livro}
                    className="w-12 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {livro.livro}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {livro.autor}
                    </p>
                    {livro.paginasExtraidas && livro.paginasExtraidas > 0 ? (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {livro.paginasExtraidas} pág.
                      </Badge>
                    ) : null}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default AdminLeituraDinamica;
