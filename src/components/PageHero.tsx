import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface PageHeroProps {
  title: string;
  subtitle: string | React.ReactNode;
  icon: LucideIcon;
  iconGradient: string; // ex: "from-emerald-500/20 to-emerald-600/10"
  iconColor: string; // ex: "text-emerald-400"
  lineColor: string; // ex: "via-emerald-500"
  pageKey?: string; // Key para buscar/gerar background dinâmico via Supabase
  showBackButton?: boolean;
  backPath?: string;
  showGenerateButton?: boolean;
  className?: string;
}

export const PageHero = ({
  title,
  subtitle,
  icon: Icon,
  iconGradient,
  iconColor,
  lineColor,
  pageKey,
  showBackButton = false,
  backPath,
  showGenerateButton = false,
  className = "",
}: PageHeroProps) => {
  const navigate = useNavigate();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (pageKey) {
      loadBackground();
    }
    checkAdminStatus();
  }, [pageKey]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAdmin(user?.email === ADMIN_EMAIL);
  };

  const loadBackground = async () => {
    if (!pageKey) return;
    try {
      const { data } = await supabase
        .from('tres_poderes_config')
        .select('background_url')
        .eq('page_key', pageKey)
        .single();

      if (data?.background_url) {
        setBackgroundUrl(data.background_url);
      }
    } catch (error) {
      console.log('No background found for', pageKey);
    }
  };

  const generateBackground = async () => {
    if (!pageKey) return;
    setIsGeneratingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-background-tres-poderes', {
        body: { pageKey }
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setBackgroundUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating background:', error);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const canShowGenerateButton = showGenerateButton && isAdmin;

  return (
    <div className={`sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 ${className}`}>
      {/* Background Image */}
      {backgroundUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 z-0"
        >
          <img src={backgroundUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background" />
        </motion.div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="flex items-center gap-3">
          {/* Back Button - Always show the black rounded style */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => backPath ? navigate(backPath) : navigate(-1)}
            className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>

          {/* Icon */}
          <div className={`inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br ${iconGradient} shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          {/* Title and Subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm truncate">
              {subtitle}
            </p>
          </div>

          {/* Generate Button (admin only) */}
          {canShowGenerateButton && pageKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={generateBackground}
              disabled={isGeneratingBg}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {isGeneratingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
