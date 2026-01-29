import { Flame } from "lucide-react";

interface ComboDisplayProps {
  combo: number;
}

export const ComboDisplay = ({ combo }: ComboDisplayProps) => {
  if (combo < 2) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg animate-scale-in">
      <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
      <div>
        <span className="text-orange-400 font-bold text-lg">COMBO x{combo}</span>
        <p className="text-xs text-orange-300">Argumentações fortes consecutivas!</p>
      </div>
    </div>
  );
};
