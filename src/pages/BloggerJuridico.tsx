import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Scale, Shield, Gavel, UserCheck, Loader2, Lightbulb, BookOpenCheck, GraduationCap, Landmark, FileQuestion, Briefcase, Lock, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBloggerCache } from '@/hooks/useBloggerCache';
import { useImagePreload } from '@/hooks/useImagePreload';
import { CachedImage } from '@/components/ui/cached-image';
import { motion } from 'framer-motion';
import { BlogJuridicoTimeline } from '@/components/BlogJuridicoTimeline';
import heroBlogJuridico from "@/assets/hero-blog-juridico-opt.webp";
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PremiumFloatingCard } from '@/components/PremiumFloatingCard';

type Categoria = 'advogado' | 'prf' | 'pf' | 'juiz' | 'delegado' | 'promotor' | 'defensor' | 'procurador' | 'pcivil' | 'pmilitar' | 'curiosidades' | 'filosofos' | 'iniciando' | 'casos' | 'historia' | 'termos';

// Categorias principais (cards)
const categoriasCards: {
  id: Categoria | 'carreiras';
  nome: string;
  icon: React.ReactNode;
  cor: string;
  descricao: string;
}[] = [
  {
    id: 'iniciando',
    nome: 'Iniciando no Direito',
    icon: <GraduationCap className="w-6 h-6" />,
    cor: 'from-emerald-500 to-teal-600',
    descricao: 'Conceitos básicos para iniciantes'
  },
  {
    id: 'carreiras',
    nome: 'Carreiras Jurídicas',
    icon: <Briefcase className="w-6 h-6" />,
    cor: 'from-blue-600 to-purple-700',
    descricao: 'Guias completos de carreiras'
  },
  {
    id: 'historia',
    nome: 'História do Direito',
    icon: <Landmark className="w-6 h-6" />,
    cor: 'from-stone-500 to-stone-700',
    descricao: 'A evolução através dos séculos'
  },
  {
    id: 'filosofos',
    nome: 'Filósofos',
    icon: <BookOpenCheck className="w-6 h-6" />,
    cor: 'from-indigo-500 to-violet-600',
    descricao: 'Pensadores que moldaram o Direito'
  },
  {
    id: 'curiosidades',
    nome: 'Curiosidades',
    icon: <Lightbulb className="w-6 h-6" />,
    cor: 'from-amber-500 to-orange-600',
    descricao: 'Fatos inusitados do mundo jurídico'
  },
  {
    id: 'termos',
    nome: 'Termos Jurídicos',
    icon: <FileQuestion className="w-6 h-6" />,
    cor: 'from-cyan-500 to-blue-600',
    descricao: 'Vocabulário jurídico essencial'
  },
  {
    id: 'casos',
    nome: 'Casos Famosos',
    icon: <Gavel className="w-6 h-6" />,
    cor: 'from-rose-500 to-red-600',
    descricao: 'Processos históricos do Brasil'
  }
];

// Subcategorias de carreiras (para toggle buttons)
const subcategoriasCarreiras: {
  id: Categoria;
  nome: string;
  icon: React.ReactNode;
  cor: string;
}[] = [
  { id: 'advogado', nome: 'Advogado', icon: <Scale className="w-4 h-4" />, cor: 'from-blue-600 to-blue-800' },
  { id: 'juiz', nome: 'Juiz', icon: <Gavel className="w-4 h-4" />, cor: 'from-purple-600 to-purple-800' },
  { id: 'delegado', nome: 'Delegado', icon: <UserCheck className="w-4 h-4" />, cor: 'from-red-600 to-red-800' },
  { id: 'promotor', nome: 'Promotor', icon: <Gavel className="w-4 h-4" />, cor: 'from-emerald-600 to-emerald-800' },
  { id: 'defensor', nome: 'Defensor', icon: <Shield className="w-4 h-4" />, cor: 'from-cyan-600 to-cyan-800' },
  { id: 'procurador', nome: 'Procurador', icon: <Briefcase className="w-4 h-4" />, cor: 'from-indigo-600 to-indigo-800' },
  { id: 'prf', nome: 'PRF', icon: <Shield className="w-4 h-4" />, cor: 'from-yellow-600 to-yellow-800' },
  { id: 'pf', nome: 'Polícia Federal', icon: <Shield className="w-4 h-4" />, cor: 'from-slate-700 to-slate-900' },
  { id: 'pcivil', nome: 'Polícia Civil', icon: <Shield className="w-4 h-4" />, cor: 'from-stone-600 to-stone-800' },
  { id: 'pmilitar', nome: 'Polícia Militar', icon: <Shield className="w-4 h-4" />, cor: 'from-green-700 to-green-900' }
];

// Todas as categorias para lookup
const todasCategorias = [...categoriasCards.filter(c => c.id !== 'carreiras'), ...subcategoriasCarreiras.map(c => ({
  ...c,
  descricao: c.id === 'advogado' ? 'Da faculdade à advocacia de sucesso' :
             c.id === 'juiz' ? 'O caminho para a magistratura' :
             c.id === 'delegado' ? 'Guia para delegado de polícia' :
             c.id === 'prf' ? 'Policial Rodoviário Federal' : 'Cargos, concurso e carreira'
}))];

const BloggerJuridico = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useSubscription();
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  
  // Ler categoria da URL
  const categoriaFromUrl = searchParams.get('categoria') as Categoria | null;
  const carreiraFromUrl = searchParams.get('carreira') as Categoria | null;
  const mostrarCarreiras = searchParams.get('tipo') === 'carreiras';
  const fromEstudoCarreira = searchParams.get('from') === 'estudo-carreira';
  
  const [carreiraAtiva, setCarreiraAtiva] = useState<Categoria>(carreiraFromUrl || 'advogado');
  
  // Sincronizar carreira ativa com URL
  useEffect(() => {
    if (carreiraFromUrl && carreiraFromUrl !== carreiraAtiva) {
      setCarreiraAtiva(carreiraFromUrl);
    }
  }, [carreiraFromUrl]);
  
  const { getArtigosPorCategoria, loading, getAllCapaUrls } = useBloggerCache();
  
  // Para carreiras, usar a carreira ativa
  const artigosOriginal = mostrarCarreiras 
    ? getArtigosPorCategoria(carreiraAtiva)
    : categoriaFromUrl 
      ? getArtigosPorCategoria(categoriaFromUrl) 
      : [];
  
  // Aplicar limite de 30% para usuários não-premium
  const calcularLimite = (total: number) => Math.max(1, Math.ceil(total * 0.30));
  const limiteVisivel = calcularLimite(artigosOriginal.length);
  const artigos = isPremium ? artigosOriginal : artigosOriginal.slice(0, limiteVisivel);
  const artigosBloqueados = isPremium ? [] : artigosOriginal.slice(limiteVisivel);
  
  const categoriaAtual = todasCategorias.find(c => c.id === (mostrarCarreiras ? carreiraAtiva : categoriaFromUrl));
  const carreiraAtualInfo = subcategoriasCarreiras.find(c => c.id === carreiraAtiva);

  // Preload capas
  const todasAsCapas = getAllCapaUrls();
  useImagePreload(todasAsCapas);

  // Animações rápidas/instantâneas
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0.8 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.1 }
    }
  };

  const handleCarreiraChange = (carreira: Categoria) => {
    setCarreiraAtiva(carreira);
    setSearchParams({ tipo: 'carreiras', carreira });
  };

  const handleVoltar = () => {
    setSearchParams({});
  };

  // Tela de carreiras - só lista de artigos
  if (mostrarCarreiras) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background com imagem */}
        <div className="fixed inset-0 z-0">
          <img
            src={heroBlogJuridico}
            alt="Blog Jurídico"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                hsl(var(--background) / 0.1) 0%,
                hsl(var(--background) / 0.3) 40%,
                hsl(var(--background) / 0.6) 70%,
                hsl(var(--background)) 100%
              )`
            }}
          />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 min-h-screen flex flex-col pb-24">
          {/* Header sticky com blur - mostra nome da carreira */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0 bg-card/80 backdrop-blur-sm hover:bg-card"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">{carreiraAtualInfo?.nome || 'Carreira'}</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-11">{categoriaAtual?.descricao || 'Guia completo da carreira'}</p>
          </div>

          <div className="px-4 py-4">

            {/* Lista de artigos */}
            {loading && artigos.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : artigos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum artigo encontrado para esta carreira.</p>
              </div>
            ) : (
              <>
                <motion.div 
                  key={carreiraAtiva}
                  className="grid gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {artigos.map((artigo, index) => (
                    <motion.div key={artigo.id} variants={cardVariants}>
                      <Card 
                        onClick={() => navigate(`/blogger-juridico/${artigo.categoria}/${artigo.ordem}`)} 
                        className="bg-card/95 backdrop-blur-md border-border/50 hover:bg-card transition-all cursor-pointer group overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary">
                              <CachedImage 
                                src={artigo.url_capa || artigo.imagem_wikipedia} 
                                alt={artigo.titulo} 
                                className="group-hover:scale-105 transition-transform" 
                                priority={index < 5} 
                                fallback={
                                  <div className={`w-full h-full bg-gradient-to-br ${carreiraAtualInfo?.cor} flex items-center justify-center`}>
                                    <span className="text-white font-bold text-xl">{artigo.ordem}</span>
                                  </div>
                                } 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                {artigo.titulo}
                              </h3>
                              {artigo.descricao_curta && (
                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{artigo.descricao_curta}</p>
                              )}
                            </div>
                          </div>
                          {artigo.topicos && artigo.topicos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                              {artigo.topicos.slice(0, 3).map((topico, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                                  {topico}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Artigos bloqueados */}
                  {artigosBloqueados.map((artigo) => (
                    <motion.div key={`locked-${artigo.id}`} variants={cardVariants}>
                      <Card 
                        onClick={() => setShowPremiumCard(true)} 
                        className="bg-card/60 backdrop-blur-md border-border/30 cursor-pointer group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent z-10" />
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="bg-amber-500/20 backdrop-blur-sm rounded-full p-3 border border-amber-500/30">
                            <Lock className="w-5 h-5 text-amber-400" />
                          </div>
                        </div>
                        <div className="p-4 opacity-40">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary">
                              <CachedImage 
                                src={artigo.url_capa || artigo.imagem_wikipedia} 
                                alt={artigo.titulo} 
                                fallback={
                                  <div className={`w-full h-full bg-gradient-to-br ${carreiraAtualInfo?.cor} flex items-center justify-center`}>
                                    <span className="text-white font-bold text-xl">{artigo.ordem}</span>
                                  </div>
                                } 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-foreground font-semibold line-clamp-2">{artigo.titulo}</h3>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Indicador de conteúdo premium */}
                {artigosBloqueados.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          +{artigosBloqueados.length} artigos exclusivos para assinantes
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Desbloqueie todo o conteúdo com o plano Premium
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Premium Floating Card para carreiras */}
        <PremiumFloatingCard 
          isOpen={showPremiumCard} 
          onClose={() => setShowPremiumCard(false)}
          title="Conteúdo Premium"
          description="Este artigo faz parte do conteúdo exclusivo para assinantes. Desbloqueie todas as carreiras jurídicas!"
        />
      </div>
    );
  }

  // Tela de seleção de categorias - USAR TIMELINE COM CURVA
  if (!categoriaFromUrl && !mostrarCarreiras) {
    return <BlogJuridicoTimeline />;
  }

  // Tela de artigos da categoria selecionada
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroBlogJuridico}
          alt="Blog Jurídico"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.1) 0%,
              hsl(var(--background) / 0.3) 40%,
              hsl(var(--background) / 0.6) 70%,
              hsl(var(--background)) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col pb-24">
        {/* Header sticky com blur - padrão Códigos */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoltar}
              className="shrink-0 bg-card/80 backdrop-blur-sm hover:bg-card"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{categoriaAtual?.nome}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">{categoriaAtual?.descricao}</p>
        </div>

        <div className="px-4 py-6">
          {loading && artigos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : artigos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum artigo encontrado para esta categoria.</p>
            </div>
          ) : (
            <>
              <motion.div 
                className="grid gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {artigos.map((artigo, index) => (
                  <motion.div key={artigo.id} variants={cardVariants}>
                    <Card 
                      onClick={() => navigate(`/blogger-juridico/${artigo.categoria}/${artigo.ordem}`)} 
                      className="bg-card/95 backdrop-blur-md border-border/50 hover:bg-card transition-all cursor-pointer group overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary">
                            <CachedImage 
                              src={artigo.url_capa || artigo.imagem_wikipedia} 
                              alt={artigo.titulo} 
                              className="group-hover:scale-105 transition-transform" 
                              priority={index < 5} 
                              fallback={
                                <div className={`w-full h-full bg-gradient-to-br ${categoriaAtual?.cor} flex items-center justify-center`}>
                                  <span className="text-white font-bold text-xl">{artigo.ordem}</span>
                                </div>
                              } 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors line-clamp-2">
                              {artigo.titulo}
                            </h3>
                            {artigo.descricao_curta && (
                              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{artigo.descricao_curta}</p>
                            )}
                          </div>
                        </div>
                        {artigo.topicos && artigo.topicos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                            {artigo.topicos.slice(0, 3).map((topico, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                                {topico}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {/* Artigos bloqueados */}
                {artigosBloqueados.map((artigo) => (
                  <motion.div key={`locked-${artigo.id}`} variants={cardVariants}>
                    <Card 
                      onClick={() => setShowPremiumCard(true)} 
                      className="bg-card/60 backdrop-blur-md border-border/30 cursor-pointer group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-full p-3 border border-amber-500/30">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>
                      <div className="p-4 opacity-40">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary">
                            <CachedImage 
                              src={artigo.url_capa || artigo.imagem_wikipedia} 
                              alt={artigo.titulo} 
                              fallback={
                                <div className={`w-full h-full bg-gradient-to-br ${categoriaAtual?.cor} flex items-center justify-center`}>
                                  <span className="text-white font-bold text-xl">{artigo.ordem}</span>
                                </div>
                              } 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground font-semibold line-clamp-2">{artigo.titulo}</h3>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Indicador de conteúdo premium */}
              {artigosBloqueados.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        +{artigosBloqueados.length} artigos exclusivos para assinantes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desbloqueie todo o conteúdo com o plano Premium
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Premium Floating Card */}
      <PremiumFloatingCard 
        isOpen={showPremiumCard} 
        onClose={() => setShowPremiumCard(false)}
        title="Conteúdo Premium"
        description="Este artigo faz parte do conteúdo exclusivo para assinantes. Desbloqueie todo o Blog Jurídico!"
      />
    </div>
  );
};

export default BloggerJuridico;
