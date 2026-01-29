import { motion } from "framer-motion";
import { Map, BookOpen, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface JornadaBoasVindasProps {
  onComecar: () => void;
}

const beneficios = [
  { icon: BookOpen, titulo: "Estudo Organizado", desc: "Conteúdo estruturado por área do direito" },
  { icon: Calendar, titulo: "Ritmo Flexível", desc: "Escolha sua duração ideal" },
  { icon: Trophy, titulo: "Gamificação", desc: "Conquistas, streaks e estatísticas" },
];

export const JornadaBoasVindas = ({ onComecar }: JornadaBoasVindasProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 py-6"
    >
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Map className="w-10 h-10 text-primary" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold">Jornada Jurídica</h1>
          <p className="text-muted-foreground mt-2">
            Domine o Direito estudando artigo por artigo, no seu ritmo.
          </p>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-3">
        {beneficios.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.titulo}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button onClick={onComecar} className="w-full h-14 text-lg gap-2">
          Começar Minha Jornada
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
