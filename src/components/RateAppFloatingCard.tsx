import { useState, useEffect, memo } from "react";
import { X, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useExternalBrowser } from "@/hooks/use-external-browser";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Links das lojas
const APP_STORE_URL = "https://apps.apple.com/id/app/direito-conte%C3%BAdo-jur%C3%ADdico/id6450845861";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456";

// Storage keys
const LAST_SHOWN_KEY = "rateAppLastShown";
const HAS_RATED_KEY = "rateAppHasRated";

// Intervalo entre exibições (3 dias em milissegundos)
const SHOW_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

const RateAppFloatingCard = () => {
  const { isIOS, isAndroid, isWeb } = useCapacitorPlatform();
  const { openUrl } = useExternalBrowser();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Verifica se já avaliou
    const hasRated = localStorage.getItem(HAS_RATED_KEY) === "true";
    if (hasRated) return;

    // Verifica última exibição
    const lastShownStr = localStorage.getItem(LAST_SHOWN_KEY);
    const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;
    const now = Date.now();

    // Mostra se nunca mostrou ou se passaram 3 dias
    if (!lastShown || now - lastShown >= SHOW_INTERVAL_MS) {
      // Delay para não aparecer instantaneamente
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Atualiza última exibição
        localStorage.setItem(LAST_SHOWN_KEY, String(now));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleRate = async () => {
    // Marca como avaliado para nunca mais mostrar
    localStorage.setItem(HAS_RATED_KEY, "true");
    
    // Determina qual loja abrir
    let storeUrl = PLAY_STORE_URL; // Default Android/Web
    
    if (isIOS) {
      storeUrl = APP_STORE_URL;
    } else if (isAndroid) {
      storeUrl = PLAY_STORE_URL;
    } else if (isWeb) {
      // Web: tenta detectar pelo userAgent
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        storeUrl = APP_STORE_URL;
      } else {
        storeUrl = PLAY_STORE_URL;
      }
    }
    
    // Abre a loja
    await openUrl(storeUrl);
    
    // Fecha o card
    handleClose();
  };

  const handleLater = () => {
    // Apenas fecha, vai mostrar novamente em 3 dias
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleLater}
      />
      
      {/* Card flutuante */}
      <div 
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none transition-all duration-200 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-sm bg-gradient-to-br from-card via-card to-card/95 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20"
        >
          {/* Efeito de brilho no topo */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
          
          {/* Estrelas decorativas */}
          <div className="absolute top-4 right-12 opacity-40">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
          <div className="absolute top-12 left-6 opacity-30">
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="absolute top-8 right-6 opacity-25">
            <Star className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
          
          {/* Botão fechar */}
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Conteúdo */}
          <div className="p-6 pt-8">
            {/* Animação Lottie de estrelas */}
            <div className="flex justify-center mb-2">
              <div className="w-32 h-32">
                <DotLottieReact
                  src="/animations/star-rating.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold text-center text-foreground mb-2">
              Gostando do <span className="text-amber-400">App</span>?
            </h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Sua avaliação nos ajuda a crescer e melhorar cada vez mais! ⭐
            </p>

            {/* 5 estrelas visuais */}
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-8 h-8 text-amber-400 fill-amber-400"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>

            {/* Botões */}
            <div className="space-y-2.5">
              <Button
                onClick={handleRate}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
              >
                <Star className="w-4 h-4 mr-2 fill-white" />
                Avaliar Agora
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleLater}
                className="w-full py-4 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
              >
                Mais Tarde
              </Button>
            </div>

            {/* Mensagem de incentivo */}
            <p className="mt-4 text-xs text-center text-muted-foreground/70">
              Sua opinião faz toda a diferença para nós! 💜
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(RateAppFloatingCard);
