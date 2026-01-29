import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Loader2, Check, Sparkles, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaginaFundo {
  id: string;
  nome: string;
  descricao: string;
  chaveStorage: string;
  promptPadrao: string;
}

interface ImagemSalva {
  id: string;
  url: string;
  tipo: string;
  ativo: boolean;
  created_at: string;
}

const paginasComFundo: PaginaFundo[] = [
  {
    id: "vademecum",
    nome: "Vade Mecum Elite",
    descricao: "Página principal do Vade Mecum com legislação brasileira",
    chaveStorage: "vademecum-hero",
    promptPadrao: "Create a stunning vertical hero image (9:16 aspect ratio) representing Brazilian democracy and law. The iconic Palácio do Planalto (Presidential Palace) in Brasília, Brazil at golden hour with dramatic lighting. In the foreground, an elegant open book representing the Brazilian Federal Constitution with visible ornate text. The sky should have warm golden and orange tones with some clouds. The architectural modernist style of the Planalto palace should be clearly visible. Professional photography style, cinematic lighting, ultra high resolution, photorealistic. The overall mood should convey justice, democracy and governmental authority."
  },
  {
    id: "blog-juridico",
    nome: "Blog Jurídico",
    descricao: "Timeline com filosofia e história do Direito",
    chaveStorage: "blog-juridico-hero",
    promptPadrao: "Create a stunning vertical hero image (9:16 aspect ratio) representing the Philosophy and History of Law: A mystical ancient pathway through an ornate library or temple of knowledge. Greek philosophical statues (Plato, Aristotle, Socrates) visible in alcoves along the corridor. Ancient scrolls and law books illuminated by golden candlelight. A symbolic road/path leading forward through the corridor, representing the journey of legal knowledge through history. Classical Greek columns and architecture. Dramatic lighting with warm amber and golden tones. Renaissance painting style mixed with photorealistic quality. The overall mood should convey wisdom, philosophical depth, and the timeless journey of justice through history. Ultra high resolution."
  }
];

export default function GeracaoFundos() {
  const navigate = useNavigate();
  const [paginaSelecionada, setPaginaSelecionada] = useState<PaginaFundo | null>(null);
  const [prompt, setPrompt] = useState("");
  const [gerando, setGerando] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);
  const [imagensSalvas, setImagensSalvas] = useState<ImagemSalva[]>([]);
  const [carregandoImagens, setCarregandoImagens] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarImagensSalvas();
  }, []);

  const carregarImagensSalvas = async () => {
    setCarregandoImagens(true);
    try {
      const { data, error } = await supabase
        .from('vademecum_hero_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImagensSalvas(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    } finally {
      setCarregandoImagens(false);
    }
  };

  const selecionarPagina = (pagina: PaginaFundo) => {
    setPaginaSelecionada(pagina);
    setPrompt(pagina.promptPadrao);
    setImagemGerada(null);
  };

  const gerarImagem = async () => {
    if (!prompt.trim()) {
      toast.error("Digite um prompt para gerar a imagem");
      return;
    }

    setGerando(true);
    try {
      // Usar edge function apropriada baseada na página
      const functionName = paginaSelecionada.id === 'blog-juridico' 
        ? 'gerar-imagem-blog-juridico' 
        : 'gerar-imagem-planalto';
        
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { prompt }
      });

      if (error) throw error;
      
      if (data?.url) {
        setImagemGerada(data.url);
        toast.success("Imagem gerada com sucesso!");
      } else if (data?.image_base64) {
        setImagemGerada(data.image_base64);
        toast.success("Imagem gerada com sucesso!");
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(error.message || "Erro ao gerar imagem");
    } finally {
      setGerando(false);
    }
  };

  const salvarComoPadrao = async () => {
    if (!imagemGerada || !paginaSelecionada) return;

    setSalvando(true);
    try {
      // Converter base64 para blob
      const response = await fetch(imagemGerada);
      const blob = await response.blob();

      // Converter para WebP
      const canvas = document.createElement('canvas');
      const img = new window.Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imagemGerada;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const webpBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.9);
      });

      // Upload para Supabase Storage
      const fileName = `${paginaSelecionada.chaveStorage}-${Date.now()}.webp`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vademecum-images')
        .upload(fileName, webpBlob, { 
          contentType: 'image/webp',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('vademecum-images')
        .getPublicUrl(fileName);

      // Desativar imagens anteriores
      await supabase
        .from('vademecum_hero_images')
        .update({ ativo: false })
        .eq('tipo', paginaSelecionada.id);

      // Salvar referência na tabela
      const { error: insertError } = await supabase
        .from('vademecum_hero_images')
        .insert({
          url: urlData.publicUrl,
          tipo: paginaSelecionada.id,
          ativo: true
        });

      if (insertError) throw insertError;

      toast.success("Imagem salva como padrão!");
      carregarImagensSalvas();
      setImagemGerada(null);
    } catch (error: any) {
      console.error('Erro ao salvar imagem:', error);
      toast.error(error.message || "Erro ao salvar imagem");
    } finally {
      setSalvando(false);
    }
  };

  const definirComoAtivo = async (imagem: ImagemSalva) => {
    try {
      // Desativar todas
      await supabase
        .from('vademecum_hero_images')
        .update({ ativo: false })
        .eq('tipo', imagem.tipo);

      // Ativar a selecionada
      await supabase
        .from('vademecum_hero_images')
        .update({ ativo: true })
        .eq('id', imagem.id);

      toast.success("Imagem definida como padrão!");
      carregarImagensSalvas();
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao definir imagem como padrão");
    }
  };

  const excluirImagem = async (imagem: ImagemSalva) => {
    try {
      // Extrair nome do arquivo da URL
      const urlParts = imagem.url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Deletar do storage
      await supabase.storage
        .from('vademecum-images')
        .remove([fileName]);

      // Deletar da tabela
      await supabase
        .from('vademecum_hero_images')
        .delete()
        .eq('id', imagem.id);

      toast.success("Imagem excluída!");
      carregarImagensSalvas();
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao excluir imagem");
    }
  };

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
              <Image className="w-6 h-6 text-purple-500" />
              Geração de Fundos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gere imagens de fundo personalizadas com IA (Nano Banana)
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Coluna esquerda - Seleção e geração */}
          <div className="space-y-4">
            {/* Seleção de página */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-foreground">Selecione a página</h2>
              <div className="grid gap-3">
                {paginasComFundo.map((pagina) => (
                  <button
                    key={pagina.id}
                    onClick={() => selecionarPagina(pagina)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      paginaSelecionada?.id === pagina.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                    }`}
                  >
                    <h3 className="font-medium text-foreground">{pagina.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{pagina.descricao}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Gerador */}
            {paginaSelecionada && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Gerar nova imagem
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt (descrição da imagem)</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva a imagem que deseja gerar..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={gerarImagem} 
                  disabled={gerando}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {gerando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando com Nano Banana...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Imagem
                    </>
                  )}
                </Button>

                {/* Preview da imagem gerada */}
                {imagemGerada && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Imagem gerada:</h3>
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img 
                        src={imagemGerada} 
                        alt="Imagem gerada" 
                        className="w-full h-auto max-h-[300px] object-cover"
                      />
                    </div>
                    <Button 
                      onClick={salvarComoPadrao}
                      disabled={salvando}
                      className="w-full"
                    >
                      {salvando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Convertendo para WebP e salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Salvar como Padrão (WebP)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna direita - Imagens salvas */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold text-foreground">Imagens salvas</h2>

            {carregandoImagens ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : imagensSalvas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhuma imagem salva ainda
              </p>
            ) : (
              <div className="grid gap-4">
                {imagensSalvas.map((imagem) => (
                  <div 
                    key={imagem.id}
                    className={`relative rounded-lg overflow-hidden border ${
                      imagem.ativo ? "border-green-500 ring-2 ring-green-500/20" : "border-border"
                    }`}
                  >
                    {imagem.ativo && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Ativo
                      </div>
                    )}
                    <img 
                      src={imagem.url} 
                      alt="Fundo salvo" 
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3 bg-background/80 backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(imagem.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex gap-2">
                        {!imagem.ativo && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => definirComoAtivo(imagem)}
                            className="flex-1"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Definir como padrão
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => excluirImagem(imagem)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
