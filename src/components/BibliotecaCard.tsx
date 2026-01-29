import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface BibliotecaCardProps {
  area: string;
  capaUrl?: string | null;
  livrosCount: number;
  onClick: () => void;
}

export const BibliotecaCard = ({ area, capaUrl, livrosCount, onClick }: BibliotecaCardProps) => {
  return (
    <Card
      className="cursor-pointer group overflow-hidden border border-accent/20 hover:border-accent/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={area}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-accent group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-semibold text-lg text-white mb-1 drop-shadow-lg">{area}</h3>
          <p className="text-sm text-white/90 font-medium drop-shadow-lg">
            {livrosCount} {livrosCount === 1 ? "livro" : "livros"}
          </p>
        </div>
      </div>
    </Card>
  );
};
