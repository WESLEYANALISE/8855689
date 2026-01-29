import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Shield, 
  Zap, 
  Gift, 
  Clock, 
  ArrowRight, 
  Check,
  Sparkles,
  Heart,
  Target,
  BookOpen,
  Users,
  Award,
  Volume2,
  Loader2,
  Pause,
  Infinity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const NARRACAO_KEY = 'sobre_planos_narracao_v2';

const SobrePlanos = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Texto completo para narração
  const textoNarracao = `
    Sua Jornada Jurídica Começa Aqui.
    
    Imagine ter acesso a todas as ferramentas que você precisa para se tornar um profissional do Direito de excelência. Essa é a proposta do Direito Premium.
    
    Por que ser Premium?
    
    Estudar Direito é desafiador. São milhares de artigos, códigos, súmulas e jurisprudências que você precisa dominar. Fazer isso sozinho, com materiais espalhados pela internet, pode levar anos a mais do que o necessário.
    
    Com o Direito Premium, você tem tudo em um só lugar: Vade Mecum completo, videoaulas, audioaulas, flashcards inteligentes, questões OAB, simulados, uma professora IA disponível 24 horas, e muito mais.
    
    Economize tempo, estude de forma inteligente e acelere sua carreira.
    
    Conheça nossos planos:
    
    Plano Mensal por R$ 21,90. Ideal para quem busca flexibilidade total. Perfeito se você quer experimentar o app, ou precisa de acesso por um período específico. São 30 dias de acesso completo.
    
    Plano Trimestral por R$ 49,90, o mais econômico! Com economia de 24%, você garante 90 dias de acesso a todas as funcionalidades premium. Ideal para quem está se preparando para a OAB ou concursos.
    
    Plano Vitalício por R$ 179,90. Pague uma única vez e tenha acesso para sempre! Sem mensalidades, sem renovações. Acesso permanente a todas as funcionalidades premium.
    
    Sua segurança é prioridade. Pagamento processado com segurança pelo Mercado Pago. Seus dados estão protegidos e criptografados.
    
    Pronto para começar? Volte à aba Planos e escolha o seu! Acesso liberado imediatamente após a aprovação do pagamento.
  `.trim();

  // Verificar se já existe narração salva
  useEffect(() => {
    const checkExistingNarration = async () => {
      try {
        const { data, error } = await supabase
          .from('BLOGGER_JURIDICO')
          .select('url_audio')
          .eq('titulo', NARRACAO_KEY)
          .single();

        if (data?.url_audio) {
          setAudioUrl(data.url_audio);
        }
      } catch (err) {
        // Não existe, usuário pode gerar
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingNarration();
  }, []);

  const generateNarration = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-narracao', {
        body: { 
          texto: textoNarracao, 
          categoria: 'sobre_planos',
          ordem: 0
        }
      });

      if (error) throw error;

      if (data?.audioUrls?.[0]) {
        setAudioUrl(data.audioUrls[0]);
        toast({
          title: "Narração gerada!",
          description: "Agora você pode ouvir sobre os planos.",
        });
      }
    } catch (err) {
      console.error('Erro ao gerar narração:', err);
      toast({
        title: "Erro ao gerar narração",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Audio Element */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnd}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Introdução Storytelling */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10">
            <Crown className="w-7 h-7 text-amber-500" />
          </div>
          
          {/* Botão de Narração */}
          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={audioUrl ? togglePlay : generateNarration}
              disabled={isGenerating}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : audioUrl ? (
                <>
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pausar' : 'Ouvir'}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Gerar Narração
                </>
              )}
            </Button>
          )}
        </div>
        
        <h2 className="text-2xl font-bold font-playfair">
          Sua Jornada Jurídica <span className="text-amber-500">Começa Aqui</span>
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
          Imagine ter acesso a todas as ferramentas que você precisa para se tornar um profissional 
          do Direito de excelência. Essa é a proposta do <span className="text-amber-500 font-medium">Direito Premium</span>.
        </p>
      </motion.section>

      {/* Seção: Por que ser Premium? */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-zinc-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-semibold">Por que ser Premium?</h3>
        </div>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <span className="text-amber-500 font-medium">Estudar Direito é desafiador.</span> São milhares de artigos, 
            códigos, súmulas e jurisprudências que você precisa dominar. Fazer isso sozinho, com materiais 
            espalhados pela internet, pode levar anos a mais do que o necessário.
          </p>
          <p>
            Com o <span className="text-white font-medium">Direito Premium</span>, você tem tudo em um só lugar: 
            Vade Mecum completo, videoaulas, audioaulas, flashcards inteligentes, questões OAB, simulados, 
            uma professora IA disponível 24 horas, e muito mais.
          </p>
          <p>
            <span className="text-emerald-400">Economize tempo, estude de forma inteligente e acelere sua carreira.</span>
          </p>
        </div>
      </motion.section>

      {/* O que você terá acesso */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">O que você terá acesso?</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: BookOpen, title: "Vade Mecum Completo", desc: "Todos os códigos, leis e estatutos atualizados" },
            { icon: Target, title: "+10.000 Questões OAB", desc: "Banco completo para sua preparação" },
            { icon: Users, title: "Professora IA 24h", desc: "Tire dúvidas a qualquer momento" },
            { icon: Award, title: "Certificados", desc: "Comprove sua evolução nos estudos" },
          ].map((item, index) => (
            <div 
              key={item.title}
              className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">{item.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 text-center">
          E mais de 100 outras funcionalidades exclusivas!
        </p>
      </motion.section>

      {/* Plano Mensal */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#141415] border border-zinc-800 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-bold">Plano Mensal</h3>
        </div>

        <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
          <p>
            O <span className="text-white font-medium">Plano Mensal</span> é ideal para quem busca flexibilidade 
            total. Perfeito se você quer experimentar o app, ou precisa de acesso por um período específico, 
            como durante uma prova ou semestre.
          </p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span>Como funciona:</span>
          </div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p><span className="text-white">Pagamento único de R$ 21,90</span> via PIX</p>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>Acesso por <span className="text-white">30 dias</span> a todas as funcionalidades</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Flexibilidade total", "30 dias de acesso", "Sem renovação automática"].map((tag) => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full px-3 py-1"
            >
              <Check className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-3xl font-bold text-white">R$ 21,90</span>
        </div>
      </motion.section>

      {/* Plano Trimestral - Featured */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-50" />
        
        <div className="relative bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-amber-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold">Plano Trimestral</h3>
            </div>
            <span className="text-xs font-medium bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
              MAIS ECONÔMICO
            </span>
          </div>

          <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
            <p>
              O <span className="text-white font-medium">Plano Trimestral</span> é perfeito para quem quer economizar. 
              Com <span className="text-amber-500">24% de economia</span> em relação ao mensal, você garante 
              <span className="text-amber-500"> 90 dias completos</span> de acesso.
            </p>
            <p>
              Ideal para quem está se preparando para a <span className="text-white">OAB</span>, concursos públicos, 
              ou simplesmente quer se destacar na faculdade de Direito.
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Como funciona:</span>
            </div>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p><span className="text-white">Pagamento único de R$ 49,90</span> via PIX</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p>Equivale a <span className="text-emerald-400">R$ 16,63 por mês</span></p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p>Acesso por <span className="text-white">90 dias</span> a todas as funcionalidades</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["24% de economia", "Sem renovação automática", "90 dias de acesso"].map((tag) => (
              <span 
                key={tag}
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1"
              >
                <Check className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-baseline gap-2 pt-2">
            <span className="text-3xl font-bold text-white">R$ 49,90</span>
            <span className="text-xs text-zinc-500 ml-2">(R$ 16,63/mês)</span>
          </div>
        </div>
      </motion.section>

      {/* Plano Vitalício */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#141415] border border-zinc-800 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <Infinity className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold">Plano Vitalício</h3>
        </div>

        <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
          <p>
            O <span className="text-white font-medium">Plano Vitalício</span> é para quem quer investir uma única vez 
            e ter <span className="text-emerald-400">acesso para sempre</span>. Sem mensalidades, sem renovações, 
            sem preocupações.
          </p>
          <p>
            Perfeito para quem está começando a carreira jurídica e quer ter um companheiro de estudos 
            para a vida toda.
          </p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span>Como funciona:</span>
          </div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p><span className="text-white">Pagamento único de R$ 179,90</span> via PIX</p>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p><span className="text-emerald-400">Acesso vitalício</span> - para sempre!</p>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>Todas as atualizações futuras inclusas</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Pagamento único", "Acesso vitalício", "Sem mensalidades"].map((tag) => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1"
            >
              <Check className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-3xl font-bold text-white">R$ 179,90</span>
          <span className="text-xs text-emerald-400 ml-2">pagamento único</span>
        </div>
      </motion.section>

      {/* Comparativo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Qual plano escolher?
        </h3>
        <div className="bg-[#141415] border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-500 font-medium">Característica</th>
                <th className="text-center p-3 text-zinc-400 font-medium">Mensal</th>
                <th className="text-center p-3 text-amber-500 font-medium">Trimestral</th>
                <th className="text-center p-3 text-zinc-400 font-medium">Vitalício</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800/50">
                <td className="p-3">Valor</td>
                <td className="text-center p-3">R$ 21,90</td>
                <td className="text-center p-3 text-white font-medium">R$ 49,90</td>
                <td className="text-center p-3">R$ 179,90</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="p-3">Custo por mês</td>
                <td className="text-center p-3">R$ 21,90</td>
                <td className="text-center p-3 text-emerald-400 font-medium">R$ 16,63</td>
                <td className="text-center p-3 text-emerald-400">Único</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="p-3">Duração</td>
                <td className="text-center p-3">30 dias</td>
                <td className="text-center p-3">90 dias</td>
                <td className="text-center p-3 text-emerald-400">Para sempre</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="p-3">Economia</td>
                <td className="text-center p-3">—</td>
                <td className="text-center p-3 text-emerald-400 font-medium">24%</td>
                <td className="text-center p-3">—</td>
              </tr>
              <tr>
                <td className="p-3">Ideal para</td>
                <td className="text-center p-3 text-xs">Experimentar</td>
                <td className="text-center p-3 text-xs">OAB/Concursos</td>
                <td className="text-center p-3 text-xs">Carreira longa</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Garantias */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-semibold text-emerald-400">Sua segurança é prioridade</h3>
        </div>
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p>Pagamento processado com segurança pelo <span className="text-white">Mercado Pago</span></p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p>Seus dados estão protegidos e criptografados</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p>Suporte dedicado via <span className="text-white">wn7corporation@gmail.com</span></p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p>Sem renovação automática em nenhum plano</p>
          </div>
        </div>
      </motion.section>

      {/* CTA Final */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-center space-y-3 pt-4"
      >
        <p className="text-sm text-zinc-400">
          Pronto para começar? Volte à aba <span className="text-amber-500 font-medium">"Planos"</span> e escolha o seu!
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Acesso liberado imediatamente após a aprovação do pagamento</span>
        </div>
      </motion.section>
    </div>
  );
};

export default SobrePlanos;
