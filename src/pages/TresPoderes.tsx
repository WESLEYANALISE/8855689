import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, Crown, Scale, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TresPoderesTimeline } from "@/components/tres-poderes/TresPoderesTimeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEYS = {
  mobile: 'tres-poderes-bg-mobile',
  tablet: 'tres-poderes-bg-tablet',
  desktop: 'tres-poderes-bg-desktop'
};

interface BackgroundUrls {
  mobile: string | null;
  tablet: string | null;
  desktop: string | null;
}

const TresPoderes = () => {
  const navigate = useNavigate();
  const [backgrounds, setBackgrounds] = useState<BackgroundUrls>(() => ({
    mobile: localStorage.getItem(STORAGE_KEYS.mobile),
    tablet: localStorage.getItem(STORAGE_KEYS.tablet),
    desktop: localStorage.getItem(STORAGE_KEYS.desktop)
  }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar tamanho da tela
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateScreenType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenType('mobile');
      } else if (width < 1024) {
        setScreenType('tablet');
      } else {
        setScreenType('desktop');
      }
    };

    updateScreenType();
    window.addEventListener('resize', updateScreenType);
    return () => window.removeEventListener('resize', updateScreenType);
  }, []);

  useEffect(() => {
    loadBackground();
  }, []);

  const loadBackground = async () => {
    try {
      // Buscar do banco para sincronizar
      const { data } = await supabase
        .from('tres_poderes_config')
        .select('background_url, background_mobile, background_tablet, background_desktop')
        .eq('page_key', 'main')
        .single();

      if (data) {
        const newBackgrounds: BackgroundUrls = {
          mobile: data.background_mobile || data.background_url || null,
          tablet: data.background_tablet || data.background_url || null,
          desktop: data.background_desktop || data.background_url || null
        };
        
        setBackgrounds(newBackgrounds);
        
        // Salvar no localStorage
        if (newBackgrounds.mobile) localStorage.setItem(STORAGE_KEYS.mobile, newBackgrounds.mobile);
        if (newBackgrounds.tablet) localStorage.setItem(STORAGE_KEYS.tablet, newBackgrounds.tablet);
        if (newBackgrounds.desktop) localStorage.setItem(STORAGE_KEYS.desktop, newBackgrounds.desktop);
      }
    } catch (error) {
      console.log('No background found in database');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackground = async () => {
    setIsGenerating(true);
    toast.info('Gerando 3 imagens de fundo (mobile, tablet, desktop)...', { duration: 30000 });
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-background-tres-poderes', {
        body: { pageKey: 'main' }
      });

      if (error) throw error;

      if (data?.images) {
        const newBackgrounds: BackgroundUrls = {
          mobile: data.images.mobile || null,
          tablet: data.images.tablet || null,
          desktop: data.images.desktop || null
        };
        
        setBackgrounds(newBackgrounds);
        
        // Salvar no localStorage
        if (newBackgrounds.mobile) localStorage.setItem(STORAGE_KEYS.mobile, newBackgrounds.mobile);
        if (newBackgrounds.tablet) localStorage.setItem(STORAGE_KEYS.tablet, newBackgrounds.tablet);
        if (newBackgrounds.desktop) localStorage.setItem(STORAGE_KEYS.desktop, newBackgrounds.desktop);
        
        toast.success('Imagens de fundo geradas com sucesso!');
      }
    } catch (error) {
      console.error('Error generating background:', error);
      toast.error('Erro ao gerar imagens de fundo');
    } finally {
      setIsGenerating(false);
    }
  };

  // Selecionar a imagem correta baseada no tamanho da tela
  const currentBackground = backgrounds[screenType];

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background Image */}
      {currentBackground && (
        <motion.div
          key={screenType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={currentBackground}
            alt={`Background ${screenType}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950" />
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-transparent blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-500/10 via-transparent to-transparent blur-3xl"
        />
      </div>

      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <Building2 className="w-5 h-5 text-emerald-400" />
              <Scale className="w-5 h-5 text-purple-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">Os Três Poderes</h1>
              <p className="text-muted-foreground text-sm">Executivo, Legislativo e Judiciário</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={generateBackground}
              disabled={isGenerating}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 pb-24">

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Crown className="w-8 h-8 text-amber-400" />
            </motion.div>
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            >
              <Building2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              <Scale className="w-8 h-8 text-purple-400" />
            </motion.div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            Os Três{" "}
            <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Poderes
            </span>
          </h1>
          
          <p className="text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-2">
            Explore a estrutura do Estado Brasileiro através dos poderes Executivo, Legislativo e Judiciário
          </p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 w-32 md:w-48 mx-auto mt-4 md:mt-6 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
          />
        </motion.div>

        {/* Intro Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto mb-8 md:mb-12"
        >
          <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 shrink-0">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">
                  Separação dos Poderes
                </h2>
                <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
                  A Constituição Federal de 1988 estabelece que os Poderes da União são independentes 
                  e harmônicos entre si. Cada poder possui funções específicas, garantindo o equilíbrio 
                  e a democracia no Brasil.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto">
          <TresPoderesTimeline />
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-8 md:mt-16"
        >
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 text-center">
              <div className="text-xl md:text-3xl font-bold text-amber-400 mb-0.5 md:mb-1">37</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Presidentes</div>
            </div>
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 text-center">
              <div className="text-xl md:text-3xl font-bold text-emerald-400 mb-0.5 md:mb-1">594</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Parlamentares</div>
            </div>
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 text-center">
              <div className="text-xl md:text-3xl font-bold text-purple-400 mb-0.5 md:mb-1">11</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Ministros STF</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TresPoderes;
