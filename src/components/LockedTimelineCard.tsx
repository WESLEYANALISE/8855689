import { Lock, Crown, Footprints, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { UniversalImage } from '@/components/ui/universal-image';

interface LockedTimelineCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isLeft: boolean;
  index: number;
  topicosCount?: number;
  onClick?: () => void;
}

export const LockedTimelineCard = ({
  title,
  subtitle,
  imageUrl,
  isLeft,
  index,
  topicosCount,
  onClick,
}: LockedTimelineCardProps) => {
  const navigate = useNavigate();
  
  // Redirecionar direto para assinatura
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/assinatura');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative flex items-center",
        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
      )}
    >
      {/* Marcador Pegada no centro - Estilo Premium (dourado) */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 0 0 rgba(251, 191, 36, 0.3)",
              "0 0 0 8px rgba(251, 191, 36, 0)",
              "0 0 0 0 rgba(251, 191, 36, 0)"
            ]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity,
            delay: index * 0.2
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30"
        >
          <Footprints className="w-5 h-5 text-white" />
        </motion.div>
      </div>
      
      {/* Card com capa visível (sem blur) */}
      <div className="w-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-amber-500/30 hover:border-amber-400/50 transition-all overflow-hidden min-h-[200px] flex flex-col"
        >
          {/* Capa visível normalmente */}
          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
            {imageUrl ? (
              <>
                <UniversalImage
                  src={imageUrl}
                  alt={title}
                  priority={index < 6}
                  blurCategory="course"
                  containerClassName="w-full h-full"
                />
                {/* Gradiente lateral para contraste do texto */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            
            {/* Badge Premium no canto */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold shadow-lg">
              <Crown className="w-3 h-3" />
              Premium
            </div>
            
            {/* Tema dentro da capa */}
            {subtitle && (
              <div className="absolute bottom-2 left-3">
                <p className="text-xs text-amber-400 font-semibold drop-shadow-lg">
                  {subtitle}
                </p>
              </div>
            )}
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 p-3 flex flex-col">
            <div className="flex-1">
              <h3 className="font-medium text-[13px] leading-snug text-white">
                {title}
              </h3>
              
              {/* Contagem de tópicos se disponível */}
              {topicosCount !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <BookOpen className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">{topicosCount} tópicos</span>
                </div>
              )}
            </div>
            
            {/* Barra Premium no lugar da barra de progresso */}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Conteúdo Premium
                </span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LockedTimelineCard;