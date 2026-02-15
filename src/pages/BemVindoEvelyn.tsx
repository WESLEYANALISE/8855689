import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/PhoneInput';
import { ArrowLeft, Check, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const YOUTUBE_VIDEO_ID = 'HlE9u1c_MPQ';

const BemVindoEvelyn = () => {
  const navigate = useNavigate();
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullNumber, setFullNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleYes = useCallback(() => {
    setShowPhoneForm(true);
  }, []);

  const handleNo = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handlePhoneChange = useCallback((local: string, full: string) => {
    setPhoneNumber(local);
    setFullNumber(full);
  }, []);

  const handleConfirmPhone = useCallback(() => {
    const clean = fullNumber.replace(/\D/g, '');
    if (clean.length < 12) return; // DDI + DDD + número mínimo

    // Save to localStorage with expiry (24h)
    const data = {
      phone: clean,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    localStorage.setItem('evelyn_whatsapp', JSON.stringify(data));
    setConfirmed(true);

    setTimeout(() => {
      navigate('/auth?mode=signup');
    }, 2000);
  }, [fullNumber, navigate]);

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

        {/* Question */}
        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold text-center">
                A Evelyn vai te enviar uma mensagem em breve! 🎉
              </p>
              <p className="text-white/50 text-xs">Redirecionando...</p>
            </motion.div>
          ) : !showPhoneForm ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-sm flex flex-col items-center gap-4"
            >
              <p className="text-center text-sm text-white/80 font-medium">
                Quer que a Evelyn te envie uma mensagem para você interagir com ela?
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  size="lg"
                  onClick={handleYes}
                  className="w-full py-6 rounded-full font-bold text-base"
                >
                  Sim, quero! 🙋‍♀️
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleNo}
                  className="w-full py-6 rounded-full text-white/60 hover:text-white hover:bg-white/10 font-medium"
                >
                  Não, obrigado
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="phone-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm flex flex-col items-center gap-4"
            >
              <p className="text-center text-sm text-white/80 font-medium">
                Insira seu número de WhatsApp:
              </p>
              <PhoneInput
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="w-full"
              />
              <Button
                size="lg"
                onClick={handleConfirmPhone}
                disabled={fullNumber.replace(/\D/g, '').length < 12}
                className="w-full py-6 rounded-full font-bold text-base"
              >
                Confirmar número
              </Button>
              <button
                onClick={handleNo}
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Pular esta etapa
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BemVindoEvelyn;
