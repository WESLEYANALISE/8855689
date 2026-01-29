import { Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface JornadaStreakCardProps {
  streakAtual: number;
  maiorStreak: number;
}

export const JornadaStreakCard = ({ streakAtual, maiorStreak }: JornadaStreakCardProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/30">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{streakAtual}</p>
              <p className="text-xs text-muted-foreground">Dias seguidos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/30">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{maiorStreak}</p>
              <p className="text-xs text-muted-foreground">Maior streak</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
