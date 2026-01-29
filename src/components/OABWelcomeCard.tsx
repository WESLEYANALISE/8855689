import { useState, useEffect } from "react";
import { X, Gavel, FileText, CheckCircle, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OAB_WELCOME_KEY = "oab-welcome-shown";

const OABWelcomeCard = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já foi mostrado nesta sessão
    const wasShown = sessionStorage.getItem(OAB_WELCOME_KEY);
    if (!wasShown) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(OAB_WELCOME_KEY, "true");
    setIsVisible(false);
  };

  const stats = [
    { icon: Gavel, label: "Exames Completos", value: "7+ exames" },
    { icon: FileText, label: "Questões", value: "641+ questões" },
    { icon: CheckCircle, label: "Todas as Áreas", value: "do Direito" },
    { icon: BarChart3, label: "Feedback", value: "Imediato" },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-card via-card to-card/95 rounded-3xl overflow-hidden shadow-2xl border border-white/10 max-w-md w-full">
              {/* Header com imagem */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
                  alt="Exame da OAB"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">Simulados OAB</span>
                </div>
                
                {/* Botão fechar */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                
                {/* Título sobre a imagem */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                    Exames da OAB
                  </h2>
                </div>
              </div>
              
              {/* Conteúdo */}
              <div className="p-5 space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pratique com <span className="text-primary font-semibold">provas oficiais</span> dos últimos exames da OAB. Receba feedback imediato, comentários detalhados e acompanhe seu desempenho.
                </p>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-xl p-3 border border-white/5"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-foreground font-semibold text-sm">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
                
                {/* Botão CTA */}
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                >
                  Começar a Praticar
                </button>
                
                <p className="text-center text-xs text-muted-foreground">
                  Provas oficiais • FGV • Feedback com IA
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OABWelcomeCard;
