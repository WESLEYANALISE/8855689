import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Sparkles, ArrowRight, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

interface PremiumSuccessCardProps {
  isVisible: boolean;
  planType?: string;
  amount?: number;
  onClose?: () => void;
}

// Partículas flutuantes douradas
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 20,
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: -20,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Função para disparar confetti épico
const launchEpicConfetti = () => {
  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#10b981', '#a855f7'];
  
  // Explosão inicial central
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.6, x: 0.5 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.2,
  });

  // Chuva contínua dos lados
  const duration = 4000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      scalar: 0.9,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};

export default function PremiumSuccessCard({ 
  isVisible, 
  planType = 'mensal', 
  amount = 0,
  onClose 
}: PremiumSuccessCardProps) {
  const navigate = useNavigate();
  const hasLaunched = useRef(false);

  useEffect(() => {
    if (isVisible && !hasLaunched.current) {
      hasLaunched.current = true;
      
      // Pequeno delay para garantir que a UI renderizou
      setTimeout(() => {
        launchEpicConfetti();
      }, 300);
    }
  }, [isVisible]);

  const handleExplore = () => {
    onClose?.();
    navigate('/');
  };

  const getPlanLabel = () => {
    switch (planType) {
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'vitalicio': return 'Vitalício';
      default: return 'Premium';
    }
  };

  const benefits = [
    'Vade Mecum Completo',
    'Videoaulas Ilimitadas',
    'Professora IA 24h',
    'Simulados e Questões',
    'Sem Anúncios'
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        >
          {/* Partículas flutuantes */}
          <FloatingParticles />

          {/* Glow central pulsante */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Card principal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/90 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl shadow-amber-500/30"
          >
            {/* Efeitos decorativos */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative p-8 flex flex-col items-center text-center">
              {/* Ícone da coroa com efeitos */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="relative mb-6"
              >
                {/* Ring animado ao redor */}
                <motion.div
                  className="absolute -inset-4 rounded-full border-2 border-amber-500/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-amber-500/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                
                {/* Círculo com coroa */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50"
                  animate={{ 
                    boxShadow: [
                      "0 0 30px rgba(245, 158, 11, 0.5)",
                      "0 0 60px rgba(245, 158, 11, 0.8)",
                      "0 0 30px rgba(245, 158, 11, 0.5)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={2.5} />
                </motion.div>

                {/* Sparkles animadas */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2"
                >
                  <Sparkles className="absolute -top-1 right-0 w-5 h-5 text-amber-400" />
                  <Star className="absolute bottom-0 -left-1 w-4 h-4 text-amber-300 fill-amber-300" />
                  <Zap className="absolute top-1/2 -right-3 w-4 h-4 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Título animado */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
              >
                Parabéns! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-amber-400 font-semibold mb-6"
              >
                Você agora é Premium!
              </motion.p>

              {/* Detalhes do plano */}
              {amount > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full bg-white/5 rounded-2xl p-4 mb-6 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400 text-sm">Plano</span>
                    <span className="text-white font-medium">{getPlanLabel()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Valor</span>
                    <span className="text-amber-400 font-medium">
                      R$ {amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Lista de benefícios */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6"
              >
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-zinc-300 text-sm">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Botão CTA */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="w-full"
              >
                <Button
                  onClick={handleExplore}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Começar a usar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}