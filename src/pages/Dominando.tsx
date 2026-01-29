import { useNavigate } from "react-router-dom";
import { X, Footprints, ArrowRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import dominandoHero from "@/assets/dominando-hero-themis.webp";
import sunsetBackground from "@/assets/sunset-background.webp";

const Dominando = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image - Pôr do sol com blur ofuscado */}
      <div className="absolute inset-0 z-0">
        <img 
          src={sunsetBackground} 
          alt="" 
          className="w-full h-full object-cover blur-[3px] brightness-75"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Card Principal */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
          
          {/* Capa com botão de fechar */}
          <div className="relative h-56 md:h-72">
            <img 
              src={dominandoHero} 
              alt="Dominando o Direito" 
              className="w-full h-full object-cover"
            />
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            
            {/* Botão Fechar (X) */}
            <button 
              onClick={() => navigate('/?tab=iniciante')} 
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all border border-white/20 group"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Badge flutuante */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Trilhas de Domínio
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="p-6 space-y-5">
            {/* Título e descrição */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Domine o Direito
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Estude todas as áreas jurídicas na ordem cronológica ideal e torne-se um especialista completo.
              </p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <span className="text-2xl font-bold text-red-500">24+</span>
                <p className="text-xs text-muted-foreground mt-0.5">Áreas</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <span className="text-2xl font-bold text-red-500">100+</span>
                <p className="text-xs text-muted-foreground mt-0.5">Disciplinas</p>
              </div>
            </div>

            {/* Botão CTA */}
            <motion.button 
              onClick={() => navigate('/dominando/trilhas')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl text-base font-semibold transition-all shadow-lg shadow-red-900/30"
            >
              <Footprints className="w-5 h-5" />
              Acessar Trilhas
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dominando;
