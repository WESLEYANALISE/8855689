import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Footprints, Scale, Loader2, Settings, ChevronDown, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_MATERIA_NAMES = [
  "história do direito",
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

type JornadaTipo = 'conceitos' | 'oab';

const JORNADAS = [
  { id: 'conceitos' as JornadaTipo, label: 'Conceitos', sublabel: 'Fundamentos do Direito', icon: GraduationCap },
  { id: 'oab' as JornadaTipo, label: 'OAB', sublabel: '1ª e 2ª Fase', icon: Scale },
];

export const JornadaHomeSection = memo(() => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [jornadaAtiva, setJornadaAtiva] = useState<JornadaTipo>(() => {
    return (localStorage.getItem('jornada_ativa') as JornadaTipo) || 'conceitos';
  });
  const [showSelector, setShowSelector] = useState(false);

  const handleSelectJornada = (tipo: JornadaTipo) => {
    setJornadaAtiva(tipo);
    localStorage.setItem('jornada_ativa', tipo);
    setShowSelector(false);
  };

  const jornadaInfo = JORNADAS.find(j => j.id === jornadaAtiva)!;

  const { data: materias, isLoading } = useQuery({
    queryKey: ["conceitos-materias-trilhante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("ativo", true)
        .order("area_ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: jornadaAtiva === 'conceitos',
  });

  const { data: topicosCount } = useQuery({
    queryKey: ["conceitos-topicos-count-materia"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      const { data: topicos } = await supabase.from("conceitos_topicos").select("materia_id");
      if (!topicos) return counts;
      for (const topico of topicos) {
        counts[topico.materia_id] = (counts[topico.materia_id] || 0) + 1;
      }
      return counts;
    },
    staleTime: 1000 * 60 * 5,
    enabled: jornadaAtiva === 'conceitos',
  });

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  const isMateriaFree = (nome: string) => FREE_MATERIA_NAMES.includes(nome.toLowerCase().trim());
  const isItemLocked = (item: any) => {
    if (isPremium) return false;
    return !isMateriaFree(item.nome);
  };

  if (isLoading && jornadaAtiva === 'conceitos') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3 relative min-h-[60vh] rounded-t-[32px] overflow-hidden">
      <InstantBackground
        src={themisBackground}
        alt="Themis"
        blurCategory="estudos"
        gradientClassName="bg-gradient-to-b from-black/60 via-black/70 to-[#0d0d14]"
        className="rounded-t-[32px]"
      />
      {/* Journey Selector */}
      <div className="px-2 relative z-10">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center gap-3 w-full p-3 rounded-2xl bg-card border border-border/50 hover:border-amber-500/30 transition-all group"
        >
          <div className="p-2 bg-red-500/20 rounded-xl">
            <jornadaInfo.icon className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-playfair text-xl font-bold text-foreground tracking-tight">
              {jornadaInfo.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {jornadaInfo.sublabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-amber-500 transition-colors">
            <Settings className="w-4 h-4" />
            <ChevronDown className={`w-4 h-4 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown selector */}
        <AnimatePresence>
          {showSelector && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute left-2 right-2 top-full mt-1 z-30 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
            >
              <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground font-medium">Escolha sua jornada</p>
              {JORNADAS.map((jornada) => {
                const Icon = jornada.icon;
                const isActive = jornadaAtiva === jornada.id;
                return (
                  <button
                    key={jornada.id}
                    onClick={() => handleSelectJornada(jornada.id)}
                    className={`w-full flex items-center gap-3 p-3 transition-colors ${
                      isActive 
                        ? 'bg-red-500/10 text-foreground' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-red-500/20' : 'bg-muted'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{jornada.label}</p>
                      <p className="text-[11px] text-muted-foreground">{jornada.sublabel}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conceitos Content */}
      {jornadaAtiva === 'conceitos' && (
        <div className="relative z-10">
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground px-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-yellow-400" />
              <span>{totalTopicos} aulas</span>
            </div>
          </div>

          {/* Serpentine */}
          {materias && materias.length > 0 ? (
            <SerpentineNiveis
              items={materias}
              getItemCapa={(item) => item.capa_url}
              getItemTitulo={(item) => item.nome}
              getItemOrdem={(item) => item.area_ordem || 0}
              getItemAulas={(item) => topicosCount?.[item.id] || 0}
              getItemProgresso={() => 0}
              onItemClick={(item) => {
                if (isItemLocked(item)) {
                  navigate('/assinatura');
                  return;
                }
                navigate(`/conceitos/materia/${item.id}`);
              }}
              isItemLocked={isItemLocked}
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma matéria encontrada.</div>
          )}
        </div>
      )}

      {/* OAB Content - redirects to OAB selection */}
      {jornadaAtiva === 'oab' && (
        <div className="px-2 space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Selecione a fase do exame</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/trilhas-oab')}
              className="group bg-card border border-border/50 rounded-2xl p-4 text-left hover:border-red-500/30 transition-all"
            >
              <div className="p-2.5 bg-red-500/20 rounded-xl w-fit mb-3">
                <Target className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="font-playfair font-bold text-foreground text-sm">1ª Fase</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Prova objetiva</p>
            </button>
            <button
              onClick={() => navigate('/trilhas-oab-2fase')}
              className="group bg-card border border-border/50 rounded-2xl p-4 text-left hover:border-red-500/30 transition-all"
            >
              <div className="p-2.5 bg-amber-500/20 rounded-xl w-fit mb-3">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-playfair font-bold text-foreground text-sm">2ª Fase</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Prova prática</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

JornadaHomeSection.displayName = 'JornadaHomeSection';

export default JornadaHomeSection;
