import { useEffect, useState } from "react";

interface PointsAnimationProps {
  pontos: number;
  tipo: "ganho" | "perda";
}

export const PointsAnimation = ({ pontos, tipo }: PointsAnimationProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`absolute -top-8 right-0 font-bold text-lg animate-fade-in ${
        tipo === "ganho" ? "text-green-400" : "text-red-400"
      }`}
      style={{ animation: "float-up 2s ease-out forwards" }}
    >
      {tipo === "ganho" ? "+" : "-"}
      {Math.abs(pontos)} pts
    </div>
  );
};
