import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import advogadoReuAvatar from "@/assets/advogado-reu-avatar.jpg";

interface AdversarioResponseProps {
  texto: string;
  nomeAdvogado: string;
  genero?: "masculino" | "feminino";
}

const AdversarioResponse = ({ texto, nomeAdvogado, genero = "masculino" }: AdversarioResponseProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-end"
    >
      <Card className="bg-red-900/20 border-red-500/30 max-w-[80%]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border-2 border-red-500/50">
              <AvatarImage src={advogadoReuAvatar} alt={nomeAdvogado} />
              <AvatarFallback className="bg-red-900 text-white">
                {nomeAdvogado.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-red-300 text-sm">{nomeAdvogado}</span>
                <span className="text-xs text-red-400/70">(Parte Contrária)</span>
              </div>
              
              <div className="bg-red-950/30 rounded-lg p-3 border border-red-500/20">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-200 text-sm leading-relaxed italic">
                    "{texto}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdversarioResponse;
