import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const YOUTUBE_VIDEO_ID = 'HlE9u1c_MPQ';

const BemVindoEvelyn = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-8 overflow-y-auto">
        {/* Video */}
        <div className="w-full max-w-md aspect-video rounded-2xl overflow-hidden mb-6 shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
            title="Conheça a Evelyn"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center max-w-md mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </div>
          <h1 className="text-2xl font-bold mb-3">
            Conheça a <span className="text-primary">Evelyn</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Sua assistente pessoal jurídica no WhatsApp. Ela entende{' '}
            <strong className="text-white">áudio, texto, imagem e PDF</strong> — tire dúvidas, peça resumos, envie provas e muito mais!
          </p>
        </motion.div>

        {/* Botão Continuar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm"
        >
          <Button
            size="lg"
            onClick={() => navigate('/auth?mode=signup')}
            className="w-full py-6 rounded-full font-bold text-base"
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BemVindoEvelyn;
