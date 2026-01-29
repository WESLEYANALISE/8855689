import { Headphones, Radio, TrendingUp } from "lucide-react";

interface AudioaulasHeroProps {
  totalAudios: number;
  totalAreas: number;
}

const AudioaulasHero = ({ totalAudios, totalAreas }: AudioaulasHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--gradient-purple-start))] via-[hsl(var(--gradient-purple-end))] to-[hsl(var(--gradient-pink-end))] p-6 mb-6">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Hub de Audioaulas</h1>
            <p className="text-white/70 text-sm">Aprenda ouvindo, em qualquer lugar</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-5">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <Radio className="w-4 h-4 text-white/80" />
            <span className="text-white font-semibold">{totalAudios}+</span>
            <span className="text-white/70 text-sm">áudios</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <TrendingUp className="w-4 h-4 text-white/80" />
            <span className="text-white font-semibold">{totalAreas}</span>
            <span className="text-white/70 text-sm">áreas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioaulasHero;
