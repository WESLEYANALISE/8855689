import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart, Share2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ContentGenerationLoader } from "./ContentGenerationLoader";

interface WikipediaArtigoProps {
  titulo: string;
  categoria: string;
}

interface Artigo {
  titulo: string;
  conteudo: string;
  html: string;
  imagens: string[];
  links_relacionados: string[];
}

export const WikipediaArtigo = ({ titulo, categoria }: WikipediaArtigoProps) => {
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    carregarArtigo();
    verificarFavorito();
  }, [titulo]);

  const carregarArtigo = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
        body: {
          action: 'article',
          titulo,
          categoria
        }
      });

      if (error) throw error;

      setArtigo(data);
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      toast.error('Erro ao carregar artigo');
    } finally {
      setLoading(false);
    }
  };

  const verificarFavorito = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('wikipedia_favoritos')
        .select('id')
        .eq('user_id', user.id)
        .eq('titulo', titulo)
        .single();

      setIsFavorito(!!data);
    } catch (error) {
      // Não é favorito
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
          .eq('titulo', titulo);
        
        setIsFavorito(false);
        toast.success('Removido dos favoritos');
      } else {
        await supabase
          .from('wikipedia_favoritos')
          .insert({
            user_id: user.id,
            titulo,
            categoria
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
    const url = `https://pt.wikipedia.org/wiki/${encodeURIComponent(titulo)}`;
    const texto = `📚 ${titulo} - Wikipedia`;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
      } catch (error) {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (loading) {
    return <ContentGenerationLoader message="Carregando artigo..." />;
  }

  if (!artigo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Artigo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho com foto (para juristas) */}
      <div className="flex items-start gap-4">
        {(artigo as any).foto_url && (
          <img 
            src={(artigo as any).foto_url} 
            alt={artigo.titulo}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{artigo.titulo}</h1>
          
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorito}
              className={isFavorito ? "text-red-500 border-red-500" : ""}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorito ? "fill-current" : ""}`} />
              {isFavorito ? "Favoritado" : "Favoritar"}
            </Button>
            
            <Button variant="outline" size="sm" onClick={compartilhar}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://pt.wikipedia.org/wiki/${encodeURIComponent(titulo)}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Wikipedia
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo melhorado (se disponível) */}
      {(artigo as any).conteudo_completo ? (
        <div className="space-y-6">
          {/* Resumo executivo */}
          {(artigo as any).conteudo_completo.resumo_executivo && (
            <div className="bg-muted/50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-3">📝 Resumo</h2>
              <p className="text-foreground/90 leading-relaxed">
                {(artigo as any).conteudo_completo.resumo_executivo}
              </p>
            </div>
          )}

          {/* Relevância jurídica */}
          {(artigo as any).conteudo_completo.relevancia_juridica && (
            <div className="border-l-4 border-primary pl-6 py-3">
              <h2 className="text-lg font-bold mb-2">⚖️ Relevância Jurídica</h2>
              <p className="text-foreground/80 leading-relaxed">
                {(artigo as any).conteudo_completo.relevancia_juridica}
              </p>
            </div>
          )}

          {/* Principais contribuições */}
          {(artigo as any).conteudo_completo.principais_contribuicoes && (
            <div>
              <h2 className="text-lg font-bold mb-3">🎯 Principais Contribuições</h2>
              <ul className="space-y-2">
                {(artigo as any).conteudo_completo.principais_contribuicoes.map((contrib: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1 font-bold">•</span>
                    <span className="flex-1">{contrib}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Obras principais */}
          {(artigo as any).conteudo_completo.obras_principais && (
            <div>
              <h2 className="text-lg font-bold mb-3">📚 Obras Principais</h2>
              <div className="space-y-2">
                {(artigo as any).conteudo_completo.obras_principais.map((obra: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/30 p-3 rounded">
                    <span className="text-xl">📖</span>
                    <span className="flex-1">{obra}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curiosidades */}
          {(artigo as any).conteudo_completo.curiosidades && (
            <div className="bg-accent/10 p-6 rounded-lg border border-accent/20">
              <h2 className="text-lg font-bold mb-3">💡 Curiosidades</h2>
              <ul className="space-y-2">
                {(artigo as any).conteudo_completo.curiosidades.map((curiosidade: string, i: number) => (
                  <li key={i} className="text-sm leading-relaxed">{curiosidade}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Frases célebres */}
          {(artigo as any).conteudo_completo.frases_celebres && (
            <div>
              <h2 className="text-lg font-bold mb-3">💬 Frases Célebres</h2>
              <div className="space-y-3">
                {(artigo as any).conteudo_completo.frases_celebres.map((frase: string, i: number) => (
                  <blockquote key={i} className="border-l-4 border-primary/50 pl-4 italic text-foreground/80">
                    "{frase}"
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Conteúdo tradicional da Wikipedia */
        <>
          {/* Imagem principal */}
          {artigo.imagens.length > 0 && (
            <div className="w-full rounded-lg overflow-hidden border">
              <img 
                src={artigo.imagens[0]} 
                alt={artigo.titulo}
                className="w-full max-h-[400px] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Conteúdo do artigo */}
          <div 
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: artigo.html || artigo.conteudo }}
          />
        </>
      )}

      {/* Links relacionados */}
      {artigo.links_relacionados.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">📖 Artigos Relacionados</h3>
          <div className="flex flex-wrap gap-2">
            {artigo.links_relacionados.map((link) => (
              <Button
                key={link}
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/meu-brasil/artigo/${encodeURIComponent(link)}`}
              >
                {link}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Galeria de imagens (se houver mais de uma) */}
      {artigo.imagens.length > 1 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">🖼️ Galeria</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {artigo.imagens.slice(1, 7).map((img, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg border hover:border-primary transition-colors">
                <img 
                  src={img} 
                  alt={`${artigo.titulo} - ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(img, '_blank')}
                  onError={(e) => {
                    e.currentTarget.parentElement!.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fonte */}
      <div className="text-xs text-muted-foreground text-center py-4 border-t">
        📚 Conteúdo educacional gerado com inteligência artificial
      </div>
    </div>
  );
};
