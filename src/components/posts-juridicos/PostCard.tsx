import { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle, MoreHorizontal, Instagram, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarrosselPost } from "./CarrosselPost";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    titulo: string;
    artigo_numero?: string;
    lei_tabela?: string;
    imagens: any[];
    roteiro?: any;
    data_publicacao: string;
    visualizacoes: number;
    curtidas: number;
    fonte?: string;
    fonte_perfil?: string;
    fonte_url?: string;
    tipo_midia?: string;
    video_url?: string;
    legenda?: string;
  };
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
}

const getLeiNome = (tabela: string): string => {
  const mapping: Record<string, string> = {
    "CF - Constituição Federal": "Constituição Federal",
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CPC – Código de Processo Civil": "CPC",
    "CPP – Código de Processo Penal": "CPP",
    "CLT – Consolidação das Leis do Trabalho": "CLT",
    "CDC – Código de Defesa do Consumidor": "CDC",
  };
  return mapping[tabela] || tabela;
};

export const PostCard = ({ post, onLike, onSave }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.curtidas || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(post.id);
    toast.success(saved ? "Removido dos salvos" : "Salvo para estudar depois!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.titulo,
          text: `Aprenda sobre ${post.artigo_numero} - ${getLeiNome(post.lei_tabela)}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Compartilhamento cancelado");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handleDownloadImage = (index: number, url: string) => {
    // Converter base64 para download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${post.artigo_numero.replace(/\s/g, '_')}_slide_${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Slide ${index} baixado!`);
  };

  // Preparar slides
  const slides = post.imagens?.length > 0 
    ? post.imagens 
    : post.roteiro?.slides?.map((s: any, i: number) => ({
        slideNumero: i + 1,
        url: null,
        titulo: s.titulo,
        texto: s.texto
      })) || [];

  const isInstagram = post.fonte === "instagram";
  const isReel = post.tipo_midia === "reel" && post.video_url;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isInstagram 
              ? "bg-gradient-to-br from-pink-500 to-purple-500" 
              : "bg-primary/20"
          )}>
            {isInstagram ? (
              <Instagram className="w-5 h-5 text-white" />
            ) : (
              <span className="text-lg">⚖️</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground">
                {isInstagram ? `@${post.fonte_perfil}` : getLeiNome(post.lei_tabela || "")}
              </p>
              {isInstagram && (
                <Badge variant="secondary" className="text-xs py-0">
                  Instagram
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isInstagram ? (post.tipo_midia === "reel" ? "Reel" : "Post") : post.artigo_numero}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isInstagram && post.fonte_url && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              onClick={() => window.open(post.fonte_url, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Conteúdo - Reel ou Carrossel */}
      {isReel ? (
        <div className="relative bg-black aspect-[9/16] max-h-[500px]">
          <video
            src={post.video_url}
            controls
            className="w-full h-full object-contain"
            poster={slides[0]?.url}
          />
        </div>
      ) : (
        <CarrosselPost 
          slides={slides} 
          onDownload={handleDownloadImage}
        />
      )}

      {/* Ações */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 transition-transform active:scale-110"
            >
              <Heart
                className={cn(
                  "w-6 h-6 transition-colors",
                  liked ? "fill-red-500 text-red-500" : "text-foreground"
                )}
              />
            </button>
            <button className="text-foreground">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button onClick={handleShare} className="text-foreground">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="transition-transform active:scale-110"
          >
            <Bookmark
              className={cn(
                "w-6 h-6 transition-colors",
                saved ? "fill-foreground text-foreground" : "text-foreground"
              )}
            />
          </button>
        </div>

        {/* Curtidas */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-foreground">
            {likeCount.toLocaleString('pt-BR')} curtidas
          </p>
        )}

        {/* Título e descrição */}
        <div>
          <p className="text-sm text-foreground">
            {isInstagram ? (
              <>
                <span className="font-semibold">@{post.fonte_perfil}</span>{" "}
                {post.legenda?.substring(0, 150) || post.titulo}
                {(post.legenda?.length || 0) > 150 && "..."}
              </>
            ) : (
              <>
                <span className="font-semibold">{getLeiNome(post.lei_tabela || "")}</span>{" "}
                {post.titulo}
              </>
            )}
          </p>
        </div>

        {/* Hashtags */}
        {post.roteiro?.hashtags && (
          <p className="text-sm text-primary">
            {post.roteiro.hashtags.join(" ")}
          </p>
        )}

        {/* Data */}
        <p className="text-xs text-muted-foreground uppercase">
          {new Date(post.data_publicacao).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};

export default PostCard;
