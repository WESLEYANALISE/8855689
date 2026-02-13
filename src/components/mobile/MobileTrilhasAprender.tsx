import { useState, useRef, memo } from "react";
import { CategoriasBottomNav } from "@/components/categorias/CategoriasBottomNav";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Footprints, Loader2, Scale, Crown, Lock, Gavel, ChevronRight, PlayCircle, Target } from "lucide-react";
import { motion } from "framer-motion";
import { UniversalImage } from "@/components/ui/universal-image";
import { LockedTimelineCard } from "@/components/LockedTimelineCard";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { MobileAreaTrilha } from "./MobileAreaTrilha";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.jpg";
import areasThumb from "@/assets/thumbnails/areas-thumb.jpg";
import portuguesThumb from "@/assets/thumbnails/portugues-thumb.jpg";
import oabThumb from "@/assets/thumbnails/oab-thumb.jpg";
import concursosThumb from "@/assets/thumbnails/concursos-thumb.jpg";
import oabPrimeiraThumb from "@/assets/thumbnails/oab-primeira-fase-thumb.jpg";
import oabSegundaThumb from "@/assets/thumbnails/oab-segunda-fase-thumb.jpg";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const FREE_MATERIA_NAMES = [
  "história do direito", 
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

// label curto para exibição, value completo para query no banco
const AREAS_ORDEM: { label: string; value: string }[] = [
  { label: "Constitucional", value: "Direito Constitucional" },
  { label: "Civil", value: "Direito Civil" },
  { label: "Penal", value: "Direito Penal" },
  { label: "Proc. Civil", value: "Direito Processual Civil" },
  { label: "Proc. Penal", value: "Direito Processual Penal" },
  { label: "Administrativo", value: "Direito Administrativo" },
  { label: "Trabalho", value: "Direito Do Trabalho" },
  { label: "Proc. Trabalho", value: "Direito Processual Do Trabalho" },
  { label: "Tributário", value: "Direito Tributario" },
  { label: "Empresarial", value: "Direito Empresarial" },
  { label: "Financeiro", value: "Direito Financeiro" },
  { label: "Previdenciário", value: "Direito Previndenciario" },
  { label: "Ambiental", value: "Direito Ambiental" },
  { label: "Int. Público", value: "Direito Internacional Público" },
  { label: "Int. Privado", value: "Direito Internacional Privado" },
  { label: "Concorrencial", value: "Direito Concorrencial" },
  { label: "Desportivo", value: "Direito Desportivo" },
  { label: "Urbanístico", value: "Direito Urbanistico" },
  { label: "Dir. Humanos", value: "Direitos Humanos" },
  { label: "Lei Penal Esp.", value: "Lei Penal Especial" },
  { label: "Filosofia", value: "Teoria E Filosofia Do Direito" },
  { label: "Políticas Púb.", value: "Politicas Publicas" },
  { label: "Prática Prof.", value: "Pratica Profissional" },
  { label: "Português", value: "Portugues" },
  { label: "Pesq. Científica", value: "Pesquisa Científica" },
  { label: "Form. Compl.", value: "Formação Complementar" },
  { label: "Revisão OAB", value: "Revisão Oab" },
];

export const MobileTrilhasAprender = memo(() => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState("Direito Constitucional");
  const [showOabPhases, setShowOabPhases] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // === PROGRESSO: buscar tópicos em andamento (oab_trilhas_estudo_progresso) ===
  const { data: progressoConceitos } = useQuery({
    queryKey: ["progresso-conceitos-oab", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Buscar progresso de leitura em andamento
      const { data: progressoData, error } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("id, topico_id, progresso_leitura, leitura_completa, updated_at")
        .eq("user_id", user.id)
        .eq("leitura_completa", false)
        .gt("progresso_leitura", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error || !progressoData?.length) return [];

      // Buscar nomes dos tópicos de conceitos_topicos
      const topicoIds = progressoData.map(p => p.topico_id);
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("id, titulo")
        .in("id", topicoIds);

      const topicosMap = new Map((topicos || []).map((t: any) => [t.id, t.titulo]));

      return progressoData.map((item: any) => ({
        id: item.id,
        nome: topicosMap.get(item.topico_id) || "Tópico",
        progresso: item.progresso_leitura || 0,
        tipo: "conceitos" as const,
        topicoId: item.topico_id,
      }));
    },
    staleTime: Infinity,
    enabled: !!user?.id,
  });

  const { data: progressoAulas } = useQuery({
    queryKey: ["progresso-aulas-interativas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("aulas_progresso")
        .select("*, aulas_interativas(titulo)")
        .eq("user_id", user.id)
        .eq("concluida", false)
        .gt("progresso_percentual", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.aulas_interativas?.titulo || "Aula",
        progresso: item.progresso_percentual || 0,
        tipo: "aula" as const,
        aulaId: item.aula_id,
      }));
    },
    staleTime: Infinity,
    enabled: !!user?.id,
  });

  const todosProgresso = [...(progressoConceitos || []), ...(progressoAulas || [])];

  // === CONCEITOS: buscar matérias (para quando categoria ativa) ===
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
    enabled: activeCategory === "conceitos",
  });

  const { data: topicosCount } = useQuery({
    queryKey: ["conceitos-topicos-count-materia"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("materia_id");
      if (!topicos) return counts;
      for (const topico of topicos) {
        counts[topico.materia_id] = (counts[topico.materia_id] || 0) + 1;
      }
      return counts;
    },
    staleTime: 1000 * 60 * 5,
    enabled: activeCategory === "conceitos",
  });

  const { data: totalPaginas } = useQuery({
    queryKey: ["conceitos-total-paginas"],
    queryFn: async () => {
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("slides_json");
      if (!topicos) return 0;
      let total = 0;
      for (const topico of topicos) {
        if (topico.slides_json) {
          try {
            const slides = typeof topico.slides_json === 'string' 
              ? JSON.parse(topico.slides_json) 
              : topico.slides_json;
            if (slides.secoes && Array.isArray(slides.secoes)) {
              for (const secao of slides.secoes) {
                if (secao.slides && Array.isArray(secao.slides)) {
                  total += secao.slides.length;
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }
      return total;
    },
    staleTime: 1000 * 60 * 5,
    enabled: activeCategory === "conceitos",
  });

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  const isMateriaFree = (nome: string) => FREE_MATERIA_NAMES.includes(nome.toLowerCase().trim());
  const freeMaterias = materias?.filter(m => isMateriaFree(m.nome)) || [];
  const premiumMaterias = materias?.filter(m => !isMateriaFree(m.nome)) || [];
  const visibleItems = isPremium ? materias || [] : freeMaterias;
  const lockedItems = isPremium ? [] : premiumMaterias;

  const handleContinuar = (item: any) => {
    if (item.tipo === "conceitos") {
      navigate(`/conceitos/topico/${item.topicoId}`);
    } else if (item.tipo === "aula") {
      navigate(`/aula/${item.aulaId}`);
    }
  };

  return (
    <div className="relative py-4 pb-24 flex flex-col items-center">

      {/* ========== 1. DASHBOARD DE PROGRESSO ========== */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-semibold text-base text-white">Seu Progresso</h2>
          {todosProgresso.length > 0 && (
            <button 
              onClick={() => navigate("/aulas/dashboard")}
              className="text-xs text-amber-400 font-medium flex items-center gap-0.5"
            >
              Ver tudo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {todosProgresso.length === 0 ? (
          <div className="mx-4 bg-gradient-to-br from-white/8 to-white/3 border border-white/10 rounded-2xl p-8 text-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]">
            <div className="bg-amber-500/15 rounded-2xl p-4 w-fit mx-auto mb-3">
              <PlayCircle className="w-10 h-10 text-amber-400/50" />
            </div>
            <p className="text-white/60 text-sm font-medium">Comece uma aula</p>
            <p className="text-white/30 text-xs mt-1">Seu progresso aparecerá aqui</p>
          </div>
        ) : (
          <div 
            className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {todosProgresso.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => handleContinuar(item)}
                className="flex-shrink-0 w-[220px] bg-gradient-to-br from-white/10 to-white/4 border border-white/12 rounded-2xl p-4 text-left hover:border-amber-400/40 transition-all shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="bg-amber-500/25 rounded-xl p-2">
                    <PlayCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    {item.tipo === "conceitos" ? "Conceitos" : "Aula"}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-3">{item.nome}</h3>
                <div className="flex items-center gap-2.5">
                  <Progress 
                    value={item.progresso} 
                    className="h-2 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 [&>div]:rounded-full" 
                  />
                  <span className="text-xs text-amber-400 font-bold min-w-[32px] text-right">{Math.round(item.progresso)}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========== 2. JORNADA DE ESTUDOS ========== */}
      <div className="text-center mb-4">
        <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
          Jornada de Estudos
        </h2>
        <p className="text-amber-200/70 text-xs">Fundamentos do Direito</p>
      </div>

      {/* ========== 3. TRILHAS DE CONCEITOS + TRILHAS OAB ========== */}
      <div className="w-full px-3 mb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Trilhas de Conceitos */}
          <button
            onClick={() => navigate("/conceitos/trilhante")}
            className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.02] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[140px]"
          >
            <img src={conceitosThumb} alt="Trilhas de Conceitos" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
            <div className="relative z-10 p-3 h-full flex flex-col justify-between">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1.5 w-fit">
                <Footprints className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm leading-tight">Trilhas de Conceitos</h3>
                <p className="text-white/50 text-[10px] mt-0.5">Iniciante</p>
              </div>
            </div>
            <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 z-10" />
          </button>

          {/* Trilhas OAB - abre seleção de fase */}
          <button
            onClick={() => setShowOabPhases(!showOabPhases)}
            className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.02] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[140px]"
          >
            <img src={concursosThumb} alt="Trilhas OAB" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
            <div className="relative z-10 p-3 h-full flex flex-col justify-between">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1.5 w-fit">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm leading-tight">Trilhas OAB</h3>
                <p className="text-white/50 text-[10px] mt-0.5">1ª e 2ª Fase</p>
              </div>
            </div>
            <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 z-10" />
          </button>
        </div>

        {/* Seleção de fase OAB */}
        {showOabPhases && (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button
              onClick={() => navigate("/oab/primeira-fase")}
              className="bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/30 rounded-2xl p-4 text-left hover:border-red-400/50 transition-all"
            >
              <div className="bg-red-500/20 rounded-xl p-2 w-fit mb-2">
                <Target className="w-4 h-4 text-red-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">1ª Fase</h4>
              <p className="text-white/40 text-[10px] mt-0.5">Prova objetiva</p>
            </button>
            <button
              onClick={() => navigate("/oab/segunda-fase")}
              className="bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/30 rounded-2xl p-4 text-left hover:border-red-400/50 transition-all"
            >
              <div className="bg-red-500/20 rounded-xl p-2 w-fit mb-2">
                <Scale className="w-4 h-4 text-red-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">2ª Fase</h4>
              <p className="text-white/40 text-[10px] mt-0.5">Prova prática</p>
            </button>
          </div>
        )}
      </div>

      {/* ========== 4. ÁREAS DO DIREITO - ADMIN ONLY ========== */}
      {isAdmin && (
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 px-4 mb-1">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">Áreas do Direito</h3>
          </div>
          <p className="text-white/40 text-[10px] px-4 mb-3">Explore as matérias</p>
          <div 
            className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {AREAS_ORDEM.map((area) => {
              const isActive = activeArea === area.value && activeCategory === "areas";
              return (
                <button
                  key={area.value}
                  onClick={() => {
                    setActiveArea(area.value);
                    setActiveCategory("areas");
                  }}
                  className={`flex-shrink-0 w-[150px] relative overflow-hidden rounded-2xl text-left transition-all shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[120px] ${
                    isActive ? 'ring-2 ring-amber-400/60 scale-[1.03]' : 'hover:scale-[1.02]'
                  }`}
                >
                  <img src={areasThumb} alt={area.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                  <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                    <h4 className="font-semibold text-white text-xs leading-tight">{area.label}</h4>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== 5. PORTUGUÊS JURÍDICO - ADMIN ONLY ========== */}
      {isAdmin && (
        <div className="w-full px-3 mb-6">
          <button
            onClick={() => setActiveCategory(activeCategory === "portugues" ? null : "portugues")}
            className="w-full group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.01] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[110px]"
          >
            <img src={portuguesThumb} alt="Português Jurídico" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
            <div className="relative z-10 p-4 h-full flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">Português Jurídico</h3>
                <p className="text-white/50 text-[10px] mt-0.5">Gramática • Redação</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </div>
          </button>
        </div>
      )}

      {isAdmin && activeCategory === "portugues" && (
        <div className="text-center py-10 text-white/50 text-sm mb-4">
          Em breve: Português para Concurso
        </div>
      )}

      {/* ========== 6. SEÇÃO OAB - ADMIN ONLY ========== */}
      {isAdmin && (
        <div className="w-full px-3 mb-4">
          <div className="flex items-center gap-2 px-1 mb-1">
            <Gavel className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">OAB</h3>
          </div>
          <p className="text-white/40 text-[10px] px-1 mb-2.5">Preparação completa</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate("/oab/trilhas-aprovacao")}
              className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.02] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[140px]"
            >
              <img src={oabPrimeiraThumb} alt="OAB 1ª Fase" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
              <div className="relative z-10 p-3 h-full flex flex-col justify-between">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-1.5 w-fit">
                  <Gavel className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">1ª Fase</h3>
                  <p className="text-white/50 text-[10px] mt-0.5">Trilhas de aprovação</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 z-10" />
            </button>
            <button
              onClick={() => navigate("/oab/segunda-fase")}
              className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.02] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] h-[140px]"
            >
              <img src={oabSegundaThumb} alt="OAB 2ª Fase" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
              <div className="relative z-10 p-3 h-full flex flex-col justify-between">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-1.5 w-fit">
                  <Scale className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">2ª Fase</h3>
                  <p className="text-white/50 text-[10px] mt-0.5">Peça prática</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 z-10" />
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da área selecionada */}
      {activeCategory === "areas" && (
        <div className="w-full">
          <MobileAreaTrilha area={activeArea} />
        </div>
      )}

      {/* Conteúdo conceitos (caso necessário) */}
      {activeCategory === "conceitos" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-red-400" />
                  <span>{totalMaterias} matérias</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{totalTopicos} tópicos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  <span>{totalPaginas || 0} páginas</span>
                </div>
              </div>

              {materias && materias.length > 0 && (
                <div className="w-full px-4">
                  <div className="max-w-lg mx-auto relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                      <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                      <motion.div
                        className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                        animate={{ y: ["0%", "300%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      {visibleItems.map((materia, index) => {
                        const isLeft = index % 2 === 0;
                        const topicos = topicosCount?.[materia.id] || 0;
                        const temCapa = !!materia.capa_url;
                        const progressoPercentual = 0;
                        
                        return (
                          <motion.div
                            key={materia.id}
                            initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className={`relative flex items-center ${
                              isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                            }`}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 z-10">
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.15, 1],
                                  boxShadow: [
                                    "0 0 0 0 rgba(239, 68, 68, 0.4)",
                                    "0 0 0 10px rgba(239, 68, 68, 0)",
                                    "0 0 0 0 rgba(239, 68, 68, 0)"
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                              >
                                <Footprints className="w-5 h-5 text-white" />
                              </motion.div>
                            </div>
                            
                            <div className="w-full">
                              <motion.div 
                                whileTap={{ scale: 0.98 }}
                                className="rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col"
                              >
                                <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                                  {temCapa ? (
                                    <>
                                      <UniversalImage
                                        src={materia.capa_url!}
                                        alt={materia.nome}
                                        priority={index < 4}
                                        blurCategory="course"
                                        containerClassName="w-full h-full"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                                  )}
                                  <div className="absolute bottom-1 left-2">
                                    <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">
                                      Tema {materia.area_ordem}
                                    </p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => navigate(`/conceitos/materia/${materia.id}`)}
                                  className="flex-1 p-2.5 text-left flex flex-col"
                                >
                                  <div className="flex-1">
                                    <h3 className="font-medium text-xs leading-snug text-white line-clamp-2">
                                      {materia.nome}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-1.5">
                                      <BookOpen className="w-3 h-3 text-yellow-400" />
                                      <span className="text-[10px] text-yellow-400 font-medium">{topicos} tópicos</span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[9px] text-gray-500">Progresso</span>
                                      <span className="text-[9px] text-green-400 font-medium">{progressoPercentual}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                                        style={{ width: `${progressoPercentual}%` }}
                                      />
                                    </div>
                                  </div>
                                </button>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                       
                      {lockedItems.map((materia, index) => {
                        const realIndex = visibleItems.length + index;
                        const isLeft = realIndex % 2 === 0;
                        const topicos = topicosCount?.[materia.id] || 0;
                        
                        return (
                          <LockedTimelineCard
                            key={materia.id}
                            title={materia.nome}
                            subtitle={`Tema ${materia.area_ordem}`}
                            imageUrl={materia.capa_url || undefined}
                            isLeft={isLeft}
                            index={realIndex}
                            topicosCount={topicos}
                            materiaId={materia.id}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Menu de rodapé fixo - apenas admin */}
      {isAdmin && activeCategory && <CategoriasBottomNav activeTab="aulas" />}
    </div>
  );
});

MobileTrilhasAprender.displayName = 'MobileTrilhasAprender';
