import { Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PremiumChatGateProps {
  onClose?: () => void;
}

export const PremiumChatGate = ({ onClose }: PremiumChatGateProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative max-w-sm w-full bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-amber-500/30 shadow-2xl shadow-amber-500/10"
      >
        {/* Ícone de destaque */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
            <Crown className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Recurso Premium</h3>
          </div>
          
          <p className="text-gray-400 text-sm mb-6">
            Esta funcionalidade é exclusiva para assinantes Premium. 
            Tenha acesso a todos os recursos avançados!
          </p>

          {/* Benefícios */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Com o Premium você tem:</span>
            </div>
            <ul className="text-left text-sm text-gray-300 space-y-1">
              <li>✓ Chat ilimitado com a Professora</li>
              <li>✓ Acesso a todas as trilhas OAB</li>
              <li>✓ Biblioteca completa de materiais</li>
              <li>✓ Flashcards e questões ilimitadas</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/assinatura')}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3"
            >
              <Crown className="w-4 h-4 mr-2" />
              Seja Premium
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-400 hover:text-white hover:bg-white/5"
              >
                Voltar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
