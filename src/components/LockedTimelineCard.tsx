 import { Lock, Crown, Footprints } from 'lucide-react';
 import { motion } from 'framer-motion';
 import { cn } from '@/lib/utils';
 
 interface LockedTimelineCardProps {
   title: string;
   subtitle?: string;
   imageUrl?: string;
   isLeft: boolean;
   index: number;
   onClick: () => void;
 }
 
 export const LockedTimelineCard = ({
   title,
   subtitle,
   imageUrl,
   isLeft,
   index,
   onClick,
 }: LockedTimelineCardProps) => {
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
       {/* Marcador Pegada no centro - BLOQUEADO (dourado) */}
       <div className="absolute left-1/2 -translate-x-1/2 z-10">
         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/80 to-amber-700/80 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-400/40">
           <Lock className="w-4 h-4 text-white" />
         </div>
       </div>
       
       {/* Card Bloqueado */}
       <div className="w-full">
         <motion.button
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={onClick}
           className="w-full rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-amber-500/30 hover:border-amber-400/50 transition-all overflow-hidden min-h-[200px] flex flex-col text-left"
         >
           {/* Capa com overlay escuro */}
           <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
             {imageUrl ? (
               <img
                 src={imageUrl}
                 alt={title}
                 className="w-full h-full object-cover opacity-40 blur-[1px]"
                 loading="lazy"
               />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
             )}
             
             {/* Overlay escuro */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
             
             {/* Badge Premium */}
             <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold shadow-lg">
               <Crown className="w-3 h-3" />
               Premium
             </div>
             
             {/* Cadeado centralizado */}
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center backdrop-blur-sm">
                 <Lock className="w-5 h-5 text-amber-400" />
               </div>
             </div>
           </div>
           
           {/* Conteúdo */}
           <div className="flex-1 p-3 flex flex-col">
             <div className="flex-1">
               {subtitle && (
                 <p className="text-xs text-amber-400/70 font-semibold mb-1">
                   {subtitle}
                 </p>
               )}
               <h3 className="font-medium text-[13px] leading-snug text-muted-foreground line-clamp-2">
                 {title}
               </h3>
             </div>
             
             {/* Indicador Premium */}
             <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500">
               <Crown className="w-3.5 h-3.5" />
               <span className="font-medium">Desbloqueie com Premium</span>
             </div>
           </div>
         </motion.button>
       </div>
     </motion.div>
   );
 };
 
 export default LockedTimelineCard;