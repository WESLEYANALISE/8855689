import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface AchievementToastProps {
  icone: string;
  nome: string;
  descricao: string;
  onClose: () => void;
}

export const AchievementToast = ({ icone, nome, descricao, onClose }: AchievementToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-4 z-50 bg-gradient-to-r from-amber-900/90 to-yellow-900/90 backdrop-blur-sm border-2 border-amber-500 rounded-lg p-3 shadow-2xl shadow-amber-500/50 max-w-xs transition-all duration-300 ${
        visible ? "animate-slide-in-right opacity-100" : "animate-slide-out-right opacity-0"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{icone}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            <h3 className="font-bold text-amber-400 text-xs">Conquista Desbloqueada!</h3>
          </div>
          <p className="font-semibold text-white text-xs">{nome}</p>
          <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">{descricao}</p>
        </div>
      </div>
    </div>
  );
};
