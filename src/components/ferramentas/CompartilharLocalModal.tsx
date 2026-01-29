import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Mail, Link2, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatLocalForWhatsApp, formatLocalForEmail, generateShareLink } from "@/lib/formatLocalJuridico";

interface LocalJuridico {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  aberto: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  tipo: string;
  googleMapsUrl: string;
  website?: string;
}

interface CompartilharLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  local: LocalJuridico;
}

export function CompartilharLocalModal({ isOpen, onClose, local }: CompartilharLocalModalProps) {
  const [copiado, setCopiado] = useState(false);

  const compartilharWhatsApp = () => {
    const texto = formatLocalForWhatsApp(local);
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
    onClose();
  };

  const compartilharEmail = () => {
    const { subject, body } = formatLocalForEmail(local);
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    onClose();
  };

  const copiarLink = async () => {
    const link = generateShareLink(local);
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => {
        setCopiado(false);
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-teal-500/10">
                    <Share2 className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compartilhar</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {local.nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Opções */}
              <div className="p-4 space-y-3">
                <button
                  onClick={compartilharWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-[#25D366] text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium group-hover:text-[#25D366] transition-colors">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Enviar para contato ou grupo</p>
                  </div>
                </button>

                <button
                  onClick={compartilharEmail}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-blue-500 text-white">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium group-hover:text-blue-500 transition-colors">Email</p>
                    <p className="text-xs text-muted-foreground">Enviar por email</p>
                  </div>
                </button>

                <button
                  onClick={copiarLink}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-purple-500 text-white">
                    {copiado ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium group-hover:text-purple-500 transition-colors">
                      {copiado ? 'Copiado!' : 'Copiar Link'}
                    </p>
                    <p className="text-xs text-muted-foreground">Copiar link para compartilhar</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
