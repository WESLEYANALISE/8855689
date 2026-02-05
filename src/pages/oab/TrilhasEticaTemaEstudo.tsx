 import { useState, useRef, useEffect } from "react";
 import { useNavigate, useParams } from "react-router-dom";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { motion } from "framer-motion";
 import { 
   ArrowLeft, Loader2, Sparkles, Play, Pause, RotateCcw,
   Volume2, VolumeX, BookOpen, FileText
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
 import bgTrilhasOab from "@/assets/bg-trilhas-oab.webp";
 
// Interface estendida para incluir colunas de conteúdo
interface EticaTemaWithContent {
  id: number;
  titulo: string;
  ordem: number;
  pagina_inicial: number | null;
  pagina_final: number | null;
  status: string | null;
  capa_url: string | null;
  conteudo_markdown?: string | null;
  audio_url?: string | null;
  resumo?: string | null;
  flashcards?: any;
  questoes?: any;
  termos?: any;
  exemplos?: any;
}

 const TrilhasEticaTemaEstudo = () => {
   const navigate = useNavigate();
   const { temaId } = useParams();
   const queryClient = useQueryClient();
   const audioRef = useRef<HTMLAudioElement>(null);
   
   const [isPlaying, setIsPlaying] = useState(false);
   const [audioProgress, setAudioProgress] = useState(0);
   const [playbackSpeed, setPlaybackSpeed] = useState(1);
   
   // Buscar tema
  const { data: tema, isLoading, refetch } = useQuery<EticaTemaWithContent>({
     queryKey: ["oab-etica-tema-estudo", temaId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("oab_etica_temas")
        .select("id, titulo, ordem, pagina_inicial, pagina_final, status, capa_url, conteudo_markdown, audio_url, resumo, flashcards, questoes, termos, exemplos")
         .eq("id", parseInt(temaId!))
         .single();
 
       if (error) throw error;
      return data as EticaTemaWithContent;
     },
     enabled: !!temaId,
     refetchInterval: (query) => {
       const data = query.state.data;
       if (data?.status === "gerando") return 3000;
       return false;
     },
   });
 
   // Mutation para gerar conteúdo
   const gerarConteudoMutation = useMutation({
     mutationFn: async () => {
       // Primeiro, atualiza o status para "gerando"
       await supabase
         .from("oab_etica_temas")
         .update({ status: "gerando" })
         .eq("id", parseInt(temaId!));
       
       const { data, error } = await supabase.functions.invoke("gerar-conteudo-etica-oab", {
         body: { tema_id: parseInt(temaId!) },
       });
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       toast.success("Conteúdo gerado com sucesso!");
       queryClient.invalidateQueries({ queryKey: ["oab-etica-tema-estudo", temaId] });
     },
     onError: (error: Error) => {
       toast.error("Erro ao gerar conteúdo: " + error.message);
       // Reverter status em caso de erro
       supabase
         .from("oab_etica_temas")
         .update({ status: "pendente" })
         .eq("id", parseInt(temaId!));
     },
   });
 
   // Audio controls
   const togglePlayback = () => {
     if (!audioRef.current) return;
     if (isPlaying) {
       audioRef.current.pause();
     } else {
       audioRef.current.play();
     }
     setIsPlaying(!isPlaying);
   };
 
   const cycleSpeed = () => {
     const speeds = [1, 1.25, 1.5, 1.75, 2];
     const currentIndex = speeds.indexOf(playbackSpeed);
     const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
     setPlaybackSpeed(nextSpeed);
     if (audioRef.current) {
       audioRef.current.playbackRate = nextSpeed;
     }
   };
 
   useEffect(() => {
     const audio = audioRef.current;
     if (!audio) return;
     
     const updateProgress = () => {
       setAudioProgress((audio.currentTime / audio.duration) * 100 || 0);
     };
     
     audio.addEventListener('timeupdate', updateProgress);
     audio.addEventListener('ended', () => setIsPlaying(false));
     
     return () => {
       audio.removeEventListener('timeupdate', updateProgress);
       audio.removeEventListener('ended', () => setIsPlaying(false));
     };
   }, [tema?.audio_url]);
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-red-500" />
       </div>
     );
   }
 
   const isGerando = tema?.status === "gerando";
   const temConteudo = !!tema?.conteudo_markdown;
 
   return (
     <div className="min-h-screen relative">
       {/* Background */}
       <div className="fixed inset-0">
         <img 
           src={bgTrilhasOab}
           alt=""
           className="w-full h-full object-cover opacity-30"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/80 via-[#0d0d14]/90 to-[#0d0d14]" />
       </div>
       
       <div className="relative z-10">
         {/* Header */}
         <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
           <div className="max-w-3xl mx-auto px-4 py-3">
             <button 
               onClick={() => navigate('/oab/trilhas-etica')}
               className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
             >
               <ArrowLeft className="w-5 h-5" />
               <span className="text-sm font-medium">Voltar</span>
             </button>
           </div>
         </div>
 
         {/* Hero */}
         <div className="px-4 pt-6 pb-4">
           <div className="max-w-3xl mx-auto">
             <div className="flex items-start gap-4">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                 <span className="text-lg font-bold text-white">{String(tema?.ordem).padStart(2, '0')}</span>
               </div>
               <div>
                 <span className="text-xs text-red-400">Ética Profissional</span>
                 <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                   {tema?.titulo}
                 </h1>
                 {tema?.pagina_inicial && tema?.pagina_final && (
                   <p className="text-sm text-gray-400 mt-1">
                     Páginas {tema.pagina_inicial} - {tema.pagina_final}
                   </p>
                 )}
               </div>
             </div>
           </div>
         </div>
 
         {/* Content Area */}
         <div className="px-4 pb-24">
           <div className="max-w-3xl mx-auto">
             {/* Estado: Gerando */}
             {isGerando && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl p-8 text-center"
               >
                 <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-white mb-2">
                   Gerando conteúdo...
                 </h3>
                 <p className="text-sm text-gray-400">
                   Aguarde enquanto processamos o material
                 </p>
               </motion.div>
             )}
 
             {/* Estado: Sem conteúdo */}
             {!isGerando && !temConteudo && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-[#12121a]/90 border border-white/10 rounded-2xl p-8 text-center"
               >
                 <BookOpen className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-white mb-2">
                   Conteúdo não gerado
                 </h3>
                 <p className="text-sm text-gray-400 mb-6">
                   Clique no botão abaixo para gerar o conteúdo de estudo
                 </p>
                 <Button
                   onClick={() => gerarConteudoMutation.mutate()}
                   disabled={gerarConteudoMutation.isPending}
                   className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                 >
                   {gerarConteudoMutation.isPending ? (
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   ) : (
                     <Sparkles className="w-4 h-4 mr-2" />
                   )}
                   Gerar Conteúdo
                 </Button>
               </motion.div>
             )}
 
             {/* Estado: Com conteúdo */}
             {!isGerando && temConteudo && (
               <div className="space-y-6">
                 {/* Audio Player */}
                 {tema?.audio_url && (
                   <div className="bg-[#12121a]/90 border border-white/10 rounded-xl p-4">
                     <audio ref={audioRef} src={tema.audio_url} preload="metadata" />
                     <div className="flex items-center gap-4">
                       <button
                         onClick={togglePlayback}
                         className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                       >
                         {isPlaying ? (
                           <Pause className="w-5 h-5 text-white" />
                         ) : (
                           <Play className="w-5 h-5 text-white ml-0.5" />
                         )}
                       </button>
                       <div className="flex-1">
                         <Progress value={audioProgress} className="h-2" />
                       </div>
                       <button
                         onClick={cycleSpeed}
                         className="px-2 py-1 rounded bg-white/10 text-xs font-mono text-white"
                       >
                         {playbackSpeed}x
                       </button>
                     </div>
                   </div>
                 )}
 
                 {/* Markdown Content */}
                 <div className="bg-[#12121a]/90 border border-white/10 rounded-2xl p-6">
                   <EnrichedMarkdownRenderer 
                     content={tema?.conteudo_markdown || ""} 
                     fontSize={15}
                   />
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default TrilhasEticaTemaEstudo;